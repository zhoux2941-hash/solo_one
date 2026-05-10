package com.meme.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.meme.entity.Meme;
import com.meme.entity.Vote;
import com.meme.mapper.MemeMapper;
import com.meme.mapper.VoteMapper;
import com.meme.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class VoteService {

    @Autowired
    private VoteMapper voteMapper;

    @Autowired
    private MemeMapper memeMapper;

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private MemeService memeService;

    @Value("${meme.vote.daily-limit}")
    private Integer dailyLimit;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional
    public void vote(Long userId, Long memeId) {
        LocalDate today = LocalDate.now();
        String dateStr = today.format(DATE_FORMATTER);

        Meme meme = memeMapper.selectById(memeId);
        if (meme == null) {
            throw new RuntimeException("表情包不存在");
        }
        if (!"APPROVED".equals(meme.getStatus())) {
            throw new RuntimeException("该表情包不在投票池中");
        }

        String redisKey = "meme:user:votes:" + userId + ":" + dateStr;
        Object remaining = redisUtil.getRedisTemplate().opsForValue().get(redisKey);
        
        Integer userRemainingVotes;
        if (remaining == null) {
            QueryWrapper<Vote> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("user_id", userId).eq("vote_date", today);
            Long votedCount = voteMapper.selectCount(queryWrapper);
            userRemainingVotes = dailyLimit - votedCount.intValue();
            if (userRemainingVotes < 0) userRemainingVotes = 0;
            redisUtil.getRedisTemplate().opsForValue().set(redisKey, userRemainingVotes);
        } else {
            userRemainingVotes = Integer.parseInt(remaining.toString());
        }

        if (userRemainingVotes <= 0) {
            throw new RuntimeException("今日投票次数已用完");
        }

        if (redisUtil.hasVoted(userId, memeId, dateStr)) {
            throw new RuntimeException("今日已为该表情包投过票");
        }

        QueryWrapper<Vote> checkWrapper = new QueryWrapper<>();
        checkWrapper.eq("user_id", userId)
                    .eq("meme_id", memeId)
                    .eq("vote_date", today);
        if (voteMapper.selectCount(checkWrapper) > 0) {
            throw new RuntimeException("今日已为该表情包投过票");
        }

        Vote vote = new Vote();
        vote.setUserId(userId);
        vote.setMemeId(memeId);
        vote.setVoteDate(today);
        vote.setCreatedAt(LocalDateTime.now());
        voteMapper.insert(vote);

        redisUtil.getRedisTemplate().opsForValue().decrement(redisKey);
        redisUtil.markVoted(userId, memeId, dateStr);
        
        Long newVoteCount = redisUtil.incrementVoteCount(memeId);
        
        if (newVoteCount != null && newVoteCount % 10 == 0) {
            meme.setVoteCount(newVoteCount.intValue());
            meme.setUpdatedAt(LocalDateTime.now());
            memeMapper.updateById(meme);
        }
    }

    public Integer getRemainingVotes(Long userId) {
        LocalDate today = LocalDate.now();
        String dateStr = today.format(DATE_FORMATTER);
        
        String redisKey = "meme:user:votes:" + userId + ":" + dateStr;
        Object remaining = redisUtil.getRedisTemplate().opsForValue().get(redisKey);
        
        if (remaining == null) {
            QueryWrapper<Vote> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("user_id", userId).eq("vote_date", today);
            Long votedCount = voteMapper.selectCount(queryWrapper);
            Integer userRemainingVotes = dailyLimit - votedCount.intValue();
            if (userRemainingVotes < 0) userRemainingVotes = 0;
            redisUtil.getRedisTemplate().opsForValue().set(redisKey, userRemainingVotes);
            return userRemainingVotes;
        }
        
        return Integer.parseInt(remaining.toString());
    }

    public Long getVoteCount(Long memeId) {
        Long redisCount = redisUtil.getVoteCount(memeId);
        if (redisCount == null) {
            Meme meme = memeMapper.selectById(memeId);
            if (meme != null) {
                redisUtil.setVoteCount(memeId, meme.getVoteCount().longValue());
                return meme.getVoteCount().longValue();
            }
            redisUtil.setVoteCount(memeId, 0L);
            return 0L;
        }
        return redisCount;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void syncVoteCountsToDatabase() {
        List<Meme> memes = memeMapper.selectList(null);
        for (Meme meme : memes) {
            Long redisCount = redisUtil.getVoteCount(meme.getId());
            if (redisCount != null && redisCount > meme.getVoteCount()) {
                meme.setVoteCount(redisCount.intValue());
                meme.setUpdatedAt(LocalDateTime.now());
                memeMapper.updateById(meme);
            }
        }
    }
}
