using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

public class ActionPanel : MonoBehaviour
{
    [Header("Buttons")]
    public Button pengButton;
    public Button gangButton;
    public Button huButton;
    public Button passButton;

    [Header("Indicators")]
    public Text timerText;
    public GameObject panelContainer;

    [Header("Settings")]
    public float actionTimeout = 15f;
    
    private List<string> _availableActions;
    private float _timeRemaining;
    private bool _isTimerRunning;

    public event System.Action<string> OnActionSelected;

    private void Awake()
    {
        HidePanel();
        _availableActions = new List<string>();

        if (pengButton != null)
            pengButton.onClick.AddListener(() => OnButtonClicked("peng"));
        if (gangButton != null)
            gangButton.onClick.AddListener(() => OnButtonClicked("gang"));
        if (huButton != null)
            huButton.onClick.AddListener(() => OnButtonClicked("hu"));
        if (passButton != null)
            passButton.onClick.AddListener(() => OnButtonClicked("pass"));
    }

    private void Update()
    {
        if (_isTimerRunning)
        {
            _timeRemaining -= Time.deltaTime;
            
            if (timerText != null)
            {
                timerText.text = Mathf.CeilToInt(_timeRemaining).ToString();
            }

            if (_timeRemaining <= 0)
            {
                OnTimeout();
            }
        }
    }

    public void ShowPanel(List<string> availableActions)
    {
        _availableActions = new List<string>(availableActions);
        _timeRemaining = actionTimeout;
        _isTimerRunning = true;

        UpdateButtonStates();

        if (panelContainer != null)
        {
            panelContainer.SetActive(true);
        }
    }

    public void HidePanel()
    {
        _isTimerRunning = false;
        _availableActions.Clear();

        if (panelContainer != null)
        {
            panelContainer.SetActive(false);
        }
    }

    private void UpdateButtonStates()
    {
        if (pengButton != null)
        {
            bool canPeng = _availableActions.Contains("peng");
            pengButton.gameObject.SetActive(canPeng);
            pengButton.interactable = canPeng;
        }

        if (gangButton != null)
        {
            bool canGang = _availableActions.Contains("gang");
            gangButton.gameObject.SetActive(canGang);
            gangButton.interactable = canGang;
        }

        if (huButton != null)
        {
            bool canHu = _availableActions.Contains("hu");
            huButton.gameObject.SetActive(canHu);
            huButton.interactable = canHu;
        }

        if (passButton != null)
        {
            bool hasActions = _availableActions.Count > 0;
            passButton.gameObject.SetActive(hasActions);
            passButton.interactable = hasActions;
        }
    }

    private void OnButtonClicked(string action)
    {
        if (!_availableActions.Contains(action) && action != "pass")
        {
            Debug.LogWarning($"Action {action} not available");
            return;
        }

        _isTimerRunning = false;
        HidePanel();
        OnActionSelected?.Invoke(action);
    }

    private void OnTimeout()
    {
        _isTimerRunning = false;
        
        if (_availableActions.Contains("hu"))
        {
            OnActionSelected?.Invoke("hu");
        }
        else
        {
            OnActionSelected?.Invoke("pass");
        }

        HidePanel();
    }

    public bool IsVisible()
    {
        return panelContainer != null && panelContainer.activeSelf;
    }
}
