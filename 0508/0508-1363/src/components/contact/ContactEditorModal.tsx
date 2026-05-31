import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { Contact, Phone, Email, Address } from '../../types/contact';
import { useContactStore } from '../../store/contactStore';

interface ContactEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
}

const phoneTypes = ['mobile', 'home', 'work', 'other'];
const emailTypes = ['home', 'work', 'other'];
const addressTypes = ['home', 'work', 'other'];

export default function ContactEditorModal({ isOpen, onClose, contact }: ContactEditorModalProps) {
  const { addContacts, updateContact } = useContactStore();
  const [formData, setFormData] = useState<Partial<Contact>>({
    firstName: '',
    lastName: '',
    fullName: '',
    phones: [],
    emails: [],
    addresses: [],
    organization: '',
    title: '',
    birthday: '',
    note: '',
  });

  useEffect(() => {
    if (contact) {
      setFormData({ ...contact });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        fullName: '',
        phones: [{ type: 'mobile', number: '' }],
        emails: [{ type: 'work', address: '' }],
        addresses: [{ type: 'work', street: '', city: '', region: '', postalCode: '', country: '' }],
        organization: '',
        title: '',
        birthday: '',
        note: '',
      });
    }
  }, [contact, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullName = formData.fullName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
    
    const contactData: Contact = {
      id: contact?.id || Math.random().toString(36).substring(2, 15),
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      fullName: fullName || '未命名联系人',
      phones: (formData.phones || []).filter(p => p.number),
      emails: (formData.emails || []).filter(e => e.address),
      addresses: (formData.addresses || []).filter(a => a.street || a.city || a.postalCode),
      organization: formData.organization,
      title: formData.title,
      birthday: formData.birthday,
      note: formData.note,
    };

    if (contact) {
      updateContact(contact.id, contactData);
    } else {
      addContacts([contactData], false);
    }

    onClose();
  };

  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [...(prev.phones || []), { type: 'other', number: '' }],
    }));
  };

  const updatePhone = (index: number, field: keyof Phone, value: string) => {
    setFormData(prev => {
      const newPhones = [...(prev.phones || [])];
      newPhones[index] = { ...newPhones[index], [field]: value };
      return { ...prev, phones: newPhones };
    });
  };

  const removePhone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phones: (prev.phones || []).filter((_, i) => i !== index),
    }));
  };

  const addEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...(prev.emails || []), { type: 'other', address: '' }],
    }));
  };

  const updateEmail = (index: number, field: keyof Email, value: string) => {
    setFormData(prev => {
      const newEmails = [...(prev.emails || [])];
      newEmails[index] = { ...newEmails[index], [field]: value };
      return { ...prev, emails: newEmails };
    });
  };

  const removeEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emails: (prev.emails || []).filter((_, i) => i !== index),
    }));
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), { type: 'other', street: '', city: '', region: '', postalCode: '', country: '' }],
    }));
  };

  const updateAddress = (index: number, field: keyof Address, value: string) => {
    setFormData(prev => {
      const newAddresses = [...(prev.addresses || [])];
      newAddresses[index] = { ...newAddresses[index], [field]: value };
      return { ...prev, addresses: newAddresses };
    });
  };

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: (prev.addresses || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={contact ? '编辑联系人' : '新建联系人'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="姓"
            value={formData.lastName || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
          />
          <Input
            label="名"
            value={formData.firstName || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
          />
        </div>

        <Input
          label="全名"
          value={formData.fullName || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder="如未填写，将自动从姓和名生成"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">电话</label>
            <button
              type="button"
              onClick={addPhone}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
          {(formData.phones || []).map((phone, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={phone.type}
                onChange={(e) => updatePhone(index, 'type', e.target.value)}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {phoneTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Input
                placeholder="电话号码"
                value={phone.number}
                onChange={(e) => updatePhone(index, 'number', e.target.value)}
                className="flex-1"
              />
              {(formData.phones || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">邮箱</label>
            <button
              type="button"
              onClick={addEmail}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
          {(formData.emails || []).map((email, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={email.type}
                onChange={(e) => updateEmail(index, 'type', e.target.value)}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {emailTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Input
                placeholder="邮箱地址"
                type="email"
                value={email.address}
                onChange={(e) => updateEmail(index, 'address', e.target.value)}
                className="flex-1"
              />
              {(formData.emails || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmail(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">地址</label>
            <button
              type="button"
              onClick={addAddress}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
          {(formData.addresses || []).map((address, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={address.type}
                  onChange={(e) => updateAddress(index, 'type', e.target.value)}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {addressTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {(formData.addresses || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Input
                label="街道"
                value={address.street || ''}
                onChange={(e) => updateAddress(index, 'street', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="城市"
                  value={address.city || ''}
                  onChange={(e) => updateAddress(index, 'city', e.target.value)}
                />
                <Input
                  label="省份/州"
                  value={address.region || ''}
                  onChange={(e) => updateAddress(index, 'region', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="邮编"
                  value={address.postalCode || ''}
                  onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                />
                <Input
                  label="国家"
                  value={address.country || ''}
                  onChange={(e) => updateAddress(index, 'country', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="组织"
            value={formData.organization || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
          />
          <Input
            label="职位"
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <Input
          label="生日"
          type="date"
          value={formData.birthday || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
          <textarea
            value={formData.note || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none h-24"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" variant="primary">
            {contact ? '保存修改' : '创建联系人'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
