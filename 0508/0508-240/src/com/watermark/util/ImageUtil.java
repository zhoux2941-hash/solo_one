package com.watermark.util;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

public class ImageUtil {

    public static BufferedImage loadImage(File file) throws IOException {
        return ImageIO.read(file);
    }

    public static void saveImage(BufferedImage image, File outputFile, String format) throws IOException {
        if (!outputFile.getParentFile().exists()) {
            outputFile.getParentFile().mkdirs();
        }
        
        BufferedImage rgbImage = image;
        if (image.getType() != BufferedImage.TYPE_INT_RGB) {
            rgbImage = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = rgbImage.createGraphics();
            g.drawImage(image, 0, 0, null);
            g.dispose();
        }
        
        boolean success = ImageIO.write(rgbImage, format, outputFile);
        if (!success) {
            success = ImageIO.write(rgbImage, "jpg", outputFile);
            if (!success) {
                throw new IOException("无法保存图片，不支持的格式: " + format);
            }
        }
    }

    public static BufferedImage addWatermark(BufferedImage sourceImage, String watermarkText, Font font, Color color,
                                           float opacity, String position, boolean tile) {
        int width = sourceImage.getWidth();
        int height = sourceImage.getHeight();

        BufferedImage watermarkedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = watermarkedImage.createGraphics();

        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, width, height);
        g2d.drawImage(sourceImage, 0, 0, width, height, null);

        g2d.setFont(font);
        g2d.setColor(color);
        g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, opacity));
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        FontMetrics metrics = g2d.getFontMetrics(font);
        int textWidth = metrics.stringWidth(watermarkText);
        int textHeight = metrics.getHeight();

        if (tile) {
            int spacing = Math.max(textWidth, textHeight) + 50;
            for (int x = -width; x < width * 2; x += spacing) {
                for (int y = -height; y < height * 2; y += spacing) {
                    g2d.drawString(watermarkText, x, y);
                }
            }
        } else {
            int x, y;
            switch (position) {
                case "TOP_LEFT":
                    x = 20;
                    y = textHeight + 20;
                    break;
                case "TOP_RIGHT":
                    x = width - textWidth - 20;
                    y = textHeight + 20;
                    break;
                case "BOTTOM_LEFT":
                    x = 20;
                    y = height - 20;
                    break;
                case "BOTTOM_RIGHT":
                    x = width - textWidth - 20;
                    y = height - 20;
                    break;
                case "CENTER":
                default:
                    x = (width - textWidth) / 2;
                    y = (height + textHeight) / 2;
                    break;
            }
            g2d.drawString(watermarkText, x, y);
        }

        g2d.dispose();
        return watermarkedImage;
    }

    public static BufferedImage resizeImageForPreview(BufferedImage originalImage, int maxWidth, int maxHeight) {
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        double scale = Math.min((double) maxWidth / width, (double) maxHeight / height);

        int newWidth = (int) (width * scale);
        int newHeight = (int) (height * scale);

        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g2d.dispose();

        return resizedImage;
    }
}