package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.ConstructionNode;
import com.construction.service.ConstructionNodeService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/construction-node")
public class ConstructionNodeController {

    @Resource
    private ConstructionNodeService constructionNodeService;

    @GetMapping("/list")
    public Result<PageResult<ConstructionNode>> getNodeList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long parentId,
            @RequestParam(required = false) String currentStatus) {
        return constructionNodeService.getNodeList(pageNum, pageSize, projectId, parentId, currentStatus);
    }

    @GetMapping("/tree")
    public Result<List<ConstructionNode>> getNodeTree(@RequestParam Long projectId) {
        return constructionNodeService.getNodeTree(projectId);
    }

    @GetMapping("/{id}")
    public Result<ConstructionNode> getNodeById(@PathVariable Long id) {
        return constructionNodeService.getNodeById(id);
    }

    @PostMapping
    public Result<ConstructionNode> addNode(@RequestBody ConstructionNode node) {
        return constructionNodeService.addNode(node);
    }

    @PutMapping("/{id}")
    public Result<ConstructionNode> updateNode(@PathVariable Long id, @RequestBody ConstructionNode node) {
        return constructionNodeService.updateNode(id, node);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteNode(@PathVariable Long id) {
        return constructionNodeService.deleteNode(id);
    }

    @PutMapping("/{id}/progress")
    public Result<ConstructionNode> updateNodeProgress(@PathVariable Long id, @RequestBody ConstructionNode progressData) {
        return constructionNodeService.updateNodeProgress(id, progressData);
    }

    @GetMapping("/project/{projectId}")
    public Result<List<ConstructionNode>> getNodesByProjectId(@PathVariable Long projectId) {
        return constructionNodeService.getNodesByProjectId(projectId);
    }
}
