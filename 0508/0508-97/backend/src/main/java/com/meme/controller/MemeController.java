package com.meme.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.meme.common.Result;
import com.meme.dto.MemeUploadRequest;
import com.meme.entity.Meme;
import com.meme.service.MemeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/memes")
@CrossOrigin
public class MemeController {

    @Autowired
    private MemeService memeService;

    @Value("${meme.upload.path}")
    private String uploadPath;

    @PostMapping("/upload")
    public Result<Meme> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "tags", required = false) String tags,
            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            MemeUploadRequest uploadRequest = new MemeUploadRequest();
            uploadRequest.setTitle(title);
            uploadRequest.setDescription(description);
            uploadRequest.setTags(tags);

            Meme meme = memeService.upload(file, uploadRequest, userId);
            return Result.success(meme);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        } catch (IOException e) {
            return Result.error("文件上传失败");
        }
    }

    @GetMapping("/approved")
    public Result<Page<Meme>> getApprovedMemes(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String tag) {
        if (tag != null && !tag.isEmpty()) {
            return Result.success(memeService.getByTag(tag, page, size));
        }
        return Result.success(memeService.getApprovedMemes(page, size));
    }

    @GetMapping("/{id}")
    public Result<Meme> getById(@PathVariable Long id) {
        Meme meme = memeService.getById(id);
        if (meme == null) {
            return Result.error("表情包不存在");
        }
        return Result.success(meme);
    }

    @GetMapping("/tags")
    public Result<java.util.List<String>> getAllTags() {
        return Result.success(memeService.getAllTags());
    }

    @PutMapping("/{id}/tags")
    public Result<Void> updateTags(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            String tags = body.get("tags");
            memeService.updateTags(id, userId, tags);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/pk-ranking")
    public Result<java.util.List<Meme>> getPkRanking(@RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(memeService.getTopPkRateMemes(limit));
    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadPath).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = filename.endsWith(".png") 
                        ? MediaType.IMAGE_PNG_VALUE 
                        : MediaType.IMAGE_JPEG_VALUE;
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
