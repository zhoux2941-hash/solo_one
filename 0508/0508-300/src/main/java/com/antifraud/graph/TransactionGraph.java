package com.antifraud.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Data
public class TransactionGraph implements Serializable {
    private static final long serialVersionUID = 1L;

    private Map<String, AccountNode> nodes;
    private Map<String, TransactionEdge> edges;
    private long lastUpdateTime;
    private long version;

    public TransactionGraph() {
        this.nodes = new ConcurrentHashMap<>();
        this.edges = new ConcurrentHashMap<>();
        this.lastUpdateTime = System.currentTimeMillis();
        this.version = 0;
    }

    public void addTransaction(String fromAccount, String toAccount, BigDecimal amount, long timestamp) {
        AccountNode fromNode = nodes.computeIfAbsent(fromAccount, k -> new AccountNode(k));
        AccountNode toNode = nodes.computeIfAbsent(toAccount, k -> new AccountNode(k));

        fromNode.incrementOutDegree();
        fromNode.addOutgoingAmount(amount);
        fromNode.setLastActiveTime(timestamp);

        toNode.incrementInDegree();
        toNode.addIncomingAmount(amount);
        toNode.setLastActiveTime(timestamp);

        String edgeKey = generateEdgeKey(fromAccount, toAccount);
        TransactionEdge edge = edges.computeIfAbsent(edgeKey, k -> new TransactionEdge(fromAccount, toAccount));
        edge.addTransaction(amount, timestamp);

        fromNode.addNeighbor(toAccount);
        toNode.addNeighbor(fromAccount);

        this.lastUpdateTime = timestamp;
        this.version++;
    }

    public void removeEdge(String fromAccount, String toAccount) {
        String edgeKey = generateEdgeKey(fromAccount, toAccount);
        TransactionEdge edge = edges.remove(edgeKey);
        if (edge != null) {
            AccountNode fromNode = nodes.get(fromAccount);
            AccountNode toNode = nodes.get(toAccount);
            if (fromNode != null) {
                fromNode.decrementOutDegree();
                fromNode.removeNeighbor(toAccount);
            }
            if (toNode != null) {
                toNode.decrementInDegree();
                toNode.removeNeighbor(fromAccount);
            }
        }
        this.version++;
    }

    public void removeNode(String accountId) {
        AccountNode node = nodes.remove(accountId);
        if (node != null) {
            for (String neighbor : node.getNeighbors()) {
                String outgoingKey = generateEdgeKey(accountId, neighbor);
                String incomingKey = generateEdgeKey(neighbor, accountId);
                edges.remove(outgoingKey);
                edges.remove(incomingKey);

                AccountNode neighborNode = nodes.get(neighbor);
                if (neighborNode != null) {
                    neighborNode.removeNeighbor(accountId);
                }
            }
        }
        this.version++;
    }

    public AccountNode getNode(String accountId) {
        return nodes.get(accountId);
    }

    public TransactionEdge getEdge(String fromAccount, String toAccount) {
        return edges.get(generateEdgeKey(fromAccount, toAccount));
    }

    public Set<String> getNeighbors(String accountId) {
        AccountNode node = nodes.get(accountId);
        return node != null ? node.getNeighbors() : Collections.emptySet();
    }

    public int getNodeCount() {
        return nodes.size();
    }

    public int getEdgeCount() {
        return edges.size();
    }

    private String generateEdgeKey(String from, String to) {
        return from + "->" + to;
    }

    public Set<String> getAllAccountIds() {
        return new HashSet<>(nodes.keySet());
    }

    public List<TransactionEdge> getOutgoingEdges(String accountId) {
        List<TransactionEdge> result = new ArrayList<>();
        for (TransactionEdge edge : edges.values()) {
            if (edge.getFromAccount().equals(accountId)) {
                result.add(edge);
            }
        }
        return result;
    }

    public List<TransactionEdge> getIncomingEdges(String accountId) {
        List<TransactionEdge> result = new ArrayList<>();
        for (TransactionEdge edge : edges.values()) {
            if (edge.getToAccount().equals(accountId)) {
                result.add(edge);
            }
        }
        return result;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountNode implements Serializable {
        private static final long serialVersionUID = 1L;

        private String accountId;
        private int inDegree;
        private int outDegree;
        private BigDecimal totalIncomingAmount;
        private BigDecimal totalOutgoingAmount;
        private long lastActiveTime;
        private Set<String> neighbors;

        public AccountNode(String accountId) {
            this.accountId = accountId;
            this.inDegree = 0;
            this.outDegree = 0;
            this.totalIncomingAmount = BigDecimal.ZERO;
            this.totalOutgoingAmount = BigDecimal.ZERO;
            this.lastActiveTime = System.currentTimeMillis();
            this.neighbors = Collections.synchronizedSet(new HashSet<>());
        }

        public void incrementInDegree() {
            this.inDegree++;
        }

        public void incrementOutDegree() {
            this.outDegree++;
        }

        public void decrementInDegree() {
            if (this.inDegree > 0) this.inDegree--;
        }

        public void decrementOutDegree() {
            if (this.outDegree > 0) this.outDegree--;
        }

        public void addIncomingAmount(BigDecimal amount) {
            this.totalIncomingAmount = this.totalIncomingAmount.add(amount);
        }

        public void addOutgoingAmount(BigDecimal amount) {
            this.totalOutgoingAmount = this.totalOutgoingAmount.add(amount);
        }

        public void addNeighbor(String neighborId) {
            this.neighbors.add(neighborId);
        }

        public void removeNeighbor(String neighborId) {
            this.neighbors.remove(neighborId);
        }

        public int getDegree() {
            return inDegree + outDegree;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionEdge implements Serializable {
        private static final long serialVersionUID = 1L;

        private String fromAccount;
        private String toAccount;
        private int transactionCount;
        private BigDecimal totalAmount;
        private BigDecimal minAmount;
        private BigDecimal maxAmount;
        private long firstTransactionTime;
        private long lastTransactionTime;
        private List<BigDecimal> recentAmounts;

        public TransactionEdge(String fromAccount, String toAccount) {
            this.fromAccount = fromAccount;
            this.toAccount = toAccount;
            this.transactionCount = 0;
            this.totalAmount = BigDecimal.ZERO;
            this.minAmount = null;
            this.maxAmount = null;
            this.firstTransactionTime = Long.MAX_VALUE;
            this.lastTransactionTime = 0;
            this.recentAmounts = Collections.synchronizedList(new ArrayList<>());
        }

        public void addTransaction(BigDecimal amount, long timestamp) {
            this.transactionCount++;
            this.totalAmount = this.totalAmount.add(amount);
            this.minAmount = (this.minAmount == null || amount.compareTo(this.minAmount) < 0) ? amount : this.minAmount;
            this.maxAmount = (this.maxAmount == null || amount.compareTo(this.maxAmount) > 0) ? amount : this.maxAmount;
            this.firstTransactionTime = Math.min(this.firstTransactionTime, timestamp);
            this.lastTransactionTime = Math.max(this.lastTransactionTime, timestamp);

            this.recentAmounts.add(amount);
            if (this.recentAmounts.size() > 100) {
                this.recentAmounts.remove(0);
            }
        }

        public BigDecimal getAvgAmount() {
            if (transactionCount == 0) return BigDecimal.ZERO;
            return totalAmount.divide(BigDecimal.valueOf(transactionCount), 2, BigDecimal.ROUND_HALF_UP);
        }
    }
}
