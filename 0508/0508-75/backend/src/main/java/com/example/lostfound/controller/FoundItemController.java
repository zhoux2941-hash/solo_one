package com.example.lostfound.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.lostfound.common.Result;
import com.example.lostfound.entity.FoundItem;
import com.example.lostfound.entity.User;
import com.example.lostfound.mapper.FoundItemMapper;
import com.example.lostfound.service.HotItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/found")
@RequiredArgsConstructor
public class FoundItemController {

    private final FoundItemMapper foundItemMapper;
    private final HotItemService hotItemService;

    @PostMapping
    public Result<FoundItem> create(@RequestBody FoundItem item, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "请先登录");
        }
        item.setUserId(user.getId());
        item.setStatus(0);
        item.setCreateTime(LocalDateTime.now());
        item.setUpdateTime(LocalDateTime.now());
        foundItemMapper.insert(item);
        hotItemService.recordPublish(item.getItemName());
        return Result.success(item);
    }

    @GetMapping("/page")
    public Result<Page<FoundItem>> page(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        if (StringUtils.hasText(keyword)) {
            hotItemService.recordSearch(keyword);
        }
        
        Page<FoundItem> pageObj = new Page<>(page, size);
        LambdaQueryWrapper<FoundItem> wrapper = new LambdaQueryWrapper<>();
        
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                .like(FoundItem::getItemName, keyword)
                .or().like(FoundItem::getDescription, keyword)
                .or().like(FoundItem::getLocation, keyword)
            );
        }
        if (status != null) {
            wrapper.eq(FoundItem::getStatus, status);
        }
        wrapper.orderByDesc(FoundItem::getCreateTime);
        
        return Result.success(foundItemMapper.selectPage(pageObj, wrapper));
    }

    @GetMapping("/my")
    public Result<List<FoundItem>> myFoundItems(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "请先登录");
        }
        List<FoundItem> list = foundItemMapper.selectList(
            new LambdaQueryWrapper<FoundItem>()
                .eq(FoundItem::getUserId, user.getId())
                .orderByDesc(FoundItem::getCreateTime)
        );
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<FoundItem> detail(@PathVariable Long id) {
        return Result.success(foundItemMapper.selectById(id));
    }
}
