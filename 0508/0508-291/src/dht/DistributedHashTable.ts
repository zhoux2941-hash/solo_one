import { DHTEntry } from '../types';
import { PeerNetwork } from '../network/PeerNetwork';

export class DistributedHashTable {
  private localStore: Map<string, DHTEntry> = new Map();
  private nodeId: string;
  private peerNetwork: PeerNetwork;
  private replicationFactor = 3;

  constructor(nodeId: string, peerNetwork: PeerNetwork) {
    this.nodeId = nodeId;
    this.peerNetwork = peerNetwork;
  }

  put(key: string, value: any): void {
    const entry: DHTEntry = {
      key,
      value,
      replicas: [this.nodeId],
      timestamp: Date.now(),
    };

    this.localStore.set(key, entry);
    this.replicate(key, entry);
  }

  get(key: string): any {
    const local = this.localStore.get(key);
    if (local) {
      return local.value;
    }
    return null;
  }

  async lookup(key: string): Promise<any> {
    const local = this.get(key);
    if (local) {
      return local;
    }

    return new Promise((resolve) => {
      const peers = this.peerNetwork.getConnectedPeers();
      let found = false;

      const timeout = setTimeout(() => {
        resolve(null);
      }, 3000);

      const originalOnMessage = (this.peerNetwork as any).onMessageCallback;
      (this.peerNetwork as any).onMessageCallback = (from: string, data: any) => {
        if (data.type === 'dht-lookup-response' && data.key === key) {
          found = true;
          clearTimeout(timeout);
          (this.peerNetwork as any).onMessageCallback = originalOnMessage;
          resolve(data.value);
        }
      };

      peers.forEach((peerId) => {
        this.peerNetwork.send(peerId, {
          type: 'dht-lookup',
          key,
        });
      });
    });
  }

  handleMessage(from: string, data: any): void {
    switch (data.type) {
      case 'dht-lookup':
        this.handleLookup(from, data.key);
        break;
      case 'dht-lookup-response':
        break;
      case 'dht-replicate':
        this.handleReplicate(data.entry);
        break;
    }
  }

  private handleLookup(from: string, key: string): void {
    const entry = this.localStore.get(key);
    if (entry) {
      this.peerNetwork.send(from, {
        type: 'dht-lookup-response',
        key,
        value: entry.value,
      });
    }
  }

  private handleReplicate(entry: DHTEntry): void {
    const existing = this.localStore.get(entry.key);
    if (!existing || existing.timestamp < entry.timestamp) {
      this.localStore.set(entry.key, {
        ...entry,
        replicas: [...new Set([...entry.replicas, this.nodeId])],
      });
    }
  }

  private replicate(key: string, entry: DHTEntry): void {
    const peers = this.peerNetwork.getConnectedPeers();
    const selectedPeers = peers
      .sort(() => Math.random() - 0.5)
      .slice(0, this.replicationFactor);

    selectedPeers.forEach((peerId) => {
      this.peerNetwork.send(peerId, {
        type: 'dht-replicate',
        entry: {
          ...entry,
          replicas: [...entry.replicas, peerId],
        },
      });
    });
  }

  remove(key: string): void {
    this.localStore.delete(key);
  }

  keys(): string[] {
    return Array.from(this.localStore.keys());
  }

  entries(): [string, any][] {
    return Array.from(this.localStore.entries()).map(([k, v]) => [k, v.value]);
  }

  findRoomNodes(roomId: string): string[] {
    const entry = this.localStore.get(`room:${roomId}:nodes`);
    return entry?.value || [];
  }

  addRoomNode(roomId: string, nodeId: string): void {
    const key = `room:${roomId}:nodes`;
    const nodes = this.findRoomNodes(roomId);
    if (!nodes.includes(nodeId)) {
      this.put(key, [...nodes, nodeId]);
    }
  }

  removeRoomNode(roomId: string, nodeId: string): void {
    const key = `room:${roomId}:nodes`;
    const nodes = this.findRoomNodes(roomId).filter((n) => n !== nodeId);
    this.put(key, nodes);
  }

  getAllRooms(): { id: string; playerCount: number }[] {
    const rooms: { id: string; playerCount: number }[] = [];
    this.localStore.forEach((entry, key) => {
      if (key.startsWith('room:') && key.endsWith(':nodes')) {
        const roomId = key.replace('room:', '').replace(':nodes', '');
        rooms.push({
          id: roomId,
          playerCount: entry.value?.length || 0,
        });
      }
    });
    return rooms;
  }
}
