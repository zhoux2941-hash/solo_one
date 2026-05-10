package com.dubbing.controller;

import com.dubbing.common.Result;
import com.dubbing.service.AuditionService;
import com.dubbing.vo.AuditionVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/audition")
public class AuditionController {

    @Autowired
    private AuditionService auditionService;

    @PostMapping("/submit")
    public Result<AuditionVO> submitAudition(@RequestParam Long taskId,
                                             @RequestParam(required = false) String remark,
                                             @RequestParam("audioFile") MultipartFile audioFile) throws IOException {
        AuditionVO auditionVO = auditionService.submitAudition(taskId, remark, audioFile);
        return Result.success("试音提交成功", auditionVO);
    }

    @GetMapping("/task/{taskId}")
    public Result<List<AuditionVO>> getTaskAuditions(@PathVariable Long taskId) {
        List<AuditionVO> auditions = auditionService.getTaskAuditions(taskId);
        return Result.success(auditions);
    }

    @GetMapping("/my")
    public Result<List<AuditionVO>> getMyAuditions() {
        List<AuditionVO> auditions = auditionService.getMyAuditions();
        return Result.success(auditions);
    }
}
