package com.library.recommendation.service;

import com.library.recommendation.entity.Book;
import com.library.recommendation.mapper.BookMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookService {

    private final BookMapper bookMapper;

    public BookService(BookMapper bookMapper) {
        this.bookMapper = bookMapper;
    }

    public List<Book> list() {
        return bookMapper.selectList(null);
    }

    public Book getById(Long id) {
        return bookMapper.selectById(id);
    }

    public Book save(Book book) {
        bookMapper.insert(book);
        return book;
    }

    public Book update(Book book) {
        bookMapper.updateById(book);
        return book;
    }

    public void delete(Long id) {
        bookMapper.deleteById(id);
    }

    public List<Book> findBooksByTag(String tag) {
        return bookMapper.findBooksByTag(tag);
    }

    public List<Book> findBooksByCategory(String category) {
        return bookMapper.findBooksByCategory(category);
    }

    public List<String> findAllCategories() {
        return bookMapper.findAllCategories();
    }

    public List<String> findAllTags() {
        return bookMapper.findAllTags();
    }

    public List<Book> getBooksByIds(List<Long> bookIds) {
        return bookMapper.selectBatchIds(bookIds);
    }
}
