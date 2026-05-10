package com.lawyer.letter.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseManager {
    private static final String DB_URL = "jdbc:derby:letter_db;create=true";
    private static DatabaseManager instance;
    private Connection connection;

    private DatabaseManager() {
        try {
            Class.forName("org.apache.derby.jdbc.EmbeddedDriver");
            this.connection = DriverManager.getConnection(DB_URL);
            initializeDatabase();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static synchronized DatabaseManager getInstance() {
        if (instance == null) {
            instance = new DatabaseManager();
        }
        return instance;
    }

    public Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            connection = DriverManager.getConnection(DB_URL);
        }
        return connection;
    }

    private void initializeDatabase() throws SQLException {
        try (Statement stmt = connection.createStatement()) {
            String createTemplateTable = "CREATE TABLE IF NOT EXISTS letter_templates (" +
                    "id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, " +
                    "name VARCHAR(100) NOT NULL, " +
                    "code VARCHAR(50) UNIQUE NOT NULL, " +
                    "description VARCHAR(500), " +
                    "content CLOB, " +
                    "placeholder_list VARCHAR(1000), " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
            stmt.executeUpdate(createTemplateTable);

            String createRecordTable = "CREATE TABLE IF NOT EXISTS letter_records (" +
                    "id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, " +
                    "template_id INT, " +
                    "template_name VARCHAR(100), " +
                    "client_name VARCHAR(200), " +
                    "counterparty_name VARCHAR(200), " +
                    "subject VARCHAR(500), " +
                    "form_data CLOB, " +
                    "output_path VARCHAR(1000), " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
            stmt.executeUpdate(createRecordTable);

            initializeDefaultTemplates();
        }
    }

    private void initializeDefaultTemplates() throws SQLException {
        try (Statement stmt = connection.createStatement()) {
            stmt.executeUpdate("MERGE INTO letter_templates (id, name, code, description, content, placeholder_list) " +
                    "KEY (code) VALUES (DEFAULT, '催款函', 'DEMAND', '用于催促债务人偿还欠款的函件', " +
                    "'${placeholder_lawyer_office}律师事务所\n${placeholder_lawyer_address}\n电话：${placeholder_lawyer_phone}\n传真：${placeholder_lawyer_fax}\n\n致：${placeholder_counterparty}（以下简称\"贵方\"）\n地址：${placeholder_counterparty_address}\n\n关于：催款事宜\n\n${placeholder_client}（以下简称\"委托人\"）系本所客户，就委托人与贵方之间的欠款事宜，委托本所律师致函如下：\n\n一、欠款事实\n根据委托人提供的资料显示，${placeholder_fact_description}。截至${placeholder_deadline_date}，贵方尚欠委托人款项共计人民币${placeholder_amount}元整。\n\n二、律师意见\n本所律师认为，贵方未按期支付款项的行为已构成违约，应承担相应的法律责任。\n\n三、本所要求\n请贵方于收到本函之日起${placeholder_days}日内，将上述款项支付至以下账户：\n开户名：${placeholder_client}\n开户行：${placeholder_bank_name}\n账号：${placeholder_bank_account}\n\n如贵方逾期未支付，本所将依法通过法律途径维护委托人的合法权益，届时贵方将承担包括诉讼费、律师费在内的全部损失。\n\n特此函告。\n\n${placeholder_lawyer_office}律师事务所\n律师：${placeholder_lawyer_name}\n${placeholder_current_date}', " +
                    "'client,lawyer_office,lawyer_address,lawyer_phone,lawyer_fax,lawyer_name,counterparty,counterparty_address,fact_description,amount,deadline_date,days,bank_name,bank_account')");

            stmt.executeUpdate("MERGE INTO letter_templates (id, name, code, description, content, placeholder_list) " +
                    "KEY (code) VALUES (DEFAULT, '侵权警告函', 'WARNING', '用于警告侵权方停止侵权行为的函件', " +
                    '${placeholder_lawyer_office}律师事务所\n${placeholder_lawyer_address}\n电话：${placeholder_lawyer_phone}\n传真：${placeholder_lawyer_fax}\n\n致：${placeholder_counterparty}（以下简称"贵方"）\n地址：${placeholder_counterparty_address}\n\n关于：知识产权侵权警告事宜\n\n${placeholder_client}（以下简称"委托人"）系本所客户，就贵方侵犯委托${placeholder_right_type}事宜，委托本所律师致函如下：\n\n一、权利归属\n委托人依法享有${placeholder_right_description}。\n\n二、侵权事实\n经委托人及本所调查发现，${placeholder_infringement_fact}。\n\n三、律师意见\n贵方上述行为已严重侵犯了委托人的合法权益，应当承担相应的法律责任。\n\n四、本所要求\n请贵方于收到本函之日起${placeholder_days}日内：\n1. 立即停止全部侵权行为；\n2. 销毁全部侵权产品及相关材料；\n3. 就侵权行为向委托人作出书面说明并赔礼道歉；\n4. 赔偿委托人经济损失人民币${placeholder_amount}元整。\n\n如贵方未按上述要求执行，本所将依法采取包括诉讼在内的一切必要措施维护委托人的合法权益。\n\n特此函告。\n\n${placeholder_lawyer_office}律师事务所\n律师：${placeholder_lawyer_name}\n${placeholder_current_date}\', " +
                    "'client,lawyer_office,lawyer_address,lawyer_phone,lawyer_fax,lawyer_name,counterparty,counterparty_address,right_type,right_description,infringement_fact,amount,days')");

            stmt.executeUpdate("MERGE INTO letter_templates (id, name, code, description, content, placeholder_list) " +
                    "KEY (code) VALUES (DEFAULT, '合同催告函', 'REMINDER', '用于催促对方履行合同义务的函件', " +
                    '${placeholder_lawyer_office}律师事务所\n${placeholder_lawyer_address}\n电话：${placeholder_lawyer_phone}\n传真：${placeholder_lawyer_fax}\n\n致：${placeholder_counterparty}（以下简称"贵方"）\n地址：${placeholder_counterparty_address}\n\n关于：敦促履行合同义务事宜\n\n${placeholder_client}（以下简称"委托人"）与贵方于${placeholder_contract_date}签订了《${placeholder_contract_name}》（以下简称"合同"）。现就贵方履行合同事宜，委托本所律师致函如下：\n\n一、合同约定\n根据合同约定，${placeholder_contract_terms}。\n\n二、履行情况\n截至${placeholder_current_date}，${placeholder_performance_status}。\n\n三、律师意见\n贵方未按合同约定履行义务的行为已构成违约，应承担相应的违约责任。\n\n四、本所要求\n请贵方于收到本函之日起${placeholder_days}日内，严格按照合同约定履行全部义务。\n\n如贵方逾期仍未履行，本所将依法通过法律途径维护委托人的合法权益，届时贵方将承担包括违约金、诉讼费、律师费在内的全部损失。\n\n特此函告。\n\n${placeholder_lawyer_office}律师事务所\n律师：${placeholder_lawyer_name}\n${placeholder_current_date}\', " +
                    "'client,lawyer_office,lawyer_address,lawyer_phone,lawyer_fax,lawyer_name,counterparty,counterparty_address,contract_date,contract_name,contract_terms,performance_status,days')");
        } catch (Exception e) {
            System.err.println("模板初始化警告: " + e.getMessage());
        }
    }

    public void shutdown() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
            DriverManager.getConnection("jdbc:derby:;shutdown=true");
        } catch (SQLException e) {
            if ("XJ015".equals(e.getSQLState())) {
                System.out.println("Derby数据库已正常关闭");
            }
        }
    }
}
