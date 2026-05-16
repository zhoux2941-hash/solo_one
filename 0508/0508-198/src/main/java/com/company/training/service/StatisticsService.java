package com.company.training.service;

import com.company.training.dto.CourseStatisticsDTO;
import com.company.training.entity.Course;
import com.company.training.repository.AttendanceRepository;
import com.company.training.repository.CourseRepository;
import com.company.training.repository.EnrollmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StatisticsService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    public List<CourseStatisticsDTO> getAllCourseStatistics() {
        List<Course> courses = courseRepository.findAll();
        List<CourseStatisticsDTO> statistics = new ArrayList<>();

        for (Course course : courses) {
            Integer enrolledCount = enrollmentRepository.countEnrolledByCourseId(course.getId());
            Integer signedInCount = attendanceRepository.countSignedInByCourseId(course.getId());
            Double attendanceRate = enrolledCount > 0 ? (signedInCount * 100.0 / enrolledCount) : 0.0;

            CourseStatisticsDTO dto = new CourseStatisticsDTO(
                    course.getId(),
                    course.getName(),
                    course.getType(),
                    course.getMaxEnrollment(),
                    enrolledCount,
                    signedInCount,
                    Math.round(attendanceRate * 100.0) / 100.0
            );
            statistics.add(dto);
        }

        return statistics;
    }

    public CourseStatisticsDTO getCourseStatistics(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));

        Integer enrolledCount = enrollmentRepository.countEnrolledByCourseId(courseId);
        Integer signedInCount = attendanceRepository.countSignedInByCourseId(courseId);
        Double attendanceRate = enrolledCount > 0 ? (signedInCount * 100.0 / enrolledCount) : 0.0;

        return new CourseStatisticsDTO(
                course.getId(),
                course.getName(),
                course.getType(),
                course.getMaxEnrollment(),
                enrolledCount,
                signedInCount,
                Math.round(attendanceRate * 100.0) / 100.0
        );
    }
}
