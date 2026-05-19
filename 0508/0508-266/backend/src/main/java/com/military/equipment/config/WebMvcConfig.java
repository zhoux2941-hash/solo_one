package com.military.equipment.config;

import com.military.equipment.filter.XssFilter;
import com.military.equipment.interceptor.AuthInterceptor;
import com.military.equipment.interceptor.RateLimitInterceptor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.Arrays;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Resource
    private AuthInterceptor authInterceptor;

    @Resource
    private RateLimitInterceptor rateLimitInterceptor;

    @PostConstruct
    public void init() {
        System.out.println("========== WebMvcConfig被初始化! authInterceptor=" + authInterceptor + ", rateLimitInterceptor=" + rateLimitInterceptor);
    }

    @Bean
    public FilterRegistrationBean<XssFilter> xssFilterRegistration() {
        FilterRegistrationBean<XssFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new XssFilter());
        registration.setUrlPatterns(Arrays.asList("/*"));
        registration.setOrder(1);
        return registration;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        System.out.println("========== addInterceptors被调用!");
        
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/auth/login", "/h2-console/**");

        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/auth/login", "/h2-console/**");
        
        System.out.println("========== 拦截器注册完成!");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
