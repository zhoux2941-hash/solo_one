package com.library.recommendation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.recommendation.entity.BorrowRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface BorrowRecordMapper extends BaseMapper<BorrowRecord> {

    @Select("SELECT * FROM borrow_record WHERE reader_id = #{readerId} ORDER BY borrow_time DESC")
    List<BorrowRecord> findByReaderId(@Param("readerId") Long readerId);

    @Select("SELECT DISTINCT book_id FROM borrow_record WHERE reader_id = #{readerId}")
    List<Long> findBorrowedBookIdsByReaderId(@Param("readerId") Long readerId);

    @Select("SELECT DATE_FORMAT(borrow_time, '%Y-%m') as month, " +
            "COUNT(*) as count " +
            "FROM borrow_record " +
            "WHERE reader_id = #{readerId} " +
            "GROUP BY DATE_FORMAT(borrow_time, '%Y-%m') " +
            "ORDER BY month")
    List<Map<String, Object>> findMonthlyBorrowCountByReader(@Param("readerId") Long readerId);

    @Select("SELECT DATE_FORMAT(br.borrow_time, '%Y-%m') as month, " +
            "SUBSTRING_INDEX(SUBSTRING_INDEX(br.tags, ',', n.n), ',', -1) as tag, " +
            "COUNT(*) as weight " +
            "FROM borrow_record br " +
            "CROSS JOIN (" +
            "SELECT 1 as n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5" +
            ") n " +
            "WHERE br.reader_id = #{readerId} " +
            "AND br.borrow_time >= #{startTime} " +
            "AND n.n <= (LENGTH(br.tags) - LENGTH(REPLACE(br.tags, ',', '')) + 1) " +
            "AND br.tags IS NOT NULL AND br.tags != '' " +
            "GROUP BY month, tag " +
            "ORDER BY month")
    List<Map<String, Object>> findMonthlyTagWeightsByReader(@Param("readerId") Long readerId,
                                                             @Param("startTime") LocalDateTime startTime);

    @Select("SELECT DATE_FORMAT(br.borrow_time, '%Y-%m') as month, " +
            "COUNT(DISTINCT br.category) as category_count " +
            "FROM borrow_record br " +
            "WHERE br.reader_id = #{readerId} " +
            "GROUP BY DATE_FORMAT(br.borrow_time, '%Y-%m') " +
            "ORDER BY month")
    List<Map<String, Object>> findMonthlyCategoryCountByReader(@Param("readerId") Long readerId);

    @Select("SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(br.tags, ',', n.n), ',', -1) as tag, " +
            "DATE_FORMAT(br.borrow_time, '%Y-%m') as month, " +
            "COUNT(*) as count " +
            "FROM borrow_record br " +
            "CROSS JOIN (" +
            "SELECT 1 as n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5" +
            ") n " +
            "WHERE br.borrow_time >= #{startTime} " +
            "AND n.n <= (LENGTH(br.tags) - LENGTH(REPLACE(br.tags, ',', '')) + 1) " +
            "AND br.tags IS NOT NULL AND br.tags != '' " +
            "GROUP BY tag, month " +
            "ORDER BY month, count DESC")
    List<Map<String, Object>> findAllMonthlyTagCounts(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT DISTINCT reader_id FROM borrow_record")
    List<Long> findAllReaderIds();

    @Select("SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(br.tags, ',', n.n), ',', -1) as tag, " +
            "COUNT(*) as total_count " +
            "FROM borrow_record br " +
            "CROSS JOIN (" +
            "SELECT 1 as n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5" +
            ") n " +
            "WHERE n.n <= (LENGTH(br.tags) - LENGTH(REPLACE(br.tags, ',', '')) + 1) " +
            "AND br.tags IS NOT NULL AND br.tags != '' " +
            "GROUP BY tag " +
            "ORDER BY total_count DESC " +
            "LIMIT #{limit}")
    List<Map<String, Object>> findTopTags(@Param("limit") int limit);
}
