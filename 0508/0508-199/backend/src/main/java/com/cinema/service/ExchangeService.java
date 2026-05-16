package com.cinema.service;

import com.cinema.entity.Exchange;
import com.cinema.entity.Member;
import com.cinema.entity.Snack;
import com.cinema.repository.ExchangeRepository;
import com.cinema.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class ExchangeService {
    
    private static final Logger logger = LoggerFactory.getLogger(ExchangeService.class);
    
    @Autowired
    private ExchangeRepository exchangeRepository;
    
    @Autowired
    private MemberService memberService;
    
    @Autowired
    private MemberRepository memberRepository;
    
    @Autowired
    private SnackService snackService;
    
    private final Map<Long, ReentrantLock> memberLocks = new ConcurrentHashMap<>();
    
    @Transactional
    public Exchange exchangeSnack(Long memberId, Long snackId) {
        ReentrantLock lock = memberLocks.computeIfAbsent(memberId, k -> new ReentrantLock());
        
        try {
            boolean acquired = lock.tryLock(5, TimeUnit.SECONDS);
            if (!acquired) {
                logger.warn("会员 {} 获取兑换锁超时", memberId);
                throw new RuntimeException("系统繁忙，请稍后重试");
            }
            
            try {
                return doExchange(memberId, snackId);
            } catch (ObjectOptimisticLockingFailureException e) {
                logger.warn("会员 {} 积分兑换发生乐观锁冲突，重试中", memberId);
                throw new RuntimeException("兑换繁忙，请重试");
            } finally {
                lock.unlock();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("兑换被中断");
        }
    }
    
    @Transactional
    protected Exchange doExchange(Long memberId, Long snackId) {
        Member member = memberRepository.findById(memberId).orElse(null);
        Snack snack = snackService.getSnackById(snackId);
        
        if (member == null || snack == null) {
            logger.warn("会员 {} 或零食 {} 不存在", memberId, snackId);
            return null;
        }
        
        if (member.getPoints() < snack.getPoints()) {
            logger.warn("会员 {} 积分不足，需要 {}，当前 {}", memberId, snack.getPoints(), member.getPoints());
            throw new RuntimeException("积分不足");
        }
        
        int originalPoints = member.getPoints();
        member.setPoints(originalPoints - snack.getPoints());
        memberRepository.save(member);
        
        logger.info("会员 {} 积分变化：{} -> {}", memberId, originalPoints, member.getPoints());
        
        Exchange exchange = new Exchange();
        exchange.setMember(member);
        exchange.setSnack(snack);
        exchange.setPointsUsed(snack.getPoints());
        
        return exchangeRepository.save(exchange);
    }
    
    public List<Exchange> getMemberExchanges(Long memberId) {
        return exchangeRepository.findByMemberId(memberId);
    }
    
    public List<Object[]> getSnackRanking() {
        return exchangeRepository.findSnackExchangeRanking();
    }
}