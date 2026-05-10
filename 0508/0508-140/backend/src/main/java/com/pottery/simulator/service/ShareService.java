package com.pottery.simulator.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pottery.simulator.entity.ShareLink;
import com.pottery.simulator.repository.ShareLinkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ShareService {

    @Autowired
    private ShareLinkRepository shareLinkRepository;

    public String createShare(Long potteryId, String potteryType, Integer validDays) {
        ShareLink shareLink = new ShareLink();
        shareLink.setShareCode(IdUtil.simpleUUID().substring(0, 8));
        shareLink.setPotteryId(potteryId);
        shareLink.setPotteryType(potteryType);
        shareLink.setViewCount(0);
        
        if (validDays != null && validDays > 0) {
            shareLink.setExpiryTime(LocalDateTime.now().plusDays(validDays));
        }
        
        shareLinkRepository.insert(shareLink);
        return shareLink.getShareCode();
    }

    public ShareLink getByShareCode(String shareCode) {
        LambdaQueryWrapper<ShareLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ShareLink::getShareCode, shareCode);
        ShareLink shareLink = shareLinkRepository.selectOne(wrapper);
        
        if (shareLink == null) {
            return null;
        }
        
        if (shareLink.getExpiryTime() != null && shareLink.getExpiryTime().isBefore(LocalDateTime.now())) {
            return null;
        }
        
        shareLink.setViewCount(shareLink.getViewCount() + 1);
        shareLinkRepository.updateById(shareLink);
        
        return shareLink;
    }

}
