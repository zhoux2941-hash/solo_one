package com.office.platform.service;

import com.office.platform.common.Result;
import com.office.platform.dto.AnnouncementDTO;
import com.office.platform.entity.Announcement;
import com.office.platform.entity.AnnouncementRead;
import com.office.platform.entity.User;
import com.office.platform.repository.AnnouncementReadRepository;
import com.office.platform.repository.AnnouncementRepository;
import com.office.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private AnnouncementReadRepository announcementReadRepository;

    @Autowired
    private UserRepository userRepository;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Page<Announcement> getAnnouncementList(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "isTop", "createTime"));
        return announcementRepository.findAll(pageable);
    }

    public Page<Announcement> getValidAnnouncements(Long userId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return announcementRepository.findValidAnnouncements(LocalDateTime.now(), pageable);
    }

    public Map<String, Object> getAnnouncementDetail(Long id, Long userId) {
        Announcement announcement = announcementRepository.findById(id).orElse(null);
        if (announcement == null) {
            return null;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("announcement", announcement);
        result.put("readCount", announcementReadRepository.countByAnnouncementId(id));
        result.put("hasRead", announcementReadRepository.existsByAnnouncementIdAndUserId(id, userId));

        return result;
    }

    public long getUnreadCount(Long userId) {
        return announcementRepository.countUnreadByUserId(userId, LocalDateTime.now());
    }

    @Transactional
    public Result<Announcement> createAnnouncement(AnnouncementDTO dto, Long creatorId) {
        User creator = userRepository.findById(creatorId).orElse(null);
        if (creator == null) {
            return Result.error("创建者不存在");
        }

        Announcement announcement = new Announcement();
        announcement.setTitle(dto.getTitle());
        announcement.setContent(dto.getContent());
        announcement.setIsTop(dto.getIsTop());
        announcement.setCreator(creator);

        if (dto.getExpireTime() != null && !dto.getExpireTime().isEmpty()) {
            announcement.setExpireTime(LocalDateTime.parse(dto.getExpireTime(), FORMATTER));
        }

        announcement = announcementRepository.save(announcement);
        return Result.success("发布成功", announcement);
    }

    @Transactional
    public Result<Announcement> updateAnnouncement(Long id, AnnouncementDTO dto) {
        Announcement announcement = announcementRepository.findById(id).orElse(null);
        if (announcement == null) {
            return Result.error("公告不存在");
        }

        announcement.setTitle(dto.getTitle());
        announcement.setContent(dto.getContent());
        announcement.setIsTop(dto.getIsTop());

        if (dto.getExpireTime() != null && !dto.getExpireTime().isEmpty()) {
            announcement.setExpireTime(LocalDateTime.parse(dto.getExpireTime(), FORMATTER));
        } else {
            announcement.setExpireTime(null);
        }

        announcement = announcementRepository.save(announcement);
        return Result.success("更新成功", announcement);
    }

    @Transactional
    public Result<String> deleteAnnouncement(Long id) {
        if (!announcementRepository.existsById(id)) {
            return Result.error("公告不存在");
        }
        announcementRepository.deleteById(id);
        return Result.success("删除成功");
    }

    @Transactional
    public Result<String> markAsRead(Long announcementId, Long userId) {
        if (announcementReadRepository.existsByAnnouncementIdAndUserId(announcementId, userId)) {
            return Result.success("已标记为已读");
        }

        Announcement announcement = announcementRepository.findById(announcementId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        if (announcement == null || user == null) {
            return Result.error("公告或用户不存在");
        }

        AnnouncementRead read = new AnnouncementRead();
        read.setAnnouncement(announcement);
        read.setUser(user);
        announcementReadRepository.save(read);

        return Result.success("标记成功");
    }
}
