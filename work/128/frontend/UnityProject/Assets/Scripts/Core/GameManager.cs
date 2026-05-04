using UnityEngine;
using System;
using System.Collections.Generic;
using SocketIOClient;
using Newtonsoft.Json.Linq;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("Current State")]
    public string currentPlayerId;
    public string currentPlayerName;
    public string currentRoomId;

    [Header("Anti-Spam Settings")]
    public float requestTimeout = 10f;

    public PlayerView PlayerView { get; private set; }
    public RoomData CurrentRoom { get; private set; }

    public bool IsProcessingOperation { get; private set; }

    public event Action<PlayerView> OnPlayerViewUpdated;
    public event Action<string> OnGameStarted;
    public event Action<string, TileData> OnTileDiscarded;
    public event Action<string, string, TileData> OnActionTaken;
    public event Action<string> OnErrorMessage;
    public event Action<bool> OnOperationStateChanged;

    public event Action<GameRecordListResult> OnHistoryListReceived;
    public event Action<GameRecordDetail> OnHistoryDetailReceived;
    public event Action<PlayerStatistics> OnStatisticsReceived;

    private float _operationStartTime;
    private string _currentOperationType;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void Start()
    {
        PlayerView = new PlayerView();
        CurrentRoom = new RoomData();
        IsProcessingOperation = false;
        SocketManager.Instance.OnEventReceived += HandleSocketEvent;
    }

    private void Update()
    {
        if (IsProcessingOperation)
        {
            if (Time.time - _operationStartTime > requestTimeout)
            {
                Debug.LogWarning($"Operation '{_currentOperationType}' timed out");
                ClearOperationState();
            }
        }
    }

    private bool TryStartOperation(string operationType)
    {
        if (IsProcessingOperation)
        {
            Debug.LogWarning($"Cannot start '{operationType}': already processing '{_currentOperationType}'");
            return false;
        }

        IsProcessingOperation = true;
        _currentOperationType = operationType;
        _operationStartTime = Time.time;
        OnOperationStateChanged?.Invoke(true);
        
        return true;
    }

    private void ClearOperationState()
    {
        IsProcessingOperation = false;
        _currentOperationType = null;
        OnOperationStateChanged?.Invoke(false);
    }

    private void HandleSocketEvent(string eventName, SocketIOResponse response)
    {
        Debug.Log($"Received event: {eventName}");

        switch (eventName)
        {
            case "room:update":
            case "game:initial_state":
            case "game:state_update":
                HandleRoomUpdate(response);
                break;
            case "game:started":
                HandleGameStarted(response);
                break;
            case "game:discarded":
                HandleTileDiscarded(response);
                break;
            case "game:action_taken":
                HandleActionTaken(response);
                break;
        }
    }

    private void HandleRoomUpdate(SocketIOResponse response)
    {
        try
        {
            var json = response.GetValue<JObject>();
            var roomJson = json["room"]?.ToString();
            
            if (!string.IsNullOrEmpty(roomJson))
            {
                var wrapper = Newtonsoft.Json.JsonConvert.DeserializeObject<PlayerViewWrapper>(roomJson);
                
                if (wrapper != null)
                {
                    PlayerView = ParsePlayerView(wrapper);
                    CurrentRoom = PlayerView.room;
                    
                    OnPlayerViewUpdated?.Invoke(PlayerView);
                    Debug.Log($"Player view updated. My turn: {PlayerView.isMyTurn}");
                }
            }
        }
        catch (Exception ex)
        {
            Debug.LogError($"Error parsing room update: {ex.Message}");
        }
    }

    private PlayerView ParsePlayerView(PlayerViewWrapper wrapper)
    {
        var view = new PlayerView
        {
            room = wrapper.room,
            myHand = new List<TileData>(),
            myMelds = new List<MeldData>(),
            myDiscardedTiles = new List<TileData>(),
            availableActions = wrapper.availableActions ?? new List<string>(),
            isMyTurn = wrapper.isMyTurn
        };

        if (wrapper.myHand != null)
        {
            foreach (var tileJson in wrapper.myHand)
            {
                view.myHand.Add(new TileData(tileJson.type, tileJson.rank, tileJson.id));
            }
        }

        if (wrapper.myMelds != null)
        {
            foreach (var meldJson in wrapper.myMelds)
            {
                var meld = new MeldData
                {
                    type = MeldData.ParseMeldType(meldJson.type),
                    tiles = new List<TileData>(),
                    fromPlayerIndex = meldJson.fromPlayer
                };

                if (meldJson.tiles != null)
                {
                    foreach (var tileJson in meldJson.tiles)
                    {
                        meld.tiles.Add(new TileData(tileJson.type, tileJson.rank, tileJson.id));
                    }
                }

                view.myMelds.Add(meld);
            }
        }

        if (wrapper.myDiscardedTiles != null)
        {
            foreach (var tileJson in wrapper.myDiscardedTiles)
            {
                view.myDiscardedTiles.Add(new TileData(tileJson.type, tileJson.rank, tileJson.id));
            }
        }

        return view;
    }

    private void HandleGameStarted(SocketIOResponse response)
    {
        var json = response.GetValue<JObject>();
        var state = json["gameState"]?.ToString();
        OnGameStarted?.Invoke(state);
        Debug.Log($"Game started: {state}");
    }

    private void HandleTileDiscarded(SocketIOResponse response)
    {
        try
        {
            var json = response.GetValue<JObject>();
            var playerId = json["playerId"]?.ToString();
            var tileJson = json["tile"];
            
            if (tileJson != null)
            {
                var tile = new TileData(
                    tileJson["type"]?.ToString(),
                    (int)tileJson["rank"]
                );
                
                OnTileDiscarded?.Invoke(playerId, tile);
                Debug.Log($"Tile discarded by {playerId}: {tile.type}_{tile.rank}");
            }
        }
        catch (Exception ex)
        {
            Debug.LogError($"Error handling tile discarded: {ex.Message}");
        }
    }

    private void HandleActionTaken(SocketIOResponse response)
    {
        try
        {
            var json = response.GetValue<JObject>();
            var playerId = json["playerId"]?.ToString();
            var action = json["action"]?.ToString();
            var tileJson = json["tile"];
            
            TileData tile = null;
            if (tileJson != null)
            {
                tile = new TileData(
                    tileJson["type"]?.ToString(),
                    (int)tileJson["rank"]
                );
            }
            
            OnActionTaken?.Invoke(playerId, action, tile);
            Debug.Log($"Action taken by {playerId}: {action}");
        }
        catch (Exception ex)
        {
            Debug.LogError($"Error handling action taken: {ex.Message}");
        }
    }

    public void JoinPlayer(string playerName)
    {
        currentPlayerName = playerName;
        
        SocketManager.Instance.Emit("player:join", new { name = playerName }, response =>
        {
            var json = response.GetValue<JObject>();
            var success = json["success"]?.ToObject<bool>() ?? false;
            
            if (success)
            {
                currentPlayerId = json["player"]?["id"]?.ToString();
                Debug.Log($"Player joined: {currentPlayerId}");
            }
            else
            {
                var message = json["message"]?.ToString() ?? "Unknown error";
                OnErrorMessage?.Invoke(message);
            }
        });
    }

    public void CreateRoom(string roomName = null)
    {
        var data = string.IsNullOrEmpty(roomName) ? new { } : new { name = roomName };
        
        SocketManager.Instance.Emit("room:create", data, response =>
        {
            var json = response.GetValue<JObject>();
            var success = json["success"]?.ToObject<bool>() ?? false;
            
            if (!success)
            {
                var message = json["message"]?.ToString() ?? "Create room failed";
                OnErrorMessage?.Invoke(message);
            }
        });
    }

    public void JoinRoom(string roomId)
    {
        SocketManager.Instance.Emit("room:join", new { roomId }, response =>
        {
            var json = response.GetValue<JObject>();
            var success = json["success"]?.ToObject<bool>() ?? false;
            
            if (!success)
            {
                var message = json["message"]?.ToString() ?? "Join room failed";
                OnErrorMessage?.Invoke(message);
            }
        });
    }

    public void LeaveRoom()
    {
        SocketManager.Instance.Emit("room:leave", new { }, response =>
        {
            var json = response.GetValue<JObject>();
            var success = json["success"]?.ToObject<bool>() ?? false;
            
            if (success)
            {
                currentRoomId = null;
            }
            else
            {
                var message = json["message"]?.ToString() ?? "Leave room failed";
                OnErrorMessage?.Invoke(message);
            }
        });
    }

    public void SetReady(bool ready)
    {
        SocketManager.Instance.Emit("game:ready", new { ready }, response =>
        {
            var json = response.GetValue<JObject>();
            var success = json["success"]?.ToObject<bool>() ?? false;
            
            if (!success)
            {
                var message = json["message"]?.ToString() ?? "Set ready failed";
                OnErrorMessage?.Invoke(message);
            }
        });
    }

    public void StartGame()
    {
        SocketManager.Instance.Emit("game:start", response =>
        {
            var json = response.GetValue<JObject>();
            var success = json["success"]?.ToObject<bool>() ?? false;
            
            if (!success)
            {
                var message = json["message"]?.ToString() ?? "Start game failed";
                OnErrorMessage?.Invoke(message);
            }
        });
    }

    public void DiscardTile(string tileId)
    {
        if (!TryStartOperation("discard"))
        {
            Debug.Log("Discard ignored: already processing an operation");
            return;
        }

        SocketManager.Instance.Emit("game:discard", new { tileId }, response =>
        {
            UnityThread.executeInUpdate(() =>
            {
                var json = response.GetValue<JObject>();
                var success = json["success"]?.ToObject<bool>() ?? false;
                
                ClearOperationState();
                
                if (!success)
                {
                    var message = json["message"]?.ToString() ?? "Discard failed";
                    OnErrorMessage?.Invoke(message);
                }
            });
        });
    }

    public void PerformAction(string action, string tileType = null, int? tileRank = null)
    {
        if (!TryStartOperation($"action:{action}"))
        {
            Debug.Log($"Action '{action}' ignored: already processing an operation");
            return;
        }

        var data = new GameAction(action, tileType, tileRank);
        SocketManager.Instance.Emit("game:action", data, response =>
        {
            UnityThread.executeInUpdate(() =>
            {
                var json = response.GetValue<JObject>();
                var success = json["success"]?.ToObject<bool>() ?? false;
                
                ClearOperationState();
                
                if (!success)
                {
                    var message = json["message"]?.ToString() ?? "Action failed";
                    OnErrorMessage?.Invoke(message);
                }
            });
        });
    }

    public void NextRound()
    {
        SocketManager.Instance.Emit("game:next_round", response =>
        {
            var json = response.GetValue<JObject>();
            var success = json["success"]?.ToObject<bool>() ?? false;
            
            if (!success)
            {
                var message = json["message"]?.ToString() ?? "Next round failed";
                OnErrorMessage?.Invoke(message);
            }
        });
    }

    public PublicPlayerData GetPlayerBySeat(int seatIndex)
    {
        if (CurrentRoom?.players == null) return null;
        return CurrentRoom.players.Find(p => p.seatIndex == seatIndex);
    }

    public PublicPlayerData GetCurrentPlayer()
    {
        if (CurrentRoom == null) return null;
        return GetPlayerBySeat(CurrentRoom.currentPlayerIndex);
    }

    public void GetHistoryList(int limit = 20, int offset = 0)
    {
        SocketManager.Instance.Emit("history:list", new { limit, offset }, response =>
        {
            UnityThread.executeInUpdate(() =>
            {
                var json = response.GetValue<JObject>();
                var success = json["success"]?.ToObject<bool>() ?? false;
                
                if (success)
                {
                    var result = new GameRecordListResult
                    {
                        Success = true,
                        Total = json["total"]?.ToObject<int>() ?? 0,
                        HasMore = json["hasMore"]?.ToObject<bool>() ?? false,
                        Records = new List<GameRecordSummary>()
                    };

                    var recordsJson = json["records"];
                    if (recordsJson != null)
                    {
                        foreach (var recordJson in recordsJson)
                        {
                            var summary = ParseGameRecordSummary(recordJson);
                            if (summary != null)
                            {
                                result.Records.Add(summary);
                            }
                        }
                    }

                    OnHistoryListReceived?.Invoke(result);
                }
                else
                {
                    var message = json["message"]?.ToString() ?? "获取历史记录失败";
                    OnErrorMessage?.Invoke(message);
                    OnHistoryListReceived?.Invoke(new GameRecordListResult { Success = false, ErrorMessage = message });
                }
            });
        });
    }

    public void GetHistoryDetail(string recordId)
    {
        SocketManager.Instance.Emit("history:get", new { recordId }, response =>
        {
            UnityThread.executeInUpdate(() =>
            {
                var json = response.GetValue<JObject>();
                var success = json["success"]?.ToObject<bool>() ?? false;
                
                if (success)
                {
                    var recordJson = json["record"];
                    if (recordJson != null)
                    {
                        var detail = ParseGameRecordDetail(recordJson);
                        if (detail != null)
                        {
                            OnHistoryDetailReceived?.Invoke(detail);
                        }
                    }
                }
                else
                {
                    var message = json["message"]?.ToString() ?? "获取记录详情失败";
                    OnErrorMessage?.Invoke(message);
                }
            });
        });
    }

    public void GetStatistics()
    {
        SocketManager.Instance.Emit("stats:get", response =>
        {
            UnityThread.executeInUpdate(() =>
            {
                var json = response.GetValue<JObject>();
                var success = json["success"]?.ToObject<bool>() ?? false;
                
                if (success)
                {
                    var statsJson = json["stats"];
                    if (statsJson != null)
                    {
                        var stats = new PlayerStatistics
                        {
                            PlayerId = statsJson["playerId"]?.ToString(),
                            PlayerName = statsJson["playerName"]?.ToString(),
                            TotalGames = statsJson["totalGames"]?.ToObject<int>() ?? 0,
                            Wins = statsJson["wins"]?.ToObject<int>() ?? 0,
                            Losses = statsJson["losses"]?.ToObject<int>() ?? 0,
                            TotalScore = statsJson["totalScore"]?.ToObject<int>() ?? 0,
                            HighestScore = statsJson["highestScore"]?.ToObject<int>() ?? 0,
                            LowestScore = statsJson["lowestScore"]?.ToObject<int>() ?? 0,
                            TotalFan = statsJson["totalFan"]?.ToObject<int>() ?? 0,
                            HighestFan = statsJson["highestFan"]?.ToObject<int>() ?? 0,
                            MaxWinStreak = statsJson["maxWinStreak"]?.ToObject<int>() ?? 0,
                            CurrentWinStreak = statsJson["currentWinStreak"]?.ToObject<int>() ?? 0,
                            LastPlayed = statsJson["lastPlayed"]?.ToObject<long>() ?? 0,
                        };
                        OnStatisticsReceived?.Invoke(stats);
                    }
                }
                else
                {
                    var message = json["message"]?.ToString() ?? "获取统计信息失败";
                    OnErrorMessage?.Invoke(message);
                }
            });
        });
    }

    private GameRecordSummary ParseGameRecordSummary(JToken json)
    {
        if (json == null) return null;
        
        var summary = new GameRecordSummary
        {
            RecordId = json["id"]?.ToString(),
            RoomId = json["roomId"]?.ToString(),
            RoomName = json["roomName"]?.ToString(),
            RoundNumber = json["roundNumber"]?.ToObject<int>() ?? 0,
            StartTime = json["startTime"]?.ToObject<long>() ?? 0,
            EndTime = json["endTime"]?.ToObject<long>() ?? 0,
            Duration = json["duration"]?.ToObject<int>() ?? 0,
            IsDraw = json["isDraw"]?.ToObject<bool>() ?? false,
            WinnerPlayerId = json["winnerPlayerId"]?.ToString(),
            PlayerResults = new List<PlayerGameResultSummary>()
        };

        var playersJson = json["players"];
        if (playersJson != null)
        {
            foreach (var playerJson in playersJson)
            {
                var result = new PlayerGameResultSummary
                {
                    PlayerId = playerJson["playerId"]?.ToString(),
                    PlayerName = playerJson["playerName"]?.ToString(),
                    SeatIndex = playerJson["seatIndex"]?.ToObject<int>() ?? 0,
                    IsBanker = playerJson["isBanker"]?.ToObject<bool>() ?? false,
                    IsWinner = playerJson["isWinner"]?.ToObject<bool>() ?? false,
                    ScoreChange = playerJson["scoreChange"]?.ToObject<int>() ?? 0,
                    FanType = playerJson["fanType"]?.ToString(),
                    FanCount = playerJson["fanCount"]?.ToObject<int>() ?? 0,
                };
                summary.PlayerResults.Add(result);
            }
        }

        return summary;
    }

    private GameRecordDetail ParseGameRecordDetail(JToken json)
    {
        if (json == null) return null;
        
        var summary = ParseGameRecordSummary(json);
        if (summary == null) return null;

        var detail = new GameRecordDetail
        {
            Summary = summary,
            Operations = new List<GameOperationRecord>()
        };

        var initialStateJson = json["initialState"];
        if (initialStateJson != null)
        {
            detail.InitialState = new GameInitialState
            {
                BankerIndex = initialStateJson["bankerIndex"]?.ToObject<int>() ?? 0,
                PlayerHands = new Dictionary<int, List<TileData>>()
            };

            var handsJson = initialStateJson["playerHands"];
            if (handsJson != null)
            {
                foreach (var property in (JObject)handsJson)
                {
                    if (int.TryParse(property.Key, out int seatIndex) && property.Value is JArray tilesJson)
                    {
                        var tiles = new List<TileData>();
                        foreach (var tileJson in tilesJson)
                        {
                            var tile = new TileData(
                                tileJson["type"]?.ToString(),
                                tileJson["rank"]?.ToObject<int>() ?? 1,
                                tileJson["id"]?.ToString()
                            );
                            tiles.Add(tile);
                        }
                        detail.InitialState.PlayerHands[seatIndex] = tiles;
                    }
                }
            }
        }

        var operationsJson = json["operations"];
        if (operationsJson != null)
        {
            foreach (var opJson in operationsJson)
            {
                var op = new GameOperationRecord
                {
                    OperationId = opJson["id"]?.ToString(),
                    Type = opJson["type"]?.ToString(),
                    Timestamp = opJson["timestamp"]?.ToObject<long>() ?? 0,
                    PlayerIndex = opJson["playerIndex"]?.ToObject<int>() ?? 0,
                    PlayerId = opJson["playerId"]?.ToString(),
                    PlayerName = opJson["playerName"]?.ToString(),
                    TargetPlayerIndex = opJson["targetPlayerIndex"]?.ToObject<int?>(),
                    FanType = opJson["fanType"]?.ToString(),
                    FanCount = opJson["fanCount"]?.ToObject<int>() ?? 0,
                    ScoreChange = opJson["scoreChange"]?.ToObject<int?>(),
                };

                var tileJson = opJson["tile"];
                if (tileJson != null)
                {
                    op.Tile = new TileData(
                        tileJson["type"]?.ToString(),
                        tileJson["rank"]?.ToObject<int>() ?? 1,
                        tileJson["id"]?.ToString()
                    );
                }

                var tilesJson = opJson["tiles"];
                if (tilesJson is JArray tilesArray)
                {
                    op.Tiles = new List<TileData>();
                    foreach (var tJson in tilesArray)
                    {
                        var tile = new TileData(
                            tJson["type"]?.ToString(),
                            tJson["rank"]?.ToObject<int>() ?? 1,
                            tJson["id"]?.ToString()
                        );
                        op.Tiles.Add(tile);
                    }
                }

                detail.Operations.Add(op);
            }
        }

        return detail;
    }

    private void OnDestroy()
    {
        if (SocketManager.Instance != null)
        {
            SocketManager.Instance.OnEventReceived -= HandleSocketEvent;
        }
    }
}

[Serializable]
public class PlayerStatistics
{
    public string PlayerId;
    public string PlayerName;
    public int TotalGames;
    public int Wins;
    public int Losses;
    public int TotalScore;
    public int HighestScore;
    public int LowestScore;
    public int TotalFan;
    public int HighestFan;
    public int MaxWinStreak;
    public int CurrentWinStreak;
    public long LastPlayed;

    public float WinRate => TotalGames > 0 ? (float)Wins / TotalGames : 0;
}

[Serializable]
public class GameRecordListResult
{
    public bool Success;
    public string ErrorMessage;
    public int Total;
    public bool HasMore;
    public List<GameRecordSummary> Records;
}

[Serializable]
public class GameRecordSummary
{
    public string RecordId;
    public string RoomId;
    public string RoomName;
    public int RoundNumber;
    public long StartTime;
    public long EndTime;
    public int Duration;
    public bool IsDraw;
    public string WinnerPlayerId;
    public List<PlayerGameResultSummary> PlayerResults;

    public DateTime StartTimeUtc => DateTimeOffset.FromUnixTimeMilliseconds(StartTime).DateTime;
    public DateTime EndTimeUtc => DateTimeOffset.FromUnixTimeMilliseconds(EndTime).DateTime;
}

[Serializable]
public class PlayerGameResultSummary
{
    public string PlayerId;
    public string PlayerName;
    public int SeatIndex;
    public bool IsBanker;
    public bool IsWinner;
    public int ScoreChange;
    public string FanType;
    public int FanCount;
}

[Serializable]
public class GameRecordDetail
{
    public GameRecordSummary Summary;
    public GameInitialState InitialState;
    public List<GameOperationRecord> Operations;
}

[Serializable]
public class GameInitialState
{
    public int BankerIndex;
    public Dictionary<int, List<TileData>> PlayerHands;
}

[Serializable]
public class GameOperationRecord
{
    public string OperationId;
    public string Type;
    public long Timestamp;
    public int PlayerIndex;
    public string PlayerId;
    public string PlayerName;
    public TileData Tile;
    public List<TileData> Tiles;
    public int? TargetPlayerIndex;
    public string FanType;
    public int FanCount;
    public int? ScoreChange;

    public DateTime TimestampUtc => DateTimeOffset.FromUnixTimeMilliseconds(Timestamp).DateTime;
}

[Serializable]
public class PlayerViewWrapper
{
    public RoomData room;
    public List<TileJson> myHand;
    public List<MeldJson> myMelds;
    public List<TileJson> myDiscardedTiles;
    public List<string> availableActions;
    public bool isMyTurn;
}

[Serializable]
public class TileJson
{
    public string type;
    public int rank;
    public string id;
}

[Serializable]
public class MeldJson
{
    public string type;
    public List<TileJson> tiles;
    public int fromPlayer;
}
