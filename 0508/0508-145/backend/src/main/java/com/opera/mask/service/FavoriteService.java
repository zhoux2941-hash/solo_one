package com.opera.mask.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.opera.mask.entity.UserFavorite;

import java.util.List;

public interface FavoriteService extends IService<UserFavorite> {
    boolean toggleFavorite(Long userId, Long designId);

    boolean isFavorited(Long userId, Long designId);

    List<UserFavorite> getUserFavorites(Long userId);

    int getFavoriteCount(Long designId);
}
