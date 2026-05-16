package com.health.service;

import com.health.entity.Reservation;
import com.health.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Value("${medical.daily.limit:50}")
    private int dailyLimit;

    public long getAvailableSlots(LocalDate date) {
        long booked = reservationRepository.countByDate(date);
        return Math.max(0, dailyLimit - booked);
    }

    public Reservation createReservation(Reservation reservation) {
        LocalDate date = reservation.getReservationDate();
        long available = getAvailableSlots(date);
        
        if (available <= 0) {
            throw new RuntimeException("该日期预约名额已满");
        }

        reservation.setStatus("CONFIRMED");
        reservation.setCreatedAt(LocalDateTime.now());
        reservation.setReportUploaded(false);
        
        String smsMessage = String.format(
            "【体检中心】尊敬的%s，您已成功预约%s月%s日%s的%s体检，请准时到达！",
            reservation.getUserName(),
            date.getMonthValue(),
            date.getDayOfMonth(),
            reservation.getTimeSlot(),
            reservation.getPackageName()
        );
        reservation.setSmsMessage(smsMessage);
        
        System.out.println("发送短信: " + smsMessage);
        
        return reservationRepository.save(reservation);
    }

    public List<Reservation> getReservationsByPhone(String phone) {
        return reservationRepository.findByPhoneOrderByCreatedAtDesc(phone);
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public Reservation getReservationById(Long id) {
        return reservationRepository.findById(id).orElse(null);
    }

    public void markReportUploaded(Long reservationId) {
        Reservation reservation = getReservationById(reservationId);
        if (reservation != null) {
            reservation.setReportUploaded(true);
            reservationRepository.save(reservation);
        }
    }
}
