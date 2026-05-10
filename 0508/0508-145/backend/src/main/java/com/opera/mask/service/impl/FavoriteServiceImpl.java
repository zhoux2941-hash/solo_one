package com.opera.mask.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.opera.mask.entity.UserFavorite;
import com.opera.mask.mapper.UserFavoriteMapper;
import com.opera.mask.service.FavoriteService;
import com.opera.mask.service.UserDesignService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl extends ServiceImpl<UserFavoriteMapper, UserFavorite> implements FavoriteService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserDesignService userDesignService;

    private static final String FAVORITE_KEY_PREFIX = "favorite:";

    @Override
    public boolean toggleFavorite(Long userId, Long designId) {
        String key = FAVORITE_KEY_PREFIX + userId + ":" + designId;
        Boolean cached = (Boolean) redisTemplate.opsForValue().get(key);

        if (Boolean.TRUE.equals(cached) || isFavoritedInDb(userId, designId)) {
            remove(new LambdaQueryWrapper<UserFavorite>()
                    .eq(UserFavorite::getUserId, userId)
                    .eq(UserFavorite::getDesignId, designId));
            redisTemplate.delete(key);
            userDesignService.decrementLikeCount(designId);
            return false;
        } else {
            UserFavorite favorite = new UserFavorite();
            favorite.setUserId(userId);
            favorite.setDesignId(designId);
            favorite.setCreateTime(LocalDateTime.now());
            save(favorite);
            redisTemplate.opsForValue().set(key, true, 1, TimeUnit.HOURS);
            userDesignService.incrementLikeCount(designId);
            return true;
        }
    }

    @Override
    public boolean isFavorited(Long userId, Long designId) {
        String key = FAVORITE_KEY_PREFIX + userId + ":" + designId;
        Boolean cached = (Boolean) redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return cached;
        }
        boolean result = isFavoritedInDb(userId, designId);
        redisTemplate.opsForValue().set(key, result, 1, TimeUnit.HOURS);
        return result;
    }

    private boolean isFavoritedInDb(Long userId, Long designId) {
        return count(new LambdaQueryWrapper<UserFavorite>()
                .eq(UserFavorite::getUserId, userId)
                .eq(UserFavorite::getDesignId, designId)) > 0;
    }

    @Override
    public List<UserFavorite> getUserFavorites(Long userId) {
        return list(new LambdaQueryWrapper<UserFavorite>()
                .eq(UserFavorite::getUserId, userId)
                .orderByDesc(UserFavorite::getCreateTime));
    }

    @Override
    public int getFavoriteCount(Long designId) {
        return Math.toIntExact(count(new LambdaQueryWrapper<UserFavorite>()
                .eq(UserFavorite::getDesignId, designId)));
    }
}
