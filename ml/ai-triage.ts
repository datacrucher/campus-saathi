import { createHash } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { DEPARTMENTS, departmentById } from '../frontend/src/data/directory';
import { triage as ruleTriage, type TriageMatch, type TriageResult } from './triage';



const MODEL = process.env.TRIAGE_MODEL ?? 'claude-opus-5';
const DEPT_IDS = DEPARTMENTS.map((d) => d.id) as [string, ...string[]];

const TriageSchema = z.object({
  department: z.enum([...DEPT_IDS, 'none']),
  category: z.string(),
  urgency: z.enum(['High', 'Medium', 'Low']),
  reason: z.string(),
  crisis: z.boolean(),
  safety: z.boolean(),
  key_phrases: z.array(z.string()),
  self_help_steps: z.array(z.string()),
  alternative_departments: z.array(z.enum(DEPT_IDS)),
});

const directory = DEPARTMENTS.map((d) =>
  `- id "${d.id}": ${d.name} (${d.team}). ${d.description} Helps with: ${d.helpsWith.join('; ')}. ` +
  `Location: ${d.location}. Hours: ${d.hours}. Phone: ${d.phone}. Email: ${d.email}.`,
).join('\n');

const SYSTEM = `You triage student support requests for Campus Saathi, the student support portal at Northbridge University (UK).

Read the student's description carefully — they may use informal language, abbreviations (e.g. "AC", "hostel", "wifi"), spelling mistakes, or describe several problems at once. Work out what is actually wrong and which service is best placed to help.

Services (use the id exactly):
${directory}

Return:
- department: the single best service id, or "none" only if the text isn't a support request at all.
- category: a short label for the problem, e.g. "Air conditioning repair", "Exam stress", "Visa extension".
- urgency: High (safety risk, crisis, no heating/water/power, money for food, imminent deadline within ~48 hours), Medium (affecting studies or daily life), Low (routine questions).
- reason: one sentence addressed to the student, starting "Your request appears related to", describing their specific problem in plain words.
- crisis: true if there is any sign of suicidal thoughts or self-harm. Then department must be "counselling" and urgency High.
- safety: true if the student may be in danger or a crime occurred (assault, being followed, theft). Then prefer "security" unless crisis is true.
- key_phrases: 1–4 short phrases quoted from the student's text that drove your decision.
- self_help_steps: 3–5 concrete things the student can do THEMSELVES right now to fix or ease the problem without raising a request. Tailor them to the exact situation described. Each step is one short sentence in UK English, second person. You may reference the phone numbers, locations and hours listed above, and general actions (checking settings, taking photos, restarting a device, talking to a tutor). Do not invent website URLs, apps or phone numbers that aren't listed above. Do not include "send a request" as a step. If crisis or safety is true, the first steps must be immediate safety actions: call 999 if in danger, Samaritans on 116 123 (24 hours) for crisis, Campus Security on 01632 960 444.
- alternative_departments: up to 2 other service ids that might also be relevant, most relevant first; empty if none.`;

let client: Anthropic | null = null;
let disabledUntil = 0;

function getClient() {
  if (!client) client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
  return client;
}

export const aiConfigured = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) && process.env.AI_TRIAGE !== 'off';

const cache = new Map<string, { result: TriageResult; at: number }>();
const CACHE_MS = 60 * 60 * 1000;
const keyFor = (text: string) => createHash('sha256').update(text.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex');

export function cachedTriage(text: string): TriageResult | undefined {
  const hit = cache.get(keyFor(text));
  return hit && Date.now() - hit.at < CACHE_MS ? hit.result : undefined;
}

export type AnalysedResult = TriageResult & { source: 'ai' | 'rules' };

export async function analyse(text: string): Promise<AnalysedResult> {
  const cached = cachedTriage(text);
  if (cached) return { ...cached, source: 'ai' };
  const rules = ruleTriage(text);
  if (rules.best?.procedureId) return { ...rules, source: 'rules' };
  if (!aiConfigured() || Date.now() < disabledUntil) return { ...rules, source: 'rules' };

  try {
    const response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      output_config: { effort: 'low', format: zodOutputFormat(TriageSchema) },
      messages: [{ role: 'user', content: `Student’s description:\n\n${text}` }],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return { ...ruleTriage(text), source: 'rules' };
    }
    const result = toResult(response.parsed_output, text);
    cache.set(keyFor(text), { result, at: Date.now() });
    return { ...result, source: 'ai' };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      console.error('AI triage: credentials rejected — using keyword rules for 10 minutes.');
      disabledUntil = Date.now() + 10 * 60 * 1000;
    } else if (error instanceof Anthropic.RateLimitError) {
      console.warn('AI triage: rate limited — using keyword rules for this request.');
    } else if (error instanceof Anthropic.APIError) {
      console.error(`AI triage: API error ${error.status} — ${error.message}`);
    } else {
      console.error('AI triage failed:', error);
    }
    return { ...ruleTriage(text), source: 'rules' };
  }
}

function toResult(o: z.infer<typeof TriageSchema>, text: string): TriageResult {
  const rules = ruleTriage(text);
  const crisis = o.crisis || !!rules.best?.crisis;
  const safety = !crisis && (o.safety || !!rules.best?.safety);
  const deptId = crisis ? 'counselling' : o.department === 'none' ? null : o.department;
  if (!deptId || !departmentById(deptId)) return rules;

  const best: TriageMatch = {
    dept: deptId,
    category: o.category.slice(0, 60) || 'General enquiry',
    reason: o.reason.slice(0, 300),
    urgency: crisis || safety ? 'High' : o.urgency,
    confidence: 0.9,
    signals: o.key_phrases.slice(0, 4).map((s) => s.slice(0, 40)),
    steps: crisis && rules.best?.crisis ? rules.best.steps : o.self_help_steps.slice(0, 5).map((s) => s.slice(0, 220)),
    crisis,
    safety,
  };
  const alternatives: TriageMatch[] = [...new Set(o.alternative_departments)]
    .filter((id) => id !== deptId && departmentById(id))
    .slice(0, 2)
    .map((id) => ({
      dept: id, category: 'General enquiry', reason: `This could also be something ${departmentById(id)!.name} can help with.`,
      urgency: best.urgency, confidence: 0.6, signals: [], steps: [], crisis: false, safety: false,
    }));
  return { best, alternatives };
}
