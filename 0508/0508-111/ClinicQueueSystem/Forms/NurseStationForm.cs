
using System;
using System.Windows.Forms;
using ClinicQueueSystem.Data;
using ClinicQueueSystem.Models;

namespace ClinicQueueSystem.Forms
{
    public partial class NurseStationForm : Form
    {
        private DatabaseHelper dbHelper;

        public NurseStationForm()
        {
            InitializeComponent();
            dbHelper = new DatabaseHelper();
            InitializeUI();
            LoadDepartments();
        }

        private void InitializeUI()
        {
            this.Text = "护士台 - 患者登记";
            this.Size = new System.Drawing.Size(500, 400);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;

            Label titleLabel = new Label
            {
                Text = "患者登记",
                Font = new System.Drawing.Font("微软雅黑", 18, System.Drawing.FontStyle.Bold),
                Location = new System.Drawing.Point(150, 20),
                AutoSize = true
            };
            this.Controls.Add(titleLabel);

            Label nameLabel = new Label
            {
                Text = "姓名:",
                Location = new System.Drawing.Point(50, 80),
                AutoSize = true,
                Font = new System.Drawing.Font("微软雅黑", 10)
            };
            this.Controls.Add(nameLabel);

            TextBox nameTextBox = new TextBox
            {
                Name = "nameTextBox",
                Location = new System.Drawing.Point(130, 78),
                Size = new System.Drawing.Size(280, 30),
                Font = new System.Drawing.Font("微软雅黑", 10)
            };
            this.Controls.Add(nameTextBox);

            Label deptLabel = new Label
            {
                Text = "科室:",
                Location = new System.Drawing.Point(50, 130),
                AutoSize = true,
                Font = new System.Drawing.Font("微软雅黑", 10)
            };
            this.Controls.Add(deptLabel);

            ComboBox deptComboBox = new ComboBox
            {
                Name = "deptComboBox",
                Location = new System.Drawing.Point(130, 128),
                Size = new System.Drawing.Size(280, 30),
                DropDownStyle = ComboBoxStyle.DropDownList,
                Font = new System.Drawing.Font("微软雅黑", 10)
            };
            this.Controls.Add(deptComboBox);

            Label priorityLabel = new Label
            {
                Text = "优先级:",
                Location = new System.Drawing.Point(50, 180),
                AutoSize = true,
                Font = new System.Drawing.Font("微软雅黑", 10)
            };
            this.Controls.Add(priorityLabel);

            ComboBox priorityComboBox = new ComboBox
            {
                Name = "priorityComboBox",
                Location = new System.Drawing.Point(130, 178),
                Size = new System.Drawing.Size(280, 30),
                DropDownStyle = ComboBoxStyle.DropDownList,
                Font = new System.Drawing.Font("微软雅黑", 10)
            };
            priorityComboBox.Items.AddRange(new string[] { "普通", "优先" });
            priorityComboBox.SelectedIndex = 0;
            this.Controls.Add(priorityComboBox);

            Button addButton = new Button
            {
                Text = "添加患者",
                Location = new System.Drawing.Point(150, 240),
                Size = new System.Drawing.Size(180, 50),
                Font = new System.Drawing.Font("微软雅黑", 12, System.Drawing.FontStyle.Bold),
                BackColor = System.Drawing.Color.FromArgb(0, 122, 204),
                ForeColor = System.Drawing.Color.White,
                FlatStyle = FlatStyle.Flat
            };
            addButton.Click += AddButton_Click;
            this.Controls.Add(addButton);

            Label resultLabel = new Label
            {
                Name = "resultLabel",
                Location = new System.Drawing.Point(50, 310),
                Size = new System.Drawing.Size(380, 30),
                Font = new System.Drawing.Font("微软雅黑", 10),
                ForeColor = System.Drawing.Color.Green,
                TextAlign = System.Drawing.ContentAlignment.MiddleCenter
            };
            this.Controls.Add(resultLabel);
        }

        private void LoadDepartments()
        {
            ComboBox deptComboBox = this.Controls["deptComboBox"] as ComboBox;
            if (deptComboBox != null)
            {
                deptComboBox.Items.AddRange(new string[] {
                    "内科", "外科", "儿科", "妇产科", "骨科", "眼科", "耳鼻喉科", "皮肤科", "口腔科", "中医科"
                });
                if (deptComboBox.Items.Count > 0)
                    deptComboBox.SelectedIndex = 0;
            }
        }

        private void AddButton_Click(object sender, EventArgs e)
        {
            TextBox nameTextBox = this.Controls["nameTextBox"] as TextBox;
            ComboBox deptComboBox = this.Controls["deptComboBox"] as ComboBox;
            ComboBox priorityComboBox = this.Controls["priorityComboBox"] as ComboBox;
            Label resultLabel = this.Controls["resultLabel"] as Label;

            if (nameTextBox == null || deptComboBox == null || priorityComboBox == null || resultLabel == null)
                return;

            if (string.IsNullOrWhiteSpace(nameTextBox.Text))
            {
                resultLabel.Text = "请输入患者姓名";
                resultLabel.ForeColor = System.Drawing.Color.Red;
                return;
            }

            if (deptComboBox.SelectedIndex < 0)
            {
                resultLabel.Text = "请选择科室";
                resultLabel.ForeColor = System.Drawing.Color.Red;
                return;
            }

            try
            {
                Patient patient = new Patient
                {
                    Name = nameTextBox.Text.Trim(),
                    Department = deptComboBox.SelectedItem.ToString(),
                    Priority = priorityComboBox.SelectedIndex == 1 ? Priority.Priority : Priority.Normal
                };

                int patientId = dbHelper.AddPatient(patient);
                Patient addedPatient = dbHelper.GetPatientById(patientId);

                if (addedPatient != null)
                {
                    resultLabel.Text = $"添加成功！排队号: {addedPatient.QueueNumber}";
                    resultLabel.ForeColor = System.Drawing.Color.Green;
                    nameTextBox.Clear();
                    nameTextBox.Focus();
                }
                else
                {
                    resultLabel.Text = "添加失败，请重试";
                    resultLabel.ForeColor = System.Drawing.Color.Red;
                }
            }
            catch (Exception ex)
            {
                resultLabel.Text = $"添加失败: {ex.Message}";
                resultLabel.ForeColor = System.Drawing.Color.Red;
            }
        }
    }
}
