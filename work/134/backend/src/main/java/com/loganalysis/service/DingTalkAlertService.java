package com.loganalysis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@Slf4j
public class DingTalkAlertService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${dingtalk.webhook.url:}")
    private String webhookUrl;

    @Value("${dingtalk.webhook.secret:}")
    private String secret;

    @Value("${dingtalk.alert.enabled:true}")
    private boolean enabled;

    @Value("${dingtalk.alert.at-mobiles:}")
    private String atMobiles;

    @Value("${dingtalk.alert.at-all:false}")
    private boolean atAll;

    public DingTalkAlertService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public boolean sendTextAlert(String content) {
        return sendTextAlert(content, null, false);
    }

    public boolean sendTextAlert(String content, List<String> atMobilesList, boolean isAtAll) {
        if (!enabled || webhookUrl == null || webhookUrl.isEmpty()) {
            log.warn("钉钉报警已禁用或未配置 Webhook URL");
            return false;
        }

        try {
            Map<String, Object> message = new HashMap<>();
            message.put("msgtype", "text");

            Map<String, Object> text = new HashMap<>();
            text.put("content", content);
            message.put("text", text);

            Map<String, Object> at = new HashMap<>();
            if (atMobilesList != null && !atMobilesList.isEmpty()) {
                at.put("atMobiles", atMobilesList);
            } else if (this.atMobiles != null && !this.atMobiles.isEmpty()) {
                at.put("atMobiles", Arrays.asList(this.atMobiles.split(",")));
            }
            at.put("isAtAll", isAtAll || this.atAll);
            message.put("at", at);

            return sendMessage(message);

        } catch (Exception e) {
            log.error("发送钉钉文本报警失败", e);
            return false;
        }
    }

    public boolean sendMarkdownAlert(String title, String content) {
        return sendMarkdownAlert(title, content, null, false);
    }

    public boolean sendMarkdownAlert(String title, String content, List<String> atMobilesList, boolean isAtAll) {
        if (!enabled || webhookUrl == null || webhookUrl.isEmpty()) {
            log.warn("钉钉报警已禁用或未配置 Webhook URL");
            return false;
        }

        try {
            Map<String, Object> message = new HashMap<>();
            message.put("msgtype", "markdown");

            Map<String, Object> markdown = new HashMap<>();
            markdown.put("title", title);
            markdown.put("text", content);
            message.put("markdown", markdown);

            Map<String, Object> at = new HashMap<>();
            if (atMobilesList != null && !atMobilesList.isEmpty()) {
                at.put("atMobiles", atMobilesList);
            } else if (this.atMobiles != null && !this.atMobiles.isEmpty()) {
                at.put("atMobiles", Arrays.asList(this.atMobiles.split(",")));
            }
            at.put("isAtAll", isAtAll || this.atAll);
            message.put("at", at);

            return sendMessage(message);

        } catch (Exception e) {
            log.error("发送钉钉 Markdown 报警失败", e);
            return false;
        }
    }

    public boolean sendLinkAlert(String title, String text, String messageUrl, String picUrl) {
        if (!enabled || webhookUrl == null || webhookUrl.isEmpty()) {
            log.warn("钉钉报警已禁用或未配置 Webhook URL");
            return false;
        }

        try {
            Map<String, Object> message = new HashMap<>();
            message.put("msgtype", "link");

            Map<String, Object> link = new HashMap<>();
            link.put("title", title);
            link.put("text", text);
            link.put("messageUrl", messageUrl);
            if (picUrl != null && !picUrl.isEmpty()) {
                link.put("picUrl", picUrl);
            }
            message.put("link", link);

            return sendMessage(message);

        } catch (Exception e) {
            log.error("发送钉钉 Link 报警失败", e);
            return false;
        }
    }

    public boolean sendActionCardAlert(
            String title, 
            String text, 
            String singleTitle, 
            String singleUrl) {
        if (!enabled || webhookUrl == null || webhookUrl.isEmpty()) {
            log.warn("钉钉报警已禁用或未配置 Webhook URL");
            return false;
        }

        try {
            Map<String, Object> message = new HashMap<>();
            message.put("msgtype", "actionCard");

            Map<String, Object> actionCard = new HashMap<>();
            actionCard.put("title", title);
            actionCard.put("text", text);
            actionCard.put("singleTitle", singleTitle);
            actionCard.put("singleURL", singleUrl);
            message.put("actionCard", actionCard);

            return sendMessage(message);

        } catch (Exception e) {
            log.error("发送钉钉 ActionCard 报警失败", e);
            return false;
        }
    }

    private boolean sendMessage(Map<String, Object> message) {
        try {
            String url = buildSignedUrl();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            String jsonBody = objectMapper.writeValueAsString(message);
            
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);

            log.debug("发送钉钉消息: URL={}, body={}", url, jsonBody);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = objectMapper.readValue(
                    response.getBody(), 
                    Map.class
                );
                
                Object errcode = responseBody.get("errcode");
                if (errcode instanceof Number && ((Number) errcode).intValue() == 0) {
                    log.info("钉钉消息发送成功");
                    return true;
                } else {
                    log.error("钉钉消息发送失败: errcode={}, errmsg={}", 
                        errcode, responseBody.get("errmsg"));
                    return false;
                }
            } else {
                log.error("钉钉消息发送失败，HTTP状态码: {}", response.getStatusCode());
                return false;
            }

        } catch (Exception e) {
            log.error("发送钉钉消息异常", e);
            return false;
        }
    }

    private String buildSignedUrl() {
        if (secret == null || secret.isEmpty()) {
            return webhookUrl;
        }

        try {
            long timestamp = System.currentTimeMillis();
            String stringToSign = timestamp + "\n" + secret;
            
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signData = mac.doFinal(stringToSign.getBytes(StandardCharsets.UTF_8));
            String sign = Base64.getEncoder().encodeToString(signData);
            String encodedSign = URLEncoder.encode(sign, StandardCharsets.UTF_8.name());

            String separator = webhookUrl.contains("?") ? "&" : "?";
            return webhookUrl + separator + "timestamp=" + timestamp + "&sign=" + encodedSign;

        } catch (Exception e) {
            log.error("构建钉钉签名 URL 失败", e);
            return webhookUrl;
        }
    }

    public void testConnection() {
        if (!enabled) {
            log.info("钉钉报警已禁用，跳过连接测试");
            return;
        }
        
        log.info("测试钉钉报警连接...");
        boolean success = sendTextAlert("【测试消息】日志分析系统钉钉报警测试 - " + new Date());
        
        if (success) {
            log.info("钉钉报警连接测试成功");
        } else {
            log.warn("钉钉报警连接测试失败，请检查配置");
        }
    }
}
