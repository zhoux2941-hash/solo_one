package com.community.buying.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class FileService {

    @Value("${file.upload.path:./uploads}")
    private String uploadPath;

    @Value("${file.upload.max-size:10485760}")
    private Long maxFileSize;

    @Value("${file.upload.allowed-types:image/jpeg,image/png,image/gif,image/webp}")
    private String allowedTypes;

    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }

        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("文件大小超出限制，最大为 " + (maxFileSize / 1024 / 1024) + "MB");
        }

        String contentType = file.getContentType();
        List<String> allowedTypeList = Arrays.asList(allowedTypes.split(","));
        if (contentType == null || !allowedTypeList.contains(contentType)) {
            throw new RuntimeException("不支持的文件类型，仅支持: " + allowedTypes);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";

        String dateFolder = new SimpleDateFormat("yyyy/MM/dd").format(new Date());
        Path targetPath = Paths.get(uploadPath, dateFolder);
        if (!Files.exists(targetPath)) {
            Files.createDirectories(targetPath);
        }

        String newFilename = UUID.randomUUID().toString().replace("-", "") + extension;
        Path filePath = targetPath.resolve(newFilename);
        Files.copy(file.getInputStream(), filePath);

        String fileUrl = "/uploads/" + dateFolder + "/" + newFilename;

        Map<String, Object> result = new HashMap<>();
        result.put("filename", newFilename);
        result.put("originalFilename", originalFilename);
        result.put("fileUrl", fileUrl);
        result.put("filePath", filePath.toString());
        result.put("size", file.getSize());
        result.put("contentType", contentType);

        return result;
    }

    public List<Map<String, Object>> batchUploadFiles(MultipartFile[] files) throws IOException {
        List<Map<String, Object>> results = new ArrayList<>();
        for (MultipartFile file : files) {
            results.add(uploadFile(file));
        }
        return results;
    }

    public boolean deleteFile(String fileUrl) {
        try {
            if (fileUrl.startsWith("/uploads/")) {
                String relativePath = fileUrl.substring(9);
                Path filePath = Paths.get(uploadPath, relativePath);
                return Files.deleteIfExists(filePath);
            }
            return false;
        } catch (IOException e) {
            return false;
        }
    }
}