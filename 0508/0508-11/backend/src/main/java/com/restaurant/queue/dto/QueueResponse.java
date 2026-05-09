package com.restaurant.queue.dto;

import com.restaurant.queue.entity.QueueRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueResponse {

    private Long queueId;
    private String queueNumber;
    private String phoneNumber;
    private Integer partySize;
    private QueueRecord.QueueStatus status;
    private LocalDateTime enqueueTime;
    private LocalDateTime callTime;
    private LocalDateTime completeTime;
    private Integer position;
    private Integer estimatedWaitMinutes;

    public static QueueResponse fromEntity(QueueRecord record) {
        return QueueResponse.builder()
                .queueId(record.getQueueId())
                .queueNumber(formatQueueNumber(record.getQueueId()))
                .phoneNumber(record.getPhoneNumber())
                .partySize(record.getPartySize())
                .status(record.getStatus())
                .enqueueTime(record.getEnqueueTime())
                .callTime(record.getCallTime())
                .completeTime(record.getCompleteTime())
                .build();
    }

    private static String formatQueueNumber(Long id) {
        return String.format("A%04d", id);
    }
}
