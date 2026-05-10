package com.driving.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.driving.common.BusinessException;
import com.driving.dto.RatingDTO;
import com.driving.entity.Booking;
import com.driving.entity.Coach;
import com.driving.entity.Rating;
import com.driving.mapper.BookingMapper;
import com.driving.mapper.CoachMapper;
import com.driving.mapper.RatingMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
public class RatingService {

    @Autowired
    private RatingMapper ratingMapper;

    @Autowired
    private BookingMapper bookingMapper;

    @Autowired
    private CoachMapper coachMapper;

    @Transactional
    public void submitRating(Long studentId, RatingDTO ratingDTO) {
        Booking booking = bookingMapper.selectById(ratingDTO.getBookingId());
        if (booking == null) {
            throw new BusinessException("预约不存在");
        }

        if (!booking.getStudentId().equals(studentId)) {
            throw new BusinessException("无权对该预约进行评分");
        }

        if (booking.getStatus() != 2) {
            throw new BusinessException("只能对已完成的预约进行评分");
        }

        Rating existingRating = ratingMapper.selectOne(
                new QueryWrapper<Rating>().eq("booking_id", ratingDTO.getBookingId())
        );
        if (existingRating != null) {
            throw new BusinessException("该预约已评分");
        }

        Rating rating = new Rating();
        rating.setBookingId(ratingDTO.getBookingId());
        rating.setStudentId(studentId);
        rating.setCoachId(booking.getCoachId());
        rating.setScore(ratingDTO.getScore());
        rating.setComment(ratingDTO.getComment());
        ratingMapper.insert(rating);

        updateCoachAvgRating(booking.getCoachId());
    }

    private void updateCoachAvgRating(Long coachId) {
        List<Rating> ratings = ratingMapper.selectList(
                new QueryWrapper<Rating>().eq("coach_id", coachId)
        );

        if (ratings.isEmpty()) {
            return;
        }

        int totalScore = ratings.stream().mapToInt(Rating::getScore).sum();
        BigDecimal avgRating = new BigDecimal(totalScore)
                .divide(new BigDecimal(ratings.size()), 2, RoundingMode.HALF_UP);

        Coach coach = coachMapper.selectById(coachId);
        if (coach != null) {
            coach.setAvgRating(avgRating);
            coach.setRatingCount(ratings.size());
            coachMapper.updateById(coach);
        }
    }

    public List<Map<String, Object>> getCoachRatings(Long coachId) {
        return ratingMapper.selectCoachRatings(coachId);
    }

    public Rating getRatingByBookingId(Long bookingId) {
        return ratingMapper.selectOne(
                new QueryWrapper<Rating>().eq("booking_id", bookingId)
        );
    }
}