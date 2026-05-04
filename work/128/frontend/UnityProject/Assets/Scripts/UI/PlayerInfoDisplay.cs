using UnityEngine;
using UnityEngine.UI;

public class PlayerInfoDisplay : MonoBehaviour
{
    [Header("References")]
    public Text playerNameText;
    public Text scoreText;
    public Text handTilesCountText;
    public GameObject readyIndicator;
    public GameObject hostIndicator;
    public GameObject currentTurnIndicator;
    public Image backgroundImage;

    [Header("Colors")]
    public Color defaultColor = Color.white;
    public Color myTurnColor = new Color(0.8f, 1f, 0.8f);
    public Color waitingColor = new Color(0.9f, 0.9f, 1f);

    private PublicPlayerData _playerData;
    private int _seatIndex;

    public void Initialize(int seatIndex)
    {
        _seatIndex = seatIndex;
        gameObject.name = $"Player_{seatIndex}";
    }

    public void UpdatePlayer(PublicPlayerData playerData, bool isCurrentTurn, bool isMe)
    {
        _playerData = playerData;

        if (playerData == null)
        {
            SetEmpty();
            return;
        }

        if (playerNameText != null)
        {
            playerNameText.text = playerData.name;
        }

        if (scoreText != null)
        {
            scoreText.text = playerData.score.ToString();
            scoreText.color = playerData.score >= 0 ? Color.green : Color.red;
        }

        if (handTilesCountText != null)
        {
            handTilesCountText.text = $"{playerData.handTiles}张";
        }

        if (readyIndicator != null)
        {
            readyIndicator.SetActive(playerData.isReady);
        }

        if (hostIndicator != null)
        {
            hostIndicator.SetActive(playerData.isHost);
        }

        if (currentTurnIndicator != null)
        {
            currentTurnIndicator.SetActive(isCurrentTurn);
        }

        if (backgroundImage != null)
        {
            if (isCurrentTurn)
            {
                backgroundImage.color = myTurnColor;
            }
            else if (isMe)
            {
                backgroundImage.color = waitingColor;
            }
            else
            {
                backgroundImage.color = defaultColor;
            }
        }
    }

    private void SetEmpty()
    {
        if (playerNameText != null)
        {
            playerNameText.text = "等待玩家...";
        }

        if (scoreText != null)
        {
            scoreText.text = "";
        }

        if (handTilesCountText != null)
        {
            handTilesCountText.text = "";
        }

        if (readyIndicator != null)
        {
            readyIndicator.SetActive(false);
        }

        if (hostIndicator != null)
        {
            hostIndicator.SetActive(false);
        }

        if (currentTurnIndicator != null)
        {
            currentTurnIndicator.SetActive(false);
        }

        if (backgroundImage != null)
        {
            backgroundImage.color = defaultColor;
        }
    }

    public PublicPlayerData GetPlayerData()
    {
        return _playerData;
    }

    public int GetSeatIndex()
    {
        return _seatIndex;
    }
}
