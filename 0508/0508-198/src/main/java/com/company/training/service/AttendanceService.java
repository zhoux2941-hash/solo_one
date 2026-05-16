package com.company.training.service;

import com.company.training.entity.Attendance;
import com.company.training.entity.Course;
import com.company.training.entity.Employee;
import com.company.training.entity.Enrollment;
import com.company.training.repository.AttendanceRepository;
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
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    public List<Attendance> getAttendancesByCourse(Long courseId) {
        return attendanceRepository.findByCourseId(courseId);
    }

    public List<Attendance> getAttendancesByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    public Integer getSignedInCount(Long courseId) {
        return attendanceRepository.countSignedInByCourseId(courseId);
    }

    @Transactional
    public Attendance signIn(Long courseId, Long employeeId, String location, String remarks) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        Optional<Enrollment> enrollment = enrollmentRepository.findByCourseIdAndEmployeeId(courseId, employeeId);
        if (!enrollment.isPresent() || !"ENROLLED".equals(enrollment.get().getStatus())) {
            throw new RuntimeException("您未报名该课程");
        }

        Optional<Attendance> existingAttendance = attendanceRepository.findByCourseIdAndEmployeeId(courseId, employeeId);
        if (existingAttendance.isPresent() && existingAttendance.get().getSignedIn()) {
            throw new RuntimeException("您已签到");
        }

        Attendance attendance;
        if (existingAttendance.isPresent()) {
            attendance = existingAttendance.get();
        } else {
            attendance = new Attendance();
            attendance.setCourse(course);
            attendance.setEmployee(employee);
        }

        attendance.setSignedIn(true);
        attendance.setSignInTime(LocalDateTime.now());
        attendance.setSignInLocation(location);
        attendance.setRemarks(remarks);

        return attendanceRepository.save(attendance);
    }

    public Optional<Attendance> getAttendance(Long courseId, Long employeeId) {
        return attendanceRepository.findByCourseIdAndEmployeeId(courseId, employeeId);
    }
}
