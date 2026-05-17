package com.construction.repository;

import com.construction.entity.ConstructionNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConstructionNodeRepository extends JpaRepository<ConstructionNode, Long>, JpaSpecificationExecutor<ConstructionNode> {

    List<ConstructionNode> findByProjectId(Long projectId);

    List<ConstructionNode> findByProjectIdAndParentId(Long projectId, Long parentId);

    List<ConstructionNode> findByParentId(Long parentId);

    boolean existsByNodeNameAndProjectId(String nodeName, Long projectId);

    boolean existsByNodeNameAndProjectIdAndIdNot(String nodeName, Long projectId, Long id);
}
