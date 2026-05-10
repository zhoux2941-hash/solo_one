package com.company.grouporder.service;

import com.company.grouporder.entity.Merchant;
import com.company.grouporder.entity.MerchantItem;
import com.company.grouporder.repository.MerchantItemRepository;
import com.company.grouporder.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final MerchantItemRepository merchantItemRepository;

    @PostConstruct
    public void initDefaultMerchants() {
        if (merchantRepository.count() == 0) {
            initDefaultData();
        }
    }

    @Transactional
    public void initDefaultData() {
        Merchant heytea = createMerchant("喜茶");
        createMerchantItem(heytea.getId(), "芝芝莓莓", new BigDecimal("32.00"));
        createMerchantItem(heytea.getId(), "多肉葡萄", new BigDecimal("29.00"));
        createMerchantItem(heytea.getId(), "芝芝芒芒", new BigDecimal("31.00"));
        createMerchantItem(heytea.getId(), "轻芝莓莓", new BigDecimal("29.00"));
        createMerchantItem(heytea.getId(), "纯绿妍", new BigDecimal("13.00"));
        createMerchantItem(heytea.getId(), "纯金凤茶王", new BigDecimal("15.00"));
        createMerchantItem(heytea.getId(), "绿妍脆珠", new BigDecimal("16.00"));
        
        Merchant starbucks = createMerchant("星巴克");
        createMerchantItem(starbucks.getId(), "拿铁(中)", new BigDecimal("32.00"));
        createMerchantItem(starbucks.getId(), "拿铁(大)", new BigDecimal("35.00"));
        createMerchantItem(starbucks.getId(), "美式(中)", new BigDecimal("28.00"));
        createMerchantItem(starbucks.getId(), "美式(大)", new BigDecimal("31.00"));
        createMerchantItem(starbucks.getId(), "摩卡(中)", new BigDecimal("34.00"));
        createMerchantItem(starbucks.getId(), "卡布奇诺(中)", new BigDecimal("32.00"));
        createMerchantItem(starbucks.getId(), "香草拿铁(中)", new BigDecimal("34.00"));
        
        Merchant luckin = createMerchant("瑞幸咖啡");
        createMerchantItem(luckin.getId(), "生椰拿铁", new BigDecimal("19.00"));
        createMerchantItem(luckin.getId(), "丝绒拿铁", new BigDecimal("21.00"));
        createMerchantItem(luckin.getId(), "冰美式", new BigDecimal("12.00"));
        createMerchantItem(luckin.getId(), "陨石拿铁", new BigDecimal("22.00"));
        createMerchantItem(luckin.getId(), "橙C美式", new BigDecimal("15.00"));
        createMerchantItem(luckin.getId(), "小蓝杯经典美式", new BigDecimal("9.90"));
        
        log.info("初始化商家数据完成");
    }

    public List<Merchant> getAllMerchants() {
        return merchantRepository.findAll();
    }

    public Optional<Merchant> getMerchantById(Long id) {
        return merchantRepository.findById(id);
    }

    public List<MerchantItem> getMerchantItems(Long merchantId) {
        return merchantItemRepository.findByMerchantId(merchantId);
    }

    private Merchant createMerchant(String name) {
        Merchant merchant = new Merchant();
        merchant.setName(name);
        return merchantRepository.save(merchant);
    }

    private MerchantItem createMerchantItem(Long merchantId, String name, BigDecimal price) {
        MerchantItem item = new MerchantItem();
        item.setMerchantId(merchantId);
        item.setName(name);
        item.setPrice(price);
        return merchantItemRepository.save(item);
    }
}
