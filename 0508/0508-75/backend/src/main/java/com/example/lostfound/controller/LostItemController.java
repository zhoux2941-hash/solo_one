package com.example.lostfound.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.lostfound.common.Result;
import com.example.lostfound.entity.LostItem;
import com.example.lostfound.entity.User;
import com.example.lostfound.mapper.LostItemMapper;
import com.example.lostfound.service.HotItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/lost")
@RequiredArgsConstructor
public class LostItemController {

    private final LostItemMapper lostItemMapper;
    private final HotItemService hotItemService;

    @PostMapping
    public Result<LostItem> create(@RequestBody LostItem item, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "请先登录");
        }
        item.setUserId(user.getId());
        item.setStatus(0);
        item.setCreateTime(LocalDateTime.now());
        item.setUpdateTime(LocalDateTime.now());
        lostItemMapper.insert(item);
        hotItemService.recordPublish(item.getItemName());
        return Result.success(item);
    }

    @GetMapping("/page")
    public Result<Page<LostItem>> page(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        if (StringUtils.hasText(keyword)) {
            hotItemService.recordSearch(keyword);
        }
        
        Page<LostItem> pageObj = new Page<>(page, size);
        LambdaQueryWrapper<LostItem> wrapper = new LambdaQueryWrapper<>();
        
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                .like(LostItem::getItemName, keyword)
                .or().like(LostItem::getDescription, keyword)
                .or().like(LostItem::getLocation, keyword)
            );
        }
        if (status != null) {
            wrapper.eq(LostItem::getStatus, status);
        }
        wrapper.orderByDesc(LostItem::getCreateTime);
        
        return Result.success(lostItemMapper.selectPage(pageObj, wrapper));
    }

    @GetMapping("/my")
    public Result<List<LostItem>> myLostItems(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return Result.error(401, "请先登录");
        }
        List<LostItem> list = lostItemMapper.selectList(
            new LambdaQueryWrapper<LostItem>()
                .eq(LostItem::getUserId, user.getId())
                .orderByDesc(LostItem::getCreateTime)
        );
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<LostItem> detail(@PathVariable Long id) {
        return Result.success(lostItemMapper.selectById(id));
    }
}
