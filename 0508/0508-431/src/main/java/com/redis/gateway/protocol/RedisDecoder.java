package com.redis.gateway.protocol;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageDecoder;
import io.netty.handler.codec.DecoderException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class RedisDecoder extends ByteToMessageDecoder {
    private static final Logger logger = LoggerFactory.getLogger(RedisDecoder.class);

    private static final int MAX_BULK_SIZE = 512 * 1024 * 1024;
    private static final int MAX_ARRAY_SIZE = 1024 * 1024;

    private enum State {
        READ_FIRST_BYTE,
        READ_INLINE,
        READ_SIMPLE_STRING,
        READ_ERROR,
        READ_INTEGER,
        READ_BULK_LENGTH,
        READ_BULK_CONTENT,
        READ_ARRAY_LENGTH,
        READ_ARRAY_ELEMENT
    }

    private State state = State.READ_FIRST_BYTE;
    private int bulkLength;
    private int arrayLength;
    private List<byte[]> arrayElements;
    private StringBuilder stringBuilder = new StringBuilder();

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        while (in.isReadable()) {
            switch (state) {
                case READ_FIRST_BYTE:
                    decodeFirstByte(in);
                    break;
                case READ_INLINE:
                    decodeInline(in, out);
                    break;
                case READ_SIMPLE_STRING:
                    decodeSimpleString(in, out);
                    break;
                case READ_ERROR:
                    decodeError(in, out);
                    break;
                case READ_INTEGER:
                    decodeInteger(in, out);
                    break;
                case READ_BULK_LENGTH:
                    decodeBulkLength(in);
                    break;
                case READ_BULK_CONTENT:
                    decodeBulkContent(in, out);
                    break;
                case READ_ARRAY_LENGTH:
                    decodeArrayLength(in);
                    break;
                case READ_ARRAY_ELEMENT:
                    decodeArrayElement(in);
                    if (arrayElements != null && arrayElements.size() == arrayLength) {
                        buildCommand(out);
                        reset();
                    }
                    break;
            }
        }
    }

    private void decodeFirstByte(ByteBuf in) {
        byte b = in.readByte();
        switch (b) {
            case '*':
                state = State.READ_ARRAY_LENGTH;
                break;
            case '$':
                state = State.READ_BULK_LENGTH;
                break;
            case '+':
                state = State.READ_SIMPLE_STRING;
                break;
            case '-':
                state = State.READ_ERROR;
                break;
            case ':':
                state = State.READ_INTEGER;
                break;
            default:
                stringBuilder.append((char) b);
                state = State.READ_INLINE;
                break;
        }
    }

    private void decodeInline(ByteBuf in, List<Object> out) {
        while (in.isReadable()) {
            byte b = in.readByte();
            if (b == '\r') {
                if (in.isReadable() && in.readByte() == '\n') {
                    String line = stringBuilder.toString().trim();
                    stringBuilder.setLength(0);
                    if (!line.isEmpty()) {
                        String[] parts = line.split("\\s+");
                        List<byte[]> args = new ArrayList<>(parts.length - 1);
                        for (int i = 1; i < parts.length; i++) {
                            args.add(parts[i].getBytes(StandardCharsets.UTF_8));
                        }
                        out.add(new RedisCommand(parts[0], args));
                    }
                    state = State.READ_FIRST_BYTE;
                    return;
                }
            } else {
                stringBuilder.append((char) b);
            }
        }
    }

    private void decodeSimpleString(ByteBuf in, List<Object> out) {
        while (in.isReadable()) {
            byte b = in.readByte();
            if (b == '\r') {
                if (in.isReadable() && in.readByte() == '\n') {
                    out.add(new RedisResponse(RedisResponse.Type.SIMPLE_STRING, stringBuilder.toString()));
                    stringBuilder.setLength(0);
                    state = State.READ_FIRST_BYTE;
                    return;
                }
            } else {
                stringBuilder.append((char) b);
            }
        }
    }

    private void decodeError(ByteBuf in, List<Object> out) {
        while (in.isReadable()) {
            byte b = in.readByte();
            if (b == '\r') {
                if (in.isReadable() && in.readByte() == '\n') {
                    out.add(new RedisResponse(RedisResponse.Type.ERROR, stringBuilder.toString()));
                    stringBuilder.setLength(0);
                    state = State.READ_FIRST_BYTE;
                    return;
                }
            } else {
                stringBuilder.append((char) b);
            }
        }
    }

    private void decodeInteger(ByteBuf in, List<Object> out) {
        while (in.isReadable()) {
            byte b = in.readByte();
            if (b == '\r') {
                if (in.isReadable() && in.readByte() == '\n') {
                    out.add(new RedisResponse(RedisResponse.Type.INTEGER, Long.parseLong(stringBuilder.toString())));
                    stringBuilder.setLength(0);
                    state = State.READ_FIRST_BYTE;
                    return;
                }
            } else {
                stringBuilder.append((char) b);
            }
        }
    }

    private void decodeBulkLength(ByteBuf in) {
        while (in.isReadable()) {
            byte b = in.readByte();
            if (b == '\r') {
                if (in.isReadable() && in.readByte() == '\n') {
                    bulkLength = Integer.parseInt(stringBuilder.toString());
                    stringBuilder.setLength(0);
                    if (bulkLength == -1) {
                        state = State.READ_FIRST_BYTE;
                    } else if (bulkLength > MAX_BULK_SIZE) {
                        throw new DecoderException("Bulk string too large: " + bulkLength);
                    } else {
                        state = State.READ_BULK_CONTENT;
                    }
                    return;
                }
            } else {
                stringBuilder.append((char) b);
            }
        }
    }

    private void decodeBulkContent(ByteBuf in, List<Object> out) {
        if (in.readableBytes() < bulkLength + 2) {
            return;
        }
        byte[] content = new byte[bulkLength];
        in.readBytes(content);
        in.skipBytes(2);
        if (arrayElements != null) {
            arrayElements.add(content);
            state = State.READ_ARRAY_ELEMENT;
        } else {
            out.add(new RedisResponse(RedisResponse.Type.BULK_STRING, content));
            state = State.READ_FIRST_BYTE;
        }
    }

    private void decodeArrayLength(ByteBuf in) {
        while (in.isReadable()) {
            byte b = in.readByte();
            if (b == '\r') {
                if (in.isReadable() && in.readByte() == '\n') {
                    arrayLength = Integer.parseInt(stringBuilder.toString());
                    stringBuilder.setLength(0);
                    if (arrayLength == -1) {
                        state = State.READ_FIRST_BYTE;
                    } else if (arrayLength > MAX_ARRAY_SIZE) {
                        throw new DecoderException("Array too large: " + arrayLength);
                    } else if (arrayLength == 0) {
                        state = State.READ_FIRST_BYTE;
                    } else {
                        arrayElements = new ArrayList<>(arrayLength);
                        state = State.READ_ARRAY_ELEMENT;
                    }
                    return;
                }
            } else {
                stringBuilder.append((char) b);
            }
        }
    }

    private void decodeArrayElement(ByteBuf in) {
        if (in.isReadable()) {
            byte b = in.readByte();
            if (b == '$') {
                state = State.READ_BULK_LENGTH;
            } else {
                throw new DecoderException("Expected bulk string in array");
            }
        }
    }

    private void buildCommand(List<Object> out) {
        if (arrayElements.isEmpty()) {
            return;
        }
        String command = new String(arrayElements.get(0), StandardCharsets.UTF_8);
        List<byte[]> args = arrayElements.subList(1, arrayElements.size());
        out.add(new RedisCommand(command, args));
    }

    private void reset() {
        state = State.READ_FIRST_BYTE;
        bulkLength = 0;
        arrayLength = 0;
        arrayElements = null;
        stringBuilder.setLength(0);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        logger.error("Redis decoder error", cause);
        ctx.close();
    }
}
