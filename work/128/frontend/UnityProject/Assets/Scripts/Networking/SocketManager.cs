using UnityEngine;
using System;
using System.Collections.Generic;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;

public class SocketManager : MonoBehaviour
{
    public static SocketManager Instance { get; private set; }
    
    [Header("Settings")]
    public string serverUrl = "http://localhost:3000";
    
    private SocketIOUnity _socket;
    private bool _isConnected;
    
    public event Action OnConnected;
    public event Action OnDisconnected;
    public event Action<string, SocketIOResponse> OnEventReceived;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void Start()
    {
        InitializeSocket();
    }

    private void InitializeSocket()
    {
        var uri = new Uri(serverUrl);
        _socket = new SocketIOUnity(uri, new SocketIOOptions
        {
            Query = new Dictionary<string, string>
            {
                {"token", "unity_client"}
            },
            EIO = 4,
            Transport = SocketIOClient.Transport.TransportProtocol.WebSocket
        });

        _socket.JsonSerializer = new NewtonsoftJsonSerializer();

        _socket.OnConnected += (sender, e) =>
        {
            Debug.Log("Socket connected");
            _isConnected = true;
            UnityThread.executeInUpdate(() => OnConnected?.Invoke());
        };

        _socket.OnDisconnected += (sender, e) =>
        {
            Debug.Log("Socket disconnected");
            _isConnected = false;
            UnityThread.executeInUpdate(() => OnDisconnected?.Invoke());
        };

        _socket.OnError += (sender, e) =>
        {
            Debug.LogError($"Socket error: {e}");
        };

        SetupEventListeners();
    }

    private void SetupEventListeners()
    {
        _socket.On("room:update", (response) =>
        {
            UnityThread.executeInUpdate(() =>
            {
                OnEventReceived?.Invoke("room:update", response);
            });
        });

        _socket.On("game:started", (response) =>
        {
            UnityThread.executeInUpdate(() =>
            {
                OnEventReceived?.Invoke("game:started", response);
            });
        });

        _socket.On("game:initial_state", (response) =>
        {
            UnityThread.executeInUpdate(() =>
            {
                OnEventReceived?.Invoke("game:initial_state", response);
            });
        });

        _socket.On("game:discarded", (response) =>
        {
            UnityThread.executeInUpdate(() =>
            {
                OnEventReceived?.Invoke("game:discarded", response);
            });
        });

        _socket.On("game:action_taken", (response) =>
        {
            UnityThread.executeInUpdate(() =>
            {
                OnEventReceived?.Invoke("game:action_taken", response);
            });
        });

        _socket.On("game:state_update", (response) =>
        {
            UnityThread.executeInUpdate(() =>
            {
                OnEventReceived?.Invoke("game:state_update", response);
            });
        });
    }

    public void Connect()
    {
        if (_isConnected) return;
        _socket.Connect();
    }

    public void Disconnect()
    {
        if (!_isConnected) return;
        _socket.Disconnect();
    }

    public void Emit(string eventName, Action<SocketIOResponse> callback = null)
    {
        if (!_isConnected)
        {
            Debug.LogWarning("Not connected to server");
            return;
        }

        if (callback != null)
        {
            _socket.EmitAsync(eventName, response =>
            {
                UnityThread.executeInUpdate(() => callback(response));
            });
        }
        else
        {
            _socket.EmitAsync(eventName);
        }
    }

    public void Emit<T>(string eventName, T data, Action<SocketIOResponse> callback = null)
    {
        if (!_isConnected)
        {
            Debug.LogWarning("Not connected to server");
            return;
        }

        if (callback != null)
        {
            _socket.EmitAsync(eventName, response =>
            {
                UnityThread.executeInUpdate(() => callback(response));
            }, data);
        }
        else
        {
            _socket.EmitAsync(eventName, data);
        }
    }

    public bool IsConnected()
    {
        return _isConnected;
    }

    private void OnDestroy()
    {
        if (_socket != null && _isConnected)
        {
            _socket.Disconnect();
        }
    }
}
