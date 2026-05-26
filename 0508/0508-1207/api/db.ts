import type {
  Admin,
  Application,
  Club,
  Interview,
  InterviewSlot,
  Student,
} from './types.js';

let idCounter = 1000;
const nextId = () => ++idCounter;

export const students: Student[] = [];
export const admins: Admin[] = [
  { id: 1, username: 'music', password: '123456', clubId: 1 },
  { id: 2, username: 'drama', password: '123456', clubId: 2 },
  { id: 3, username: 'tech', password: '123456', clubId: 3 },
];
export const clubs: Club[] = [
  { id: 1, name: '音乐社', description: '热爱音乐，一起创作与表演', location: '艺术楼 201' },
  { id: 2, name: '话剧社', description: '舞台梦想，从这里开始', location: '艺术楼 305' },
  { id: 3, name: '计算机协会', description: '代码与创新的聚集地', location: '信息楼 412' },
];
export const applications: Application[] = [];
export const slots: InterviewSlot[] = [
  { id: 1, clubId: 1, date: '2026-05-30', startTime: '14:00', endTime: '15:00', capacity: 5, location: '艺术楼 201' },
  { id: 2, clubId: 1, date: '2026-05-30', startTime: '15:00', endTime: '16:00', capacity: 5, location: '艺术楼 201' },
  { id: 3, clubId: 2, date: '2026-05-31', startTime: '13:00', endTime: '14:00', capacity: 6, location: '艺术楼 305' },
  { id: 4, clubId: 3, date: '2026-06-01', startTime: '18:00', endTime: '19:00', capacity: 8, location: '信息楼 412' },
];
export const interviews: Interview[] = [];
export const notifications: Notification[] = [];

export function createStudent(input: Omit<Student, 'id'>): Student {
  const existing = students.find((s) => s.studentId === input.studentId);
  if (existing) {
    existing.name = input.name;
    existing.college = input.college;
    return existing;
  }
  const s: Student = { id: nextId(), ...input };
  students.push(s);
  return s;
}

export function getStudentByStudentId(studentId: string) {
  return students.find((s) => s.studentId === studentId);
}

export function createApplication(
  input: Omit<Application, 'id' | 'createdAt' | 'status'>,
): Application {
  const app: Application = {
    id: nextId(),
    status: 'submitted',
    createdAt: Date.now(),
    ...input,
  };
  applications.push(app);
  return app;
}

export function getApplicationsByStudent(studentId: string) {
  return applications
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getApplicationById(id: number) {
  return applications.find((a) => a.id === id);
}

function normalizeText(text: string) {
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function listApplications(params: {
  clubId?: number;
  college?: string;
  keyword?: string;
}) {
  const { clubId, college, keyword } = params;
  const normalizedKeyword = keyword ? normalizeText(keyword) : '';
  return applications
    .filter((a) => {
      if (clubId && a.club1Id !== clubId && a.club2Id !== clubId) return false;
      if (college && a.college !== college) return false;
      if (keyword && !normalizeText(a.intro).includes(normalizedKeyword))
        return false;
      return true;
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function listInterviewsByClub(clubId: number) {
  return interviews
    .map((i) => {
      const slot = slots.find((s) => s.id === i.slotId);
      const app = applications.find((a) => a.id === i.applicationId);
      return { interview: i, slot, app };
    })
    .filter((x) => x.slot && x.slot.clubId === clubId && x.app);
}

export function allocateInterviewSlot(applicationId: number, clubId: number) {
  const orderedSlots = [...slots]
    .filter((s) => s.clubId === clubId)
    .sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date),
    );

  if (orderedSlots.length === 0) return null;

  const slotIndex = new Map<number, number>();
  orderedSlots.forEach((s, idx) => slotIndex.set(s.id, idx));

  const usage = new Map<number, number>();
  for (const s of orderedSlots) usage.set(s.id, 0);
  for (const iv of interviews) {
    if (slotIndex.has(iv.slotId)) {
      usage.set(iv.slotId, (usage.get(iv.slotId) ?? 0) + 1);
    }
  }

  const pendingCount = applications.filter(
    (a) => a.club1Id === clubId && a.status === 'approved',
  ).length;
  const totalCapacity = orderedSlots.reduce((sum, s) => sum + s.capacity, 0);
  const currentAllocated = interviews.filter(
    (i) => slotIndex.has(i.slotId),
  ).length;
  const remaining = Math.max(0, totalCapacity - currentAllocated - pendingCount);

  const maxAllowedIndex = Math.min(
    orderedSlots.length - 1,
    Math.max(
      0,
      Math.ceil((currentAllocated + 1) / Math.max(1, orderedSlots.length)) + 1,
    ),
  );

  let chosenSlot = null;
  let bestScore = -Infinity;

  for (let i = 0; i < orderedSlots.length; i++) {
    const slot = orderedSlots[i];
    const used = usage.get(slot.id) ?? 0;
    const remainingInSlot = slot.capacity - used;

    if (remainingInSlot <= 0) continue;
    if (i > maxAllowedIndex && remaining > 0) continue;

    const fillRatio = used / slot.capacity;
    const timeBonus = orderedSlots.length - i;
    const score = fillRatio * 100 + timeBonus * 0.1;

    if (score > bestScore) {
      bestScore = score;
      chosenSlot = slot;
    }
  }

  if (!chosenSlot) {
    for (const slot of orderedSlots) {
      const used = usage.get(slot.id) ?? 0;
      if (used < slot.capacity) {
        chosenSlot = slot;
        break;
      }
    }
  }

  if (!chosenSlot) return null;

  const interview: Interview = {
    id: nextId(),
    applicationId,
    slotId: chosenSlot.id,
    result: null,
    createdAt: Date.now(),
  };
  interviews.push(interview);
  return interview;
}

export function getInterviewByApplication(applicationId: number) {
  return interviews.find((i) => i.applicationId === applicationId);
}

export function getSlotById(id: number) {
  return slots.find((s) => s.id === id);
}

export function addSlot(input: Omit<InterviewSlot, 'id'>) {
  const s: InterviewSlot = { id: nextId(), ...input };
  slots.push(s);
  return s;
}

export function removeSlot(id: number) {
  const idx = slots.findIndex((s) => s.id === id);
  if (idx >= 0) slots.splice(idx, 1);
}

export function updateInterviewResult(
  interviewId: number,
  result: Interview['result'],
) {
  const i = interviews.find((x) => x.id === interviewId);
  if (i) i.result = result;
  return i;
}

export function batchSendNotifications(
  items: { studentId: string; clubId: number; title: string; content: string }[],
) {
  const created: Notification[] = items.map((item) => {
    const n: Notification = {
      id: nextId(),
      studentId: item.studentId,
      clubId: item.clubId,
      title: item.title,
      content: item.content,
      createdAt: Date.now(),
    };
    notifications.push(n);
    return n;
  });
  return created;
}

export function getNotificationsByStudent(studentId: string) {
  return notifications
    .filter((n) => n.studentId === studentId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((n) => {
      const club = clubs.find((c) => c.id === n.clubId);
      return { ...n, club };
    });
}
