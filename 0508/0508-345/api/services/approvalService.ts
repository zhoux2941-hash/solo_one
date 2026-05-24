import { applications, updateApplication } from '../data/store.js';
import { RadiationSourceApplication, ConflictResult } from '../../shared/types.js';
import { checkConflicts } from './conflictService.js';

export interface ApprovalResult {
  success: boolean;
  application?: RadiationSourceApplication;
  conflict?: ConflictResult;
  error?: string;
}

export function approveApplication(id: string): ApprovalResult {
  const app = applications.find(a => a.id === id);
  if (!app) {
    return { success: false, error: '申请不存在' };
  }
  
  const conflict = checkConflicts(
    app.startTime,
    app.endTime,
    app.roomId,
    app.escorts,
    id,
    false
  );
  
  if (conflict.hasConflict) {
    return { success: false, conflict, error: '审批失败：检测到资源冲突' };
  }
  
  const updated = updateApplication(id, { status: 'approved' });
  return { success: true, application: updated };
}

export function rejectApplication(id: string, reason: string): RadiationSourceApplication | null {
  const app = applications.find(a => a.id === id);
  if (!app) return null;
  return updateApplication(id, { status: 'rejected', rejectReason: reason });
}
