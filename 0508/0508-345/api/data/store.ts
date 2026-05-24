import { RadiationSourceApplication, Room, Escort } from '../../shared/types';

function getDateStr(daysOffset: number, hours: number, minutes: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const rooms: Room[] = [
  { id: 'room-1', name: '直线加速器机房1', type: 'LINAC', status: 'available' },
  { id: 'room-2', name: '直线加速器机房2', type: 'LINAC', status: 'available' },
  { id: 'room-3', name: '后装治疗机房', type: 'HDR', status: 'available' },
  { id: 'room-4', name: 'CT模拟定位室', type: 'SIM-CT', status: 'maintenance' },
];

export const escorts: Escort[] = [
  { id: 'escort-1', name: '张伟', role: '物理师' },
  { id: 'escort-2', name: '李娜', role: '物理师' },
  { id: 'escort-3', name: '王强', role: '技术员' },
  { id: 'escort-4', name: '刘芳', role: '技术员' },
  { id: 'escort-5', name: '陈明', role: '物理师' },
  { id: 'escort-6', name: '赵静', role: '技术员' },
  { id: 'escort-7', name: '孙磊', role: '物理师' },
  { id: 'escort-8', name: '周婷', role: '技术员' },
];

export let applications: RadiationSourceApplication[] = [
  {
    id: 'app-1',
    applicantId: 'doc-1',
    applicantName: '李医生',
    sourceType: 'co-60',
    roomId: 'room-1',
    startTime: getDateStr(0, 9, 0),
    endTime: getDateStr(0, 10, 30),
    escorts: ['escort-1', 'escort-3'],
    status: 'approved',
    createdAt: getDateStr(-1, 14, 20),
  },
  {
    id: 'app-2',
    applicantId: 'doc-2',
    applicantName: '王医生',
    sourceType: 'ir-192',
    roomId: 'room-2',
    startTime: getDateStr(0, 10, 0),
    endTime: getDateStr(0, 11, 30),
    escorts: ['escort-2'],
    status: 'pending',
    createdAt: getDateStr(0, 8, 0),
  },
  {
    id: 'app-3',
    applicantId: 'doc-3',
    applicantName: '张医生',
    sourceType: 'i-125',
    roomId: 'room-3',
    startTime: getDateStr(0, 14, 0),
    endTime: getDateStr(0, 15, 30),
    escorts: ['escort-4', 'escort-5'],
    status: 'approved',
    createdAt: getDateStr(-2, 9, 30),
  },
  {
    id: 'app-4',
    applicantId: 'doc-4',
    applicantName: '陈医生',
    sourceType: 'co-60',
    roomId: 'room-1',
    startTime: getDateStr(1, 9, 0),
    endTime: getDateStr(1, 11, 0),
    escorts: ['escort-1'],
    status: 'pending',
    createdAt: getDateStr(0, 10, 15),
  },
  {
    id: 'app-5',
    applicantId: 'doc-5',
    applicantName: '刘医生',
    sourceType: 'cs-137',
    roomId: 'room-2',
    startTime: getDateStr(1, 15, 0),
    endTime: getDateStr(1, 16, 30),
    escorts: ['escort-6', 'escort-7'],
    status: 'rejected',
    rejectReason: '时段与设备维护冲突',
    createdAt: getDateStr(-1, 16, 45),
  },
  {
    id: 'app-6',
    applicantId: 'doc-6',
    applicantName: '赵医生',
    sourceType: 'ir-192',
    roomId: 'room-1',
    startTime: getDateStr(2, 10, 0),
    endTime: getDateStr(2, 12, 0),
    escorts: ['escort-2', 'escort-3'],
    status: 'approved',
    createdAt: getDateStr(0, 11, 30),
  },
];

export function addApplication(app: RadiationSourceApplication): void {
  applications.push(app);
}

export function updateApplication(id: string, updates: Partial<RadiationSourceApplication>): RadiationSourceApplication | null {
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) return null;
  applications[index] = { ...applications[index], ...updates };
  return applications[index];
}

export function deleteApplication(id: string): boolean {
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) return false;
  applications.splice(index, 1);
  return true;
}
