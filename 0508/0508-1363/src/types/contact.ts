export interface Phone {
  type: string;
  number: string;
  preferred?: boolean;
}

export interface Email {
  type: string;
  address: string;
  preferred?: boolean;
}

export interface Address {
  type: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phones: Phone[];
  emails: Email[];
  addresses: Address[];
  birthday?: string;
  organization?: string;
  title?: string;
  note?: string;
  photo?: string;
}

export interface VCardField {
  name: string;
  params: Record<string, string>;
  value: string;
}

export interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  reason: 'phone' | 'email' | 'name-org';
}

export type GroupBy = 'none' | 'organization';

export type DedupStrategy = 'phone-first' | 'email-first' | 'richest-first';

export interface ContactFilter {
  organization?: string;
}

export interface DedupConfig {
  strategy: DedupStrategy;
  checkPhone: boolean;
  checkEmail: boolean;
  checkNameOrg: boolean;
}
