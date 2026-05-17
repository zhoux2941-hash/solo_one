package com.construction.repository;

import com.construction.entity.NodeProgressReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeProgressReportRepository extends JpaRepository<NodeProgressReport, Long>, JpaSpecificationExecutor<NodeProgressReport> {

    List<NodeProgressReport> findByNodeId(Long nodeId);

    List<NodeProgressReport> findByProjectId(Long projectId);

    List<NodeProgressReport> findByNodeIdOrderByReportDateDesc(Long nodeId);
}
