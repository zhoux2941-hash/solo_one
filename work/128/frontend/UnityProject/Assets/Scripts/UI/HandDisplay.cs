using UnityEngine;
using System.Collections.Generic;
using System.Linq;

public class HandDisplay : MonoBehaviour
{
    [Header("Prefabs")]
    public TileDisplay tileDisplayPrefab;

    [Header("Layout")]
    public Transform tilesContainer;
    public float tileSpacing = 60f;
    public float centerOffset = 0f;

    [Header("Settings")]
    public bool isMyHand = true;
    public bool selectable = true;

    private List<TileDisplay> _tileDisplays = new List<TileDisplay>();
    private TileDisplay _selectedTile;
    private List<TileData> _currentTiles = new List<TileData>();

    public event System.Action<TileDisplay> OnTileSelected;
    public event System.Action<TileDisplay> OnTileDeselected;

    public void ClearHand()
    {
        foreach (var display in _tileDisplays)
        {
            if (display != null)
            {
                Destroy(display.gameObject);
            }
        }
        _tileDisplays.Clear();
        _currentTiles.Clear();
        _selectedTile = null;
    }

    public void UpdateHand(List<TileData> tiles)
    {
        _currentTiles = new List<TileData>(tiles);
        ClearHand();

        var sortedTiles = SortTiles(tiles);

        for (int i = 0; i < sortedTiles.Count; i++)
        {
            var tileDisplay = CreateTileDisplay(sortedTiles[i], i);
            _tileDisplays.Add(tileDisplay);
        }

        LayoutTiles();
    }

    private List<TileData> SortTiles(List<TileData> tiles)
    {
        return tiles
            .OrderBy(t => GetTypeOrder(t.type))
            .ThenBy(t => t.rank)
            .ToList();
    }

    private int GetTypeOrder(TileType type)
    {
        return type switch
        {
            TileType.Wan => 0,
            TileType.Tiao => 1,
            TileType.Tong => 2,
            _ => 3
        };
    }

    private TileDisplay CreateTileDisplay(TileData tileData, int index)
    {
        var instance = Instantiate(tileDisplayPrefab, tilesContainer);
        var tileSprite = TileSpriteManager.Instance?.GetTileSprite(tileData);
        
        instance.Initialize(tileData, tileSprite);
        instance.IsInteractable = selectable && isMyHand;
        instance.SetFaceDown(!isMyHand);

        instance.OnTileClicked += HandleTileClicked;
        instance.OnTileHoverStart += HandleTileHoverStart;
        instance.OnTileHoverEnd += HandleTileHoverEnd;

        return instance;
    }

    private void HandleTileClicked(TileDisplay tileDisplay)
    {
        if (!selectable) return;

        if (_selectedTile == tileDisplay)
        {
            DeselectTile();
        }
        else
        {
            SelectTile(tileDisplay);
        }
    }

    private void HandleTileHoverStart(TileDisplay tileDisplay)
    {
    }

    private void HandleTileHoverEnd(TileDisplay tileDisplay)
    {
    }

    private void SelectTile(TileDisplay tileDisplay)
    {
        if (_selectedTile != null)
        {
            _selectedTile.SetSelected(false);
        }

        _selectedTile = tileDisplay;
        tileDisplay.SetSelected(true);
        OnTileSelected?.Invoke(tileDisplay);
    }

    private void DeselectTile()
    {
        if (_selectedTile != null)
        {
            _selectedTile.SetSelected(false);
            OnTileDeselected?.Invoke(_selectedTile);
            _selectedTile = null;
        }
    }

    public TileDisplay GetSelectedTile()
    {
        return _selectedTile;
    }

    public void DeselectAll()
    {
        DeselectTile();
    }

    private void LayoutTiles()
    {
        float totalWidth = (_tileDisplays.Count - 1) * tileSpacing;
        float startX = -totalWidth / 2f + centerOffset;

        for (int i = 0; i < _tileDisplays.Count; i++)
        {
            var tile = _tileDisplays[i];
            tile.transform.localPosition = new Vector3(startX + i * tileSpacing, 0, 0);
            tile.transform.localRotation = Quaternion.identity;
        }
    }

    public void SetSelectable(bool selectable)
    {
        this.selectable = selectable;
        foreach (var tile in _tileDisplays)
        {
            tile.IsInteractable = selectable && isMyHand;
        }
    }

    public int GetTileCount()
    {
        return _currentTiles.Count;
    }
}
