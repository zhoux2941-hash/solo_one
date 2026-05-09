package com.restaurant.queue.service;

import com.restaurant.queue.entity.OrderItem;
import com.restaurant.queue.entity.OrderRecord;
import com.restaurant.queue.repository.OrderRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@Slf4j
@RequiredArgsConstructor
public class MockDataGenerator {

    private final OrderRecordRepository orderRecordRepository;
    private final Random random = new Random();

    private static final String[] DISH_NAMES_LOW = {
            "麻婆豆腐", "炒青菜", "拍黄瓜", "番茄炒蛋", "土豆丝",
            "米饭", "紫菜蛋花汤", "凉拌海带", "炒豆芽", "酸辣白菜"
    };

    private static final String[] DISH_NAMES_MID = {
            "宫保鸡丁", "鱼香肉丝", "回锅肉", "红烧肉", "酸菜鱼",
            "水煮鱼", "糖醋里脊", "干煸四季豆", "蒜蓉虾", "辣子鸡"
    };

    private static final String[] DISH_NAMES_HIGH = {
            "清蒸鲈鱼", "大闸蟹", "波士顿龙虾", "帝王蟹", "和牛",
            "燕窝", "鱼翅", "龙虾刺身", "鲍鱼", "鹅肝"
    };

    private static final String[] CATEGORIES = {
            "川菜", "粤菜", "海鲜", "素菜", "汤品", "主食", "甜点"
    };

    @Transactional
    public String generateCorrelationData(Long restaurantId, int count, boolean createPositiveCorrelation) {
        restaurantId = restaurantId != null ? restaurantId : QueueService.DEFAULT_RESTAURANT_ID;

        int deleted = deleteExistingData(restaurantId);

        List<OrderRecord> orders = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            LocalDateTime orderTime = LocalDateTime.now().minusDays(random.nextInt(30))
                    .minusHours(random.nextInt(24))
                    .minusMinutes(random.nextInt(60));

            int waitMinutes = random.nextInt(120);

            OrderRecord order = OrderRecord.builder()
                    .restaurantId(restaurantId)
                    .queueId((long) (i + 1))
                    .waitMinutes(waitMinutes)
                    .orderTime(orderTime)
                    .build();

            int itemCount;
            BigDecimal totalAmount = BigDecimal.ZERO;

            if (createPositiveCorrelation) {
                itemCount = (int) (2 + (waitMinutes / 15.0) * random.nextDouble() * 3);
                itemCount = Math.min(itemCount, 12);
                itemCount = Math.max(itemCount, 1);

                int highPriceCount = (int) (waitMinutes / 20.0);
                int midPriceCount = (int) (waitMinutes / 10.0);
                int lowPriceCount = Math.max(1, itemCount - highPriceCount - midPriceCount);

                totalAmount = addItems(order, highPriceCount, midPriceCount, lowPriceCount);
            } else {
                itemCount = 2 + random.nextInt(6);
                int lowCount = random.nextInt(itemCount + 1);
                int midCount = random.nextInt(itemCount - lowCount + 1);
                int highCount = itemCount - lowCount - midCount;
                totalAmount = addItems(order, highCount, midCount, lowCount);
            }

            order.setItemCount(itemCount);
            order.setTotalAmount(totalAmount.setScale(2, RoundingMode.HALF_UP));
            orders.add(order);
        }

        orderRecordRepository.saveAll(orders);

        String msg = String.format("餐厅%d生成了%d条模拟订单数据，已删除%d条旧数据，关联模式：%s",
                restaurantId, count, deleted,
                createPositiveCorrelation ? "正相关（等待越久消费越高）" : "随机分布");
        log.info(msg);
        return msg;
    }

    private int deleteExistingData(Long restaurantId) {
        List<OrderRecord> existing = orderRecordRepository.findByRestaurantId(restaurantId);
        if (!existing.isEmpty()) {
            orderRecordRepository.deleteAll(existing);
            return existing.size();
        }
        return 0;
    }

    private BigDecimal addItems(OrderRecord order, int highCount, int midCount, int lowCount) {
        BigDecimal total = BigDecimal.ZERO;

        for (int i = 0; i < highCount; i++) {
            String name = DISH_NAMES_HIGH[random.nextInt(DISH_NAMES_HIGH.length)];
            BigDecimal price = BigDecimal.valueOf(100 + random.nextDouble() * 200);
            int quantity = 1 + random.nextInt(2);
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(quantity));
            total = total.add(subtotal);

            order.addItem(OrderItem.builder()
                    .dishName(name)
                    .category(CATEGORIES[random.nextInt(CATEGORIES.length)])
                    .price(price.setScale(2, RoundingMode.HALF_UP))
                    .quantity(quantity)
                    .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        for (int i = 0; i < midCount; i++) {
            String name = DISH_NAMES_MID[random.nextInt(DISH_NAMES_MID.length)];
            BigDecimal price = BigDecimal.valueOf(30 + random.nextDouble() * 40);
            int quantity = 1 + random.nextInt(3);
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(quantity));
            total = total.add(subtotal);

            order.addItem(OrderItem.builder()
                    .dishName(name)
                    .category(CATEGORIES[random.nextInt(CATEGORIES.length)])
                    .price(price.setScale(2, RoundingMode.HALF_UP))
                    .quantity(quantity)
                    .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        for (int i = 0; i < lowCount; i++) {
            String name = DISH_NAMES_LOW[random.nextInt(DISH_NAMES_LOW.length)];
            BigDecimal price = BigDecimal.valueOf(8 + random.nextDouble() * 20);
            int quantity = 1 + random.nextInt(4);
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(quantity));
            total = total.add(subtotal);

            order.addItem(OrderItem.builder()
                    .dishName(name)
                    .category(CATEGORIES[random.nextInt(CATEGORIES.length)])
                    .price(price.setScale(2, RoundingMode.HALF_UP))
                    .quantity(quantity)
                    .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        return total;
    }
}
