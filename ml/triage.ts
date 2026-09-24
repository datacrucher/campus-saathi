import type { Priority } from '../frontend/src/data/types';
import { PROCEDURES } from '../frontend/src/data/procedures';

/**
 * Lightweight rule-based triage used by the prototype. Each rule maps a set of
 * phrases to a department, category and a plain-language reason. The best
 * scoring rule wins; the next best departments are offered as alternatives.
 */

interface Rule {
  dept: string;
  category: string;
  reason: string;
  urgency: Priority;
  terms: string[];
  /** Things the student can try themselves, without raising a request. */
  steps: string[];
  crisis?: boolean;
  safety?: boolean;
}

const RULES: Rule[] = [
  { dept: 'counselling', category: 'Urgent wellbeing concern', steps: ['If you feel you might act on these thoughts, call 999 or go to your nearest A&E now.', 'Call Samaritans free on 116 123, any time, day or night.', 'Text SHOUT to 85258 if you’d rather not talk on the phone.', 'Stay with someone you trust, or tell them where you are and how you’re feeling.'], reason: 'thoughts of harming yourself', urgency: 'High', crisis: true,
    terms: ['suicid', 'kill myself', 'killing myself', 'end my life', 'ending my life', 'end it all', 'take my own life', 'taking my own life',
      'self-harm', 'self harm', 'self harming', 'hurt myself', 'hurting myself', 'harm myself', 'cut myself', 'cutting myself',
      'don’t want to be here', "don't want to be here", 'don’t want to live', "don't want to live", 'want to die', 'wish i was dead', 'wish i were dead',
      'no reason to live', 'not worth living', 'better off without me', 'better off dead'] },
  { dept: 'security', category: 'Personal safety', steps: ['If you’re in danger now, call 999, or Campus Security on 01632 960 444.', 'Go to a busy, well-lit place or the Security Lodge at the Main Gate.', 'Use the free Safe Walk service after dark — call Security and an officer will walk with you.', 'Write down what happened, when and where, while it’s fresh.'], reason: 'your personal safety', urgency: 'High', safety: true,
    terms: ['assault', 'attacked', 'followed me', 'following me', 'unsafe', 'threaten', 'stalk', 'harass', 'spiking', 'spiked', 'stolen', 'theft', 'broke into', 'lost property'] },

  { dept: 'counselling', category: 'Exam stress', steps: ['Break revision into short 25–30 minute blocks with 5-minute breaks.', 'Plan your week on paper so you can see time for every exam.', 'Keep a regular sleep routine and limit caffeine after mid-afternoon.', 'Join a free drop-in Managing Exam Stress workshop — no booking needed.', 'Use past papers on Moodle to practise under timed conditions.'], reason: 'exam-related stress', urgency: 'Medium',
    terms: ['exam', 'revision', 'revise', 'stress', 'overwhelm', 'pressure', 'can’t cope', "can't cope", 'cope', 'panic'] },
  { dept: 'counselling', category: 'Anxiety and low mood', steps: ['Try the free Togetherall online support community — sign in with your university account.', 'Work through a guided self-help course on the Wellbeing page.', 'Get outside, move and eat regularly — small routines help more than you’d expect.', 'Talk to a friend, flatmate or your personal tutor about how you’re feeling.', 'Join a society or peer support group listed on the Student Hub.'], reason: 'how you’ve been feeling', urgency: 'Medium',
    terms: ['anxious', 'anxiety', 'depress', 'low mood', 'feeling low', 'lonely', 'homesick', 'sad', 'not sleeping', 'can’t sleep', "can't sleep", 'crying', 'mental health', 'counsell', 'therapy', 'talk to someone'] },
  { dept: 'counselling', category: 'Bereavement', steps: ['Email your personal tutor — they can tell your lecturers so you aren’t chased about deadlines.', 'Apply for a self-certified 7-day extension on Moodle for any work due soon.', 'Read the bereavement support guide on the Wellbeing page.', 'Contact Cruse Bereavement Support free on 0808 808 1677.'], reason: 'a bereavement', urgency: 'High',
    terms: ['passed away', 'died', 'death', 'funeral', 'bereave', 'grief'] },

  { dept: 'advising', category: 'Extensions', steps: ['Check the deadline rules in your module handbook on Moodle.', 'For up to 7 days, submit a self-certified extension form on the module’s Moodle page — no evidence needed.', 'Email your module leader straight away to let them know.', 'Keep working on what you can so you’re ready for the new date.'], reason: 'a coursework deadline or extension', urgency: 'Medium',
    terms: ['extension', 'deadline', 'coursework', 'assignment', 'late submission', 'submit'] },
  { dept: 'advising', category: 'Extenuating circumstances', steps: ['Read the Extenuating Circumstances policy on the Student Hub.', 'Collect evidence, such as a letter from a doctor, counsellor or other professional.', 'Complete the online EC form yourself from the Student Hub page.', 'Submit it before the panel deadline for your assessment period.'], reason: 'circumstances affecting your assessments', urgency: 'Medium',
    terms: ['extenuating', 'mitigating', 'missed an exam', 'missed my exam', 'resit', 'failed', 'progression', 'repeat the year', 'interrupt', 'withdraw from', 'change module', 'change my course', 'switch course', 'transfer course'] },

  { dept: 'registry', category: 'Letters and records', steps: ['Download council tax and proof-of-study letters instantly from the Documents section of the portal.', 'Update your address or phone number yourself in the Student Record section.', 'Order an official transcript online through the Registry page.', 'Replacement ID cards can be ordered and paid for in the online store.'], reason: 'an official letter or your student record', urgency: 'Low',
    terms: ['council tax', 'transcript', 'certificate', 'enrolment', 'enrollment', 'enrol', 'student record', 'id card', 'student card', 'proof of study', 'status letter', 'change my name', 'graduation'] },

  { dept: 'finance', category: 'Fees and payments', steps: ['Check your balance, invoices and payments in the Payments section of the portal.', 'Set up an instalment plan yourself in the portal under Payment Options.', 'If you’re waiting for a student loan, check the status in your Student Finance account.', 'International transfers can take up to 5 working days — keep your receipt and reference.'], reason: 'tuition fees or payments', urgency: 'Medium',
    terms: ['tuition', 'fee', 'invoice', 'instalment', 'installment', 'payment plan', 'refund', 'sponsor', 'student loan', 'loan hasn', 'loan payment', 'sfe', 'student finance'] },

  { dept: 'aid', category: 'Financial hardship', steps: ['Use the budgeting calculator on the Money Advice page to see your shortfall.', 'Pick up free food from the Student Union pantry (Mon–Fri, 12–2 pm) — no questions asked.', 'Apply online for the Hardship Fund using the form on the Money Advice page.', 'Check whether you’re eligible for the Northbridge Bursary using the online checker.'], reason: 'financial difficulty', urgency: 'Medium',
    terms: ['hardship', 'bursary', 'scholarship', 'can’t afford', "can't afford", 'afford food', 'no money', 'out of money', 'money', 'rent due', 'struggling financially', 'food bank', 'grant'] },

  { dept: 'accommodation', category: 'Halls and housing', steps: ['If there’s a leak, gas smell or no power, call Castle Court Reception (24 hours) on 01632 960 260.', 'Report routine repairs yourself in the online Maintenance Portal — most are fixed within 3 days.', 'For mould, wipe it with a mould spray, open windows daily and keep furniture away from walls.', 'For noise, try talking to your neighbours first — most problems are sorted that way.'], reason: 'your accommodation', urgency: 'Medium',
    terms: ['hall', 'flat', 'room', 'mould', 'mold', 'damp', 'heating', 'heater', 'boiler', 'leak', 'repair', 'maintenance', 'flatmate', 'roommate', 'noise', 'landlord', 'deposit', 'accommodation', 'housing', 'castle court', 'riverside',
      'hostel', 'dorm', 'residence', 'warden', 'ac', 'a/c', 'air con', 'aircon', 'air-con', 'air conditioner', 'air conditioning', 'cooling', 'fan', 'light', 'bulb', 'electricity', 'power cut', 'socket', 'plug', 'water', 'hot water', 'shower', 'toilet', 'sink', 'tap', 'plumbing', 'drain', 'blocked', 'geyser', 'window', 'door', 'lock', 'room key', 'bed', 'mattress', 'furniture', 'wardrobe', 'fridge', 'kitchen', 'laundry', 'washing machine', 'cleaning', 'pest', 'cockroach', 'rat', 'mice', 'bed bugs', 'insects'] },

  { dept: 'it', category: 'IT and accounts', steps: ['Reset your password yourself at account.northbridge.ac.uk.', 'For Wi-Fi, remove eduroam from your device and reinstall it using the geteduroam app.', 'If Moodle or Outlook won’t load, clear your browser cache or try a private window.', 'Download course software free from the Software Hub with your university login.'], reason: 'access to university IT systems', urgency: 'Medium',
    terms: ['password', 'log in', 'login', 'sign in', 'locked out', 'account locked', 'mfa', 'authenticator', 'wifi', 'wi-fi', 'eduroam', 'moodle', 'outlook', 'email not', 'teams', 'software', 'licence', 'license', 'laptop', 'keyboard', 'charger', 'screen', 'printing', 'printer', 'vpn'] },

  { dept: 'library', category: 'Library', steps: ['Check your loans, renew books and see fines in My Library Account.', 'If you returned a book that’s still showing, use the “Report a return” link in your account.', 'Sign in through Library Search to get full access to e-books and journals off campus.', 'Book study rooms online on the Library website.'], reason: 'library services', urgency: 'Low',
    terms: ['library', 'book', 'overdue', 'library fine', 'borrow', 'journal', 'article', 'inter-library', 'study room', 'referencing', 'e-resource'] },

  { dept: 'disability', category: 'Adjustments and access', steps: ['Apply for Disabled Students’ Allowance directly through Student Finance.', 'Download free assistive software, such as Read&Write, from the Software Hub.', 'Use the Accessibility Map to find step-free routes and quiet study spaces.', 'Gather any evidence you have, such as a diagnostic report — you’ll need it for a support plan.'], reason: 'support for a disability or learning difference', urgency: 'Medium',
    terms: ['dyslexi', 'dyspraxi', 'adhd', 'autis', 'disab', 'wheelchair', 'extra time', 'reasonable adjustment', 'support plan', 'dsa', 'accessib', 'chronic', 'condition', 'hearing', 'visual impair'] },

  { dept: 'international', category: 'Visa and immigration', steps: ['Check the expiry date on your eVisa and your current course end date.', 'Read the visa guidance on the International Student Office page.', 'Download attendance and enrolment letters yourself from the Documents section of the portal.', 'Don’t travel or make any Home Office application until you’ve checked the guidance.'], reason: 'your visa or immigration status', urgency: 'Medium',
    terms: ['visa', 'cas', 'brp', 'evisa', 'immigration', 'home office', 'international student', 'attendance warning', 'embassy', 'passport', 'sponsor licence', 'ihs'] },

  { dept: 'careers', category: 'Careers and placements', steps: ['Browse jobs and placements on the Careers portal.', 'Build or improve your CV with the online CV builder.', 'Practise interviews with the free Shortlist.Me video tool.', 'Come to a daily drop-in (12–2 pm, Student Hub) for quick questions.'], reason: 'careers or placements', urgency: 'Low',
    terms: ['cv', 'placement', 'internship', 'job', 'career', 'interview', 'graduate scheme', 'cover letter', 'employ', 'part-time work'] },
];

const URGENT_WORDS = ['urgent', 'asap', 'emergency', 'today', 'tonight', 'immediately', 'evict', 'right now', 'getting worse'];

const patternCache = new Map<string, RegExp>();
/** Short terms must match a whole word or its plural ("fee" shouldn't match "feeling"); longer ones match as a word prefix. */
function termPattern(term: string) {
  let re = patternCache.get(term);
  if (!re) {
    const t = term.replace(/['’]/g, '’').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(term.length <= 4 ? `\\b${t}s?\\b` : `\\b${t}`);
    patternCache.set(term, re);
  }
  return re;
}

export interface TriageMatch {
  dept: string;
  category: string;
  reason: string;
  urgency: Priority;
  confidence: number;
  signals: string[];
  steps: string[];
  /** Set when the request matches a known in-person procedure (see data/procedures.ts). */
  procedureId?: string;
  crisis: boolean;
  safety: boolean;
}

export interface TriageResult {
  best: TriageMatch | null;
  alternatives: TriageMatch[];
}

export function triage(input: string): TriageResult {
  const text = ` ${input.toLowerCase().replace(/['’]/g, '’').replace(/\s+/g, ' ')} `;
  const scored = RULES.map((rule) => {
    const terms = [...new Set(rule.terms.map((t) => t.replace(/'/g, '’')))];
    const hits = terms.filter((t) => termPattern(t).test(text));
    const weight = hits.length * (rule.crisis ? 10 : rule.safety ? 3 : 1);
    return { rule, hits, weight };
  }).filter((s) => s.weight > 0);

  scored.sort((a, b) => b.weight - a.weight);

  // A known office procedure (e.g. NOC) wins unless the text also signals a crisis or safety risk.
  const urgentRisk = scored.some((x) => x.rule.crisis || x.rule.safety);
  const proc = urgentRisk ? undefined : PROCEDURES.find((p) => p.terms.some((t) => termPattern(t).test(text)));
  if (proc) {
    return {
      best: {
        dept: proc.department, category: proc.category, reason: proc.reason, urgency: 'Medium', confidence: 0.95,
        signals: proc.terms.filter((t) => termPattern(t).test(text)), steps: [], procedureId: proc.id, crisis: false, safety: false,
      },
      alternatives: [],
    };
  }
  if (scored.length === 0) return { best: null, alternatives: [] };

  const urgentBoost = URGENT_WORDS.some((w) => termPattern(w).test(text));
  const toMatch = (s: (typeof scored)[number]): TriageMatch => {
    let urgency = s.rule.urgency;
    if (urgentBoost && urgency !== 'High') urgency = urgency === 'Low' ? 'Medium' : 'High';
    return {
      dept: s.rule.dept,
      category: s.rule.category,
      reason: `Your request appears related to ${s.rule.reason}.`,
      urgency,
      confidence: Math.min(0.96, 0.58 + s.hits.length * 0.12),
      // Show the student's own word ("dyslexia"), not the stem it matched ("dyslexi").
      signals: s.hits.map((h) => text.match(new RegExp(`${termPattern(h).source}[\\w’-]*`))?.[0] ?? h),
      steps: s.rule.steps,
      crisis: !!s.rule.crisis,
      safety: !!s.rule.safety,
    };
  };

  const best = toMatch(scored[0]);
  const seen = new Set([best.dept]);
  const alternatives: TriageMatch[] = [];
  for (const s of scored.slice(1)) {
    if (seen.has(s.rule.dept)) continue;
    seen.add(s.rule.dept);
    alternatives.push(toMatch(s));
    if (alternatives.length === 2) break;
  }
  return { best, alternatives };
}

/** Builds a short case title from the student's own words. */
export function titleFrom(text: string, category: string) {
  const first = text.trim().split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, '');
  if (first.length >= 12 && first.length <= 70) return first.charAt(0).toUpperCase() + first.slice(1);
  if (first.length > 70) return first.slice(0, 67).replace(/\s+\S*$/, '') + '…';
  return `${category} request`;
}
