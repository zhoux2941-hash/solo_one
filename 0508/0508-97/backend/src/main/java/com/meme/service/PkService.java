package com.meme.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.meme.entity.Meme;
import com.meme.entity.PkBattle;
import com.meme.mapper.MemeMapper;
import com.meme.mapper.PkBattleMapper;
import com.meme.vo.PkPairVO;
import com.meme.vo.PkResultVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class PkService {

    @Autowired
    private MemeMapper memeMapper;

    @Autowired
    private PkBattleMapper pkBattleMapper;

    @Autowired
    private MemeService memeService;

    private final Random random = new Random();

    public PkPairVO getRandomPair(String tag) {
        List<Meme> approvedMemes;
        
        if (tag != null && !tag.isEmpty()) {
            QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("status", "APPROVED")
                        .like("tags", tag);
            approvedMemes = memeMapper.selectList(queryWrapper);
        } else {
            approvedMemes = memeService.getAllApprovedMemes();
        }

        if (approvedMemes == null || approvedMemes.size() < 2) {
            throw new RuntimeException("表情包数量不足，无法进行PK");
        }

        int idx1 = random.nextInt(approvedMemes.size());
        int idx2 = random.nextInt(approvedMemes.size());
        while (idx2 == idx1 && approvedMemes.size() > 1) {
            idx2 = random.nextInt(approvedMemes.size());
        }

        Meme meme1 = approvedMemes.get(idx1);
        Meme meme2 = approvedMemes.get(idx2);

        return new PkPairVO(meme1, meme2);
    }

    @Transactional
    public PkResultVO submitPkResult(Long userId, Long meme1Id, Long meme2Id, Long winnerId) {
        if (!winnerId.equals(meme1Id) && !winnerId.equals(meme2Id)) {
            throw new RuntimeException("获胜者必须是对战的其中一方");
        }

        Meme winner = memeMapper.selectById(winnerId);
        Meme loser = winnerId.equals(meme1Id) 
            ? memeMapper.selectById(meme2Id) 
            : memeMapper.selectById(meme1Id);

        if (winner == null || loser == null) {
            throw new RuntimeException("表情包不存在");
        }

        PkBattle battle = new PkBattle();
        battle.setUserId(userId);
        battle.setMeme1Id(meme1Id);
        battle.setMeme2Id(meme2Id);
        battle.setWinnerId(winnerId);
        battle.setCreatedAt(LocalDateTime.now());
        pkBattleMapper.insert(battle);

        winner.setPkWins((winner.getPkWins() == null ? 0 : winner.getPkWins()) + 1);
        winner.setUpdatedAt(LocalDateTime.now());
        memeMapper.updateById(winner);

        loser.setPkLosses((loser.getPkLosses() == null ? 0 : loser.getPkLosses()) + 1);
        loser.setUpdatedAt(LocalDateTime.now());
        memeMapper.updateById(loser);

        PkResultVO result = new PkResultVO();
        result.setWinner(winner);
        result.setLoser(loser);
        result.setNewWinnerRate(winner.getPkRate());
        result.setNewLoserRate(loser.getPkRate());

        return result;
    }

    public List<PkBattle> getUserBattleHistory(Long userId) {
        QueryWrapper<PkBattle> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId)
                    .orderByDesc("created_at")
                    .last("LIMIT 20");
        return pkBattleMapper.selectList(queryWrapper);
    }
}
