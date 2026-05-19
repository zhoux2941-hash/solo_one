package com.graphdb.grpc;

import com.graphdb.algorithm.BFSShortestPath;
import com.graphdb.algorithm.KCoreDecomposition;
import com.graphdb.algorithm.LouvainCommunity;
import com.graphdb.algorithm.PageRank;
import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.GraphStore;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

@GrpcService
public class GraphServiceImpl extends GraphServiceGrpc.GraphServiceImplBase {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private PageRank pageRank;

    @Autowired
    private LouvainCommunity louvainCommunity;

    @Autowired
    private BFSShortestPath bfsShortestPath;

    @Autowired
    private KCoreDecomposition kCoreDecomposition;

    @Override
    public void addVertex(AddVertexRequest request, StreamObserver<AddVertexResponse> responseObserver) {
        VertexProto protoVertex = request.getVertex();

        Vertex vertex = new Vertex();
        vertex.setId(protoVertex.getId());
        vertex.setLabel(protoVertex.getLabel());

        Map<String, Object> properties = new HashMap<>();
        for (Map.Entry<String, String> entry : protoVertex.getPropertiesMap().entrySet()) {
            properties.put(entry.getKey(), entry.getValue());
        }
        vertex.setProperties(properties);

        graphStore.addVertex(vertex);

        AddVertexResponse response = AddVertexResponse.newBuilder()
                .setVertexId(vertex.getId())
                .setSuccess(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void getVertex(GetVertexRequest request, StreamObserver<GetVertexResponse> responseObserver) {
        Vertex vertex = graphStore.getVertex(request.getVertexId());

        GetVertexResponse.Builder builder = GetVertexResponse.newBuilder();

        if (vertex != null) {
            VertexProto.Builder vertexBuilder = VertexProto.newBuilder()
                    .setId(vertex.getId())
                    .setLabel(vertex.getLabel() != null ? vertex.getLabel() : "");

            if (vertex.getProperties() != null) {
                for (Map.Entry<String, Object> entry : vertex.getProperties().entrySet()) {
                    vertexBuilder.putProperties(entry.getKey(),
                            entry.getValue() != null ? entry.getValue().toString() : "");
                }
            }

            builder.setVertex(vertexBuilder.build())
                    .setFound(true);
        } else {
            builder.setFound(false);
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void addEdge(AddEdgeRequest request, StreamObserver<AddEdgeResponse> responseObserver) {
        EdgeProto protoEdge = request.getEdge();

        Edge edge = new Edge();
        edge.setId(protoEdge.getId());
        edge.setFromVertexId(protoEdge.getFromVertexId());
        edge.setToVertexId(protoEdge.getToVertexId());
        edge.setLabel(protoEdge.getLabel());
        edge.setWeight(protoEdge.getWeight());

        Map<String, Object> properties = new HashMap<>();
        for (Map.Entry<String, String> entry : protoEdge.getPropertiesMap().entrySet()) {
            properties.put(entry.getKey(), entry.getValue());
        }
        edge.setProperties(properties);

        graphStore.addEdge(edge);

        AddEdgeResponse response = AddEdgeResponse.newBuilder()
                .setEdgeId(edge.getId())
                .setSuccess(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void computePageRank(PageRankRequest request, StreamObserver<PageRankResponse> responseObserver) {
        Map<Long, Double> result = pageRank.compute(
                request.getDampingFactor() != 0 ? request.getDampingFactor() : 0.85,
                request.getConvergenceThreshold() != 0 ? request.getConvergenceThreshold() : 1e-6,
                request.getMaxIterations() != 0 ? request.getMaxIterations() : 100
        );

        PageRankResponse.Builder builder = PageRankResponse.newBuilder();
        for (Map.Entry<Long, Double> entry : result.entrySet()) {
            builder.putPageRanks(entry.getKey(), entry.getValue());
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void detectCommunities(CommunityDetectionRequest request,
                                   StreamObserver<CommunityDetectionResponse> responseObserver) {
        LouvainCommunity.CommunityResult result = louvainCommunity.compute(
                request.getResolution() != 0 ? request.getResolution() : 1.0,
                request.getMaxIterations() != 0 ? request.getMaxIterations() : 10
        );

        CommunityDetectionResponse.Builder builder = CommunityDetectionResponse.newBuilder();
        for (Map.Entry<Long, Long> entry : result.getVertexToCommunity().entrySet()) {
            builder.putVertexToCommunity(entry.getKey(), entry.getValue());
        }
        builder.setNumCommunities(result.getNumCommunities());
        builder.setModularity(result.getModularity());

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void computeShortestPath(ShortestPathRequest request,
                                     StreamObserver<ShortestPathResponse> responseObserver) {
        Map<Long, Integer> result = bfsShortestPath.compute(request.getSourceVertexId());

        ShortestPathResponse.Builder builder = ShortestPathResponse.newBuilder();
        for (Map.Entry<Long, Integer> entry : result.entrySet()) {
            builder.putDistances(entry.getKey(), entry.getValue());
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void computeKCore(KCoreRequest request, StreamObserver<KCoreResponse> responseObserver) {
        Map<Long, Integer> result;
        if (request.getK() > 0) {
            result = kCoreDecomposition.getKCore(request.getK());
        } else {
            result = kCoreDecomposition.compute();
        }

        KCoreResponse.Builder builder = KCoreResponse.newBuilder();
        for (Map.Entry<Long, Integer> entry : result.entrySet()) {
            builder.putCoreNumbers(entry.getKey(), entry.getValue());
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void getGraphStats(GraphStatsRequest request, StreamObserver<GraphStatsResponse> responseObserver) {
        long vertexCount = graphStore.getVertexCount();
        long edgeCount = graphStore.getEdgeCount();

        GraphStatsResponse response = GraphStatsResponse.newBuilder()
                .setVertexCount(vertexCount)
                .setEdgeCount(edgeCount)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}