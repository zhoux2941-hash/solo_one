import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact, GroupBy, ContactFilter, DuplicateGroup, DedupConfig } from '../types/contact';
import { contactDeduplicator } from '../utils/deduplicator';

interface ContactState {
  contacts: Contact[];
  selectedIds: Set<string>;
  searchQuery: string;
  groupBy: GroupBy;
  filter: ContactFilter;
  duplicateGroups: DuplicateGroup[];
  dedupConfig: DedupConfig;
  isLoading: boolean;
  
  addContacts: (contacts: Contact[], autoDedupe?: boolean) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContacts: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  setSearchQuery: (query: string) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setFilter: (filter: Partial<ContactFilter>) => void;
  setDedupConfig: (config: Partial<DedupConfig>) => void;
  findDuplicates: () => void;
  mergeDuplicate: (groupId: string) => void;
  mergeAllDuplicates: () => void;
  deduplicateAll: () => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultDedupConfig: DedupConfig = {
  strategy: 'phone-first',
  checkPhone: true,
  checkEmail: true,
  checkNameOrg: false,
};

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: [],
      selectedIds: new Set<string>(),
      searchQuery: '',
      groupBy: 'none',
      filter: {},
      duplicateGroups: [],
      dedupConfig: defaultDedupConfig,
      isLoading: false,

      addContacts: (newContacts, autoDedupe = true) => {
        const currentContacts = get().contacts;
        let allContacts = [...currentContacts, ...newContacts];
        const dedupConfig = get().dedupConfig;
        
        if (autoDedupe) {
          const { result } = contactDeduplicator.deduplicate(allContacts, dedupConfig);
          allContacts = result;
        }

        set({
          contacts: allContacts,
          duplicateGroups: contactDeduplicator.findDuplicates(allContacts, dedupConfig),
        });
      },

      updateContact: (id, updates) => {
        const dedupConfig = get().dedupConfig;
        set(state => {
          const newContacts = state.contacts.map(c => 
            c.id === id ? { ...c, ...updates } : c
          );
          return {
            contacts: newContacts,
            duplicateGroups: contactDeduplicator.findDuplicates(newContacts, dedupConfig),
          };
        });
      },

      deleteContacts: (ids) => {
        const idSet = new Set(ids);
        set(state => ({
          contacts: state.contacts.filter(c => !idSet.has(c.id)),
          selectedIds: new Set([...state.selectedIds].filter(id => !idSet.has(id))),
        }));
        get().findDuplicates();
      },

      toggleSelect: (id) => {
        set(state => {
          const newSelected = new Set(state.selectedIds);
          if (newSelected.has(id)) {
            newSelected.delete(id);
          } else {
            newSelected.add(id);
          }
          return { selectedIds: newSelected };
        });
      },

      selectAll: (ids) => {
        set({ selectedIds: new Set(ids) });
      },

      deselectAll: () => {
        set({ selectedIds: new Set() });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setGroupBy: (groupBy) => {
        set({ groupBy });
      },

      setFilter: (filter) => {
        set(state => ({ filter: { ...state.filter, ...filter } }));
      },

      setDedupConfig: (config) => {
        set(state => {
          const newConfig = { ...state.dedupConfig, ...config };
          return {
            dedupConfig: newConfig,
            duplicateGroups: contactDeduplicator.findDuplicates(state.contacts, newConfig),
          };
        });
      },

      findDuplicates: () => {
        const dedupConfig = get().dedupConfig;
        const duplicates = contactDeduplicator.findDuplicates(get().contacts, dedupConfig);
        set({ duplicateGroups: duplicates });
      },

      mergeDuplicate: (groupId) => {
        const group = get().duplicateGroups.find(g => g.id === groupId);
        if (!group) return;

        const dedupConfig = get().dedupConfig;
        const merged = contactDeduplicator.mergeContacts(group.contacts, dedupConfig.strategy);
        const toRemove = new Set(group.contacts.map(c => c.id));

        set(state => ({
          contacts: [
            merged,
            ...state.contacts.filter(c => !toRemove.has(c.id)),
          ],
          duplicateGroups: state.duplicateGroups.filter(g => g.id !== groupId),
        }));
      },

      mergeAllDuplicates: () => {
        const dedupConfig = get().dedupConfig;
        const duplicates = get().duplicateGroups;
        let contacts = [...get().contacts];

        for (const group of duplicates) {
          const merged = contactDeduplicator.mergeContacts(group.contacts, dedupConfig.strategy);
          const toRemove = new Set(group.contacts.map(c => c.id));
          contacts = [merged, ...contacts.filter(c => !toRemove.has(c.id))];
        }

        set({
          contacts,
          duplicateGroups: [],
        });
      },

      deduplicateAll: () => {
        const dedupConfig = get().dedupConfig;
        const { result } = contactDeduplicator.deduplicate(get().contacts, dedupConfig);
        set({
          contacts: result,
          duplicateGroups: [],
        });
      },

      clearAll: () => {
        set({
          contacts: [],
          selectedIds: new Set(),
          duplicateGroups: [],
          searchQuery: '',
          filter: {},
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'vcard-contacts-storage',
      partialize: (state) => ({ contacts: state.contacts, dedupConfig: state.dedupConfig }),
    }
  )
);

export const useFilteredContacts = () => {
  const { contacts, searchQuery, filter, groupBy } = useContactStore();
  
  const filtered = contacts.filter(contact => {
    if (filter.organization && contact.organization !== filter.organization) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = contact.fullName.toLowerCase().includes(query);
      const matchPhone = contact.phones.some(p => p.number.includes(query));
      const matchEmail = contact.emails.some(e => e.address.toLowerCase().includes(query));
      const matchOrg = contact.organization?.toLowerCase().includes(query);
      
      if (!matchName && !matchPhone && !matchEmail && !matchOrg) {
        return false;
      }
    }

    return true;
  });

  if (groupBy === 'organization') {
    const groups: Record<string, Contact[]> = {};
    const ungrouped: Contact[] = [];

    for (const contact of filtered) {
      if (contact.organization) {
        if (!groups[contact.organization]) {
          groups[contact.organization] = [];
        }
        groups[contact.organization].push(contact);
      } else {
        ungrouped.push(contact);
      }
    }

    return { groups, ungrouped, isGrouped: true };
  }

  return { contacts: filtered, isGrouped: false };
};
