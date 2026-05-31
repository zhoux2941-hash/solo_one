import { Users, Building2, Layers } from 'lucide-react';
import { useContactStore } from '../../store/contactStore';

export default function Sidebar() {
  const { contacts, groupBy, setGroupBy, filter, setFilter } = useContactStore();

  const orgCounts = contacts.reduce((acc, c) => {
    const org = c.organization || '未分组';
    acc[org] = (acc[org] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const organizations = Object.keys(orgCounts).sort();

  const handleOrgClick = (org: string) => {
    if (org === '未分组') {
      setFilter({ organization: filter.organization === '' ? undefined : '' });
    } else {
      setFilter({ organization: filter.organization === org ? undefined : org });
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin">
      <div className="p-4 space-y-6">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            统计
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-3">
              <div className="text-2xl font-bold text-primary-700">{contacts.length}</div>
              <div className="text-xs text-primary-600">联系人总数</div>
            </div>
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-3">
              <div className="text-2xl font-bold text-accent-700">{organizations.length}</div>
              <div className="text-xs text-accent-600">组织数量</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            视图
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setGroupBy('none')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                groupBy === 'none'
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              全部联系人
            </button>
            <button
              onClick={() => setGroupBy('organization')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                groupBy === 'organization'
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              按组织分组
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            组织
          </h3>
          <div className="space-y-1">
            {organizations.map(org => (
              <button
                key={org}
                onClick={() => handleOrgClick(org)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  filter.organization === (org === '未分组' ? '' : org)
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{org}</span>
                </span>
                <span className="text-xs text-slate-400">{orgCounts[org]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
