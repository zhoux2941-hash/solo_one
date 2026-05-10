package com.pottery.simulator.controller;

import com.pottery.simulator.dto.Result;
import com.pottery.simulator.entity.ClassicPottery;
import com.pottery.simulator.entity.ShareLink;
import com.pottery.simulator.entity.UserPottery;
import com.pottery.simulator.service.ClassicPotteryService;
import com.pottery.simulator.service.ShareService;
import com.pottery.simulator.service.UserPotteryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/share")
public class ShareController {

    @Autowired
    private ShareService shareService;

    @Autowired
    private ClassicPotteryService classicPotteryService;

    @Autowired
    private UserPotteryService userPotteryService;

    @PostMapping("/create")
    public Result<String> createShare(@RequestBody Map<String, Object> params) {
        Long potteryId = Long.valueOf(params.get("potteryId").toString());
        String potteryType = params.get("potteryType").toString();
        Integer validDays = params.get("validDays") != null ? 
            Integer.valueOf(params.get("validDays").toString()) : null;
        
        String shareCode = shareService.createShare(potteryId, potteryType, validDays);
        return Result.success(shareCode);
    }

    @GetMapping("/{shareCode}")
    public Result<Map<String, Object>> getByShareCode(@PathVariable String shareCode) {
        ShareLink shareLink = shareService.getByShareCode(shareCode);
        if (shareLink == null) {
            return Result.error("分享链接无效或已过期");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("potteryType", shareLink.getPotteryType());
        
        if ("classic".equals(shareLink.getPotteryType())) {
            ClassicPottery pottery = classicPotteryService.getById(shareLink.getPotteryId());
            result.put("pottery", pottery);
        } else {
            UserPottery pottery = userPotteryService.getById(shareLink.getPotteryId());
            result.put("pottery", pottery);
        }
        
        return Result.success(result);
    }

}
