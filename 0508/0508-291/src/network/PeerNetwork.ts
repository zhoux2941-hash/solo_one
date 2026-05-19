import { v4 as uuidv4 } from 'uuid';
import { PeerNode } from '../types';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class PeerNetwork {
  public nodeId: string;
  private peers: Map<string, PeerNode> = new Map();
  private onMessageCallback?: (from: string, data: any) => void;
  private onPeerConnected?: (peerId: string) => void;
  private onPeerDisconnected?: (peerId: string) => void;
  private pendingCandidates: Map<string, RTCIceCandidate[]> = new Map();

  constructor() {
    this.nodeId = uuidv4();
  }

  setOnMessage(callback: (from: string, data: any) => void) {
    this.onMessageCallback = callback;
  }

  setOnPeerConnected(callback: (peerId: string) => void) {
    this.onPeerConnected = callback;
  }

  setOnPeerDisconnected(callback: (peerId: string) => void) {
    this.onPeerDisconnected = callback;
  }

  async createOffer(): Promise<{ offer: RTCSessionDescriptionInit; peerId: string }> {
    const peerId = uuidv4();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const dataChannel = pc.createDataChannel('mud-channel');
    
    this.setupDataChannel(dataChannel, peerId);
    this.setupPeerConnection(pc, peerId);

    this.peers.set(peerId, {
      id: peerId,
      connection: pc,
      dataChannel: dataChannel,
      isConnected: false,
      isRelay: false,
      lastPing: Date.now(),
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await this.waitForIceGathering(pc);

    return { offer: pc.localDescription!, peerId };
  }

  async acceptOffer(offer: RTCSessionDescriptionInit): Promise<{ answer: RTCSessionDescriptionInit; peerId: string }> {
    const peerId = uuidv4();
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, peerId);
    };

    this.setupPeerConnection(pc, peerId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await this.waitForIceGathering(pc);

    this.peers.set(peerId, {
      id: peerId,
      connection: pc,
      isConnected: false,
      isRelay: false,
      lastPing: Date.now(),
    });

    return { answer: pc.localDescription!, peerId };
  }

  async acceptAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connection) {
      throw new Error('Peer not found');
    }

    await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));

    const candidates = this.pendingCandidates.get(peerId) || [];
    for (const candidate of candidates) {
      await peer.connection.addIceCandidate(candidate);
    }
    this.pendingCandidates.delete(peerId);
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connection) {
      if (!this.pendingCandidates.has(peerId)) {
        this.pendingCandidates.set(peerId, []);
      }
      this.pendingCandidates.get(peerId)!.push(new RTCIceCandidate(candidate));
      return;
    }

    await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string) {
    dataChannel.onopen = () => {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.isConnected = true;
        peer.dataChannel = dataChannel;
        peer.lastPing = Date.now();
        this.onPeerConnected?.(peerId);
        console.log(`DataChannel opened with peer ${peerId.slice(0, 8)}`);
      }
    };

    dataChannel.onclose = () => {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.isConnected = false;
        this.onPeerDisconnected?.(peerId);
        console.log(`DataChannel closed with peer ${peerId.slice(0, 8)}`);
      }
    };

    dataChannel.onerror = (error) => {
      console.error(`DataChannel error with peer ${peerId.slice(0, 8)}:`, error);
    };

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const peer = this.peers.get(peerId);
        if (peer) {
          peer.lastPing = Date.now();
        }
        this.onMessageCallback?.(peerId, data);
        this.relayMessage(peerId, data);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  }

  private setupPeerConnection(pc: RTCPeerConnection, peerId: string) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onMessageCallback?.(peerId, {
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        const peer = this.peers.get(peerId);
        if (peer) {
          peer.isConnected = false;
          this.onPeerDisconnected?.(peerId);
        }
      }
    };
  }

  private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
      }
    });
  }

  private relayMessage(fromPeerId: string, data: any) {
    if (data.type === 'ice-candidate' || data.type === 'relay') return;

    const message = {
      ...data,
      relayed: true,
      originalSender: data.originalSender || fromPeerId,
    };

    this.peers.forEach((peer, peerId) => {
      if (peerId !== fromPeerId && peer.isConnected && peer.dataChannel) {
        try {
          peer.dataChannel.send(JSON.stringify(message));
        } catch (e) {
          console.error('Failed to relay message:', e);
        }
      }
    });
  }

  send(toPeerId: string, data: any) {
    const peer = this.peers.get(toPeerId);
    if (!peer || !peer.isConnected || !peer.dataChannel) {
      throw new Error('Peer not connected');
    }
    peer.dataChannel.send(JSON.stringify(data));
  }

  broadcast(data: any) {
    this.peers.forEach((peer, peerId) => {
      if (peer.isConnected && peer.dataChannel) {
        try {
          peer.dataChannel.send(JSON.stringify(data));
        } catch (e) {
          console.error(`Failed to send to peer ${peerId}:`, e);
        }
      }
    });
  }

  getConnectedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([_, peer]) => peer.isConnected)
      .map(([peerId]) => peerId);
  }

  disconnect(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.dataChannel?.close();
      peer.connection?.close();
      this.peers.delete(peerId);
      this.onPeerDisconnected?.(peerId);
    }
  }

  disconnectAll() {
    this.peers.forEach((_, peerId) => this.disconnect(peerId));
  }
}
