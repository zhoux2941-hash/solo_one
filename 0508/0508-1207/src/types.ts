export type ApplicationStatus =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'interview'
  | 'admitted'
  | 'pending'
  | 'failed';

export interface Club {
  id: number;
  name: string;
  description: string;
  location: string;
}

export interface Slot {
  id: number;
  clubId: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location: string;
  used?: number;
}

export interface Interview {
  id: number;
  applicationId: number;
  slotId: number;
  result: 'pass' | 'pending' | 'fail' | null;
  createdAt: number;
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
  club1?: Club;
  club2?: Club;
  slot?: Slot;
  interview?: Interview;
}

export interface Notification {
  id: number;
  studentId: string;
  clubId: number;
  title: string;
  content: string;
  createdAt: number;
  club?: Club;
}
