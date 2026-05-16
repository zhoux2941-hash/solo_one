package com.bookdrift.repository;

import com.bookdrift.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByOwnerId(Long ownerId);

    List<Book> findByStatus(String status);

    @Query("SELECT b FROM Book b WHERE b.status = 'AVAILABLE' ORDER BY b.createTime DESC")
    List<Book> findAvailableBooks();

    @Query("SELECT b FROM Book b ORDER BY b.createTime DESC")
    List<Book> findAllOrderByCreateTimeDesc();

    @Query("SELECT b FROM Book b JOIN Drift d ON b.id = d.bookId WHERE d.status != 'REJECTED' GROUP BY b.id ORDER BY COUNT(d.id) DESC")
    List<Book> findTop10PopularBooks();
}
