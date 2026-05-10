package com.lawyer.letter.model;

public class BatchItem {
    private String counterpartyName;
    private String counterpartyInfo;
    private String amount;

    public BatchItem() {
    }

    public BatchItem(String counterpartyName, String counterpartyInfo, String amount) {
        this.counterpartyName = counterpartyName;
        this.counterpartyInfo = counterpartyInfo;
        this.amount = amount;
    }

    public String getCounterpartyName() {
        return counterpartyName;
    }

    public void setCounterpartyName(String counterpartyName) {
        this.counterpartyName = counterpartyName;
    }

    public String getCounterpartyInfo() {
        return counterpartyInfo;
    }

    public void setCounterpartyInfo(String counterpartyInfo) {
        this.counterpartyInfo = counterpartyInfo;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }
}
