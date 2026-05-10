package com.meme.vo;

import com.meme.entity.Meme;
import lombok.Data;

@Data
public class PkResultVO {
    private Meme winner;
    private Meme loser;
    private Double newWinnerRate;
    private Double newLoserRate;
}
