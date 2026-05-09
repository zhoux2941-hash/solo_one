package com.library.recommendation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.recommendation.entity.Reader;
import com.library.recommendation.mapper.ReaderMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReaderService {

    private final ReaderMapper readerMapper;

    public ReaderService(ReaderMapper readerMapper) {
        this.readerMapper = readerMapper;
    }

    public List<Reader> list() {
        return readerMapper.selectList(null);
    }

    public Reader getById(Long id) {
        return readerMapper.selectById(id);
    }

    public Reader save(Reader reader) {
        readerMapper.insert(reader);
        return reader;
    }

    public Reader update(Reader reader) {
        readerMapper.updateById(reader);
        return reader;
    }

    public void delete(Long id) {
        readerMapper.deleteById(id);
    }

    public Reader getByName(String name) {
        return readerMapper.selectOne(new LambdaQueryWrapper<Reader>().eq(Reader::getName, name));
    }
}
