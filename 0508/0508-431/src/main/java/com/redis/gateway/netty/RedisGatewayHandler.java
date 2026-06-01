package com.redis.gateway.netty;

import com.redis.gateway.core.CommandProcessor;
import com.redis.gateway.protocol.RedisCommand;
import com.redis.gateway.protocol.RedisResponse;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RedisGatewayHandler extends SimpleChannelInboundHandler<Object> {
    private static final Logger logger = LoggerFactory.getLogger(RedisGatewayHandler.class);

    private final CommandProcessor commandProcessor;

    public RedisGatewayHandler(CommandProcessor commandProcessor) {
        this.commandProcessor = commandProcessor;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) {
        if (msg instanceof RedisCommand) {
            RedisCommand command = (RedisCommand) msg;
            try {
                if ("PING".equalsIgnoreCase(command.getName())) {
                    ctx.writeAndFlush(RedisResponse.ok());
                    return;
                }
                if ("COMMAND".equalsIgnoreCase(command.getName())) {
                    ctx.writeAndFlush(RedisResponse.ok());
                    return;
                }

                RedisResponse response = commandProcessor.processCommand(command);
                ctx.writeAndFlush(response);
            } catch (Exception e) {
                logger.error("Error processing command: {}", command, e);
                ctx.writeAndFlush(RedisResponse.error("ERR " + e.getMessage()));
            }
        }
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        logger.debug("Client connected: {}", ctx.channel().remoteAddress());
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        logger.debug("Client disconnected: {}", ctx.channel().remoteAddress());
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        logger.error("Exception in gateway handler", cause);
        ctx.close();
    }
}
