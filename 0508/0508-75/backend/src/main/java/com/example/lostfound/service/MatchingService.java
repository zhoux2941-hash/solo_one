package com.example.lostfound.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.lostfound.entity.FoundItem;
import com.example.lostfound.entity.LostItem;
import com.example.lostfound.entity.MatchRecord;
import com.example.lostfound.entity.Message;
import com.example.lostfound.entity.User;
import com.example.lostfound.mapper.FoundItemMapper;
import com.example.lostfound.mapper.LostItemMapper;
import com.example.lostfound.mapper.MatchRecordMapper;
import com.example.lostfound.mapper.MessageMapper;
import com.example.lostfound.mapper.UserMapper;
import com.example.lostfound.util.TextSimilarityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class MatchingService {

    @Value("${match.threshold:0.8}")
    private double matchThreshold;

    private final LostItemMapper lostItemMapper;
    private final FoundItemMapper foundItemMapper;
    private final MatchRecordMapper matchRecordMapper;
    private final MessageMapper messageMapper;
    private final UserMapper userMapper;

    @Transactional
    public void runDailyMatching() {
        log.info("开始执行每日自动匹配任务，时间: {}", LocalDateTime.now());
        
        List<LostItem> pendingLostItems = lostItemMapper.selectList(
            new LambdaQueryWrapper<LostItem>()
                .eq(LostItem::getStatus, 0)
        );

        List<FoundItem> pendingFoundItems = foundItemMapper.selectList(
            new LambdaQueryWrapper<FoundItem>()
                .eq(FoundItem::getStatus, 0)
        );

        log.info("待匹配失物数量: {}, 待匹配拾物数量: {}", 
                 pendingLostItems.size(), pendingFoundItems.size());

        for (LostItem lost : pendingLostItems) {
            for (FoundItem found : pendingFoundItems) {
                double score = calculateMatchScore(lost, found);
                
                if (score >= matchThreshold) {
                    log.info("发现匹配！失物: {}, 拾物: {}, 匹配度: {}",
                             lost.getItemName(), found.getItemName(), score);
                    
                    boolean exists = matchRecordMapper.exists(
                        new LambdaQueryWrapper<MatchRecord>()
                            .eq(MatchRecord::getLostItemId, lost.getId())
                            .eq(MatchRecord::getFoundItemId, found.getId())
                            .in(MatchRecord::getStatus, 0, 1)
                    );
                    
                    if (!exists) {
                        createMatchRecord(lost, found, score);
                        sendMatchMessages(lost, found, score);
                    }
                }
            }
        }

        log.info("每日自动匹配任务完成");
    }

    private double calculateMatchScore(LostItem lost, FoundItem found) {
        double nameScore = TextSimilarityUtil.combinedSimilarity(
            lost.getItemName(), found.getItemName()
        );
        double locationScore = TextSimilarityUtil.combinedSimilarity(
            lost.getLocation(), found.getLocation()
        );

        double finalScore = nameScore * 0.7 + locationScore * 0.3;
        
        log.debug("匹配计算 - 名称: {} vs {} = {}; 地点: {} vs {} = {}; 最终: {}",
                  lost.getItemName(), found.getItemName(), nameScore,
                  lost.getLocation(), found.getLocation(), locationScore,
                  finalScore);
        
        return finalScore;
    }

    private void createMatchRecord(LostItem lost, FoundItem found, double score) {
        MatchRecord record = new MatchRecord();
        record.setLostItemId(lost.getId());
        record.setFoundItemId(found.getId());
        record.setMatchScore(BigDecimal.valueOf(score));
        record.setStatus(0);
        record.setCreateTime(LocalDateTime.now());
        record.setUpdateTime(LocalDateTime.now());
        matchRecordMapper.insert(record);
    }

    private void sendMatchMessages(LostItem lost, FoundItem found, double score) {
        User lostUser = userMapper.selectById(lost.getUserId());
        User foundUser = userMapper.selectById(found.getUserId());
        
        if (lostUser != null) {
            Message lostMsg = new Message();
            lostMsg.setReceiverId(lost.getUserId());
            lostMsg.setTitle("系统找到可能匹配的物品！");
            lostMsg.setContent(String.format(
                "您丢失的「%s」可能被找到！物品名称「%s」，捡到地点「%s」，匹配度 %.0f%%。请前往匹配建议确认。",
                lost.getItemName(), found.getItemName(), found.getLocation(), score * 100
            ));
            lostMsg.setIsRead(0);
            lostMsg.setCreateTime(LocalDateTime.now());
            messageMapper.insert(lostMsg);
        }

        if (foundUser != null) {
            Message foundMsg = new Message();
            foundMsg.setReceiverId(found.getUserId());
            foundMsg.setTitle("您捡到的物品可能找到失主了！");
            foundMsg.setContent(String.format(
                "您捡到的「%s」可能找到了失主！失物名称「%s」，丢失地点「%s」，匹配度 %.0f%%。请前往匹配建议确认。",
                found.getItemName(), lost.getItemName(), lost.getLocation(), score * 100
            ));
            foundMsg.setIsRead(0);
            foundMsg.setCreateTime(LocalDateTime.now());
            messageMapper.insert(foundMsg);
        }
    }
}
