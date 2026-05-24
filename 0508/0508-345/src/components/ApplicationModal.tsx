import { useState, useEffect } from 'react';
import { X, Save, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { applicationApi, conflictApi } from '@/services/api';
import { RADIATION_SOURCES } from '../../shared/types';

export function ApplicationModal() {
  const {
    selectedApplication,
    showEditModal,
    setShowEditModal,
    setSelectedApplication,
    setCurrentConflict,
    addApplication,
    updateApplication,
    removeApplication,
    setError,
    rooms,
    escorts,
    currentConflict,
  } = useAppStore();

  const [formData, setFormData] = useState({
    applicantName: '',
    sourceType: '',
    roomId: '',
    startTime: '',
    endTime: '',
    escorts: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [approvalConflict, setApprovalConflict] = useState<any>(null);

  const isEdit = selectedApplication?.id && selectedApplication.id !== '';

  useEffect(() => {
    if (selectedApplication && showEditModal) {
      setFormData({
        applicantName: selectedApplication.applicantName,
        sourceType: selectedApplication.sourceType,
        roomId: selectedApplication.roomId,
        startTime: selectedApplication.startTime.slice(0, 16),
        endTime: selectedApplication.endTime.slice(0, 16),
        escorts: selectedApplication.escorts,
      });
      setCurrentConflict(null);
    }
  }, [selectedApplication, showEditModal, setCurrentConflict]);

  useEffect(() => {
    if (
      formData.startTime &&
      formData.endTime &&
      formData.roomId &&
      formData.escorts.length > 0
    ) {
      const timer = setTimeout(async () => {
        setIsCheckingConflict(true);
        try {
          const result = await conflictApi.check({
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString(),
            roomId: formData.roomId,
            escorts: formData.escorts,
            excludeId: isEdit ? selectedApplication?.id : undefined,
          });
          setCurrentConflict(result);
        } catch {
          // Ignore error
        } finally {
          setIsCheckingConflict(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCurrentConflict(null);
    }
  }, [
    formData.startTime,
    formData.endTime,
    formData.roomId,
    formData.escorts,
    isEdit,
    selectedApplication?.id,
    setCurrentConflict,
  ]);

  const handleClose = () => {
    setShowEditModal(false);
    setSelectedApplication(null);
    setCurrentConflict(null);
    setShowRejectInput(false);
    setRejectReason('');
    setApprovalConflict(null);
  };

  const handleEscortToggle = (escortId: string) => {
    setFormData((prev) => ({
      ...prev,
      escorts: prev.escorts.includes(escortId)
        ? prev.escorts.filter((id) => id !== escortId)
        : [...prev.escorts, escortId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.sourceType || !formData.roomId || formData.escorts.length === 0) {
      setError('请填写完整信息');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        applicantId: 'current-user',
        applicantName: formData.applicantName || '当前用户',
        sourceType: formData.sourceType,
        roomId: formData.roomId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        escorts: formData.escorts,
      };

      if (isEdit) {
        const updated = await applicationApi.update(selectedApplication!.id, data);
        updateApplication(updated);
      } else {
        const newApp = await applicationApi.create(data);
        addApplication(newApp);
      }
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;
    setIsSubmitting(true);
    setApprovalConflict(null);
    try {
      const updated = await applicationApi.approve(selectedApplication.id);
      updateApplication(updated);
      handleClose();
    } catch (err: any) {
      if (err.conflict) {
        setApprovalConflict(err.conflict);
        setCurrentConflict(err.conflict);
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectReason) return;
    setIsSubmitting(true);
    try {
      const updated = await applicationApi.reject(selectedApplication.id, rejectReason);
      updateApplication(updated);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedApplication) return;
    setIsSubmitting(true);
    try {
      await applicationApi.delete(selectedApplication.id);
      removeApplication(selectedApplication.id);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {isEdit ? '编辑申请' : '新建放射源申请'}
            </h2>
            {selectedApplication?.status && (
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                  selectedApplication.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : selectedApplication.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {selectedApplication.status === 'approved'
                  ? '已通过'
                  : selectedApplication.status === 'rejected'
                  ? '已驳回'
                  : '待审批'}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申请人
              </label>
              <input
                type="text"
                value={formData.applicantName}
                onChange={(e) =>
                  setFormData({ ...formData, applicantName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                放射源类型
              </label>
              <select
                value={formData.sourceType}
                onChange={(e) =>
                  setFormData({ ...formData, sourceType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">请选择</option>
                {RADIATION_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择机房
            </label>
            <div className="grid grid-cols-3 gap-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  disabled={room.status === 'maintenance'}
                  onClick={() => setFormData({ ...formData, roomId: room.id })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.roomId === room.id
                      ? 'border-teal-500 bg-teal-50'
                      : room.status === 'maintenance'
                      ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">
                    {room.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {room.status === 'maintenance' ? '维护中' : '可用'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {approvalConflict && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                审批失败：检测到资源冲突
              </div>
              <p className="text-xs text-red-600">
                该时段与已批准的申请冲突，请调整时段后重新提交审批
              </p>
            </div>
          )}

          {isCheckingConflict && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700">正在检测资源冲突...</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始时间
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束时间
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              陪同人员 (至少选择1人)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {escorts.map((escort) => (
                <button
                  key={escort.id}
                  type="button"
                  onClick={() => handleEscortToggle(escort.id)}
                  className={`p-2 rounded-lg border-2 text-center transition-all ${
                    formData.escorts.includes(escort.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">
                    {escort.name}
                  </div>
                  <div className="text-xs text-gray-500">{escort.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50">
          {showRejectInput ? (
            <div className="mb-4">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {isEdit && selectedApplication?.status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    通过
                  </button>
                  <button
                    onClick={() => setShowRejectInput(!showRejectInput)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {showRejectInput ? '取消' : '驳回'}
                  </button>
                  {showRejectInput && (
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting || !rejectReason}
                      className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
                    >
                      确认驳回
                    </button>
                  )}
                </>
              )}
              {isEdit && (
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
