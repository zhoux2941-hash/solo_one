using UnityEngine;
using System.Collections.Generic;

public class TileSpriteManager : MonoBehaviour
{
    public static TileSpriteManager Instance { get; private set; }

    [Header("Sprite Collections")]
    public Sprite[] wanTiles;
    public Sprite[] tiaoTiles;
    public Sprite[] tongTiles;
    
    [Header("Other Sprites")]
    public Sprite faceDownSprite;
    public Sprite highlightSprite;

    private Dictionary<string, Sprite> _spriteCache;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        InitializeCache();
    }

    private void InitializeCache()
    {
        _spriteCache = new Dictionary<string, Sprite>();

        LoadTypeSprites("wan", wanTiles);
        LoadTypeSprites("tiao", tiaoTiles);
        LoadTypeSprites("tong", tongTiles);
    }

    private void LoadTypeSprites(string typeName, Sprite[] sprites)
    {
        if (sprites == null) return;

        for (int i = 0; i < sprites.Length; i++)
        {
            if (sprites[i] != null)
            {
                string key = $"{typeName}_{i + 1}";
                _spriteCache[key] = sprites[i];
            }
        }
    }

    public Sprite GetTileSprite(TileData tileData)
    {
        if (tileData == null) return null;

        string key = $"{tileData.GetTypeString()}_{tileData.rank}";
        
        if (_spriteCache.TryGetValue(key, out var sprite))
        {
            return sprite;
        }

        Debug.LogWarning($"Sprite not found for {key}");
        return null;
    }

    public Sprite GetTileSprite(TileType type, int rank)
    {
        string typeString = type switch
        {
            TileType.Wan => "wan",
            TileType.Tiao => "tiao",
            TileType.Tong => "tong",
            _ => "unknown"
        };

        string key = $"{typeString}_{rank}";
        
        if (_spriteCache.TryGetValue(key, out var sprite))
        {
            return sprite;
        }

        Debug.LogWarning($"Sprite not found for {key}");
        return null;
    }

    public Sprite GetFaceDownSprite()
    {
        return faceDownSprite;
    }

    public Sprite GetHighlightSprite()
    {
        return highlightSprite;
    }
}
