package com.volunteer.service.impl;

import com.volunteer.entity.Goods;
import com.volunteer.repository.GoodsRepository;
import com.volunteer.service.GoodsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class GoodsServiceImpl implements GoodsService {

    @Autowired
    private GoodsRepository goodsRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String HOT_GOODS_STOCK_KEY = "hot_goods:stock:";
    private static final String HOT_GOODS_LIST_KEY = "hot_goods:list";

    @Override
    @Transactional
    public Goods create(Goods goods) {
        goods.setStatus("ON_SHELF");
        Goods saved = goodsRepository.save(goods);
        if (Boolean.TRUE.equals(goods.getIsHot())) {
            updateHotGoodsInCache(saved);
        }
        return saved;
    }

    @Override
    @Transactional
    public Goods update(Goods goods) {
        Goods saved = goodsRepository.save(goods);
        if (Boolean.TRUE.equals(goods.getIsHot())) {
            updateHotGoodsInCache(saved);
        } else {
            removeHotGoodsFromCache(goods.getId());
        }
        return saved;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Optional<Goods> goodsOpt = goodsRepository.findById(id);
        if (goodsOpt.isPresent()) {
            Goods goods = goodsOpt.get();
            goods.setStatus("OFF_SHELF");
            goodsRepository.save(goods);
            removeHotGoodsFromCache(id);
        }
    }

    @Override
    public Optional<Goods> findById(Long id) {
        return goodsRepository.findById(id);
    }

    @Override
    public List<Goods> findOnShelf() {
        return goodsRepository.findByStatusOrderByCreateTimeDesc("ON_SHELF");
    }

    @Override
    public List<Goods> findHotGoods() {
        List<Goods> cachedList = (List<Goods>) redisTemplate.opsForValue().get(HOT_GOODS_LIST_KEY);
        if (cachedList != null) {
            return cachedList;
        }
        List<Goods> hotGoods = goodsRepository.findByStatusAndIsHotOrderByCreateTimeDesc("ON_SHELF", true);
        redisTemplate.opsForValue().set(HOT_GOODS_LIST_KEY, hotGoods, 5, TimeUnit.MINUTES);
        return hotGoods;
    }

    @Override
    public List<Goods> findAll() {
        return goodsRepository.findAll();
    }

    @Override
    public Integer getStock(Long goodsId) {
        String stockKey = HOT_GOODS_STOCK_KEY + goodsId;
        Integer cachedStock = (Integer) redisTemplate.opsForValue().get(stockKey);
        if (cachedStock != null) {
            return cachedStock;
        }
        
        Optional<Goods> goodsOpt = goodsRepository.findById(goodsId);
        if (goodsOpt.isPresent()) {
            Goods goods = goodsOpt.get();
            if (Boolean.TRUE.equals(goods.getIsHot())) {
                redisTemplate.opsForValue().set(stockKey, goods.getStock(), 10, TimeUnit.MINUTES);
            }
            return goods.getStock();
        }
        return 0;
    }

    @Override
    @Transactional
    public boolean decreaseStock(Long goodsId, Integer quantity) {
        String stockKey = HOT_GOODS_STOCK_KEY + goodsId;
        Integer cachedStock = (Integer) redisTemplate.opsForValue().get(stockKey);
        
        if (cachedStock != null) {
            if (cachedStock < quantity) {
                return false;
            }
            redisTemplate.opsForValue().decrement(stockKey, quantity);
        }
        
        int updated = goodsRepository.decreaseStock(goodsId, quantity);
        if (updated > 0) {
            refreshHotGoodsList();
            return true;
        }
        return false;
    }

    @Override
    @Transactional
    public boolean increaseStock(Long goodsId, Integer quantity) {
        String stockKey = HOT_GOODS_STOCK_KEY + goodsId;
        Integer cachedStock = (Integer) redisTemplate.opsForValue().get(stockKey);
        
        if (cachedStock != null) {
            redisTemplate.opsForValue().increment(stockKey, quantity);
        }
        
        int updated = goodsRepository.increaseStock(goodsId, quantity);
        if (updated > 0) {
            refreshHotGoodsList();
            return true;
        }
        return false;
    }

    private void updateHotGoodsInCache(Goods goods) {
        String stockKey = HOT_GOODS_STOCK_KEY + goods.getId();
        redisTemplate.opsForValue().set(stockKey, goods.getStock(), 10, TimeUnit.MINUTES);
        refreshHotGoodsList();
    }

    private void removeHotGoodsFromCache(Long goodsId) {
        String stockKey = HOT_GOODS_STOCK_KEY + goodsId;
        redisTemplate.delete(stockKey);
        refreshHotGoodsList();
    }

    private void refreshHotGoodsList() {
        redisTemplate.delete(HOT_GOODS_LIST_KEY);
    }

    @Scheduled(fixedRate = 300000)
    public void syncHotGoodsToCache() {
        List<Goods> hotGoods = goodsRepository.findByStatusAndIsHotOrderByCreateTimeDesc("ON_SHELF", true);
        for (Goods goods : hotGoods) {
            String stockKey = HOT_GOODS_STOCK_KEY + goods.getId();
            redisTemplate.opsForValue().set(stockKey, goods.getStock(), 10, TimeUnit.MINUTES);
        }
        redisTemplate.opsForValue().set(HOT_GOODS_LIST_KEY, hotGoods, 5, TimeUnit.MINUTES);
    }
}
