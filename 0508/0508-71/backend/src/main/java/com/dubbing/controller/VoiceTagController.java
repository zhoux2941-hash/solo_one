package com.dubbing.controller;

import com.dubbing.common.Result;
import com.dubbing.entity.VoiceTag;
import com.dubbing.service.VoiceTagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tag")
public class VoiceTagController {

    @Autowired
    private VoiceTagService voiceTagService;

    @GetMapping("/all")
    public Result<List<VoiceTag>> getAllTags() {
        List<VoiceTag> tags = voiceTagService.getAllTags();
        return Result.success(tags);
    }

    @GetMapping("/my")
    public Result<List<VoiceTag>> getMyTags() {
        com.dubbing.entity.User currentUser = com.dubbing.util.UserContext.getCurrentUser();
        List<VoiceTag> tags = voiceTagService.getUserTags(currentUser.getId());
        return Result.success(tags);
    }

    @GetMapping("/user/{userId}")
    public Result<List<VoiceTag>> getUserTags(@PathVariable Long userId) {
        List<VoiceTag> tags = voiceTagService.getUserTags(userId);
        return Result.success(tags);
    }

    @GetMapping("/task/{taskId}")
    public Result<List<VoiceTag>> getTaskTags(@PathVariable Long taskId) {
        List<VoiceTag> tags = voiceTagService.getTaskTags(taskId);
        return Result.success(tags);
    }

    @PostMapping("/update-my")
    public Result<Void> updateMyTags(@RequestBody(required = false) List<Long> tagIds) {
        voiceTagService.updateUserTags(tagIds);
        return Result.success("标签更新成功");
    }
}
