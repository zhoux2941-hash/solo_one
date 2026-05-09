package com.library.recommendation.service;

import com.library.recommendation.entity.Book;
import com.library.recommendation.entity.BorrowRecord;
import com.library.recommendation.mapper.BorrowRecordMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class BorrowRecordService {

    private final BorrowRecordMapper borrowRecordMapper;
    private final BookService bookService;
    private final InterestVectorService interestVectorService;
    private final CompletionRateService completionRateService;

    public BorrowRecordService(BorrowRecordMapper borrowRecordMapper,
                               BookService bookService,
                               InterestVectorService interestVectorService,
                               CompletionRateService completionRateService) {
        this.borrowRecordMapper = borrowRecordMapper;
        this.bookService = bookService;
        this.interestVectorService = interestVectorService;
        this.completionRateService = completionRateService;
    }

    @Transactional
    public BorrowRecord borrowBook(Long readerId, Long bookId) {
        Book book = bookService.getById(bookId);
        if (book == null) {
            throw new RuntimeException("书籍不存在");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueTime = completionRateService.calculateDueTime(book.getPages(), now);

        BorrowRecord record = new BorrowRecord();
        record.setReaderId(readerId);
        record.setBookId(bookId);
        record.setBorrowTime(now);
        record.setDueTime(dueTime);
        record.setCategory(book.getCategory());
        record.setTags(book.getTags());
        record.setPages(book.getPages());
        borrowRecordMapper.insert(record);

        interestVectorService.updateInterestVector(readerId, record);

        return record;
    }

    public void returnBook(Long recordId) {
        BorrowRecord record = borrowRecordMapper.selectById(recordId);
        if (record != null) {
            record.setReturnTime(LocalDateTime.now());
            borrowRecordMapper.updateById(record);
        }
    }

    public List<BorrowRecord> findByReaderId(Long readerId) {
        return borrowRecordMapper.findByReaderId(readerId);
    }

    public List<Long> findBorrowedBookIdsByReaderId(Long readerId) {
        return borrowRecordMapper.findBorrowedBookIdsByReaderId(readerId);
    }

    public List<Map<String, Object>> findMonthlyBorrowCountByReader(Long readerId) {
        return borrowRecordMapper.findMonthlyBorrowCountByReader(readerId);
    }

    public List<Map<String, Object>> findMonthlyTagWeightsByReader(Long readerId, LocalDateTime startTime) {
        return borrowRecordMapper.findMonthlyTagWeightsByReader(readerId, startTime);
    }

    public List<Map<String, Object>> findMonthlyCategoryCountByReader(Long readerId) {
        return borrowRecordMapper.findMonthlyCategoryCountByReader(readerId);
    }

    public List<Map<String, Object>> findAllMonthlyTagCounts(LocalDateTime startTime) {
        return borrowRecordMapper.findAllMonthlyTagCounts(startTime);
    }

    public List<Long> findAllReaderIds() {
        return borrowRecordMapper.findAllReaderIds();
    }

    public List<Map<String, Object>> findTopTags(int limit) {
        return borrowRecordMapper.findTopTags(limit);
    }
}
