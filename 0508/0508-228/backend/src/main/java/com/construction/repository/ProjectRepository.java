package com.construction.repository;

import com.construction.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    boolean existsByProjectName(String projectName);

    boolean existsByProjectNameAndIdNot(String projectName, Long id);
}
