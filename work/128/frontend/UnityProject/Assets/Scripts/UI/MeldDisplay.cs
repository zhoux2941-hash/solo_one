using UnityEngine;
using System.Collections.Generic;

public class MeldDisplay : MonoBehaviour
{
    [Header("Prefabs")]
    public TileDisplay tileDisplayPrefab;

    [Header("Layout")]
    public Transform tilesContainer;
    public float tileSpacing = 50f;

    [Header("Settings")]
    public bool showConcealed = true;

    private List<TileDisplay> _tileDisplays = new List<TileDisplay>();
    private MeldData _currentMeld;

    public void ClearMeld()
    {
        foreach (var display in _tileDisplays)
        {
            if (display != null)
            {
                Destroy(display.gameObject);
            }
        }
        _tileDisplays.Clear();
        _currentMeld = null;
    }

    public void UpdateMeld(MeldData meld)
    {
        _currentMeld = meld;
        ClearMeld();

        bool isConcealed = meld.IsConcealed() && !showConcealed;

        for (int i = 0; i < meld.tiles.Count; i++)
        {
            var tileDisplay = CreateTileDisplay(meld.tiles[i], isConcealed);
            _tileDisplays.Add(tileDisplay);
        }

        LayoutTiles();
    }

    private TileDisplay CreateTileDisplay(TileData tileData, bool faceDown)
    {
        var instance = Instantiate(tileDisplayPrefab, tilesContainer);
        var tileSprite = TileSpriteManager.Instance?.GetTileSprite(tileData);
        
        instance.Initialize(tileData, tileSprite);
        instance.IsInteractable = false;
        instance.SetFaceDown(faceDown);

        return instance;
    }

    private void LayoutTiles()
    {
        float totalWidth = (_tileDisplays.Count - 1) * tileSpacing;
        float startX = -totalWidth / 2f;

        for (int i = 0; i < _tileDisplays.Count; i++)
        {
            var tile = _tileDisplays[i];
            tile.transform.localPosition = new Vector3(startX + i * tileSpacing, 0, 0);
            tile.transform.localRotation = Quaternion.identity;
        }
    }

    public MeldData GetMeld()
    {
        return _currentMeld;
    }
}
