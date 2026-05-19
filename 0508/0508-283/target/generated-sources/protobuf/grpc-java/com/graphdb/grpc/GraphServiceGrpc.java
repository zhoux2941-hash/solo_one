package com.graphdb.grpc;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.60.0)",
    comments = "Source: graph.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class GraphServiceGrpc {

  private GraphServiceGrpc() {}

  public static final java.lang.String SERVICE_NAME = "graphdb.GraphService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<com.graphdb.grpc.AddVertexRequest,
      com.graphdb.grpc.AddVertexResponse> getAddVertexMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "AddVertex",
      requestType = com.graphdb.grpc.AddVertexRequest.class,
      responseType = com.graphdb.grpc.AddVertexResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.graphdb.grpc.AddVertexRequest,
      com.graphdb.grpc.AddVertexResponse> getAddVertexMethod() {
    io.grpc.MethodDescriptor<com.graphdb.grpc.AddVertexRequest, com.graphdb.grpc.AddVertexResponse> getAddVertexMethod;
    if ((getAddVertexMethod = GraphServiceGrpc.getAddVertexMethod) == null) {
      synchronized (GraphServiceGrpc.class) {
        if ((getAddVertexMethod = GraphServiceGrpc.getAddVertexMethod) == null) {
          GraphServiceGrpc.getAddVertexMethod = getAddVertexMethod =
              io.grpc.MethodDescriptor.<com.graphdb.grpc.AddVertexRequest, com.graphdb.grpc.AddVertexResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "AddVertex"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.AddVertexRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.AddVertexResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GraphServiceMethodDescriptorSupplier("AddVertex"))
              .build();
        }
      }
    }
    return getAddVertexMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.graphdb.grpc.GetVertexRequest,
      com.graphdb.grpc.GetVertexResponse> getGetVertexMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetVertex",
      requestType = com.graphdb.grpc.GetVertexRequest.class,
      responseType = com.graphdb.grpc.GetVertexResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.graphdb.grpc.GetVertexRequest,
      com.graphdb.grpc.GetVertexResponse> getGetVertexMethod() {
    io.grpc.MethodDescriptor<com.graphdb.grpc.GetVertexRequest, com.graphdb.grpc.GetVertexResponse> getGetVertexMethod;
    if ((getGetVertexMethod = GraphServiceGrpc.getGetVertexMethod) == null) {
      synchronized (GraphServiceGrpc.class) {
        if ((getGetVertexMethod = GraphServiceGrpc.getGetVertexMethod) == null) {
          GraphServiceGrpc.getGetVertexMethod = getGetVertexMethod =
              io.grpc.MethodDescriptor.<com.graphdb.grpc.GetVertexRequest, com.graphdb.grpc.GetVertexResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetVertex"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.GetVertexRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.GetVertexResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GraphServiceMethodDescriptorSupplier("GetVertex"))
              .build();
        }
      }
    }
    return getGetVertexMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.graphdb.grpc.AddEdgeRequest,
      com.graphdb.grpc.AddEdgeResponse> getAddEdgeMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "AddEdge",
      requestType = com.graphdb.grpc.AddEdgeRequest.class,
      responseType = com.graphdb.grpc.AddEdgeResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.graphdb.grpc.AddEdgeRequest,
      com.graphdb.grpc.AddEdgeResponse> getAddEdgeMethod() {
    io.grpc.MethodDescriptor<com.graphdb.grpc.AddEdgeRequest, com.graphdb.grpc.AddEdgeResponse> getAddEdgeMethod;
    if ((getAddEdgeMethod = GraphServiceGrpc.getAddEdgeMethod) == null) {
      synchronized (GraphServiceGrpc.class) {
        if ((getAddEdgeMethod = GraphServiceGrpc.getAddEdgeMethod) == null) {
          GraphServiceGrpc.getAddEdgeMethod = getAddEdgeMethod =
              io.grpc.MethodDescriptor.<com.graphdb.grpc.AddEdgeRequest, com.graphdb.grpc.AddEdgeResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "AddEdge"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.AddEdgeRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.AddEdgeResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GraphServiceMethodDescriptorSupplier("AddEdge"))
              .build();
        }
      }
    }
    return getAddEdgeMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.graphdb.grpc.PageRankRequest,
      com.graphdb.grpc.PageRankResponse> getComputePageRankMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ComputePageRank",
      requestType = com.graphdb.grpc.PageRankRequest.class,
      responseType = com.graphdb.grpc.PageRankResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.graphdb.grpc.PageRankRequest,
      com.graphdb.grpc.PageRankResponse> getComputePageRankMethod() {
    io.grpc.MethodDescriptor<com.graphdb.grpc.PageRankRequest, com.graphdb.grpc.PageRankResponse> getComputePageRankMethod;
    if ((getComputePageRankMethod = GraphServiceGrpc.getComputePageRankMethod) == null) {
      synchronized (GraphServiceGrpc.class) {
        if ((getComputePageRankMethod = GraphServiceGrpc.getComputePageRankMethod) == null) {
          GraphServiceGrpc.getComputePageRankMethod = getComputePageRankMethod =
              io.grpc.MethodDescriptor.<com.graphdb.grpc.PageRankRequest, com.graphdb.grpc.PageRankResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ComputePageRank"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.PageRankRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.PageRankResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GraphServiceMethodDescriptorSupplier("ComputePageRank"))
              .build();
        }
      }
    }
    return getComputePageRankMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.graphdb.grpc.CommunityDetectionRequest,
      com.graphdb.grpc.CommunityDetectionResponse> getDetectCommunitiesMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "DetectCommunities",
      requestType = com.graphdb.grpc.CommunityDetectionRequest.class,
      responseType = com.graphdb.grpc.CommunityDetectionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.graphdb.grpc.CommunityDetectionRequest,
      com.graphdb.grpc.CommunityDetectionResponse> getDetectCommunitiesMethod() {
    io.grpc.MethodDescriptor<com.graphdb.grpc.CommunityDetectionRequest, com.graphdb.grpc.CommunityDetectionResponse> getDetectCommunitiesMethod;
    if ((getDetectCommunitiesMethod = GraphServiceGrpc.getDetectCommunitiesMethod) == null) {
      synchronized (GraphServiceGrpc.class) {
        if ((getDetectCommunitiesMethod = GraphServiceGrpc.getDetectCommunitiesMethod) == null) {
          GraphServiceGrpc.getDetectCommunitiesMethod = getDetectCommunitiesMethod =
              io.grpc.MethodDescriptor.<com.graphdb.grpc.CommunityDetectionRequest, com.graphdb.grpc.CommunityDetectionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "DetectCommunities"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.CommunityDetectionRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.CommunityDetectionResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GraphServiceMethodDescriptorSupplier("DetectCommunities"))
              .build();
        }
      }
    }
    return getDetectCommunitiesMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.graphdb.grpc.ShortestPathRequest,
      com.graphdb.grpc.ShortestPathResponse> getComputeShortestPathMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ComputeShortestPath",
      requestType = com.graphdb.grpc.ShortestPathRequest.class,
      responseType = com.graphdb.grpc.ShortestPathResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.graphdb.grpc.ShortestPathRequest,
      com.graphdb.grpc.ShortestPathResponse> getComputeShortestPathMethod() {
    io.grpc.MethodDescriptor<com.graphdb.grpc.ShortestPathRequest, com.graphdb.grpc.ShortestPathResponse> getComputeShortestPathMethod;
    if ((getComputeShortestPathMethod = GraphServiceGrpc.getComputeShortestPathMethod) == null) {
      synchronized (GraphServiceGrpc.class) {
        if ((getComputeShortestPathMethod = GraphServiceGrpc.getComputeShortestPathMethod) == null) {
          GraphServiceGrpc.getComputeShortestPathMethod = getComputeShortestPathMethod =
              io.grpc.MethodDescriptor.<com.graphdb.grpc.ShortestPathRequest, com.graphdb.grpc.ShortestPathResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ComputeShortestPath"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.ShortestPathRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.ShortestPathResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GraphServiceMethodDescriptorSupplier("ComputeShortestPath"))
              .build();
        }
      }
    }
    return getComputeShortestPathMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.graphdb.grpc.KCoreRequest,
      com.graphdb.grpc.KCoreResponse> getComputeKCoreMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ComputeKCore",
      requestType = com.graphdb.grpc.KCoreRequest.class,
      responseType = com.graphdb.grpc.KCoreResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.graphdb.grpc.KCoreRequest,
      com.graphdb.grpc.KCoreResponse> getComputeKCoreMethod() {
    io.grpc.MethodDescriptor<com.graphdb.grpc.KCoreRequest, com.graphdb.grpc.KCoreResponse> getComputeKCoreMethod;
    if ((getComputeKCoreMethod = GraphServiceGrpc.getComputeKCoreMethod) == null) {
      synchronized (GraphServiceGrpc.class) {
        if ((getComputeKCoreMethod = GraphServiceGrpc.getComputeKCoreMethod) == null) {
          GraphServiceGrpc.getComputeKCoreMethod = getComputeKCoreMethod =
              io.grpc.MethodDescriptor.<com.graphdb.grpc.KCoreRequest, com.graphdb.grpc.KCoreResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ComputeKCore"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.KCoreRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.KCoreResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GraphServiceMethodDescriptorSupplier("ComputeKCore"))
              .build();
        }
      }
    }
    return getComputeKCoreMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.graphdb.grpc.GraphStatsRequest,
      com.graphdb.grpc.GraphStatsResponse> getGetGraphStatsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetGraphStats",
      requestType = com.graphdb.grpc.GraphStatsRequest.class,
      responseType = com.graphdb.grpc.GraphStatsResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.graphdb.grpc.GraphStatsRequest,
      com.graphdb.grpc.GraphStatsResponse> getGetGraphStatsMethod() {
    io.grpc.MethodDescriptor<com.graphdb.grpc.GraphStatsRequest, com.graphdb.grpc.GraphStatsResponse> getGetGraphStatsMethod;
    if ((getGetGraphStatsMethod = GraphServiceGrpc.getGetGraphStatsMethod) == null) {
      synchronized (GraphServiceGrpc.class) {
        if ((getGetGraphStatsMethod = GraphServiceGrpc.getGetGraphStatsMethod) == null) {
          GraphServiceGrpc.getGetGraphStatsMethod = getGetGraphStatsMethod =
              io.grpc.MethodDescriptor.<com.graphdb.grpc.GraphStatsRequest, com.graphdb.grpc.GraphStatsResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetGraphStats"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.GraphStatsRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.graphdb.grpc.GraphStatsResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GraphServiceMethodDescriptorSupplier("GetGraphStats"))
              .build();
        }
      }
    }
    return getGetGraphStatsMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static GraphServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<GraphServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<GraphServiceStub>() {
        @java.lang.Override
        public GraphServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new GraphServiceStub(channel, callOptions);
        }
      };
    return GraphServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static GraphServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<GraphServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<GraphServiceBlockingStub>() {
        @java.lang.Override
        public GraphServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new GraphServiceBlockingStub(channel, callOptions);
        }
      };
    return GraphServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static GraphServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<GraphServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<GraphServiceFutureStub>() {
        @java.lang.Override
        public GraphServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new GraphServiceFutureStub(channel, callOptions);
        }
      };
    return GraphServiceFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     */
    default void addVertex(com.graphdb.grpc.AddVertexRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.AddVertexResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getAddVertexMethod(), responseObserver);
    }

    /**
     */
    default void getVertex(com.graphdb.grpc.GetVertexRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.GetVertexResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetVertexMethod(), responseObserver);
    }

    /**
     */
    default void addEdge(com.graphdb.grpc.AddEdgeRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.AddEdgeResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getAddEdgeMethod(), responseObserver);
    }

    /**
     */
    default void computePageRank(com.graphdb.grpc.PageRankRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.PageRankResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getComputePageRankMethod(), responseObserver);
    }

    /**
     */
    default void detectCommunities(com.graphdb.grpc.CommunityDetectionRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.CommunityDetectionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getDetectCommunitiesMethod(), responseObserver);
    }

    /**
     */
    default void computeShortestPath(com.graphdb.grpc.ShortestPathRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.ShortestPathResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getComputeShortestPathMethod(), responseObserver);
    }

    /**
     */
    default void computeKCore(com.graphdb.grpc.KCoreRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.KCoreResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getComputeKCoreMethod(), responseObserver);
    }

    /**
     */
    default void getGraphStats(com.graphdb.grpc.GraphStatsRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.GraphStatsResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetGraphStatsMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service GraphService.
   */
  public static abstract class GraphServiceImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return GraphServiceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service GraphService.
   */
  public static final class GraphServiceStub
      extends io.grpc.stub.AbstractAsyncStub<GraphServiceStub> {
    private GraphServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected GraphServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new GraphServiceStub(channel, callOptions);
    }

    /**
     */
    public void addVertex(com.graphdb.grpc.AddVertexRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.AddVertexResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getAddVertexMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getVertex(com.graphdb.grpc.GetVertexRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.GetVertexResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetVertexMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void addEdge(com.graphdb.grpc.AddEdgeRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.AddEdgeResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getAddEdgeMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void computePageRank(com.graphdb.grpc.PageRankRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.PageRankResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getComputePageRankMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void detectCommunities(com.graphdb.grpc.CommunityDetectionRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.CommunityDetectionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getDetectCommunitiesMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void computeShortestPath(com.graphdb.grpc.ShortestPathRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.ShortestPathResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getComputeShortestPathMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void computeKCore(com.graphdb.grpc.KCoreRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.KCoreResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getComputeKCoreMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getGraphStats(com.graphdb.grpc.GraphStatsRequest request,
        io.grpc.stub.StreamObserver<com.graphdb.grpc.GraphStatsResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetGraphStatsMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service GraphService.
   */
  public static final class GraphServiceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<GraphServiceBlockingStub> {
    private GraphServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected GraphServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new GraphServiceBlockingStub(channel, callOptions);
    }

    /**
     */
    public com.graphdb.grpc.AddVertexResponse addVertex(com.graphdb.grpc.AddVertexRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getAddVertexMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.graphdb.grpc.GetVertexResponse getVertex(com.graphdb.grpc.GetVertexRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetVertexMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.graphdb.grpc.AddEdgeResponse addEdge(com.graphdb.grpc.AddEdgeRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getAddEdgeMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.graphdb.grpc.PageRankResponse computePageRank(com.graphdb.grpc.PageRankRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getComputePageRankMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.graphdb.grpc.CommunityDetectionResponse detectCommunities(com.graphdb.grpc.CommunityDetectionRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getDetectCommunitiesMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.graphdb.grpc.ShortestPathResponse computeShortestPath(com.graphdb.grpc.ShortestPathRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getComputeShortestPathMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.graphdb.grpc.KCoreResponse computeKCore(com.graphdb.grpc.KCoreRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getComputeKCoreMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.graphdb.grpc.GraphStatsResponse getGraphStats(com.graphdb.grpc.GraphStatsRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetGraphStatsMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service GraphService.
   */
  public static final class GraphServiceFutureStub
      extends io.grpc.stub.AbstractFutureStub<GraphServiceFutureStub> {
    private GraphServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected GraphServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new GraphServiceFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.graphdb.grpc.AddVertexResponse> addVertex(
        com.graphdb.grpc.AddVertexRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getAddVertexMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.graphdb.grpc.GetVertexResponse> getVertex(
        com.graphdb.grpc.GetVertexRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetVertexMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.graphdb.grpc.AddEdgeResponse> addEdge(
        com.graphdb.grpc.AddEdgeRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getAddEdgeMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.graphdb.grpc.PageRankResponse> computePageRank(
        com.graphdb.grpc.PageRankRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getComputePageRankMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.graphdb.grpc.CommunityDetectionResponse> detectCommunities(
        com.graphdb.grpc.CommunityDetectionRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getDetectCommunitiesMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.graphdb.grpc.ShortestPathResponse> computeShortestPath(
        com.graphdb.grpc.ShortestPathRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getComputeShortestPathMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.graphdb.grpc.KCoreResponse> computeKCore(
        com.graphdb.grpc.KCoreRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getComputeKCoreMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.graphdb.grpc.GraphStatsResponse> getGraphStats(
        com.graphdb.grpc.GraphStatsRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetGraphStatsMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_ADD_VERTEX = 0;
  private static final int METHODID_GET_VERTEX = 1;
  private static final int METHODID_ADD_EDGE = 2;
  private static final int METHODID_COMPUTE_PAGE_RANK = 3;
  private static final int METHODID_DETECT_COMMUNITIES = 4;
  private static final int METHODID_COMPUTE_SHORTEST_PATH = 5;
  private static final int METHODID_COMPUTE_KCORE = 6;
  private static final int METHODID_GET_GRAPH_STATS = 7;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_ADD_VERTEX:
          serviceImpl.addVertex((com.graphdb.grpc.AddVertexRequest) request,
              (io.grpc.stub.StreamObserver<com.graphdb.grpc.AddVertexResponse>) responseObserver);
          break;
        case METHODID_GET_VERTEX:
          serviceImpl.getVertex((com.graphdb.grpc.GetVertexRequest) request,
              (io.grpc.stub.StreamObserver<com.graphdb.grpc.GetVertexResponse>) responseObserver);
          break;
        case METHODID_ADD_EDGE:
          serviceImpl.addEdge((com.graphdb.grpc.AddEdgeRequest) request,
              (io.grpc.stub.StreamObserver<com.graphdb.grpc.AddEdgeResponse>) responseObserver);
          break;
        case METHODID_COMPUTE_PAGE_RANK:
          serviceImpl.computePageRank((com.graphdb.grpc.PageRankRequest) request,
              (io.grpc.stub.StreamObserver<com.graphdb.grpc.PageRankResponse>) responseObserver);
          break;
        case METHODID_DETECT_COMMUNITIES:
          serviceImpl.detectCommunities((com.graphdb.grpc.CommunityDetectionRequest) request,
              (io.grpc.stub.StreamObserver<com.graphdb.grpc.CommunityDetectionResponse>) responseObserver);
          break;
        case METHODID_COMPUTE_SHORTEST_PATH:
          serviceImpl.computeShortestPath((com.graphdb.grpc.ShortestPathRequest) request,
              (io.grpc.stub.StreamObserver<com.graphdb.grpc.ShortestPathResponse>) responseObserver);
          break;
        case METHODID_COMPUTE_KCORE:
          serviceImpl.computeKCore((com.graphdb.grpc.KCoreRequest) request,
              (io.grpc.stub.StreamObserver<com.graphdb.grpc.KCoreResponse>) responseObserver);
          break;
        case METHODID_GET_GRAPH_STATS:
          serviceImpl.getGraphStats((com.graphdb.grpc.GraphStatsRequest) request,
              (io.grpc.stub.StreamObserver<com.graphdb.grpc.GraphStatsResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getAddVertexMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.graphdb.grpc.AddVertexRequest,
              com.graphdb.grpc.AddVertexResponse>(
                service, METHODID_ADD_VERTEX)))
        .addMethod(
          getGetVertexMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.graphdb.grpc.GetVertexRequest,
              com.graphdb.grpc.GetVertexResponse>(
                service, METHODID_GET_VERTEX)))
        .addMethod(
          getAddEdgeMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.graphdb.grpc.AddEdgeRequest,
              com.graphdb.grpc.AddEdgeResponse>(
                service, METHODID_ADD_EDGE)))
        .addMethod(
          getComputePageRankMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.graphdb.grpc.PageRankRequest,
              com.graphdb.grpc.PageRankResponse>(
                service, METHODID_COMPUTE_PAGE_RANK)))
        .addMethod(
          getDetectCommunitiesMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.graphdb.grpc.CommunityDetectionRequest,
              com.graphdb.grpc.CommunityDetectionResponse>(
                service, METHODID_DETECT_COMMUNITIES)))
        .addMethod(
          getComputeShortestPathMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.graphdb.grpc.ShortestPathRequest,
              com.graphdb.grpc.ShortestPathResponse>(
                service, METHODID_COMPUTE_SHORTEST_PATH)))
        .addMethod(
          getComputeKCoreMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.graphdb.grpc.KCoreRequest,
              com.graphdb.grpc.KCoreResponse>(
                service, METHODID_COMPUTE_KCORE)))
        .addMethod(
          getGetGraphStatsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.graphdb.grpc.GraphStatsRequest,
              com.graphdb.grpc.GraphStatsResponse>(
                service, METHODID_GET_GRAPH_STATS)))
        .build();
  }

  private static abstract class GraphServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    GraphServiceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return com.graphdb.grpc.GraphProto.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("GraphService");
    }
  }

  private static final class GraphServiceFileDescriptorSupplier
      extends GraphServiceBaseDescriptorSupplier {
    GraphServiceFileDescriptorSupplier() {}
  }

  private static final class GraphServiceMethodDescriptorSupplier
      extends GraphServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    GraphServiceMethodDescriptorSupplier(java.lang.String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (GraphServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new GraphServiceFileDescriptorSupplier())
              .addMethod(getAddVertexMethod())
              .addMethod(getGetVertexMethod())
              .addMethod(getAddEdgeMethod())
              .addMethod(getComputePageRankMethod())
              .addMethod(getDetectCommunitiesMethod())
              .addMethod(getComputeShortestPathMethod())
              .addMethod(getComputeKCoreMethod())
              .addMethod(getGetGraphStatsMethod())
              .build();
        }
      }
    }
    return result;
  }
}
