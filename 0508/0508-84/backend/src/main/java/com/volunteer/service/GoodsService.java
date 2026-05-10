package com.volunteer.service;

import com.volunteer.entity.Goods;
import java.util.List;
import java.util.Optional;

public interface GoodsService {
    Goods create(Goods goods);
    Goods update(Goods goods);
    void delete(Long id);
    Optional<Goods> findById(Long id);
    List<Goods> findOnShelf();
    List<Goods> findHotGoods();
    List<Goods> findAll();
    Integer getStock(Long goodsId);
    boolean decreaseStock(Long goodsId, Integer quantity);
    boolean increaseStock(Long goodsId, Integer quantity);
}
