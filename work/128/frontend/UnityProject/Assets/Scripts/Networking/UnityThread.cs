using UnityEngine;
using System.Collections.Generic;
using System;

public class UnityThread : MonoBehaviour
{
    private static UnityThread _instance;
    private Queue<Action> _executionQueue = new Queue<Action>();

    public static UnityThread Instance
    {
        get
        {
            if (_instance == null)
            {
                _instance = new GameObject("UnityThread").AddComponent<UnityThread>();
            }
            return _instance;
        }
    }

    private void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }
        _instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void Update()
    {
        lock (_executionQueue)
        {
            while (_executionQueue.Count > 0)
            {
                _executionQueue.Dequeue().Invoke();
            }
        }
    }

    public void Execute(Action action)
    {
        lock (_executionQueue)
        {
            _executionQueue.Enqueue(action);
        }
    }

    public static void executeInUpdate(Action action)
    {
        Instance.Execute(action);
    }
}
