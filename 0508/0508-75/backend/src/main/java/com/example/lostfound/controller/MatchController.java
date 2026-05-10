package com.example.lostfound.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.lostfound.common.Result;
import com.example.lostfound.dto.MatchDetailVO;
import com.example.lostfound.entity.FoundItem;
import com.example.lostfound.entity.LostItem;
import com.example.lostfound.entity.MatchRecord;
import com.example.lostfound.entity.User;
import com.example.lostfound.mapper.FoundItemMapper;
import com.example.lostfound.mapper.LostItemMapper;
import com.example.lostfound.mapper.MatchRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchRecordMapper matchRecordMapper;
    private final LostItemMapper lostItemMapper;
    private final FoundItemMapper foundItemMapper;

    @GetMapping("/my-suggestions")
    public Result<List<MatchDetailVO>> mySuggestions(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "请先登录");
        }

        List<LostItem> myLost = lostItemMapper.selectList(
            new LambdaQueryWrapper<LostItem>().eq(LostItem::getUserId, user.getId())
        );
        List<FoundItem> myFound = foundItemMapper.selectList(
            new LambdaQueryWrapper<FoundItem>().eq(FoundItem::getUserId, user.getId())
        );

        List<Long> lostIds = myLost.stream().map(LostItem::getId).collect(Collectors.toList());
        List<Long> foundIds = myFound.stream().map(FoundItem::getId).collect(Collectors.toList());

        List<MatchRecord> records = new ArrayList<>();
        if (!lostIds.isEmpty()) {
            records.addAll(matchRecordMapper.selectList(
                new LambdaQueryWrapper<MatchRecord>()
                    .in(MatchRecord::getLostItemId, lostIds)
                    .eq(MatchRecord::getStatus, 0)
            ));
        }
        if (!foundIds.isEmpty()) {
            records.addAll(matchRecordMapper.selectList(
                new LambdaQueryWrapper<MatchRecord>()
                    .in(MatchRecord::getFoundItemId, foundIds)
                    .eq(MatchRecord::getStatus, 0)
            ));
        }

        List<Long> allLostIds = records.stream().map(MatchRecord::getLostItemId).distinct().collect(Collectors.toList());
        List<Long> allFoundIds = records.stream().map(MatchRecord::getFoundItemId).distinct().collect(Collectors.toList());

        Map<Long, LostItem> lostMap = allLostIds.isEmpty() ? Map.of() :
            lostItemMapper.selectBatchIds(allLostIds).stream()
                .collect(Collectors.toMap(LostItem::getId, i -> i));
        Map<Long, FoundItem> foundMap = allFoundIds.isEmpty() ? Map.of() :
            foundItemMapper.selectBatchIds(allFoundIds).stream()
                .collect(Collectors.toMap(FoundItem::getId, i -> i));

        List<MatchDetailVO> result = new ArrayList<>();
        for (MatchRecord rec : records) {
            MatchDetailVO vo = new MatchDetailVO();
            vo.setRecord(rec);
            vo.setLostItem(lostMap.get(rec.getLostItemId()));
            vo.setFoundItem(foundMap.get(rec.getFoundItemId()));
            result.add(vo);
        }

        result.sort((a, b) -> b.getRecord().getCreateTime().compareTo(a.getRecord().getCreateTime()));
        
        return Result.success(result);
    }

    @PostMapping("/confirm/{id}")
    public Result<Void> confirm(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "请先登录");
        }

        MatchRecord record = matchRecordMapper.selectById(id);
        if (record == null) {
            return Result.error("匹配记录不存在");
        }
        if (record.getStatus() != 0) {
            return Result.error("该匹配已处理");
        }

        LostItem lost = lostItemMapper.selectById(record.getLostItemId());
        FoundItem found = foundItemMapper.selectById(record.getFoundItemId());

        String role = null;
        if (lost != null && lost.getUserId().equals(user.getId())) {
            role = "LOST_USER";
        } else if (found != null && found.getUserId().equals(user.getId())) {
            role = "FOUND_USER";
        }

        if (role == null) {
            return Result.error("无权操作此匹配");
        }

        record.setStatus(1);
        record.setConfirmedBy(role);
        record.setUpdateTime(LocalDateTime.now());
        matchRecordMapper.updateById(record);

        if (lost != null) {
            lost.setStatus(1);
            lost.setUpdateTime(LocalDateTime.now());
            lostItemMapper.updateById(lost);
        }
        if (found != null) {
            found.setStatus(1);
            found.setUpdateTime(LocalDateTime.now());
            foundItemMapper.updateById(found);
        }

        matchRecordMapper.update(null,
            new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<MatchRecord>()
                .ne(MatchRecord::getId, record.getId())
                .and(w -> w
                    .eq(MatchRecord::getLostItemId, record.getLostItemId())
                    .or().eq(MatchRecord::getFoundItemId, record.getFoundItemId())
                )
                .eq(MatchRecord::getStatus, 0)
                .set(MatchRecord::getStatus, 2)
                .set(MatchRecord::getUpdateTime, LocalDateTime.now())
        );

        return Result.success();
    }

    @GetMapping("/success-cases")
    public Result<List<MatchDetailVO>> successCases(
            @RequestParam(defaultValue = "10") int limit) {
        List<MatchRecord> records = matchRecordMapper.selectList(
            new LambdaQueryWrapper<MatchRecord>()
                .eq(MatchRecord::getStatus, 1)
                .orderByDesc(MatchRecord::getUpdateTime)
                .last("LIMIT " + limit)
        );

        List<Long> lostIds = records.stream().map(MatchRecord::getLostItemId).distinct().collect(Collectors.toList());
        List<Long> foundIds = records.stream().map(MatchRecord::getFoundItemId).distinct().collect(Collectors.toList());

        Map<Long, LostItem> lostMap = lostIds.isEmpty() ? Map.of() :
            lostItemMapper.selectBatchIds(lostIds).stream()
                .collect(Collectors.toMap(LostItem::getId, i -> i));
        Map<Long, FoundItem> foundMap = foundIds.isEmpty() ? Map.of() :
            foundItemMapper.selectBatchIds(foundIds).stream()
                .collect(Collectors.toMap(FoundItem::getId, i -> i));

        List<MatchDetailVO> result = new ArrayList<>();
        for (MatchRecord rec : records) {
            MatchDetailVO vo = new MatchDetailVO();
            vo.setRecord(rec);
            vo.setLostItem(lostMap.get(rec.getLostItemId()));
            vo.setFoundItem(foundMap.get(rec.getFoundItemId()));
            result.add(vo);
        }

        return Result.success(result);
    }
}
