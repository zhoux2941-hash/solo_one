package com.example.chemical.controller;

import com.example.chemical.dto.ApplicationRequest;
import com.example.chemical.dto.Result;
import com.example.chemical.dto.ReturnRequest;
import com.example.chemical.dto.ReviewRequest;
import com.example.chemical.entity.Application;
import com.example.chemical.entity.User;
import com.example.chemical.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @PostMapping
    public Result<Application> createApplication(@RequestBody ApplicationRequest request, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.LAB_TECHNICIAN) {
            return Result.error(403, "Only lab technicians can create applications");
        }
        try {
            Application application = applicationService.createApplication(user, request);
            return Result.success(application);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/my")
    public Result<List<Application>> getMyApplications(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.LAB_TECHNICIAN) {
            return Result.error(403, "Only lab technicians can view their applications");
        }
        List<Application> applications = applicationService.getApplicationsByApplicant(user.getId());
        return Result.success(applications);
    }

    @GetMapping("/pending-first-review")
    public Result<List<Application>> getPendingFirstReview(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.SAFETY_OFFICER) {
            return Result.error(403, "Only safety officers can view pending first reviews");
        }
        List<Application> applications = applicationService.getPendingFirstReviewApplications();
        return Result.success(applications);
    }

    @GetMapping("/pending-second-review")
    public Result<List<Application>> getPendingSecondReview(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.DIRECTOR) {
            return Result.error(403, "Only directors can view pending second reviews");
        }
        List<Application> applications = applicationService.getPendingSecondReviewApplications();
        return Result.success(applications);
    }

    @GetMapping("/overdue")
    public Result<List<Application>> getOverdueApplications(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.DIRECTOR && user.getRole() != User.Role.SAFETY_OFFICER) {
            return Result.error(403, "Only directors or safety officers can view overdue applications");
        }
        List<Application> applications = applicationService.getOverdueApplications();
        return Result.success(applications);
    }

    @PostMapping("/first-review")
    public Result<Application> firstReview(@RequestBody ReviewRequest request, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.SAFETY_OFFICER) {
            return Result.error(403, "Only safety officers can do first review");
        }
        try {
            Application application = applicationService.firstReview(
                    request.getApplicationId(), user, request.isApproved(), request.getComment());
            return Result.success(application);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/second-review")
    public Result<Application> secondReview(@RequestBody ReviewRequest request, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.DIRECTOR) {
            return Result.error(403, "Only directors can do second review");
        }
        try {
            Application application = applicationService.secondReview(
                    request.getApplicationId(), user, request.isApproved(), request.getComment());
            return Result.success(application);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/return")
    public Result<Application> returnChemical(@RequestBody ReturnRequest request, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        if (user.getRole() != User.Role.LAB_TECHNICIAN) {
            return Result.error(403, "Only lab technicians can return chemicals");
        }
        try {
            Application application = applicationService.returnChemical(
                    request.getApplicationId(), user, request.getOverdueReason());
            return Result.success(application);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public Result<Application> getApplicationById(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        return applicationService.getApplicationById(id)
                .map(Result::success)
                .orElse(Result.error("Application not found"));
    }

    @GetMapping("/{id}/remaining-time")
    public Result<Map<String, Object>> getRemainingTime(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return Result.error(401, "Not logged in");
        }
        Long remainingMinutes = applicationService.getRemainingTime(id);
        Map<String, Object> result = new HashMap<>();
        result.put("remainingMinutes", remainingMinutes);
        return Result.success(result);
    }
}
