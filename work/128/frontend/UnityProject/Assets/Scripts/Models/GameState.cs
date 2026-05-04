using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public enum GamePhase
{
    Waiting,
    Starting,
    Playing,
    WaitingAction,
    Finished
}

[Serializable]
public class RoomData
{
    public string id;
    public string name;
    public string hostId;
    public int maxPlayers;
    public List<PublicPlayerData> players;
    public string gameState;
    public int currentPlayerIndex;
    public int deck;
    public List<TileData> discardPile;
    public TileData lastDiscardedTile;
    public string winningPlayer;
    public int round;
    public int bankerIndex;

    public GamePhase GetGamePhase()
    {
        return gameState?.ToLower() switch
        {
            "waiting" => GamePhase.Waiting,
            "starting" => GamePhase.Starting,
            "playing" => GamePhase.Playing,
            "waiting_action" => GamePhase.WaitingAction,
            "finished" => GamePhase.Finished,
            _ => GamePhase.Waiting
        };
    }
}

[Serializable]
public class PlayerView
{
    public RoomData room;
    public List<TileData> myHand;
    public List<MeldData> myMelds;
    public List<TileData> myDiscardedTiles;
    public List<string> availableActions;
    public bool isMyTurn;

    public PlayerView()
    {
        myHand = new List<TileData>();
        myMelds = new List<MeldData>();
        myDiscardedTiles = new List<TileData>();
        availableActions = new List<string>();
    }

    public bool CanPeng() => availableActions.Contains("peng");
    public bool CanGang() => availableActions.Contains("gang");
    public bool CanHu() => availableActions.Contains("hu");
    public bool CanPass() => availableActions.Count > 0;
}

[Serializable]
public class GameAction
{
    public string action;
    public string tileType;
    public int? tileRank;

    public GameAction(string actionType, string type = null, int? rank = null)
    {
        action = actionType;
        tileType = type;
        tileRank = rank;
    }
}
