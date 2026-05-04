using System;
using UnityEngine;

[Serializable]
public enum TileType
{
    Tiao,
    Wan,
    Tong
}

[Serializable]
public class TileData : IEquatable<TileData>
{
    public string id;
    public TileType type;
    public int rank;

    public TileData() { }

    public TileData(string typeString, int rankValue, string tileId = null)
    {
        type = ParseTileType(typeString);
        rank = rankValue;
        id = tileId ?? $"{type}_{rank}_{Guid.NewGuid()}";
    }

    public static TileType ParseTileType(string typeString)
    {
        return typeString.ToLower() switch
        {
            "tiao" => TileType.Tiao,
            "wan" => TileType.Wan,
            "tong" => TileType.Tong,
            _ => throw new ArgumentException($"Unknown tile type: {typeString}")
        };
    }

    public string GetTypeString()
    {
        return type switch
        {
            TileType.Tiao => "tiao",
            TileType.Wan => "wan",
            TileType.Tong => "tong",
            _ => "unknown"
        };
    }

    public string GetSpriteName()
    {
        return $"{GetTypeString()}_{rank}";
    }

    public bool Equals(TileData other)
    {
        if (other == null) return false;
        return type == other.type && rank == other.rank;
    }

    public override bool Equals(object obj)
    {
        return Equals(obj as TileData);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(type, rank);
    }

    public static bool operator ==(TileData left, TileData right)
    {
        if (ReferenceEquals(left, right)) return true;
        if (ReferenceEquals(left, null)) return false;
        if (ReferenceEquals(right, null)) return false;
        return left.Equals(right);
    }

    public static bool operator !=(TileData left, TileData right)
    {
        return !(left == right);
    }
}
