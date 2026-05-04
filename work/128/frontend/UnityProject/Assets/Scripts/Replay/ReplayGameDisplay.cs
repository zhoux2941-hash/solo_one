using System;
using System.Collections.Generic;
using UnityEngine;

public class ReplayGameDisplay : MonoBehaviour
{
    [Header("Display Settings")]
    public bool showOtherPlayersHands = true;
    public int mySeatIndex = 0;

    [Header("Player Displays")]
    public ReplayPlayerDisplay playerDisplay0;
    public ReplayPlayerDisplay playerDisplay1;
    public ReplayPlayerDisplay playerDisplay2;
    public ReplayPlayerDisplay playerDisplay3;

    [Header("Tile Wall Display")]
    public GameObject tileWallContainer;
    public Text remainingTilesText;

    private GameReplayState _currentState;
    private Dictionary<int, ReplayPlayerDisplay> _playerDisplays;

    private void Awake()
    {
        _playerDisplays = new Dictionary<int, ReplayPlayerDisplay>
        {
            { 0, playerDisplay0 },
            { 1, playerDisplay1 },
            { 2, playerDisplay2 },
            { 3, playerDisplay3 }
        };
    }

    private void OnEnable()
    {
        if (GameReplayController.Instance != null)
        {
            GameReplayController.Instance.OnStateUpdated += OnStateUpdated;
            GameReplayController.Instance.OnOperationReplayed += OnOperationReplayed;
        }
    }

    private void OnDisable()
    {
        if (GameReplayController.Instance != null)
        {
            GameReplayController.Instance.OnStateUpdated -= OnStateUpdated;
            GameReplayController.Instance.OnOperationReplayed -= OnOperationReplayed;
        }
    }

    public void SetMySeatIndex(int seatIndex)
    {
        mySeatIndex = seatIndex;
    }

    public void SetShowOtherPlayersHands(bool show)
    {
        showOtherPlayersHands = show;
        if (_currentState != null)
        {
            RefreshDisplay();
        }
    }

    private void OnStateUpdated(GameReplayState state)
    {
        _currentState = state;
        RefreshDisplay();
    }

    private void OnOperationReplayed(int index, GameOperationRecord operation)
    {
        HighlightOperation(operation);
    }

    private void RefreshDisplay()
    {
        if (_currentState == null) return;

        foreach (var kvp in _playerDisplays)
        {
            int seatIndex = kvp.Key;
            var display = kvp.Value;

            if (display == null) continue;

            bool isMySeat = (seatIndex == mySeatIndex);
            bool showHand = isMySeat || showOtherPlayersHands;

            List<TileData> hand = null;
            if (_currentState.PlayerHands.ContainsKey(seatIndex))
            {
                hand = _currentState.PlayerHands[seatIndex];
            }

            List<MeldData> melds = null;
            if (_currentState.PlayerMelds.ContainsKey(seatIndex))
            {
                melds = _currentState.PlayerMelds[seatIndex];
            }

            List<TileData> discarded = null;
            if (_currentState.PlayerDiscardedTiles.ContainsKey(seatIndex))
            {
                discarded = _currentState.PlayerDiscardedTiles[seatIndex];
            }

            bool isCurrentPlayer = (_currentState.CurrentPlayerIndex == seatIndex);
            bool isBanker = (_currentState.BankerIndex == seatIndex);

            int score = 0;
            if (_currentState.PlayerScores.ContainsKey(seatIndex))
            {
                score = _currentState.PlayerScores[seatIndex];
            }

            display.UpdateDisplay(
                seatIndex,
                isMySeat,
                showHand,
                hand,
                melds,
                discarded,
                isCurrentPlayer,
                isBanker,
                score
            );
        }

        if (remainingTilesText != null)
        {
            remainingTilesText.text = $"{_currentState.RemainingTiles} / {_currentState.TotalTiles}";
        }
    }

    private void HighlightOperation(GameOperationRecord operation)
    {
        if (operation == null) return;

        int playerIndex = operation.PlayerIndex;
        if (_playerDisplays.ContainsKey(playerIndex) && _playerDisplays[playerIndex] != null)
        {
            _playerDisplays[playerIndex].HighlightOperation(operation);
        }

        foreach (var kvp in _playerDisplays)
        {
            if (kvp.Value != null && kvp.Key != playerIndex)
            {
                kvp.Value.ClearHighlight();
            }
        }
    }

    public void ClearDisplay()
    {
        foreach (var display in _playerDisplays.Values)
        {
            if (display != null)
            {
                display.ClearDisplay();
            }
        }

        if (remainingTilesText != null)
        {
            remainingTilesText.text = "108 / 108";
        }
    }
}

public class ReplayPlayerDisplay : MonoBehaviour
{
    [Header("References")]
    public HandDisplay handDisplay;
    public MeldsContainer meldsContainer;
    public Transform discardedTilesContainer;
    public GameObject tilePrefab;
    public Text playerNameText;
    public Text scoreText;
    public GameObject currentPlayerIndicator;
    public GameObject bankerIndicator;

    [Header("Settings")]
    public int maxDiscardedShown = 24;

    private List<TileData> _discardedTiles;
    private List<GameObject> _discardedTileObjects;
    private int _seatIndex = -1;
    private bool _isHighlighted = false;

    private void Awake()
    {
        _discardedTiles = new List<TileData>();
        _discardedTileObjects = new List<GameObject>();
    }

    public void UpdateDisplay(
        int seatIndex,
        bool isMySeat,
        bool showHand,
        List<TileData> hand,
        List<MeldData> melds,
        List<TileData> discarded,
        bool isCurrentPlayer,
        bool isBanker,
        int score)
    {
        _seatIndex = seatIndex;

        if (handDisplay != null)
        {
            if (showHand && hand != null)
            {
                handDisplay.SetTiles(hand);
                handDisplay.SetFaceUp(true);
            }
            else
            {
                if (hand != null)
                {
                    handDisplay.SetTiles(hand);
                    handDisplay.SetFaceUp(false);
                }
            }
        }

        if (meldsContainer != null)
        {
            if (melds != null)
            {
                meldsContainer.SetMelds(melds);
            }
            else
            {
                meldsContainer.SetMelds(new List<MeldData>());
            }
        }

        UpdateDiscardedTiles(discarded);

        if (currentPlayerIndicator != null)
        {
            currentPlayerIndicator.SetActive(isCurrentPlayer);
        }

        if (bankerIndicator != null)
        {
            bankerIndicator.SetActive(isBanker);
        }

        if (scoreText != null)
        {
            string prefix = score >= 0 ? "+" : "";
            scoreText.text = $"{prefix}{score}";
            scoreText.color = score >= 0 ? Color.green : Color.red;
        }
    }

    private void UpdateDiscardedTiles(List<TileData> discarded)
    {
        if (discardedTilesContainer == null) return;

        int tileCount = discarded?.Count ?? 0;
        int displayCount = Mathf.Min(tileCount, maxDiscardedShown);
        int startIndex = Mathf.Max(0, tileCount - maxDiscardedShown);

        while (_discardedTileObjects.Count > 0)
        {
            Destroy(_discardedTileObjects[0]);
            _discardedTileObjects.RemoveAt(0);
        }

        _discardedTiles.Clear();

        if (discarded == null || tilePrefab == null) return;

        for (int i = startIndex; i < tileCount; i++)
        {
            var tile = discarded[i];
            _discardedTiles.Add(tile);

            GameObject tileObj = Instantiate(tilePrefab, discardedTilesContainer);
            var tileDisplay = tileObj.GetComponent<TileDisplay>();

            if (tileDisplay != null)
            {
                tileDisplay.SetTile(tile);
                tileDisplay.SetFaceUp(true);
            }

            _discardedTileObjects.Add(tileObj);
        }
    }

    public void HighlightOperation(GameOperationRecord operation)
    {
        if (operation == null) return;

        _isHighlighted = true;

        switch (operation.Type?.ToUpper())
        {
            case "DISCARD":
                HighlightLastDiscarded();
                break;

            case "DRAW":
                HighlightLastHandTile();
                break;

            case "PENG":
            case "GANG":
            case "MING_GANG":
            case "AN_GANG":
            case "BU_GANG":
                HighlightLastMeld();
                break;

            case "HU":
                HighlightHu();
                break;
        }
    }

    private void HighlightLastDiscarded()
    {
        if (_discardedTileObjects.Count == 0) return;

        int lastIndex = _discardedTileObjects.Count - 1;
        var tileObj = _discardedTileObjects[lastIndex];

        var image = tileObj.GetComponent<UnityEngine.UI.Image>();
        if (image != null)
        {
            image.color = Color.yellow;
        }
    }

    private void HighlightLastHandTile()
    {
        if (handDisplay != null)
        {
            handDisplay.HighlightLastTile();
        }
    }

    private void HighlightLastMeld()
    {
        if (meldsContainer != null)
        {
            meldsContainer.HighlightLastMeld();
        }
    }

    private void HighlightHu()
    {
        if (handDisplay != null)
        {
            handDisplay.HighlightAll();
        }
    }

    public void ClearHighlight()
    {
        _isHighlighted = false;

        foreach (var tileObj in _discardedTileObjects)
        {
            var image = tileObj.GetComponent<UnityEngine.UI.Image>();
            if (image != null)
            {
                image.color = Color.white;
            }
        }

        if (handDisplay != null)
        {
            handDisplay.ClearHighlight();
        }

        if (meldsContainer != null)
        {
            meldsContainer.ClearHighlight();
        }
    }

    public void ClearDisplay()
    {
        if (handDisplay != null)
        {
            handDisplay.SetTiles(new List<TileData>());
        }

        if (meldsContainer != null)
        {
            meldsContainer.SetMelds(new List<MeldData>());
        }

        while (_discardedTileObjects.Count > 0)
        {
            Destroy(_discardedTileObjects[0]);
            _discardedTileObjects.RemoveAt(0);
        }
        _discardedTiles.Clear();

        if (currentPlayerIndicator != null)
        {
            currentPlayerIndicator.SetActive(false);
        }

        if (bankerIndicator != null)
        {
            bankerIndicator.SetActive(false);
        }

        if (scoreText != null)
        {
            scoreText.text = "0";
            scoreText.color = Color.white;
        }
    }
}
