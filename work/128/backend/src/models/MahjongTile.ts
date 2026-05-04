import { TILE_TYPES } from '../config';

export interface Tile {
  type: typeof TILE_TYPES[keyof typeof TILE_TYPES];
  rank: number;
  id: string;
}

export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];
export type TileRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export class MahjongTile {
  type: TileType;
  rank: TileRank;
  id: string;

  constructor(type: TileType, rank: TileRank, id?: string) {
    this.type = type;
    this.rank = rank;
    this.id = id || this.generateId();
  }

  private generateId(): string {
    return `${this.type}_${this.rank}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createFromJSON(json: any): MahjongTile {
    return new MahjongTile(json.type, json.rank as TileRank, json.id);
  }

  toJSON(): Tile {
    return {
      type: this.type,
      rank: this.rank,
      id: this.id,
    };
  }

  equals(other: MahjongTile): boolean {
    return this.type === other.type && this.rank === other.rank;
  }

  toString(): string {
    return `${this.type}_${this.rank}`;
  }
}
