package com.example.trashbin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.trashbin.dto.RankDTO;
import com.example.trashbin.entity.GarbageRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GarbageRecordMapper extends BaseMapper<GarbageRecord> {

    List<RankDTO> getMonthlyRank(@Param("year") Integer year, 
                                 @Param("month") Integer month, 
                                 @Param("limit") Integer limit);

    List<RankDTO> getTotalRank(@Param("limit") Integer limit);
}
