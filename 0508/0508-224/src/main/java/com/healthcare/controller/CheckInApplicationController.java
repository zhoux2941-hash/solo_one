package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.CheckInApplication;
import com.healthcare.service.CheckInApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkin")
public class CheckInApplicationController {
    @Autowired
    private CheckInApplicationService applicationService;

    @PostMapping
    public Result<CheckInApplication> save(@RequestBody CheckInApplication application) {
        try {
            CheckInApplication saved = applicationService.save(application);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<CheckInApplication> getById(@PathVariable Long id) {
        CheckInApplication application = applicationService.findById(id);
        return Result.success(application);
    }

    @GetMapping("/page")
    public Result<Page<CheckInApplication>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String applicationStatus,
            @RequestParam(required = false) Long orgId) {
        Page<CheckInApplication> result = applicationService.findPage(page, size, name, applicationStatus, orgId);
        return Result.success(result);
    }

    @PostMapping("/approve/{id}")
    public Result<CheckInApplication> approve(@PathVariable Long id, @RequestBody ReviewRequest request) {
        try {
            CheckInApplication result = applicationService.approve(id, request.getReviewerId(), request.getReviewOpinion());
            return Result.success("审核通过", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/reject/{id}")
    public Result<CheckInApplication> reject(@PathVariable Long id, @RequestBody ReviewRequest request) {
        try {
            CheckInApplication result = applicationService.reject(id, request.getReviewerId(), request.getReviewOpinion());
            return Result.success("审核拒绝", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/assign-bed/{id}")
    public Result<CheckInApplication> assignBed(@PathVariable Long id, @RequestBody AssignBedRequest request) {
        try {
            CheckInApplication result = applicationService.assignBed(id, request.getBedId(), request.getCaregiverId());
            return Result.success("分配成功", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/complete/{id}")
    public Result<CheckInApplication> completeCheckIn(@PathVariable Long id) {
        try {
            CheckInApplication result = applicationService.completeCheckIn(id);
            return Result.success("入住完成", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    public static class ReviewRequest {
        private Long reviewerId;
        private String reviewOpinion;

        public Long getReviewerId() {
            return reviewerId;
        }

        public void setReviewerId(Long reviewerId) {
            this.reviewerId = reviewerId;
        }

        public String getReviewOpinion() {
            return reviewOpinion;
        }

        public void setReviewOpinion(String reviewOpinion) {
            this.reviewOpinion = reviewOpinion;
        }
    }

    public static class AssignBedRequest {
        private Long bedId;
        private Long caregiverId;

        public Long getBedId() {
            return bedId;
        }

        public void setBedId(Long bedId) {
            this.bedId = bedId;
        }

        public Long getCaregiverId() {
            return caregiverId;
        }

        public void setCaregiverId(Long caregiverId) {
            this.caregiverId = caregiverId;
        }
    }
}
