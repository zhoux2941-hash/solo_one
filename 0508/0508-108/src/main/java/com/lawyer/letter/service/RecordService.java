package com.lawyer.letter.service;

import com.lawyer.letter.model.LetterRecord;
import com.lawyer.letter.util.DatabaseManager;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class RecordService {
    private final DatabaseManager dbManager;

    public RecordService() {
        this.dbManager = DatabaseManager.getInstance();
    }

    public List<LetterRecord> getAllRecords() {
        List<LetterRecord> records = new ArrayList<>();
        String sql = "SELECT * FROM letter_records ORDER BY created_at DESC";

        try (Connection conn = dbManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                LetterRecord record = new LetterRecord();
                record.setId(rs.getLong("id"));
                record.setTemplateId(rs.getLong("template_id"));
                record.setTemplateName(rs.getString("template_name"));
                record.setClientName(rs.getString("client_name"));
                record.setCounterpartyName(rs.getString("counterparty_name"));
                record.setFormData(rs.getString("form_data"));
                record.setOutputPath(rs.getString("output_path"));
                Timestamp ts = rs.getTimestamp("created_at");
                if (ts != null) {
                    record.setCreatedAt(ts.toLocalDateTime());
                }
                records.add(record);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return records;
    }

    public List<LetterRecord> searchRecords(String keyword) {
        List<LetterRecord> records = new ArrayList<>();
        String sql = "SELECT * FROM letter_records WHERE client_name LIKE ? OR counterparty_name LIKE ? OR template_name LIKE ? ORDER BY created_at DESC";

        try (Connection conn = dbManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            String likeKeyword = "%" + keyword + "%";
            pstmt.setString(1, likeKeyword);
            pstmt.setString(2, likeKeyword);
            pstmt.setString(3, likeKeyword);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    LetterRecord record = new LetterRecord();
                    record.setId(rs.getLong("id"));
                    record.setTemplateId(rs.getLong("template_id"));
                    record.setTemplateName(rs.getString("template_name"));
                    record.setClientName(rs.getString("client_name"));
                    record.setCounterpartyName(rs.getString("counterparty_name"));
                    record.setFormData(rs.getString("form_data"));
                    record.setOutputPath(rs.getString("output_path"));
                    Timestamp ts = rs.getTimestamp("created_at");
                    if (ts != null) {
                        record.setCreatedAt(ts.toLocalDateTime());
                    }
                    records.add(record);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return records;
    }

    public boolean saveRecord(LetterRecord record) {
        String sql = "INSERT INTO letter_records (template_id, template_name, client_name, counterparty_name, subject, form_data, output_path) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dbManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            pstmt.setLong(1, record.getTemplateId());
            pstmt.setString(2, record.getTemplateName());
            pstmt.setString(3, record.getClientName());
            pstmt.setString(4, record.getCounterpartyName());
            pstmt.setString(5, record.getSubject());
            pstmt.setString(6, record.getFormData());
            pstmt.setString(7, record.getOutputPath());

            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        record.setId(generatedKeys.getLong(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteRecord(Long id) {
        String sql = "DELETE FROM letter_records WHERE id = ?";

        try (Connection conn = dbManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, id);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
