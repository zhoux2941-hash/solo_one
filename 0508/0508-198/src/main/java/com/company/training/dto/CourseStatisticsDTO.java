package com.company.training.dto;

public class CourseStatisticsDTO {

    private Long courseId;
    private String courseName;
    private String courseType;
    private Integer maxEnrollment;
    private Integer enrolledCount;
    private Integer signedInCount;
    private Double attendanceRate;

    public CourseStatisticsDTO() {
    }

    public CourseStatisticsDTO(Long courseId, String courseName, String courseType,
                               Integer maxEnrollment, Integer enrolledCount,
                               Integer signedInCount, Double attendanceRate) {
        this.courseId = courseId;
        this.courseName = courseName;
        this.courseType = courseType;
        this.maxEnrollment = maxEnrollment;
        this.enrolledCount = enrolledCount;
        this.signedInCount = signedInCount;
        this.attendanceRate = attendanceRate;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getCourseType() {
        return courseType;
    }

    public void setCourseType(String courseType) {
        this.courseType = courseType;
    }

    public Integer getMaxEnrollment() {
        return maxEnrollment;
    }

    public void setMaxEnrollment(Integer maxEnrollment) {
        this.maxEnrollment = maxEnrollment;
    }

    public Integer getEnrolledCount() {
        return enrolledCount;
    }

    public void setEnrolledCount(Integer enrolledCount) {
        this.enrolledCount = enrolledCount;
    }

    public Integer getSignedInCount() {
        return signedInCount;
    }

    public void setSignedInCount(Integer signedInCount) {
        this.signedInCount = signedInCount;
    }

    public Double getAttendanceRate() {
        return attendanceRate;
    }

    public void setAttendanceRate(Double attendanceRate) {
        this.attendanceRate = attendanceRate;
    }
}
