package com.lab.reagent.controller;

import com.lab.reagent.common.Result;
import com.lab.reagent.entity.Reagent;
import com.lab.reagent.service.ReagentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reagent")
@CrossOrigin(origins = "*")
public class ReagentController {
    @Autowired
    private ReagentService reagentService;

    @GetMapping("/list")
    public Result<List<Reagent>> list() {
        return Result.success(reagentService.getAll());
    }

    @GetMapping("/{id}")
    public Result<Reagent> getById(@PathVariable Long id) {
        return Result.success(reagentService.getById(id));
    }

    @GetMapping("/categories")
    public Result<List<String>> getCategories() {
        return Result.success(reagentService.getCategories());
    }

    @PostMapping("/add")
    public Result<String> add(@RequestBody Reagent reagent) {
        if (reagent.getName() == null || reagent.getName().trim().isEmpty()) {
            return Result.error("试剂名称不能为空");
        }
        boolean success = reagentService.addReagent(reagent);
        return success ? Result.success("添加成功") : Result.error("添加失败");
    }

    @PutMapping("/update")
    public Result<String> update(@RequestBody Reagent reagent) {
        boolean success = reagentService.updateReagent(reagent);
        return success ? Result.success("更新成功") : Result.error("更新失败");
    }

    @PostMapping("/add-stock")
    public Result<String> addStock(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Integer quantity = Integer.valueOf(params.get("quantity").toString());
        boolean success = reagentService.addStock(id, quantity);
        return success ? Result.success("入库成功") : Result.error("入库失败");
    }

    @DeleteMapping("/{id}")
    public Result<String> delete(@PathVariable Long id) {
        boolean success = reagentService.deleteReagent(id);
        return success ? Result.success("删除成功") : Result.error("删除失败");
    }

    @GetMapping("/expiring")
    public Result<List<Reagent>> getExpiring() {
        return Result.success(reagentService.getExpiringReagents());
    }
}
