
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using ClinicQueueSystem.Data;
using ClinicQueueSystem.Models;

namespace ClinicQueueSystem.Forms
{
    public partial class DoctorForm : Form
    {
        private DatabaseHelper dbHelper;
        private Timer refreshTimer;
        private Patient currentPatient;

        public DoctorForm()
        {
            InitializeComponent();
            dbHelper = new DatabaseHelper();
            InitializeUI();
            SetupRefreshTimer();
            RefreshData();
        }

        private void InitializeUI()
        {
            this.Text = "医生端 - 叫号系统";
            this.Size = new Size(800, 600);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.WindowState = FormWindowState.Maximized;

            SplitContainer splitContainer = new SplitContainer
            {
                Dock = DockStyle.Fill,
                Orientation = Orientation.Vertical,
                SplitterDistance = 400,
                SplitterWidth = 5
            };
            this.Controls.Add(splitContainer);

            Panel leftPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.White
            };
            splitContainer.Panel1.Controls.Add(leftPanel);

            Panel rightPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(240, 240, 240)
            };
            splitContainer.Panel2.Controls.Add(rightPanel);

            Label currentLabel = new Label
            {
                Text = "当前叫号",
                Font = new Font("微软雅黑", 16, FontStyle.Bold),
                Location = new Point(20, 20),
                AutoSize = true,
                ForeColor = Color.FromArgb(0, 122, 204)
            };
            leftPanel.Controls.Add(currentLabel);

            Label queueNumberLabel = new Label
            {
                Name = "queueNumberLabel",
                Text = "--",
                Font = new Font("微软雅黑", 72, FontStyle.Bold),
                Location = new Point(20, 60),
                AutoSize = true,
                ForeColor = Color.Red
            };
            leftPanel.Controls.Add(queueNumberLabel);

            Label patientNameLabel = new Label
            {
                Name = "patientNameLabel",
                Text = "请点击叫号",
                Font = new Font("微软雅黑", 24, FontStyle.Bold),
                Location = new Point(20, 180),
                AutoSize = true,
                ForeColor = Color.FromArgb(51, 51, 51)
            };
            leftPanel.Controls.Add(patientNameLabel);

            Label deptLabel = new Label
            {
                Name = "deptLabel",
                Text = "",
                Font = new Font("微软雅黑", 18),
                Location = new Point(20, 230),
                AutoSize = true,
                ForeColor = Color.FromArgb(102, 102, 102)
            };
            leftPanel.Controls.Add(deptLabel);

            Button callButton = new Button
            {
                Text = "叫号",
                Location = new Point(20, 300),
                Size = new Size(150, 60),
                Font = new Font("微软雅黑", 18, FontStyle.Bold),
                BackColor = Color.FromArgb(0, 200, 83),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            callButton.Click += CallButton_Click;
            leftPanel.Controls.Add(callButton);

            Button skipButton = new Button
            {
                Text = "跳过",
                Location = new Point(190, 300),
                Size = new Size(150, 60),
                Font = new Font("微软雅黑", 18, FontStyle.Bold),
                BackColor = Color.FromArgb(255, 152, 0),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            skipButton.Click += SkipButton_Click;
            leftPanel.Controls.Add(skipButton);

            Button completeButton = new Button
            {
                Text = "完成就诊",
                Location = new Point(20, 380),
                Size = new Size(320, 60),
                Font = new Font("微软雅黑", 18, FontStyle.Bold),
                BackColor = Color.FromArgb(0, 122, 204),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            completeButton.Click += CompleteButton_Click;
            leftPanel.Controls.Add(completeButton);

            Label inProgressLabel = new Label
            {
                Text = "叫号中列表",
                Font = new Font("微软雅黑", 14, FontStyle.Bold),
                Location = new Point(20, 20),
                AutoSize = true,
                ForeColor = Color.FromArgb(0, 122, 204)
            };
            rightPanel.Controls.Add(inProgressLabel);

            ListView inProgressListView = new ListView
            {
                Name = "inProgressListView",
                Location = new Point(20, 55),
                Size = new Size(340, 200),
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                Font = new Font("微软雅黑", 11)
            };
            inProgressListView.Columns.Add("排队号", 80);
            inProgressListView.Columns.Add("姓名", 100);
            inProgressListView.Columns.Add("科室", 100);
            rightPanel.Controls.Add(inProgressListView);

            Label waitingLabel = new Label
            {
                Text = "等候列表",
                Font = new Font("微软雅黑", 14, FontStyle.Bold),
                Location = new Point(20, 280),
                AutoSize = true,
                ForeColor = Color.FromArgb(0, 122, 204)
            };
            rightPanel.Controls.Add(waitingLabel);

            ListView waitingListView = new ListView
            {
                Name = "waitingListView",
                Location = new Point(20, 315),
                Size = new Size(340, 200),
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                Font = new Font("微软雅黑", 11)
            };
            waitingListView.Columns.Add("排队号", 80);
            waitingListView.Columns.Add("姓名", 100);
            waitingListView.Columns.Add("优先级", 60);
            rightPanel.Controls.Add(waitingListView);
        }

        private void SetupRefreshTimer()
        {
            refreshTimer = new Timer();
            refreshTimer.Interval = 1000;
            refreshTimer.Tick += RefreshTimer_Tick;
            refreshTimer.Start();
        }

        private void RefreshTimer_Tick(object sender, EventArgs e)
        {
            RefreshData();
        }

        private void RefreshData()
        {
            List<Patient> waitingPatients = dbHelper.GetWaitingPatients();
            List<Patient> inProgressPatients = dbHelper.GetInProgressPatients();

            ListView waitingListView = this.Controls.Find("waitingListView", true)[0] as ListView;
            ListView inProgressListView = this.Controls.Find("inProgressListView", true)[0] as ListView;
            Label queueNumberLabel = this.Controls.Find("queueNumberLabel", true)[0] as Label;
            Label patientNameLabel = this.Controls.Find("patientNameLabel", true)[0] as Label;
            Label deptLabel = this.Controls.Find("deptLabel", true)[0] as Label;

            if (waitingListView == null || inProgressListView == null || 
                queueNumberLabel == null || patientNameLabel == null || deptLabel == null)
                return;

            waitingListView.Items.Clear();
            foreach (var patient in waitingPatients)
            {
                ListViewItem item = new ListViewItem(patient.QueueNumber.ToString());
                item.SubItems.Add(patient.Name);
                item.SubItems.Add(patient.Priority == Priority.Priority ? "优先" : "普通");
                item.Tag = patient;
                waitingListView.Items.Add(item);
            }

            inProgressListView.Items.Clear();
            foreach (var patient in inProgressPatients)
            {
                ListViewItem item = new ListViewItem(patient.QueueNumber.ToString());
                item.SubItems.Add(patient.Name);
                item.SubItems.Add(patient.Department);
                item.Tag = patient;
                inProgressListView.Items.Add(item);
            }

            if (currentPatient != null)
            {
                currentPatient = dbHelper.GetPatientById(currentPatient.Id);
                if (currentPatient != null && currentPatient.Status == PatientStatus.InProgress)
                {
                    queueNumberLabel.Text = currentPatient.QueueNumber.ToString();
                    patientNameLabel.Text = currentPatient.Name;
                    deptLabel.Text = currentPatient.Department;
                }
                else
                {
                    currentPatient = null;
                    queueNumberLabel.Text = "--";
                    patientNameLabel.Text = "请点击叫号";
                    deptLabel.Text = "";
                }
            }
        }

        private void CallButton_Click(object sender, EventArgs e)
        {
            Patient nextPatient = dbHelper.GetNextPatient();
            if (nextPatient == null)
            {
                MessageBox.Show("没有等候的患者", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            if (currentPatient != null && currentPatient.Status == PatientStatus.InProgress)
            {
                DialogResult result = MessageBox.Show(
                    $"当前还有患者正在就诊，是否叫下一位患者？\n当前患者: {currentPatient.Name}",
                    "确认",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question);
                
                if (result != DialogResult.Yes)
                    return;
            }

            if (dbHelper.CallPatient(nextPatient.Id))
            {
                currentPatient = nextPatient;
                Label queueNumberLabel = this.Controls.Find("queueNumberLabel", true)[0] as Label;
                Label patientNameLabel = this.Controls.Find("patientNameLabel", true)[0] as Label;
                Label deptLabel = this.Controls.Find("deptLabel", true)[0] as Label;

                if (queueNumberLabel != null) queueNumberLabel.Text = nextPatient.QueueNumber.ToString();
                if (patientNameLabel != null) patientNameLabel.Text = nextPatient.Name;
                if (deptLabel != null) deptLabel.Text = nextPatient.Department;

                MessageBox.Show($"请 {nextPatient.QueueNumber} 号 {nextPatient.Name} 就诊", "叫号", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show("叫号失败", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            RefreshData();
        }

        private void SkipButton_Click(object sender, EventArgs e)
        {
            if (currentPatient == null)
            {
                MessageBox.Show("没有当前叫号的患者", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            DialogResult result = MessageBox.Show(
                $"确定要将 {currentPatient.Name} 跳过，放到队列末尾吗？",
                "确认跳过",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (result != DialogResult.Yes)
                return;

            if (dbHelper.SkipPatient(currentPatient.Id))
            {
                MessageBox.Show($"已将 {currentPatient.Name} 跳过", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
                currentPatient = null;
                RefreshData();
            }
            else
            {
                MessageBox.Show("跳过失败", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void CompleteButton_Click(object sender, EventArgs e)
        {
            if (currentPatient == null)
            {
                MessageBox.Show("没有当前叫号的患者", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            DialogResult result = MessageBox.Show(
                $"确定 {currentPatient.Name} 就诊完成吗？",
                "确认完成",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (result != DialogResult.Yes)
                return;

            if (dbHelper.CompletePatient(currentPatient.Id))
            {
                MessageBox.Show($"{currentPatient.Name} 就诊完成", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
                currentPatient = null;
                RefreshData();
            }
            else
            {
                MessageBox.Show("完成失败", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (refreshTimer != null)
            {
                refreshTimer.Stop();
                refreshTimer.Dispose();
            }
            base.OnFormClosing(e);
        }
    }
}
