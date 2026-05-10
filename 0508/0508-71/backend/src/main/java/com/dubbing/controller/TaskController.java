package com.dubbing.controller;

import com.dubbing.common.PageResult;
import com.dubbing.common.Result;
import com.dubbing.dto.TaskPublishDTO;
import com.dubbing.service.TaskService;
import com.dubbing.vo.TaskVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/task")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/publish")
    public Result<TaskVO> publishTask(@Validated @RequestPart("task") TaskPublishDTO dto,
                                      @RequestPart(value = "exampleAudio", required = false) MultipartFile exampleAudio) throws IOException {
        TaskVO taskVO = taskService.publishTask(dto, exampleAudio);
        return Result.success("任务发布成功", taskVO);
    }

    @GetMapping("/list")
    public Result<PageResult<TaskVO>> listTasks(@RequestParam(defaultValue = "1") Long pageNum,
                                                @RequestParam(defaultValue = "10") Long pageSize,
                                                @RequestParam(required = false) Integer status,
                                                @RequestParam(required = false) String keyword,
                                                @RequestParam(required = false) List<Long> tagIds) {
        PageResult<TaskVO> pageResult = taskService.listTasks(pageNum, pageSize, status, keyword, tagIds);
        return Result.success(pageResult);
    }

    @GetMapping("/hot")
    public Result<List<TaskVO>> getHotTasks() {
        List<TaskVO> hotTasks = taskService.getHotTasks();
        return Result.success(hotTasks);
    }

    @GetMapping("/detail/{taskId}")
    public Result<TaskVO> getTaskDetail(@PathVariable Long taskId) {
        TaskVO taskVO = taskService.getTaskDetail(taskId);
        return Result.success(taskVO);
    }

    @GetMapping("/my-published")
    public Result<PageResult<TaskVO>> getMyPublishedTasks(@RequestParam(defaultValue = "1") Long pageNum,
                                                          @RequestParam(defaultValue = "10") Long pageSize) {
        PageResult<TaskVO> pageResult = taskService.getMyPublishedTasks(pageNum, pageSize);
        return Result.success(pageResult);
    }

    @PostMapping("/select-winner")
    public Result<Void> selectWinner(@RequestParam Long taskId, @RequestParam Long auditionId) {
        taskService.selectWinner(taskId, auditionId);
        return Result.success();
    }
}
