package com.construction.progress.repository;

import com.construction.progress.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerId(Long ownerId);
    List<Project> findByStatus(Project.Status status);
    List<Project> findByOwnerIdAndStatus(Long ownerId, Project.Status status);
}
