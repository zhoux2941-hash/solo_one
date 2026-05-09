package com.library.recommendation.controller;

import com.library.recommendation.common.Result;
import com.library.recommendation.entity.BorrowRecord;
import com.library.recommendation.service.BorrowRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrow")
@Tag(name = "借阅管理", description = "借阅相关接口")
public class BorrowController {

    private final BorrowRecordService borrowRecordService;

    public BorrowController(BorrowRecordService borrowRecordService) {
        this.borrowRecordService = borrowRecordService;
    }

    @PostMapping("/{readerId}/{bookId}")
    @Operation(summary = "借阅书籍")
    public Result<BorrowRecord> borrowBook(@PathVariable Long readerId, @PathVariable Long bookId) {
        return Result.success(borrowRecordService.borrowBook(readerId, bookId));
    }

    @PostMapping("/return/{recordId}")
    @Operation(summary = "归还书籍")
    public Result<Void> returnBook(@PathVariable Long recordId) {
        borrowRecordService.returnBook(recordId);
        return Result.success();
    }

    @GetMapping("/reader/{readerId}")
    @Operation(summary = "获取读者借阅记录")
    public Result<List<BorrowRecord>> getByReaderId(@PathVariable Long readerId) {
        return Result.success(borrowRecordService.findByReaderId(readerId));
    }
}
