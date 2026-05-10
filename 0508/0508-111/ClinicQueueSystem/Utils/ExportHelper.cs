
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using ClinicQueueSystem.Models;

namespace ClinicQueueSystem.Utils
{
    public static class ExportHelper
    {
        public static void ExportToCsv(List<Patient> patients, string filePath)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("排队号,姓名,科室,优先级,挂号时间,叫号时间,完成时间");

            foreach (var patient in patients)
            {
                string priority = patient.Priority == Priority.Priority ? "优先" : "普通";
                string createdAt = patient.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                string calledAt = patient.CalledAt.HasValue ? patient.CalledAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : "";
                string completedAt = patient.CompletedAt.HasValue ? patient.CompletedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : "";

                sb.AppendLine($"{patient.QueueNumber},{patient.Name},{patient.Department},{priority},{createdAt},{calledAt},{completedAt}");
            }

            File.WriteAllText(filePath, sb.ToString(), Encoding.UTF8);
        }
    }
}
