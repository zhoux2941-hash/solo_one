package com.community.buying.service;

import com.community.buying.entity.Refund;
import com.community.buying.repository.RefundRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class RefundService {

    @Autowired
    private RefundRepository refundRepository;

    private String generateRefundNo() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        Random random = new Random();
        int randomNum = random.nextInt(10000);
        return "REF" + timestamp + String.format("%04d", randomNum);
    }

    public Refund create(Refund refund) {
        refund.setRefundNo(generateRefundNo());
        refund.setStatus(0);
        return refundRepository.save(refund);
    }

    public Refund findById(Long id) {
        return refundRepository.findById(id).orElse(null);
    }

    public List<Refund> findByUserId(Long userId) {
        return refundRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    public List<Refund> findByStatus(Integer status) {
        return refundRepository.findByStatus(status);
    }

    public List<Refund> findAll() {
        return refundRepository.findAll();
    }

    @Transactional
    public Refund audit(Long id, Integer status, String auditRemark) {
        Refund refund = findById(id);
        if (refund != null) {
            refund.setStatus(status);
            refund.setAuditRemark(auditRemark);
            refund.setAuditTime(LocalDateTime.now());
            return refundRepository.save(refund);
        }
        return null;
    }
}