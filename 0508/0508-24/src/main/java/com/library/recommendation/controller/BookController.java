package com.library.recommendation.controller;

import com.library.recommendation.common.Result;
import com.library.recommendation.entity.Book;
import com.library.recommendation.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@Tag(name = "书籍管理", description = "书籍相关接口")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    @Operation(summary = "获取所有书籍列表")
    public Result<List<Book>> list() {
        return Result.success(bookService.list());
    }

    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取书籍信息")
    public Result<Book> getById(@PathVariable Long id) {
        return Result.success(bookService.getById(id));
    }

    @GetMapping("/tag/{tag}")
    @Operation(summary = "根据标签获取书籍")
    public Result<List<Book>> findBooksByTag(@PathVariable String tag) {
        return Result.success(bookService.findBooksByTag(tag));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "根据类别获取书籍")
    public Result<List<Book>> findBooksByCategory(@PathVariable String category) {
        return Result.success(bookService.findBooksByCategory(category));
    }

    @GetMapping("/categories")
    @Operation(summary = "获取所有类别")
    public Result<List<String>> findAllCategories() {
        return Result.success(bookService.findAllCategories());
    }

    @GetMapping("/tags")
    @Operation(summary = "获取所有标签")
    public Result<List<String>> findAllTags() {
        return Result.success(bookService.findAllTags());
    }

    @PostMapping
    @Operation(summary = "新增书籍")
    public Result<Book> save(@RequestBody Book book) {
        return Result.success(bookService.save(book));
    }

    @PutMapping
    @Operation(summary = "更新书籍信息")
    public Result<Book> update(@RequestBody Book book) {
        return Result.success(bookService.update(book));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除书籍")
    public Result<Void> delete(@PathVariable Long id) {
        bookService.delete(id);
        return Result.success();
    }
}
