package com.oceanheritage.config;

import javax.websocket.HandshakeResponse;
import javax.websocket.server.HandshakeRequest;
import javax.websocket.server.ServerEndpointConfig;
import java.util.List;
import java.util.Map;

public class WebSocketCorsConfigurator extends ServerEndpointConfig.Configurator {

    @Override
    public void modifyHandshake(ServerEndpointConfig sec, HandshakeRequest request, HandshakeResponse response) {
        Map<String, List<String>> headers = response.getHeaders();
        headers.put("Access-Control-Allow-Origin", List.of("*"));
        headers.put("Access-Control-Allow-Methods", List.of("GET, POST, PUT, DELETE, OPTIONS"));
        headers.put("Access-Control-Allow-Headers", List.of("*"));
        headers.put("Access-Control-Allow-Credentials", List.of("true"));
    }

    @Override
    public boolean checkOrigin(String originHeaderValue) {
        return true;
    }
}
