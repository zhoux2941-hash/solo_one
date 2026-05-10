package com.dubbing.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dubbing.entity.Portfolio;
import com.dubbing.entity.User;
import com.dubbing.mapper.PortfolioMapper;
import com.dubbing.util.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;

@Slf4j
@Service
public class PortfolioService {

    @Autowired
    private PortfolioMapper portfolioMapper;

    @Value("${app.audio.upload-path}")
    private String uploadPath;

    @Value("${app.audio.max-size}")
    private Long maxSize;

    private static final int MAX_PORTFOLIO_COUNT = 5;

    public List<Portfolio> getUserPortfolio(Long userId) {
        return portfolioMapper.selectList(new LambdaQueryWrapper<Portfolio>()
                .eq(Portfolio::getUserId, userId)
                .orderByAsc(Portfolio::getSortOrder)
                .orderByDesc(Portfolio::getCreateTime));
    }

    @Transactional(rollbackFor = Exception.class)
    public Portfolio addPortfolio(String title, String description, MultipartFile audioFile) throws IOException {
        User currentUser = UserContext.getCurrentUser();
        if (currentUser.getRole() != 2) {
            throw new RuntimeException("只有配音员可以上传作品集");
        }

        Long count = portfolioMapper.selectCount(new LambdaQueryWrapper<Portfolio>()
                .eq(Portfolio::getUserId, currentUser.getId()));
        if (count >= MAX_PORTFOLIO_COUNT) {
            throw new RuntimeException("最多只能上传" + MAX_PORTFOLIO_COUNT + "个作品集");
        }

        if (audioFile == null || audioFile.isEmpty()) {
            throw new RuntimeException("请上传音频文件");
        }
        if (audioFile.getSize() > maxSize) {
            throw new RuntimeException("音频文件不能超过5MB");
        }

        String originalFilename = audioFile.getOriginalFilename();
        String extension = StringUtils.getFilenameExtension(originalFilename);
        if (extension == null || !extension.equalsIgnoreCase("mp3")) {
            throw new RuntimeException("只能上传mp3格式的音频文件");
        }

        String fileName = IdUtil.simpleUUID() + "." + extension;
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        File destFile = new File(uploadDir, fileName);
        audioFile.transferTo(destFile);

        Portfolio portfolio = new Portfolio();
        portfolio.setUserId(currentUser.getId());
        portfolio.setTitle(title);
        portfolio.setAudioPath(fileName);
        portfolio.setDescription(description);
        portfolio.setSortOrder(count.intValue() + 1);
        portfolioMapper.insert(portfolio);

        return portfolio;
    }

    @Transactional(rollbackFor = Exception.class)
    public void updatePortfolio(Long portfolioId, String title, String description) {
        User currentUser = UserContext.getCurrentUser();
        Portfolio portfolio = portfolioMapper.selectById(portfolioId);
        
        if (portfolio == null) {
            throw new RuntimeException("作品集不存在");
        }
        if (!portfolio.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("无权限操作此作品集");
        }

        portfolio.setTitle(title);
        portfolio.setDescription(description);
        portfolioMapper.updateById(portfolio);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deletePortfolio(Long portfolioId) {
        User currentUser = UserContext.getCurrentUser();
        Portfolio portfolio = portfolioMapper.selectById(portfolioId);
        
        if (portfolio == null) {
            throw new RuntimeException("作品集不存在");
        }
        if (!portfolio.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("无权限删除此作品集");
        }

        portfolioMapper.deleteById(portfolioId);
    }

    public Portfolio getById(Long portfolioId) {
        return portfolioMapper.selectById(portfolioId);
    }
}
