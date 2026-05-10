package com.meme.vo;

import com.meme.entity.Meme;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PkPairVO {
    private Meme meme1;
    private Meme meme2;
}
