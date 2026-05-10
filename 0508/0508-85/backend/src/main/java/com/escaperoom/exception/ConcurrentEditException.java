package com.escaperoom.exception;

public class ConcurrentEditException extends RuntimeException {
    private String conflictType;
    private Object currentData;

    public ConcurrentEditException(String message) {
        super(message);
    }

    public ConcurrentEditException(String message, String conflictType, Object currentData) {
        super(message);
        this.conflictType = conflictType;
        this.currentData = currentData;
    }

    public String getConflictType() {
        return conflictType;
    }

    public Object getCurrentData() {
        return currentData;
    }
}
