using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using System;

public class TileDisplay : MonoBehaviour, IPointerClickHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("References")]
    public Image tileImage;
    public Image highlightImage;
    public Text rankText;

    [Header("Animation")]
    public float hoverScale = 1.1f;
    public float hoverOffset = 20f;
    public float animationSpeed = 10f;

    public TileData TileData { get; private set; }
    public bool IsSelected { get; private set; }
    public bool IsInteractable { get; set; } = true;

    private Vector3 _originalPosition;
    private Vector3 _originalScale;
    private bool _isHovered;

    public event Action<TileDisplay> OnTileClicked;
    public event Action<TileDisplay> OnTileHoverStart;
    public event Action<TileDisplay> OnTileHoverEnd;

    private void Awake()
    {
        _originalPosition = transform.localPosition;
        _originalScale = transform.localScale;
        SetSelected(false);
    }

    public void Initialize(TileData tileData, Sprite tileSprite)
    {
        TileData = tileData;
        
        if (tileImage != null && tileSprite != null)
        {
            tileImage.sprite = tileSprite;
        }

        if (rankText != null)
        {
            rankText.text = tileData.rank.ToString();
        }

        gameObject.name = $"Tile_{tileData.GetSpriteName()}";
    }

    public void SetSelected(bool selected)
    {
        IsSelected = selected;
        
        if (highlightImage != null)
        {
            highlightImage.enabled = selected;
            highlightImage.color = selected ? Color.yellow : Color.clear;
        }
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        if (!IsInteractable) return;
        
        OnTileClicked?.Invoke(this);
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        if (!IsInteractable) return;
        
        _isHovered = true;
        OnTileHoverStart?.Invoke(this);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        if (!IsInteractable) return;
        
        _isHovered = false;
        OnTileHoverEnd?.Invoke(this);
    }

    private void Update()
    {
        var targetScale = _isHovered || IsSelected ? _originalScale * hoverScale : _originalScale;
        var targetPosition = _isHovered || IsSelected 
            ? _originalPosition + new Vector3(0, hoverOffset, 0) 
            : _originalPosition;

        transform.localScale = Vector3.Lerp(transform.localScale, targetScale, Time.deltaTime * animationSpeed);
        transform.localPosition = Vector3.Lerp(transform.localPosition, targetPosition, Time.deltaTime * animationSpeed);
    }

    public void SetFaceDown(bool faceDown)
    {
        if (tileImage != null)
        {
            tileImage.enabled = !faceDown;
        }
        if (rankText != null)
        {
            rankText.enabled = !faceDown;
        }
    }

    public void ResetPosition()
    {
        transform.localPosition = _originalPosition;
        transform.localScale = _originalScale;
    }
}
