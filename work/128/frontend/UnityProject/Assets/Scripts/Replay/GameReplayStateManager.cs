using System;
using System.Collections.Generic;
using UnityEngine;

public class GameReplayState
{
    public Dictionary<int, List<TileData>> PlayerHands { get; set; }
    public Dictionary<int, List<MeldData>> PlayerMelds { get; set; }
    public Dictionary<int, List<TileData>> PlayerDiscardedTiles { get; set; }
    public int CurrentPlayerIndex { get; set; }
    public int BankerIndex { get; set; }
    public int RemainingTiles { get; set; }
    public int TotalTiles { get; set; }
    public int OperationsApplied { get; set; }
    public bool IsGameEnded { get; set; }
    public string WinnerPlayerId { get; set; }
    public Dictionary<int, int> PlayerScores { get; set; }

    public GameReplayState()
    {
        PlayerHands = new Dictionary<int, List<TileData>>();
        PlayerMelds = new Dictionary<int, List<MeldData>>();
        PlayerDiscardedTiles = new Dictionary<int, List<TileData>>();
        PlayerScores = new Dictionary<int, int>();
        CurrentPlayerIndex = 0;
        BankerIndex = 0;
        RemainingTiles = 0;
        TotalTiles = 108;
        OperationsApplied = 0;
        IsGameEnded = false;
        WinnerPlayerId = null;
    }

    public GameReplayState Clone()
    {
        var clone = new GameReplayState
        {
            CurrentPlayerIndex = CurrentPlayerIndex,
            BankerIndex = BankerIndex,
            RemainingTiles = RemainingTiles,
            TotalTiles = TotalTiles,
            OperationsApplied = OperationsApplied,
            IsGameEnded = IsGameEnded,
            WinnerPlayerId = WinnerPlayerId
        };

        foreach (var kvp in PlayerHands)
        {
            clone.PlayerHands[kvp.Key] = new List<TileData>(kvp.Value);
        }

        foreach (var kvp in PlayerMelds)
        {
            clone.PlayerMelds[kvp.Key] = new List<MeldData>();
            foreach (var meld in kvp.Value)
            {
                clone.PlayerMelds[kvp.Key].Add(meld.Clone());
            }
        }

        foreach (var kvp in PlayerDiscardedTiles)
        {
            clone.PlayerDiscardedTiles[kvp.Key] = new List<TileData>(kvp.Value);
        }

        foreach (var kvp in PlayerScores)
        {
            clone.PlayerScores[kvp.Key] = kvp.Value;
        }

        return clone;
    }
}

public class GameReplayStateManager
{
    private GameRecordDetail _record;
    private GameReplayState _currentState;
    private GameReplayState _initialState;

    public GameReplayState CurrentState => _currentState?.Clone();

    public void Initialize(GameRecordDetail record)
    {
        _record = record;
        _currentState = new GameReplayState();
        _initialState = new GameReplayState();

        if (record.InitialState != null)
        {
            _initialState.BankerIndex = record.InitialState.BankerIndex;
            _currentState.BankerIndex = record.InitialState.BankerIndex;
            _currentState.CurrentPlayerIndex = record.InitialState.BankerIndex;

            foreach (var kvp in record.InitialState.PlayerHands)
            {
                _initialState.PlayerHands[kvp.Key] = new List<TileData>(kvp.Value);
                _currentState.PlayerHands[kvp.Key] = new List<TileData>(kvp.Value);
                _currentState.PlayerMelds[kvp.Key] = new List<MeldData>();
                _currentState.PlayerDiscardedTiles[kvp.Key] = new List<TileData>();
                _currentState.PlayerScores[kvp.Key] = 0;
            }
        }

        _initialState.RemainingTiles = 108;
        foreach (var hands in _initialState.PlayerHands.Values)
        {
            _initialState.RemainingTiles -= hands.Count;
        }
        _currentState.RemainingTiles = _initialState.RemainingTiles;
        _currentState.TotalTiles = 108;
    }

    public void ResetToInitialState()
    {
        if (_initialState == null) return;
        
        _currentState = _initialState.Clone();
        _currentState.OperationsApplied = 0;
    }

    public void ApplyOperation(GameOperationRecord operation)
    {
        if (operation == null) return;

        int playerIndex = operation.PlayerIndex;

        switch (operation.Type?.ToUpper())
        {
            case "START":
                HandleStartOperation(operation);
                break;

            case "DEAL":
                HandleDealOperation(operation);
                break;

            case "DRAW":
                HandleDrawOperation(operation);
                break;

            case "DISCARD":
                HandleDiscardOperation(operation);
                break;

            case "PENG":
                HandlePengOperation(operation);
                break;

            case "GANG":
            case "MING_GANG":
                HandleMingGangOperation(operation);
                break;

            case "AN_GANG":
                HandleAnGangOperation(operation);
                break;

            case "BU_GANG":
                HandleBuGangOperation(operation);
                break;

            case "HU":
                HandleHuOperation(operation);
                break;

            case "PASS":
                HandlePassOperation(operation);
                break;

            case "END":
                HandleEndOperation(operation);
                break;
        }

        _currentState.OperationsApplied++;
    }

    private void HandleStartOperation(GameOperationRecord operation)
    {
        _currentState.IsGameEnded = false;
        _currentState.WinnerPlayerId = null;
    }

    private void HandleDealOperation(GameOperationRecord operation)
    {
        if (operation.Tiles != null && operation.Tiles.Count > 0)
        {
            int playerIndex = operation.PlayerIndex;
            if (!_currentState.PlayerHands.ContainsKey(playerIndex))
            {
                _currentState.PlayerHands[playerIndex] = new List<TileData>();
            }

            foreach (var tile in operation.Tiles)
            {
                _currentState.PlayerHands[playerIndex].Add(tile);
                _currentState.RemainingTiles--;
            }

            SortPlayerHand(playerIndex);
        }
    }

    private void HandleDrawOperation(GameOperationRecord operation)
    {
        if (operation.Tile != null)
        {
            int playerIndex = operation.PlayerIndex;
            if (!_currentState.PlayerHands.ContainsKey(playerIndex))
            {
                _currentState.PlayerHands[playerIndex] = new List<TileData>();
            }

            _currentState.PlayerHands[playerIndex].Add(operation.Tile);
            _currentState.RemainingTiles--;
            _currentState.CurrentPlayerIndex = playerIndex;
        }
    }

    private void HandleDiscardOperation(GameOperationRecord operation)
    {
        if (operation.Tile != null)
        {
            int playerIndex = operation.PlayerIndex;
            if (_currentState.PlayerHands.ContainsKey(playerIndex))
            {
                var hand = _currentState.PlayerHands[playerIndex];
                int removeIndex = hand.FindIndex(t => t.id == operation.Tile.id);
                if (removeIndex >= 0)
                {
                    hand.RemoveAt(removeIndex);
                }

                if (!_currentState.PlayerDiscardedTiles.ContainsKey(playerIndex))
                {
                    _currentState.PlayerDiscardedTiles[playerIndex] = new List<TileData>();
                }
                _currentState.PlayerDiscardedTiles[playerIndex].Add(operation.Tile);
            }
        }
    }

    private void HandlePengOperation(GameOperationRecord operation)
    {
        if (operation.Tile != null)
        {
            int playerIndex = operation.PlayerIndex;
            int targetIndex = operation.TargetPlayerIndex ?? playerIndex;

            if (_currentState.PlayerDiscardedTiles.ContainsKey(targetIndex))
            {
                var discarded = _currentState.PlayerDiscardedTiles[targetIndex];
                if (discarded.Count > 0)
                {
                    discarded.RemoveAt(discarded.Count - 1);
                }
            }

            if (_currentState.PlayerHands.ContainsKey(playerIndex))
            {
                var hand = _currentState.PlayerHands[playerIndex];
                int removedCount = 0;
                for (int i = hand.Count - 1; i >= 0 && removedCount < 2; i--)
                {
                    if (hand[i].type == operation.Tile.type && hand[i].rank == operation.Tile.rank)
                    {
                        hand.RemoveAt(i);
                        removedCount++;
                    }
                }
            }

            if (!_currentState.PlayerMelds.ContainsKey(playerIndex))
            {
                _currentState.PlayerMelds[playerIndex] = new List<MeldData>();
            }

            var pengTiles = new List<TileData>
            {
                operation.Tile.Clone(),
                operation.Tile.Clone(),
                operation.Tile.Clone()
            };

            var meld = new MeldData
            {
                type = "peng",
                tiles = pengTiles,
                fromPlayer = targetIndex
            };

            _currentState.PlayerMelds[playerIndex].Add(meld);
            _currentState.CurrentPlayerIndex = playerIndex;
        }
    }

    private void HandleMingGangOperation(GameOperationRecord operation)
    {
        if (operation.Tile != null)
        {
            int playerIndex = operation.PlayerIndex;
            int targetIndex = operation.TargetPlayerIndex ?? playerIndex;

            if (_currentState.PlayerDiscardedTiles.ContainsKey(targetIndex))
            {
                var discarded = _currentState.PlayerDiscardedTiles[targetIndex];
                if (discarded.Count > 0)
                {
                    discarded.RemoveAt(discarded.Count - 1);
                }
            }

            if (_currentState.PlayerHands.ContainsKey(playerIndex))
            {
                var hand = _currentState.PlayerHands[playerIndex];
                int removedCount = 0;
                for (int i = hand.Count - 1; i >= 0 && removedCount < 3; i--)
                {
                    if (hand[i].type == operation.Tile.type && hand[i].rank == operation.Tile.rank)
                    {
                        hand.RemoveAt(i);
                        removedCount++;
                    }
                }
            }

            if (!_currentState.PlayerMelds.ContainsKey(playerIndex))
            {
                _currentState.PlayerMelds[playerIndex] = new List<MeldData>();
            }

            var gangTiles = new List<TileData>
            {
                operation.Tile.Clone(),
                operation.Tile.Clone(),
                operation.Tile.Clone(),
                operation.Tile.Clone()
            };

            var meld = new MeldData
            {
                type = "gang",
                tiles = gangTiles,
                fromPlayer = targetIndex
            };

            _currentState.PlayerMelds[playerIndex].Add(meld);
        }
    }

    private void HandleAnGangOperation(GameOperationRecord operation)
    {
        if (operation.Tile != null)
        {
            int playerIndex = operation.PlayerIndex;

            if (_currentState.PlayerHands.ContainsKey(playerIndex))
            {
                var hand = _currentState.PlayerHands[playerIndex];
                int removedCount = 0;
                for (int i = hand.Count - 1; i >= 0 && removedCount < 4; i--)
                {
                    if (hand[i].type == operation.Tile.type && hand[i].rank == operation.Tile.rank)
                    {
                        hand.RemoveAt(i);
                        removedCount++;
                    }
                }
            }

            if (!_currentState.PlayerMelds.ContainsKey(playerIndex))
            {
                _currentState.PlayerMelds[playerIndex] = new List<MeldData>();
            }

            var gangTiles = new List<TileData>
            {
                operation.Tile.Clone(),
                operation.Tile.Clone(),
                operation.Tile.Clone(),
                operation.Tile.Clone()
            };

            var meld = new MeldData
            {
                type = "an_gang",
                tiles = gangTiles,
                fromPlayer = playerIndex
            };

            _currentState.PlayerMelds[playerIndex].Add(meld);
        }
    }

    private void HandleBuGangOperation(GameOperationRecord operation)
    {
        if (operation.Tile != null)
        {
            int playerIndex = operation.PlayerIndex;

            if (_currentState.PlayerHands.ContainsKey(playerIndex))
            {
                var hand = _currentState.PlayerHands[playerIndex];
                int removeIndex = hand.FindIndex(t => 
                    t.type == operation.Tile.type && t.rank == operation.Tile.rank);
                if (removeIndex >= 0)
                {
                    hand.RemoveAt(removeIndex);
                }
            }

            if (_currentState.PlayerMelds.ContainsKey(playerIndex))
            {
                foreach (var meld in _currentState.PlayerMelds[playerIndex])
                {
                    if (meld.type == "peng" && meld.tiles.Count > 0 &&
                        meld.tiles[0].type == operation.Tile.type && 
                        meld.tiles[0].rank == operation.Tile.rank)
                    {
                        meld.type = "bu_gang";
                        meld.tiles.Add(operation.Tile.Clone());
                        break;
                    }
                }
            }
        }
    }

    private void HandleHuOperation(GameOperationRecord operation)
    {
        int playerIndex = operation.PlayerIndex;
        _currentState.WinnerPlayerId = operation.PlayerId;
        _currentState.IsGameEnded = true;

        if (operation.ScoreChange.HasValue)
        {
            if (!_currentState.PlayerScores.ContainsKey(playerIndex))
            {
                _currentState.PlayerScores[playerIndex] = 0;
            }
            _currentState.PlayerScores[playerIndex] += operation.ScoreChange.Value;
        }
    }

    private void HandlePassOperation(GameOperationRecord operation)
    {
    }

    private void HandleEndOperation(GameOperationRecord operation)
    {
        _currentState.IsGameEnded = true;
        if (operation.ScoreChange.HasValue)
        {
            int playerIndex = operation.PlayerIndex;
            if (!_currentState.PlayerScores.ContainsKey(playerIndex))
            {
                _currentState.PlayerScores[playerIndex] = 0;
            }
            _currentState.PlayerScores[playerIndex] += operation.ScoreChange.Value;
        }
    }

    private void SortPlayerHand(int playerIndex)
    {
        if (!_currentState.PlayerHands.ContainsKey(playerIndex)) return;

        var hand = _currentState.PlayerHands[playerIndex];
        hand.Sort((a, b) =>
        {
            int typeCompare = GetTypeOrder(a.type).CompareTo(GetTypeOrder(b.type));
            if (typeCompare != 0) return typeCompare;
            return a.rank.CompareTo(b.rank);
        });
    }

    private int GetTypeOrder(string type)
    {
        switch (type?.ToLower())
        {
            case "wan": return 0;
            case "tiao": return 1;
            case "tong": return 2;
            default: return 3;
        }
    }
}
