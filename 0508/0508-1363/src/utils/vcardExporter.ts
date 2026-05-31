import { Contact } from '../types/contact';

export class VCardExporter {
  private formatVCardField(name: string, params: string, value: string): string {
    return `${name}${params}:${value}\r\n`;
  }

  private escapeValue(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
  }

  private contactToVCard(contact: Contact): string {
    let vcard = 'BEGIN:VCARD\r\n';
    vcard += 'VERSION:3.0\r\n';

    vcard += this.formatVCardField(
      'N',
      '',
      `${this.escapeValue(contact.lastName)};${this.escapeValue(contact.firstName)};;;`
    );

    vcard += this.formatVCardField(
      'FN',
      '',
      this.escapeValue(contact.fullName)
    );

    for (const phone of contact.phones) {
      const typeParam = phone.type ? `;TYPE=${phone.type.toUpperCase()}` : '';
      const prefParam = phone.preferred ? ';PREF' : '';
      vcard += this.formatVCardField('TEL', `${typeParam}${prefParam}`, phone.number);
    }

    for (const email of contact.emails) {
      const typeParam = email.type ? `;TYPE=${email.type.toUpperCase()}` : '';
      const prefParam = email.preferred ? ';PREF' : '';
      vcard += this.formatVCardField('EMAIL', `${typeParam}${prefParam}`, email.address);
    }

    for (const address of contact.addresses) {
      const typeParam = address.type ? `;TYPE=${address.type.toUpperCase()}` : '';
      const addrValue = [
        '',
        '',
        address.street || '',
        address.city || '',
        address.region || '',
        address.postalCode || '',
        address.country || '',
      ].map(v => this.escapeValue(v)).join(';');
      vcard += this.formatVCardField('ADR', typeParam, addrValue);
    }

    if (contact.birthday) {
      vcard += this.formatVCardField('BDAY', '', contact.birthday);
    }

    if (contact.organization) {
      vcard += this.formatVCardField('ORG', '', this.escapeValue(contact.organization));
    }

    if (contact.title) {
      vcard += this.formatVCardField('TITLE', '', this.escapeValue(contact.title));
    }

    if (contact.note) {
      vcard += this.formatVCardField('NOTE', '', this.escapeValue(contact.note));
    }

    if (contact.photo) {
      if (contact.photo.startsWith('data:')) {
        const match = contact.photo.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (match) {
          vcard += this.formatVCardField(
            'PHOTO',
            `;ENCODING=b;TYPE=${match[1]}`,
            match[2]
          );
        }
      } else {
        vcard += this.formatVCardField('PHOTO', '', contact.photo);
      }
    }

    vcard += 'END:VCARD\r\n';
    return vcard;
  }

  public export(contacts: Contact[]): string {
    return contacts.map(c => this.contactToVCard(c)).join('\r\n');
  }

  public download(contacts: Contact[], filename: string = 'contacts.vcf'): void {
    const content = this.export(contacts);
    const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
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

export const vcardExporter = new VCardExporter();
