import type { ActivityEntry, Case, Priority, Status } from './types';
import { DEMO_STAFF_ID, DEMO_STUDENT_ID, DEPARTMENTS, STUDENTS, departmentById, staffById, staffForDepartment, studentById } from './directory';

interface Template {
  title: string;
  category: string;
  desc: string;
  priority: Priority;
  reason: string;
  ask: string;
  fix: string;
}

const T = (title: string, category: string, priority: Priority, reason: string, desc: string, ask: string, fix: string): Template =>
  ({ title, category, priority, reason, desc, ask, fix });

const TEMPLATES: Record<string, Template[]> = {
  counselling: [
    T('Struggling with anxiety before exams', 'Exam stress', 'Medium', 'exam-related stress',
      'Exams start in two weeks and I’m panicking every time I sit down to revise. I haven’t been sleeping much and I’m not sure how to get on top of it.',
      'Could you let us know a few times this week that you’d be free for an initial 30-minute appointment?',
      'Initial appointment held. Student booked onto the four-session exam anxiety course and given self-help resources.'),
    T('Feeling low since moving to university', 'Low mood', 'Medium', 'low mood and adjusting to university',
      'I’ve felt really low for the last few weeks. I don’t know many people here and I’ve stopped going to some lectures.',
      'Would you prefer to meet in person at the Hollins Building or over Teams?',
      'Student attended two sessions and was referred to the peer mentoring scheme. Agreed to get back in touch if things change.'),
    T('Bereavement – need someone to talk to', 'Bereavement', 'High', 'a recent bereavement',
      'My grandmother passed away last week and I’m finding it hard to concentrate on anything. I have a deadline coming up.',
      'We’re very sorry for your loss. Are you able to attend an appointment tomorrow morning?',
      'Counselling sessions arranged. Student also supported to submit extenuating circumstances with the Academic Advice Team.'),
    T('Panic attacks in lectures', 'Anxiety', 'Medium', 'anxiety affecting attendance',
      'I’ve had two panic attacks in lectures this month and now I’m avoiding going in. I don’t want to fall behind.',
      'Could you complete the short pre-appointment questionnaire we’ve emailed you?',
      'Appointment held and coping plan agreed. Student registered for the Managing Anxiety workshop.'),
    T('Worried about a flatmate', 'Concern for another student', 'High', 'concern for another student’s wellbeing',
      'My flatmate hasn’t left their room in days and isn’t answering messages. I’m worried about them and don’t know what to do.',
      'Thank you for letting us know. Can you confirm which hall and flat your flatmate lives in?',
      'Residential Life carried out a welfare check. Student concerned has been contacted directly by the wellbeing team.'),
  ],
  advising: [
    T('Extension request for coursework', 'Extensions', 'Medium', 'a coursework deadline',
      'I’ve been ill for the past week and won’t be able to submit my CS2040 coursework by Friday. Can I get an extension?',
      'Please upload a GP note or self-certification form so we can process the extension.',
      'Seven-day extension approved and module leader notified.'),
    T('Extenuating circumstances claim', 'Extenuating circumstances', 'Medium', 'circumstances affecting assessment',
      'Family problems at home meant I missed two exams in January. I want to submit extenuating circumstances but I’m not sure what evidence I need.',
      'Could you send any supporting evidence you have? A letter from a professional is ideal but not required.',
      'Claim submitted to the EC panel and accepted. Student will sit both exams as first attempts in the August period.'),
    T('Want to change modules', 'Module changes', 'Low', 'changing modules',
      'I picked an optional module that doesn’t suit me and would like to swap to a different one this semester.',
      'Which module would you like to move to? Please check it doesn’t clash with your timetable.',
      'Module change approved by programme lead and updated on the student record.'),
    T('Thinking about interrupting my studies', 'Interruption of studies', 'Medium', 'taking a break from studies',
      'I’m thinking about taking the rest of the year out for health reasons. What happens to my funding and place if I do?',
      'Can we book a meeting to go through the options and what it means for your finance?',
      'Options discussed. Student decided to continue with a reduced assessment load for this semester.'),
    T('Failed a module – what are my options?', 'Progression', 'Medium', 'progression after a failed module',
      'I just got my results and I failed one module. I don’t know if I can still progress to next year.',
      'Could you confirm the module code and the mark you received?',
      'Student is eligible for a resit in August and can progress if passed. Resit guidance sent.'),
  ],
  registry: [
    T('Council tax exemption letter', 'Letters', 'Low', 'an official student status letter',
      'My council has asked for proof that I’m a full-time student. Can I get a council tax exemption certificate?',
      'Please confirm the address the certificate should show.',
      'Council tax exemption certificate issued and emailed to student.'),
    T('Name wrong on student record', 'Personal details', 'Low', 'a correction to your student record',
      'My surname is spelled wrong on my student record and on my ID card.',
      'Please upload a copy of your passport or driving licence so we can update your record.',
      'Record corrected and replacement ID card ready for collection.'),
    T('Enrolment still showing as incomplete', 'Enrolment', 'Medium', 'an enrolment problem',
      'I finished online enrolment last week but my status still says incomplete and I can’t access Moodle.',
      'Could you send a screenshot of the enrolment page you’re seeing?',
      'Missing fee declaration completed on the student’s behalf. Enrolment now shows as complete.'),
    T('Need an official transcript', 'Transcripts', 'Low', 'an official transcript',
      'I need an official transcript for a summer internship application by the end of the month.',
      'Should the transcript be sent to you or directly to the employer?',
      'Official transcript issued as a secure digital document.'),
    T('Lost student ID card', 'ID cards', 'Low', 'a replacement ID card',
      'I’ve lost my student ID card and can’t get into the library.',
      'Please confirm you’ve paid the £10 replacement fee through the online store.',
      'Replacement card printed and collected from the Student Hub.'),
  ],
  finance: [
    T('Student loan payment not received', 'Student loan delays', 'High', 'a delayed student loan payment',
      'My maintenance loan hasn’t arrived yet and I have rent due next week. My SFE account says the university hasn’t confirmed my attendance.',
      'We’ve confirmed your attendance today. Can you let us know once SFE updates your account?',
      'Attendance confirmed to Student Finance England. Payment released within three working days.'),
    T('Question about tuition fee invoice', 'Invoices', 'Low', 'a tuition fee invoice',
      'My invoice shows a higher amount than I expected for this year. Can someone explain the charges?',
      'Could you tell us which invoice number you’re referring to?',
      'Invoice reviewed. The difference was a lab fee for a placement module, explained to the student.'),
    T('Set up a payment plan', 'Payment plans', 'Medium', 'setting up a payment plan',
      'I can’t pay my remaining fees in one go. Is it possible to split them into monthly payments?',
      'Please confirm the date you’d like the first instalment to be taken.',
      'Five-month instalment plan set up and confirmation sent.'),
    T('Refund after withdrawing from a module', 'Refunds', 'Low', 'a fee refund',
      'I dropped a module in week two. Am I due a partial refund?',
      'Please send your bank details through the secure refund form.',
      'Pro-rata refund of £415 processed to student’s bank account.'),
    T('Sponsor has not been invoiced', 'Sponsor billing', 'Medium', 'sponsor billing',
      'My government sponsor says they haven’t received an invoice from the university and my account shows as overdue.',
      'Please send us the sponsor letter so we can raise the invoice.',
      'Sponsor invoice raised and overdue flag removed from the student account.'),
  ],
  aid: [
    T('Applying to the Hardship Fund', 'Hardship Fund', 'High', 'financial hardship',
      'My part-time hours were cut and I can’t cover rent and food this month. I’d like to apply for hardship funding.',
      'Please upload your last three months of bank statements with your application.',
      'Hardship award of £600 approved and paid. Student referred for budgeting support.'),
    T('Bursary payment date', 'Bursaries', 'Low', 'bursary payments',
      'When will the Northbridge Bursary be paid this term? I haven’t seen anything yet.',
      'Can you confirm your household income assessment has been shared with the university?',
      'Bursary scheduled for payment on the next run. Dates confirmed with student.'),
    T('Eligibility for a scholarship', 'Scholarships', 'Low', 'scholarship eligibility',
      'I saw the Vice-Chancellor’s Excellence Scholarship. Am I eligible as a second-year student?',
      'Could you send us your current academic transcript?',
      'Eligibility confirmed. Student submitted an application before the deadline.'),
    T('Can’t afford food this week', 'Emergency support', 'High', 'urgent financial difficulty',
      'I’ve run out of money until my loan comes in and I can’t afford food this week.',
      'Please come to the Student Hub first floor today — we can issue a food voucher straight away.',
      'Emergency food voucher and a short-term loan of £150 issued the same day.'),
  ],
  accommodation: [
    T('Mould in bedroom', 'Maintenance', 'Medium', 'a maintenance problem in your room',
      'There’s black mould growing on the wall behind my bed in Castle Court and it’s getting worse.',
      'Can you confirm a time we can access your room for an inspection?',
      'Inspection completed, wall treated and dehumidifier installed. Follow-up check booked in four weeks.'),
    T('Heating not working in flat', 'Maintenance', 'High', 'no heating in your flat',
      'The heating in our whole flat hasn’t worked for three days and it’s really cold at night.',
      'An engineer is booked for tomorrow morning. Will someone be in to let them into the flat?',
      'Boiler part replaced. Heating restored and portable heaters collected.'),
    T('Request a room transfer', 'Room transfers', 'Medium', 'a room transfer',
      'I’m not getting on with my flatmates and it’s affecting my studies. I’d like to move to a different flat.',
      'Would you like a mediated conversation with your flatmates before we look at a transfer?',
      'Transfer approved to a studio in Riverside Hall from the start of next month.'),
    T('Noise from neighbouring flat', 'Flatmate concerns', 'Low', 'noise in halls',
      'The flat above has parties most nights until 3am. I have early lectures and can’t sleep.',
      'Can you let us know the dates and times of the recent disturbances?',
      'Residential Life spoke to the flat concerned and issued a formal warning.'),
    T('Deposit deduction query', 'Contract and rent', 'Low', 'a deposit query',
      'I was charged £120 from my deposit for cleaning when I left last summer. The flat was clean when I left.',
      'Could you send any photos you took when you checked out?',
      'Deduction reviewed and reduced to £30. Refund issued.'),
  ],
  it: [
    T('Can’t log in after password reset', 'Account access', 'Medium', 'a university account login problem',
      'I reset my password yesterday and now I can’t log in to Moodle or Outlook. It keeps saying my account is locked.',
      'Please confirm the phone number registered for your MFA so we can verify your identity.',
      'Account unlocked and MFA re-registered. Student confirmed access to Moodle and Outlook.'),
    T('eduroam not connecting on laptop', 'Wi-Fi', 'Low', 'a Wi-Fi connection problem',
      'My laptop won’t connect to eduroam in the library. My phone works fine.',
      'Could you tell us your laptop model and operating system?',
      'Old eduroam profile removed and reinstalled using the geteduroam app. Connection working.'),
    T('Need MATLAB licence for coursework', 'Software', 'Low', 'software for your course',
      'My module needs MATLAB but I can’t find where to download it with my university account.',
      'Which module is the software needed for?',
      'Licence assigned and download link sent via the Software Hub.'),
    T('Moodle not showing my modules', 'Moodle', 'Medium', 'missing Moodle modules',
      'Two of my modules aren’t showing on Moodle and I’ve got a quiz due this week.',
      'Could you list the module codes that are missing?',
      'Enrolment sync re-run. Both modules now visible on the student’s dashboard.'),
    T('MFA app on lost phone', 'Account access', 'High', 'lost multi-factor authentication',
      'I lost my phone at the weekend and can’t sign in to anything because of the authenticator app.',
      'Please visit the Service Desk in the library with your ID card so we can reset your MFA.',
      'Identity verified in person and MFA reset to new device.'),
  ],
  library: [
    T('Fine for a book I returned', 'Loans and fines', 'Low', 'a library fine',
      'I’ve been charged an overdue fine for a book I returned to the drop box before the due date.',
      'Could you tell us the title of the book and roughly when you returned it?',
      'Return confirmed from drop-box log and fine removed.'),
    T('Inter-library loan request', 'Inter-library loans', 'Low', 'an inter-library request',
      'I need a journal article for my dissertation that the library doesn’t subscribe to.',
      'Please send the full reference, including DOI if you have it.',
      'Article supplied via the British Library and sent to student.'),
    T('Can’t access e-journals off campus', 'E-resources', 'Medium', 'access to online resources',
      'When I try to open journal articles from home it asks me to pay, even though I’m logged in.',
      'Which database or journal are you trying to use?',
      'Student guided to use the Library Search link so the university login is applied. Access confirmed.'),
  ],
  disability: [
    T('Extra time in exams for dyslexia', 'Exam arrangements', 'Medium', 'exam access arrangements',
      'I was diagnosed with dyslexia last year. How do I get extra time and a computer in my exams?',
      'Please upload a copy of your diagnostic assessment report.',
      'Support plan agreed: 25% extra time, use of a PC and a smaller exam room.'),
    T('Support plan not shared with lecturers', 'Support plans', 'Medium', 'reasonable adjustments',
      'My lecturers don’t seem to know about my support plan and I haven’t been given lecture slides in advance.',
      'Can you tell us which modules this applies to?',
      'Support plan re-circulated to module leaders and school disability contact.'),
    T('Applying for Disabled Students’ Allowance', 'DSA', 'Low', 'Disabled Students’ Allowance',
      'I think I might be eligible for DSA but I don’t know how to apply or what evidence I need.',
      'Do you have any existing medical evidence we can review with you?',
      'DSA application supported and needs assessment booked.'),
    T('Accessible room needed in halls', 'Accessible accommodation', 'High', 'accessible accommodation',
      'I use a wheelchair and my room allocation is on the third floor with no lift access during maintenance.',
      'We’re speaking to Residential Life now. Can you confirm your preferred move date?',
      'Student moved to a ground-floor adapted room the same week.'),
  ],
  international: [
    T('Visa expires before course end', 'Visa extensions', 'High', 'a student visa issue',
      'My visa expires in December but my course now finishes in January because of a resit.',
      'Please send us a copy of your current eVisa share code.',
      'New CAS issued and student supported with in-country visa extension application.'),
    T('Letter for bank account', 'Letters', 'Low', 'a letter to open a bank account',
      'The bank needs a letter from the university with my UK address to open an account.',
      'Which bank are you applying to?',
      'Bank letter generated and emailed to student.'),
    T('Attendance warning email', 'Attendance monitoring', 'High', 'an attendance monitoring warning',
      'I got an email saying my attendance is too low and it could affect my visa. I was ill and have a doctor’s note.',
      'Please send the doctor’s note so we can update your attendance record.',
      'Authorised absence recorded. Attendance warning withdrawn.'),
    T('Travelling home during reading week', 'Travel', 'Low', 'travel as an international student',
      'I want to go home during reading week. Do I need to tell the university or get a letter?',
      'Can you confirm your travel dates?',
      'Travel dates noted on record and travel letter issued.'),
  ],
  careers: [
    T('CV review before placement applications', 'CV and applications', 'Low', 'a CV review',
      'I’m applying for placement years and would like someone to look over my CV.',
      'Please upload your current CV and the role you’re targeting.',
      'CV reviewed with written feedback and a follow-up appointment booked.'),
    T('Placement offer withdrawn', 'Placements', 'High', 'a withdrawn placement offer',
      'My placement company has withdrawn my offer two weeks before I was due to start. I don’t know what happens now.',
      'Could you forward the email from the employer?',
      'Student matched with an alternative placement and programme transfer options explained.'),
    T('Interview practice for graduate scheme', 'Interviews', 'Low', 'interview preparation',
      'I have an assessment centre for a graduate scheme next week and would like to practise.',
      'Which days next week are you available for a mock interview?',
      'Mock interview completed and feedback shared.'),
  ],
  security: [
    T('Bike stolen from outside library', 'Incident report', 'Medium', 'a theft on campus',
      'My bike was taken from the racks outside the library between 2pm and 6pm today. It was locked.',
      'Have you reported this to the police? If so, please share the crime reference number.',
      'CCTV reviewed and footage passed to police. Crime reference recorded on case.'),
    T('Feeling unsafe walking back to halls', 'Personal safety', 'High', 'personal safety',
      'Someone has followed me twice on the path between the Arts building and Castle Court in the evening.',
      'Please call the Security Lodge on 01632 960 444 if this happens again. Could you describe the person?',
      'Patrols increased on the route and student registered for the Safe Walk service.'),
  ],
};

const WEIGHTS: Record<string, number> = {
  counselling: 21, it: 13, finance: 12, accommodation: 10, advising: 9, aid: 8,
  registry: 8, international: 7, disability: 6, library: 4, careers: 3, security: 2,
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MIN = 60_000;
const HOUR = 60 * MIN;

export const FIRST_ID = 931;
export const LAST_SEED_ID = 1030;
export const caseId = (n: number) => `SC${String(n).padStart(4, '0')}`;

export const TRIAGE_ACTOR = 'Campus Saathi Triage';

function anchorTime(now: Date) {
  const a = new Date(now);
  a.setHours(10, 32, 0, 0);
  if (now.getTime() - a.getTime() < 40 * MIN) a.setDate(a.getDate() - 1);
  return a.getTime();
}

export function buildSeed(now = new Date()): Case[] {
  const rand = mulberry32(20260924);
  const pick = <X,>(arr: X[]) => arr[Math.floor(rand() * arr.length)];
  const anchor = anchorTime(now);
  const nowMs = now.getTime();

  const deptBag: string[] = [];
  Object.entries(WEIGHTS).forEach(([id, w]) => { for (let i = 0; i < w; i++) deptBag.push(id); });
  const templateCursor: Record<string, number> = {};
  const otherStudents = STUDENTS.filter((x) => x.id !== DEMO_STUDENT_ID);

  const cases: Case[] = [];
  for (let n = FIRST_ID; n <= LAST_SEED_ID; n++) {
    const special = SPECIAL[n];
    if (special) { cases.push(special(anchor, nowMs)); continue; }

    let created: number;
    if (n < 1024) created = anchor - (1024 - n) * 6.8 * HOUR - Math.floor(rand() * 180) * MIN;
    else created = anchor + ((n - 1024) / (LAST_SEED_ID - 1023)) * (nowMs - anchor - 3 * MIN);
    created = Math.floor(created / MIN) * MIN;

    const deptId = pick(deptBag);
    const list = TEMPLATES[deptId];
    const cursor = templateCursor[deptId] ?? Math.floor(rand() * list.length);
    templateCursor[deptId] = cursor + 1;
    const tpl = list[cursor % list.length];

    const ageDays = (nowMs - created) / (24 * HOUR);
    const r = rand();
    let status: Status;
    if (ageDays > 12) status = r < 0.93 ? 'Resolved' : 'Waiting';
    else if (ageDays > 4) status = r < 0.5 ? 'Resolved' : r < 0.82 ? 'In Progress' : 'Waiting';
    else if (ageDays > 1) status = r < 0.15 ? 'Resolved' : r < 0.6 ? 'In Progress' : r < 0.78 ? 'Waiting' : 'New';
    else status = r < 0.6 ? 'New' : 'In Progress';

    let priority = tpl.priority;
    if (rand() < 0.12) priority = priority === 'Low' ? 'Medium' : 'High';

    const team = staffForDepartment(deptId);
    let assigneeId: string | null = null;
    if (status !== 'New' || rand() < (deptId === 'counselling' ? 0.6 : 0.3)) {
      assigneeId = deptId === 'counselling' ? (rand() < 0.8 ? DEMO_STAFF_ID : team[1].id) : pick(team).id;
    }

    cases.push(buildCase({
      n, tpl, deptId, status, priority, assigneeId, created, nowMs, rand,
      studentId: pick(otherStudents).id,
    }));
  }
  return cases;
}

interface BuildArgs {
  n: number; tpl: Template; deptId: string; status: Status; priority: Priority;
  assigneeId: string | null; created: number; nowMs: number; rand: () => number; studentId: string;
}

function buildCase(a: BuildArgs): Case {
  const { n, tpl, deptId, status, priority, assigneeId, created, nowMs, rand } = a;
  const dept = departmentById(deptId)!;
  const staff = staffById(assigneeId);
  const student = studentById(a.studentId)!;
  const activity: ActivityEntry[] = [];
  let t = created;
  let seq = 0;
  const push = (e: Omit<ActivityEntry, 'id' | 'at'>, at: number) => {
    const clamped = Math.min(at, nowMs - MIN);
    activity.push({ id: `${caseId(n)}-${++seq}`, at: new Date(clamped).toISOString(), ...e });
    return clamped;
  };

  push({ kind: 'created', actor: student.name, text: 'Request created' }, t);
  t = push({ kind: 'triage', actor: TRIAGE_ACTOR, text: 'AI classified request', body: `${tpl.category} · ${priority} urgency` }, t + MIN);
  t = push({ kind: 'assigned', actor: TRIAGE_ACTOR, text: `Assigned to ${dept.team}` }, t);

  if (staff) {
    t = push({ kind: 'assigned', actor: 'Queue manager', text: `Assigned to ${staff.name}` }, t + (20 + rand() * 150) * MIN);
  }
  if (status !== 'New' && staff) {
    t = push({ kind: 'status', actor: staff.name, text: 'Status changed from New to In Progress' }, t + (5 + rand() * 60) * MIN);
    t = push({
      kind: 'response', actor: staff.name, text: 'Response sent to student',
      body: `Hi ${student.preferredName}, thanks for getting in touch. ${tpl.ask}`,
    }, t + 2 * MIN);
    if (rand() < 0.35) {
      t = push({ kind: 'note', actor: staff.name, text: 'Internal note added', internal: true, body: internalNoteFor(deptId) }, t + 10 * MIN);
    }
  }
  if (status === 'Waiting') {
    t = push({ kind: 'status', actor: staff?.name ?? dept.team, text: 'Status changed from In Progress to Waiting', body: 'Waiting on student' }, t + MIN);
  }
  let resolution: Case['resolution'];
  if (status === 'Resolved') {
    t = push({ kind: 'student', actor: student.name, text: 'Student replied', body: 'Thanks, I’ve sent that over now.' }, t + (4 + rand() * 30) * HOUR);
    const at = push({ kind: 'resolved', actor: staff?.name ?? dept.team, text: 'Case resolved', body: tpl.fix }, t + (3 + rand() * 60) * HOUR);
    resolution = { at: new Date(at).toISOString(), by: staff?.name ?? dept.team, text: tpl.fix };
    t = at;
  }

  return {
    id: caseId(n),
    title: tpl.title,
    description: tpl.desc,
    studentId: student.id,
    departmentId: deptId,
    category: tpl.category,
    priority,
    status,
    createdAt: new Date(created).toISOString(),
    updatedAt: activity[activity.length - 1].at,
    assigneeId,
    contactPreference: (['Email', 'Email', 'Phone', 'In person', 'Teams call'] as const)[Math.floor(rand() * 5)],
    triage: {
      category: tpl.category,
      urgency: tpl.priority,
      reason: `Your request appears related to ${tpl.reason}.`,
      confidence: 0.72 + rand() * 0.24,
      signals: tpl.title.toLowerCase().split(/\s+/).filter((w) => w.length > 5).slice(0, 3),
    },
    activity,
    resolution,
  };
}

function internalNoteFor(deptId: string) {
  const notes: Record<string, string> = {
    counselling: 'Risk screen completed – no immediate risk indicated. Offer next available slot.',
    advising: 'Checked with programme lead – extension within module policy.',
    registry: 'Record flagged in SITS for the Registry team lead to review.',
    finance: 'Checked SITS account – no payments received since September.',
    aid: 'Income evidence reviewed – meets Hardship Fund criteria.',
    accommodation: 'Estates job raised with the maintenance contractor.',
    it: 'Account shows repeated failed sign-ins from the student’s own device – not a security concern.',
    library: 'Checked Alma loan history – item marked returned late by drop box scan.',
    disability: 'Evidence received and uploaded to the student’s support file.',
    international: 'Checked Home Office portal – no reportable change yet.',
    careers: 'Employer contacted for more detail.',
    security: 'CCTV request logged with control room.',
  };
  return notes[deptId];
}



const SPECIAL: Record<number, (anchor: number, now: number) => Case> = {
  1024: (anchor) => {
    const at = (min: number) => new Date(anchor + min * MIN).toISOString();
    return {
      id: 'SC1024',
      title: 'Student Wellbeing Request',
      description:
        'I have three exams in the next two weeks and I’m finding it really hard to cope. I’m not sleeping properly and keep falling behind on revision. I’m not sure who I should be talking to about this.',
      studentId: DEMO_STUDENT_ID,
      departmentId: 'counselling',
      category: 'Exam stress',
      priority: 'Medium',
      status: 'In Progress',
      createdAt: at(0),
      updatedAt: at(34),
      assigneeId: DEMO_STAFF_ID,
      contactPreference: 'In person',
      triage: {
        category: 'Exam stress',
        urgency: 'Medium',
        reason: 'Your request appears related to exam-related stress.',
        confidence: 0.91,
        signals: ['exams', 'hard to cope', 'not sleeping'],
      },
      activity: [
        { id: 'SC1024-1', at: at(0), kind: 'created', actor: 'Abhilash Reddy', text: 'Request created' },
        { id: 'SC1024-2', at: at(1), kind: 'triage', actor: TRIAGE_ACTOR, text: 'AI classified request', body: 'Exam stress · Medium urgency' },
        { id: 'SC1024-3', at: at(1), kind: 'assigned', actor: TRIAGE_ACTOR, text: 'Assigned to Counselling Centre' },
        { id: 'SC1024-4', at: at(18), kind: 'assigned', actor: 'Queue manager', text: 'Assigned to Sarah Mitchell' },
        { id: 'SC1024-5', at: at(32), kind: 'status', actor: 'Sarah Mitchell', text: 'Staff updated status', body: 'Status changed from New to In Progress' },
        {
          id: 'SC1024-6', at: at(34), kind: 'response', actor: 'Sarah Mitchell', text: 'Response sent to student',
          body: 'Hi Abhilash, thanks for reaching out – lots of students feel like this in the run-up to exams, and you’ve done the right thing by getting in touch. I have a free slot on Thursday at 2:00 pm in the Hollins Building. Would that work for you?',
        },
      ],
    };
  },
  987: (anchor) => {
    const c0 = anchor - 9 * 24 * HOUR - 4 * HOUR;
    const at = (min: number) => new Date(c0 + min * MIN).toISOString();
    return {
      id: 'SC0987', title: 'eduroam not connecting on laptop',
      description: 'My laptop won’t connect to eduroam anywhere on campus since I updated Windows. My phone works fine.',
      studentId: DEMO_STUDENT_ID, departmentId: 'it', category: 'Wi-Fi', priority: 'Low', status: 'Resolved',
      createdAt: at(0), updatedAt: at(1460), assigneeId: 'sf-petrova', contactPreference: 'Email',
      triage: { category: 'Wi-Fi', urgency: 'Low', reason: 'Your request appears related to a Wi-Fi connection problem.', confidence: 0.94, signals: ['eduroam', 'laptop'] },
      activity: [
        { id: 'SC0987-1', at: at(0), kind: 'created', actor: 'Abhilash Reddy', text: 'Request created' },
        { id: 'SC0987-2', at: at(1), kind: 'triage', actor: TRIAGE_ACTOR, text: 'AI classified request', body: 'Wi-Fi · Low urgency' },
        { id: 'SC0987-3', at: at(1), kind: 'assigned', actor: TRIAGE_ACTOR, text: 'Assigned to IT Service Desk' },
        { id: 'SC0987-4', at: at(52), kind: 'assigned', actor: 'Queue manager', text: 'Assigned to Nadia Petrova' },
        { id: 'SC0987-5', at: at(70), kind: 'status', actor: 'Nadia Petrova', text: 'Status changed from New to In Progress' },
        { id: 'SC0987-6', at: at(72), kind: 'response', actor: 'Nadia Petrova', text: 'Response sent to student', body: 'Hi Abhilash, the Windows update removes the old eduroam profile. Please install the geteduroam app from the Software Hub and sign in with your full university email. Let me know if that works.' },
        { id: 'SC0987-7', at: at(1380), kind: 'student', actor: 'Abhilash Reddy', text: 'Student replied', body: 'That worked, thank you!' },
        { id: 'SC0987-8', at: at(1460), kind: 'resolved', actor: 'Nadia Petrova', text: 'Case resolved', body: 'eduroam profile reinstalled with the geteduroam app. Student confirmed connection working.' },
      ],
      resolution: { at: at(1460), by: 'Nadia Petrova', text: 'eduroam profile reinstalled with the geteduroam app. Student confirmed connection working.' },
    };
  },
  1009: (anchor) => {
    const c0 = anchor - 4 * 24 * HOUR + 3 * HOUR;
    const at = (min: number) => new Date(c0 + min * MIN).toISOString();
    return {
      id: 'SC1009', title: 'Tuition fee instalment not showing as paid',
      description: 'I paid my second tuition fee instalment on the 15th by bank transfer but my account still shows it as outstanding and I got a reminder email.',
      studentId: DEMO_STUDENT_ID, departmentId: 'finance', category: 'Invoices', priority: 'Medium', status: 'Waiting',
      createdAt: at(0), updatedAt: at(215), assigneeId: 'sf-doyle', contactPreference: 'Email',
      triage: { category: 'Invoices', urgency: 'Medium', reason: 'Your request appears related to a tuition fee payment.', confidence: 0.88, signals: ['tuition fee', 'instalment', 'paid'] },
      activity: [
        { id: 'SC1009-1', at: at(0), kind: 'created', actor: 'Abhilash Reddy', text: 'Request created' },
        { id: 'SC1009-2', at: at(1), kind: 'triage', actor: TRIAGE_ACTOR, text: 'AI classified request', body: 'Invoices · Medium urgency' },
        { id: 'SC1009-3', at: at(1), kind: 'assigned', actor: TRIAGE_ACTOR, text: 'Assigned to Fees & Income Team' },
        { id: 'SC1009-4', at: at(140), kind: 'assigned', actor: 'Queue manager', text: 'Assigned to Karen Doyle' },
        { id: 'SC1009-5', at: at(205), kind: 'status', actor: 'Karen Doyle', text: 'Status changed from New to In Progress' },
        { id: 'SC1009-6', at: at(212), kind: 'response', actor: 'Karen Doyle', text: 'Response sent to student', body: 'Hi Abhilash, international transfers can take up to five working days to reach us. Could you send a copy of the bank transfer receipt showing the reference number? I’ll match it to your account.' },
        { id: 'SC1009-7', at: at(215), kind: 'status', actor: 'Karen Doyle', text: 'Status changed from In Progress to Waiting', body: 'Waiting on student' },
      ],
    };
  },
  1019: (anchor) => {
    const c0 = anchor - 26 * HOUR;
    const at = (min: number) => new Date(c0 + min * MIN).toISOString();
    return {
      id: 'SC1019', title: 'Fine for a book I returned',
      description: 'I’ve been charged a £4.50 overdue fine for “Introduction to Algorithms”. I put it in the drop box outside the library the day before it was due.',
      studentId: DEMO_STUDENT_ID, departmentId: 'library', category: 'Loans and fines', priority: 'Low', status: 'New',
      createdAt: at(0), updatedAt: at(1), assigneeId: null, contactPreference: 'Email',
      triage: { category: 'Loans and fines', urgency: 'Low', reason: 'Your request appears related to a library fine.', confidence: 0.93, signals: ['fine', 'returned', 'library'] },
      activity: [
        { id: 'SC1019-1', at: at(0), kind: 'created', actor: 'Abhilash Reddy', text: 'Request created' },
        { id: 'SC1019-2', at: at(1), kind: 'triage', actor: TRIAGE_ACTOR, text: 'AI classified request', body: 'Loans and fines · Low urgency' },
        { id: 'SC1019-3', at: at(1), kind: 'assigned', actor: TRIAGE_ACTOR, text: 'Assigned to Library Customer Services' },
      ],
    };
  },
};

export const ALL_DEPARTMENT_IDS = DEPARTMENTS.map((d) => d.id);
