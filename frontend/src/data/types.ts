export type Role = 'student' | 'staff' | 'admin';
export type Status = 'New' | 'In Progress' | 'Waiting' | 'Resolved';
export type Priority = 'High' | 'Medium' | 'Low';

export const STATUSES: Status[] = ['New', 'In Progress', 'Waiting', 'Resolved'];
export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export interface Department {
  id: string;
  name: string;
  team: string; // the assignment group name staff see
  description: string;
  helpsWith: string[];
  location: string;
  hours: string;
  phone: string;
  email: string;
  targetResponse: string;
}

export interface Student {
  id: string;
  name: string;
  preferredName: string;
  studentNumber: string;
  email: string;
  phone: string;
  programme: string;
  faculty: string;
  year: string;
  mode: 'Full-time' | 'Part-time';
  feeStatus: 'Home' | 'International';
  tutor: string;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  departmentId: string;
  email: string;
}

export type ActivityKind =
  | 'created'
  | 'triage'
  | 'assigned'
  | 'status'
  | 'priority'
  | 'response'
  | 'note'
  | 'student'
  | 'resolved';

export interface ActivityEntry {
  id: string;
  at: string;
  kind: ActivityKind;
  actor: string;
  text: string;
  body?: string;
  internal?: boolean;
}

export interface Triage {
  category: string;
  urgency: Priority;
  reason: string;
  confidence: number; // 0..1
  signals: string[];
}

export interface Case {
  id: string;
  title: string;
  description: string;
  studentId: string;
  departmentId: string;
  category: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
  assigneeId: string | null;
  contactPreference: 'Email' | 'Phone' | 'In person' | 'Teams call';
  triage: Triage;
  activity: ActivityEntry[];
  resolution?: { at: string; by: string; text: string };
}
