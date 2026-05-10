
using System;
using System.Drawing;
using System.Windows.Forms;

namespace ClinicQueueSystem.Forms
{
    public partial class MainForm : Form
    {
        public MainForm()
        {
            InitializeComponent();
            InitializeUI();
        }

        private void InitializeUI()
        {
            this.Text = "医院候诊叫号系统 - 主菜单";
            this.Size = new Size(600, 500);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.White;

            Label titleLabel = new Label
            {
                Text = "医院候诊叫号系统",
                Font = new Font("微软雅黑", 28, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 122, 204),
                AutoSize = true
            };
            titleLabel.Location = new Point((this.Width - titleLabel.PreferredWidth) / 2, 30);
            this.Controls.Add(titleLabel);

            Button nurseButton = new Button
            {
                Text = "护士台\n患者登记",
                Location = new Point(50, 120),
                Size = new Size(220, 120),
                Font = new Font("微软雅黑", 18, FontStyle.Bold),
                BackColor = Color.FromArgb(0, 200, 83),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                TextAlign = ContentAlignment.MiddleCenter
            };
            nurseButton.Click += NurseButton_Click;
            this.Controls.Add(nurseButton);

            Button doctorButton = new Button
            {
                Text = "医生端\n叫号系统",
                Location = new Point(320, 120),
                Size = new Size(220, 120),
                Font = new Font("微软雅黑", 18, FontStyle.Bold),
                BackColor = Color.FromArgb(0, 122, 204),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                TextAlign = ContentAlignment.MiddleCenter
            };
            doctorButton.Click += DoctorButton_Click;
            this.Controls.Add(doctorButton);

            Button displayButton = new Button
            {
                Text = "大屏显示",
                Location = new Point(50, 280),
                Size = new Size(220, 120),
                Font = new Font("微软雅黑", 20, FontStyle.Bold),
                BackColor = Color.FromArgb(255, 152, 0),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            displayButton.Click += DisplayButton_Click;
            this.Controls.Add(displayButton);

            Button exportButton = new Button
            {
                Text = "历史记录\n导出",
                Location = new Point(320, 280),
                Size = new Size(220, 120),
                Font = new Font("微软雅黑", 18, FontStyle.Bold),
                BackColor = Color.FromArgb(156, 39, 176),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                TextAlign = ContentAlignment.MiddleCenter
            };
            exportButton.Click += ExportButton_Click;
            this.Controls.Add(exportButton);

            Label versionLabel = new Label
            {
                Text = "版本 1.0",
                Font = new Font("微软雅黑", 10),
                ForeColor = Color.FromArgb(153, 153, 153),
                AutoSize = true
            };
            versionLabel.Location = new Point((this.Width - versionLabel.PreferredWidth) / 2, 430);
            this.Controls.Add(versionLabel);
        }

        private void NurseButton_Click(object sender, EventArgs e)
        {
            NurseStationForm nurseForm = new NurseStationForm();
            nurseForm.Show();
        }

        private void DoctorButton_Click(object sender, EventArgs e)
        {
            DoctorForm doctorForm = new DoctorForm();
            doctorForm.Show();
        }

        private void DisplayButton_Click(object sender, EventArgs e)
        {
            DisplayForm displayForm = new DisplayForm();
            displayForm.Show();
        }

        private void ExportButton_Click(object sender, EventArgs e)
        {
            ExportForm exportForm = new ExportForm();
            exportForm.ShowDialog();
        }
    }
}
