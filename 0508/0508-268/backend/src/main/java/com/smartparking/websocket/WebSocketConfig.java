package com.smartparking.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

@Configuration
@EnableWebSocket
@WebListener
public class WebSocketConfig implements ServletContextListener {

    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        ServletContext context = sce.getServletContext();
        context.setInitParameter("org.apache.tomcat.websocket.textBufferSize", "1024000");
        context.setInitParameter("org.apache.tomcat.websocket.binaryBufferSize", "1024000");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
    }
}
