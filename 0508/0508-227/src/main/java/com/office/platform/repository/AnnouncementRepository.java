package com.office.platform.repository;

import com.office.platform.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("SELECT a FROM Announcement a WHERE (a.expireTime IS NULL OR a.expireTime > :now) ORDER BY a.isTop DESC, a.createTime DESC")
    Page<Announcement> findValidAnnouncements(@Param("now") LocalDateTime now, Pageable pageable);

    @Query("SELECT a FROM Announcement a WHERE (a.expireTime IS NULL OR a.expireTime > :now) ORDER BY a.isTop DESC, a.createTime DESC")
    List<Announcement> findValidAnnouncementsList(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(a) FROM Announcement a WHERE (a.expireTime IS NULL OR a.expireTime > :now) AND a.id NOT IN " +
           "(SELECT ar.announcement.id FROM AnnouncementRead ar WHERE ar.user.id = :userId)")
    long countUnreadByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
