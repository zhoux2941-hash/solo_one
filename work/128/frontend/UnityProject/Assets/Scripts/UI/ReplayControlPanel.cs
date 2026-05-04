using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;

public class ReplayControlPanel : MonoBehaviour
{
    [Header("Main Controls")]
    public Button playPauseButton;
    public Button stopButton;
    public Button stepForwardButton;
    public Button stepBackwardButton;
    public Button jumpStartButton;
    public Button jumpEndButton;

    [Header("Speed Controls")]
    public Button speedUpButton;
    public Button speedDownButton;
    public Text speedText;

    [Header("Progress Controls")]
    public Slider progressSlider;
    public Text progressText;
    public Text operationInfoText;

    [Header("Record Info")]
    public Text recordTitleText;
    public Text recordTimeText;
    public Text recordResultText;
    public Text fanInfoText;

    [Header("Display Settings")]
    public bool showOtherPlayersHands = true;
    public Toggle showHandsToggle;

    [Header("Events")]
    public UnityEvent OnReplayStarted;
    public UnityEvent OnReplayPaused;
    public UnityEvent OnReplayStopped;

    private GameRecordSummary _currentRecord;
    private bool _isPlaying = false;
    private bool _isDraggingSlider = false;
    private int _totalOperations = 0;

    public event Action<int> OnOperationIndexChanged;
    public event Action<float> OnSpeedChanged;
    public event Action<bool> OnPlayStateChanged;
    public event Action OnStepForward;
    public event Action OnStepBackward;
    public event Action OnJumpToStart;
    public event Action OnJumpToEnd;

    private void Awake()
    {
        if (playPauseButton != null)
            playPauseButton.onClick.AddListener(TogglePlayPause);
        if (stopButton != null)
            stopButton.onClick.AddListener(Stop);
        if (stepForwardButton != null)
            stepForwardButton.onClick.AddListener(StepForward);
        if (stepBackwardButton != null)
            stepBackwardButton.onClick.AddListener(StepBackward);
        if (jumpStartButton != null)
            jumpStartButton.onClick.AddListener(JumpToStart);
        if (jumpEndButton != null)
            jumpEndButton.onClick.AddListener(JumpToEnd);

        if (speedUpButton != null)
            speedUpButton.onClick.AddListener(IncreaseSpeed);
        if (speedDownButton != null)
            speedDownButton.onClick.AddListener(DecreaseSpeed);

        if (progressSlider != null)
        {
            progressSlider.onValueChanged.AddListener(OnSliderValueChanged);
        }

        if (showHandsToggle != null)
        {
            showHandsToggle.onValueChanged.AddListener(OnShowHandsToggled);
            showHandsToggle.isOn = showOtherPlayersHands;
        }
    }

    private void OnEnable()
    {
        if (GameReplayController.Instance != null)
        {
            GameReplayController.Instance.OnReplayStateChanged += OnReplayStateChanged;
            GameReplayController.Instance.OnProgressUpdated += OnProgressUpdated;
            GameReplayController.Instance.OnSpeedChanged += OnSpeedChangedCallback;
            GameReplayController.Instance.OnOperationReplayed += OnOperationReplayed;
        }
    }

    private void OnDisable()
    {
        if (GameReplayController.Instance != null)
        {
            GameReplayController.Instance.OnReplayStateChanged -= OnReplayStateChanged;
            GameReplayController.Instance.OnProgressUpdated -= OnProgressUpdated;
            GameReplayController.Instance.OnSpeedChanged -= OnSpeedChangedCallback;
            GameReplayController.Instance.OnOperationReplayed -= OnOperationReplayed;
        }
    }

    public void LoadRecord(GameRecordSummary summary, GameRecordDetail detail)
    {
        _currentRecord = summary;
        _totalOperations = detail?.Operations?.Count ?? 0;
        
        UpdateRecordInfo(summary);
        UpdateProgress(0, _totalOperations);
        UpdateSliderMaxValue(_totalOperations);
    }

    private void UpdateRecordInfo(GameRecordSummary summary)
    {
        if (summary == null) return;

        if (recordTitleText != null)
        {
            recordTitleText.text = $"{summary.RoomName} - 第 {summary.RoundNumber} 局";
        }

        if (recordTimeText != null)
        {
            recordTimeText.text = summary.StartTimeUtc.ToLocalTime().ToString("yyyy-MM-dd HH:mm");
        }

        if (recordResultText != null)
        {
            string myResult = "平局";
            Color resultColor = Color.white;
            
            foreach (var playerResult in summary.PlayerResults)
            {
                if (playerResult.PlayerId == GameManager.Instance?.PlayerView?.myPlayerId)
                {
                    if (playerResult.IsWinner)
                    {
                        myResult = $"胜利 +{playerResult.ScoreChange}";
                        resultColor = Color.green;
                    }
                    else
                    {
                        myResult = $"失败 {playerResult.ScoreChange}";
                        resultColor = Color.red;
                    }
                    break;
                }
            }

            recordResultText.text = myResult;
            recordResultText.color = resultColor;
        }

        if (fanInfoText != null)
        {
            string fanInfo = "";
            if (!summary.IsDraw && summary.WinnerPlayerId != null)
            {
                foreach (var playerResult in summary.PlayerResults)
                {
                    if (playerResult.PlayerId == summary.WinnerPlayerId && playerResult.FanCount > 0)
                    {
                        fanInfo = $"{playerResult.FanType} x{playerResult.FanCount}番";
                        break;
                    }
                }
            }
            fanInfoText.text = fanInfo;
        }
    }

    private void TogglePlayPause()
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.TogglePlayPause();
    }

    private void Stop()
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.StopReplay();
        OnReplayStopped?.Invoke();
    }

    private void StepForward()
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.StepForward();
        OnStepForward?.Invoke();
    }

    private void StepBackward()
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.StepBackward();
        OnStepBackward?.Invoke();
    }

    private void JumpToStart()
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.JumpToStart();
        OnJumpToStart?.Invoke();
    }

    private void JumpToEnd()
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.JumpToEnd();
        OnJumpToEnd?.Invoke();
    }

    private void IncreaseSpeed()
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.IncreaseSpeed();
    }

    private void DecreaseSpeed()
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.DecreaseSpeed();
    }

    private void OnSliderValueChanged(float value)
    {
        if (!_isDraggingSlider) return;
        if (GameReplayController.Instance == null) return;
        
        int targetIndex = Mathf.FloorToInt(value);
        GameReplayController.Instance.JumpToIndex(targetIndex);
    }

    public void OnSliderBeginDrag()
    {
        _isDraggingSlider = true;
        if (GameReplayController.Instance != null && GameReplayController.Instance.IsPlaying)
        {
            GameReplayController.Instance.Pause();
        }
    }

    public void OnSliderEndDrag()
    {
        _isDraggingSlider = false;
    }

    private void OnShowHandsToggled(bool value)
    {
        showOtherPlayersHands = value;
    }

    private void OnReplayStateChanged(ReplayState state)
    {
        _isPlaying = state == ReplayState.Playing;
        UpdatePlayPauseButton();
        
        switch (state)
        {
            case ReplayState.Playing:
                OnReplayStarted?.Invoke();
                break;
            case ReplayState.Paused:
                OnReplayPaused?.Invoke();
                break;
            case ReplayState.Stopped:
                OnReplayStopped?.Invoke();
                break;
        }
        
        OnPlayStateChanged?.Invoke(_isPlaying);
    }

    private void OnProgressUpdated(int current, int total)
    {
        _totalOperations = total;
        UpdateProgress(current, total);
        UpdateSliderMaxValue(total);
        
        if (!_isDraggingSlider && progressSlider != null)
        {
            progressSlider.value = current - 1;
        }
    }

    private void OnSpeedChangedCallback(float speed)
    {
        UpdateSpeedDisplay(speed);
        OnSpeedChanged?.Invoke(speed);
    }

    private void OnOperationReplayed(int index, GameOperationRecord operation)
    {
        UpdateOperationInfo(operation);
        OnOperationIndexChanged?.Invoke(index);
    }

    private void UpdatePlayPauseButton()
    {
        if (playPauseButton == null) return;

        var text = playPauseButton.GetComponentInChildren<Text>();
        if (text != null)
        {
            text.text = _isPlaying ? "暂停" : "播放";
        }

        var image = playPauseButton.GetComponent<Image>();
        if (image != null)
        {
        }
    }

    private void UpdateProgress(int current, int total)
    {
        if (progressText != null)
        {
            progressText.text = $"{current} / {total}";
        }
    }

    private void UpdateSliderMaxValue(int total)
    {
        if (progressSlider != null)
        {
            progressSlider.minValue = -1;
            progressSlider.maxValue = total - 1;
            progressSlider.wholeNumbers = true;
        }
    }

    private void UpdateSpeedDisplay(float speed)
    {
        if (speedText != null)
        {
            speedText.text = $"{speed}x";
        }
    }

    private void UpdateOperationInfo(GameOperationRecord operation)
    {
        if (operationInfoText == null) return;

        string operationDesc = GetOperationDescription(operation);
        operationInfoText.text = $"{operation.PlayerName}: {operationDesc}";
    }

    private string GetOperationDescription(GameOperationRecord operation)
    {
        string tileInfo = "";
        if (operation.Tile != null)
        {
            tileInfo = $" {GetTileName(operation.Tile)}";
        }

        switch (operation.Type?.ToUpper())
        {
            case "DRAW":
                return $"摸牌{tileInfo}";
            case "DISCARD":
                return $"出牌{tileInfo}";
            case "PENG":
                return $"碰{tileInfo}";
            case "GANG":
            case "MING_GANG":
                return $"明杠{tileInfo}";
            case "AN_GANG":
                return $"暗杠";
            case "BU_GANG":
                return $"补杠{tileInfo}";
            case "HU":
                string fanInfo = "";
                if (!string.IsNullOrEmpty(operation.FanType) && operation.FanCount > 0)
                {
                    fanInfo = $" {operation.FanType} x{operation.FanCount}番";
                }
                return $"胡牌{tileInfo}{fanInfo}";
            case "PASS":
                return "过";
            case "START":
                return "游戏开始";
            case "DEAL":
                return "发牌";
            case "END":
                return "游戏结束";
            default:
                return operation.Type ?? "未知操作";
        }
    }

    private string GetTileName(TileData tile)
    {
        if (tile == null) return "";

        string typeName = "";
        switch (tile.type?.ToLower())
        {
            case "wan": typeName = "万"; break;
            case "tiao": typeName = "条"; break;
            case "tong": typeName = "筒"; break;
        }

        return $"{tile.rank}{typeName}";
    }

    public void SetPlayState(bool isPlaying)
    {
        if (GameReplayController.Instance == null) return;

        if (isPlaying)
            GameReplayController.Instance.Play();
        else
            GameReplayController.Instance.Pause();
    }

    public void SetSpeed(float speed)
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.SetSpeed(speed);
    }

    public void JumpToOperation(int index)
    {
        if (GameReplayController.Instance == null) return;
        GameReplayController.Instance.JumpToIndex(index);
    }
}
