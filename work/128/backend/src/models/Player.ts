import { MahjongTile } from './MahjongTile';

export interface PlayerState {
  id: string;
  name: string;
  seatIndex: number;
  handTiles: MahjongTile[];
  melds: Meld[];
  discardedTiles: MahjongTile[];
  isReady: boolean;
  isHost: boolean;
  isAI: boolean;
  score: number;
}

export interface Meld {
  type: 'peng' | 'gang' | 'an_gang' | 'bu_gang';
  tiles: MahjongTile[];
  fromPlayer: number;
}

export class Player {
  id: string;
  name: string;
  seatIndex: number;
  handTiles: MahjongTile[];
  melds: Meld[];
  discardedTiles: MahjongTile[];
  isReady: boolean;
  isHost: boolean;
  isAI: boolean;
  score: number;
  lastAction: string | null;
  lastActionTile: MahjongTile | null;

  constructor(id: string, name: string, seatIndex: number, isHost: boolean = false) {
    this.id = id;
    this.name = name;
    this.seatIndex = seatIndex;
    this.handTiles = [];
    this.melds = [];
    this.discardedTiles = [];
    this.isReady = false;
    this.isHost = isHost;
    this.isAI = false;
    this.score = 0;
    this.lastAction = null;
    this.lastActionTile = null;
  }

  static createFromJSON(json: any): Player {
    const player = new Player(json.id, json.name, json.seatIndex, json.isHost);
    player.isReady = json.isReady;
    player.isAI = json.isAI;
    player.score = json.score;
    player.handTiles = json.handTiles.map((t: any) => MahjongTile.createFromJSON(t));
    player.melds = json.melds.map((m: any) => ({
      ...m,
      tiles: m.tiles.map((t: any) => MahjongTile.createFromJSON(t)),
    }));
    player.discardedTiles = json.discardedTiles.map((t: any) => MahjongTile.createFromJSON(t));
    return player;
  }

  toJSON(): PlayerState {
    return {
      id: this.id,
      name: this.name,
      seatIndex: this.seatIndex,
      handTiles: this.handTiles.map(t => t.toJSON()),
      melds: this.melds.map(m => ({
        ...m,
        tiles: m.tiles.map(t => t.toJSON()),
      })),
      discardedTiles: this.discardedTiles.map(t => t.toJSON()),
      isReady: this.isReady,
      isHost: this.isHost,
      isAI: this.isAI,
      score: this.score,
    };
  }

  sortHandTiles(): void {
    this.handTiles.sort((a, b) => {
      if (a.type !== b.type) {
        const typeOrder = ['tiao', 'wan', 'tong'];
        return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      }
      return a.rank - b.rank;
    });
  }

  addTile(tile: MahjongTile): void {
    this.handTiles.push(tile);
    this.sortHandTiles();
  }

  removeTile(tileId: string): MahjongTile | null {
    const index = this.handTiles.findIndex(t => t.id === tileId);
    if (index !== -1) {
      return this.handTiles.splice(index, 1)[0];
    }
    return null;
  }

  addMeld(meld: Meld): void {
    this.melds.push(meld);
  }

  addDiscardedTile(tile: MahjongTile): void {
    this.discardedTiles.push(tile);
  }

  hasTilesForPeng(tile: MahjongTile): boolean {
    const count = this.handTiles.filter(t => t.equals(tile)).length;
    return count >= 2;
  }

  hasTilesForGang(tile: MahjongTile): boolean {
    const count = this.handTiles.filter(t => t.equals(tile)).length;
    return count >= 4;
  }

  hasTilesForBuGang(tile: MahjongTile): boolean {
    return this.melds.some(
      m => m.type === 'peng' && m.tiles.length > 0 && m.tiles[0].equals(tile)
    ) && this.handTiles.some(t => t.equals(tile));
  }

  getTilesForPeng(tile: MahjongTile): MahjongTile[] {
    const tiles: MahjongTile[] = [];
    for (let i = this.handTiles.length - 1; i >= 0 && tiles.length < 2; i--) {
      if (this.handTiles[i].equals(tile)) {
        tiles.unshift(this.handTiles.splice(i, 1)[0]);
      }
    }
    return tiles;
  }

  getTilesForGang(tile: MahjongTile): MahjongTile[] {
    const tiles: MahjongTile[] = [];
    for (let i = this.handTiles.length - 1; i >= 0 && tiles.length < 4; i--) {
      if (this.handTiles[i].equals(tile)) {
        tiles.unshift(this.handTiles.splice(i, 1)[0]);
      }
    }
    return tiles;
  }

  getTilesForBuGang(tile: MahjongTile): MahjongTile | null {
    for (let i = this.handTiles.length - 1; i >= 0; i--) {
      if (this.handTiles[i].equals(tile)) {
        return this.handTiles.splice(i, 1)[0];
      }
    }
    return null;
  }
}
