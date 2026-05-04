using UnityEngine;
using UnityEngine.UI;

public class TileWallDisplay : MonoBehaviour
{
    [Header("References")]
    public Text remainingTilesText;
    public GameObject wallVisual;

    [Header("Settings")]
    public int maxTiles = 108;
    
    private int _remainingTiles;

    public void UpdateRemainingTiles(int count)
    {
        _remainingTiles = count;
        
        if (remainingTilesText != null)
        {
            remainingTilesText.text = $"{count}";
        }

        UpdateVisual();
    }

    private void UpdateVisual()
    {
        if (wallVisual == null) return;
        
        float fillPercentage = (float)_remainingTiles / maxTiles;
        var image = wallVisual.GetComponent<Image>();
        
        if (image != null)
        {
            image.fillAmount = fillPercentage;
        }
    }

    public int GetRemainingTiles()
    {
        return _remainingTiles;
    }
}
