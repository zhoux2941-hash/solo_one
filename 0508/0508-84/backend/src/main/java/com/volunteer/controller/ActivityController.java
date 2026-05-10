package com.volunteer.controller;

import com.volunteer.config.CommonResult;
import com.volunteer.entity.Activity;
import com.volunteer.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @GetMapping
    public CommonResult<List<Activity>> listActive() {
        return CommonResult.success(activityService.findActive());
    }

    @GetMapping("/all")
    public CommonResult<List<Activity>> listAll() {
        return CommonResult.success(activityService.findAll());
    }

    @GetMapping("/{id}")
    public CommonResult<Activity> getById(@PathVariable Long id) {
        Optional<Activity> activityOpt = activityService.findById(id);
        if (activityOpt.isPresent()) {
            return CommonResult.success(activityOpt.get());
        }
        return CommonResult.error("活动不存在");
    }

    @PostMapping
    public CommonResult<Activity> create(@RequestBody Activity activity) {
        try {
            Activity created = activityService.create(activity);
            return CommonResult.success("活动创建成功", created);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public CommonResult<Activity> update(@PathVariable Long id, @RequestBody Activity activity) {
        activity.setId(id);
        Activity updated = activityService.update(activity);
        return CommonResult.success("活动更新成功", updated);
    }

    @DeleteMapping("/{id}")
    public CommonResult<Void> delete(@PathVariable Long id) {
        activityService.delete(id);
        return CommonResult.success("活动已关闭", null);
    }
}
