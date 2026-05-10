package com.volunteer.controller;

import com.volunteer.config.CommonResult;
import com.volunteer.entity.Goods;
import com.volunteer.service.GoodsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/goods")
@CrossOrigin
public class GoodsController {

    @Autowired
    private GoodsService goodsService;

    @GetMapping
    public CommonResult<List<Goods>> listOnShelf() {
        return CommonResult.success(goodsService.findOnShelf());
    }

    @GetMapping("/hot")
    public CommonResult<List<Goods>> listHot() {
        return CommonResult.success(goodsService.findHotGoods());
    }

    @GetMapping("/all")
    public CommonResult<List<Goods>> listAll() {
        return CommonResult.success(goodsService.findAll());
    }

    @GetMapping("/{id}")
    public CommonResult<Goods> getById(@PathVariable Long id) {
        Optional<Goods> goodsOpt = goodsService.findById(id);
        if (goodsOpt.isPresent()) {
            return CommonResult.success(goodsOpt.get());
        }
        return CommonResult.error("物品不存在");
    }

    @GetMapping("/{id}/stock")
    public CommonResult<Map<String, Object>> getStock(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        result.put("goodsId", id);
        result.put("stock", goodsService.getStock(id));
        return CommonResult.success(result);
    }

    @PostMapping
    public CommonResult<Goods> create(@RequestBody Goods goods) {
        try {
            Goods created = goodsService.create(goods);
            return CommonResult.success("物品上架成功", created);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public CommonResult<Goods> update(@PathVariable Long id, @RequestBody Goods goods) {
        goods.setId(id);
        Goods updated = goodsService.update(goods);
        return CommonResult.success("物品更新成功", updated);
    }

    @DeleteMapping("/{id}")
    public CommonResult<Void> delete(@PathVariable Long id) {
        goodsService.delete(id);
        return CommonResult.success("物品已下架", null);
    }
}
