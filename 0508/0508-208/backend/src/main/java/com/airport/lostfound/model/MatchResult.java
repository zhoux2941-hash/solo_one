package com.airport.lostfound.model;

public class MatchResult {

    private FoundItem foundItem;
    private LostClaim lostClaim;
    private double matchScore;
    private String matchReason;

    public MatchResult() {
    }

    public MatchResult(FoundItem foundItem, LostClaim lostClaim, double matchScore, String matchReason) {
        this.foundItem = foundItem;
        this.lostClaim = lostClaim;
        this.matchScore = matchScore;
        this.matchReason = matchReason;
    }

    public FoundItem getFoundItem() {
        return foundItem;
    }

    public void setFoundItem(FoundItem foundItem) {
        this.foundItem = foundItem;
    }

    public LostClaim getLostClaim() {
        return lostClaim;
    }

    public void setLostClaim(LostClaim lostClaim) {
        this.lostClaim = lostClaim;
    }

    public double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(double matchScore) {
        this.matchScore = matchScore;
    }

    public String getMatchReason() {
        return matchReason;
    }

    public void setMatchReason(String matchReason) {
        this.matchReason = matchReason;
    }
}
