package com.fulfillment.order.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface DistributedLockMapper {

    int insertLock(@Param("lockKey") String lockKey,
                    @Param("holder") String holder,
                    @Param("lockTime") LocalDateTime lockTime,
                    @Param("expireTime") LocalDateTime expireTime);

    int updateLock(@Param("lockKey") String lockKey,
                    @Param("oldHolder") String oldHolder,
                    @Param("newHolder") String newHolder,
                    @Param("lockTime") LocalDateTime lockTime,
                    @Param("expireTime") LocalDateTime expireTime,
                    @Param("version") Integer version);

    int tryAcquireLock(@Param("lockKey") String lockKey,
                        @Param("holder") String holder,
                        @Param("lockTime") LocalDateTime lockTime,
                        @Param("expireTime") LocalDateTime expireTime,
                        @Param("now") LocalDateTime now);

    int releaseLock(@Param("lockKey") String lockKey,
                     @Param("holder") String holder);

    int deleteExpiredLocks(@Param("now") LocalDateTime now);

    String getLockHolder(@Param("lockKey") String lockKey);
}
