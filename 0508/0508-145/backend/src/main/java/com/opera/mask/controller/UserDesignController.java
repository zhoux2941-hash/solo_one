package com.opera.mask.controller;

import com.opera.mask.common.Result;
import com.opera.mask.entity.UserDesign;
import com.opera.mask.service.UserDesignService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/designs")
@RequiredArgsConstructor
public class UserDesignController {

    private final UserDesignService userDesignService;

    @PostMapping
    public Result<UserDesign> saveDesign(@RequestBody SaveDesignRequest request) {
        UserDesign design = userDesignService.saveDesign(
                request.getUserId(),
                request.getUserName(),
                request.getTemplateId(),
                request.getName(),
                request.getDescription(),
                request.getDesignData(),
                request.getPreviewImage(),
                request.getSvgContent(),
                request.getIsPublic()
        );
        return Result.success(design);
    }

    @PutMapping("/{id}")
    public Result<UserDesign> updateDesign(@PathVariable Long id, @RequestBody UpdateDesignRequest request) {
        UserDesign design = userDesignService.updateDesign(
                id,
                request.getName(),
                request.getDescription(),
                request.getDesignData(),
                request.getPreviewImage(),
                request.getSvgContent(),
                request.getIsPublic()
        );
        if (design == null) {
            return Result.error("设计不存在");
        }
        return Result.success(design);
    }

    @GetMapping("/public")
    public Result<List<UserDesign>> getPublicDesigns(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "12") Integer size) {
        return Result.success(userDesignService.getPublicDesigns(page, size));
    }

    @GetMapping("/user/{userId}")
    public Result<List<UserDesign>> getUserDesigns(@PathVariable Long userId) {
        return Result.success(userDesignService.getUserDesigns(userId));
    }

    @GetMapping("/{id}")
    public Result<UserDesign> getDesignById(@PathVariable Long id) {
        UserDesign design = userDesignService.getDesignById(id);
        if (design == null) {
            return Result.error("设计不存在");
        }
        return Result.success(design);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteDesign(
            @PathVariable Long id,
            @RequestParam Long userId) {
        userDesignService.deleteDesign(id, userId);
        return Result.success();
    }

    @lombok.Data
    public static class SaveDesignRequest {
        private Long userId;
        private String userName;
        private Long templateId;
        private String name;
        private String description;
        private String designData;
        private String previewImage;
        private String svgContent;
        private Integer isPublic;
    }

    @lombok.Data
    public static class UpdateDesignRequest {
        private String name;
        private String description;
        private String designData;
        private String previewImage;
        private String svgContent;
        private Integer isPublic;
    }
}
