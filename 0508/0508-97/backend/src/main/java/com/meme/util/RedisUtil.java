package com.meme.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisUtil {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String VOTE_COUNT_KEY = "meme:vote:count:";
    private static final String USER_VOTES_KEY = "meme:user:votes:";
    private static final String VOTED_MEME_KEY = "meme:voted:meme:";

    public Long getVoteCount(Long memeId) {
        Object count = redisTemplate.opsForValue().get(VOTE_COUNT_KEY + memeId);
        return count != null ? Long.parseLong(count.toString()) : null;
    }

    public Long incrementVoteCount(Long memeId) {
        return redisTemplate.opsForValue().increment(VOTE_COUNT_KEY + memeId);
    }

    public void setVoteCount(Long memeId, Long count) {
        redisTemplate.opsForValue().set(VOTE_COUNT_KEY + memeId, count);
    }

    public Integer getUserRemainingVotes(Long userId, String date) {
        Object votes = redisTemplate.opsForValue().get(USER_VOTES_KEY + userId + ":" + date);
        if (votes == null) {
            return 10;
        }
        return Integer.parseInt(votes.toString());
    }

    public boolean consumeUserVote(Long userId, String date) {
        String key = USER_VOTES_KEY + userId + ":" + date;
        Long remaining = redisTemplate.opsForValue().decrement(key);
        if (remaining == null || remaining < 0) {
            redisTemplate.opsForValue().set(key, 0);
            return false;
        }
        return true;
    }

    public void initUserVotes(Long userId, String date) {
        String key = USER_VOTES_KEY + userId + ":" + date;
        redisTemplate.opsForValue().set(key, 10, 24, TimeUnit.HOURS);
    }

    public boolean hasVoted(Long userId, Long memeId, String date) {
        String key = VOTED_MEME_KEY + userId + ":" + date;
        Boolean hasVoted = redisTemplate.opsForSet().isMember(key, memeId.toString());
        return hasVoted != null && hasVoted;
    }

    public void markVoted(Long userId, Long memeId, String date) {
        String key = VOTED_MEME_KEY + userId + ":" + date;
        redisTemplate.opsForSet().add(key, memeId.toString());
        redisTemplate.expire(key, 24, TimeUnit.HOURS);
    }

    public RedisTemplate<String, Object> getRedisTemplate() {
        return redisTemplate;
    }
}
