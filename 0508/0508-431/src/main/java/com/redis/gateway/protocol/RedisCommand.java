package com.redis.gateway.protocol;

import java.util.ArrayList;
import java.util.List;

public class RedisCommand {
    private final String name;
    private final List<byte[]> args;
    private final List<String> argStrings;
    private final long timestamp;

    public RedisCommand(String name, List<byte[]> args) {
        this.name = name.toUpperCase();
        this.args = args;
        this.argStrings = new ArrayList<>(args.size());
        for (byte[] arg : args) {
            argStrings.add(new String(arg));
        }
        this.timestamp = System.currentTimeMillis();
    }

    public String getName() {
        return name;
    }

    public List<byte[]> getArgs() {
        return args;
    }

    public List<String> getArgStrings() {
        return argStrings;
    }

    public String getArg(int index) {
        if (index < argStrings.size()) {
            return argStrings.get(index);
        }
        return null;
    }

    public byte[] getArgBytes(int index) {
        if (index < args.size()) {
            return args.get(index);
        }
        return null;
    }

    public int getArgCount() {
        return args.size();
    }

    public long getTimestamp() {
        return timestamp;
    }

    public String getKey() {
        if (!args.isEmpty()) {
            return argStrings.get(0);
        }
        return null;
    }

    public boolean isWriteCommand() {
        return CommandType.isWriteCommand(name);
    }

    public boolean isReadCommand() {
        return CommandType.isReadCommand(name);
    }

    public enum CommandType {
        GET, SET, SETNX, SETEX, PSETEX, APPEND, DEL, EXPIRE, EXPIREAT, PERSIST,
        TTL, PTTL, EXISTS, TYPE,
        INCR, INCRBY, INCRBYFLOAT, DECR, DECRBY,
        LPUSH, LPUSHX, RPUSH, RPUSHX, LPOP, RPOP, LREM, LLEN, LINDEX, LINSERT,
        LSET, LRANGE, LTRIM, RPOPLPUSH,
        SADD, SREM, SISMEMBER, SCARD, SMEMBERS, SRANDMEMBER, SPOP, SMOVE,
        SINTER, SINTERSTORE, SUNION, SUNIONSTORE, SDIFF, SDIFFSTORE,
        HSET, HSETNX, HGET, HMGET, HMSET, HINCRBY, HINCRBYFLOAT, HDEL,
        HEXISTS, HLEN, HKEYS, HVALS, HGETALL, HSCAN,
        ZADD, ZSCORE, ZINCRBY, ZCARD, ZCOUNT, ZRANGE, ZREVRANGE,
        ZRANGEBYSCORE, ZREVRANGEBYSCORE, ZRANK, ZREVRANK, ZREM, ZREMRANGEBYRANK,
        ZREMRANGEBYSCORE, ZUNIONSTORE, ZINTERSTORE,
        MGET, MSET, MSETNX,
        STRLEN, GETRANGE, GETSET, SETBIT, GETBIT, BITCOUNT, BITOP,
        PING, AUTH, SELECT, INFO, COMMAND, CLIENT, CONFIG,
        SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE,
        PUBLISH,
        MULTI, EXEC, DISCARD, WATCH, UNWATCH,
        EVAL, EVALSHA, SCRIPT,
        DBSIZE, FLUSHDB, FLUSHALL,
        KEYS, SCAN, RANDOMKEY,
        RENAME, RENAMENX, MOVE,
        SORT,
        BLPOP, BRPOP, BRPOPLPUSH,
        GEOADD, GEODIST, GEOHASH, GEOPOS, GEORADIUS, GEORADIUSBYMEMBER,
        PFADD, PFCOUNT, PFMERGE;

        private static final java.util.Set<String> WRITE_COMMANDS = new java.util.HashSet<>();

        static {
            WRITE_COMMANDS.add("SET");
            WRITE_COMMANDS.add("SETNX");
            WRITE_COMMANDS.add("SETEX");
            WRITE_COMMANDS.add("PSETEX");
            WRITE_COMMANDS.add("APPEND");
            WRITE_COMMANDS.add("DEL");
            WRITE_COMMANDS.add("EXPIRE");
            WRITE_COMMANDS.add("EXPIREAT");
            WRITE_COMMANDS.add("PERSIST");
            WRITE_COMMANDS.add("INCR");
            WRITE_COMMANDS.add("INCRBY");
            WRITE_COMMANDS.add("INCRBYFLOAT");
            WRITE_COMMANDS.add("DECR");
            WRITE_COMMANDS.add("DECRBY");
            WRITE_COMMANDS.add("LPUSH");
            WRITE_COMMANDS.add("LPUSHX");
            WRITE_COMMANDS.add("RPUSH");
            WRITE_COMMANDS.add("RPUSHX");
            WRITE_COMMANDS.add("LPOP");
            WRITE_COMMANDS.add("RPOP");
            WRITE_COMMANDS.add("LREM");
            WRITE_COMMANDS.add("LINSERT");
            WRITE_COMMANDS.add("LSET");
            WRITE_COMMANDS.add("LTRIM");
            WRITE_COMMANDS.add("RPOPLPUSH");
            WRITE_COMMANDS.add("SADD");
            WRITE_COMMANDS.add("SREM");
            WRITE_COMMANDS.add("SPOP");
            WRITE_COMMANDS.add("SMOVE");
            WRITE_COMMANDS.add("SINTERSTORE");
            WRITE_COMMANDS.add("SUNIONSTORE");
            WRITE_COMMANDS.add("SDIFFSTORE");
            WRITE_COMMANDS.add("HSET");
            WRITE_COMMANDS.add("HSETNX");
            WRITE_COMMANDS.add("HMSET");
            WRITE_COMMANDS.add("HINCRBY");
            WRITE_COMMANDS.add("HINCRBYFLOAT");
            WRITE_COMMANDS.add("HDEL");
            WRITE_COMMANDS.add("ZADD");
            WRITE_COMMANDS.add("ZINCRBY");
            WRITE_COMMANDS.add("ZREM");
            WRITE_COMMANDS.add("ZREMRANGEBYRANK");
            WRITE_COMMANDS.add("ZREMRANGEBYSCORE");
            WRITE_COMMANDS.add("ZUNIONSTORE");
            WRITE_COMMANDS.add("ZINTERSTORE");
            WRITE_COMMANDS.add("MSET");
            WRITE_COMMANDS.add("MSETNX");
            WRITE_COMMANDS.add("GETSET");
            WRITE_COMMANDS.add("SETBIT");
            WRITE_COMMANDS.add("BITOP");
            WRITE_COMMANDS.add("RENAME");
            WRITE_COMMANDS.add("RENAMENX");
            WRITE_COMMANDS.add("MOVE");
            WRITE_COMMANDS.add("FLUSHDB");
            WRITE_COMMANDS.add("FLUSHALL");
            WRITE_COMMANDS.add("MULTI");
            WRITE_COMMANDS.add("EXEC");
            WRITE_COMMANDS.add("DISCARD");
            WRITE_COMMANDS.add("WATCH");
            WRITE_COMMANDS.add("UNWATCH");
            WRITE_COMMANDS.add("EVAL");
            WRITE_COMMANDS.add("EVALSHA");
            WRITE_COMMANDS.add("BLPOP");
            WRITE_COMMANDS.add("BRPOP");
            WRITE_COMMANDS.add("BRPOPLPUSH");
            WRITE_COMMANDS.add("GEOADD");
            WRITE_COMMANDS.add("PFADD");
            WRITE_COMMANDS.add("PFMERGE");
            WRITE_COMMANDS.add("SORT");
        }

        public static boolean isWriteCommand(String command) {
            return WRITE_COMMANDS.contains(command.toUpperCase());
        }

        public static boolean isReadCommand(String command) {
            return !isWriteCommand(command);
        }
    }

    @Override
    public String toString() {
        return name + " " + String.join(" ", argStrings);
    }
}
