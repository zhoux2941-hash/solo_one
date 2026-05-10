package com.opera.mask.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.opera.mask.entity.UserDesign;

import java.util.List;

public interface UserDesignService extends IService<UserDesign> {
    UserDesign saveDesign(Long userId, String userName, Long templateId, String name, String description,
                          String designData, String previewImage, String svgContent, Integer isPublic);

    UserDesign updateDesign(Long id, String name, String description, String designData,
                            String previewImage, String svgContent, Integer isPublic);

    List<UserDesign> getPublicDesigns(Integer page, Integer size);

    List<UserDesign> getUserDesigns(Long userId);

    UserDesign getDesignById(Long id);

    void deleteDesign(Long id, Long userId);

    void incrementLikeCount(Long id);

    void decrementLikeCount(Long id);

    void incrementCommentCount(Long id);
}
