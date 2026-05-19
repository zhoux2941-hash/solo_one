package com.antifraud.window;

import com.antifraud.model.BaseEvent;
import com.antifraud.model.FraudRule;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.windowing.assigners.SlidingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.assigners.SessionWindowTimeGapExtractor;
import org.apache.flink.streaming.api.windowing.assigners.SessionWindows;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

public class WindowProcessor {

    public static KeyedStream<BaseEvent, String> applyWindow(
            KeyedStream<BaseEvent, String> keyedStream,
            FraudRule.WindowType windowType,
            long windowSize,
            long slideSize,
            long sessionGap) {

        switch (windowType) {
            case SLIDING:
                return applySlidingWindow(keyedStream, windowSize, slideSize);
            case SESSION:
                return applySessionWindow(keyedStream, sessionGap);
            case TUMBLING:
                return applyTumblingWindow(keyedStream, windowSize);
            default:
                throw new IllegalArgumentException("Unknown window type: " + windowType);
        }
    }

    private static KeyedStream<BaseEvent, String> applySlidingWindow(
            KeyedStream<BaseEvent, String> keyedStream,
            long windowSize,
            long slideSize) {

        keyedStream.window(SlidingProcessingTimeWindows.of(
                Time.seconds(windowSize),
                Time.seconds(slideSize)
        ));
        return keyedStream;
    }

    private static KeyedStream<BaseEvent, String> applySessionWindow(
            KeyedStream<BaseEvent, String> keyedStream,
            long sessionGapMinutes) {

        keyedStream.window(SessionWindows.withDynamicGap(new SessionWindowTimeGapExtractor<BaseEvent>() {
            @Override
            public long extract(BaseEvent element) {
                return Time.minutes(sessionGapMinutes).toMilliseconds();
            }
        }));
        return keyedStream;
    }

    private static KeyedStream<BaseEvent, String> applyTumblingWindow(
            KeyedStream<BaseEvent, String> keyedStream,
            long windowSize) {

        keyedStream.window(TumblingProcessingTimeWindows.of(Time.seconds(windowSize)));
        return keyedStream;
    }
}
