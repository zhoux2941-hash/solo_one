package com.redis.gateway.protocol;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.List;

public class RedisEncoder extends MessageToByteEncoder<Object> {
    private static final Logger logger = LoggerFactory.getLogger(RedisEncoder.class);

    private static final byte[] CRLF = new byte[]{'\r', '\n'};
    private static final byte DOLLAR = '$';
    private static final byte PLUS = '+';
    private static final byte MINUS = '-';
    private static final byte COLON = ':';
    private static final byte ASTERISK = '*';

    @Override
    protected void encode(ChannelHandlerContext ctx, Object msg, ByteBuf out) throws Exception {
        if (msg instanceof RedisResponse) {
            encodeResponse((RedisResponse) msg, out);
        } else if (msg instanceof RedisCommand) {
            encodeCommand((RedisCommand) msg, out);
        } else if (msg instanceof byte[]) {
            out.writeBytes((byte[]) msg);
        } else if (msg instanceof String) {
            out.writeBytes(((String) msg).getBytes(StandardCharsets.UTF_8));
        } else {
            logger.warn("Unknown message type: {}", msg.getClass());
        }
    }

    private void encodeResponse(RedisResponse response, ByteBuf out) {
        switch (response.getType()) {
            case SIMPLE_STRING:
                encodeSimpleString((String) response.getValue(), out);
                break;
            case ERROR:
                encodeError((String) response.getValue(), out);
                break;
            case INTEGER:
                encodeInteger((Long) response.getValue(), out);
                break;
            case BULK_STRING:
                encodeBulkString(response.getValue(), out);
                break;
            case ARRAY:
                encodeArray(response.getValue(), out);
                break;
        }
    }

    private void encodeSimpleString(String value, ByteBuf out) {
        out.writeByte(PLUS);
        out.writeBytes(value.getBytes(StandardCharsets.UTF_8));
        out.writeBytes(CRLF);
    }

    private void encodeError(String value, ByteBuf out) {
        out.writeByte(MINUS);
        out.writeBytes(value.getBytes(StandardCharsets.UTF_8));
        out.writeBytes(CRLF);
    }

    private void encodeInteger(Long value, ByteBuf out) {
        out.writeByte(COLON);
        out.writeBytes(String.valueOf(value).getBytes(StandardCharsets.UTF_8));
        out.writeBytes(CRLF);
    }

    private void encodeBulkString(Object value, ByteBuf out) {
        out.writeByte(DOLLAR);
        if (value == null) {
            out.writeBytes("-1".getBytes(StandardCharsets.UTF_8));
            out.writeBytes(CRLF);
        } else {
            byte[] bytes;
            if (value instanceof byte[]) {
                bytes = (byte[]) value;
            } else {
                bytes = String.valueOf(value).getBytes(StandardCharsets.UTF_8);
            }
            out.writeBytes(String.valueOf(bytes.length).getBytes(StandardCharsets.UTF_8));
            out.writeBytes(CRLF);
            out.writeBytes(bytes);
            out.writeBytes(CRLF);
        }
    }

    @SuppressWarnings("unchecked")
    private void encodeArray(Object value, ByteBuf out) {
        out.writeByte(ASTERISK);
        if (value == null) {
            out.writeBytes("-1".getBytes(StandardCharsets.UTF_8));
            out.writeBytes(CRLF);
        } else {
            List<?> list = (List<?>) value;
            out.writeBytes(String.valueOf(list.size()).getBytes(StandardCharsets.UTF_8));
            out.writeBytes(CRLF);
            for (Object element : list) {
                if (element instanceof byte[]) {
                    encodeBulkString(element, out);
                } else if (element instanceof RedisResponse) {
                    encodeResponse((RedisResponse) element, out);
                } else {
                    encodeBulkString(String.valueOf(element), out);
                }
            }
        }
    }

    private void encodeCommand(RedisCommand command, ByteBuf out) {
        out.writeByte(ASTERISK);
        int totalArgs = command.getArgCount() + 1;
        out.writeBytes(String.valueOf(totalArgs).getBytes(StandardCharsets.UTF_8));
        out.writeBytes(CRLF);

        encodeBulkString(command.getName(), out);
        for (byte[] arg : command.getArgs()) {
            encodeBulkString(arg, out);
        }
    }
}
