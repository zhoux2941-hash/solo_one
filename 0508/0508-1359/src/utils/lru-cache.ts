interface ListNode {
  key: string;
  value: string;
  expiresAt: number | null;
  prev: ListNode | null;
  next: ListNode | null;
}

function createNode(key: string, value: string, ttl?: number): ListNode {
  const expiresAt = ttl && ttl > 0 ? Date.now() + ttl * 1000 : null;
  return { key, value, expiresAt, prev: null, next: null };
}

export interface CacheEntry {
  key: string;
  value: string;
  expiresAt: number | null;
}

export class LRUCache {
  private capacity: number;
  private map: Map<string, ListNode>;
  private head: ListNode;
  private tail: ListNode;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = createNode('', '');
    this.tail = createNode('', '');
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private removeNode(node: ListNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private addToHead(node: ListNode): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private moveToHead(node: ListNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeTail(): ListNode {
    const node = this.tail.prev!;
    this.removeNode(node);
    return node;
  }

  private isExpired(node: ListNode): boolean {
    return node.expiresAt !== null && Date.now() >= node.expiresAt;
  }

  get(key: string): { value: string | null; expired: boolean } {
    const node = this.map.get(key);
    if (!node) return { value: null, expired: false };

    if (this.isExpired(node)) {
      this.removeNode(node);
      this.map.delete(node.key);
      return { value: null, expired: true };
    }

    this.moveToHead(node);
    return { value: node.value, expired: false };
  }

  put(key: string, value: string, ttl?: number): string | null {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      existing.expiresAt = ttl && ttl > 0 ? Date.now() + ttl * 1000 : null;
      this.moveToHead(existing);
      return null;
    }

    const node = createNode(key, value, ttl);
    this.map.set(key, node);
    this.addToHead(node);

    if (this.map.size > this.capacity) {
      const evicted = this.removeTail();
      this.map.delete(evicted.key);
      return evicted.key;
    }

    return null;
  }

  removeExpired(): string[] {
    const expired: string[] = [];
    let current = this.tail.prev;
    while (current && current !== this.head) {
      const prev = current.prev;
      if (this.isExpired(current)) {
        expired.push(current.key);
        this.removeNode(current);
        this.map.delete(current.key);
      }
      current = prev;
    }
    return expired;
  }

  getOrder(): CacheEntry[] {
    const result: CacheEntry[] = [];
    let current = this.head.next;
    while (current && current !== this.tail) {
      result.push({
        key: current.key,
        value: current.value,
        expiresAt: current.expiresAt,
      });
      current = current.next;
    }
    return result;
  }

  getSize(): number {
    return this.map.size;
  }

  reset(capacity?: number): void {
    if (capacity !== undefined) {
      this.capacity = capacity;
    }
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
}
