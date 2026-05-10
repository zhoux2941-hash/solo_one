package com.pottery.simulator.controller;

import com.pottery.simulator.dto.Result;
import com.pottery.simulator.entity.ClassicPottery;
import com.pottery.simulator.service.ClassicPotteryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/classic")
public class ClassicPotteryController {

    @Autowired
    private ClassicPotteryService classicPotteryService;

    @GetMapping("/list")
    public Result<List<ClassicPottery>> list(@RequestParam(required = false) String type) {
        List<ClassicPottery> list = classicPotteryService.listByType(type);
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<ClassicPottery> getById(@PathVariable Long id) {
        ClassicPottery pottery = classicPotteryService.getById(id);
        if (pottery == null) {
            return Result.error("器型不存在");
        }
        return Result.success(pottery);
    }

}
