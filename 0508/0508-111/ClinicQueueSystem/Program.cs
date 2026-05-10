
using System;
using System.Windows.Forms;
using ClinicQueueSystem.Data;
using ClinicQueueSystem.Forms;

namespace ClinicQueueSystem
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.SetHighDpiMode(HighDpiMode.SystemAware);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                DatabaseHelper dbHelper = new DatabaseHelper();
                dbHelper.InitializeDatabase();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"数据库初始化失败: {ex.Message}\n\n请确保已安装 LocalDB", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            Application.Run(new MainForm());
        }
    }
}
