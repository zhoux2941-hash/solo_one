package com.bookdrift.service;

import com.bookdrift.entity.Book;
import com.bookdrift.entity.User;
import com.bookdrift.repository.BookRepository;
import com.bookdrift.repository.CheckInRepository;
import com.bookdrift.repository.DriftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private DriftRepository driftRepository;

    @Autowired
    private UserService userService;

    public Book publish(Book book) {
        book.setStatus("AVAILABLE");
        return bookRepository.save(book);
    }

    public List<Book> findAll() {
        List<Book> books = bookRepository.findAllOrderByCreateTimeDesc();
        books.forEach(this::enrichBook);
        return books;
    }

    public List<Book> findAvailableBooks() {
        List<Book> books = bookRepository.findAvailableBooks();
        books.forEach(this::enrichBook);
        return books;
    }

    public List<Book> findByOwnerId(Long ownerId) {
        List<Book> books = bookRepository.findByOwnerId(ownerId);
        books.forEach(this::enrichBook);
        return books;
    }

    public Book findById(Long id) {
        Book book = bookRepository.findById(id).orElse(null);
        if (book != null) {
            enrichBook(book);
        }
        return book;
    }

    public Book update(Book book) {
        return bookRepository.save(book);
    }

    public void delete(Long id) {
        bookRepository.deleteById(id);
    }

    public List<Book> getPopularBooks() {
        List<Book> books = bookRepository.findTop10PopularBooks();
        books.forEach(this::enrichBook);
        return books.stream().limit(10).collect(Collectors.toList());
    }

    private void enrichBook(Book book) {
        User owner = userService.findById(book.getOwnerId());
        if (owner != null) {
            book.setOwnerName(owner.getNickname());
        }
        
        int checkinCount = checkInRepository.countByBookId(book.getId());
        book.setTotalCheckins(checkinCount);
        
        int borrowCount = driftRepository.countByBookId(book.getId());
        book.setBorrowCount(borrowCount);
        
        Double avgProgress = checkInRepository.avgProgressByBookId(book.getId());
        book.setAvgProgress(avgProgress != null ? avgProgress : 0.0);
    }
}
