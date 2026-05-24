import { applications, rooms } from '../data/store';
import { ConflictResult } from '../../shared/types';

export function isTimeOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 < e2 && s2 < e1;
}

export function checkConflicts(
  startTime: string,
  endTime: string,
  roomId: string,
  escorts: string[],
  excludeId?: string,
  checkPending: boolean = true
): ConflictResult {
  const roomConflicts: string[] = [];
  const escortShortages: string[] = [];
  const sourceConflicts: string[] = [];
  const details: ConflictResult['details'] = [];

  const room = rooms.find(r => r.id === roomId);
  if (room?.status === 'maintenance') {
    roomConflicts.push(roomId);
    details.push({
      type: 'room',
      message: `${room.name} 正在维护中`,
    });
  }

  for (const app of applications) {
    if (excludeId && app.id === excludeId) continue;
    if (app.status === 'rejected') continue;
    if (!checkPending && app.status === 'pending') continue;

    if (isTimeOverlap(startTime, endTime, app.startTime, app.endTime)) {
      if (app.roomId === roomId) {
        roomConflicts.push(roomId);
        details.push({
          type: 'room',
          message: `机房时段冲突：${app.applicantName} 的申请`,
          applicationId: app.id,
          applicantName: app.applicantName,
        });
      }

      for (const escortId of escorts) {
        if (app.escorts.includes(escortId)) {
          if (!escortShortages.includes(escortId)) {
            escortShortages.push(escortId);
            details.push({
              type: 'escort',
              message: `陪同人员冲突：该时段已有安排`,
              applicationId: app.id,
              applicantName: app.applicantName,
            });
          }
        }
      }
    }
  }

  const uniqueRoomConflicts = [...new Set(roomConflicts)];
  const uniqueEscortShortages = [...new Set(escortShortages)];

  return {
    hasConflict: uniqueRoomConflicts.length > 0 || uniqueEscortShortages.length > 0 || sourceConflicts.length > 0,
    roomConflicts: uniqueRoomConflicts,
    escortShortages: uniqueEscortShortages,
    sourceConflicts,
    details,
  };
}
