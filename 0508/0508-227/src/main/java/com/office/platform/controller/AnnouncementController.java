package com.office.platform.controller;

import com.office.platform.common.LoginUser;
import com.office.platform.common.Result;
import com.office.platform.dto.AnnouncementDTO;
import com.office.platform.entity.Announcement;
import com.office.platform.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    private Long getUserIdFromSession(HttpSession session) {
        LoginUser loginUser = LoginUser.getFromSession(session);
        return loginUser != null ? loginUser.getId() : null;
    }

    @GetMapping
    public Result<Page<Announcement>> getAnnouncementList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            HttpSession session) {
        Long userId = getUserIdFromSession(session);
        Page<Announcement> announcementPage = announcementService.getValidAnnouncements(userId, page, size);
        return Result.success(announcementPage);
    }

    @GetMapping("/all")
    public Result<Page<Announcement>> getAllAnnouncements(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Announcement> announcementPage = announcementService.getAnnouncementList(page, size);
        return Result.success(announcementPage);
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getAnnouncementDetail(@PathVariable Long id, HttpSession session) {
        Long userId = getUserIdFromSession(session);
        Map<String, Object> detail = announcementService.getAnnouncementDetail(id, userId);
        if (detail == null) {
            return Result.error("公告不存在");
        }
        return Result.success(detail);
    }

    @GetMapping("/unread/count")
    public Result<Long> getUnreadCount(HttpSession session) {
        Long userId = getUserIdFromSession(session);
        long count = announcementService.getUnreadCount(userId);
        return Result.success(count);
    }

    @PostMapping
    public Result<Announcement> createAnnouncement(
            @Validated @RequestBody AnnouncementDTO dto,
            HttpSession session) {
        Long creatorId = getUserIdFromSession(session);
        return announcementService.createAnnouncement(dto, creatorId);
    }

    @PutMapping("/{id}")
    public Result<Announcement> updateAnnouncement(
            @PathVariable Long id,
            @Validated @RequestBody AnnouncementDTO dto) {
        return announcementService.updateAnnouncement(id, dto);
    }

    @DeleteMapping("/{id}")
    public Result<String> deleteAnnouncement(@PathVariable Long id) {
        return announcementService.deleteAnnouncement(id);
    }

    @PostMapping("/{id}/read")
    public Result<String> markAsRead(@PathVariable Long id, HttpSession session) {
        Long userId = getUserIdFromSession(session);
        return announcementService.markAsRead(id, userId);
    }
}
