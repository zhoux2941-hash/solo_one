package com.community.platform.controller;

import com.community.platform.dto.ApplicationRequest;
import com.community.platform.dto.PageResult;
import com.community.platform.dto.Result;
import com.community.platform.dto.SubmissionRequest;
import com.community.platform.dto.TaskRequest;
import com.community.platform.entity.Task;
import com.community.platform.entity.TaskApplication;
import com.community.platform.entity.TaskSubmission;
import com.community.platform.entity.Transaction;
import com.community.platform.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/publish")
    public Result<Task> publishTask(@RequestBody TaskRequest request) {
        try {
            Task task = taskService.publishTask(request);
            return Result.success("发布成功", task);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/published")
    public Result<List<Task>> getPublishedTasks() {
        return Result.success(taskService.getPublishedTasks());
    }

    @GetMapping("/published/page")
    public Result<PageResult<Task>> getPublishedTasksPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success(taskService.getPublishedTasks(page, size));
    }

    @GetMapping("/publisher/{publisherId}")
    public Result<List<Task>> getTasksByPublisher(@PathVariable Long publisherId) {
        return Result.success(taskService.getTasksByPublisher(publisherId));
    }

    @GetMapping("/publisher/{publisherId}/page")
    public Result<PageResult<Task>> getTasksByPublisherPage(
            @PathVariable Long publisherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success(taskService.getTasksByPublisher(publisherId, page, size));
    }

    @GetMapping("/accepter/{accepterId}")
    public Result<List<Task>> getTasksByAccepter(@PathVariable Long accepterId) {
        return Result.success(taskService.getTasksByAccepter(accepterId));
    }

    @GetMapping("/accepter/{accepterId}/page")
    public Result<PageResult<Task>> getTasksByAccepterPage(
            @PathVariable Long accepterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success(taskService.getTasksByAccepter(accepterId, page, size));
    }

    @GetMapping("/{taskId}")
    public Result<Task> getTaskById(@PathVariable Long taskId) {
        try {
            Task task = taskService.getTaskById(taskId);
            return Result.success(task);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/apply")
    public Result<TaskApplication> applyTask(@RequestBody ApplicationRequest request) {
        try {
            TaskApplication application = taskService.applyTask(request);
            return Result.success("申请成功", application);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{taskId}/applications")
    public Result<List<TaskApplication>> getTaskApplications(@PathVariable Long taskId) {
        return Result.success(taskService.getTaskApplications(taskId));
    }

    @PostMapping("/applications/{applicationId}/accept")
    public Result<Task> acceptApplication(@PathVariable Long applicationId) {
        try {
            Task task = taskService.acceptApplication(applicationId);
            return Result.success("已接受申请", task);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/submit")
    public Result<TaskSubmission> submitTask(@RequestBody SubmissionRequest request) {
        try {
            TaskSubmission submission = taskService.submitTask(request);
            return Result.success("提交成功", submission);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{taskId}/submission")
    public Result<TaskSubmission> getSubmissionByTaskId(@PathVariable Long taskId) {
        return Result.success(taskService.getSubmissionByTaskId(taskId));
    }

    @PostMapping("/submissions/{submissionId}/confirm")
    public Result<Task> confirmSubmission(@PathVariable Long submissionId) {
        try {
            Task task = taskService.confirmSubmission(submissionId);
            return Result.success("已确认完成", task);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/transactions/{userId}")
    public Result<List<Transaction>> getUserTransactions(@PathVariable Long userId) {
        return Result.success(taskService.getUserTransactions(userId));
    }

    @GetMapping("/transactions/{userId}/page")
    public Result<PageResult<Transaction>> getUserTransactionsPage(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success(taskService.getUserTransactions(userId, page, size));
    }
}
