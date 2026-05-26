import { useEffect, useState } from 'react';
import { Calendar, MapPin, Sparkles, Bell } from 'lucide-react';
import { StudentLayout } from '@/components/Layouts';
import StatusChip from '@/components/StatusChip';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import type { Application, Notification } from '@/types';

const STEPS: { key: string; label: string }[] = [
  { key: 'submitted', label: '已提交报名' },
  { key: 'approved', label: '通过筛选' },
  { key: 'interview', label: '面试安排已生成' },
  { key: 'admitted', label: '已录取' },
];

function reached(status: string, key: string) {
  const effective: Record<string, string> = {
    submitted: 'submitted',
    approved: 'approved',
    interview: 'interview',
    admitted: 'admitted',
    failed: 'interview',
    rejected: 'submitted',
    pending: 'interview',
  };
  const order = ['submitted', 'approved', 'interview', 'admitted'];
  const a = order.indexOf(effective[status] || status);
  const b = order.indexOf(key);
  return b <= a;
}

export default function StudentStatus() {
  const { studentId } = useAppStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ applications: Application[] }>(
      `/api/applications/my?studentId=${studentId}`,
    ),
      api<{ notifications: Notification[] }>(
      `/api/notifications/my?studentId=${studentId}`,
    ),
    ])
      .then(([appRes, notifRes]) => {
        setApplications(appRes.applications);
        setNotifications(notifRes.notifications);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center text-ink-500 py-20">加载中…</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <h1 className="font-serif text-3xl text-ink-800">报名状态</h1>
      <p className="text-sm text-ink-500 mt-1">
        查看你所有报名记录的最新状态与面试信息。
      </p>

      {notifications.length > 0 && (
        <div className="mt-6">
          <h2 className="font-serif text-xl text-ink-800 flex items-center gap-2">
            <Bell size={18} className="text-gold-500" /> 录取通知
          </h2>
          <div className="mt-3 space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="card border-l-4 border-gold-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-ink-900">{n.title}</div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      来自 {n.club?.name} ·{' '}
                      {new Date(n.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-ink-700">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="mt-10 card text-center py-16">
          <Sparkles className="mx-auto text-gold-500" size={32} />
          <div className="mt-4 text-ink-700 font-medium">你还没有提交任何报名</div>
          <p className="text-sm text-ink-500 mt-2">
            去填写一份报名表，开启你的社团之旅吧。
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-2xl text-ink-800">
                      {app.club1?.name}
                    </h2>
                    {app.club2 && (
                      <span className="text-sm text-ink-500">
                        （第二志愿：{app.club2.name}）
                      </span>
                    )}
                    <StatusChip status={app.status} />
                  </div>
                  <p className="text-sm text-ink-500 mt-1">
                    {app.college} · {app.studentId} · 提交于{' '}
                    {new Date(app.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-[1fr_320px] gap-6">
                <div>
                  <div className="text-sm text-ink-600 mb-3">进度时间线</div>
                  <ol className="relative border-l-2 border-ink-500/20 pl-6 space-y-5">
                    {STEPS.map((s, idx) => {
                      const done = reached(app.status, s.key);
                      const isFinal =
                        (app.status === 'failed' && s.key === 'admitted') ||
                        (app.status === 'rejected' && s.key === 'approved');
                      return (
                        <li key={s.key} className="relative">
                          <span
                            className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              done
                                ? 'bg-gold-500 text-ink-900'
                                : 'bg-cream-100 text-ink-500 border border-ink-500/30'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div
                            className={`font-medium ${
                              done ? 'text-ink-900' : 'text-ink-500'
                            }`}
                          >
                            {s.label}
                          </div>
                          {isFinal && (
                            <div className="text-xs text-rose-500 mt-0.5">
                              流程已结束
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {app.slot && app.interview && (
                  <div className="bg-gradient-to-br from-gold-300/40 to-gold-500/20 border border-gold-500/40 rounded-xl p-5">
                    <div className="text-sm text-ink-600 font-medium">
                      面试安排
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-ink-800">
                      <Calendar size={16} className="mt-1" />
                      <div>
                        <div className="font-medium">{app.slot.date}</div>
                        <div className="text-sm text-ink-600">
                          {app.slot.startTime} - {app.slot.endTime}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-start gap-2 text-ink-800">
                      <MapPin size={16} className="mt-1" />
                      <div className="text-sm">{app.slot.location}</div>
                    </div>
                    {app.interview.result && (
                      <div className="mt-4 text-sm text-ink-600 border-t border-gold-500/30 pt-3">
                        面试结果：
                        <span className="font-medium text-ink-900 ml-1">
                          {app.interview.result === 'pass'
                            ? '通过'
                            : app.interview.result === 'pending'
                            ? '待定'
                            : '不通过'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <details className="mt-5 text-sm">
                <summary className="cursor-pointer text-ink-600 hover:text-ink-800">
                  查看自我介绍
                </summary>
                <p className="mt-2 text-ink-700 whitespace-pre-wrap bg-cream-100/60 rounded-lg p-3">
                  {app.intro}
                </p>
              </details>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
