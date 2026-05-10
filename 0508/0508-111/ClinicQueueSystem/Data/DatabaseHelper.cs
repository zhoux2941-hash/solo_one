
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using ClinicQueueSystem.Models;

namespace ClinicQueueSystem.Data
{
    public class DatabaseHelper
    {
        private string connectionString;

        public DatabaseHelper()
        {
            string dataDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data");
            if (!Directory.Exists(dataDirectory))
            {
                Directory.CreateDirectory(dataDirectory);
            }

            string dbPath = Path.Combine(dataDirectory, "ClinicQueueDB.mdf");
            connectionString = $@"Data Source=(LocalDB)\MSSQLLocalDB;AttachDbFilename={dbPath};Integrated Security=True";
        }

        public void InitializeDatabase()
        {
            string masterConnectionString = @"Data Source=(LocalDB)\MSSQLLocalDB;Integrated Security=True";
            string dataDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data");
            string dbPath = Path.Combine(dataDirectory, "ClinicQueueDB.mdf");
            string logPath = Path.Combine(dataDirectory, "ClinicQueueDB_log.ldf");

            if (!File.Exists(dbPath))
            {
                using (SqlConnection conn = new SqlConnection(masterConnectionString))
                {
                    conn.Open();
                    string createDbSql = $@"
                        CREATE DATABASE [ClinicQueueDB]
                        ON PRIMARY (NAME=ClinicQueueDB, FILENAME='{dbPath.Replace("'", "''")}')
                        LOG ON (NAME=ClinicQueueDB_log, FILENAME='{logPath.Replace("'", "''")}')";
                    
                    using (SqlCommand cmd = new SqlCommand(createDbSql, conn))
                    {
                        cmd.ExecuteNonQuery();
                    }
                }
            }

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                
                string createTableSql = @"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Patients')
                    CREATE TABLE Patients (
                        Id INT PRIMARY KEY IDENTITY(1,1),
                        Name NVARCHAR(100) NOT NULL,
                        Department NVARCHAR(100) NOT NULL,
                        Priority INT NOT NULL DEFAULT 0,
                        QueueNumber INT NOT NULL,
                        Status INT NOT NULL DEFAULT 0,
                        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
                        CalledAt DATETIME NULL,
                        CompletedAt DATETIME NULL
                    )";
                
                using (SqlCommand cmd = new SqlCommand(createTableSql, conn))
                {
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(connectionString);
        }

        public int AddPatient(Patient patient)
        {
            int queueNumber = GetNextQueueNumber();
            patient.QueueNumber = queueNumber;
            patient.Status = PatientStatus.Waiting;
            patient.CreatedAt = DateTime.Now;

            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = @"
                    INSERT INTO Patients (Name, Department, Priority, QueueNumber, Status, CreatedAt)
                    VALUES (@Name, @Department, @Priority, @QueueNumber, @Status, @CreatedAt);
                    SELECT SCOPE_IDENTITY();";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Name", patient.Name);
                    cmd.Parameters.AddWithValue("@Department", patient.Department);
                    cmd.Parameters.AddWithValue("@Priority", (int)patient.Priority);
                    cmd.Parameters.AddWithValue("@QueueNumber", patient.QueueNumber);
                    cmd.Parameters.AddWithValue("@Status", (int)patient.Status);
                    cmd.Parameters.AddWithValue("@CreatedAt", patient.CreatedAt);

                    return Convert.ToInt32(cmd.ExecuteScalar());
                }
            }
        }

        private int GetNextQueueNumber()
        {
            string today = DateTime.Now.ToString("yyyy-MM-dd");
            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = @"
                    SELECT ISNULL(MAX(QueueNumber), 0) + 1 
                    FROM Patients 
                    WHERE CONVERT(DATE, CreatedAt) = @Today";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Today", today);
                    return Convert.ToInt32(cmd.ExecuteScalar());
                }
            }
        }

        public List<Patient> GetWaitingPatients()
        {
            List<Patient> patients = new List<Patient>();
            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = @"
                    SELECT * FROM Patients 
                    WHERE Status = @Status 
                    ORDER BY Priority DESC, CreatedAt ASC";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Status", (int)PatientStatus.Waiting);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            patients.Add(MapReaderToPatient(reader));
                        }
                    }
                }
            }
            return patients;
        }

        public List<Patient> GetInProgressPatients()
        {
            List<Patient> patients = new List<Patient>();
            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = @"
                    SELECT * FROM Patients 
                    WHERE Status = @Status 
                    ORDER BY CalledAt ASC";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Status", (int)PatientStatus.InProgress);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            patients.Add(MapReaderToPatient(reader));
                        }
                    }
                }
            }
            return patients;
        }

        public Patient GetNextPatient()
        {
            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = @"
                    SELECT TOP 1 * FROM Patients 
                    WHERE Status = @Status 
                    ORDER BY Priority DESC, CreatedAt ASC";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Status", (int)PatientStatus.Waiting);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return MapReaderToPatient(reader);
                        }
                    }
                }
            }
            return null;
        }

        public bool CallPatient(int patientId)
        {
            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = @"
                    UPDATE Patients 
                    SET Status = @Status, CalledAt = @CalledAt 
                    WHERE Id = @Id AND Status = @OldStatus";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Status", (int)PatientStatus.InProgress);
                    cmd.Parameters.AddWithValue("@CalledAt", DateTime.Now);
                    cmd.Parameters.AddWithValue("@Id", patientId);
                    cmd.Parameters.AddWithValue("@OldStatus", (int)PatientStatus.Waiting);
                    return cmd.ExecuteNonQuery() > 0;
                }
            }
        }

        public bool SkipPatient(int patientId)
        {
            Patient patient = GetPatientById(patientId);
            if (patient == null) return false;

            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = @"
                    UPDATE Patients 
                    SET Status = @Status, CreatedAt = @CreatedAt 
                    WHERE Id = @Id";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Status", (int)PatientStatus.Waiting);
                    cmd.Parameters.AddWithValue("@CreatedAt", DateTime.Now.AddSeconds(1));
                    cmd.Parameters.AddWithValue("@Id", patientId);
                    return cmd.ExecuteNonQuery() > 0;
                }
            }
        }

        public bool CompletePatient(int patientId)
        {
            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = @"
                    UPDATE Patients 
                    SET Status = @Status, CompletedAt = @CompletedAt 
                    WHERE Id = @Id";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Status", (int)PatientStatus.Completed);
                    cmd.Parameters.AddWithValue("@CompletedAt", DateTime.Now);
                    cmd.Parameters.AddWithValue("@Id", patientId);
                    return cmd.ExecuteNonQuery() > 0;
                }
            }
        }

        public Patient GetPatientById(int patientId)
        {
            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = "SELECT * FROM Patients WHERE Id = @Id";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", patientId);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return MapReaderToPatient(reader);
                        }
                    }
                }
            }
            return null;
        }

        public List<Patient> GetCompletedPatients(DateTime? startDate = null, DateTime? endDate = null)
        {
            List<Patient> patients = new List<Patient>();
            using (SqlConnection conn = GetConnection())
            {
                conn.Open();
                string sql = "SELECT * FROM Patients WHERE Status = @Status";
                List<SqlParameter> parameters = new List<SqlParameter>();
                parameters.Add(new SqlParameter("@Status", (int)PatientStatus.Completed));

                if (startDate.HasValue)
                {
                    sql += " AND CompletedAt >= @StartDate";
                    parameters.Add(new SqlParameter("@StartDate", startDate.Value));
                }
                if (endDate.HasValue)
                {
                    sql += " AND CompletedAt <= @EndDate";
                    parameters.Add(new SqlParameter("@EndDate", endDate.Value));
                }
                sql += " ORDER BY CompletedAt DESC";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddRange(parameters.ToArray());
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            patients.Add(MapReaderToPatient(reader));
                        }
                    }
                }
            }
            return patients;
        }

        private Patient MapReaderToPatient(SqlDataReader reader)
        {
            return new Patient
            {
                Id = Convert.ToInt32(reader["Id"]),
                Name = Convert.ToString(reader["Name"]),
                Department = Convert.ToString(reader["Department"]),
                Priority = (Priority)Convert.ToInt32(reader["Priority"]),
                QueueNumber = Convert.ToInt32(reader["QueueNumber"]),
                Status = (PatientStatus)Convert.ToInt32(reader["Status"]),
                CreatedAt = Convert.ToDateTime(reader["CreatedAt"]),
                CalledAt = reader["CalledAt"] == DBNull.Value ? (DateTime?)null : Convert.ToDateTime(reader["CalledAt"]),
                CompletedAt = reader["CompletedAt"] == DBNull.Value ? (DateTime?)null : Convert.ToDateTime(reader["CompletedAt"])
            };
        }
    }
}
