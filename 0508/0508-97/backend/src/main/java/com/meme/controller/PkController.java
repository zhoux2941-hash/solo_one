package com.meme.controller;

import com.meme.common.Result;
import com.meme.dto.PkSubmitRequest;
import com.meme.entity.PkBattle;
import com.meme.service.PkService;
import com.meme.vo.PkPairVO;
import com.meme.vo.PkResultVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/pk")
@CrossOrigin
public class PkController {

    @Autowired
    private PkService pkService;

    @GetMapping("/pair")
    public Result<PkPairVO> getRandomPair(@RequestParam(required = false) String tag) {
        try {
            PkPairVO pair = pkService.getRandomPair(tag);
            return Result.success(pair);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/submit")
    public Result<PkResultVO> submitResult(
            @Valid @RequestBody PkSubmitRequest request,
            HttpServletRequest servletRequest) {
        try {
            Long userId = (Long) servletRequest.getAttribute("userId");
            PkResultVO result = pkService.submitPkResult(
                userId, 
                request.getMeme1Id(), 
                request.getMeme2Id(), 
                request.getWinnerId()
            );
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/history")
    public Result<List<PkBattle>> getHistory(HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("userId");
        return Result.success(pkService.getUserBattleHistory(userId));
    }
}
