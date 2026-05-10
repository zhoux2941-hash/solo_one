package com.opera.mask.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.opera.mask.entity.UserDesign;
import com.opera.mask.mapper.UserDesignMapper;
import com.opera.mask.service.UserDesignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDesignServiceImpl extends ServiceImpl<UserDesignMapper, UserDesign> implements UserDesignService {

    @Override
    public UserDesign saveDesign(Long userId, String userName, Long templateId, String name, String description,
                                 String designData, String previewImage, String svgContent, Integer isPublic) {
        UserDesign design = new UserDesign();
        design.setUserId(userId);
        design.setUserName(userName);
        design.setTemplateId(templateId);
        design.setName(name);
        design.setDescription(description);
        design.setDesignData(designData);
        design.setPreviewImage(previewImage);
        design.setSvgContent(svgContent);
        design.setIsPublic(isPublic);
        design.setLikeCount(0);
        design.setCommentCount(0);
        design.setCreateTime(LocalDateTime.now());
        design.setUpdateTime(LocalDateTime.now());
        design.setDeleted(0);
        save(design);
        return design;
    }

    @Override
    public UserDesign updateDesign(Long id, String name, String description, String designData,
                                   String previewImage, String svgContent, Integer isPublic) {
        UserDesign design = getById(id);
        if (design != null) {
            if (name != null) design.setName(name);
            if (description != null) design.setDescription(description);
            if (designData != null) design.setDesignData(designData);
            if (previewImage != null) design.setPreviewImage(previewImage);
            if (svgContent != null) design.setSvgContent(svgContent);
            if (isPublic != null) design.setIsPublic(isPublic);
            design.setUpdateTime(LocalDateTime.now());
            updateById(design);
        }
        return design;
    }

    @Override
    public List<UserDesign> getPublicDesigns(Integer page, Integer size) {
        Page<UserDesign> pageResult = page(new Page<>(page, size),
                new LambdaQueryWrapper<UserDesign>()
                        .eq(UserDesign::getIsPublic, 1)
                        .eq(UserDesign::getDeleted, 0)
                        .orderByDesc(UserDesign::getCreateTime));
        return pageResult.getRecords();
    }

    @Override
    public List<UserDesign> getUserDesigns(Long userId) {
        return list(new LambdaQueryWrapper<UserDesign>()
                .eq(UserDesign::getUserId, userId)
                .eq(UserDesign::getDeleted, 0)
                .orderByDesc(UserDesign::getCreateTime));
    }

    @Override
    public UserDesign getDesignById(Long id) {
        return getById(id);
    }

    @Override
    public void deleteDesign(Long id, Long userId) {
        UserDesign design = getById(id);
        if (design != null && design.getUserId().equals(userId)) {
            design.setDeleted(1);
            updateById(design);
        }
    }

    @Override
    public void incrementLikeCount(Long id) {
        update(new LambdaUpdateWrapper<UserDesign>()
                .eq(UserDesign::getId, id)
                .setSql("like_count = like_count + 1"));
    }

    @Override
    public void decrementLikeCount(Long id) {
        update(new LambdaUpdateWrapper<UserDesign>()
                .eq(UserDesign::getId, id)
                .setSql("like_count = GREATEST(like_count - 1, 0)"));
    }

    @Override
    public void incrementCommentCount(Long id) {
        update(new LambdaUpdateWrapper<UserDesign>()
                .eq(UserDesign::getId, id)
                .setSql("comment_count = comment_count + 1"));
    }
}
