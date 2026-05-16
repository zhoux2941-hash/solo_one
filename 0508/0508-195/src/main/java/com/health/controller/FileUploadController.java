package com.health.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileUploadController {

    private static final String UPLOAD_DIR = "uploads";
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        if (file.isEmpty()) {
            response.put("success", false);
            response.put("message", "请选择文件");
            return ResponseEntity.badRequest().body(response);
        }

        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();

        if (!fileExtension.equals(".pdf") && !fileExtension.equals(".doc") && !fileExtension.equals(".docx")) {
            response.put("success", false);
            response.put("message", "只支持 PDF 和 Word 文档（.pdf, .doc, .docx）");
            return ResponseEntity.badRequest().body(response);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            response.put("success", false);
            response.put("message", "文件大小不能超过 50MB");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String dateFolder = new SimpleDateFormat("yyyyMMdd").format(new Date());
            Path datePath = Paths.get(UPLOAD_DIR, dateFolder);
            if (!Files.exists(datePath)) {
                Files.createDirectories(datePath);
            }

            String newFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = datePath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath);

            String fileUrl = "/api/files/view/" + dateFolder + "/" + newFilename;
            String fileType = fileExtension.equals(".pdf") ? "PDF" : "WORD";

            response.put("success", true);
            response.put("message", "上传成功");
            response.put("fileUrl", fileUrl);
            response.put("fileName", originalFilename);
            response.put("fileType", fileType);
            response.put("fileSize", file.getSize());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "文件上传失败：" + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/view/{date}/{filename}")
    public ResponseEntity<byte[]> viewFile(@PathVariable String date, @PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR, date, filename);
            File file = filePath.toFile();

            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);

            if (filename.toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.toLowerCase().endsWith(".doc")) {
                contentType = "application/msword";
            } else if (filename.toLowerCase().endsWith(".docx")) {
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .body(fileContent);

        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/delete/{date}/{filename}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String date, @PathVariable String filename) {
        Map<String, Object> response = new HashMap<>();

        try {
            Path filePath = Paths.get(UPLOAD_DIR, date, filename);
            File file = filePath.toFile();

            if (!file.exists()) {
                response.put("success", false);
                response.put("message", "文件不存在");
                return ResponseEntity.notFound().build();
            }

            Files.delete(filePath);
            response.put("success", true);
            response.put("message", "文件删除成功");

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "文件删除失败");
            return ResponseEntity.status(500).body(response);
        }
    }
}
