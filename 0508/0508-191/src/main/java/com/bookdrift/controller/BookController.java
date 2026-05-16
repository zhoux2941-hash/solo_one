package com.bookdrift.controller;

import com.bookdrift.entity.Book;
import com.bookdrift.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    @Autowired
    private BookService bookService;

    @PostMapping
    public ResponseEntity<?> publish(@RequestBody Book book) {
        try {
            Book publishedBook = bookService.publish(book);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "发布成功");
            result.put("data", publishedBook);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<Book> books = bookService.findAll();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", books);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailableBooks() {
        List<Book> books = bookService.findAvailableBooks();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", books);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/popular")
    public ResponseEntity<?> getPopularBooks() {
        List<Book> books = bookService.getPopularBooks();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", books);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> getByOwnerId(@PathVariable Long ownerId) {
        List<Book> books = bookService.findByOwnerId(ownerId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", books);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Book book = bookService.findById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", book);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Book book) {
        book.setId(id);
        Book updatedBook = bookService.update(book);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", updatedBook);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        bookService.delete(id);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "删除成功");
        return ResponseEntity.ok(result);
    }
}
