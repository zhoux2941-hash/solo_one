
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using ClinicQueueSystem.Data;
using ClinicQueueSystem.Models;

namespace ClinicQueueSystem.Forms
{
    public partial class DisplayForm : Form
    {
        private DatabaseHelper dbHelper;
        private Timer refreshTimer;
        private int lastCalledQueueNumber = -1;
        private int flashCount = 0;
        private Timer flashTimer;
        private bool flashVisible = true;

        public DisplayForm()
        {
            InitializeComponent();
            dbHelper = new DatabaseHelper();
            InitializeUI();
            SetupRefreshTimer();
            SetupFlashTimer();
            RefreshData();
        }

        private void InitializeUI()
        {
            this.Text = "候诊大屏显示";
            this.Size = new Size(1024, 768);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.WindowState = FormWindowState.Maximized;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.White;
            this.TopMost = true;

            Panel headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 120,
                BackColor = Color.FromArgb(0, 122, 204)
            };
            this.Controls.Add(headerPanel);

            Label titleLabel = new Label
            {
                Text = "医院候诊叫号系统",
                Font = new Font("微软雅黑", 48, FontStyle.Bold),
                ForeColor = Color.White,
                AutoSize = true,
                BackColor = Color.Transparent
            };
            titleLabel.Location = new Point((this.Width - titleLabel.PreferredWidth) / 2, 30);
            headerPanel.Controls.Add(titleLabel);

            SplitContainer mainSplit = new SplitContainer
            {
                Dock = DockStyle.Fill,
                Orientation = Orientation.Vertical,
                SplitterDistance = 600,
                SplitterWidth = 5,
                BackColor = Color.White
            };
            this.Controls.Add(mainSplit);

            Panel currentPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.White
            };
            mainSplit.Panel1.Controls.Add(currentPanel);

            Panel waitingPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(245, 245, 245)
            };
            mainSplit.Panel2.Controls.Add(waitingPanel);

            Label currentTitle = new Label
            {
                Text = "当前叫号",
                Font = new Font("微软雅黑", 32, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 122, 204),
                AutoSize = true
            };
            currentTitle.Location = new Point(50, 30);
            currentPanel.Controls.Add(currentTitle);

            Label queueNumberLabel = new Label
            {
                Name = "queueNumberLabel",
                Text = "---",
                Font = new Font("微软雅黑", 200, FontStyle.Bold),
                ForeColor = Color.Red,
                AutoSize = true
            };
            queueNumberLabel.Location = new Point(50, 100);
            currentPanel.Controls.Add(queueNumberLabel);

            Label nameTitle = new Label
            {
                Text = "患者姓名",
                Font = new Font("微软雅黑", 24, FontStyle.Bold),
                ForeColor = Color.FromArgb(102, 102, 102),
                AutoSize = true
            };
            nameTitle.Location = new Point(50, 380);
            currentPanel.Controls.Add(nameTitle);

            Label nameLabel = new Label
            {
                Name = "nameLabel",
                Text = "请等待叫号",
                Font = new Font("微软雅黑", 48, FontStyle.Bold),
                ForeColor = Color.FromArgb(51, 51, 51),
                AutoSize = true
            };
            nameLabel.Location = new Point(50, 430);
            currentPanel.Controls.Add(nameLabel);

            Label deptTitle = new Label
            {
                Text = "就诊科室",
                Font = new Font("微软雅黑", 24, FontStyle.Bold),
                ForeColor = Color.FromArgb(102, 102, 102),
                AutoSize = true
            };
            deptTitle.Location = new Point(50, 530);
            currentPanel.Controls.Add(deptTitle);

            Label deptLabel = new Label
            {
                Name = "deptLabel",
                Text = "",
                Font = new Font("微软雅黑", 36, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 122, 204),
                AutoSize = true
            };
            deptLabel.Location = new Point(50, 580);
            currentPanel.Controls.Add(deptLabel);

            Label waitingTitle = new Label
            {
                Text = "等候列表",
                Font = new Font("微软雅黑", 32, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 122, 204),
                AutoSize = true
            };
            waitingTitle.Location = new Point(30, 30);
            waitingPanel.Controls.Add(waitingTitle);

            Label hintLabel = new Label
            {
                Text = "前3名",
                Font = new Font("微软雅黑", 18),
                ForeColor = Color.FromArgb(153, 153, 153),
                AutoSize = true
            };
            hintLabel.Location = new Point(200, 50);
            waitingPanel.Controls.Add(hintLabel);

            for (int i = 0; i < 3; i++)
            {
                Panel itemPanel = new Panel
                {
                    Name = $"waitingPanel{i}",
                    Location = new Point(30, 100 + i * 180),
                    Size = new Size(340, 150),
                    BackColor = Color.White,
                    BorderStyle = BorderStyle.FixedSingle
                };
                waitingPanel.Controls.Add(itemPanel);

                Label rankLabel = new Label
                {
                    Name = $"rankLabel{i}",
                    Text = (i + 1).ToString(),
                    Font = new Font("微软雅黑", 72, FontStyle.Bold),
                    ForeColor = i == 0 ? Color.Red : Color.FromArgb(0, 122, 204),
                    Location = new Point(20, 20),
                    AutoSize = true
                };
                itemPanel.Controls.Add(rankLabel);

                Label queueLabel = new Label
                {
                    Name = $"waitingQueueLabel{i}",
                    Text = "号",
                    Font = new Font("微软雅黑", 28, FontStyle.Bold),
                    ForeColor = Color.FromArgb(51, 51, 51),
                    Location = new Point(140, 40),
                    AutoSize = true
                };
                itemPanel.Controls.Add(queueLabel);

                Label waitingNameLabel = new Label
                {
                    Name = $"waitingNameLabel{i}",
                    Text = "",
                    Font = new Font("微软雅黑", 24, FontStyle.Bold),
                    ForeColor = Color.FromArgb(51, 51, 51),
                    Location = new Point(140, 80),
                    AutoSize = true
                };
                itemPanel.Controls.Add(waitingNameLabel);

                Label priorityLabel = new Label
                {
                    Name = $"waitingPriorityLabel{i}",
                    Text = "",
                    Font = new Font("微软雅黑", 16),
                    ForeColor = Color.Orange,
                    Location = new Point(140, 120),
                    AutoSize = true
                };
                itemPanel.Controls.Add(priorityLabel);
            }

            Button closeButton = new Button
            {
                Text = "关闭",
                Size = new Size(100, 40),
                Location = new Point(this.Width - 130, 20),
                Font = new Font("微软雅黑", 14),
                BackColor = Color.White,
                ForeColor = Color.FromArgb(0, 122, 204),
                FlatStyle = FlatStyle.Flat
            };
            closeButton.Click += CloseButton_Click;
            headerPanel.Controls.Add(closeButton);
        }

        private void SetupRefreshTimer()
        {
            refreshTimer = new Timer();
            refreshTimer.Interval = 500;
            refreshTimer.Tick += RefreshTimer_Tick;
            refreshTimer.Start();
        }

        private void SetupFlashTimer()
        {
            flashTimer = new Timer();
            flashTimer.Interval = 300;
            flashTimer.Tick += FlashTimer_Tick;
        }

        private void FlashTimer_Tick(object sender, EventArgs e)
        {
            Label queueNumberLabel = this.Controls.Find("queueNumberLabel", true)[0] as Label;
            if (queueNumberLabel != null)
            {
                flashVisible = !flashVisible;
                queueNumberLabel.Visible = flashVisible;
                flashCount++;

                if (flashCount >= 10)
                {
                    flashTimer.Stop();
                    queueNumberLabel.Visible = true;
                    flashVisible = true;
                }
            }
        }

        private void RefreshTimer_Tick(object sender, EventArgs e)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(RefreshData));
            }
            else
            {
                RefreshData();
            }
        }

        private void RefreshData()
        {
            try
            {
                List<Patient> waitingPatients = dbHelper.GetWaitingPatients();
                List<Patient> inProgressPatients = dbHelper.GetInProgressPatients();

                Patient currentPatient = null;
                if (inProgressPatients.Count > 0)
                {
                    currentPatient = inProgressPatients[0];
                }

                Label[] currentLabels = FindCurrentLabels();
                if (currentLabels != null)
                {
                    Label queueNumberLabel = currentLabels[0];
                    Label nameLabel = currentLabels[1];
                    Label deptLabel = currentLabels[2];

                    if (currentPatient != null)
                    {
                        if (queueNumberLabel.Text != currentPatient.QueueNumber.ToString())
                        {
                            queueNumberLabel.Text = currentPatient.QueueNumber.ToString();
                        }
                        if (nameLabel.Text != currentPatient.Name)
                        {
                            nameLabel.Text = currentPatient.Name;
                        }
                        if (deptLabel.Text != currentPatient.Department)
                        {
                            deptLabel.Text = currentPatient.Department;
                        }

                        if (lastCalledQueueNumber != currentPatient.QueueNumber)
                        {
                            lastCalledQueueNumber = currentPatient.QueueNumber;
                            StartFlash();
                        }
                    }
                    else
                    {
                        if (queueNumberLabel.Text != "---") queueNumberLabel.Text = "---";
                        if (nameLabel.Text != "请等待叫号") nameLabel.Text = "请等待叫号";
                        if (deptLabel.Text != "") deptLabel.Text = "";
                    }

                    queueNumberLabel.Invalidate();
                    nameLabel.Invalidate();
                    deptLabel.Invalidate();
                }

                UpdateWaitingList(waitingPatients);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"刷新数据错误: {ex.Message}");
            }
        }

        private Label[] FindCurrentLabels()
        {
            Control[] queueNumberLabels = this.Controls.Find("queueNumberLabel", true);
            Control[] nameLabels = this.Controls.Find("nameLabel", true);
            Control[] deptLabels = this.Controls.Find("deptLabel", true);

            if (queueNumberLabels.Length > 0 && nameLabels.Length > 0 && deptLabels.Length > 0)
            {
                return new Label[] {
                    queueNumberLabels[0] as Label,
                    nameLabels[0] as Label,
                    deptLabels[0] as Label
                };
            }
            return null;
        }

        private void UpdateWaitingList(List<Patient> waitingPatients)
        {
            for (int i = 0; i < 3; i++)
            {
                Control[] itemPanels = this.Controls.Find($"waitingPanel{i}", true);
                Control[] queueLabels = this.Controls.Find($"waitingQueueLabel{i}", true);
                Control[] waitingNameLabels = this.Controls.Find($"waitingNameLabel{i}", true);
                Control[] priorityLabels = this.Controls.Find($"waitingPriorityLabel{i}", true);

                if (itemPanels.Length == 0 || queueLabels.Length == 0 || 
                    waitingNameLabels.Length == 0 || priorityLabels.Length == 0)
                    continue;

                Panel itemPanel = itemPanels[0] as Panel;
                Label queueLabel = queueLabels[0] as Label;
                Label waitingNameLabel = waitingNameLabels[0] as Label;
                Label priorityLabel = priorityLabels[0] as Label;

                if (itemPanel == null || queueLabel == null || waitingNameLabel == null || priorityLabel == null)
                    continue;

                if (i < waitingPatients.Count)
                {
                    string newQueueText = $"{waitingPatients[i].QueueNumber} 号";
                    string newNameText = waitingPatients[i].Name;
                    string newPriorityText = waitingPatients[i].Priority == Priority.Priority ? "★ 优先" : "";

                    if (queueLabel.Text != newQueueText) queueLabel.Text = newQueueText;
                    if (waitingNameLabel.Text != newNameText) waitingNameLabel.Text = newNameText;
                    if (priorityLabel.Text != newPriorityText) priorityLabel.Text = newPriorityText;
                    
                    itemPanel.Visible = true;
                }
                else
                {
                    if (queueLabel.Text != "号") queueLabel.Text = "号";
                    if (waitingNameLabel.Text != "") waitingNameLabel.Text = "";
                    if (priorityLabel.Text != "") priorityLabel.Text = "";
                    itemPanel.Visible = true;
                }

                queueLabel.Invalidate();
                waitingNameLabel.Invalidate();
                priorityLabel.Invalidate();
                itemPanel.Invalidate();
            }
        }

        private void StartFlash()
        {
            flashCount = 0;
            flashVisible = true;
            flashTimer.Start();
        }

        private void CloseButton_Click(object sender, EventArgs e)
        {
            DialogResult result = MessageBox.Show("确定要关闭大屏显示吗？", "确认", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result == DialogResult.Yes)
            {
                this.Close();
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (refreshTimer != null)
            {
                refreshTimer.Stop();
                refreshTimer.Dispose();
            }
            if (flashTimer != null)
            {
                flashTimer.Stop();
                flashTimer.Dispose();
            }
            base.OnFormClosing(e);
        }
    }
}
