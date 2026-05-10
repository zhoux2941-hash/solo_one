package com.example.chemical.service;

import com.example.chemical.dto.ApplicationRequest;
import com.example.chemical.entity.Application;
import com.example.chemical.entity.Chemical;
import com.example.chemical.entity.User;
import com.example.chemical.repository.ApplicationRepository;
import com.example.chemical.repository.ChemicalRepository;
import com.example.chemical.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ChemicalRepository chemicalRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private NotificationService notificationService;

    @Value("${app.approval.deadline:24}")
    private int approvalDeadlineHours;

    private static final String APPROVAL_KEY_PREFIX = "approval:";
    private static final String APPROVAL_LOCK_PREFIX = "approval:lock:";

    private static final String CHECK_AND_DELETE_SCRIPT = 
        "if redis.call('exists', KEYS[1]) == 1 then " +
        "  redis.call('del', KEYS[1]) " +
        "  return 1 " +
        "else " +
        "  return 0 " +
        "end";

    private static final String TRY_LOCK_SCRIPT =
        "if redis.call('setnx', KEYS[1], ARGV[1]) == 1 then " +
        "  redis.call('expire', KEYS[1], ARGV[2]) " +
        "  return 1 " +
        "else " +
        "  return 0 " +
        "end";

    private static final String RELEASE_LOCK_SCRIPT =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "  return redis.call('del', KEYS[1]) " +
        "else " +
        "  return 0 " +
        "end";

    @Transactional
    public Application createApplication(User applicant, ApplicationRequest request) {
        Chemical chemical = chemicalRepository.findById(request.getChemicalId())
                .orElseThrow(() -> new RuntimeException("Chemical not found"));

        if (request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Quantity must be positive");
        }

        if (request.getPlannedReturnDate() == null) {
            throw new RuntimeException("Planned return date is required");
        }

        if (request.getPlannedReturnDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Planned return date cannot be in the past");
        }

        Application application = new Application();
        application.setApplicant(applicant);
        application.setChemical(chemical);
        application.setQuantity(request.getQuantity());
        application.setPurpose(request.getPurpose());
        application.setExpectedDate(request.getExpectedDate());
        application.setPlannedReturnDate(request.getPlannedReturnDate());
        application.setStatus(Application.ApplicationStatus.PENDING_FIRST_REVIEW);
        application.setIsOverdue(false);

        return applicationRepository.save(application);
    }

    @Transactional
    public Application firstReview(Long applicationId, User safetyOfficer, boolean approved, String comment) {
        Application application = applicationRepository.findByIdWithLock(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != Application.ApplicationStatus.PENDING_FIRST_REVIEW) {
            throw new RuntimeException("Application is not pending first review");
        }

        application.setSafetyOfficer(safetyOfficer);
        application.setSafetyReviewTime(LocalDateTime.now());
        application.setSafetyComment(comment);

        if (approved) {
            application.setStatus(Application.ApplicationStatus.PENDING_SECOND_REVIEW);
            String redisKey = APPROVAL_KEY_PREFIX + applicationId;
            redisTemplate.opsForValue().set(redisKey, applicationId, approvalDeadlineHours, TimeUnit.HOURS);
        } else {
            application.setStatus(Application.ApplicationStatus.FIRST_REVIEW_REJECTED);
        }

        Application saved;
        try {
            saved = applicationRepository.save(application);
        } catch (OptimisticLockingFailureException e) {
            throw new RuntimeException("Application has been modified by another user, please try again");
        }

        return saved;
    }

    @Transactional
    public Application secondReview(Long applicationId, User director, boolean approved, String comment) {
        String lockKey = APPROVAL_LOCK_PREFIX + applicationId;
        String lockValue = String.valueOf(System.currentTimeMillis());
        DefaultRedisScript<Long> tryLockScript = new DefaultRedisScript<>(TRY_LOCK_SCRIPT, Long.class);
        
        Long locked = redisTemplate.execute(tryLockScript, Collections.singletonList(lockKey), lockValue, "60");
        
        if (locked == null || locked == 0) {
            throw new RuntimeException("Application is being reviewed by another user, please try again later");
        }

        try {
            Application application = applicationRepository.findByIdWithLock(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found"));

            if (application.getStatus() != Application.ApplicationStatus.PENDING_SECOND_REVIEW) {
                throw new RuntimeException("Application is not pending second review");
            }

            String redisKey = APPROVAL_KEY_PREFIX + applicationId;
            DefaultRedisScript<Long> checkAndDeleteScript = new DefaultRedisScript<>(CHECK_AND_DELETE_SCRIPT, Long.class);
            
            Long deleted = redisTemplate.execute(checkAndDeleteScript, Collections.singletonList(redisKey));
            
            if (deleted == null || deleted == 0) {
                application.setStatus(Application.ApplicationStatus.AUTO_REJECTED);
                return applicationRepository.save(application);
            }

            application.setDirector(director);
            application.setDirectorReviewTime(LocalDateTime.now());
            application.setDirectorComment(comment);

            if (approved) {
                Chemical chemical = chemicalRepository.findByIdWithLock(application.getChemical().getId())
                        .orElseThrow(() -> new RuntimeException("Chemical not found"));

                BigDecimal currentStock = chemical.getCurrentStock();
                BigDecimal requestedQuantity = application.getQuantity();

                if (currentStock.compareTo(requestedQuantity) < 0) {
                    redisTemplate.opsForValue().set(redisKey, applicationId, approvalDeadlineHours, TimeUnit.HOURS);
                    throw new RuntimeException("Insufficient stock");
                }

                chemical.setCurrentStock(currentStock.subtract(requestedQuantity));
                chemicalRepository.save(chemical);

                application.setStatus(Application.ApplicationStatus.COMPLETED);
            } else {
                application.setStatus(Application.ApplicationStatus.SECOND_REVIEW_REJECTED);
            }

            Application saved;
            try {
                saved = applicationRepository.save(application);
            } catch (OptimisticLockingFailureException e) {
                redisTemplate.opsForValue().set(redisKey, applicationId, approvalDeadlineHours, TimeUnit.HOURS);
                throw new RuntimeException("Application has been modified by another user, please try again");
            }

            return saved;
        } finally {
            DefaultRedisScript<Long> releaseLockScript = new DefaultRedisScript<>(RELEASE_LOCK_SCRIPT, Long.class);
            redisTemplate.execute(releaseLockScript, Collections.singletonList(lockKey), lockValue);
        }
    }

    @Transactional
    public Application returnChemical(Long applicationId, User user, String overdueReason) {
        Application application = applicationRepository.findByIdWithLock(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != Application.ApplicationStatus.COMPLETED && 
            application.getStatus() != Application.ApplicationStatus.OVERDUE) {
            throw new RuntimeException("Application is not in a returnable state");
        }

        if (!application.getApplicant().getId().equals(user.getId())) {
            throw new RuntimeException("You can only return your own application");
        }

        if (application.getActualReturnTime() != null) {
            throw new RuntimeException("Application has already been returned");
        }

        application.setActualReturnTime(LocalDateTime.now());
        
        if (application.getIsOverdue()) {
            application.setOverdueReason(overdueReason);
        }

        application.setStatus(Application.ApplicationStatus.RETURNED);

        Chemical chemical = chemicalRepository.findByIdWithLock(application.getChemical().getId())
                .orElseThrow(() -> new RuntimeException("Chemical not found"));
        chemical.setCurrentStock(chemical.getCurrentStock().add(application.getQuantity()));
        chemicalRepository.save(chemical);

        Application saved;
        try {
            saved = applicationRepository.save(application);
        } catch (OptimisticLockingFailureException e) {
            throw new RuntimeException("Application has been modified by another user, please try again");
        }

        return saved;
    }

    @Transactional
    public void checkOverdueApplications() {
        LocalDate today = LocalDate.now();
        
        List<Application> completedApplications = applicationRepository.findByStatus(Application.ApplicationStatus.COMPLETED);
        
        for (Application application : completedApplications) {
            if (application.getPlannedReturnDate() != null && 
                application.getPlannedReturnDate().isBefore(today) &&
                application.getActualReturnTime() == null &&
                !application.getIsOverdue()) {
                
                application.setIsOverdue(true);
                application.setStatus(Application.ApplicationStatus.OVERDUE);
                
                notificationService.sendOverdueNotification(application.getApplicant(), application);
                
                applicationRepository.save(application);
            }
        }
    }

    @Transactional
    public void checkUpcomingReturns() {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysLater = today.plusDays(3);
        
        List<Application> completedApplications = applicationRepository.findByStatus(Application.ApplicationStatus.COMPLETED);
        
        for (Application application : completedApplications) {
            if (application.getPlannedReturnDate() != null && 
                !application.getPlannedReturnDate().isBefore(today) &&
                !application.getPlannedReturnDate().isAfter(threeDaysLater) &&
                application.getActualReturnTime() == null &&
                !application.getIsOverdue()) {
                
                notificationService.sendReturnReminder(application.getApplicant(), application);
            }
        }
    }

    public List<Application> getOverdueApplications() {
        return applicationRepository.findByStatus(Application.ApplicationStatus.OVERDUE);
    }

    public List<Application> getApplicationsByApplicant(Long applicantId) {
        return applicationRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId);
    }

    public List<Application> getPendingFirstReviewApplications() {
        return applicationRepository.findByStatus(Application.ApplicationStatus.PENDING_FIRST_REVIEW);
    }

    public List<Application> getPendingSecondReviewApplications() {
        List<Application> pendingList = applicationRepository.findByStatus(Application.ApplicationStatus.PENDING_SECOND_REVIEW);
        return pendingList.stream()
                .filter(app -> {
                    String redisKey = APPROVAL_KEY_PREFIX + app.getId();
                    Boolean exists = redisTemplate.hasKey(redisKey);
                    return exists != null && exists;
                })
                .toList();
    }

    public Optional<Application> getApplicationById(Long id) {
        return applicationRepository.findById(id);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkExpiredApprovals() {
        List<Application> pendingSecondReview = applicationRepository.findByStatus(Application.ApplicationStatus.PENDING_SECOND_REVIEW);
        
        for (Application application : pendingSecondReview) {
            String redisKey = APPROVAL_KEY_PREFIX + application.getId();
            Boolean exists = redisTemplate.hasKey(redisKey);
            if (exists == null || !exists) {
                application.setStatus(Application.ApplicationStatus.AUTO_REJECTED);
                applicationRepository.save(application);
            }
        }
    }

    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void scheduledOverdueCheck() {
        checkOverdueApplications();
    }

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void scheduledReturnReminder() {
        checkUpcomingReturns();
    }

    public Long getRemainingTime(Long applicationId) {
        String redisKey = APPROVAL_KEY_PREFIX + applicationId;
        return redisTemplate.getExpire(redisKey, TimeUnit.MINUTES);
    }
}
