package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.ConstructionArea;
import com.construction.service.ConstructionAreaService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/area")
public class ConstructionAreaController {

    @Resource
    private ConstructionAreaService areaService;

    @GetMapping("/list")
    public Result<PageResult<ConstructionArea>> getAreaList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String areaType,
            @RequestParam(required = false) String keyword) {
        return areaService.getAreaList(pageNum, pageSize, projectId, areaType, keyword);
    }

    @GetMapping("/{id}")
    public Result<ConstructionArea> getAreaById(@PathVariable Long id) {
        return areaService.getAreaById(id);
    }

    @PostMapping
    public Result<ConstructionArea> addArea(@RequestBody ConstructionArea area) {
        return areaService.addArea(area);
    }

    @PutMapping("/{id}")
    public Result<ConstructionArea> updateArea(@PathVariable Long id, @RequestBody ConstructionArea area) {
        return areaService.updateArea(id, area);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteArea(@PathVariable Long id) {
        return areaService.deleteArea(id);
    }

    @GetMapping("/project/{projectId}")
    public Result<List<ConstructionArea>> getAreasByProjectId(@PathVariable Long projectId) {
        return areaService.getAreasByProjectId(projectId);
    }
}
