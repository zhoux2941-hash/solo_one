
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using ClinicQueueSystem.Data;
using ClinicQueueSystem.Models;
using ClinicQueueSystem.Utils;

namespace ClinicQueueSystem.Forms
{
    public partial class ExportForm : Form
    {
        private DatabaseHelper dbHelper;

        public ExportForm()
        {
            InitializeComponent();
            dbHelper = new DatabaseHelper();
            InitializeUI();
            LoadData();
        }

        private void InitializeUI()
        {
            this.Text = "历史就诊记录 - 导出";
            this.Size = new Size(800, 600);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;

            Panel filterPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 80,
                BackColor = Color.FromArgb(245, 245, 245)
            };
            this.Controls.Add(filterPanel);

            Label startLabel = new Label
            {
                Text = "开始日期:",
                Location = new Point(20, 20),
                AutoSize = true,
                Font = new Font("微软雅黑", 10)
            };
            filterPanel.Controls.Add(startLabel);

            DateTimePicker startPicker = new DateTimePicker
            {
                Name = "startPicker",
                Location = new Point(100, 18),
                Size = new Size(150, 30),
                Format = DateTimePickerFormat.Custom,
                CustomFormat = "yyyy-MM-dd",
                Font = new Font("微软雅黑", 10)
            };
            startPicker.Value = DateTime.Now.AddDays(-30);
            filterPanel.Controls.Add(startPicker);

            Label endLabel = new Label
            {
                Text = "结束日期:",
                Location = new Point(280, 20),
                AutoSize = true,
                Font = new Font("微软雅黑", 10)
            };
            filterPanel.Controls.Add(endLabel);

            DateTimePicker endPicker = new DateTimePicker
            {
                Name = "endPicker",
                Location = new Point(360, 18),
                Size = new Size(150, 30),
                Format = DateTimePickerFormat.Custom,
                CustomFormat = "yyyy-MM-dd",
                Font = new Font("微软雅黑", 10)
            };
            endPicker.Value = DateTime.Now;
            filterPanel.Controls.Add(endPicker);

            Button queryButton = new Button
            {
                Text = "查询",
                Location = new Point(540, 15),
                Size = new Size(80, 35),
                Font = new Font("微软雅黑", 10, FontStyle.Bold),
                BackColor = Color.FromArgb(0, 122, 204),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            queryButton.Click += QueryButton_Click;
            filterPanel.Controls.Add(queryButton);

            Button exportButton = new Button
            {
                Text = "导出CSV",
                Location = new Point(640, 15),
                Size = new Size(120, 35),
                Font = new Font("微软雅黑", 10, FontStyle.Bold),
                BackColor = Color.FromArgb(0, 200, 83),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            exportButton.Click += ExportButton_Click;
            filterPanel.Controls.Add(exportButton);

            ListView dataListView = new ListView
            {
                Name = "dataListView",
                Dock = DockStyle.Fill,
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                Font = new Font("微软雅黑", 10)
            };
            dataListView.Columns.Add("排队号", 80);
            dataListView.Columns.Add("姓名", 100);
            dataListView.Columns.Add("科室", 100);
            dataListView.Columns.Add("优先级", 80);
            dataListView.Columns.Add("挂号时间", 150);
            dataListView.Columns.Add("叫号时间", 150);
            dataListView.Columns.Add("完成时间", 150);
            this.Controls.Add(dataListView);

            Panel statusPanel = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 40,
                BackColor = Color.White
            };
            this.Controls.Add(statusPanel);

            Label countLabel = new Label
            {
                Name = "countLabel",
                Location = new Point(20, 10),
                AutoSize = true,
                Font = new Font("微软雅黑", 10),
                ForeColor = Color.FromArgb(102, 102, 102)
            };
            statusPanel.Controls.Add(countLabel);
        }

        private void QueryButton_Click(object sender, EventArgs e)
        {
            LoadData();
        }

        private void LoadData()
        {
            DateTimePicker startPicker = this.Controls.Find("startPicker", true)[0] as DateTimePicker;
            DateTimePicker endPicker = this.Controls.Find("endPicker", true)[0] as DateTimePicker;
            ListView dataListView = this.Controls.Find("dataListView", true)[0] as ListView;
            Label countLabel = this.Controls.Find("countLabel", true)[0] as Label;

            if (startPicker == null || endPicker == null || dataListView == null || countLabel == null)
                return;

            DateTime startDate = startPicker.Value.Date;
            DateTime endDate = endPicker.Value.Date.AddDays(1).AddSeconds(-1);

            List<Patient> patients = dbHelper.GetCompletedPatients(startDate, endDate);

            dataListView.Items.Clear();
            foreach (var patient in patients)
            {
                ListViewItem item = new ListViewItem(patient.QueueNumber.ToString());
                item.SubItems.Add(patient.Name);
                item.SubItems.Add(patient.Department);
                item.SubItems.Add(patient.Priority == Priority.Priority ? "优先" : "普通");
                item.SubItems.Add(patient.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"));
                item.SubItems.Add(patient.CalledAt.HasValue ? patient.CalledAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : "");
                item.SubItems.Add(patient.CompletedAt.HasValue ? patient.CompletedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : "");
                item.Tag = patient;
                dataListView.Items.Add(item);
            }

            countLabel.Text = $"共 {patients.Count} 条记录";
        }

        private void ExportButton_Click(object sender, EventArgs e)
        {
            DateTimePicker startPicker = this.Controls.Find("startPicker", true)[0] as DateTimePicker;
            DateTimePicker endPicker = this.Controls.Find("endPicker", true)[0] as DateTimePicker;

            if (startPicker == null || endPicker == null)
                return;

            DateTime startDate = startPicker.Value.Date;
            DateTime endDate = endPicker.Value.Date.AddDays(1).AddSeconds(-1);

            List<Patient> patients = dbHelper.GetCompletedPatients(startDate, endDate);

            if (patients.Count == 0)
            {
                MessageBox.Show("没有可导出的记录", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            SaveFileDialog saveDialog = new SaveFileDialog
            {
                Filter = "CSV文件 (*.csv)|*.csv",
                FileName = $"就诊记录_{DateTime.Now.ToString("yyyyMMddHHmmss")}.csv",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.Desktop)
            };

            if (saveDialog.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    ExportHelper.ExportToCsv(patients, saveDialog.FileName);
                    MessageBox.Show($"导出成功！\n文件路径: {saveDialog.FileName}", "成功", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"导出失败: {ex.Message}", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }
    }
}
