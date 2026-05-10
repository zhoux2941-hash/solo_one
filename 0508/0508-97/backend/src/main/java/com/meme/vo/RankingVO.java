package com.meme.vo;

import com.meme.entity.Meme;
import lombok.Data;

import java.util.List;

@Data
public class RankingVO {
    private List<Meme> top3;
    private Meme magicAward;
    private Meme carelessAward;
}
