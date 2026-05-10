package com.meme.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.meme.dto.MemeUploadRequest;
import com.meme.dto.ReviewRequest;
import com.meme.entity.Meme;
import com.meme.mapper.MemeMapper;
import com.meme.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MemeService {

    @Autowired
    private MemeMapper memeMapper;

    @Autowired
    private RedisUtil redisUtil;

    @Value("${meme.upload.path}")
    private String uploadPath;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("png", "jpg", "jpeg");
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

    public Meme upload(MultipartFile file, MemeUploadRequest request, Long userId) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("请选择要上传的图片");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("图片大小不能超过2MB");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null 
                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase() 
                : "";
        
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("只支持PNG和JPG格式的图片");
        }

        Path uploadDir = Paths.get(uploadPath);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        String newFilename = UUID.randomUUID().toString() + "." + extension;
        Path filePath = uploadDir.resolve(newFilename);
        Files.copy(file.getInputStream(), filePath);

        String imageUrl = "/api/memes/images/" + newFilename;

        Meme meme = new Meme();
        meme.setUserId(userId);
        meme.setTitle(request.getTitle());
        meme.setDescription(request.getDescription());
        meme.setTags(request.getTags());
        meme.setImageUrl(imageUrl);
        meme.setStatus("PENDING");
        meme.setVoteCount(0);
        meme.setMagicScore(0);
        meme.setCarelessScore(0);
        meme.setPkWins(0);
        meme.setPkLosses(0);
        meme.setCreatedAt(LocalDateTime.now());
        meme.setUpdatedAt(LocalDateTime.now());

        memeMapper.insert(meme);

        return meme;
    }

    public Page<Meme> getPendingMemes(Integer page, Integer size) {
        Page<Meme> pageParam = new Page<>(page, size);
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "PENDING").orderByDesc("created_at");
        return memeMapper.selectPage(pageParam, queryWrapper);
    }

    public Page<Meme> getApprovedMemes(Integer page, Integer size) {
        Page<Meme> pageParam = new Page<>(page, size);
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "APPROVED").orderByDesc("vote_count");
        Page<Meme> resultPage = memeMapper.selectPage(pageParam, queryWrapper);
        
        for (Meme meme : resultPage.getRecords()) {
            Long redisCount = redisUtil.getVoteCount(meme.getId());
            if (redisCount != null && redisCount.intValue() != meme.getVoteCount()) {
                meme.setVoteCount(redisCount.intValue());
            }
        }
        
        return resultPage;
    }

    public Meme getById(Long memeId) {
        Meme meme = memeMapper.selectById(memeId);
        if (meme != null) {
            Long redisCount = redisUtil.getVoteCount(memeId);
            if (redisCount != null && redisCount.intValue() != meme.getVoteCount()) {
                meme.setVoteCount(redisCount.intValue());
            }
        }
        return meme;
    }

    public void review(Long memeId, ReviewRequest request, Long reviewerId) {
        Meme meme = memeMapper.selectById(memeId);
        if (meme == null) {
            throw new RuntimeException("表情包不存在");
        }

        if (!"APPROVED".equals(request.getStatus()) && !"REJECTED".equals(request.getStatus())) {
            throw new RuntimeException("无效的审核状态");
        }

        meme.setStatus(request.getStatus());
        meme.setReviewerId(reviewerId);
        meme.setReviewComment(request.getReviewComment());
        meme.setReviewedAt(LocalDateTime.now());
        meme.setUpdatedAt(LocalDateTime.now());

        memeMapper.updateById(meme);
    }

    public List<Meme> getTopMemes(int limit) {
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "APPROVED");
        List<Meme> memes = memeMapper.selectList(queryWrapper);
        
        for (Meme meme : memes) {
            Long redisCount = redisUtil.getVoteCount(meme.getId());
            if (redisCount != null && redisCount.intValue() != meme.getVoteCount()) {
                meme.setVoteCount(redisCount.intValue());
            }
        }
        
        memes.sort((m1, m2) -> m2.getVoteCount().compareTo(m1.getVoteCount()));
        
        if (memes.size() > limit) {
            return memes.subList(0, limit);
        }
        return memes;
    }

    public Meme getMagicAward() {
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "APPROVED")
                .orderByDesc("magic_score")
                .last("LIMIT 1");
        List<Meme> memes = memeMapper.selectList(queryWrapper);
        return memes.isEmpty() ? null : memes.get(0);
    }

    public Meme getCarelessAward() {
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "APPROVED")
                .orderByDesc("careless_score")
                .last("LIMIT 1");
        List<Meme> memes = memeMapper.selectList(queryWrapper);
        return memes.isEmpty() ? null : memes.get(0);
    }

    public void updateVoteCount(Long memeId, Integer count) {
        Meme meme = memeMapper.selectById(memeId);
        if (meme != null) {
            meme.setVoteCount(count);
            meme.setUpdatedAt(LocalDateTime.now());
            memeMapper.updateById(meme);
        }
    }

    public List<String> getAllTags() {
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "APPROVED")
                    .isNotNull("tags")
                    .ne("tags", "");
        List<Meme> memes = memeMapper.selectList(queryWrapper);

        Set<String> allTags = new HashSet<>();
        for (Meme meme : memes) {
            if (meme.getTags() != null && !meme.getTags().isEmpty()) {
                String[] tags = meme.getTags().split(",");
                for (String tag : tags) {
                    String trimmedTag = tag.trim();
                    if (!trimmedTag.isEmpty()) {
                        allTags.add(trimmedTag);
                    }
                }
            }
        }
        return allTags.stream().sorted().collect(Collectors.toList());
    }

    public Page<Meme> getByTag(String tag, Integer page, Integer size) {
        Page<Meme> pageParam = new Page<>(page, size);
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "APPROVED")
                    .like("tags", tag)
                    .orderByDesc("vote_count");
        Page<Meme> resultPage = memeMapper.selectPage(pageParam, queryWrapper);

        for (Meme meme : resultPage.getRecords()) {
            Long redisCount = redisUtil.getVoteCount(meme.getId());
            if (redisCount != null && redisCount.intValue() != meme.getVoteCount()) {
                meme.setVoteCount(redisCount.intValue());
            }
        }
        return resultPage;
    }

    public void updateTags(Long memeId, Long userId, String tags) {
        Meme meme = memeMapper.selectById(memeId);
        if (meme == null) {
            throw new RuntimeException("表情包不存在");
        }
        if (!meme.getUserId().equals(userId)) {
            throw new RuntimeException("只能更新自己的表情包标签");
        }
        meme.setTags(tags);
        meme.setUpdatedAt(LocalDateTime.now());
        memeMapper.updateById(meme);
    }

    public List<Meme> getTopPkRateMemes(int limit) {
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "APPROVED");
        List<Meme> memes = memeMapper.selectList(queryWrapper);

        for (Meme meme : memes) {
            Long redisCount = redisUtil.getVoteCount(meme.getId());
            if (redisCount != null && redisCount.intValue() != meme.getVoteCount()) {
                meme.setVoteCount(redisCount.intValue());
            }
        }

        memes.sort((m1, m2) -> {
            Double rate1 = m1.getPkRate();
            Double rate2 = m2.getPkRate();
            int total1 = (m1.getPkWins() == null ? 0 : m1.getPkWins()) + 
                         (m1.getPkLosses() == null ? 0 : m1.getPkLosses());
            int total2 = (m2.getPkWins() == null ? 0 : m2.getPkWins()) + 
                         (m2.getPkLosses() == null ? 0 : m2.getPkLosses());
            
            if (total1 == 0 && total2 == 0) return 0;
            if (total1 == 0) return 1;
            if (total2 == 0) return -1;
            
            return rate2.compareTo(rate1);
        });

        if (memes.size() > limit) {
            return memes.subList(0, limit);
        }
        return memes;
    }

    public List<Meme> getAllApprovedMemes() {
        QueryWrapper<Meme> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "APPROVED");
        return memeMapper.selectList(queryWrapper);
    }
}
