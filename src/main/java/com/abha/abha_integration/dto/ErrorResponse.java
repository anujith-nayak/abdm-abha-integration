package com.abha.abha_integration.dto;

import java.time.OffsetDateTime;

public class ErrorResponse {

    private String message;
    private OffsetDateTime timestamp;

    public ErrorResponse(String message) {
        this.message = message;
        this.timestamp = OffsetDateTime.now();
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
