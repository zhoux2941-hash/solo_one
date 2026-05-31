import { useState } from 'react';
import { 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  MapPin, 
  Edit2, 
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Contact } from '../../types/contact';
import { useContactStore } from '../../store/contactStore';
import ContactEditorModal from './ContactEditorModal';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

interface ContactCardProps {
  contact: Contact;
}

export default function ContactCard({ contact }: ContactCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toggleSelect, selectedIds, deleteContacts } = useContactStore();
  const isSelected = selectedIds.has(contact.id);

  const primaryPhone = contact.phones[0];
  const primaryEmail = contact.emails[0];
  const primaryAddress = contact.addresses[0];

  const handleDelete = () => {
    if (confirm(`确定要删除 ${contact.fullName} 吗？`)) {
      deleteContacts([contact.id]);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div 
        className={`
          card p-4 hover:shadow-md transition-all duration-200 cursor-pointer group
          ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''}
        `}
        onClick={() => toggleSelect(contact.id)}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {contact.photo ? (
              <img src={contact.photo} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(contact.fullName)
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 truncate">
                  {contact.fullName}
                </h3>
                {contact.organization && (
                  <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {contact.organization}
                    {contact.title && ` · ${contact.title}`}
                  </p>
                )}
              </div>
              
              <Menu>
                <MenuButton 
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
                >
                  <MoreHorizontal className="w-5 h-5 text-slate-400" />
                </MenuButton>
                <MenuItems className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                  <MenuItem>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      编辑
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>

            <div className="mt-3 space-y-1.5">
              {primaryPhone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{primaryPhone.number}</span>
                  <span className="text-xs text-slate-400">({primaryPhone.type})</span>
                </div>
              )}
              
              {primaryEmail && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{primaryEmail.address}</span>
                </div>
              )}
              
              {primaryAddress && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">
                    {[primaryAddress.street, primaryAddress.city, primaryAddress.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              
              {contact.birthday && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{contact.birthday}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ContactEditorModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        contact={contact}
      />
    </>
  );
}
