package com.bookdrift.service;

import com.bookdrift.entity.Book;
import com.bookdrift.entity.Drift;
import com.bookdrift.entity.User;
import com.bookdrift.repository.DriftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DriftService {

    @Autowired
    private DriftRepository driftRepository;

    @Autowired
    private BookService bookService;

    @Autowired
    private UserService userService;

    public Drift requestDrift(Drift drift) {
        Book book = bookService.findById(drift.getBookId());
        if (book == null) {
            throw new RuntimeException("图书不存在");
        }
        if (!"AVAILABLE".equals(book.getStatus())) {
            throw new RuntimeException("图书不可借阅");
        }
        if (book.getOwnerId().equals(drift.getRequesterId())) {
            throw new RuntimeException("不能借阅自己的图书");
        }

        boolean hasPendingOrActiveDrift = driftRepository.existsPendingOrActiveDrift(
                drift.getBookId(), drift.getRequesterId());
        if (hasPendingOrActiveDrift) {
            throw new RuntimeException("您已申请过该图书，请等待审核或完成当前漂流");
        }

        drift.setOwnerId(book.getOwnerId());
        drift.setStatus("PENDING");
        return driftRepository.save(drift);
    }

    public Drift confirmDrift(Long driftId) {
        Drift drift = driftRepository.findById(driftId)
                .orElseThrow(() -> new RuntimeException("漂流申请不存在"));

        if (!"PENDING".equals(drift.getStatus())) {
            throw new RuntimeException("申请状态不正确");
        }

        drift.setStatus("DRIFTING");
        drift.setConfirmTime(LocalDateTime.now());
        drift = driftRepository.save(drift);

        Book book = bookService.findById(drift.getBookId());
        book.setStatus("DRIFTING");
        bookService.update(book);

        return drift;
    }

    public Drift rejectDrift(Long driftId) {
        Drift drift = driftRepository.findById(driftId)
                .orElseThrow(() -> new RuntimeException("漂流申请不存在"));

        if (!"PENDING".equals(drift.getStatus())) {
            throw new RuntimeException("申请状态不正确");
        }

        drift.setStatus("REJECTED");
        return driftRepository.save(drift);
    }

    public Drift completeDrift(Long driftId) {
        Drift drift = driftRepository.findById(driftId)
                .orElseThrow(() -> new RuntimeException("漂流记录不存在"));

        if (!"DRIFTING".equals(drift.getStatus())) {
            throw new RuntimeException("漂流状态不正确");
        }

        drift.setStatus("COMPLETED");
        drift.setActualReturnDate(java.time.LocalDate.now());
        drift.setCompleteTime(LocalDateTime.now());
        drift = driftRepository.save(drift);

        Book book = bookService.findById(drift.getBookId());
        book.setStatus("AVAILABLE");
        bookService.update(book);

        return drift;
    }

    public List<Drift> findByRequesterId(Long requesterId) {
        List<Drift> drifts = driftRepository.findByRequesterId(requesterId);
        drifts.forEach(this::enrichDrift);
        return drifts;
    }

    public List<Drift> findByOwnerId(Long ownerId) {
        List<Drift> drifts = driftRepository.findByOwnerId(ownerId);
        drifts.forEach(this::enrichDrift);
        return drifts;
    }

    public List<Drift> findActiveDriftsByRequesterId(Long requesterId) {
        List<Drift> drifts = driftRepository.findActiveDriftsByRequesterId(requesterId);
        drifts.forEach(this::enrichDrift);
        return drifts;
    }

    public Drift findById(Long id) {
        Drift drift = driftRepository.findById(id).orElse(null);
        if (drift != null) {
            enrichDrift(drift);
        }
        return drift;
    }

    public Optional<Drift> findActiveDriftByBookId(Long bookId) {
        return driftRepository.findActiveDriftByBookId(bookId);
    }

    private void enrichDrift(Drift drift) {
        Book book = bookService.findById(drift.getBookId());
        if (book != null) {
            drift.setBookTitle(book.getTitle());
        }

        User requester = userService.findById(drift.getRequesterId());
        if (requester != null) {
            drift.setRequesterName(requester.getNickname());
        }

        User owner = userService.findById(drift.getOwnerId());
        if (owner != null) {
            drift.setOwnerName(owner.getNickname());
        }
    }
}
