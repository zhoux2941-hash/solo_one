package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.entity.GroupActivity;
import com.community.buying.service.GroupActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/group-activities")
public class GroupActivityController {

    @Autowired
    private GroupActivityService groupActivityService;

    @GetMapping("/public/active")
    public Result<List<GroupActivity>> getActiveActivities() {
        return Result.success(groupActivityService.findActiveActivities());
    }

    @GetMapping("/public/{id}")
    public Result<GroupActivity> getActivityDetail(@PathVariable Long id) {
        GroupActivity activity = groupActivityService.findById(id);
        if (activity != null) {
            return Result.success(activity);
        }
        return Result.error("活动不存在");
    }

    @GetMapping
    @PreAuthorize("hasAuthority('group:read')")
    public Result<List<GroupActivity>> getAllActivities() {
        return Result.success(groupActivityService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('group:write')")
    public Result<GroupActivity> createActivity(@RequestBody GroupActivity activity) {
        return Result.success("创建成功", groupActivityService.save(activity));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('group:write')")
    public Result<GroupActivity> updateActivity(@PathVariable Long id, @RequestBody GroupActivity activity) {
        activity.setId(id);
        return Result.success("更新成功", groupActivityService.save(activity));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('group:write')")
    public Result<GroupActivity> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        GroupActivity activity = groupActivityService.updateStatus(id, status);
        if (activity != null) {
            return Result.success("状态更新成功", activity);
        }
        return Result.error("活动不存在");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('group:write')")
    public Result<Void> deleteActivity(@PathVariable Long id) {
        groupActivityService.deleteById(id);
        return Result.success("删除成功");
    }

    @PostMapping("/{id}/check-completion")
    @PreAuthorize("hasAuthority('group:write')")
    public Result<Void> triggerGroupCompletionCheck(@PathVariable Long id) {
        groupActivityService.triggerGroupCompletionCheck(id);
        return Result.success("拼团状态检查已触发");
    }
}