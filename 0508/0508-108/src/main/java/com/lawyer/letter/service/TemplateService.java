package com.lawyer.letter.service;

import com.lawyer.letter.model.LetterTemplate;
import com.lawyer.letter.util.DatabaseManager;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TemplateService {
    private final DatabaseManager dbManager;

    public TemplateService() {
        this.dbManager = DatabaseManager.getInstance();
    }

    public List<LetterTemplate> getAllTemplates() {
        List<LetterTemplate> templates = new ArrayList<>();
        String sql = "SELECT * FROM letter_templates ORDER BY id";

        try (Connection conn = dbManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                LetterTemplate template = new LetterTemplate();
                template.setId(rs.getLong("id"));
                template.setName(rs.getString("name"));
                template.setCode(rs.getString("code"));
                template.setDescription(rs.getString("description"));
                template.setContent(rs.getString("content"));
                template.setPlaceholderList(rs.getString("placeholder_list"));
                templates.add(template);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return templates;
    }

    public LetterTemplate getTemplateById(Long id) {
        String sql = "SELECT * FROM letter_templates WHERE id = ?";

        try (Connection conn = dbManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    LetterTemplate template = new LetterTemplate();
                    template.setId(rs.getLong("id"));
                    template.setName(rs.getString("name"));
                    template.setCode(rs.getString("code"));
                    template.setDescription(rs.getString("description"));
                    template.setContent(rs.getString("content"));
                    template.setPlaceholderList(rs.getString("placeholder_list"));
                    return template;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public LetterTemplate getTemplateByCode(String code) {
        String sql = "SELECT * FROM letter_templates WHERE code = ?";

        try (Connection conn = dbManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, code);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    LetterTemplate template = new LetterTemplate();
                    template.setId(rs.getLong("id"));
                    template.setName(rs.getString("name"));
                    template.setCode(rs.getString("code"));
                    template.setDescription(rs.getString("description"));
                    template.setContent(rs.getString("content"));
                    template.setPlaceholderList(rs.getString("placeholder_list"));
                    return template;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean saveTemplate(LetterTemplate template) {
        String sql = "INSERT INTO letter_templates (name, code, description, content, placeholder_list) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = dbManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            pstmt.setString(1, template.getName());
            pstmt.setString(2, template.getCode());
            pstmt.setString(3, template.getDescription());
            pstmt.setString(4, template.getContent());
            pstmt.setString(5, template.getPlaceholderList());

            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        template.setId(generatedKeys.getLong(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateTemplate(LetterTemplate template) {
        String sql = "UPDATE letter_templates SET name = ?, description = ?, content = ?, placeholder_list = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";

        try (Connection conn = dbManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, template.getName());
            pstmt.setString(2, template.getDescription());
            pstmt.setString(3, template.getContent());
            pstmt.setString(4, template.getPlaceholderList());
            pstmt.setLong(5, template.getId());

            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteTemplate(Long id) {
        String sql = "DELETE FROM letter_templates WHERE id = ?";

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
