import { Contact, Address } from '../types/contact';

export class CSVExporter {
  private escapeValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatAddress(address: Address): string {
    const parts = [
      address.street,
      address.city,
      address.region,
      address.postalCode,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  private contactToRow(contact: Contact): string[] {
    const primaryPhone = contact.phones.find(p => p.preferred)?.number || 
                         contact.phones[0]?.number || '';
    
    const primaryEmail = contact.emails.find(e => e.preferred)?.address || 
                         contact.emails[0]?.address || '';
    
    const primaryAddress = contact.addresses[0] ? 
                           this.formatAddress(contact.addresses[0]) : '';

    return [
      contact.fullName,
      contact.firstName,
      contact.lastName,
      primaryPhone,
      contact.phones.map(p => p.number).join('; '),
      primaryEmail,
      contact.emails.map(e => e.address).join('; '),
      contact.organization || '',
      contact.title || '',
      primaryAddress,
      contact.addresses.map(a => this.formatAddress(a)).join('; '),
      contact.birthday || '',
      contact.note || '',
    ];
  }

  public export(contacts: Contact[]): string {
    const headers = [
      '姓名',
      '名',
      '姓',
      '主要电话',
      '所有电话',
      '主要邮箱',
      '所有邮箱',
      '组织',
      '职位',
      '主要地址',
      '所有地址',
      '生日',
      '备注',
    ];

    const rows = contacts.map(c => this.contactToRow(c));
    const allRows = [headers, ...rows];

    return allRows.map(row => row.map(v => this.escapeValue(v)).join(',')).join('\n');
  }

  public download(contacts: Contact[], filename: string = 'contacts.csv'): void {
    const content = this.export(contacts);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

export const csvExporter = new CSVExporter();
