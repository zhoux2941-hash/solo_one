package com.watermark.task;

import com.watermark.model.WatermarkConfig;
import com.watermark.util.ImageUtil;

import javax.imageio.ImageIO;
import javax.swing.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.List;

public class BatchTask extends SwingWorker<Void, Integer> {

    private List<File> imageFiles;
    private WatermarkConfig config;
    private File outputDir;
    private JProgressBar progressBar;
    private JLabel statusLabel;
    private JButton startButton;

    public BatchTask(List<File> imageFiles, WatermarkConfig config, File outputDir,
                     JProgressBar progressBar, JLabel statusLabel, JButton startButton) {
        this.imageFiles = imageFiles;
        this.config = config;
        this.outputDir = outputDir;
        this.progressBar = progressBar;
        this.statusLabel = statusLabel;
        this.startButton = startButton;
    }

    @Override
    protected Void doInBackground() throws Exception {
        int total = imageFiles.size();
        progressBar.setMaximum(total);
        progressBar.setValue(0);

        for (int i = 0; i < total; i++) {
            if (isCancelled()) {
                break;
            }

            File imageFile = imageFiles.get(i);
            statusLabel.setText("正在处理: " + imageFile.getName());

            try {
                if (!outputDir.exists()) {
                    outputDir.mkdirs();
                }

                BufferedImage sourceImage = ImageUtil.loadImage(imageFile);
                BufferedImage watermarkedImage = ImageUtil.addWatermark(
                        sourceImage,
                        config.getWatermarkText(),
                        config.getFont(),
                        config.getColor(),
                        config.getOpacity(),
                        config.getPosition(),
                        config.isTile()
                );

                String fileName = imageFile.getName();
                int dotIndex = fileName.lastIndexOf('.');
                String baseName;
                String extension;
                if (dotIndex > 0) {
                    baseName = fileName.substring(0, dotIndex);
                    extension = fileName.substring(dotIndex + 1);
                } else {
                    baseName = fileName;
                    extension = "jpg";
                }
                File outputFile = new File(outputDir, baseName + "_watermarked." + extension);

                ImageUtil.saveImage(watermarkedImage, outputFile, extension.toLowerCase());
            } catch (Exception e) {
                statusLabel.setText("处理失败: " + imageFile.getName() + " - " + e.getMessage());
                e.printStackTrace();
            }

            publish(i + 1);
        }

        return null;
    }

    @Override
    protected void process(List<Integer> chunks) {
        int latestProgress = chunks.get(chunks.size() - 1);
        progressBar.setValue(latestProgress);
    }

    @Override
    protected void done() {
        statusLabel.setText("批量处理完成！共处理 " + imageFiles.size() + " 张图片");
        startButton.setEnabled(true);
    }
}