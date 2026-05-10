package com.lawyer.letter.controller;

import com.lawyer.letter.model.LetterRecord;
import com.lawyer.letter.model.LetterTemplate;
import com.lawyer.letter.service.RecordService;
import com.lawyer.letter.service.TemplateService;
import com.lawyer.letter.util.WordGenerator;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.VBox;
import javafx.stage.DirectoryChooser;
import javafx.stage.FileChooser;
import javafx.util.Pair;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class MainController {

    @FXML private ComboBox<LetterTemplate> templateComboBox;
    @FXML private TextArea templatePreviewArea;
    @FXML private VBox formFieldsContainer;
    @FXML private TabPane mainTabPane;
    @FXML private TableView<LetterRecord> recordsTable;
    @FXML private TableColumn<LetterRecord, String> colTemplate;
    @FXML private TableColumn<LetterRecord, String> colClient;
    @FXML private TableColumn<LetterRecord, String> colCounterparty;
    @FXML private TableColumn<LetterRecord, String> colTime;
    @FXML private TableColumn<LetterRecord, String> colPath;
    @FXML private TextField searchField;
    @FXML private RadioButton formatDocx;
    @FXML private RadioButton formatRtf;
    @FXML private ToggleGroup formatGroup;
    @FXML private TextArea batchInputArea;
    @FXML private ComboBox<LetterTemplate> batchTemplateCombo;
    @FXML private TextField batchClientField;
    @FXML private TextField batchLawyerOfficeField;
    @FXML private TextField batchLawyerNameField;
    @FXML private TextArea batchCommonFields;
    @FXML private RadioButton batchFormatDocx;
    @FXML private RadioButton batchFormatRtf;
    @FXML private ToggleGroup batchFormatGroup;
    @FXML private Label batchStatusLabel;

    private final TemplateService templateService = new TemplateService();
    private final RecordService recordService = new RecordService();
    private final Map<String, TextField> formFields = new HashMap<>();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy年MM月dd日");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @FXML
    public void initialize() {
        loadTemplates();
        setupRecordsTable();
        loadRecords();
        templateComboBox.getSelectionModel().selectedItemProperty().addListener(
                (obs, oldVal, newVal) -> {
                    if (newVal != null) {
                        showTemplatePreview(newVal);
                        buildFormFields(newVal);
                    }
                });
        batchTemplateCombo.getSelectionModel().selectedItemProperty().addListener(
                (obs, oldVal, newVal) -> {
                    if (newVal != null) {
                        updateBatchCommonFields(newVal);
                    }
                });
        searchField.textProperty().addListener((obs, oldVal, newVal) -> loadRecords());
    }

    private void loadTemplates() {
        List<LetterTemplate> templates = templateService.getAllTemplates();
        templateComboBox.setItems(FXCollections.observableArrayList(templates));
        batchTemplateCombo.setItems(FXCollections.observableArrayList(templates));
        if (!templates.isEmpty()) {
            templateComboBox.getSelectionModel().selectFirst();
            batchTemplateCombo.getSelectionModel().selectFirst();
        }
    }

    private void showTemplatePreview(LetterTemplate template) {
        templatePreviewArea.setText(template.getContent());
    }

    private void buildFormFields(LetterTemplate template) {
        formFieldsContainer.getChildren().clear();
        formFields.clear();
        if (template.getPlaceholderList() == null || template.getPlaceholderList().isEmpty()) {
            return;
        }
        String[] placeholders = template.getPlaceholderList().split(",");
        for (String placeholder : placeholders) {
            placeholder = placeholder.trim();
            if (placeholder.isEmpty() || "current_date".equals(placeholder)) {
                continue;
            }
            Label label = new Label(getPlaceholderLabel(placeholder));
            label.setStyle("-fx-font-weight: bold; -fx-padding: 5 0 2 0;");
            TextField textField = new TextField();
            textField.setPromptText("请输入" + getPlaceholderLabel(placeholder));
            textField.setPrefWidth(400);
            formFieldsContainer.getChildren().addAll(label, textField);
            formFields.put(placeholder, textField);
        }
    }

    private String getPlaceholderLabel(String placeholder) {
        Map<String, String> labels = new HashMap<>();
        labels.put("client", "委托人/当事人");
        labels.put("lawyer_office", "律师事务所名称");
        labels.put("lawyer_address", "律师事务所地址");
        labels.put("lawyer_phone", "律师电话");
        labels.put("lawyer_fax", "律师传真");
        labels.put("lawyer_name", "经办律师");
        labels.put("counterparty", "对方公司/个人名称");
        labels.put("counterparty_address", "对方地址");
        labels.put("fact_description", "事实描述");
        labels.put("amount", "金额（元）");
        labels.put("deadline_date", "截止日期");
        labels.put("days", "要求期限（天）");
        labels.put("bank_name", "开户银行");
        labels.put("bank_account", "银行账号");
        labels.put("right_type", "权利类型");
        labels.put("right_description", "权利描述");
        labels.put("infringement_fact", "侵权事实");
        labels.put("contract_date", "合同签订日期");
        labels.put("contract_name", "合同名称");
        labels.put("contract_terms", "合同条款摘要");
        labels.put("performance_status", "履行情况");
        return labels.getOrDefault(placeholder, placeholder);
    }

    private void setupRecordsTable() {
        colTemplate.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().getTemplateName()));
        colClient.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().getClientName()));
        colCounterparty.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().getCounterpartyName()));
        colTime.setCellValueFactory(cellData -> {
            LocalDateTime time = cellData.getValue().getCreatedAt();
            return new SimpleStringProperty(time != null ? time.format(TIME_FORMATTER) : "");
        });
        colPath.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().getOutputPath()));
        recordsTable.setRowFactory(tv -> {
            TableRow<LetterRecord> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && (!row.isEmpty())) {
                    editRecord(row.getItem());
                }
            });
            return row;
        });
    }

    private void loadRecords() {
        String keyword = searchField.getText();
        List<LetterRecord> records;
        if (keyword == null || keyword.trim().isEmpty()) {
            records = recordService.getAllRecords();
        } else {
            records = recordService.searchRecords(keyword.trim());
        }
        recordsTable.setItems(FXCollections.observableArrayList(records));
    }

    @FXML
    private void generateLetter() {
        LetterTemplate selectedTemplate = templateComboBox.getValue();
        if (selectedTemplate == null) {
            showAlert("请选择模板", Alert.AlertType.WARNING);
            return;
        }
        Map<String, String> values = new HashMap<>();
        for (Map.Entry<String, TextField> entry : formFields.entrySet()) {
            values.put(entry.getKey(), entry.getValue().getText().trim());
        }
        values.put("current_date", LocalDateTime.now().format(DATE_FORMATTER));
        if (values.getOrDefault("counterparty", "").isEmpty()) {
            showAlert("请填写对方名称", Alert.AlertType.WARNING);
            return;
        }
        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("选择保存位置");
        File selectedDir = directoryChooser.showDialog(mainTabPane.getScene().getWindow());
        if (selectedDir == null) {
            return;
        }
        boolean useRtf = formatRtf.isSelected();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String extension = useRtf ? ".rtf" : ".docx";
        String fileName = selectedTemplate.getName() + "_" + values.get("counterparty") + "_" + timestamp + extension;
        String outputPath = new File(selectedDir, fileName).getAbsolutePath();
        try {
            if (useRtf) {
                WordGenerator.generateRtf(selectedTemplate.getContent(), values, outputPath);
            } else {
                WordGenerator.generateDocx(selectedTemplate.getContent(), values, outputPath);
            }
            LetterRecord record = new LetterRecord(
                    selectedTemplate.getId(),
                    selectedTemplate.getName(),
                    values.get("client"),
                    values.get("counterparty"),
                    selectedTemplate.getName(),
                    mapToJson(values),
                    outputPath
            );
            recordService.saveRecord(record);
            loadRecords();
            showAlert("律师函生成成功！\n保存位置：" + outputPath, Alert.AlertType.INFORMATION);
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("生成失败：" + e.getMessage(), Alert.AlertType.ERROR);
        }
    }

    @FXML
    private void deleteRecord() {
        LetterRecord selected = recordsTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("请选择要删除的记录", Alert.AlertType.WARNING);
            return;
        }
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("确认删除");
        confirm.setHeaderText("确定要删除这条记录吗？");
        if (confirm.showAndWait().get() == ButtonType.OK) {
            if (recordService.deleteRecord(selected.getId())) {
                loadRecords();
                showAlert("删除成功", Alert.AlertType.INFORMATION);
            } else {
                showAlert("删除失败", Alert.AlertType.ERROR);
            }
        }
    }

    @FXML
    private void openRecordFile() {
        LetterRecord selected = recordsTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("请选择记录", Alert.AlertType.WARNING);
            return;
        }
        String outputPath = selected.getOutputPath();
        if (outputPath == null || outputPath.isEmpty()) {
            showAlert("该记录没有关联文件", Alert.AlertType.WARNING);
            return;
        }
        File file = new File(outputPath);
        if (!file.exists()) {
            showAlert("文件不存在：" + outputPath, Alert.AlertType.WARNING);
            return;
        }
        try {
            java.awt.Desktop.getDesktop().open(file);
        } catch (Exception e) {
            showAlert("无法打开文件：" + e.getMessage(), Alert.AlertType.ERROR);
        }
    }

    private void editRecord(LetterRecord record) {
        String formDataJson = record.getFormData();
        if (formDataJson == null || formDataJson.isEmpty()) {
            showAlert("该记录无法编辑", Alert.AlertType.WARNING);
            return;
        }
        LetterTemplate template = templateService.getTemplateById(record.getTemplateId());
        if (template == null) {
            showAlert("对应的模板已不存在", Alert.AlertType.WARNING);
            return;
        }
        Map<String, String> savedValues = jsonToMap(formDataJson);
        mainTabPane.getSelectionModel().select(0);
        templateComboBox.getSelectionModel().select(template);
        for (Map.Entry<String, String> entry : savedValues.entrySet()) {
            TextField field = formFields.get(entry.getKey());
            if (field != null) {
                field.setText(entry.getValue());
            }
        }
        showAlert("已加载历史数据到表单，可修改后重新生成", Alert.AlertType.INFORMATION);
    }

    @FXML
    private void generateBatch() {
        LetterTemplate selectedTemplate = batchTemplateCombo.getValue();
        if (selectedTemplate == null) {
            showAlert("请选择模板", Alert.AlertType.WARNING);
            return;
        }
        String batchInput = batchInputArea.getText().trim();
        if (batchInput.isEmpty()) {
            showAlert("请输入批量数据", Alert.AlertType.WARNING);
            return;
        }
        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("选择批量保存位置");
        File selectedDir = directoryChooser.showDialog(mainTabPane.getScene().getWindow());
        if (selectedDir == null) {
            return;
        }
        Map<String, String> commonValues = parseCommonFields();
        commonValues.put("client", batchClientField.getText().trim());
        commonValues.put("lawyer_office", batchLawyerOfficeField.getText().trim());
        commonValues.put("lawyer_name", batchLawyerNameField.getText().trim());
        commonValues.put("current_date", LocalDateTime.now().format(DATE_FORMATTER));
        String[] lines = batchInput.split("\n");
        int successCount = 0;
        int failCount = 0;
        boolean batchUseRtf = batchFormatRtf.isSelected();
        String batchExtension = batchUseRtf ? ".rtf" : ".docx";
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                continue;
            }
            String[] parts = line.split(",");
            if (parts.length < 1) {
                continue;
            }
            Map<String, String> values = new HashMap<>(commonValues);
            values.put("counterparty", parts[0].trim());
            if (parts.length >= 2) {
                values.put("counterparty_address", parts[1].trim());
            }
            if (parts.length >= 3) {
                values.put("amount", parts[2].trim());
            }
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = selectedTemplate.getName() + "_" + values.get("counterparty") + "_" + timestamp + "_" + (i + 1) + batchExtension;
            String outputPath = new File(selectedDir, fileName).getAbsolutePath();
            try {
                if (batchUseRtf) {
                    WordGenerator.generateRtf(selectedTemplate.getContent(), values, outputPath);
                } else {
                    WordGenerator.generateDocx(selectedTemplate.getContent(), values, outputPath);
                }
                LetterRecord record = new LetterRecord(
                        selectedTemplate.getId(),
                        selectedTemplate.getName(),
                        values.get("client"),
                        values.get("counterparty"),
                        selectedTemplate.getName(),
                        mapToJson(values),
                        outputPath
                );
                recordService.saveRecord(record);
                successCount++;
            } catch (Exception e) {
                failCount++;
                e.printStackTrace();
            }
        }
        loadRecords();
        batchStatusLabel.setText("批量完成：成功" + successCount + "个，失败" + failCount + "个");
        showAlert("批量生成完成！\n成功：" + successCount + "个\n失败：" + failCount + "个", Alert.AlertType.INFORMATION);
    }

    private Map<String, String> parseCommonFields() {
        Map<String, String> values = new HashMap<>();
        String text = batchCommonFields.getText().trim();
        if (text.isEmpty()) {
            return values;
        }
        String[] lines = text.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || !line.contains("=")) {
                continue;
            }
            String[] parts = line.split("=", 2);
            if (parts.length == 2) {
                values.put(parts[0].trim(), parts[1].trim());
            }
        }
        return values;
    }

    private void updateBatchCommonFields(LetterTemplate template) {
        if (template.getPlaceholderList() == null) {
            return;
        }
        StringBuilder sb = new StringBuilder();
        sb.append("# 以下字段所有文件共用，格式：字段名=值\n");
        sb.append("# 示例：lawyer_address=北京市朝阳区XX路XX号\n");
        String[] placeholders = template.getPlaceholderList().split(",");
        Set<String> added = new HashSet<>();
        for (String ph : placeholders) {
            ph = ph.trim();
            if (ph.isEmpty() || "counterparty".equals(ph) || "counterparty_address".equals(ph) 
                || "amount".equals(ph) || "current_date".equals(ph)
                || "client".equals(ph) || "lawyer_office".equals(ph) || "lawyer_name".equals(ph)) {
                continue;
            }
            if (!added.contains(ph)) {
                sb.append(ph).append("=\n");
                added.add(ph);
            }
        }
        batchCommonFields.setText(sb.toString());
    }

    private String mapToJson(Map<String, String> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, String> entry : map.entrySet()) {
            if (!first) {
                sb.append(",");
            }
            sb.append("\"").append(entry.getKey()).append("\":\"")
              .append(entry.getValue().replace("\"", "\\\"")).append("\"");
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }

    private Map<String, String> jsonToMap(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null || json.length() < 2) {
            return map;
        }
        String content = json.substring(1, json.length() - 1);
        String[] pairs = content.split(",");
        for (String pair : pairs) {
            if (pair.contains(":")) {
                String[] parts = pair.split(":", 2);
                String key = parts[0].trim().replaceAll("^\"|\"$", "");
                String value = parts[1].trim().replaceAll("^\"|\"$", "").replace("\\\"", "\"");
                map.put(key, value);
            }
        }
        return map;
    }

    private void showAlert(String message, Alert.AlertType type) {
        Alert alert = new Alert(type);
        alert.setTitle("提示");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
