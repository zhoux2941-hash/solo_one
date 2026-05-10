package com.pest.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.path}")
    private String uploadPath;

    public String saveFile(MultipartFile file) throws IOException {
        LocalDate today = LocalDate.now();
        String dateStr = today.format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));

        File dir = new File(uploadPath + File.separator + dateStr);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";

        String filename = UUID.randomUUID().toString() + extension;
        File dest = new File(dir, filename);
        file.transferTo(dest);

        return "/uploads/" + dateStr + "/" + filename;
    }
}