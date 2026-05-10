package com.pottery.simulator.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pottery.simulator.entity.UserPottery;
import com.pottery.simulator.repository.UserPotteryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserPotteryService {

    @Autowired
    private UserPotteryRepository userPotteryRepository;

    public Long save(UserPottery pottery) {
        if (pottery.getId() == null) {
            userPotteryRepository.insert(pottery);
        } else {
            userPotteryRepository.updateById(pottery);
        }
        return pottery.getId();
    }

    public UserPottery getById(Long id) {
        return userPotteryRepository.selectById(id);
    }

    public List<UserPottery> listByUser(Long userId) {
        LambdaQueryWrapper<UserPottery> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserPottery::getUserId, userId)
               .orderByDesc(UserPottery::getUpdatedAt);
        return userPotteryRepository.selectList(wrapper);
    }

    public boolean delete(Long id) {
        return userPotteryRepository.deleteById(id) > 0;
    }

}
