package com.antifraud.grpc;

import com.antifraud.model.FraudRule;
import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class RuleServiceImpl extends RuleServiceGrpc.RuleServiceImplBase {
    private static final Logger LOG = LoggerFactory.getLogger(RuleServiceImpl.class);
    private final Map<String, FraudRule> ruleStore = new ConcurrentHashMap<>();
    private final RuleUpdateListener listener;

    public RuleServiceImpl(RuleUpdateListener listener) {
        this.listener = listener;
        initializeDefaultRules();
    }

    private void initializeDefaultRules() {
        FraudRule defaultRule = FraudRule.builder()
                .ruleId("rule-001")
                .ruleName("Complex Fraud Pattern Detection")
                .enabled(true)
                .ruleType(FraudRule.RuleType.COMPLEX_PATTERN)
                .config(FraudRule.RuleConfig.builder()
                        .timeWindowSeconds(10)
                        .minIpCount(2)
                        .largeTransactionThreshold(new BigDecimal("10000"))
                        .windowType(FraudRule.WindowType.SLIDING)
                        .sessionGapMinutes(5)
                        .build())
                .version(1)
                .lastUpdateTime(System.currentTimeMillis())
                .build();
        ruleStore.put(defaultRule.getRuleId(), defaultRule);
    }

    @Override
    public void updateRule(UpdateRuleRequest request, StreamObserver<UpdateRuleResponse> responseObserver) {
        try {
            FraudRule protoRule = convertToModel(request.getRule());
            protoRule.setVersion(protoRule.getVersion() + 1);
            protoRule.setLastUpdateTime(System.currentTimeMillis());
            ruleStore.put(protoRule.getRuleId(), protoRule);

            if (listener != null) {
                listener.onRuleUpdated(protoRule);
            }

            LOG.info("Updated rule: {}", protoRule.getRuleId());

            UpdateRuleResponse response = UpdateRuleResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Rule updated successfully")
                    .setUpdatedRule(convertToProto(protoRule))
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            LOG.error("Failed to update rule", e);
            responseObserver.onNext(UpdateRuleResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to update rule: " + e.getMessage())
                    .build());
            responseObserver.onCompleted();
        }
    }

    @Override
    public void getRule(GetRuleRequest request, StreamObserver<GetRuleResponse> responseObserver) {
        FraudRule rule = ruleStore.get(request.getRuleId());
        GetRuleResponse response = GetRuleResponse.newBuilder()
                .setExists(rule != null)
                .setRule(rule != null ? convertToProto(rule) : com.antifraud.grpc.FraudRule.getDefaultInstance())
                .build();
        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void listRules(ListRulesRequest request, StreamObserver<ListRulesResponse> responseObserver) {
        List<FraudRule> rules = ruleStore.values().stream()
                .filter(rule -> !request.getEnabledOnly() || rule.isEnabled())
                .collect(Collectors.toList());

        ListRulesResponse.Builder builder = ListRulesResponse.newBuilder();
        rules.forEach(rule -> builder.addRules(convertToProto(rule)));

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteRule(DeleteRuleRequest request, StreamObserver<DeleteRuleResponse> responseObserver) {
        FraudRule removed = ruleStore.remove(request.getRuleId());
        DeleteRuleResponse response = DeleteRuleResponse.newBuilder()
                .setSuccess(removed != null)
                .setMessage(removed != null ? "Rule deleted" : "Rule not found")
                .build();
        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void enableRule(EnableRuleRequest request, StreamObserver<EnableRuleResponse> responseObserver) {
        FraudRule rule = ruleStore.get(request.getRuleId());
        if (rule != null) {
            rule.setEnabled(true);
            rule.setVersion(rule.getVersion() + 1);
            rule.setLastUpdateTime(System.currentTimeMillis());
            if (listener != null) {
                listener.onRuleUpdated(rule);
            }
            responseObserver.onNext(EnableRuleResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Rule enabled")
                    .build());
        } else {
            responseObserver.onNext(EnableRuleResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Rule not found")
                    .build());
        }
        responseObserver.onCompleted();
    }

    @Override
    public void disableRule(DisableRuleRequest request, StreamObserver<DisableRuleResponse> responseObserver) {
        FraudRule rule = ruleStore.get(request.getRuleId());
        if (rule != null) {
            rule.setEnabled(false);
            rule.setVersion(rule.getVersion() + 1);
            rule.setLastUpdateTime(System.currentTimeMillis());
            responseObserver.onNext(DisableRuleResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Rule disabled")
                    .build());
        } else {
            responseObserver.onNext(DisableRuleResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Rule not found")
                    .build());
        }
        responseObserver.onCompleted();
    }

    private FraudRule convertToModel(com.antifraud.grpc.FraudRule proto) {
        return FraudRule.builder()
                .ruleId(proto.getRuleId())
                .ruleName(proto.getRuleName())
                .enabled(proto.getEnabled())
                .ruleType(FraudRule.RuleType.valueOf(proto.getRuleType()))
                .config(FraudRule.RuleConfig.builder()
                        .timeWindowSeconds(proto.getConfig().getTimeWindowSeconds())
                        .minIpCount(proto.getConfig().getMinIpCount())
                        .largeTransactionThreshold(BigDecimal.valueOf(proto.getConfig().getLargeTransactionThreshold()))
                        .windowType(FraudRule.WindowType.valueOf(proto.getConfig().getWindowType()))
                        .sessionGapMinutes(proto.getConfig().getSessionGapMinutes())
                        .build())
                .version(proto.getVersion())
                .lastUpdateTime(proto.getLastUpdateTime())
                .build();
    }

    private com.antifraud.grpc.FraudRule convertToProto(FraudRule model) {
        return com.antifraud.grpc.FraudRule.newBuilder()
                .setRuleId(model.getRuleId())
                .setRuleName(model.getRuleName())
                .setEnabled(model.isEnabled())
                .setRuleType(model.getRuleType().name())
                .setConfig(RuleConfig.newBuilder()
                        .setTimeWindowSeconds(model.getConfig().getTimeWindowSeconds())
                        .setMinIpCount(model.getConfig().getMinIpCount())
                        .setLargeTransactionThreshold(model.getConfig().getLargeTransactionThreshold().doubleValue())
                        .setWindowType(model.getConfig().getWindowType().name())
                        .setSessionGapMinutes(model.getConfig().getSessionGapMinutes())
                        .build())
                .setVersion(model.getVersion())
                .setLastUpdateTime(model.getLastUpdateTime())
                .build();
    }

    public interface RuleUpdateListener {
        void onRuleUpdated(FraudRule updatedRule);
    }

    public FraudRule getRuleById(String ruleId) {
        return ruleStore.get(ruleId);
    }
}
