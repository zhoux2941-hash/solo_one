package com.bookdrift.service;

import com.bookdrift.entity.Book;
import com.bookdrift.entity.CheckIn;
import com.bookdrift.entity.Drift;
import com.bookdrift.entity.User;
import com.bookdrift.repository.CheckInRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CheckInService {

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private DriftService driftService;

    @Autowired
    private BookService bookService;

    @Autowired
    private UserService userService;

    public CheckIn checkin(CheckIn checkIn) {
        Drift drift = driftService.findById(checkIn.getDriftId());
        if (drift == null) {
            throw new RuntimeException("漂流记录不存在");
        }
        if (!"DRIFTING".equals(drift.getStatus())) {
            throw new RuntimeException("漂流已结束，无法打卡");
        }
        if (!drift.getRequesterId().equals(checkIn.getUserId())) {
            throw new RuntimeException("只能为自己的漂流打卡");
        }

        if (checkIn.getCheckinDate() == null) {
            checkIn.setCheckinDate(LocalDate.now());
        }

        Optional<CheckIn> existingCheckin = checkInRepository.findByDriftIdAndCheckinDate(
                checkIn.getDriftId(), checkIn.getCheckinDate());
        if (existingCheckin.isPresent()) {
            throw new RuntimeException("今日已打卡");
        }

        checkIn.setBookId(drift.getBookId());

        Integer totalPagesRead = checkInRepository.sumPagesReadByDriftId(checkIn.getDriftId());
        if (totalPagesRead == null) {
            totalPagesRead = 0;
        }
        checkIn.setTotalPagesRead(totalPagesRead + checkIn.getPagesRead());

        Book book = bookService.findById(drift.getBookId());
        if (book != null && book.getTotalPages() != null && book.getTotalPages() > 0) {
            double progress = (double) checkIn.getTotalPagesRead() / book.getTotalPages() * 100;
            checkIn.setProgress(Math.min(progress, 100.0));
        } else {
            checkIn.setProgress(0.0);
        }

        return checkInRepository.save(checkIn);
    }

    public List<CheckIn> findByDriftId(Long driftId) {
        List<CheckIn> checkins = checkInRepository.findByDriftIdOrderByCheckinDateDesc(driftId);
        checkins.forEach(this::enrichCheckIn);
        return checkins;
    }

    public List<CheckIn> findByBookId(Long bookId) {
        List<CheckIn> checkins = checkInRepository.findByBookIdOrderByCheckinDateDesc(bookId);
        checkins.forEach(this::enrichCheckIn);
        return checkins;
    }

    public List<CheckIn> findByUserId(Long userId) {
        List<CheckIn> checkins = checkInRepository.findByUserIdOrderByCheckinDateDesc(userId);
        checkins.forEach(this::enrichCheckIn);
        return checkins;
    }

    public CheckIn findById(Long id) {
        CheckIn checkIn = checkInRepository.findById(id).orElse(null);
        if (checkIn != null) {
            enrichCheckIn(checkIn);
        }
        return checkIn;
    }

    private void enrichCheckIn(CheckIn checkIn) {
        Book book = bookService.findById(checkIn.getBookId());
        if (book != null) {
            checkIn.setBookTitle(book.getTitle());
        }

        User user = userService.findById(checkIn.getUserId());
        if (user != null) {
            checkIn.setUserName(user.getNickname());
        }
    }
}
