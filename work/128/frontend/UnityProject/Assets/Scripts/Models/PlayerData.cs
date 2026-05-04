using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class PlayerData
{
    public string id;
    public string name;
    public int seatIndex;
    public int handTilesCount;
    public List<MeldData> melds;
    public List<TileData> discardedTiles;
    public bool isReady;
    public bool isHost;
    public bool isAI;
    public int score;

    public PlayerData()
    {
        melds = new List<MeldData>();
        discardedTiles = new List<TileData>();
    }
}

[Serializable]
public class PublicPlayerData
{
    public string id;
    public string name;
    public int seatIndex;
    public int handTiles;
    public List<MeldData> melds;
    public List<TileData> discardedTiles;
    public bool isReady;
    public bool isHost;
    public bool isAI;
    public int score;
}
