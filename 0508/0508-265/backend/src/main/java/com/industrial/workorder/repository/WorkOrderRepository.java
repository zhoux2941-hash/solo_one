package com.industrial.workorder.repository;

import com.industrial.workorder.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    List<WorkOrder> findByStatus(String status);
    List<WorkOrder> findByCreatorId(Long creatorId);
    List<WorkOrder> findByAssigneeId(Long assigneeId);
    List<WorkOrder> findByDeviceId(Long deviceId);
    List<WorkOrder> findByCurrentApprovalLevel(Integer level);
    
    @Query("SELECT w FROM WorkOrder w WHERE w.teamLeaderId = ?1 AND w.teamLeaderStatus = 'PENDING'")
    List<WorkOrder> findPendingTeamLeaderApprovals(Long teamLeaderId);
    
    @Query("SELECT w FROM WorkOrder w WHERE w.adminId = ?1 AND w.adminStatus = 'PENDING'")
    List<WorkOrder> findPendingAdminApprovals(Long adminId);

    @Query("SELECT COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date")
    Long countByCreateDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date AND w.status = 'COMPLETED'")
    Long countCompletedByCreateDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) BETWEEN :startDate AND :endDate")
    Long countByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) BETWEEN :startDate AND :endDate AND w.status = 'COMPLETED'")
    Long countCompletedByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT w.assigneeId, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date GROUP BY w.assigneeId")
    List<Object[]> countByAssigneeAndDate(@Param("date") LocalDate date);

    @Query("SELECT w.assigneeId, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date AND w.status = 'COMPLETED' GROUP BY w.assigneeId")
    List<Object[]> countCompletedByAssigneeAndDate(@Param("date") LocalDate date);

    @Query("SELECT w.faultType, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date GROUP BY w.faultType")
    List<Object[]> countByFaultTypeAndDate(@Param("date") LocalDate date);

    @Query("SELECT w.faultType, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date AND w.status = 'COMPLETED' GROUP BY w.faultType")
    List<Object[]> countCompletedByFaultTypeAndDate(@Param("date") LocalDate date);

    @Query("SELECT w.priority, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date GROUP BY w.priority")
    List<Object[]> countByPriorityAndDate(@Param("date") LocalDate date);

    @Query("SELECT w.priority, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date AND w.status = 'COMPLETED' GROUP BY w.priority")
    List<Object[]> countCompletedByPriorityAndDate(@Param("date") LocalDate date);

    @Query("SELECT w.deviceId, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date GROUP BY w.deviceId")
    List<Object[]> countByDeviceAndDate(@Param("date") LocalDate date);

    @Query("SELECT w.deviceId, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date AND w.status = 'COMPLETED' GROUP BY w.deviceId")
    List<Object[]> countCompletedByDeviceAndDate(@Param("date") LocalDate date);

    @Query("SELECT w.status, COUNT(w) FROM WorkOrder w WHERE DATE(w.createTime) = :date GROUP BY w.status")
    List<Object[]> countByStatusAndDate(@Param("date") LocalDate date);

    @Query("SELECT DATE(w.createTime), w.status, COUNT(w) FROM WorkOrder w WHERE w.createTime BETWEEN :startTime AND :endTime GROUP BY DATE(w.createTime), w.status")
    List<Object[]> countByDateRangeAndStatus(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("SELECT DATE(w.createTime), w.assigneeId, COUNT(w) FROM WorkOrder w WHERE w.createTime BETWEEN :startTime AND :endTime GROUP BY DATE(w.createTime), w.assigneeId")
    List<Object[]> countByDateRangeAndAssignee(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("SELECT DATE(w.createTime), w.faultType, COUNT(w) FROM WorkOrder w WHERE w.createTime BETWEEN :startTime AND :endTime GROUP BY DATE(w.createTime), w.faultType")
    List<Object[]> countByDateRangeAndFaultType(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(w) FROM WorkOrder w WHERE w.assigneeId = :assigneeId AND DATE(w.createTime) BETWEEN :startDate AND :endDate")
    Long countByAssigneeAndDateRange(@Param("assigneeId") Long assigneeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(w) FROM WorkOrder w WHERE w.assigneeId = :assigneeId AND DATE(w.createTime) BETWEEN :startDate AND :endDate AND w.status = 'COMPLETED'")
    Long countCompletedByAssigneeAndDateRange(@Param("assigneeId") Long assigneeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
