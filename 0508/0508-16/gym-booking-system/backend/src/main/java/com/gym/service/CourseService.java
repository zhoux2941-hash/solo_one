package com.gym.service;

import com.gym.entity.Course;
import com.gym.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CourseService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private RedisCacheService redisCacheService;
    
    public List<Course> getAllUpcomingCourses() {
        return courseRepository.findByStartTimeAfterOrderByStartTimeAsc(LocalDateTime.now());
    }
    
    public Optional<Course> getCourseById(Long courseId) {
        return courseRepository.findById(courseId);
    }
    
    public Course createCourse(Course course) {
        Course savedCourse = courseRepository.save(course);
        redisCacheService.initCourseCapacity(savedCourse.getCourseId(), savedCourse.getCapacity());
        return savedCourse;
    }
    
    public Course updateCourse(Long courseId, Course courseDetails) {
        return courseRepository.findById(courseId).map(course -> {
            course.setName(courseDetails.getName());
            course.setCoachId(courseDetails.getCoachId());
            course.setCoachName(courseDetails.getCoachName());
            course.setStartTime(courseDetails.getStartTime());
            course.setEndTime(courseDetails.getEndTime());
            course.setCapacity(courseDetails.getCapacity());
            course.setDescription(courseDetails.getDescription());
            Course updatedCourse = courseRepository.save(course);
            redisCacheService.initCourseCapacity(updatedCourse.getCourseId(), updatedCourse.getCapacity());
            return updatedCourse;
        }).orElseThrow(() -> new RuntimeException("课程不存在"));
    }
    
    public void deleteCourse(Long courseId) {
        courseRepository.deleteById(courseId);
        redisCacheService.deleteCourseCapacity(courseId);
    }
    
    public int getRemainingCapacity(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        return redisCacheService.getRemainingCapacity(courseId, course.getCapacity());
    }
    
    public List<Course> getCoursesByCoach(Long coachId) {
        return courseRepository.findByCoachId(coachId);
    }
}
