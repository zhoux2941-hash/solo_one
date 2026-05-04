using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class HistoryListPanel : MonoBehaviour
{
    [Header("UI References")]
    public Button refreshButton;
    public Button closeButton;
    public Transform recordContainer;
    public GameObject recordItemPrefab;
    public Text totalCountText;
    public Text pageInfoText;
    public Button prevPageButton;
    public Button nextPageButton;

    [Header("Stats Display")]
    public Text totalGamesText;
    public Text winRateText;
    public Text totalScoreText;
    public Text highestFanText;
    public Text maxWinStreakText;

    [Header("Settings")]
    public int itemsPerPage = 10;

    private List<GameRecordSummary> _currentRecords;
    private PlayerStatistics _currentStats;
    private int _currentPage = 0;
    private int _totalRecords = 0;
    private Action<GameRecordSummary> _onRecordSelected;

    private void Awake()
    {
        if (refreshButton != null)
        {
            refreshButton.onClick.AddListener(OnRefreshClicked);
        }
        if (closeButton != null)
        {
            closeButton.onClick.AddListener(OnCloseClicked);
        }
        if (prevPageButton != null)
        {
            prevPageButton.onClick.AddListener(OnPrevPageClicked);
        }
        if (nextPageButton != null)
        {
            nextPageButton.onClick.AddListener(OnNextPageClicked);
        }
    }

    private void OnEnable()
    {
        GameManager.Instance.OnHistoryListReceived += OnHistoryListReceived;
        GameManager.Instance.OnStatisticsReceived += OnStatisticsReceived;
        GameManager.Instance.OnErrorMessage += OnErrorMessage;
        
        RefreshData();
    }

    private void OnDisable()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnHistoryListReceived -= OnHistoryListReceived;
            GameManager.Instance.OnStatisticsReceived -= OnStatisticsReceived;
            GameManager.Instance.OnErrorMessage -= OnErrorMessage;
        }
    }

    public void SetRecordSelectedCallback(Action<GameRecordSummary> callback)
    {
        _onRecordSelected = callback;
    }

    public void RefreshData()
    {
        if (GameManager.Instance == null) return;
        
        ShowLoading(true);
        GameManager.Instance.GetHistoryList(itemsPerPage, _currentPage * itemsPerPage);
        GameManager.Instance.GetStatistics();
    }

    private void OnRefreshClicked()
    {
        _currentPage = 0;
        RefreshData();
    }

    private void OnCloseClicked()
    {
        gameObject.SetActive(false);
    }

    private void OnPrevPageClicked()
    {
        if (_currentPage > 0)
        {
            _currentPage--;
            RefreshData();
        }
    }

    private void OnNextPageClicked()
    {
        int totalPages = Mathf.CeilToInt((float)_totalRecords / itemsPerPage);
        if (_currentPage < totalPages - 1)
        {
            _currentPage++;
            RefreshData();
        }
    }

    private void OnHistoryListReceived(GameRecordListResult result)
    {
        ShowLoading(false);
        
        if (!result.Success)
        {
            Debug.LogError($"Failed to get history: {result.ErrorMessage}");
            return;
        }

        _currentRecords = result.Records;
        _totalRecords = result.Total;
        
        UpdateRecordList();
        UpdatePageInfo();
    }

    private void OnStatisticsReceived(PlayerStatistics stats)
    {
        _currentStats = stats;
        UpdateStatsDisplay();
    }

    private void OnErrorMessage(string message)
    {
        ShowLoading(false);
        Debug.LogError($"History panel error: {message}");
    }

    private void UpdateRecordList()
    {
        if (recordContainer == null || recordItemPrefab == null) return;

        foreach (Transform child in recordContainer)
        {
            Destroy(child.gameObject);
        }

        if (_currentRecords == null || _currentRecords.Count == 0)
        {
            return;
        }

        foreach (var record in _currentRecords)
        {
            GameObject item = Instantiate(recordItemPrefab, recordContainer);
            var itemComponent = item.GetComponent<HistoryRecordItem>();
            
            if (itemComponent != null)
            {
                itemComponent.SetData(record, OnRecordItemClicked);
            }
            else
            {
                SetupRecordItemSimple(item, record);
            }
        }
    }

    private void SetupRecordItemSimple(GameObject item, GameRecordSummary record)
    {
        var texts = item.GetComponentsInChildren<Text>();
        var button = item.GetComponent<Button>();

        string winLossText = "平局";
        string winLossColor = "white";
        
        foreach (var playerResult in record.PlayerResults)
        {
            if (playerResult.PlayerId == GameManager.Instance.PlayerView?.myPlayerId)
            {
                if (playerResult.IsWinner)
                {
                    winLossText = $"胜 (+{playerResult.ScoreChange})";
                    winLossColor = "green";
                }
                else
                {
                    winLossText = $"负 ({playerResult.ScoreChange})";
                    winLossColor = "red";
                }
                break;
            }
        }

        string fanInfo = "";
        if (record.WinnerPlayerId != null)
        {
            foreach (var playerResult in record.PlayerResults)
            {
                if (playerResult.PlayerId == record.WinnerPlayerId && playerResult.FanCount > 0)
                {
                    fanInfo = $"{playerResult.FanType} x{playerResult.FanCount}";
                    break;
                }
            }
        }

        string timeStr = record.StartTimeUtc.ToLocalTime().ToString("MM-dd HH:mm");
        string durationStr = $"{record.Duration / 60}分{record.Duration % 60}秒";

        foreach (var text in texts)
        {
            if (text.name.Contains("Time") || text.name.Contains("时间"))
            {
                text.text = timeStr;
            }
            else if (text.name.Contains("Result") || text.name.Contains("胜负"))
            {
                text.text = winLossText;
                text.color = GetColorByName(winLossColor);
            }
            else if (text.name.Contains("Fan") || text.name.Contains("番"))
            {
                text.text = fanInfo;
            }
            else if (text.name.Contains("Duration") || text.name.Contains("时长"))
            {
                text.text = durationStr;
            }
        }

        if (button != null)
        {
            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(() => OnRecordItemClicked(record));
        }
    }

    private Color GetColorByName(string colorName)
    {
        switch (colorName.ToLower())
        {
            case "green": return Color.green;
            case "red": return Color.red;
            default: return Color.white;
        }
    }

    private void OnRecordItemClicked(GameRecordSummary record)
    {
        _onRecordSelected?.Invoke(record);
    }

    private void UpdatePageInfo()
    {
        int totalPages = Mathf.Max(1, Mathf.CeilToInt((float)_totalRecords / itemsPerPage));
        int currentPageDisplay = _currentPage + 1;

        if (totalCountText != null)
        {
            totalCountText.text = $"共 {_totalRecords} 条记录";
        }

        if (pageInfoText != null)
        {
            pageInfoText.text = $"{currentPageDisplay} / {totalPages}";
        }

        if (prevPageButton != null)
        {
            prevPageButton.interactable = _currentPage > 0;
        }

        if (nextPageButton != null)
        {
            nextPageButton.interactable = _currentPage < totalPages - 1;
        }
    }

    private void UpdateStatsDisplay()
    {
        if (_currentStats == null) return;

        if (totalGamesText != null)
        {
            totalGamesText.text = $"{_currentStats.TotalGames} 局";
        }

        if (winRateText != null)
        {
            float winRate = _currentStats.WinRate * 100;
            winRateText.text = $"{winRate:F1}%";
        }

        if (totalScoreText != null)
        {
            string prefix = _currentStats.TotalScore >= 0 ? "+" : "";
            totalScoreText.text = $"{prefix}{_currentStats.TotalScore}";
            totalScoreText.color = _currentStats.TotalScore >= 0 ? Color.green : Color.red;
        }

        if (highestFanText != null)
        {
            highestFanText.text = $"{_currentStats.HighestFan} 番";
        }

        if (maxWinStreakText != null)
        {
            maxWinStreakText.text = $"{_currentStats.MaxWinStreak} 连胜";
        }
    }

    private void ShowLoading(bool show)
    {
    }
}

public class HistoryRecordItem : MonoBehaviour
{
    public Text timeText;
    public Text resultText;
    public Text fanText;
    public Text durationText;
    public Button selectButton;

    private GameRecordSummary _record;
    private Action<GameRecordSummary> _onSelected;

    public void SetData(GameRecordSummary record, Action<GameRecordSummary> onSelected)
    {
        _record = record;
        _onSelected = onSelected;
        UpdateUI();

        if (selectButton != null)
        {
            selectButton.onClick.RemoveAllListeners();
            selectButton.onClick.AddListener(OnClicked);
        }
    }

    private void UpdateUI()
    {
        if (_record == null) return;

        string winLossText = "平局";
        Color winLossColor = Color.white;
        int myScoreChange = 0;
        
        foreach (var playerResult in _record.PlayerResults)
        {
            if (playerResult.PlayerId == GameManager.Instance?.PlayerView?.myPlayerId)
            {
                myScoreChange = playerResult.ScoreChange;
                if (playerResult.IsWinner)
                {
                    winLossText = $"胜 (+{playerResult.ScoreChange})";
                    winLossColor = Color.green;
                }
                else
                {
                    winLossText = $"负 ({playerResult.ScoreChange})";
                    winLossColor = Color.red;
                }
                break;
            }
        }

        string fanInfo = "";
        if (_record.WinnerPlayerId != null)
        {
            foreach (var playerResult in _record.PlayerResults)
            {
                if (playerResult.PlayerId == _record.WinnerPlayerId && playerResult.FanCount > 0)
                {
                    fanInfo = $"{playerResult.FanType} x{playerResult.FanCount}";
                    break;
                }
            }
        }

        if (timeText != null)
        {
            timeText.text = _record.StartTimeUtc.ToLocalTime().ToString("MM-dd HH:mm");
        }

        if (resultText != null)
        {
            resultText.text = winLossText;
            resultText.color = winLossColor;
        }

        if (fanText != null)
        {
            fanText.text = fanInfo;
        }

        if (durationText != null)
        {
            int minutes = _record.Duration / 60;
            int seconds = _record.Duration % 60;
            durationText.text = $"{minutes}分{seconds}秒";
        }
    }

    private void OnClicked()
    {
        _onSelected?.Invoke(_record);
    }
}
