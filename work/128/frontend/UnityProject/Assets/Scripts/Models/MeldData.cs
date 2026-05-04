using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public enum MeldType
{
    Peng,
    Gang,
    AnGang,
    BuGang
}

[Serializable]
public class MeldData
{
    public MeldType type;
    public List<TileData> tiles;
    public int fromPlayerIndex;

    public static MeldType ParseMeldType(string typeString)
    {
        return typeString.ToLower() switch
        {
            "peng" => MeldType.Peng,
            "gang" => MeldType.Gang,
            "an_gang" => MeldType.AnGang,
            "bu_gang" => MeldType.BuGang,
            _ => throw new ArgumentException($"Unknown meld type: {typeString}")
        };
    }

    public string GetTypeString()
    {
        return type switch
        {
            MeldType.Peng => "peng",
            MeldType.Gang => "gang",
            MeldType.AnGang => "an_gang",
            MeldType.BuGang => "bu_gang",
            _ => "unknown"
        };
    }

    public bool IsGang()
    {
        return type is MeldType.Gang or MeldType.AnGang or MeldType.BuGang;
    }

    public bool IsConcealed()
    {
        return type == MeldType.AnGang;
    }
}
