import { create } from "zustand";

export enum SlotStatus {
  EMPTY = "EMPTY",
  OCCUPIED = "OCCUPIED",
  DELETED = "DELETED",
}

export interface HashSlot {
  status: SlotStatus;
  key: number | null;
  hashValue: number | null;
  isClustered: boolean;
}

export interface OperationLog {
  id: number;
  type: "insert" | "delete" | "batch" | "reset" | "rehash";
  description: string;
  timestamp: number;
  probeCount: number;
}

export interface ProbeStep {
  index: number;
  isFinal: boolean;
}

interface HashTableState {
  table: HashSlot[];
  size: number;
  rehashThreshold: number;
  logs: OperationLog[];
  logIdCounter: number;
  probePath: ProbeStep[];
  lastHighlightedIndex: number | null;

  getUsedCount: () => number;
  getDeletedCount: () => number;
  getLoadFactor: () => number;
  getClusterCount: () => number;
  getMaxClusterSize: () => number;
  getAverageProbeLength: () => number;

  reset: (size: number) => void;
  insert: (key: number) => void;
  batchInsert: (count: number) => void;
  remove: (key: number) => void;
  rehash: (newSize: number) => void;
  setRehashThreshold: (threshold: number) => void;
  clearProbePath: () => void;
}

function createEmptyTable(size: number): HashSlot[] {
  return Array.from({ length: size }, () => ({
    status: SlotStatus.EMPTY,
    key: null,
    hashValue: null,
    isClustered: false,
  }));
}

function insertIntoTable(table: HashSlot[], size: number, key: number): { newTable: HashSlot[]; insertIndex: number; probeCount: number } {
  const hashValue = key % size;
  let insertIndex = -1;
  let firstDeletedIndex = -1;
  let probeCount = 0;

  for (let probe = 0; probe < size; probe++) {
    const idx = (hashValue + probe) % size;
    probeCount++;

    if (table[idx].status === SlotStatus.DELETED && firstDeletedIndex === -1) {
      firstDeletedIndex = idx;
    }

    if (table[idx].status === SlotStatus.EMPTY) {
      insertIndex = firstDeletedIndex !== -1 ? firstDeletedIndex : idx;
      break;
    }
  }

  if (insertIndex === -1 && firstDeletedIndex !== -1) {
    insertIndex = firstDeletedIndex;
  }

  if (insertIndex === -1) {
    return { newTable: table, insertIndex: -1, probeCount };
  }

  const newTable = [...table];
  newTable[insertIndex] = {
    status: SlotStatus.OCCUPIED,
    key,
    hashValue,
    isClustered: false,
  };

  return { newTable, insertIndex, probeCount };
}

function detectClusters(table: HashSlot[], size: number): HashSlot[] {
  const newTable = table.map((slot) => ({ ...slot, isClustered: false }));

  let i = 0;
  while (i < size) {
    if (newTable[i].status === SlotStatus.OCCUPIED) {
      let clusterStart = i;
      let clusterLen = 0;
      while (i < size && newTable[i].status === SlotStatus.OCCUPIED) {
        clusterLen++;
        i++;
      }
      if (clusterLen >= 2) {
        for (let j = clusterStart; j < clusterStart + clusterLen; j++) {
          newTable[j].isClustered = true;
        }
      }
    } else {
      i++;
    }
  }

  return newTable;
}

export const useHashTableStore = create<HashTableState>((set, get) => ({
  table: createEmptyTable(10),
  size: 10,
  rehashThreshold: 0.75,
  logs: [],
  logIdCounter: 0,
  probePath: [],
  lastHighlightedIndex: null,

  getUsedCount: () => get().table.filter((s) => s.status === SlotStatus.OCCUPIED).length,
  getDeletedCount: () => get().table.filter((s) => s.status === SlotStatus.DELETED).length,
  getLoadFactor: () => {
    const { table, size } = get();
    const occupied = table.filter((s) => s.status === SlotStatus.OCCUPIED).length;
    const deleted = table.filter((s) => s.status === SlotStatus.DELETED).length;
    return size > 0 ? (occupied + deleted) / size : 0;
  },
  getClusterCount: () => {
    const { table, size } = get();
    let count = 0;
    let i = 0;
    while (i < size) {
      if (table[i].status === SlotStatus.OCCUPIED) {
        let len = 0;
        while (i < size && table[i].status === SlotStatus.OCCUPIED) {
          len++;
          i++;
        }
        if (len >= 2) count++;
      } else {
        i++;
      }
    }
    return count;
  },
  getMaxClusterSize: () => {
    const { table, size } = get();
    let maxCluster = 0;
    let i = 0;
    while (i < size) {
      if (table[i].status === SlotStatus.OCCUPIED) {
        let len = 0;
        while (i < size && table[i].status === SlotStatus.OCCUPIED) {
          len++;
          i++;
        }
        if (len >= 2 && len > maxCluster) maxCluster = len;
      } else {
        i++;
      }
    }
    return maxCluster;
  },
  getAverageProbeLength: () => {
    const { table, size } = get();
    let totalProbe = 0;
    let occupiedCount = 0;
    for (let i = 0; i < size; i++) {
      if (table[i].status === SlotStatus.OCCUPIED && table[i].key !== null && table[i].hashValue !== null) {
        const hashVal = table[i].hashValue!;
        const probeLen = i >= hashVal ? i - hashVal + 1 : (size - hashVal) + i + 1;
        totalProbe += probeLen;
        occupiedCount++;
      }
    }
    return occupiedCount > 0 ? totalProbe / occupiedCount : 0;
  },

  reset: (newSize: number) => {
    const { table, logIdCounter, logs } = get();
    const clamped = Math.max(5, Math.min(50, newSize));

    const validKeys = table
      .filter((s) => s.status === SlotStatus.OCCUPIED && s.key !== null)
      .map((s) => s.key!);

    if (validKeys.length === 0 || clamped === get().size) {
      set((state) => ({
        table: createEmptyTable(clamped),
        size: clamped,
        probePath: [],
        lastHighlightedIndex: null,
        logs: [
          ...state.logs,
          {
            id: state.logIdCounter + 1,
            type: "reset" as const,
            description: `重置哈希表，大小=${clamped}`,
            timestamp: Date.now(),
            probeCount: 0,
          },
        ],
        logIdCounter: state.logIdCounter + 1,
      }));
      return;
    }

    let newTable = createEmptyTable(clamped);
    let totalProbes = 0;

    for (const key of validKeys) {
      const result = insertIntoTable(newTable, clamped, key);
      if (result.insertIndex !== -1) {
        newTable = result.newTable;
        totalProbes += result.probeCount;
      }
    }

    const clusteredTable = detectClusters(newTable, clamped);

    set((state) => ({
      table: clusteredTable,
      size: clamped,
      probePath: [],
      lastHighlightedIndex: null,
      logs: [
        ...state.logs,
        {
          id: state.logIdCounter + 1,
          type: "reset" as const,
          description: `重置哈希表，大小=${clamped}，重新插入${validKeys.length}个有效键，总探测${totalProbes}步`,
          timestamp: Date.now(),
          probeCount: totalProbes,
        },
      ],
      logIdCounter: state.logIdCounter + 1,
    }));
  },

  rehash: (newSize: number) => {
    const { table, size, logIdCounter, logs } = get();
    const clamped = Math.max(5, Math.min(50, newSize));

    const validKeys = table
      .filter((s) => s.status === SlotStatus.OCCUPIED && s.key !== null)
      .map((s) => s.key!);

    if (validKeys.length === 0) {
      set((state) => ({
        table: createEmptyTable(clamped),
        size: clamped,
        probePath: [],
        lastHighlightedIndex: null,
        logs: [
          ...state.logs,
          {
            id: state.logIdCounter + 1,
            type: "rehash" as const,
            description: `Rehash：大小${size}→${clamped}，无有效元素`,
            timestamp: Date.now(),
            probeCount: 0,
          },
        ],
        logIdCounter: state.logIdCounter + 1,
      }));
      return;
    }

    let newTable = createEmptyTable(clamped);
    let totalProbes = 0;

    for (const key of validKeys) {
      const result = insertIntoTable(newTable, clamped, key);
      if (result.insertIndex !== -1) {
        newTable = result.newTable;
        totalProbes += result.probeCount;
      }
    }

    const clusteredTable = detectClusters(newTable, clamped);

    set((state) => ({
      table: clusteredTable,
      size: clamped,
      probePath: [],
      lastHighlightedIndex: null,
      logs: [
        ...state.logs,
        {
          id: state.logIdCounter + 1,
          type: "rehash" as const,
          description: `自动Rehash：大小${size}→${clamped}，重新插入${validKeys.length}个键，总探测${totalProbes}步`,
          timestamp: Date.now(),
          probeCount: totalProbes,
        },
      ],
      logIdCounter: state.logIdCounter + 1,
    }));
  },

  setRehashThreshold: (threshold: number) => {
    const clamped = Math.max(0.5, Math.min(0.9, Math.round(threshold * 100) / 100));
    set({ rehashThreshold: clamped });
  },

  insert: (key: number) => {
    const { table, size, logIdCounter, logs, rehashThreshold } = get();

    const hashValue = key % size;
    const probePath: ProbeStep[] = [];
    let insertIndex = -1;
    let firstDeletedIndex = -1;

    for (let probe = 0; probe < size; probe++) {
      const idx = (hashValue + probe) % size;
      probePath.push({ index: idx, isFinal: false });

      if (table[idx].status === SlotStatus.OCCUPIED && table[idx].key === key) {
        set({
          logs: [
            ...logs,
            {
              id: logIdCounter + 1,
              type: "insert",
              description: `插入 key=${key} 失败：键已存在于位置[${idx}]`,
              timestamp: Date.now(),
              probeCount: probePath.length,
            },
          ],
          logIdCounter: logIdCounter + 1,
          probePath,
        });
        return;
      }

      if (table[idx].status === SlotStatus.DELETED && firstDeletedIndex === -1) {
        firstDeletedIndex = idx;
      }

      if (table[idx].status === SlotStatus.EMPTY) {
        insertIndex = firstDeletedIndex !== -1 ? firstDeletedIndex : idx;
        break;
      }
    }

    if (insertIndex === -1) {
      if (firstDeletedIndex !== -1) {
        insertIndex = firstDeletedIndex;
      } else {
        set({
          logs: [
            ...logs,
            {
              id: logIdCounter + 1,
              type: "insert",
              description: `插入 key=${key} 失败：哈希表已满`,
              timestamp: Date.now(),
              probeCount: probePath.length,
            },
          ],
          logIdCounter: logIdCounter + 1,
          probePath,
        });
        return;
      }
    }

    const finalStepIdx = probePath.findIndex((s) => s.index === insertIndex);
    if (finalStepIdx !== -1) {
      probePath[finalStepIdx].isFinal = true;
    }

    const newTable = [...table];
    newTable[insertIndex] = {
      status: SlotStatus.OCCUPIED,
      key,
      hashValue,
      isClustered: false,
    };
    const clusteredTable = detectClusters(newTable, size);

    const reusedDeleted = firstDeletedIndex !== -1 && insertIndex === firstDeletedIndex;
    const newOccupied = clusteredTable.filter((s) => s.status === SlotStatus.OCCUPIED).length;
    const newDeleted = clusteredTable.filter((s) => s.status === SlotStatus.DELETED).length;
    const newLoadFactor = size > 0 ? (newOccupied + newDeleted) / size : 0;

    set((state) => ({
      table: clusteredTable,
      probePath,
      lastHighlightedIndex: insertIndex,
      logs: [
        ...state.logs,
        {
          id: state.logIdCounter + 1,
          type: "insert",
          description: `插入 key=${key}，h=${hashValue}，探测${probePath.length}步，最终位置[${insertIndex}]${reusedDeleted ? "（复用已删除槽位）" : ""}`,
          timestamp: Date.now(),
          probeCount: probePath.length,
        },
      ],
      logIdCounter: state.logIdCounter + 1,
    }));

    if (newLoadFactor > rehashThreshold) {
      const newSize = Math.min(50, size * 2);
      if (newSize > size) {
        get().rehash(newSize);
      }
    }
  },

  batchInsert: (count: number) => {
    const { size, table, logIdCounter, logs, rehashThreshold } = get();
    const availableSlots = table.filter((s) => s.status === SlotStatus.EMPTY || s.status === SlotStatus.DELETED).length;
    const actualCount = Math.min(count, availableSlots);

    if (actualCount === 0) {
      set({
        logs: [
          ...logs,
          {
            id: logIdCounter + 1,
            type: "batch",
            description: `批量插入失败：哈希表已满`,
            timestamp: Date.now(),
            probeCount: 0,
          },
        ],
        logIdCounter: logIdCounter + 1,
        probePath: [],
      });
      return;
    }

    let currentTable = [...table];
    let totalProbes = 0;
    let insertedKeys: number[] = [];
    const existingKeys = new Set(
      currentTable.filter((s) => s.status === SlotStatus.OCCUPIED).map((s) => s.key!)
    );

    for (let i = 0; i < actualCount; i++) {
      let key: number;
      do {
        key = Math.floor(Math.random() * 1000);
      } while (existingKeys.has(key));
      existingKeys.add(key);

      const hashValue = key % size;
      let probes = 0;
      let insertIndex = -1;
      let firstDeletedIndex = -1;

      for (let probe = 0; probe < size; probe++) {
        const idx = (hashValue + probe) % size;
        probes++;

        if (currentTable[idx].status === SlotStatus.OCCUPIED && currentTable[idx].key === key) {
          insertIndex = -1;
          break;
        }

        if (currentTable[idx].status === SlotStatus.DELETED && firstDeletedIndex === -1) {
          firstDeletedIndex = idx;
        }

        if (currentTable[idx].status === SlotStatus.EMPTY) {
          insertIndex = firstDeletedIndex !== -1 ? firstDeletedIndex : idx;
          break;
        }
      }

      if (insertIndex === -1 && firstDeletedIndex !== -1) {
        insertIndex = firstDeletedIndex;
      }

      if (insertIndex !== -1) {
        currentTable[insertIndex] = {
          status: SlotStatus.OCCUPIED,
          key,
          hashValue,
          isClustered: false,
        };
        totalProbes += probes;
        insertedKeys.push(key);
      }
    }

    const clusteredTable = detectClusters(currentTable, size);

    set((state) => ({
      table: clusteredTable,
      probePath: [],
      lastHighlightedIndex: null,
      logs: [
        ...state.logs,
        {
          id: state.logIdCounter + 1,
          type: "batch",
          description: `批量插入${insertedKeys.length}个键 [${insertedKeys.join(", ")}]，总探测${totalProbes}步`,
          timestamp: Date.now(),
          probeCount: totalProbes,
        },
      ],
      logIdCounter: state.logIdCounter + 1,
    }));

    const newOccupied = clusteredTable.filter((s) => s.status === SlotStatus.OCCUPIED).length;
    const newDeleted = clusteredTable.filter((s) => s.status === SlotStatus.DELETED).length;
    const newLoadFactor = size > 0 ? (newOccupied + newDeleted) / size : 0;

    if (newLoadFactor > rehashThreshold) {
      const newSize = Math.min(50, size * 2);
      if (newSize > size) {
        get().rehash(newSize);
      }
    }
  },

  remove: (key: number) => {
    const { table, size, logIdCounter, logs } = get();

    let foundIndex = -1;
    const hashValue = key % size;

    for (let probe = 0; probe < size; probe++) {
      const idx = (hashValue + probe) % size;
      if (table[idx].status === SlotStatus.OCCUPIED && table[idx].key === key) {
        foundIndex = idx;
        break;
      }
      if (table[idx].status === SlotStatus.EMPTY) {
        break;
      }
    }

    if (foundIndex === -1) {
      set({
        logs: [
          ...logs,
          {
            id: logIdCounter + 1,
            type: "delete",
            description: `删除 key=${key} 失败：未找到`,
            timestamp: Date.now(),
            probeCount: 0,
          },
        ],
        logIdCounter: logIdCounter + 1,
        probePath: [],
      });
      return;
    }

    const newTable = [...table];
    newTable[foundIndex] = {
      status: SlotStatus.DELETED,
      key: null,
      hashValue: null,
      isClustered: false,
    };
    const clusteredTable = detectClusters(newTable, size);

    set({
      table: clusteredTable,
      probePath: [],
      lastHighlightedIndex: foundIndex,
      logs: [
        ...logs,
        {
          id: logIdCounter + 1,
          type: "delete",
          description: `删除 key=${key}，位置[${foundIndex}]，标记为已删除（墓碑）`,
          timestamp: Date.now(),
          probeCount: foundIndex - hashValue >= 0 ? foundIndex - hashValue + 1 : (size - hashValue) + foundIndex + 1,
        },
      ],
      logIdCounter: logIdCounter + 1,
    });
  },

  clearProbePath: () => {
    set({ probePath: [], lastHighlightedIndex: null });
  },
}));
