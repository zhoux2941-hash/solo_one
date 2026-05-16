package com.company.training.service;

import com.company.training.entity.Course;
import com.company.training.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<Course> getPublishedCourses() {
        return courseRepository.findAllPublishedCourses();
    }

    public Optional<Course> getCourseById(Long id) {
        return courseRepository.findById(id);
    }

    public List<Course> getCoursesByType(String type) {
        return courseRepository.findByTypeAndStatus(type, "PUBLISHED");
    }

    @Transactional
    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    @Transactional
    public Course updateCourse(Long id, Course courseDetails) {
        return courseRepository.findById(id)
                .map(course -> {
                    course.setName(courseDetails.getName());
                    course.setDescription(courseDetails.getDescription());
                    course.setType(courseDetails.getType());
                    course.setInstructor(courseDetails.getInstructor());
                    course.setStartTime(courseDetails.getStartTime());
                    course.setEndTime(courseDetails.getEndTime());
                    course.setLocation(courseDetails.getLocation());
                    course.setMaxEnrollment(courseDetails.getMaxEnrollment());
                    course.setStatus(courseDetails.getStatus());
                    return courseRepository.save(course);
                })
                .orElseThrow(() -> new RuntimeException("课程不存在: " + id));
    }

    @Transactional
    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }
}
