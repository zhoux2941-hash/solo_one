package com.watermark.ui;

import com.watermark.model.WatermarkConfig;
import com.watermark.task.BatchTask;
import com.watermark.util.ImageUtil;

import javax.swing.*;
import javax.swing.border.TitledBorder;
import javax.swing.event.ChangeListener;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class WatermarkToolUI extends JFrame {

    private List<File> selectedImages = new ArrayList<>();
    private DefaultListModel<String> imageListModel = new DefaultListModel<>();
    private WatermarkConfig config = new WatermarkConfig();
    private BatchTask currentTask;

    private JList<String> imageList;
    private JLabel previewLabel;
    private JTextField watermarkTextField;
    private JTextField fontSizeField;
    private JComboBox<String> fontComboBox;
    private JButton colorButton;
    private JSlider opacitySlider;
    private JComboBox<String> positionComboBox;
    private JCheckBox tileCheckBox;
    private JProgressBar progressBar;
    private JLabel statusLabel;
    private JButton startButton;
    private File lastOutputDir;

    public WatermarkToolUI() {
        setTitle("图片水印工具");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1000, 700);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout(10, 10));

        initComponents();
        initLayout();
    }

    private void initComponents() {
        imageList = new JList<>(imageListModel);
        imageList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        imageList.addListSelectionListener(e -> updatePreview());

        previewLabel = new JLabel();
        previewLabel.setHorizontalAlignment(SwingConstants.CENTER);
        previewLabel.setBorder(BorderFactory.createLineBorder(Color.GRAY));

        watermarkTextField = new JTextField(config.getWatermarkText(), 20);
        watermarkTextField.getDocument().addDocumentListener(new SimpleDocumentListener(this::updatePreview));

        fontSizeField = new JTextField(String.valueOf(config.getFontSize()), 5);
        fontSizeField.getDocument().addDocumentListener(new SimpleDocumentListener(this::updatePreview));

        String[] fonts = GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames();
        fontComboBox = new JComboBox<>(fonts);
        fontComboBox.setSelectedItem(config.getFontName());
        fontComboBox.addActionListener(e -> updatePreview());

        colorButton = new JButton("选择颜色");
        colorButton.addActionListener(e -> chooseColor());

        opacitySlider = new JSlider(0, 100, (int) (config.getOpacity() * 100));
        opacitySlider.addChangeListener(e -> updatePreview());

        String[] positions = {"CENTER", "TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"};
        positionComboBox = new JComboBox<>(positions);
        positionComboBox.setSelectedItem(config.getPosition());
        positionComboBox.addActionListener(e -> updatePreview());

        tileCheckBox = new JCheckBox("平铺水印");
        tileCheckBox.addActionListener(e -> updatePreview());

        progressBar = new JProgressBar();
        statusLabel = new JLabel("就绪");

        startButton = new JButton("开始批量处理");
        startButton.addActionListener(e -> startBatchProcessing());
    }

    private void initLayout() {
        JPanel topPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        JButton importButton = new JButton("导入图片");
        importButton.addActionListener(e -> importImages());
        topPanel.add(importButton);
        add(topPanel, BorderLayout.NORTH);

        JSplitPane splitPane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT);
        splitPane.setDividerLocation(250);

        JPanel leftPanel = new JPanel(new BorderLayout());
        leftPanel.setBorder(new TitledBorder("图片列表"));
        leftPanel.add(new JScrollPane(imageList), BorderLayout.CENTER);
        splitPane.setLeftComponent(leftPanel);

        JPanel rightPanel = new JPanel(new BorderLayout(10, 10));

        JPanel previewPanel = new JPanel(new BorderLayout());
        previewPanel.setBorder(new TitledBorder("预览"));
        previewPanel.add(new JScrollPane(previewLabel), BorderLayout.CENTER);
        rightPanel.add(previewPanel, BorderLayout.CENTER);

        JPanel configPanel = new JPanel(new GridBagLayout());
        configPanel.setBorder(new TitledBorder("水印配置"));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5);
        gbc.anchor = GridBagConstraints.WEST;

        gbc.gridx = 0;
        gbc.gridy = 0;
        configPanel.add(new JLabel("水印文字:"), gbc);
        gbc.gridx = 1;
        gbc.gridwidth = 3;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        configPanel.add(watermarkTextField, gbc);

        gbc.gridwidth = 1;
        gbc.fill = GridBagConstraints.NONE;
        gbc.gridx = 0;
        gbc.gridy = 1;
        configPanel.add(new JLabel("字体:"), gbc);
        gbc.gridx = 1;
        configPanel.add(fontComboBox, gbc);
        gbc.gridx = 2;
        configPanel.add(new JLabel("字号:"), gbc);
        gbc.gridx = 3;
        configPanel.add(fontSizeField, gbc);

        gbc.gridx = 0;
        gbc.gridy = 2;
        configPanel.add(new JLabel("颜色:"), gbc);
        gbc.gridx = 1;
        configPanel.add(colorButton, gbc);
        gbc.gridx = 2;
        configPanel.add(new JLabel("透明度:"), gbc);
        gbc.gridx = 3;
        configPanel.add(opacitySlider, gbc);

        gbc.gridx = 0;
        gbc.gridy = 3;
        configPanel.add(new JLabel("位置:"), gbc);
        gbc.gridx = 1;
        configPanel.add(positionComboBox, gbc);
        gbc.gridx = 2;
        configPanel.add(tileCheckBox, gbc);

        rightPanel.add(configPanel, BorderLayout.NORTH);

        JPanel bottomPanel = new JPanel(new BorderLayout(10, 10));
        bottomPanel.setBorder(new TitledBorder("批量处理"));

        JPanel outputPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        JButton outputDirButton = new JButton("选择输出目录");
        outputDirButton.addActionListener(e -> chooseOutputDir());
        outputPanel.add(outputDirButton);
        bottomPanel.add(outputPanel, BorderLayout.NORTH);

        JPanel progressPanel = new JPanel(new BorderLayout(5, 5));
        progressPanel.add(progressBar, BorderLayout.CENTER);
        progressPanel.add(statusLabel, BorderLayout.SOUTH);
        bottomPanel.add(progressPanel, BorderLayout.CENTER);

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        buttonPanel.add(startButton);
        bottomPanel.add(buttonPanel, BorderLayout.SOUTH);

        rightPanel.add(bottomPanel, BorderLayout.SOUTH);

        splitPane.setRightComponent(rightPanel);
        add(splitPane, BorderLayout.CENTER);
    }

    private void importImages() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setMultiSelectionEnabled(true);
        FileNameExtensionFilter filter = new FileNameExtensionFilter(
                "图片文件 (*.jpg, *.jpeg, *.png, *.bmp, *.gif)",
                "jpg", "jpeg", "png", "bmp", "gif");
        fileChooser.setFileFilter(filter);

        int result = fileChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File[] files = fileChooser.getSelectedFiles();
            for (File file : files) {
                if (!selectedImages.contains(file)) {
                    selectedImages.add(file);
                    imageListModel.addElement(file.getName());
                }
            }
            if (!selectedImages.isEmpty()) {
                imageList.setSelectedIndex(0);
            }
        }
    }

    private void chooseColor() {
        Color newColor = JColorChooser.showDialog(this, "选择水印颜色", config.getColor());
        if (newColor != null) {
            config.setColor(newColor);
            updatePreview();
        }
    }

    private void chooseOutputDir() {
        JFileChooser dirChooser = new JFileChooser();
        dirChooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
        
        if (lastOutputDir != null && lastOutputDir.exists()) {
            dirChooser.setCurrentDirectory(lastOutputDir);
        }
        
        int result = dirChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File selectedDir = dirChooser.getSelectedFile();
            lastOutputDir = selectedDir;
            JOptionPane.showMessageDialog(this, "输出目录已设置为: " + selectedDir.getAbsolutePath());
        }
    }

    private void updateConfigFromUI() {
        config.setWatermarkText(watermarkTextField.getText());
        try {
            config.setFontSize(Integer.parseInt(fontSizeField.getText()));
        } catch (NumberFormatException e) {
            config.setFontSize(30);
        }
        config.setFontName((String) fontComboBox.getSelectedItem());
        config.setOpacity(opacitySlider.getValue() / 100f);
        config.setPosition((String) positionComboBox.getSelectedItem());
        config.setTile(tileCheckBox.isSelected());
    }

    private void updatePreview() {
        if (selectedImages.isEmpty() || imageList.getSelectedIndex() == -1) {
            previewLabel.setIcon(null);
            return;
        }

        updateConfigFromUI();

        try {
            File selectedFile = selectedImages.get(imageList.getSelectedIndex());
            BufferedImage sourceImage = ImageUtil.loadImage(selectedFile);
            BufferedImage watermarkedImage = ImageUtil.addWatermark(
                    sourceImage,
                    config.getWatermarkText(),
                    config.getFont(),
                    config.getColor(),
                    config.getOpacity(),
                    config.getPosition(),
                    config.isTile()
            );

            BufferedImage previewImage = ImageUtil.resizeImageForPreview(watermarkedImage, 500, 400);
            previewLabel.setIcon(new ImageIcon(previewImage));
        } catch (Exception e) {
            previewLabel.setText("预览加载失败: " + e.getMessage());
        }
    }

    private void startBatchProcessing() {
        if (selectedImages.isEmpty()) {
            JOptionPane.showMessageDialog(this, "请先导入图片！");
            return;
        }

        JFileChooser dirChooser = new JFileChooser();
        dirChooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
        dirChooser.setDialogTitle("选择输出目录");
        
        if (lastOutputDir != null && lastOutputDir.exists()) {
            dirChooser.setCurrentDirectory(lastOutputDir);
        }
        
        int result = dirChooser.showSaveDialog(this);
        if (result != JFileChooser.APPROVE_OPTION) {
            return;
        }

        File outputDir = dirChooser.getSelectedFile();
        lastOutputDir = outputDir;
        updateConfigFromUI();

        startButton.setEnabled(false);
        currentTask = new BatchTask(selectedImages, config, outputDir, progressBar, statusLabel, startButton);
        currentTask.execute();
    }

    private static class SimpleDocumentListener implements javax.swing.event.DocumentListener {
        private final Runnable onChange;

        public SimpleDocumentListener(Runnable onChange) {
            this.onChange = onChange;
        }

        @Override
        public void insertUpdate(javax.swing.event.DocumentEvent e) {
            onChange.run();
        }

        @Override
        public void removeUpdate(javax.swing.event.DocumentEvent e) {
            onChange.run();
        }

        @Override
        public void changedUpdate(javax.swing.event.DocumentEvent e) {
            onChange.run();
        }
    }
}