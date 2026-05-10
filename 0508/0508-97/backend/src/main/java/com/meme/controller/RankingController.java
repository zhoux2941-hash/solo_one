package com.meme.controller;

import com.meme.common.Result;
import com.meme.entity.Meme;
import com.meme.service.MemeService;
import com.meme.vo.RankingVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ranking")
@CrossOrigin
public class RankingController {

    @Autowired
    private MemeService memeService;

    @GetMapping
    public Result<RankingVO> getRanking() {
        List<Meme> topMemes = memeService.getTopMemes(3);
        Meme magicAward = memeService.getMagicAward();
        Meme carelessAward = memeService.getCarelessAward();

        RankingVO ranking = new RankingVO();
        ranking.setTop3(topMemes);
        ranking.setMagicAward(magicAward);
        ranking.setCarelessAward(carelessAward);

        return Result.success(ranking);
    }

    @GetMapping("/top")
    public Result<List<Meme>> getTopMemes(@RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(memeService.getTopMemes(limit));
    }
}
