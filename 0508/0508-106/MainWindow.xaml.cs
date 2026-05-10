using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;
using CombatLogAnalyzer.Models;
using CombatLogAnalyzer.Services;
using Microsoft.Win32;
using OxyPlot;
using OxyPlot.Axes;
using OxyPlot.Series;

namespace CombatLogAnalyzer
{
    public class EventTypeConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool isHeal)
            {
                return isHeal ? "治疗" : "伤害";
            }
            return "未知";
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }

    public class HealthToColorConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is double healthPercent)
            {
                if (healthPercent <= 15)
                    return Brushes.Red;
                if (healthPercent <= 30)
                    return Brushes.Orange;
                if (healthPercent <= 50)
                    return Brushes.Yellow;
                return Brushes.Green;
            }
            return Brushes.Green;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }

    public class HealthPercentConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is double healthPercent)
            {
                return healthPercent;
            }
            return 0.0;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }

    public class ViewModelBase : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
        {
            if (Equals(field, value)) return false;
            field = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
            return true;
        }
    }

    public class MainViewModel : ViewModelBase
    {
        private PlotModel? _chartModel;
        public PlotModel? ChartModel
        {
            get => _chartModel;
            set => SetProperty(ref _chartModel, value);
        }
    }

    public partial class MainWindow : Window
    {
        private readonly DatabaseService _dbService;
        private readonly CombatLogParser _parser;
        private readonly CsvExporter _csvExporter;
        private readonly TimelineService _timelineService;
        private readonly MainViewModel _viewModel;

        private string? _currentFileHash;
        private string? _currentFilePath;
        private double _combatDurationSeconds;
        private List<PlayerStats> _playerStats = new();
        private List<SkillStats> _topSkills = new();
        private List<CombatEvent> _events = new();

        private TimelineAnalysisResult? _timelineAnalysis;
        private CancellationTokenSource? _playbackCts;
        private double _playbackSpeed = 1.0;
        private bool _isPlaying = false;
        private DateTime _currentPlaybackTime;

        public MainWindow()
        {
            InitializeComponent();
            
            _dbService = new DatabaseService();
            _parser = new CombatLogParser();
            _csvExporter = new CsvExporter();
            _timelineService = new TimelineService();
            _viewModel = new MainViewModel();
            
            DataContext = _viewModel;
        }

        private async void btnImport_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new OpenFileDialog
            {
                Title = "选择战斗日志文件",
                Filter = "战斗日志文件 (*.txt)|*.txt|所有文件 (*.*)|*.*",
                Multiselect = false
            };

            if (dialog.ShowDialog() == true)
            {
                await LoadLogFile(dialog.FileName);
            }
        }

        private async Task LoadLogFile(string filePath)
        {
            _currentFilePath = filePath;
            SetUIEnabled(false);
            progressBar.Visibility = Visibility.Visible;
            progressBar.Value = 0;
            txtStatus.Text = $"正在处理: {Path.GetFileName(filePath)}";
            statusBarText.Text = "正在处理战斗日志...";

            StopPlayback();

            try
            {
                var fileHash = _parser.ComputeFileHash(filePath);
                var cachedFile = _dbService.GetCachedLogFile(fileHash);
                var fileInfo = new FileInfo(filePath);

                if (cachedFile != null && 
                    cachedFile.FileSize == fileInfo.Length && 
                    cachedFile.LastModified == fileInfo.LastWriteTime)
                {
                    txtStatus.Text = "从缓存加载数据中...";
                    await Task.Run(() =>
                    {
                        _events = _dbService.GetCachedEvents(fileHash);
                        _combatDurationSeconds = cachedFile.CombatDurationSeconds;
                    });
                    _currentFileHash = fileHash;
                    txtStatus.Text = $"从缓存加载完成: {_events.Count} 条事件, 战斗时长: {_combatDurationSeconds:F1}秒";
                }
                else
                {
                    txtStatus.Text = "解析战斗日志中...";
                    ParseResult? parseResult = null;
                    
                    var progress = new Progress<int>(percent =>
                    {
                        progressBar.Value = percent;
                    });

                    await Task.Run(() =>
                    {
                        parseResult = _parser.ParseFile(filePath, progress);
                    });

                    if (parseResult != null)
                    {
                        _events = parseResult.Events;
                        _combatDurationSeconds = parseResult.CombatDurationSeconds;
                        _currentFileHash = fileHash;

                        txtStatus.Text = $"解析完成: {parseResult.ParsedLines}/{parseResult.TotalLines} 行, 战斗时长: {_combatDurationSeconds:F1}秒";
                        statusBarText.Text = "保存到缓存中...";

                        await Task.Run(() =>
                        {
                            var cache = new LogFileCache
                            {
                                FilePath = filePath,
                                FileHash = fileHash,
                                FileSize = fileInfo.Length,
                                LastModified = fileInfo.LastWriteTime,
                                ParsedAt = DateTime.Now,
                                EventCount = _events.Count,
                                CombatDurationSeconds = _combatDurationSeconds
                            };
                            _dbService.CacheLogFile(cache, _events);
                        });

                        statusBarText.Text = $"缓存已保存: {_events.Count} 条事件";
                    }
                }

                if (_events.Count > 0 && !string.IsNullOrEmpty(_currentFileHash))
                {
                    await LoadStatistics();
                    await AnalyzeTimeline();
                }
                else
                {
                    MessageBox.Show("未能解析任何有效战斗事件。", "提示", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"处理文件时出错: {ex.Message}\n\n{ex.StackTrace}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                progressBar.Visibility = Visibility.Collapsed;
                SetUIEnabled(true);
            }
        }

        private async Task LoadStatistics()
        {
            if (string.IsNullOrEmpty(_currentFileHash)) return;

            await Task.Run(() =>
            {
                _playerStats = _dbService.GetPlayerStats(_currentFileHash, _combatDurationSeconds);
                _topSkills = _dbService.GetTopSkills(_currentFileHash, 5);
            });

            Dispatcher.Invoke(() =>
            {
                dgPlayerStats.ItemsSource = _playerStats;
                dgEvents.ItemsSource = _events.OrderByDescending(e => e.Timestamp).Take(100).ToList();
                
                UpdateChart();
                SetExportEnabled(true);
                
                if (_playerStats.Count > 0)
                {
                    var topPlayer = _playerStats[0];
                    statusBarText.Text = $"解析完成 | 共 {_events.Count} 事件 | {_playerStats.Count} 玩家 | 最高伤害: {topPlayer.PlayerName} ({topPlayer.TotalDamage:N0})";
                }
                else
                {
                    statusBarText.Text = $"解析完成 | 共 {_events.Count} 事件";
                }
            });
        }

        private async Task AnalyzeTimeline()
        {
            if (_events.Count == 0) return;

            await Task.Run(() =>
            {
                _timelineAnalysis = _timelineService.AnalyzeTimeline(_events);
            });

            Dispatcher.Invoke(() =>
            {
                if (_timelineAnalysis != null && _timelineAnalysis.TotalDurationSeconds > 0)
                {
                    _currentPlaybackTime = _timelineAnalysis.StartTime;
                    timelineSlider.Value = 0;
                    timelineSlider.IsEnabled = true;
                    btnPlay.IsEnabled = true;
                    btnStop.IsEnabled = true;

                    var duration = TimeSpan.FromSeconds(_timelineAnalysis.TotalDurationSeconds);
                    txtDuration.Text = $"总时长: {duration:hh\\:mm\\:ss}";
                    txtCurrentTime.Text = $"时间: 00:00:00";

                    UpdateTimelineSnapshot(_timelineAnalysis.StartTime);
                }
            });
        }

        private void UpdateTimelineSnapshot(DateTime targetTime)
        {
            if (_timelineAnalysis == null) return;

            var snapshots = _timelineService.GetSnapshotAtTime(_timelineAnalysis, targetTime);
            playerStatusList.ItemsSource = snapshots;

            var rangeStart = targetTime.AddSeconds(-2);
            var rangeEnd = targetTime.AddSeconds(2);
            var eventsInRange = _timelineService.GetEventsInRange(_timelineAnalysis, rangeStart, rangeEnd);
            dgTimelineEvents.ItemsSource = eventsInRange;

            var elapsed = targetTime - _timelineAnalysis.StartTime;
            txtCurrentTime.Text = $"时间: {elapsed:hh\\:mm\\:ss}";

            _currentPlaybackTime = targetTime;
        }

        private async void btnPlay_Click(object sender, RoutedEventArgs e)
        {
            if (_timelineAnalysis == null) return;

            btnPlay.Visibility = Visibility.Collapsed;
            btnPause.Visibility = Visibility.Visible;
            btnPause.IsEnabled = true;
            _isPlaying = true;

            _playbackCts = new CancellationTokenSource();

            await Task.Run(async () =>
            {
                var startTime = _currentPlaybackTime;
                var endTime = _timelineAnalysis.EndTime;
                var totalDuration = (endTime - startTime).TotalSeconds;
                var stepInterval = 50;
                var currentTime = startTime;

                while (currentTime < endTime && !_playbackCts.Token.IsCancellationRequested && _isPlaying)
                {
                    var stepSeconds = (stepInterval / 1000.0) * _playbackSpeed;
                    currentTime = currentTime.AddSeconds(stepSeconds);
                    
                    if (currentTime > endTime) currentTime = endTime;

                    var progress = _timelineService.GetProgressPercentage(_timelineAnalysis, currentTime);

                    Dispatcher.Invoke(() =>
                    {
                        if (_isPlaying)
                        {
                            timelineSlider.ValueChanged -= timelineSlider_ValueChanged;
                            timelineSlider.Value = progress;
                            timelineSlider.ValueChanged += timelineSlider_ValueChanged;
                            UpdateTimelineSnapshot(currentTime);
                        }
                    });

                    try
                    {
                        await Task.Delay(stepInterval, _playbackCts.Token);
                    }
                    catch (TaskCanceledException)
                    {
                        break;
                    }
                }

                Dispatcher.Invoke(() =>
                {
                    if (currentTime >= endTime)
                    {
                        _isPlaying = false;
                        btnPlay.Visibility = Visibility.Visible;
                        btnPause.Visibility = Visibility.Collapsed;
                    }
                });
            });
        }

        private void btnPause_Click(object sender, RoutedEventArgs e)
        {
            _isPlaying = false;
            btnPlay.Visibility = Visibility.Visible;
            btnPause.Visibility = Visibility.Collapsed;
        }

        private void btnStop_Click(object sender, RoutedEventArgs e)
        {
            StopPlayback();
            
            if (_timelineAnalysis != null)
            {
                _currentPlaybackTime = _timelineAnalysis.StartTime;
                timelineSlider.Value = 0;
                UpdateTimelineSnapshot(_timelineAnalysis.StartTime);
            }
        }

        private void StopPlayback()
        {
            _isPlaying = false;
            _playbackCts?.Cancel();
            _playbackCts?.Dispose();
            _playbackCts = null;

            btnPlay.Visibility = Visibility.Visible;
            btnPause.Visibility = Visibility.Collapsed;
        }

        private void timelineSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (_timelineAnalysis == null) return;

            var targetTime = _timelineService.GetTimeAtPercentage(_timelineAnalysis, e.NewValue);
            UpdateTimelineSnapshot(targetTime);
        }

        private void rbSpeed_Checked(object sender, RoutedEventArgs e)
        {
            if (rbSpeed05.IsChecked == true) _playbackSpeed = 0.5;
            else if (rbSpeed1.IsChecked == true) _playbackSpeed = 1.0;
            else if (rbSpeed2.IsChecked == true) _playbackSpeed = 2.0;
            else if (rbSpeed5.IsChecked == true) _playbackSpeed = 5.0;
            else if (rbSpeed10.IsChecked == true) _playbackSpeed = 10.0;
        }

        private void UpdateChart()
        {
            var model = new PlotModel { Title = "技能使用次数 Top 5" };
            model.Axes.Add(new CategoryAxis
            {
                Position = AxisPosition.Bottom,
                Angle = -30,
                FontSize = 10
            });
            model.Axes.Add(new LinearAxis
            {
                Position = AxisPosition.Left,
                Title = "使用次数",
                Minimum = 0
            });

            var series = new ColumnSeries
            {
                FillColor = OxyColor.FromRgb(79, 129, 189),
                StrokeColor = OxyColors.White,
                StrokeThickness = 1
            };

            foreach (var skill in _topSkills)
            {
                series.Items.Add(new ColumnItem(skill.UseCount));
                ((CategoryAxis)model.Axes[0]).Labels.Add(skill.SkillName);
            }

            model.Series.Add(series);
            _viewModel.ChartModel = model;
        }

        private async void btnRefreshCache_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(_currentFilePath))
            {
                MessageBox.Show("请先导入战斗日志文件。", "提示", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }
            await LoadLogFile(_currentFilePath);
        }

        private void btnClearCache_Click(object sender, RoutedEventArgs e)
        {
            var result = MessageBox.Show("确定要清除所有缓存数据吗？这不会影响原始日志文件。", "确认清除", 
                MessageBoxButton.YesNo, MessageBoxImage.Warning);
            
            if (result == MessageBoxResult.Yes)
            {
                try
                {
                    StopPlayback();
                    _dbService.ClearAllCache();
                    _playerStats = new List<PlayerStats>();
                    _topSkills = new List<SkillStats>();
                    _events = new List<CombatEvent>();
                    _timelineAnalysis = null;
                    _currentFileHash = null;
                    _currentFilePath = null;
                    
                    dgPlayerStats.ItemsSource = null;
                    dgEvents.ItemsSource = null;
                    _viewModel.ChartModel = null;
                    playerStatusList.ItemsSource = null;
                    dgTimelineEvents.ItemsSource = null;
                    
                    timelineSlider.Value = 0;
                    timelineSlider.IsEnabled = false;
                    btnPlay.IsEnabled = false;
                    btnPause.IsEnabled = false;
                    btnStop.IsEnabled = false;
                    
                    SetExportEnabled(false);
                    txtStatus.Text = "缓存已清除，请重新导入战斗日志";
                    statusBarText.Text = "所有缓存已清除";
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"清除缓存时出错: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }

        private void btnExportPlayers_Click(object sender, RoutedEventArgs e)
        {
            ExportToCsv("玩家统计", "player_stats.csv", _playerStats, _csvExporter.ExportPlayerStats);
        }

        private void btnExportSkills_Click(object sender, RoutedEventArgs e)
        {
            ExportToCsv("技能统计", "skill_stats.csv", _topSkills, _csvExporter.ExportSkillStats);
        }

        private void btnExportEvents_Click(object sender, RoutedEventArgs e)
        {
            ExportToCsv("战斗事件", "combat_events.csv", _events, _csvExporter.ExportCombatEvents);
        }

        private void ExportToCsv<T>(string title, string defaultFileName, T data, Action<string, T> exportAction)
        {
            var dialog = new SaveFileDialog
            {
                Title = $"导出{title}",
                FileName = defaultFileName,
                Filter = "CSV文件 (*.csv)|*.csv"
            };

            if (dialog.ShowDialog() == true)
            {
                try
                {
                    exportAction(dialog.FileName, data);
                    statusBarText.Text = $"{title}已导出到: {dialog.FileName}";
                    MessageBox.Show($"{title}导出成功！", "完成", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"导出失败: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }

        private void SetUIEnabled(bool enabled)
        {
            btnImport.IsEnabled = enabled;
            btnRefreshCache.IsEnabled = enabled;
            btnClearCache.IsEnabled = enabled;
            if (enabled && _playerStats.Count > 0)
            {
                SetExportEnabled(true);
            }
        }

        private void SetExportEnabled(bool enabled)
        {
            btnExportPlayers.IsEnabled = enabled;
            btnExportSkills.IsEnabled = enabled;
            btnExportEvents.IsEnabled = enabled;
        }

        protected override void OnClosing(CancelEventArgs e)
        {
            StopPlayback();
            base.OnClosing(e);
        }
    }
}
