package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileService fileService;

    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = fileService.uploadFile(file);
            return Result.success("上传成功", result);
        } catch (IOException e) {
            return Result.error("文件上传失败: " + e.getMessage());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/batch-upload")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<List<Map<String, Object>>> batchUploadFiles(@RequestParam("files") MultipartFile[] files) {
        try {
            List<Map<String, Object>> results = fileService.batchUploadFiles(files);
            return Result.success("批量上传成功", results);
        } catch (IOException e) {
            return Result.error("批量上传失败: " + e.getMessage());
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Void> deleteFile(@RequestParam("fileUrl") String fileUrl) {
        boolean success = fileService.deleteFile(fileUrl);
        if (success) {
            return Result.success("删除成功");
        }
        return Result.error("删除失败，文件不存在");
    }
}