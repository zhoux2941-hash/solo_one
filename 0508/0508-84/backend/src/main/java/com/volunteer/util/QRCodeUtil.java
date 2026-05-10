package com.volunteer.util;

import com.google.zxing.*;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class QRCodeUtil {

    public static String generateQRCodeBase64(String content) throws IOException, WriterException {
        return generateQRCodeBase64(content, 300, 300);
    }

    public static String generateQRCodeBase64(String content, int width, int height) throws IOException, WriterException {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);
        
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height, hints);
        
        BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        BufferedImage finalImage = new BufferedImage(width + 40, height + 80, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = finalImage.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, finalImage.getWidth(), finalImage.getHeight());
        
        graphics.drawImage(image, 20, 20, null);
        
        graphics.setColor(Color.BLACK);
        Font font = new Font("微软雅黑", Font.PLAIN, 12);
        graphics.setFont(font);
        FontMetrics metrics = graphics.getFontMetrics(font);
        int textWidth = metrics.stringWidth(content);
        int x = (finalImage.getWidth() - textWidth) / 2;
        graphics.drawString(content.length() > 30 ? content.substring(0, 30) + "..." : content, x, height + 50);
        
        graphics.dispose();
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(finalImage, "PNG", baos);
        byte[] imageBytes = baos.toByteArray();
        
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
    }

    public static String generateActivityQRCode(Long activityId, String activityName, String baseUrl) throws IOException, WriterException {
        String qrContent = baseUrl + "?activityId=" + activityId;
        String base64 = generateQRCodeBase64(qrContent, 350, 350);
        return base64;
    }
}
