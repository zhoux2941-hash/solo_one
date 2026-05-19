package com.antifraud.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

public class RuleGrpcServer {
    private static final Logger LOG = LoggerFactory.getLogger(RuleGrpcServer.class);
    private final int port;
    private final Server server;

    public RuleGrpcServer(int port, RuleServiceImpl.RuleUpdateListener listener) throws IOException {
        this.port = port;
        RuleServiceImpl ruleService = new RuleServiceImpl(listener);
        this.server = ServerBuilder.forPort(port)
                .addService(ruleService)
                .build();
    }

    public void start() throws IOException {
        server.start();
        LOG.info("gRPC Rule Server started on port {}", port);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("Shutting down gRPC Rule Server...");
            stop();
        }));
    }

    public void stop() {
        if (server != null) {
            server.shutdown();
        }
    }

    public void blockUntilShutdown() throws InterruptedException {
        if (server != null) {
            server.awaitTermination();
        }
    }
}
