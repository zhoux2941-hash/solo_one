package com.company.grouporder.repository;

import com.company.grouporder.entity.MerchantItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MerchantItemRepository extends JpaRepository<MerchantItem, Long> {
    List<MerchantItem> findByMerchantIdOrderByPriceAsc(Long merchantId);
    List<MerchantItem> findByMerchantId(Long merchantId);
}
