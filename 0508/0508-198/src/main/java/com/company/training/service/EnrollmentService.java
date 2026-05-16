package com.company.training.service;

import com.company.training.entity.Course;
import com.company.training.entity.Employee;
import com.company.training.entity.Enrollment;
import com.company.training.repository.CourseRepository;
import com.company.training.repository.EmployeeRepository;
import com.company.training.repository.EnrollmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public List<Enrollment> getEnrollmentsByCourse(Long courseId) {
        return enrollmentRepository.findByCourseIdAndStatus(courseId, "ENROLLED");
    }

    public List<Enrollment> getEnrollmentsByEmployee(Long employeeId) {
        return enrollmentRepository.findByEmployeeIdOrderByEnrolledAtDesc(employeeId);
    }

    public Integer getEnrolledCount(Long courseId) {
        return enrollmentRepository.countEnrolledByCourseId(courseId);
    }

    @Transactional
    public Enrollment enrollCourse(Long courseId, Long employeeId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        if (enrollmentRepository.existsByCourseIdAndEmployeeIdAndStatus(courseId, employeeId, "ENROLLED")) {
            throw new RuntimeException("您已报名该课程");
        }

        Integer enrolledCount = enrollmentRepository.countEnrolledByCourseId(courseId);
        if (enrolledCount >= course.getMaxEnrollment()) {
            throw new RuntimeException("课程报名人数已满");
        }

        if (course.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("课程已开始，无法报名");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setCourse(course);
        enrollment.setEmployee(employee);
        enrollment.setStatus("ENROLLED");

        return enrollmentRepository.save(enrollment);
    }

    @Transactional
    public Enrollment cancelEnrollment(Long enrollmentId) {
        if (enrollmentId == null) {
            throw new RuntimeException("报名记录ID不能为空");
        }
        return enrollmentRepository.findById(enrollmentId)
                .map(enrollment -> {
                    if (!"ENROLLED".equals(enrollment.getStatus())) {
                        throw new RuntimeException("该报名已取消");
                    }
                    enrollment.setStatus("CANCELED");
                    enrollment.setCanceledAt(LocalDateTime.now());
                    return enrollmentRepository.save(enrollment);
                })
                .orElseThrow(() -> new RuntimeException("报名记录不存在"));
    }

    public Optional<Enrollment> getEnrollment(Long courseId, Long employeeId) {
        return enrollmentRepository.findByCourseIdAndEmployeeId(courseId, employeeId);
    }
}
