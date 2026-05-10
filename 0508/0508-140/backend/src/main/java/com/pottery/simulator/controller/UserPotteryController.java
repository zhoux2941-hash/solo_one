package com.pottery.simulator.controller;

import com.pottery.simulator.dto.Result;
import com.pottery.simulator.entity.UserPottery;
import com.pottery.simulator.service.UserPotteryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserPotteryController {

    @Autowired
    private UserPotteryService userPotteryService;

    @PostMapping("/save")
    public Result<Long> save(@RequestBody UserPottery pottery) {
        Long id = userPotteryService.save(pottery);
        return Result.success(id);
    }

    @GetMapping("/{id}")
    public Result<UserPottery> getById(@PathVariable Long id) {
        UserPottery pottery = userPotteryService.getById(id);
        if (pottery == null) {
            return Result.error("器型不存在");
        }
        return Result.success(pottery);
    }

    @GetMapping("/list/{userId}")
    public Result<List<UserPottery>> listByUser(@PathVariable Long userId) {
        List<UserPottery> list = userPotteryService.listByUser(userId);
        return Result.success(list);
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        boolean success = userPotteryService.delete(id);
        if (!success) {
            return Result.error("删除失败");
        }
        return Result.success(true);
    }

}
