package com.industrial.workorder.config;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;

@Component
public class IntranetFilter implements Filter {

    @Value("${workorder.intranet.allowed-subnets}")
    private List<String> allowedSubnets;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String clientIp = getClientIp(httpRequest);
        
        if (isIntranetIp(clientIp)) {
            chain.doFilter(request, response);
        } else {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            httpResponse.getWriter().write("Access denied: Only intranet access allowed");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private boolean isIntranetIp(String ip) {
        try {
            if ("127.0.0.1".equals(ip) || "localhost".equalsIgnoreCase(ip) || "0:0:0:0:0:0:0:1".equals(ip)) {
                return true;
            }
            InetAddress inetAddress = InetAddress.getByName(ip);
            byte[] addr = inetAddress.getAddress();
            if (addr.length == 4) {
                int first = addr[0] & 0xFF;
                int second = addr[1] & 0xFF;
                
                if (first == 10) return true;
                if (first == 172 && second >= 16 && second <= 31) return true;
                if (first == 192 && second == 168) return true;
            }
            return false;
        } catch (UnknownHostException e) {
            return false;
        }
    }
}
