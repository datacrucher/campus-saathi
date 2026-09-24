import type { Department, StaffMember, Student } from './types';

export const UNIVERSITY = 'Northbridge University';

export const DEPARTMENTS: Department[] = [
  {
    id: 'counselling',
    name: 'Student Counselling & Wellbeing',
    team: 'Counselling Centre',
    description: 'Support for stress, personal concerns and wellbeing.',
    helpsWith: ['Exam and study stress', 'Anxiety and low mood', 'Bereavement and personal difficulties', 'Short-term counselling sessions', 'Wellbeing workshops'],
    location: 'Hollins Building, Level 1',
    hours: 'Mon–Fri, 9:00 am – 5:00 pm',
    phone: '01632 960 210',
    email: 'wellbeing@northbridge.ac.uk',
    targetResponse: 'Within 1 working day',
  },
  {
    id: 'advising',
    name: 'Academic Advising',
    team: 'Academic Advice Team',
    description: 'Guidance on modules, progression, extensions and academic difficulties.',
    helpsWith: ['Extenuating circumstances', 'Coursework extensions', 'Changing modules or programme', 'Interrupting your studies', 'Academic misconduct meetings'],
    location: 'Student Hub, Ground Floor',
    hours: 'Mon–Fri, 9:00 am – 5:00 pm',
    phone: '01632 960 220',
    email: 'academic.advice@northbridge.ac.uk',
    targetResponse: 'Within 2 working days',
  },
  {
    id: 'registry',
    name: 'Registry & Student Records',
    team: 'Registry Office',
    description: 'Enrolment, student records, transcripts and official letters.',
    helpsWith: ['Enrolment and re-enrolment', 'Council tax exemption letters', 'Transcripts and certificates', 'Updating personal details', 'Student ID cards'],
    location: 'Student Hub, Ground Floor',
    hours: 'Mon–Fri, 9:30 am – 4:30 pm',
    phone: '01632 960 230',
    email: 'registry@northbridge.ac.uk',
    targetResponse: 'Within 3 working days',
  },
  {
    id: 'finance',
    name: 'Student Finance & Fees',
    team: 'Fees & Income Team',
    description: 'Tuition fee payments, instalment plans and invoices.',
    helpsWith: ['Tuition fee invoices', 'Payment plans', 'Student loan delays', 'Refunds', 'Sponsor billing'],
    location: 'Kingsway House, Room 104',
    hours: 'Mon–Fri, 10:00 am – 4:00 pm',
    phone: '01632 960 240',
    email: 'fees@northbridge.ac.uk',
    targetResponse: 'Within 2 working days',
  },
  {
    id: 'aid',
    name: 'Financial Aid & Scholarships',
    team: 'Student Funding Office',
    description: 'Hardship funding, bursaries and scholarship applications.',
    helpsWith: ['Hardship Fund applications', 'Northbridge Bursary', 'Scholarship queries', 'Budgeting advice', 'Emergency short-term loans'],
    location: 'Student Hub, First Floor',
    hours: 'Mon–Fri, 9:00 am – 5:00 pm',
    phone: '01632 960 250',
    email: 'funding@northbridge.ac.uk',
    targetResponse: 'Within 2 working days',
  },
  {
    id: 'accommodation',
    name: 'Accommodation & Residential Life',
    team: 'Residential Life',
    description: 'University halls, maintenance, room changes and living in halls.',
    helpsWith: ['Maintenance and repairs', 'Room transfers', 'Flatmate concerns', 'Contract and rent queries', 'Private housing advice'],
    location: 'Castle Court Reception',
    hours: 'Reception open 24 hours',
    phone: '01632 960 260',
    email: 'accommodation@northbridge.ac.uk',
    targetResponse: 'Within 1 working day',
  },
  {
    id: 'it',
    name: 'IT Service Desk',
    team: 'IT Service Desk',
    description: 'University account, Wi-Fi, Moodle, email and software access.',
    helpsWith: ['Password and MFA resets', 'eduroam Wi-Fi', 'Moodle and Microsoft 365 access', 'Software for your course', 'Printing credit'],
    location: 'Library, Ground Floor',
    hours: 'Mon–Fri, 8:00 am – 8:00 pm; weekends 10:00 am – 4:00 pm',
    phone: '01632 960 270',
    email: 'servicedesk@northbridge.ac.uk',
    targetResponse: 'Within 4 working hours',
  },
  {
    id: 'library',
    name: 'Library Services',
    team: 'Library Customer Services',
    description: 'Borrowing, fines, study spaces and research support.',
    helpsWith: ['Loans and fines', 'Inter-library requests', 'Study room bookings', 'Referencing support', 'E-resource access'],
    location: 'Main Library, Level 0',
    hours: 'Staffed desk: Mon–Fri, 8:30 am – 7:00 pm',
    phone: '01632 960 280',
    email: 'library@northbridge.ac.uk',
    targetResponse: 'Within 2 working days',
  },
  {
    id: 'disability',
    name: 'Disability & Accessibility Services',
    team: 'Disability Advice Team',
    description: 'Reasonable adjustments, exam arrangements and support plans.',
    helpsWith: ['Individual support plans', 'Exam access arrangements', 'Disabled Students’ Allowance', 'Specific learning differences', 'Accessible accommodation'],
    location: 'Hollins Building, Level 2',
    hours: 'Mon–Fri, 9:00 am – 5:00 pm',
    phone: '01632 960 290',
    email: 'disability@northbridge.ac.uk',
    targetResponse: 'Within 3 working days',
  },
  {
    id: 'international',
    name: 'International Student Office',
    team: 'International Student Advice',
    description: 'Visa, immigration and support for international students.',
    helpsWith: ['Student visa extensions', 'CAS letters', 'BRP and eVisa queries', 'Attendance monitoring', 'Travel and letters for embassies'],
    location: 'Kingsway House, Room 012',
    hours: 'Mon–Thu, 9:30 am – 4:30 pm',
    phone: '01632 960 300',
    email: 'international@northbridge.ac.uk',
    targetResponse: 'Within 2 working days',
  },
  {
    id: 'careers',
    name: 'Careers & Employability',
    team: 'Placement Cell',
    description: 'Placements, internships, NOCs, CV reviews and graduate careers.',
    helpsWith: ['No Objection Certificates (NOC) for internships', 'CV and cover letter reviews', 'Placement year support', 'Interview practice', 'Part-time jobs on campus', 'Graduate job applications'],
    location: 'Student Hub, Second Floor',
    hours: 'Mon–Fri, 9:00 am – 5:00 pm',
    phone: '01632 960 310',
    email: 'careers@northbridge.ac.uk',
    targetResponse: 'Within 3 working days',
  },
  {
    id: 'security',
    name: 'Campus Security & Safety',
    team: 'Security Control Room',
    description: 'Personal safety, incidents on campus and lost property.',
    helpsWith: ['Reporting an incident', 'Feeling unsafe on campus', 'Safe walk home service', 'Lost and found', 'Bike and property registration'],
    location: 'Security Lodge, Main Gate',
    hours: 'Open 24 hours, every day',
    phone: '01632 960 444',
    email: 'security@northbridge.ac.uk',
    targetResponse: 'Immediate for incidents',
  },
];

export const departmentById = (id: string) => DEPARTMENTS.find((d) => d.id === id);

export const STUDENTS: Student[] = [
  s('st-2291047', 'Abhilash Reddy', 'Abhilash', '2291047', 'a.reddy', 'BSc Computer Science', 'Science & Engineering', 'Year 2', 'International', 'Dr Helen Marsh'),
  s('st-2184412', 'Emily Carter', 'Emily', '2184412', 'e.carter', 'BA Psychology', 'Health & Life Sciences', 'Year 3', 'Home', 'Dr Paul Grieve'),
  s('st-2310958', 'Mohammed Al-Rashid', 'Mo', '2310958', 'm.alrashid', 'MEng Mechanical Engineering', 'Science & Engineering', 'Year 1', 'International', 'Prof. Anne Kirby'),
  s('st-2203371', 'Chloe Nguyen', 'Chloe', '2203371', 'c.nguyen', 'LLB Law', 'Business & Law', 'Year 2', 'Home', 'Ms Joanna Pike'),
  s('st-2107765', 'Daniel Okonkwo', 'Daniel', '2107765', 'd.okonkwo', 'BSc Nursing (Adult)', 'Health & Life Sciences', 'Year 3', 'Home', 'Mrs Lorraine Tate'),
  s('st-2296604', 'Sophie Williams', 'Sophie', '2296604', 's.williams', 'BA History', 'Arts & Humanities', 'Year 2', 'Home', 'Dr Martin Hale'),
  s('st-2402218', 'Arjun Mehta', 'Arjun', '2402218', 'a.mehta', 'MSc Data Science', 'Science & Engineering', 'Postgraduate', 'International', 'Dr Kavita Rao'),
  s('st-2215530', 'Hannah Kowalski', 'Hannah', '2215530', 'h.kowalski', 'BSc Biomedical Science', 'Health & Life Sciences', 'Year 2', 'Home', 'Dr Simon Leigh'),
  s('st-2321147', 'Liam O’Brien', 'Liam', '2321147', 'l.obrien', 'BA Business Management', 'Business & Law', 'Year 1', 'Home', 'Mr Gareth Byrne'),
  s('st-2188093', 'Aisha Bello', 'Aisha', '2188093', 'a.bello', 'BSc Economics', 'Business & Law', 'Year 3', 'International', 'Dr Ruth Fenwick'),
  s('st-2330481', 'Tomás García', 'Tomás', '2330481', 't.garcia', 'BArch Architecture', 'Arts & Humanities', 'Year 1', 'International', 'Prof. Neil Crane'),
  s('st-2209926', 'Grace Thompson', 'Grace', '2209926', 'g.thompson', 'BSc Computer Science', 'Science & Engineering', 'Year 2', 'Home', 'Dr Helen Marsh'),
  s('st-2411302', 'Wei Zhang', 'Wei', '2411302', 'w.zhang', 'MA International Relations', 'Arts & Humanities', 'Postgraduate', 'International', 'Dr Oliver Stanton'),
  s('st-2176658', 'Olivia Brennan', 'Olivia', '2176658', 'o.brennan', 'BSc Nursing (Mental Health)', 'Health & Life Sciences', 'Year 3', 'Home', 'Mrs Lorraine Tate'),
  s('st-2318840', 'Kwame Mensah', 'Kwame', '2318840', 'k.mensah', 'BEng Civil Engineering', 'Science & Engineering', 'Year 1', 'International', 'Dr Faye Holloway'),
  s('st-2224417', 'Isabella Rossi', 'Isabella', '2224417', 'i.rossi', 'BA English Literature', 'Arts & Humanities', 'Year 2', 'Home', 'Dr Martin Hale'),
  s('st-2301175', 'Ryan Patel', 'Ryan', '2301175', 'r.patel', 'BSc Pharmacology', 'Health & Life Sciences', 'Year 1', 'Home', 'Dr Simon Leigh'),
  s('st-2195582', 'Freya Lindqvist', 'Freya', '2195582', 'f.lindqvist', 'BA Fine Art', 'Arts & Humanities', 'Year 3', 'International', 'Ms Carla Ruiz'),
  s('st-2287719', 'Yusuf Demir', 'Yusuf', '2287719', 'y.demir', 'BSc Mathematics', 'Science & Engineering', 'Year 2', 'Home', 'Prof. Anne Kirby'),
  s('st-2233064', 'Megan Hughes', 'Megan', '2233064', 'm.hughes', 'BSc Sport & Exercise Science', 'Health & Life Sciences', 'Year 2', 'Home', 'Dr Paul Grieve'),
  s('st-2408851', 'Jonah Fischer', 'Jonah', '2408851', 'j.fischer', 'MBA', 'Business & Law', 'Postgraduate', 'International', 'Dr Ruth Fenwick'),
  s('st-2312290', 'Priya Sharma', 'Priya', '2312290', 'p.sharma', 'BSc Psychology with Criminology', 'Health & Life Sciences', 'Year 1', 'Home', 'Dr Paul Grieve'),
  s('st-2166437', 'Callum Fraser', 'Callum', '2166437', 'c.fraser', 'BSc Physics', 'Science & Engineering', 'Year 4', 'Home', 'Dr Faye Holloway'),
  s('st-2279905', 'Zara Hussain', 'Zara', '2279905', 'z.hussain', 'LLB Law', 'Business & Law', 'Year 2', 'Home', 'Ms Joanna Pike'),
];

function s(
  id: string, name: string, preferredName: string, studentNumber: string, user: string,
  programme: string, faculty: string, year: string, feeStatus: Student['feeStatus'], tutor: string,
): Student {
  const digits = studentNumber.slice(-3);
  return {
    id, name, preferredName, studentNumber, programme, faculty, year, feeStatus, tutor,
    email: `${user}@student.northbridge.ac.uk`,
    phone: `07700 900${digits}`,
    mode: year === 'Postgraduate' && feeStatus === 'Home' ? 'Part-time' : 'Full-time',
  };
}

export const studentById = (id: string) => STUDENTS.find((x) => x.id === id);

export const STAFF: StaffMember[] = [
  m('sf-mitchell', 'Sarah Mitchell', 'Senior Counsellor', 'counselling'),
  m('sf-adeyemi', 'Dr Tom Adeyemi', 'Mental Health Adviser', 'counselling'),
  m('sf-moore', 'Rachel Moore', 'Academic Adviser', 'advising'),
  m('sf-price', 'Owen Price', 'Academic Adviser', 'advising'),
  m('sf-hart', 'Linda Hart', 'Registry Officer', 'registry'),
  m('sf-webb', 'Marcus Webb', 'Records Assistant', 'registry'),
  m('sf-doyle', 'Karen Doyle', 'Student Finance Officer', 'finance'),
  m('sf-siddiqui', 'Imran Siddiqui', 'Credit Control Officer', 'finance'),
  m('sf-brooks', 'Natalie Brooks', 'Funding Adviser', 'aid'),
  m('sf-lang', 'Peter Lang', 'Scholarships Officer', 'aid'),
  m('sf-whitfield', 'Joe Whitfield', 'Residential Life Coordinator', 'accommodation'),
  m('sf-eze', 'Amara Eze', 'Accommodation Officer', 'accommodation'),
  m('sf-carlisle', 'Ben Carlisle', 'Service Desk Analyst', 'it'),
  m('sf-petrova', 'Nadia Petrova', 'Service Desk Analyst', 'it'),
  m('sf-grant', 'Fiona Grant', 'Library Services Assistant', 'library'),
  m('sf-dunn', 'Harry Dunn', 'Academic Liaison Librarian', 'library'),
  m('sf-ashworth', 'Dr Claire Ashworth', 'Disability Adviser', 'disability'),
  m('sf-rivera', 'Sam Rivera', 'Inclusion Adviser', 'disability'),
  m('sf-lin', 'Mei Lin', 'International Student Adviser', 'international'),
  m('sf-ellis', 'George Ellis', 'Immigration Compliance Officer', 'international'),
  m('sf-parker', 'Hollie Parker', 'Careers Consultant', 'careers'),
  m('sf-osei', 'Victor Osei', 'Placements Coordinator', 'careers'),
  m('sf-morton', 'Dave Morton', 'Security Supervisor', 'security'),
  m('sf-shaw', 'Kelly Shaw', 'Security Officer', 'security'),
];

function m(id: string, name: string, title: string, departmentId: string): StaffMember {
  const last = name.split(' ').pop()!.toLowerCase().replace(/[^a-z]/g, '');
  const first = name.replace(/^Dr /, '').split(' ')[0].toLowerCase();
  return { id, name, title, departmentId, email: `${first}.${last}@northbridge.ac.uk` };
}

export const staffById = (id: string | null | undefined) => (id ? STAFF.find((x) => x.id === id) : undefined);
export const staffForDepartment = (deptId: string) => STAFF.filter((x) => x.departmentId === deptId);

export const ADMIN = {
  id: 'ad-okafor',
  name: 'James Okafor',
  title: 'Student Services Operations Manager',
  email: 'james.okafor@northbridge.ac.uk',
};

export const DEMO_STUDENT_ID = 'st-2291047';
export const DEMO_STAFF_ID = 'sf-mitchell';
