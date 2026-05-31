import { ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useFilteredContacts, useContactStore } from '../../store/contactStore';
import ContactCard from './ContactCard';
import SearchBar from './SearchBar';
import Button from '../common/Button';
import ContactEditorModal from './ContactEditorModal';

export default function ContactList() {
  const filtered = useFilteredContacts();
  const { contacts } = useContactStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showEditor, setShowEditor] = useState(false);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <UserPlus className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
          还没有联系人
        </h2>
        <p className="text-slate-500 text-center mb-6 max-w-md">
          点击顶部的「导入 vCard」按钮开始导入您的联系人，或者手动创建新联系人。
        </p>
        <Button onClick={() => setShowEditor(true)}>
          <UserPlus className="w-4 h-4" />
          新建联系人
        </Button>
        <ContactEditorModal 
          isOpen={showEditor} 
          onClose={() => setShowEditor(false)} 
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar />
          </div>
          <Button size="sm" onClick={() => setShowEditor(true)}>
            <UserPlus className="w-4 h-4" />
            新建
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {filtered.isGrouped ? (
          <div className="space-y-6">
            {Object.entries(filtered.groups || {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([org, groupContacts]) => (
                <div key={org}>
                  <button
                    onClick={() => toggleGroup(org)}
                    className="flex items-center gap-2 w-full text-left mb-3"
                  >
                    {expandedGroups.has(org) ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="font-semibold text-slate-700">{org}</span>
                    <span className="text-sm text-slate-400">
                      ({groupContacts.length})
                    </span>
                  </button>
                  {expandedGroups.has(org) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-7">
                      {groupContacts.map(contact => (
                        <ContactCard key={contact.id} contact={contact} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            
            {filtered.ungrouped && filtered.ungrouped.length > 0 && (
              <div>
                <button
                  onClick={() => toggleGroup('__ungrouped__')}
                  className="flex items-center gap-2 w-full text-left mb-3"
                >
                  {expandedGroups.has('__ungrouped__') ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="font-semibold text-slate-700">未分组</span>
                  <span className="text-sm text-slate-400">
                    ({filtered.ungrouped.length})
                  </span>
                </button>
                {expandedGroups.has('__ungrouped__') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-7">
                    {filtered.ungrouped.map(contact => (
                      <ContactCard key={contact.id} contact={contact} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.contacts?.map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        )}

        {filtered.isGrouped 
          ? Object.keys(filtered.groups || {}).length === 0 && (!filtered.ungrouped || filtered.ungrouped.length === 0)
          : filtered.contacts?.length === 0
        }
      </div>

      <ContactEditorModal 
        isOpen={showEditor} 
        onClose={() => setShowEditor(false)} 
      />
    </div>
  );
}
