

export interface ProcedureStep {
  who: string;      // person or office to visit
  where: string;    // room / building
  what: string;     // what happens at this step
}

export interface Procedure {
  id: string;
  title: string;
  department: string;   // department id that handles online requests
  category: string;
  reason: string;
  terms: string[];      // phrases that identify this procedure
  documents: string[];  // what to bring
  steps: ProcedureStep[];
  turnaround: string;
}

export const PROCEDURES: Procedure[] = [
  {
    id: 'noc',
    title: 'No Objection Certificate (NOC)',
    department: 'careers',
    category: 'NOC request',
    reason: 'Your request appears related to getting a No Objection Certificate (NOC), usually needed for an internship or placement.',
    terms: ['noc', 'n.o.c', 'no objection', 'no-objection', 'objection certificate'],
    documents: [
      'Internship or placement offer letter (printed copy)',
      'Completed NOC application form (available from the Placement Cell or your Faculty Advisor)',
      'Student ID card',
    ],
    steps: [
      { who: 'Faculty Advisor (FA)', where: 'Room B-204, Academic Block B', what: 'Get the NOC application form checked and signed.' },
      { who: 'Year Coordinator', where: 'Room B-310, Academic Block B', what: 'Get the form countersigned.' },
      { who: 'Head of Department (HOD)', where: 'Room A-101, Administrative Block', what: 'Get final approval and the department stamp.' },
      { who: 'Placement Cell', where: 'Room SH-205, Student Hub (2nd floor)', what: 'Submit the fully signed form with a copy of your offer letter.' },
    ],
    turnaround: 'within 7 working days',
  },
];

export const procedureById = (id: string) => PROCEDURES.find((p) => p.id === id);
