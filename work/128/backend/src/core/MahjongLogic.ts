import { MahjongTile, Tile, TileType } from '../models/MahjongTile';
import { TILE_TYPES, MAHJONG_CONFIG } from '../config';

export interface HandAnalysis {
  canHu: boolean;
  hasPairs: boolean;
  hasTriplets: boolean;
  hasSequences: boolean;
  fanType: string | null;
}

export class MahjongLogic {
  static createDeck(): MahjongTile[] {
    const deck: MahjongTile[] = [];
    const types: TileType[] = [TILE_TYPES.TIAO, TILE_TYPES.WAN, TILE_TYPES.TONG];
    
    for (const type of types) {
      for (let rank = 1; rank <= 9; rank++) {
        for (let copy = 0; copy < 4; copy++) {
          deck.push(new MahjongTile(type, rank as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9));
        }
      }
    }
    
    return deck;
  }

  static shuffleDeck(deck: MahjongTile[]): MahjongTile[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static canHu(handTiles: MahjongTile[], newTile?: MahjongTile): boolean {
    let tiles = [...handTiles];
    if (newTile) {
      tiles.push(newTile);
    }

    if (tiles.length % 3 !== 2) {
      return false;
    }

    const tileCount: Record<string, number> = {};
    for (const tile of tiles) {
      const key = `${tile.type}_${tile.rank}`;
      tileCount[key] = (tileCount[key] || 0) + 1;
    }

    const sortedKeys = Object.keys(tileCount).sort();

    for (const key of sortedKeys) {
      if (tileCount[key] >= 2) {
        const tempCount = { ...tileCount };
        tempCount[key] -= 2;
        
        if (this.checkTripletsAndSequences(tempCount)) {
          return true;
        }
      }
    }

    return this.checkQiDui(tileCount);
  }

  private static checkTripletsAndSequences(tileCount: Record<string, number>): boolean {
    const keys = Object.keys(tileCount).filter(k => tileCount[k] > 0).sort();
    
    if (keys.length === 0) {
      return true;
    }

    const firstKey = keys[0];
    const count = tileCount[firstKey];

    if (count >= 3) {
      const tempCount = { ...tileCount };
      tempCount[firstKey] -= 3;
      if (this.checkTripletsAndSequences(tempCount)) {
        return true;
      }
    }

    const [type, rank] = firstKey.split('_');
    const rankNum = parseInt(rank);
    
    if (rankNum <= 7) {
      const key2 = `${type}_${rankNum + 1}`;
      const key3 = `${type}_${rankNum + 2}`;
      
      if (tileCount[key2] && tileCount[key3] && tileCount[key2] > 0 && tileCount[key3] > 0) {
        const tempCount = { ...tileCount };
        tempCount[firstKey] -= 1;
        tempCount[key2] -= 1;
        tempCount[key3] -= 1;
        if (this.checkTripletsAndSequences(tempCount)) {
          return true;
        }
      }
    }

    return false;
  }

  private static checkQiDui(tileCount: Record<string, number>): boolean {
    let pairCount = 0;
    for (const key in tileCount) {
      if (tileCount[key] % 2 !== 0) {
        return false;
      }
      pairCount += Math.floor(tileCount[key] / 2);
    }
    return pairCount === 7;
  }

  static canGang(handTiles: MahjongTile[], tile: MahjongTile): boolean {
    const count = handTiles.filter(t => t.equals(tile)).length;
    return count >= 4;
  }

  static canPeng(handTiles: MahjongTile[], tile: MahjongTile): boolean {
    const count = handTiles.filter(t => t.equals(tile)).length;
    return count >= 2;
  }

  static getAvailableActions(handTiles: MahjongTile[], discardedTile: MahjongTile | null): string[] {
    const actions: string[] = [];
    
    if (discardedTile) {
      if (this.canPeng(handTiles, discardedTile)) {
        actions.push('peng');
      }
      if (this.canGang(handTiles, discardedTile)) {
        actions.push('gang');
      }
      if (this.canHu(handTiles, discardedTile)) {
        actions.push('hu');
      }
    }
    
    return actions;
  }

  static getAnGangOptions(handTiles: MahjongTile[]): MahjongTile[] {
    const tileGroups: Record<string, MahjongTile[]> = {};
    
    for (const tile of handTiles) {
      const key = `${tile.type}_${tile.rank}`;
      if (!tileGroups[key]) {
        tileGroups[key] = [];
      }
      tileGroups[key].push(tile);
    }

    const result: MahjongTile[] = [];
    for (const key in tileGroups) {
      if (tileGroups[key].length >= 4) {
        result.push(tileGroups[key][0]);
      }
    }
    
    return result;
  }

  static getBuGangOptions(handTiles: MahjongTile[], pengMelds: any[]): MahjongTile[] {
    const pengTiles = pengMelds.map((m: any) => m.tiles[0]);
    const result: MahjongTile[] = [];
    
    for (const pengTile of pengTiles) {
      if (handTiles.some(t => t.equals(pengTile))) {
        result.push(handTiles.find(t => t.equals(pengTile))!);
      }
    }
    
    return result;
  }

  static calculateFan(handTiles: MahjongTile[], melds: any[], winTile: MahjongTile): number {
    let fan = 0;
    const tileCount: Record<string, number> = {};
    const allTiles = [...handTiles, winTile];
    
    for (const tile of allTiles) {
      const key = `${tile.type}_${tile.rank}`;
      tileCount[key] = (tileCount[key] || 0) + 1;
    }

    if (this.checkQingYiSe(allTiles)) {
      fan += 3;
    }

    if (this.checkDuiDuiHu(allTiles)) {
      fan += 2;
    }

    if (this.checkQiDui(tileCount)) {
      fan += 2;
    }

    const gangCount = melds.filter((m: any) => 
      m.type === 'gang' || m.type === 'an_gang' || m.type === 'bu_gang'
    ).length;
    fan += gangCount;

    return Math.max(fan, 1);
  }

  private static checkQingYiSe(tiles: MahjongTile[]): boolean {
    if (tiles.length === 0) return false;
    const type = tiles[0].type;
    return tiles.every(t => t.type === type);
  }

  private static checkDuiDuiHu(tiles: MahjongTile[]): boolean {
    const tileCount: Record<string, number> = {};
    for (const tile of tiles) {
      const key = `${tile.type}_${tile.rank}`;
      tileCount[key] = (tileCount[key] || 0) + 1;
    }
    
    let pairCount = 0;
    let tripletCount = 0;
    
    for (const key in tileCount) {
      const count = tileCount[key];
      if (count === 2) {
        pairCount++;
      } else if (count === 3) {
        tripletCount++;
      } else if (count === 4) {
        tripletCount++;
      } else {
        return false;
      }
    }
    
    return pairCount === 1 && (tripletCount >= 4);
  }
}
