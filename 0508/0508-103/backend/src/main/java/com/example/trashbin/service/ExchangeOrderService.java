package com.example.trashbin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.trashbin.common.OrderStatus;
import com.example.trashbin.dto.ExchangeOrderDTO;
import com.example.trashbin.entity.ExchangeOrder;
import com.example.trashbin.entity.Product;
import com.example.trashbin.entity.Resident;
import com.example.trashbin.mapper.ExchangeOrderMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class ExchangeOrderService extends ServiceImpl<ExchangeOrderMapper, ExchangeOrder> {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ResidentService residentService;

    @Autowired
    private ProductService productService;

    private static final String POINTS_KEY_PREFIX = "resident:points:";
    private static final String REQUEST_LOCK_PREFIX = "order:lock:";
    private static final String RESULT_CACHE_PREFIX = "order:result:";

    private static final String DEDUCT_POINTS_SCRIPT = 
            "local current = redis.call('get', KEYS[1])\n" +
            "if current == false then\n" +
            "    return -1\n" +
            "end\n" +
            "local newPoints = tonumber(current) - tonumber(ARGV[1])\n" +
            "if newPoints < 0 then\n" +
            "    return -2\n" +
            "end\n" +
            "redis.call('set', KEYS[1], newPoints)\n" +
            "redis.call('expire', KEYS[1], 86400)\n" +
            "return newPoints";

    private static final String REFUND_POINTS_SCRIPT = 
            "local current = redis.call('get', KEYS[1])\n" +
            "if current == false then\n" +
            "    current = 0\n" +
            "end\n" +
            "local newPoints = tonumber(current) + tonumber(ARGV[1])\n" +
            "redis.call('set', KEYS[1], newPoints)\n" +
            "redis.call('expire', KEYS[1], 86400)\n" +
            "return newPoints";

    private static final String TRY_LOCK_SCRIPT =
            "local result = redis.call('set', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2])\n" +
            "if result == 'OK' then\n" +
            "    return 1\n" +
            "else\n" +
            "    return 0\n" +
            "end";

    @Transactional(rollbackFor = Exception.class)
    public ExchangeOrder createOrder(ExchangeOrderDTO dto) {
        String requestId = dto.getRequestId();
        if (requestId == null || requestId.isEmpty()) {
            requestId = UUID.randomUUID().toString().replace("-", "");
        }

        String lockKey = REQUEST_LOCK_PREFIX + requestId;
        String resultKey = RESULT_CACHE_PREFIX + requestId;

        ExchangeOrder cachedOrder = (ExchangeOrder) redisTemplate.opsForValue().get(resultKey);
        if (cachedOrder != null) {
            return cachedOrder;
        }

        DefaultRedisScript<Long> lockScript = new DefaultRedisScript<>();
        lockScript.setScriptText(TRY_LOCK_SCRIPT);
        lockScript.setResultType(Long.class);

        String lockValue = UUID.randomUUID().toString();
        Long lockResult = redisTemplate.execute(
                lockScript,
                Collections.singletonList(lockKey),
                lockValue,
                10000
        );

        if (lockResult == null || lockResult == 0) {
            int retryCount = 0;
            while (retryCount < 10) {
                cachedOrder = (ExchangeOrder) redisTemplate.opsForValue().get(resultKey);
                if (cachedOrder != null) {
                    return cachedOrder;
                }
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("请求被中断");
                }
                retryCount++;
            }
            throw new RuntimeException("请求处理中，请稍后重试");
        }

        try {
            Resident resident = residentService.getById(dto.getResidentId());
            if (resident == null) {
                throw new RuntimeException("居民不存在");
            }

            Product product = productService.getById(dto.getProductId());
            if (product == null) {
                throw new RuntimeException("商品不存在");
            }

            if (product.getStock() < dto.getQuantity()) {
                throw new RuntimeException("库存不足");
            }

            int totalPoints = product.getPointsRequired() * dto.getQuantity();

            String key = POINTS_KEY_PREFIX + dto.getResidentId();
            Integer currentPoints = (Integer) redisTemplate.opsForValue().get(key);
            if (currentPoints == null) {
                currentPoints = resident.getPoints();
                redisTemplate.opsForValue().set(key, currentPoints, 24, TimeUnit.HOURS);
            }

            if (currentPoints < totalPoints) {
                throw new RuntimeException("积分不足");
            }

            DefaultRedisScript<Long> script = new DefaultRedisScript<>();
            script.setScriptText(DEDUCT_POINTS_SCRIPT);
            script.setResultType(Long.class);

            Long result = redisTemplate.execute(
                    script,
                    Collections.singletonList(key),
                    totalPoints
            );

            if (result == -1) {
                throw new RuntimeException("积分数据异常，请重试");
            }
            if (result == -2) {
                throw new RuntimeException("积分不足");
            }

            if (!productService.decreaseStock(dto.getProductId(), dto.getQuantity())) {
                throw new RuntimeException("扣减库存失败");
            }

            resident.setPoints(result.intValue());
            residentService.updateById(resident);

            ExchangeOrder order = new ExchangeOrder();
            order.setOrderNo(generateOrderNo());
            order.setResidentId(dto.getResidentId());
            order.setProductId(dto.getProductId());
            order.setProductName(product.getName());
            order.setQuantity(dto.getQuantity());
            order.setPointsConsumed(totalPoints);
            order.setStatus(OrderStatus.PENDING);
            this.save(order);

            redisTemplate.opsForValue().set(resultKey, order, 60, TimeUnit.SECONDS);

            return order;
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public ExchangeOrder verifyOrder(Long orderId) {
        ExchangeOrder order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        if (!OrderStatus.PENDING.equals(order.getStatus())) {
            throw new RuntimeException("订单状态不正确，无法核销");
        }

        order.setStatus(OrderStatus.VERIFIED);
        order.setVerifyTime(LocalDateTime.now());
        this.updateById(order);

        return order;
    }

    @Transactional(rollbackFor = Exception.class)
    public ExchangeOrder cancelOrder(Long orderId) {
        ExchangeOrder order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        if (!OrderStatus.PENDING.equals(order.getStatus())) {
            throw new RuntimeException("订单状态不正确，无法取消");
        }

        productService.increaseStock(order.getProductId(), order.getQuantity());

        String key = POINTS_KEY_PREFIX + order.getResidentId();
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(REFUND_POINTS_SCRIPT);
        script.setResultType(Long.class);

        Long newPoints = redisTemplate.execute(
                script,
                Collections.singletonList(key),
                order.getPointsConsumed()
        );

        Resident resident = residentService.getById(order.getResidentId());
        if (resident != null) {
            resident.setPoints(newPoints.intValue());
            residentService.updateById(resident);
        }

        order.setStatus(OrderStatus.CANCELLED);
        this.updateById(order);

        return order;
    }

    public List<ExchangeOrder> listAll() {
        LambdaQueryWrapper<ExchangeOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(ExchangeOrder::getCreateTime);
        return this.list(wrapper);
    }

    public List<ExchangeOrder> getByResidentId(Long residentId) {
        LambdaQueryWrapper<ExchangeOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExchangeOrder::getResidentId, residentId)
               .orderByDesc(ExchangeOrder::getCreateTime);
        return this.list(wrapper);
    }

    public List<ExchangeOrder> getByStatus(String status) {
        LambdaQueryWrapper<ExchangeOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExchangeOrder::getStatus, status)
               .orderByDesc(ExchangeOrder::getCreateTime);
        return this.list(wrapper);
    }

    private String generateOrderNo() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        Random random = new Random();
        String suffix = String.format("%04d", random.nextInt(10000));
        return "ORD" + timestamp + suffix;
    }
}
