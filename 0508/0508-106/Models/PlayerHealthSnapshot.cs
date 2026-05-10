using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace CombatLogAnalyzer.Models
{
    public class PlayerHealthSnapshot : INotifyPropertyChanged
    {
        private string _playerName = string.Empty;
        private int _currentHealth;
        private int _maxHealth;
        private double _healthPercent;
        private int _totalDamageTaken;
        private int _totalHealingReceived;
        private DateTime _lastEventTime;
        private string _status = "Active";
        private bool _isPresent;

        public string PlayerName
        {
            get => _playerName;
            set
            {
                _playerName = value;
                OnPropertyChanged();
            }
        }

        public int CurrentHealth
        {
            get => _currentHealth;
            set
            {
                _currentHealth = Math.Max(0, Math.Min(_maxHealth, value));
                HealthPercent = _maxHealth > 0 ? (double)_currentHealth / _maxHealth * 100 : 0;
                OnPropertyChanged();
            }
        }

        public int MaxHealth
        {
            get => _maxHealth;
            set
            {
                _maxHealth = value;
                if (_maxHealth > 0)
                {
                    HealthPercent = (double)_currentHealth / _maxHealth * 100;
                }
                OnPropertyChanged();
            }
        }

        public double HealthPercent
        {
            get => _healthPercent;
            private set
            {
                _healthPercent = value;
                OnPropertyChanged();
            }
        }

        public int TotalDamageTaken
        {
            get => _totalDamageTaken;
            set
            {
                _totalDamageTaken = value;
                OnPropertyChanged();
            }
        }

        public int TotalHealingReceived
        {
            get => _totalHealingReceived;
            set
            {
                _totalHealingReceived = value;
                OnPropertyChanged();
            }
        }

        public DateTime LastEventTime
        {
            get => _lastEventTime;
            set
            {
                _lastEventTime = value;
                OnPropertyChanged();
            }
        }

        public string Status
        {
            get => _status;
            set
            {
                _status = value;
                OnPropertyChanged();
            }
        }

        public bool IsPresent
        {
            get => _isPresent;
            set
            {
                _isPresent = value;
                OnPropertyChanged();
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }

    public class PlayerHealthHistory
    {
        public string PlayerName { get; set; } = string.Empty;
        public List<HealthPoint> HealthPoints { get; set; } = new();
        public int EstimatedMaxHealth { get; set; } = 100000;
    }

    public class HealthPoint
    {
        public DateTime Timestamp { get; set; }
        public int Health { get; set; }
        public int Change { get; set; }
        public bool IsDamage { get; set; }
        public string RelatedEvent { get; set; } = string.Empty;
    }

    public class TimelineEvent
    {
        public DateTime Timestamp { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
        public string Skill { get; set; } = string.Empty;
        public int Amount { get; set; }
        public bool IsDamage { get; set; }
    }
}
