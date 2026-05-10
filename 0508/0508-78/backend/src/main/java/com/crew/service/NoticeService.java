package com.crew.service;

import com.crew.dto.ConflictInfo;
import com.crew.dto.NoticeCreateRequest;
import com.crew.entity.Notice;
import com.crew.entity.User;
import com.crew.repository.NoticeRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class NoticeService {
    
    private static final String ACTOR_NOTICE_CACHE_PREFIX = "actor:notices:";
    
    @Autowired
    private NoticeRepository noticeRepository;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private String getCacheKey(Long actorId, LocalDate date) {
        return ACTOR_NOTICE_CACHE_PREFIX + actorId + ":" + date.toString();
    }
    
    private List<Notice> getCachedActorNotices(Long actorId, LocalDate date) {
        String cacheKey = getCacheKey(actorId, date);
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return objectMapper.convertValue(cached, new TypeReference<List<Notice>>() {});
        }
        return null;
    }
    
    private void cacheActorNotices(Long actorId, LocalDate date, List<Notice> notices) {
        String cacheKey = getCacheKey(actorId, date);
        redisTemplate.opsForValue().set(cacheKey, notices, 24, TimeUnit.HOURS);
    }
    
    private void invalidateActorNoticesCache(Long actorId, LocalDate date) {
        String cacheKey = getCacheKey(actorId, date);
        redisTemplate.delete(cacheKey);
    }
    
    public List<ConflictInfo> checkConflicts(Long actorId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeNoticeId) {
        List<Notice> existingNotices;
        List<ConflictInfo> conflicts = new ArrayList<>();
        
        if (excludeNoticeId == null) {
            existingNotices = getCachedActorNotices(actorId, date);
            if (existingNotices == null) {
                existingNotices = noticeRepository.findByActorAndDate(actorId, date);
                if (!existingNotices.isEmpty()) {
                    cacheActorNotices(actorId, date, existingNotices);
                }
            }
        } else {
            existingNotices = noticeRepository.findByActorAndDateExcludingId(actorId, date, excludeNoticeId);
        }
        
        User actor = userService.findById(actorId);
        
        for (Notice existing : existingNotices) {
            if (hasTimeConflict(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                ConflictInfo conflict = new ConflictInfo();
                conflict.setActorId(actorId);
                conflict.setActorName(actor.getName());
                conflict.setConflictScene(existing.getSceneName());
                conflict.setConflictStartTime(existing.getStartTime());
                conflict.setConflictEndTime(existing.getEndTime());
                conflicts.add(conflict);
            }
        }
        
        return conflicts;
    }
    
    /**
     * 检测两个时间段是否存在冲突
     * 
     * 冲突判断逻辑：
     * 两个时间段 [S1, E1] 和 [S2, E2] 存在冲突当且仅当：
     * 新时间段不是完全在已有时间段之前，也不是完全在已有时间段之后
     * 
     * 即：!(E1 <= S2 或 S1 >= E2)
     * 
     * 测试用例（新时间段 vs 已有时间段）：
     * 1. 完全重叠：9-10 vs 8-11 → 冲突 ✓
     * 2. 部分重叠（右重叠）：9-11 vs 8-10 → 冲突 ✓
     * 3. 部分重叠（左重叠）：8-10 vs 9-11 → 冲突 ✓
     * 4. 包含关系：8-11 vs 9-10 → 冲突 ✓
     * 5. 完全不重叠（前）：8-9 vs 10-11 → 不冲突
     * 6. 完全不重叠（后）：10-11 vs 8-9 → 不冲突
     * 7. 边界相接：8-10 vs 10-11 → 不冲突（10点整交接）
     * 
     * @param newStart 新时间段开始时间
     * @param newEnd 新时间段结束时间
     * @param existingStart 已有时间段开始时间
     * @param existingEnd 已有时间段结束时间
     * @return true 表示存在冲突，false 表示无冲突
     */
    private boolean hasTimeConflict(LocalTime newStart, LocalTime newEnd, 
                                    LocalTime existingStart, LocalTime existingEnd) {
        boolean completelyBefore = newEnd.isBefore(existingStart) || newEnd.equals(existingStart);
        boolean completelyAfter = newStart.isAfter(existingEnd) || newStart.equals(existingEnd);
        
        return !(completelyBefore || completelyAfter);
    }
    
    @Transactional
    public Notice createNotice(NoticeCreateRequest request, Long directorId) {
        if (request.getStartTime().isAfter(request.getEndTime()) || 
            request.getStartTime().equals(request.getEndTime())) {
            throw new RuntimeException("开始时间必须早于结束时间");
        }
        
        Map<String, List<ConflictInfo>> allConflicts = new HashMap<>();
        
        for (Long actorId : request.getActorIds()) {
            List<ConflictInfo> conflicts = checkConflicts(actorId, request.getNoticeDate(), 
                    request.getStartTime(), request.getEndTime(), null);
            if (!conflicts.isEmpty()) {
                allConflicts.put(userService.findById(actorId).getName(), conflicts);
            }
        }
        
        if (!allConflicts.isEmpty()) {
            StringBuilder errorMsg = new StringBuilder("以下演员存在时间冲突：\n");
            for (Map.Entry<String, List<ConflictInfo>> entry : allConflicts.entrySet()) {
                errorMsg.append("演员 ").append(entry.getKey()).append("：\n");
                for (ConflictInfo info : entry.getValue()) {
                    errorMsg.append("  - 场景：").append(info.getConflictScene())
                            .append("，时间：").append(info.getConflictStartTime())
                            .append(" - ").append(info.getConflictEndTime()).append("\n");
                }
            }
            throw new RuntimeException(errorMsg.toString());
        }
        
        User director = userService.findById(directorId);
        Set<User> actors = request.getActorIds().stream()
                .map(userService::findById)
                .collect(Collectors.toSet());
        
        Notice notice = new Notice();
        notice.setNoticeDate(request.getNoticeDate());
        notice.setSceneName(request.getSceneName());
        notice.setStartTime(request.getStartTime());
        notice.setEndTime(request.getEndTime());
        notice.setCostumeRequirement(request.getCostumeRequirement());
        notice.setPropRequirement(request.getPropRequirement());
        notice.setDirector(director);
        notice.setActors(actors);
        notice.setMaterialsReady(false);
        
        Notice savedNotice = noticeRepository.save(notice);
        
        for (Long actorId : request.getActorIds()) {
            invalidateActorNoticesCache(actorId, request.getNoticeDate());
        }
        
        return savedNotice;
    }
    
    public List<Notice> getNoticesByDate(LocalDate date) {
        return noticeRepository.findByNoticeDateOrderByStartTimeAsc(date);
    }
    
    public List<Notice> getActorNotices(Long actorId, LocalDate date) {
        List<Notice> cached = getCachedActorNotices(actorId, date);
        if (cached != null) {
            return cached;
        }
        
        List<Notice> notices = noticeRepository.findByActorAndDate(actorId, date);
        if (!notices.isEmpty()) {
            cacheActorNotices(actorId, date, notices);
        }
        return notices;
    }
    
    public List<Notice> getAllActorNotices(Long actorId) {
        return noticeRepository.findAllByActor(actorId);
    }
    
    @Transactional
    public Notice confirmMaterials(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("通告不存在"));
        
        notice.setMaterialsReady(true);
        Notice saved = noticeRepository.save(notice);
        
        for (User actor : saved.getActors()) {
            invalidateActorNoticesCache(actor.getId(), saved.getNoticeDate());
        }
        
        return saved;
    }
    
    public Notice getById(Long id) {
        return noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("通告不存在"));
    }
}