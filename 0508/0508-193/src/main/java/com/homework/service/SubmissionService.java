package com.homework.service;

import com.homework.entity.Homework;
import com.homework.entity.Submission;
import com.homework.entity.User;
import com.homework.exception.BusinessException;
import com.homework.repository.HomeworkRepository;
import com.homework.repository.SubmissionRepository;
import com.homework.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class SubmissionService {
    @Autowired
    private SubmissionRepository submissionRepository;
    
    @Autowired
    private HomeworkRepository homeworkRepository;
    
    @Autowired
    private UserRepository userRepository;

    private static final String UPLOAD_DIR = "uploads";

    private Set<String> parseAllowedExtensions(String attachmentRequirement) {
        Set<String> allowed = new HashSet<>();
        if (attachmentRequirement == null || attachmentRequirement.trim().isEmpty()) {
            return allowed;
        }
        
        String lower = attachmentRequirement.toLowerCase();
        
        if (lower.contains("word") || lower.contains("文档")) {
            allowed.add(".doc");
            allowed.add(".docx");
        }
        if (lower.contains("pdf")) {
            allowed.add(".pdf");
        }
        if (lower.contains("excel") || lower.contains("表格")) {
            allowed.add(".xls");
            allowed.add(".xlsx");
        }
        if (lower.contains("ppt") || lower.contains("演示")) {
            allowed.add(".ppt");
            allowed.add(".pptx");
        }
        if (lower.contains("图片") || lower.contains("image")) {
            allowed.add(".jpg");
            allowed.add(".jpeg");
            allowed.add(".png");
            allowed.add(".gif");
            allowed.add(".bmp");
        }
        if (lower.contains("zip") || lower.contains("压缩")) {
            allowed.add(".zip");
            allowed.add(".rar");
            allowed.add(".7z");
        }
        if (lower.contains("txt") || lower.contains("文本")) {
            allowed.add(".txt");
        }
        
        return allowed;
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    }

    private String formatAllowedExtensions(Set<String> extensions) {
        if (extensions.isEmpty()) {
            return "";
        }
        return String.join("、", extensions);
    }

    public Submission submitHomework(Long homeworkId, Long studentId, String content, MultipartFile file) throws IOException {
        Homework homework = homeworkRepository.findById(homeworkId).orElseThrow();
        User student = userRepository.findById(studentId).orElseThrow();
        
        if (LocalDateTime.now().isAfter(homework.getDeadline())) {
            throw new BusinessException("已超过作业截止时间，无法提交");
        }

        if (file != null && !file.isEmpty()) {
            Set<String> allowedExtensions = parseAllowedExtensions(homework.getAttachmentRequirement());
            if (!allowedExtensions.isEmpty()) {
                String fileExt = getFileExtension(file.getOriginalFilename());
                if (!allowedExtensions.contains(fileExt)) {
                    throw new BusinessException("文件类型不符合要求，仅支持：" + formatAllowedExtensions(allowedExtensions));
                }
            }
        }

        Submission submission = new Submission();
        submission.setHomework(homework);
        submission.setStudent(student);
        submission.setContent(content);

        if (file != null && !file.isEmpty()) {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFileName = file.getOriginalFilename();
            String fileName = System.currentTimeMillis() + "_" + originalFileName;
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            submission.setFileName(originalFileName);
            submission.setFilePath(filePath.toString());
        }

        return submissionRepository.save(submission);
    }

    public Submission gradeSubmission(Long submissionId, Integer score, String comment) {
        Submission submission = submissionRepository.findById(submissionId).orElseThrow();
        submission.setScore(score);
        submission.setComment(comment);
        submission.setGradedAt(LocalDateTime.now());
        submission.setStatus(Submission.Status.GRADED);
        return submissionRepository.save(submission);
    }

    public List<Submission> getSubmissionsByHomework(Long homeworkId) {
        return submissionRepository.findByHomeworkId(homeworkId);
    }

    public List<Submission> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    public Optional<Submission> getSubmissionById(Long id) {
        return submissionRepository.findById(id);
    }

    public Optional<Submission> getSubmissionByHomeworkAndStudent(Long homeworkId, Long studentId) {
        return submissionRepository.findByHomeworkIdAndStudentId(homeworkId, studentId);
    }

    public Map<String, Object> getScoreDistribution(Long homeworkId) {
        Map<String, Object> result = new HashMap<>();
        
        long excellent = submissionRepository.countByHomeworkIdAndScoreGreaterThanEqual(homeworkId, 90);
        long good = submissionRepository.countByHomeworkIdAndScoreBetween(homeworkId, 80, 89);
        long medium = submissionRepository.countByHomeworkIdAndScoreBetween(homeworkId, 60, 79);
        long poor = submissionRepository.countByHomeworkIdAndScoreLessThan(homeworkId, 60);

        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("优(90-100)", excellent);
        distribution.put("良(80-89)", good);
        distribution.put("中(60-79)", medium);
        distribution.put("差(0-59)", poor);

        result.put("distribution", distribution);
        result.put("total", excellent + good + medium + poor);

        return result;
    }

    public Double getStudentPercentile(Long studentId, Long homeworkId) {
        Submission studentSubmission = submissionRepository.findByHomeworkIdAndStudentId(homeworkId, studentId).orElse(null);
        if (studentSubmission == null || studentSubmission.getScore() == null) {
            return null;
        }

        List<Submission> allSubmissions = submissionRepository.findByHomeworkIdAndStatus(homeworkId, Submission.Status.GRADED);
        if (allSubmissions.isEmpty()) {
            return null;
        }

        int studentScore = studentSubmission.getScore();
        long countBelow = allSubmissions.stream()
                .filter(s -> s.getScore() != null && s.getScore() < studentScore)
                .count();

        return (double) countBelow / allSubmissions.size() * 100;
    }

    public Map<String, Object> getStudentStats(Long studentId, Integer page, Integer size) {
        Map<String, Object> stats = new HashMap<>();
        List<Submission> submissions = submissionRepository.findByStudentId(studentId);
        
        List<Map<String, Object>> gradedList = new ArrayList<>();
        double totalScore = 0;
        int gradedCount = 0;

        for (Submission s : submissions) {
            if (s.getScore() != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("homeworkId", s.getHomework().getId());
                item.put("homeworkTitle", s.getHomework().getTitle());
                item.put("score", s.getScore());
                item.put("comment", s.getComment());
                item.put("gradedAt", s.getGradedAt());
                item.put("percentile", getStudentPercentile(studentId, s.getHomework().getId()));
                gradedList.add(item);
                
                totalScore += s.getScore();
                gradedCount++;
            }
        }

        gradedList.sort((a, b) -> {
            java.time.LocalDateTime dateA = java.time.LocalDateTime.parse(a.get("gradedAt").toString());
            java.time.LocalDateTime dateB = java.time.LocalDateTime.parse(b.get("gradedAt").toString());
            return dateB.compareTo(dateA);
        });

        int pageSize = size != null ? size : 10;
        int pageNum = page != null ? page : 1;
        int total = gradedList.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, total);
        
        List<Map<String, Object>> pagedList = gradedList.subList(start, end);

        stats.put("history", pagedList);
        stats.put("averageScore", gradedCount > 0 ? totalScore / gradedCount : 0);
        stats.put("totalSubmitted", submissions.size());
        stats.put("totalGraded", gradedCount);
        stats.put("currentPage", pageNum);
        stats.put("totalPages", totalPages);
        stats.put("pageSize", pageSize);
        stats.put("total", total);

        return stats;
    }

    public Map<String, Object> getStudentStats(Long studentId) {
        return getStudentStats(studentId, 1, 10);
    }
}
