package com.office.platform.repository;

import com.office.platform.entity.AnnouncementRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, Long> {

    boolean existsByAnnouncementIdAndUserId(Long announcementId, Long userId);

    long countByAnnouncementId(Long announcementId);
}
