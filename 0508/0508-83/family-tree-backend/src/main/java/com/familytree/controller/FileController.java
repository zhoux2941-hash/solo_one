package com.familytree.controller;

import com.familytree.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin
public class FileController {
    @Autowired
    private FileService fileService;

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            String filePath = fileService.uploadFile(file);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "上传成功");
            result.put("data", filePath);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "上传失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
