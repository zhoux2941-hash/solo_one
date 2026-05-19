import { CRDTOperation } from '../types';

export class CRDTDocument<T extends object> {
  private state: T;
  private vectorClock: { [nodeId: string]: number };
  private nodeId: string;
  private operations: CRDTOperation[] = [];
  private onStateChange?: (state: T) => void;
  private snapshotInterval: number = 50;

  constructor(nodeId: string, initialState: T) {
    this.nodeId = nodeId;
    this.state = JSON.parse(JSON.stringify(initialState));
    this.vectorClock = { [nodeId]: 0 };
  }

  setOnStateChange(callback: (state: T) => void) {
    this.onStateChange = callback;
  }

  getState(): T {
    return JSON.parse(JSON.stringify(this.state));
  }

  setState(newState: T): void {
    this.state = JSON.parse(JSON.stringify(newState));
    this.onStateChange?.(this.getState());
  }

  getVectorClock(): { [nodeId: string]: number } {
    return { ...this.vectorClock };
  }

  setVectorClock(clock: { [nodeId: string]: number }): void {
    this.vectorClock = { ...clock };
  }

  createSnapshot(): { state: T; vectorClock: { [nodeId: string]: number }; operationCount: number } {
    return {
      state: this.getState(),
      vectorClock: this.getVectorClock(),
      operationCount: this.operations.length,
    };
  }

  applySnapshot(snapshot: { state: T; vectorClock: { [nodeId: string]: number } }): void {
    this.state = JSON.parse(JSON.stringify(snapshot.state));
    this.vectorClock = { ...snapshot.vectorClock };
    this.onStateChange?.(this.getState());
  }

  set(path: string, value: any): CRDTOperation {
    this.incrementClock();
    const operation: CRDTOperation = {
      type: 'set',
      key: path,
      value,
      vectorClock: this.getVectorClock(),
      nodeId: this.nodeId,
      timestamp: Date.now(),
    };
    this.applyOperation(operation, false);
    this.maybeCreateSnapshot();
    return operation;
  }

  add(path: string, value: any): CRDTOperation {
    this.incrementClock();
    const operation: CRDTOperation = {
      type: 'add',
      key: path,
      value,
      vectorClock: this.getVectorClock(),
      nodeId: this.nodeId,
      timestamp: Date.now(),
    };
    this.applyOperation(operation, false);
    this.maybeCreateSnapshot();
    return operation;
  }

  remove(path: string, value: any): CRDTOperation {
    this.incrementClock();
    const operation: CRDTOperation = {
      type: 'remove',
      key: path,
      value,
      vectorClock: this.getVectorClock(),
      nodeId: this.nodeId,
      timestamp: Date.now(),
    };
    this.applyOperation(operation, false);
    this.maybeCreateSnapshot();
    return operation;
  }

  delete(path: string): CRDTOperation {
    this.incrementClock();
    const operation: CRDTOperation = {
      type: 'delete',
      key: path,
      vectorClock: this.getVectorClock(),
      nodeId: this.nodeId,
      timestamp: Date.now(),
    };
    this.applyOperation(operation, false);
    this.maybeCreateSnapshot();
    return operation;
  }

  private maybeCreateSnapshot(): void {
    if (this.operations.length > 0 && this.operations.length % this.snapshotInterval === 0) {
    }
  }

  applyOperation(operation: CRDTOperation, triggerCallback: boolean = true): boolean {
    if (this.isOperationApplied(operation)) {
      return false;
    }

    this.mergeClock(operation.vectorClock);

    const keys = operation.key.split('.');
    let current: any = this.state;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];

    switch (operation.type) {
      case 'set':
        current[lastKey] = operation.value;
        break;
      case 'add':
        if (!Array.isArray(current[lastKey])) {
          current[lastKey] = [];
        }
        if (!current[lastKey].includes(operation.value)) {
          current[lastKey].push(operation.value);
        }
        break;
      case 'remove':
        if (Array.isArray(current[lastKey])) {
          current[lastKey] = current[lastKey].filter((v: any) => v !== operation.value);
        }
        break;
      case 'delete':
        delete current[lastKey];
        break;
    }

    this.operations.push(operation);
    if (triggerCallback) {
      this.onStateChange?.(this.getState());
    }
    return true;
  }

  applyOperations(operations: CRDTOperation[]): number {
    let applied = 0;
    const sortedOps = this.sortOperations(operations);
    for (const op of sortedOps) {
      if (this.applyOperation(op, false)) {
        applied++;
      }
    }
    if (applied > 0) {
      this.onStateChange?.(this.getState());
    }
    return applied;
  }

  private sortOperations(operations: CRDTOperation[]): CRDTOperation[] {
    return [...operations].sort((a, b) => {
      for (const nodeId in a.vectorClock) {
        const aClock = a.vectorClock[nodeId] || 0;
        const bClock = b.vectorClock[nodeId] || 0;
        if (aClock !== bClock) {
          return aClock - bClock;
        }
      }
      return a.timestamp - b.timestamp;
    });
  }

  getOperations(): CRDTOperation[] {
    return [...this.operations];
  }

  getOperationsSince(since: { [nodeId: string]: number }): CRDTOperation[] {
    return this.operations.filter((op) => this.isAfter(op.vectorClock, since));
  }

  private isAfter(a: { [nodeId: string]: number }, b: { [nodeId: string]: number }): boolean {
    const allNodes = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const nodeId of allNodes) {
      const aVal = a[nodeId] || 0;
      const bVal = b[nodeId] || 0;
      if (aVal > bVal) {
        return true;
      }
    }
    return false;
  }

  private isOperationApplied(operation: CRDTOperation): boolean {
    const opClock = operation.vectorClock;
    for (const nodeId in opClock) {
      if (opClock[nodeId] > (this.vectorClock[nodeId] || 0)) {
        return false;
      }
    }
    return true;
  }

  private shouldApply(operation: CRDTOperation): boolean {
    return !this.isOperationApplied(operation);
  }

  private incrementClock() {
    this.vectorClock[this.nodeId] = (this.vectorClock[this.nodeId] || 0) + 1;
  }

  private mergeClock(other: { [nodeId: string]: number }) {
    for (const nodeId in other) {
      this.vectorClock[nodeId] = Math.max(
        this.vectorClock[nodeId] || 0,
        other[nodeId]
      );
    }
  }

  mergeDocument(other: CRDTDocument<T>): void {
    const otherState = other.getState();
    const otherClock = other.getVectorClock();
    const otherOps = other.getOperationsSince(this.vectorClock);
    
    this.applyOperations(otherOps);
    this.mergeClock(otherClock);
  }

  getOperationCount(): number {
    return this.operations.length;
  }

  clearOldOperations(beforeTimestamp: number): void {
    this.operations = this.operations.filter(op => op.timestamp > beforeTimestamp);
  }
}
