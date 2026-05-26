export type ApplicationStatus =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'interview'
  | 'admitted'
  | 'pending'
  | 'failed';

export type InterviewResult = 'pass' | 'pending' | 'fail';

export interface Student {
  id: number;
  studentId: string;
  name: string;
  college: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  location: string;
}

export interface Admin {
  id: number;
  username: string;
  password: string;
  clubId: number;
}

export interface Application {
  id: number;
  studentId: string;
  name: string;
  college: string;
  club1Id: number;
  club2Id: number;
  intro: string;
  status: ApplicationStatus;
  createdAt: number;
}

export interface InterviewSlot {
  id: number;
  clubId: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location: string;
}

export interface Interview {
  id: number;
  applicationId: number;
  slotId: number;
  result: InterviewResult | null;
  createdAt: number;
}

export interface Notification {
  id: number;
  studentId: string;
  clubId: number;
  title: string;
  content: string;
  createdAt: number;
}
