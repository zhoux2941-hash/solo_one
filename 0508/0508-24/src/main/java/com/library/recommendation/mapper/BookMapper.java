package com.library.recommendation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.recommendation.entity.Book;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BookMapper extends BaseMapper<Book> {

    @Select("SELECT * FROM book WHERE FIND_IN_SET(#{tag}, tags) > 0")
    List<Book> findBooksByTag(@Param("tag") String tag);

    @Select("SELECT * FROM book WHERE category = #{category}")
    List<Book> findBooksByCategory(@Param("category") String category);

    @Select("SELECT DISTINCT category FROM book")
    List<String> findAllCategories();

    @Select("SELECT DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', n.n), ',', -1) as tag " +
            "FROM book CROSS JOIN (" +
            "SELECT 1 as n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5" +
            ") n " +
            "WHERE n.n <= (LENGTH(tags) - LENGTH(REPLACE(tags, ',', '')) + 1) " +
            "AND tags IS NOT NULL AND tags != ''")
    List<String> findAllTags();
}
