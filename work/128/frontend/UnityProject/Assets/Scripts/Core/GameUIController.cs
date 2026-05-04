using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

public class GameUIController : MonoBehaviour
{
    [Header("Managers")]
    public SocketManager socketManager;
    public GameManager gameManager;

    [Header("Panels")]
    public GameObject loginPanel;
    public GameObject lobbyPanel;
    public GameObject gamePanel;

    [Header("Login")]
    public InputField playerNameInput;
    public Button loginButton;

    [Header("Lobby")]
    public Transform roomListContainer;
    public GameObject roomItemPrefab;
    public Button createRoomButton;
    public InputField roomNameInput;
    public Button refreshButton;

    [Header("Room")]
    public PlayerInfoDisplay[] playerInfoDisplays;
    public Button readyButton;
    public Button startButton;
    public Button leaveRoomButton;
    public Text roomNameText;

    [Header("Game")]
    public HandDisplay myHandDisplay;
    public MeldsContainer myMeldsContainer;
    public TileWallDisplay tileWallDisplay;
    public ActionPanel actionPanel;
    public Button discardButton;
    public Text currentTurnText;
    public Text gameMessageText;

    [Header("Opponents")]
    public HandDisplay[] opponentHandDisplays;
    public MeldsContainer[] opponentMeldsContainers;

    private TileDisplay _selectedTile;

    private void Awake()
    {
        if (socketManager == null)
            socketManager = FindObjectOfType<SocketManager>();
        if (gameManager == null)
            gameManager = FindObjectOfType<GameManager>();
    }

    private void Start()
    {
        SetupEventListeners();
        ShowPanel(loginPanel);
    }

    private void SetupEventListeners()
    {
        if (loginButton != null)
            loginButton.onClick.AddListener(OnLoginClicked);
        
        if (createRoomButton != null)
            createRoomButton.onClick.AddListener(OnCreateRoomClicked);
        
        if (refreshButton != null)
            refreshButton.onClick.AddListener(OnRefreshClicked);
        
        if (readyButton != null)
            readyButton.onClick.AddListener(OnReadyClicked);
        
        if (startButton != null)
            startButton.onClick.AddListener(OnStartClicked);
        
        if (leaveRoomButton != null)
            leaveRoomButton.onClick.AddListener(OnLeaveRoomClicked);
        
        if (discardButton != null)
            discardButton.onClick.AddListener(OnDiscardClicked);

        if (myHandDisplay != null)
        {
            myHandDisplay.OnTileSelected += OnTileSelected;
            myHandDisplay.OnTileDeselected += OnTileDeselected;
        }

        if (actionPanel != null)
        {
            actionPanel.OnActionSelected += OnActionSelected;
        }

        if (gameManager != null)
        {
            gameManager.OnPlayerViewUpdated += OnPlayerViewUpdated;
            gameManager.OnGameStarted += OnGameStarted;
            gameManager.OnTileDiscarded += OnTileDiscarded;
            gameManager.OnActionTaken += OnActionTaken;
            gameManager.OnErrorMessage += OnErrorMessage;
            gameManager.OnOperationStateChanged += OnOperationStateChanged;
        }

        if (socketManager != null)
        {
            socketManager.OnConnected += OnSocketConnected;
            socketManager.OnDisconnected += OnSocketDisconnected;
        }
    }

    private void OnSocketConnected()
    {
        ShowMessage("连接成功!");
    }

    private void OnSocketDisconnected()
    {
        ShowMessage("连接断开，请重新登录");
        ShowPanel(loginPanel);
    }

    private void OnLoginClicked()
    {
        if (socketManager != null && !socketManager.IsConnected())
        {
            socketManager.Connect();
        }

        string playerName = playerNameInput?.text ?? "玩家";
        if (string.IsNullOrWhiteSpace(playerName))
            playerName = $"玩家{Random.Range(1000, 9999)}";

        gameManager?.JoinPlayer(playerName);
        ShowPanel(lobbyPanel);
        ShowMessage($"欢迎, {playerName}!");
    }

    private void OnCreateRoomClicked()
    {
        string roomName = roomNameInput?.text;
        if (string.IsNullOrWhiteSpace(roomName))
            roomName = null;

        gameManager?.CreateRoom(roomName);
    }

    private void OnRefreshClicked()
    {
        RefreshRoomList();
    }

    private void RefreshRoomList()
    {
        if (roomListContainer == null) return;

        foreach (Transform child in roomListContainer)
        {
            Destroy(child.gameObject);
        }
    }

    private void OnReadyClicked()
    {
        var playerView = gameManager?.PlayerView;
        if (playerView == null) return;

        var me = playerView.room?.players?.Find(p => p.id == gameManager.currentPlayerId);
        if (me == null) return;

        gameManager?.SetReady(!me.isReady);
    }

    private void OnStartClicked()
    {
        gameManager?.StartGame();
    }

    private void OnLeaveRoomClicked()
    {
        gameManager?.LeaveRoom();
        ShowPanel(lobbyPanel);
    }

    private void OnDiscardClicked()
    {
        if (_selectedTile == null)
        {
            ShowMessage("请先选择要出的牌");
            return;
        }

        gameManager?.DiscardTile(_selectedTile.TileData.id);
        _selectedTile = null;
    }

    private void OnTileSelected(TileDisplay tile)
    {
        _selectedTile = tile;
        if (discardButton != null)
            discardButton.interactable = true;
    }

    private void OnTileDeselected(TileDisplay tile)
    {
        if (_selectedTile == tile)
        {
            _selectedTile = null;
            if (discardButton != null)
                discardButton.interactable = false;
        }
    }

    private void OnActionSelected(string action)
    {
        gameManager?.PerformAction(action);
    }

    private void OnPlayerViewUpdated(PlayerView playerView)
    {
        UpdateRoomUI(playerView);
        UpdateGameUI(playerView);
    }

    private void UpdateRoomUI(PlayerView playerView)
    {
        var room = playerView.room;
        if (room == null) return;

        if (roomNameText != null)
            roomNameText.text = room.name;

        for (int i = 0; i < playerInfoDisplays.Length; i++)
        {
            var display = playerInfoDisplays[i];
            if (display == null) continue;

            var player = room.players?.Find(p => p.seatIndex == i);
            bool isCurrentTurn = room.currentPlayerIndex == i;
            bool isMe = player?.id == gameManager.currentPlayerId;

            display.UpdatePlayer(player, isCurrentTurn, isMe);
        }

        var me = room.players?.Find(p => p.id == gameManager.currentPlayerId);
        if (me != null)
        {
            if (readyButton != null)
            {
                readyButton.GetComponentInChildren<Text>().text = me.isReady ? "取消准备" : "准备";
            }

            if (startButton != null)
            {
                startButton.gameObject.SetActive(me.isHost && room.gameState == "waiting");
                startButton.interactable = room.players.TrueForAll(p => p.isReady);
            }
        }

        if (room.gameState == "waiting")
        {
            ShowPanel(gamePanel, false);
            ShowPanel(lobbyPanel, false);
        }
        else
        {
            ShowPanel(gamePanel);
        }
    }

    private void UpdateGameUI(PlayerView playerView)
    {
        var room = playerView.room;
        if (room == null) return;

        if (myHandDisplay != null)
        {
            myHandDisplay.UpdateHand(playerView.myHand);
            myHandDisplay.SetSelectable(playerView.isMyTurn && playerView.availableActions.Count == 0);
        }

        if (myMeldsContainer != null)
        {
            myMeldsContainer.UpdateMelds(playerView.myMelds);
        }

        if (tileWallDisplay != null)
        {
            tileWallDisplay.UpdateRemainingTiles(room.deck);
        }

        if (currentTurnText != null)
        {
            var currentPlayer = room.players?.Find(p => p.seatIndex == room.currentPlayerIndex);
            if (currentPlayer != null)
            {
                currentTurnText.text = playerView.isMyTurn ? "轮到你出牌" : $"{currentPlayer.name} 出牌中...";
            }
        }

        if (playerView.availableActions.Count > 0)
        {
            actionPanel?.ShowPanel(playerView.availableActions);
        }
        else if (actionPanel != null && actionPanel.IsVisible())
        {
            actionPanel.HidePanel();
        }

        if (discardButton != null)
        {
            discardButton.interactable = _selectedTile != null && playerView.isMyTurn && playerView.availableActions.Count == 0;
        }

        UpdateOpponentUI(room);
    }

    private void UpdateOpponentUI(RoomData room)
    {
        if (opponentHandDisplays == null || opponentMeldsContainers == null) return;

        int mySeat = -1;
        var me = room.players?.Find(p => p.id == gameManager.currentPlayerId);
        if (me != null)
        {
            mySeat = me.seatIndex;
        }

        int displayIndex = 0;
        for (int i = 0; i < 4; i++)
        {
            if (i == mySeat) continue;
            if (displayIndex >= opponentHandDisplays.Length) break;

            var player = room.players?.Find(p => p.seatIndex == i);
            if (player != null)
            {
                if (opponentHandDisplays[displayIndex] != null)
                {
                    opponentHandDisplays[displayIndex].isMyHand = false;
                    opponentHandDisplays[displayIndex].selectable = false;
                }

                if (opponentMeldsContainers[displayIndex] != null && player.melds != null)
                {
                    opponentMeldsContainers[displayIndex].UpdateMelds(player.melds);
                }
            }

            displayIndex++;
        }
    }

    private void OnGameStarted(string state)
    {
        ShowMessage("游戏开始!");
        ShowPanel(gamePanel);
    }

    private void OnTileDiscarded(string playerId, TileData tile)
    {
        var player = GameManager.Instance?.GetPlayerBySeat(0);
        if (player?.id == playerId)
        {
            ShowMessage($"你打出了 {tile.GetTypeString()}_{tile.rank}");
        }
    }

    private void OnActionTaken(string playerId, string action, TileData tile)
    {
        var player = GameManager.Instance?.GetPlayerBySeat(0);
        string playerName = player?.id == playerId ? "你" : "其他玩家";
        
        string actionText = action switch
        {
            "peng" => "碰了",
            "gang" => "杠了",
            "an_gang" => "暗杠了",
            "bu_gang" => "补杠了",
            "hu" => "胡了!",
            _ => action
        };

        if (tile != null)
        {
            ShowMessage($"{playerName}{actionText} {tile.GetTypeString()}_{tile.rank}");
        }
        else
        {
            ShowMessage($"{playerName}{actionText}");
        }
    }

    private void OnErrorMessage(string message)
    {
        ShowMessage($"错误: {message}");
    }

    private void OnOperationStateChanged(bool isProcessing)
    {
        Debug.Log($"Operation state changed: {(isProcessing ? "Processing" : "Idle")}");
        
        if (myHandDisplay != null)
        {
            if (isProcessing)
            {
                myHandDisplay.SetSelectable(false);
            }
            else if (gameManager != null && gameManager.PlayerView != null)
            {
                myHandDisplay.SetSelectable(
                    gameManager.PlayerView.isMyTurn && 
                    gameManager.PlayerView.availableActions.Count == 0
                );
            }
        }

        if (discardButton != null)
        {
            if (isProcessing)
            {
                discardButton.interactable = false;
            }
            else
            {
                discardButton.interactable = _selectedTile != null && 
                    gameManager != null && 
                    gameManager.PlayerView != null &&
                    gameManager.PlayerView.isMyTurn && 
                    gameManager.PlayerView.availableActions.Count == 0;
            }
        }

        if (actionPanel != null && actionPanel.IsVisible())
        {
            actionPanel.enabled = !isProcessing;
        }
    }

    private void ShowMessage(string message)
    {
        if (gameMessageText != null)
        {
            gameMessageText.text = message;
            CancelInvoke(nameof(ClearMessage));
            Invoke(nameof(ClearMessage), 3f);
        }
        Debug.Log(message);
    }

    private void ClearMessage()
    {
        if (gameMessageText != null)
        {
            gameMessageText.text = "";
        }
    }

    private void ShowPanel(GameObject panel, bool show = true)
    {
        loginPanel?.SetActive(panel == loginPanel && show);
        lobbyPanel?.SetActive(panel == lobbyPanel && show);
        gamePanel?.SetActive(panel == gamePanel && show);
    }
}
