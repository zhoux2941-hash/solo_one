package com.lab.reagent.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lab.reagent.entity.Reagent;
import com.lab.reagent.mapper.ReagentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ReagentService {
    @Autowired
    private ReagentMapper reagentMapper;

    public List<Reagent> getAll() {
        List<Reagent> reagents = reagentMapper.selectList(null);
        return calculateExpireStatus(reagents);
    }

    public Reagent getById(Long id) {
        return reagentMapper.selectById(id);
    }

    public List<String> getCategories() {
        QueryWrapper<Reagent> wrapper = new QueryWrapper<>();
        wrapper.select("DISTINCT category");
        return reagentMapper.selectList(wrapper).stream()
                .map(Reagent::getCategory)
                .filter(c -> c != null && !c.isEmpty())
                .distinct()
                .toList();
    }

    public boolean addReagent(Reagent reagent) {
        reagent.setCreateTime(LocalDateTime.now());
        reagent.setUpdateTime(LocalDateTime.now());
        return reagentMapper.insert(reagent) > 0;
    }

    public boolean updateReagent(Reagent reagent) {
        reagent.setUpdateTime(LocalDateTime.now());
        return reagentMapper.updateById(reagent) > 0;
    }

    public boolean addStock(Long id, Integer quantity) {
        return reagentMapper.increaseQuantity(id, quantity) > 0;
    }

    public boolean decreaseStock(Long id, Integer quantity) {
        Reagent reagent = reagentMapper.selectById(id);
        if (reagent == null || reagent.getQuantity() < quantity) {
            return false;
        }
        return reagentMapper.decreaseQuantity(id, quantity) > 0;
    }

    public boolean deleteReagent(Long id) {
        return reagentMapper.deleteById(id) > 0;
    }

    public List<Reagent> getExpiringReagents() {
        List<Reagent> reagents = reagentMapper.selectList(null);
        return calculateExpireStatus(reagents).stream()
                .filter(r -> r.getExpireStatus() != null)
                .toList();
    }

    private List<Reagent> calculateExpireStatus(List<Reagent> reagents) {
        LocalDateTime now = LocalDateTime.now();
        for (Reagent reagent : reagents) {
            if (reagent.getExpiryDate() != null) {
                long daysUntilExpiry = ChronoUnit.DAYS.between(now, reagent.getExpiryDate());
                if (daysUntilExpiry < 0) {
                    reagent.setExpireStatus(-1);
                } else if (daysUntilExpiry <= 30) {
                    reagent.setExpireStatus((int) daysUntilExpiry);
                } else {
                    reagent.setExpireStatus(null);
                }
            } else {
                reagent.setExpireStatus(null);
            }
        }
        return reagents;
    }
}
