package com.redis.gateway.netty;

import com.redis.gateway.config.ConfigManager;
import com.redis.gateway.core.CommandProcessor;
import com.redis.gateway.protocol.RedisDecoder;
import com.redis.gateway.protocol.RedisEncoder;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RedisGatewayServer {
    private static final Logger logger = LoggerFactory.getLogger(RedisGatewayServer.class);

    private final ConfigManager configManager;
    private final CommandProcessor commandProcessor;

    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;
    private Channel serverChannel;
    private volatile boolean running = false;

    public RedisGatewayServer(ConfigManager configManager, CommandProcessor commandProcessor) {
        this.configManager = configManager;
        this.commandProcessor = commandProcessor;
    }

    public void start() throws InterruptedException {
        int port = configManager.getConfig().getGateway().getPort();
        int bossThreads = configManager.getConfig().getGateway().getBossThreads();
        int workerThreads = configManager.getConfig().getGateway().getWorkerThreads();

        bossGroup = new NioEventLoopGroup(bossThreads);
        workerGroup = new NioEventLoopGroup(workerThreads);

        ServerBootstrap b = new ServerBootstrap();
        b.group(bossGroup, workerGroup)
                .channel(NioServerSocketChannel.class)
                .option(ChannelOption.SO_BACKLOG, 1024)
                .option(ChannelOption.SO_REUSEADDR, true)
                .handler(new LoggingHandler(LogLevel.INFO))
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    public void initChannel(SocketChannel ch) {
                        ChannelPipeline p = ch.pipeline();
                        p.addLast("decoder", new RedisDecoder());
                        p.addLast("encoder", new RedisEncoder());
                        p.addLast("handler", new RedisGatewayHandler(commandProcessor));
                    }
                })
                .childOption(ChannelOption.SO_KEEPALIVE, true)
                .childOption(ChannelOption.TCP_NODELAY, true);

        ChannelFuture f = b.bind(port).sync();
        serverChannel = f.channel();
        running = true;
        logger.info("Redis Gateway Server started on port {}", port);

        Runtime.getRuntime().addShutdownHook(new Thread(this::stop));
    }

    public void waitForShutdown() throws InterruptedException {
        if (serverChannel != null) {
            serverChannel.closeFuture().sync();
        }
    }

    public void stop() {
        if (!running) {
            return;
        }
        running = false;
        logger.info("Stopping Redis Gateway Server...");

        if (serverChannel != null) {
            serverChannel.close();
        }

        if (bossGroup != null) {
            bossGroup.shutdownGracefully();
        }

        if (workerGroup != null) {
            workerGroup.shutdownGracefully();
        }

        logger.info("Redis Gateway Server stopped");
    }

    public boolean isRunning() {
        return running;
    }
}
