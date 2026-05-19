package com.oms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AsyncConfig implements WebMvcConfigurer {

    /**
     * 配置异步导出专用线程池
     * 用于处理大文件导出的StreamingResponseBody
     */
    @Bean(name = "exportExecutor")
    public ThreadPoolTaskExecutor exportExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5); // 核心线程数
        executor.setMaxPoolSize(10); // 最大线程数
        executor.setQueueCapacity(100); // 队列容量
        executor.setKeepAliveSeconds(60); // 空闲线程存活时间
        executor.setThreadNamePrefix("export-"); // 线程名前缀
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy()); // 拒绝策略：调用者运行
        executor.setWaitForTasksToCompleteOnShutdown(true); // 优雅关闭
        executor.setAwaitTerminationSeconds(60); // 等待终止时间
        return executor;
    }

    /**
     * 配置异步支持超时时间（30分钟）
     */
    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        configurer.setDefaultTimeout(30 * 60 * 1000); // 30分钟超时，适用于超大文件导出
        configurer.setTaskExecutor(exportExecutor());
    }
}
