using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

public enum ReplayState
{
    Stopped,
    Playing,
    Paused
}

public class GameReplayController : MonoBehaviour
{
    public static GameReplayController Instance { get; private set; }

    [Header("Replay Settings")]
    public float defaultSpeed = 1f;
    public float minSpeed = 0.25f;
    public float maxSpeed = 4f;
    public float stepInterval = 0.5f;

    private GameRecordDetail _currentRecord;
    private GameReplayStateManager _stateManager;
    
    private ReplayState _currentState = ReplayState.Stopped;
    private float _currentSpeed = 1f;
    private int _currentOperationIndex = -1;
    private Coroutine _playCoroutine;

    public event Action<ReplayState> OnReplayStateChanged;
    public event Action<int, GameOperationRecord> OnOperationReplayed;
    public event Action<int, int> OnProgressUpdated;
    public event Action<float> OnSpeedChanged;
    public event Action<GameReplayState> OnStateUpdated;

    public ReplayState CurrentState => _currentState;
    public float CurrentSpeed => _currentSpeed;
    public int CurrentOperationIndex => _currentOperationIndex;
    public int TotalOperations => _currentRecord?.Operations?.Count ?? 0;
    public bool IsPlaying => _currentState == ReplayState.Playing;
    public bool IsPaused => _currentState == ReplayState.Paused;
    public bool HasRecord => _currentRecord != null;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        
        _stateManager = new GameReplayStateManager();
    }

    public void LoadRecord(GameRecordDetail record)
    {
        if (record == null || record.Operations == null)
        {
            Debug.LogError("Invalid record data");
            return;
        }

        StopReplay();
        
        _currentRecord = record;
        _currentOperationIndex = -1;
        _stateManager.Initialize(record);
        
        OnProgressUpdated?.Invoke(0, TotalOperations);
        OnStateUpdated?.Invoke(_stateManager.CurrentState);
    }

    public void Play()
    {
        if (_currentState == ReplayState.Playing || _currentRecord == null) return;
        
        _currentState = ReplayState.Playing;
        OnReplayStateChanged?.Invoke(_currentState);
        
        if (_playCoroutine != null)
        {
            StopCoroutine(_playCoroutine);
        }
        _playCoroutine = StartCoroutine(PlayCoroutine());
    }

    public void Pause()
    {
        if (_currentState != ReplayState.Playing) return;
        
        _currentState = ReplayState.Paused;
        OnReplayStateChanged?.Invoke(_currentState);
        
        if (_playCoroutine != null)
        {
            StopCoroutine(_playCoroutine);
            _playCoroutine = null;
        }
    }

    public void StopReplay()
    {
        if (_currentState == ReplayState.Stopped) return;
        
        _currentState = ReplayState.Stopped;
        OnReplayStateChanged?.Invoke(_currentState);
        
        if (_playCoroutine != null)
        {
            StopCoroutine(_playCoroutine);
            _playCoroutine = null;
        }
        
        _currentOperationIndex = -1;
    }

    public void TogglePlayPause()
    {
        if (IsPlaying)
        {
            Pause();
        }
        else
        {
            Play();
        }
    }

    public void StepForward()
    {
        if (_currentRecord == null) return;
        
        int nextIndex = _currentOperationIndex + 1;
        if (nextIndex >= _currentRecord.Operations.Count)
        {
            return;
        }
        
        ReplayOperation(nextIndex);
    }

    public void StepBackward()
    {
        if (_currentRecord == null || _currentOperationIndex <= 0) return;
        
        int targetIndex = _currentOperationIndex - 1;
        ReplayToIndex(targetIndex);
    }

    public void JumpToIndex(int index)
    {
        if (_currentRecord == null) return;
        
        index = Mathf.Clamp(index, -1, _currentRecord.Operations.Count - 1);
        
        if (index == _currentOperationIndex) return;
        
        ReplayToIndex(index);
    }

    public void JumpToStart()
    {
        JumpToIndex(-1);
    }

    public void JumpToEnd()
    {
        if (_currentRecord == null) return;
        JumpToIndex(_currentRecord.Operations.Count - 1);
    }

    public void SetSpeed(float speed)
    {
        _currentSpeed = Mathf.Clamp(speed, minSpeed, maxSpeed);
        OnSpeedChanged?.Invoke(_currentSpeed);
    }

    public void IncreaseSpeed()
    {
        float newSpeed = _currentSpeed * 2f;
        SetSpeed(newSpeed);
    }

    public void DecreaseSpeed()
    {
        float newSpeed = _currentSpeed * 0.5f;
        SetSpeed(newSpeed);
    }

    private IEnumerator PlayCoroutine()
    {
        while (_currentState == ReplayState.Playing)
        {
            if (_currentOperationIndex >= _currentRecord.Operations.Count - 1)
            {
                _currentState = ReplayState.Paused;
                OnReplayStateChanged?.Invoke(_currentState);
                yield break;
            }
            
            StepForward();
            
            float waitTime = stepInterval / _currentSpeed;
            yield return new WaitForSeconds(waitTime);
        }
    }

    private void ReplayOperation(int index)
    {
        if (_currentRecord == null || index < 0 || index >= _currentRecord.Operations.Count)
            return;

        var operation = _currentRecord.Operations[index];
        _stateManager.ApplyOperation(operation);
        
        _currentOperationIndex = index;
        OnOperationReplayed?.Invoke(index, operation);
        OnProgressUpdated?.Invoke(_currentOperationIndex + 1, TotalOperations);
        OnStateUpdated?.Invoke(_stateManager.CurrentState);
    }

    private void ReplayToIndex(int targetIndex)
    {
        if (_currentRecord == null) return;
        
        _stateManager.ResetToInitialState();
        _currentOperationIndex = -1;
        
        for (int i = 0; i <= targetIndex; i++)
        {
            if (i >= _currentRecord.Operations.Count) break;
            
            var operation = _currentRecord.Operations[i];
            _stateManager.ApplyOperation(operation);
            _currentOperationIndex = i;
        }
        
        OnProgressUpdated?.Invoke(_currentOperationIndex + 1, TotalOperations);
        OnStateUpdated?.Invoke(_stateManager.CurrentState);
    }

    public GameReplayState GetCurrentState()
    {
        return _stateManager.CurrentState;
    }

    public GameRecordSummary GetCurrentRecordSummary()
    {
        return _currentRecord?.Summary;
    }
}
