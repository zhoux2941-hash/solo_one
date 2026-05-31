import { Contact, DuplicateGroup, DedupConfig, DedupStrategy } from '../types/contact';

export class ContactDeduplicator {
  private normalizePhone(number: string): string {
    return number.replace(/[\s\-\(\)\+]/g, '');
  }

  private compareByPhone(a: Contact, b: Contact): boolean {
    const aPhones = a.phones.map(p => this.normalizePhone(p.number)).filter(Boolean);
    const bPhones = b.phones.map(p => this.normalizePhone(p.number)).filter(Boolean);
    
    return aPhones.some(ap => bPhones.includes(ap));
  }

  private compareByEmail(a: Contact, b: Contact): boolean {
    const aEmails = a.emails.map(e => e.address.toLowerCase()).filter(Boolean);
    const bEmails = b.emails.map(e => e.address.toLowerCase()).filter(Boolean);
    
    return aEmails.some(ae => bEmails.includes(ae));
  }

  private compareByNameOrg(a: Contact, b: Contact): boolean {
    if (!a.fullName || !b.fullName) return false;
    
    const aName = a.fullName.toLowerCase().trim();
    const bName = b.fullName.toLowerCase().trim();
    
    if (aName !== bName) return false;
    
    if (a.organization && b.organization) {
      return a.organization.toLowerCase().trim() === b.organization.toLowerCase().trim();
    }
    
    return true;
  }

  private getContactRichness(contact: Contact): number {
    let score = 0;
    
    score += contact.phones.length * 10;
    score += contact.emails.length * 10;
    score += contact.addresses.length * 8;
    
    if (contact.organization) score += 5;
    if (contact.title) score += 3;
    if (contact.birthday) score += 4;
    if (contact.note) score += 2;
    if (contact.photo) score += 3;
    if (contact.firstName) score += 1;
    if (contact.lastName) score += 1;
    
    return score;
  }

  public findDuplicates(contacts: Contact[], config: DedupConfig = {
    strategy: 'phone-first',
    checkPhone: true,
    checkEmail: true,
    checkNameOrg: false,
  }): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const visited = new Set<string>();

    const comparators: Array<{ check: boolean; compare: (a: Contact, b: Contact) => boolean; reason: 'phone' | 'email' | 'name-org' }> = [];

    if (config.strategy === 'phone-first') {
      if (config.checkPhone) comparators.push({ check: true, compare: this.compareByPhone.bind(this), reason: 'phone' });
      if (config.checkEmail) comparators.push({ check: true, compare: this.compareByEmail.bind(this), reason: 'email' });
      if (config.checkNameOrg) comparators.push({ check: true, compare: this.compareByNameOrg.bind(this), reason: 'name-org' });
    } else if (config.strategy === 'email-first') {
      if (config.checkEmail) comparators.push({ check: true, compare: this.compareByEmail.bind(this), reason: 'email' });
      if (config.checkPhone) comparators.push({ check: true, compare: this.compareByPhone.bind(this), reason: 'phone' });
      if (config.checkNameOrg) comparators.push({ check: true, compare: this.compareByNameOrg.bind(this), reason: 'name-org' });
    } else {
      if (config.checkPhone) comparators.push({ check: true, compare: this.compareByPhone.bind(this), reason: 'phone' });
      if (config.checkEmail) comparators.push({ check: true, compare: this.compareByEmail.bind(this), reason: 'email' });
      if (config.checkNameOrg) comparators.push({ check: true, compare: this.compareByNameOrg.bind(this), reason: 'name-org' });
    }

    for (let i = 0; i < contacts.length; i++) {
      if (visited.has(contacts[i].id)) continue;

      const group: Contact[] = [contacts[i]];
      let reason: 'phone' | 'email' | 'name-org' | null = null;

      for (let j = i + 1; j < contacts.length; j++) {
        if (visited.has(contacts[j].id)) continue;

        for (const comparator of comparators) {
          if (comparator.compare(contacts[i], contacts[j])) {
            group.push(contacts[j]);
            visited.add(contacts[j].id);
            reason = comparator.reason;
            break;
          }
        }
      }

      if (group.length > 1 && reason) {
        groups.push({
          id: Math.random().toString(36).substring(2, 15),
          contacts: group,
          reason,
        });
      }
    }

    return groups;
  }

  public mergeContacts(contacts: Contact[], strategy: DedupStrategy = 'phone-first'): Contact {
    if (contacts.length === 0) {
      throw new Error('No contacts to merge');
    }

    let baseContact: Contact;
    
    if (strategy === 'richest-first') {
      baseContact = contacts.reduce((richest, current) => {
        return this.getContactRichness(current) > this.getContactRichness(richest) ? current : richest;
      }, contacts[0]);
    } else {
      baseContact = { ...contacts[0] };
    }

    const base = { ...baseContact };
    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    base.phones = [];
    base.emails = [];
    base.addresses = [];

    for (const contact of contacts) {
      for (const phone of contact.phones) {
        const normalized = this.normalizePhone(phone.number);
        if (!seenPhones.has(normalized)) {
          seenPhones.add(normalized);
          base.phones.push({ ...phone });
        }
      }

      for (const email of contact.emails) {
        const normalized = email.address.toLowerCase();
        if (!seenEmails.has(normalized)) {
          seenEmails.add(normalized);
          base.emails.push({ ...email });
        }
      }

      for (const address of contact.addresses) {
        const addrKey = `${address.street || ''}|${address.city || ''}|${address.postalCode || ''}`;
        if (addrKey && !base.addresses.some(a => 
          `${a.street || ''}|${a.city || ''}|${a.postalCode || ''}` === addrKey
        )) {
          base.addresses.push({ ...address });
        }
      }

      if (!base.birthday && contact.birthday) {
        base.birthday = contact.birthday;
      }

      if (!base.organization && contact.organization) {
        base.organization = contact.organization;
      }

      if (!base.title && contact.title) {
        base.title = contact.title;
      }

      if (!base.note && contact.note) {
        base.note = contact.note;
      }

      if (!base.photo && contact.photo) {
        base.photo = contact.photo;
      }

      if (!base.firstName && contact.firstName) {
        base.firstName = contact.firstName;
      }

      if (!base.lastName && contact.lastName) {
        base.lastName = contact.lastName;
      }
    }

    return base;
  }

  public deduplicate(
    contacts: Contact[],
    config: DedupConfig = {
      strategy: 'phone-first',
      checkPhone: true,
      checkEmail: true,
      checkNameOrg: false,
    }
  ): { 
    result: Contact[]; 
    duplicates: DuplicateGroup[] 
  } {
    const duplicates = this.findDuplicates(contacts, config);
    const toRemove = new Set<string>();

    for (const group of duplicates) {
      const merged = this.mergeContacts(group.contacts, config.strategy);
      
      for (const contact of group.contacts) {
        toRemove.add(contact.id);
      }
      
      contacts.push(merged);
    }

    const result = contacts.filter(c => !toRemove.has(c.id));
    return { result, duplicates };
  }

  public getStrategyLabel(strategy: DedupStrategy): string {
    const labels: Record<DedupStrategy, string> = {
      'phone-first': '电话优先',
      'email-first': '邮箱优先',
      'richest-first': '保留信息最全者',
    };
    return labels[strategy];
  }

  public getStrategyDescription(strategy: DedupStrategy): string {
    const descriptions: Record<DedupStrategy, string> = {
      'phone-first': '先按电话号码匹配重复项，再按邮箱匹配',
      'email-first': '先按邮箱地址匹配重复项，再按电话匹配',
      'richest-first': '匹配所有条件，合并时保留或采用信息最完整的联系人',
    };
    return descriptions[strategy];
  }
}

export const contactDeduplicator = new ContactDeduplicator();
