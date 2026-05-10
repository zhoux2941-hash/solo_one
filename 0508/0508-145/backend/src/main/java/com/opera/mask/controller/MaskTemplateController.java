package com.opera.mask.controller;

import com.opera.mask.common.Result;
import com.opera.mask.entity.MaskTemplate;
import com.opera.mask.service.MaskTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class MaskTemplateController {

    private final MaskTemplateService maskTemplateService;

    @GetMapping("/default")
    public Result<List<MaskTemplate>> getDefaultTemplates() {
        return Result.success(maskTemplateService.getDefaultTemplates());
    }

    @GetMapping("/{id}")
    public Result<MaskTemplate> getTemplateById(@PathVariable Long id) {
        MaskTemplate template = maskTemplateService.getTemplateById(id);
        if (template == null) {
            return Result.error("模板不存在");
        }
        return Result.success(template);
    }

    @PostMapping("/upload")
    public Result<MaskTemplate> uploadCustomTemplate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "regions", required = false) String regions,
            @RequestParam(value = "userId", defaultValue = "1") Long userId) {
        try {
            String svgContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            MaskTemplate template = maskTemplateService.uploadCustomTemplate(
                    svgContent, name, description, regions, userId);
            return Result.success(template);
        } catch (Exception e) {
            return Result.error("上传失败: " + e.getMessage());
        }
    }
}
