using UnityEngine;
using System.Collections.Generic;

public class MeldsContainer : MonoBehaviour
{
    [Header("Prefabs")]
    public MeldDisplay meldDisplayPrefab;

    [Header("Layout")]
    public Transform meldsContainer;
    public float meldSpacing = 10f;

    private List<MeldDisplay> _meldDisplays = new List<MeldDisplay>();
    private List<MeldData> _currentMelds = new List<MeldData>();

    public void ClearMelds()
    {
        foreach (var display in _meldDisplays)
        {
            if (display != null)
            {
                Destroy(display.gameObject);
            }
        }
        _meldDisplays.Clear();
        _currentMelds.Clear();
    }

    public void UpdateMelds(List<MeldData> melds)
    {
        _currentMelds = new List<MeldData>(melds);
        ClearMelds();

        for (int i = 0; i < melds.Count; i++)
        {
            var meldDisplay = CreateMeldDisplay(melds[i]);
            _meldDisplays.Add(meldDisplay);
        }

        LayoutMelds();
    }

    private MeldDisplay CreateMeldDisplay(MeldData meld)
    {
        var instance = Instantiate(meldDisplayPrefab, meldsContainer);
        instance.UpdateMeld(meld);
        return instance;
    }

    private void LayoutMelds()
    {
        float currentX = 0f;

        for (int i = 0; i < _meldDisplays.Count; i++)
        {
            var meld = _meldDisplays[i];
            meld.transform.localPosition = new Vector3(currentX, 0, 0);
            meld.transform.localRotation = Quaternion.identity;
            
            float meldWidth = GetMeldWidth(meld);
            currentX += meldWidth + meldSpacing;
        }
    }

    private float GetMeldWidth(MeldDisplay meld)
    {
        if (meld == null || meld._currentMeld == null) return 0;
        int tileCount = meld._currentMeld.tiles.Count;
        return (tileCount - 1) * 50f + 50f;
    }

    public int GetMeldCount()
    {
        return _currentMelds.Count;
    }
}
