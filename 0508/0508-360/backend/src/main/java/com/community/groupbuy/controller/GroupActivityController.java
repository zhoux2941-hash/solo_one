package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.entity.GroupActivity;
import com.community.groupbuy.service.GroupActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
public class GroupActivityController {

    @Autowired
    private GroupActivityService activityService;

    @PostMapping
    public Result<GroupActivity> create(@RequestBody GroupActivity activity) {
        return Result.success(activityService.create(activity));
    }

    @PutMapping
    public Result<GroupActivity> update(@RequestBody GroupActivity activity) {
        return Result.success(activityService.update(activity));
    }

    @GetMapping("/leader/{leaderId}")
    public Result<List<GroupActivity>> getByLeaderId(@PathVariable Long leaderId) {
        return Result.success(activityService.getByLeaderId(leaderId));
    }

    @GetMapping("/active")
    public Result<List<GroupActivity>> getActive() {
        return Result.success(activityService.getActive());
    }

    @GetMapping("/{id}")
    public Result<GroupActivity> getById(@PathVariable Long id) {
        return Result.success(activityService.getById(id));
    }

    @PostMapping("/{id}/end")
    public Result<Void> endActivity(@PathVariable Long id) {
        activityService.endActivity(id);
        return Result.success();
    }
}
