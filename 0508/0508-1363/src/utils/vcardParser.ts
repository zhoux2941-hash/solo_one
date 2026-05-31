import { Contact, Address, VCardField } from '../types/contact';

export class VCardParser {
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private decodeQuotedPrintable(value: string): string {
    return value
      .replace(/=(\r\n|\r|\n)/g, '')
      .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  private decodeBase64(value: string): string {
    try {
      return atob(value);
    } catch {
      return value;
    }
  }

  private parseLine(line: string): VCardField | null {
    if (!line || line.startsWith('BEGIN:') || line.startsWith('END:')) {
      return null;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return null;

    const namePart = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    const semicolonIndex = namePart.indexOf(';');
    let name: string;
    const params: Record<string, string> = {};

    if (semicolonIndex === -1) {
      name = namePart.toUpperCase();
    } else {
      name = namePart.substring(0, semicolonIndex).toUpperCase();
      const paramParts = namePart.substring(semicolonIndex + 1).split(';');
      
      paramParts.forEach(param => {
        const equalsIndex = param.indexOf('=');
        if (equalsIndex !== -1) {
          const key = param.substring(0, equalsIndex).toUpperCase();
          const val = param.substring(equalsIndex + 1);
          params[key] = val;
        } else {
          params[param.toUpperCase()] = param;
        }
      });
    }

    return { name, params, value };
  }

  private normalizePhone(number: string): string {
    return number.replace(/[\s\-\(\)]/g, '');
  }

  private parsePhoneType(params: Record<string, string>): string {
    if (params['TYPE']) {
      return params['TYPE'].toLowerCase().replace(/[^a-z]/g, '');
    }
    if (params['CELL']) return 'mobile';
    if (params['WORK']) return 'work';
    if (params['HOME']) return 'home';
    return 'other';
  }

  private parseEmailType(params: Record<string, string>): string {
    if (params['TYPE']) {
      return params['TYPE'].toLowerCase();
    }
    if (params['WORK']) return 'work';
    if (params['HOME']) return 'home';
    return 'other';
  }

  private parseAddressType(params: Record<string, string>): string {
    if (params['TYPE']) {
      return params['TYPE'].toLowerCase();
    }
    if (params['WORK']) return 'work';
    if (params['HOME']) return 'home';
    return 'other';
  }

  private parseAddress(value: string): Partial<Address> {
    const parts = value.split(';');
    return {
      street: parts[2] || undefined,
      city: parts[3] || undefined,
      region: parts[4] || undefined,
      postalCode: parts[5] || undefined,
      country: parts[6] || undefined,
    };
  }

  private parseName(value: string): { lastName: string; firstName: string } {
    const parts = value.split(';');
    return {
      lastName: parts[0] || '',
      firstName: parts[1] || '',
    };
  }

  public parse(content: string): Contact[] {
    const contacts: Contact[] = [];

    const normalized = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    const unfolded = normalized.replace(/\n[ \t]/g, '');

    const lines = unfolded.split('\n');

    let currentContact: Partial<Contact> | null = null;
    let encoding: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const trimmed = line.trimEnd();

      if (trimmed === 'BEGIN:VCARD') {
        currentContact = {
          id: this.generateId(),
          firstName: '',
          lastName: '',
          fullName: '',
          phones: [],
          emails: [],
          addresses: [],
        };
        encoding = null;
        continue;
      }

      if (trimmed === 'END:VCARD') {
        if (currentContact && currentContact.fullName) {
          contacts.push(currentContact as Contact);
        }
        currentContact = null;
        continue;
      }

      if (!currentContact) continue;

      const field = this.parseLine(trimmed);
      if (!field) continue;

      if (field.params['ENCODING']) {
        encoding = field.params['ENCODING'].toUpperCase();
      }

      let fieldValue = field.value;
      if (encoding === 'QUOTED-PRINTABLE' || field.params['QUOTED-PRINTABLE'] !== undefined) {
        fieldValue = this.decodeQuotedPrintable(fieldValue);
      } else if (encoding === 'BASE64' || field.params['BASE64'] !== undefined) {
        fieldValue = this.decodeBase64(fieldValue);
      }

      fieldValue = fieldValue.trimEnd();

      switch (field.name) {
        case 'FN':
          currentContact.fullName = fieldValue;
          break;

        case 'N':
          const nameParts = this.parseName(fieldValue);
          currentContact.lastName = nameParts.lastName;
          currentContact.firstName = nameParts.firstName;
          if (!currentContact.fullName) {
            currentContact.fullName = `${nameParts.firstName} ${nameParts.lastName}`.trim();
          }
          break;

        case 'TEL':
          const phoneType = this.parsePhoneType(field.params);
          const phoneNumber = this.normalizePhone(fieldValue);
          if (phoneNumber) {
            currentContact.phones!.push({
              type: phoneType,
              number: phoneNumber,
              preferred: field.params['PREF'] !== undefined,
            });
          }
          break;

        case 'EMAIL':
          const emailType = this.parseEmailType(field.params);
          if (fieldValue) {
            currentContact.emails!.push({
              type: emailType,
              address: fieldValue.toLowerCase(),
              preferred: field.params['PREF'] !== undefined,
            });
          }
          break;

        case 'ADR':
          const addrType = this.parseAddressType(field.params);
          const address = this.parseAddress(fieldValue);
          if (address.street || address.city || address.postalCode) {
            currentContact.addresses!.push({
              type: addrType,
              ...address,
            } as Address);
          }
          break;

        case 'BDAY':
          currentContact.birthday = fieldValue;
          break;

        case 'ORG':
          currentContact.organization = fieldValue.split(';')[0];
          break;

        case 'TITLE':
          currentContact.title = fieldValue;
          break;

        case 'NOTE':
          currentContact.note = fieldValue;
          break;

        case 'PHOTO':
          if (fieldValue.startsWith('http') || fieldValue.startsWith('data:')) {
            currentContact.photo = fieldValue;
          }
          break;
      }
    }

    return contacts;
  }
}

export const vcardParser = new VCardParser();
