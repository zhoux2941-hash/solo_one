package com.community.platform.service;

import com.community.platform.dto.ApplicationRequest;
import com.community.platform.dto.PageResult;
import com.community.platform.dto.SubmissionRequest;
import com.community.platform.dto.TaskRequest;
import com.community.platform.entity.*;
import com.community.platform.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskApplicationRepository taskApplicationRepository;

    @Autowired
    private TaskSubmissionRepository taskSubmissionRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.05");

    public Task publishTask(TaskRequest request) {
        User publisher = userRepository.findById(request.getPublisherId())
                .orElseThrow(() -> new RuntimeException("发布者不存在"));

        if (publisher.getBalance().compareTo(request.getReward()) < 0) {
            throw new RuntimeException("余额不足，无法发布任务");
        }

        publisher.setBalance(publisher.getBalance().subtract(request.getReward()));
        userRepository.save(publisher);

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setReward(request.getReward());
        task.setDeadline(request.getDeadline());
        task.setRequiredSkills(request.getRequiredSkills());
        task.setPublisher(publisher);
        task.setStatus("PUBLISHED");

        return taskRepository.save(task);
    }

    public List<Task> getPublishedTasks() {
        return taskRepository.findPublishedTasksOrderByCreateTimeDesc();
    }

    public PageResult<Task> getPublishedTasks(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Task> taskPage = taskRepository.findPublishedTasksOrderByCreateTimeDesc(pageable);
        return new PageResult<>(
            taskPage.getContent(),
            taskPage.getTotalPages(),
            taskPage.getTotalElements(),
            taskPage.getNumber(),
            taskPage.getSize()
        );
    }

    public List<Task> getTasksByPublisher(Long publisherId) {
        return taskRepository.findByPublisherId(publisherId);
    }

    public PageResult<Task> getTasksByPublisher(Long publisherId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Task> taskPage = taskRepository.findByPublisherId(publisherId, pageable);
        return new PageResult<>(
            taskPage.getContent(),
            taskPage.getTotalPages(),
            taskPage.getTotalElements(),
            taskPage.getNumber(),
            taskPage.getSize()
        );
    }

    public List<Task> getTasksByAccepter(Long accepterId) {
        return taskRepository.findByAccepterId(accepterId);
    }

    public PageResult<Task> getTasksByAccepter(Long accepterId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Task> taskPage = taskRepository.findByAccepterId(accepterId, pageable);
        return new PageResult<>(
            taskPage.getContent(),
            taskPage.getTotalPages(),
            taskPage.getTotalElements(),
            taskPage.getNumber(),
            taskPage.getSize()
        );
    }

    public Task getTaskById(Long taskId) {
        return taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("任务不存在"));
    }

    public TaskApplication applyTask(ApplicationRequest request) {
        Task task = getTaskById(request.getTaskId());
        if (!"PUBLISHED".equals(task.getStatus())) {
            throw new RuntimeException("任务不可申请");
        }

        User applicant = userRepository.findById(request.getApplicantId())
                .orElseThrow(() -> new RuntimeException("申请人不存在"));

        if (task.getPublisher().getId().equals(applicant.getId())) {
            throw new RuntimeException("不能申请自己发布的任务");
        }

        TaskApplication application = new TaskApplication();
        application.setTask(task);
        application.setApplicant(applicant);
        application.setMessage(request.getMessage());
        application.setStatus("PENDING");

        return taskApplicationRepository.save(application);
    }

    public List<TaskApplication> getTaskApplications(Long taskId) {
        return taskApplicationRepository.findByTaskId(taskId);
    }

    @Transactional
    public Task acceptApplication(Long applicationId) {
        TaskApplication application = taskApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("申请不存在"));

        Task task = application.getTask();
        if (!"PUBLISHED".equals(task.getStatus())) {
            throw new RuntimeException("任务状态已变更");
        }

        application.setStatus("ACCEPTED");
        taskApplicationRepository.save(application);

        List<TaskApplication> otherApplications = taskApplicationRepository
                .findByTaskIdAndStatus(task.getId(), "PENDING");
        for (TaskApplication app : otherApplications) {
            app.setStatus("REJECTED");
            taskApplicationRepository.save(app);
        }

        task.setAccepter(application.getApplicant());
        task.setStatus("IN_PROGRESS");
        return taskRepository.save(task);
    }

    @Transactional
    public TaskSubmission submitTask(SubmissionRequest request) {
        Task task = getTaskById(request.getTaskId());
        if (!"IN_PROGRESS".equals(task.getStatus())) {
            throw new RuntimeException("任务不可提交");
        }

        User submitter = userRepository.findById(request.getSubmitterId())
                .orElseThrow(() -> new RuntimeException("提交者不存在"));

        if (!task.getAccepter().getId().equals(submitter.getId())) {
            throw new RuntimeException("只有接单人可以提交任务");
        }

        TaskSubmission submission = new TaskSubmission();
        submission.setTask(task);
        submission.setSubmitter(submitter);
        submission.setDescription(request.getDescription());
        submission.setImageBase64(request.getImageBase64());
        submission.setStatus("PENDING");

        return taskSubmissionRepository.save(submission);
    }

    public TaskSubmission getSubmissionByTaskId(Long taskId) {
        List<TaskSubmission> submissions = taskSubmissionRepository.findByTaskId(taskId);
        return submissions.isEmpty() ? null : submissions.get(0);
    }

    @Transactional
    public Task confirmSubmission(Long submissionId) {
        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("提交不存在"));

        Task task = submission.getTask();
        if (!"IN_PROGRESS".equals(task.getStatus())) {
            throw new RuntimeException("任务状态异常");
        }

        submission.setStatus("CONFIRMED");
        taskSubmissionRepository.save(submission);

        BigDecimal platformFee = task.getReward().multiply(PLATFORM_FEE_RATE);
        BigDecimal accepterAmount = task.getReward().subtract(platformFee);

        User accepter = task.getAccepter();
        accepter.setBalance(accepter.getBalance().add(accepterAmount));
        userRepository.save(accepter);

        Transaction transaction = new Transaction();
        transaction.setTask(task);
        transaction.setFromUser(task.getPublisher());
        transaction.setToUser(accepter);
        transaction.setAmount(accepterAmount);
        transaction.setPlatformFee(platformFee);
        transaction.setType("TASK_REWARD");
        transaction.setDescription("任务完成赏金，平台服务费5%");
        transactionRepository.save(transaction);

        task.setStatus("COMPLETED");
        return taskRepository.save(task);
    }

    public List<Transaction> getUserTransactions(Long userId) {
        return transactionRepository.findByFromUserIdOrToUserId(userId, userId);
    }

    public PageResult<Transaction> getUserTransactions(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Transaction> transactionPage = transactionRepository.findByFromUserIdOrToUserId(userId, userId, pageable);
        return new PageResult<>(
            transactionPage.getContent(),
            transactionPage.getTotalPages(),
            transactionPage.getTotalElements(),
            transactionPage.getNumber(),
            transactionPage.getSize()
        );
    }
}
