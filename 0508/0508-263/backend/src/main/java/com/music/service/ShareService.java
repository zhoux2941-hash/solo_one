package com.music.service;

import com.music.dto.ApiResponse;
import com.music.entity.ShareLink;
import com.music.entity.User;
import com.music.repository.ShareLinkRepository;
import com.music.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ShareService {

    public static final int EXPIRE_1_HOUR = 1;
    public static final int EXPIRE_1_DAY = 24;
    public static final int EXPIRE_7_DAYS = 168;
    public static final int EXPIRE_30_DAYS = 720;
    public static final int EXPIRE_NEVER = -1;

    @Autowired
    private ShareLinkRepository shareLinkRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ApiResponse<String> createShareLink(Long userId, String targetType, Long targetId, Integer expireHours) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("用户不存在");
        }

        String shareCode = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        ShareLink shareLink = new ShareLink();
        shareLink.setShareCode(shareCode);
        shareLink.setTargetType(targetType);
        shareLink.setTargetId(targetId);
        shareLink.setUser(user);

        if (expireHours == null || expireHours == EXPIRE_NEVER) {
            shareLink.setExpireAt(null);
        } else {
            shareLink.setExpireAt(LocalDateTime.now().plusHours(expireHours));
        }

        shareLinkRepository.save(shareLink);

        return ApiResponse.success("创建成功", shareCode);
    }

    @Transactional
    public ApiResponse<ShareLink> getShareTarget(String shareCode) {
        ShareLink shareLink = shareLinkRepository.findByShareCode(shareCode).orElse(null);
        if (shareLink == null) {
            return ApiResponse.error("分享链接不存在");
        }

        if (shareLink.getExpireAt() != null && LocalDateTime.now().isAfter(shareLink.getExpireAt())) {
            return ApiResponse.error("分享链接已过期");
        }

        shareLink.setAccessCount(shareLink.getAccessCount() + 1);
        shareLinkRepository.save(shareLink);

        return ApiResponse.success(shareLink);
    }

    @Transactional
    public ApiResponse<List<ShareLink>> getUserShareLinks(Long userId) {
        List<ShareLink> links = shareLinkRepository.findByUserId(userId);
        return ApiResponse.success(links);
    }

    @Transactional
    public ApiResponse<String> deleteShareLink(Long userId, Long shareId) {
        ShareLink shareLink = shareLinkRepository.findById(shareId).orElse(null);
        if (shareLink == null) {
            return ApiResponse.error("分享链接不存在");
        }

        if (!shareLink.getUser().getId().equals(userId)) {
            return ApiResponse.error("无权删除此分享链接");
        }

        shareLinkRepository.delete(shareLink);
        return ApiResponse.success("删除成功", null);
    }

    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void cleanupExpiredLinks() {
        List<ShareLink> expiredLinks = shareLinkRepository.findExpiredLinks(LocalDateTime.now());
        shareLinkRepository.deleteAll(expiredLinks);
        System.out.println("Cleaned up " + expiredLinks.size() + " expired share links");
    }
}
