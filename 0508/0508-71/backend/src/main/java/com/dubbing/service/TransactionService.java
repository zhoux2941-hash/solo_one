package com.dubbing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dubbing.entity.Transaction;
import com.dubbing.entity.User;
import com.dubbing.mapper.TransactionMapper;
import com.dubbing.mapper.UserMapper;
import com.dubbing.util.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
public class TransactionService {

    @Autowired
    private TransactionMapper transactionMapper;

    @Autowired
    private UserMapper userMapper;

    @Transactional(rollbackFor = Exception.class)
    public void withdraw(BigDecimal amount) {
        User currentUser = UserContext.getCurrentUser();
        if (currentUser.getRole() != 2) {
            throw new RuntimeException("只有配音员可以提现");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("提现金额必须大于0");
        }
        if (currentUser.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("余额不足");
        }

        currentUser.setBalance(currentUser.getBalance().subtract(amount));
        userMapper.updateById(currentUser);

        Transaction transaction = new Transaction();
        transaction.setUserId(currentUser.getId());
        transaction.setType(3);
        transaction.setAmount(amount);
        transaction.setBalance(currentUser.getBalance());
        transaction.setDescription("提现申请：" + amount + " 积分");
        transaction.setStatus(1);
        transactionMapper.insert(transaction);
    }

    public List<Transaction> getMyTransactions() {
        User currentUser = UserContext.getCurrentUser();
        return transactionMapper.selectList(new LambdaQueryWrapper<Transaction>()
                .eq(Transaction::getUserId, currentUser.getId())
                .orderByDesc(Transaction::getCreateTime));
    }
}
