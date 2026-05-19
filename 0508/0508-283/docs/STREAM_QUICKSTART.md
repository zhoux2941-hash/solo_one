# 图流处理快速开始指南

## 1. 启动服务

```bash
mvn spring-boot:run
```

服务启动后：
- REST API: http://localhost:8080
- gRPC: localhost:9090

## 2. 初始化流处理器

```bash
curl -X POST http://localhost:8080/api/stream/initialize
```

## 3. 发送边流数据

### 单条边

```bash
curl -X POST http://localhost:8080/api/stream/edges \
  -H "Content-Type: application/json" \
  -d '{
    "fromVertexId": 1,
    "toVertexId": 2,
    "label": "FOLLOWS",
    "weight": 1.0
  }'
```

### 批量发送边

```bash
curl -X POST http://localhost:8080/api/stream/edges/batch \
  -H "Content-Type: application/json" \
  -d '[
    {"fromVertexId": 1, "toVertexId": 2, "label": "LINK", "weight": 1.0},
    {"fromVertexId": 2, "toVertexId": 3, "label": "LINK", "weight": 1.0},
    {"fromVertexId": 3, "toVertexId": 1, "label": "LINK", "weight": 1.0},
    {"fromVertexId": 3, "toVertexId": 4, "label": "LINK", "weight": 1.0},
    {"fromVertexId": 4, "toVertexId": 5, "label": "LINK", "weight": 1.0},
    {"fromVertexId": 5, "toVertexId": 4, "label": "LINK", "weight": 1.0}
  ]'
```

## 4. 触发增量更新

```bash
curl -X POST http://localhost:8080/api/stream/update
```

响应示例：
```json
{
  "success": true,
  "message": "Update completed successfully",
  "data": {
    "pageRanks": {
      "1": 0.142857,
      "2": 0.142857,
      "3": 0.190476,
      "4": 0.261905,
      "5": 0.261905
    },
    "communities": {
      "1": 1,
      "2": 1,
      "3": 1,
      "4": 4,
      "5": 4
    },
    "processingTimeMs": 12,
    "activeEdges": 6,
    "updateNumber": 1
  }
}
```

## 5. 查询实时结果

### 查询PageRank

```bash
# 所有顶点的PageRank
curl http://localhost:8080/api/stream/pagerank

# 单个顶点的PageRank
curl http://localhost:8080/api/stream/pagerank/4
```

### 查询社区结构

```bash
# 所有顶点的社区分配
curl http://localhost:8080/api/stream/communities

# 单个顶点的社区
curl http://localhost:8080/api/stream/communities/4
```

## 6. 查看流统计

```bash
curl http://localhost:8080/api/stream/statistics
```

响应示例：
```json
{
  "success": true,
  "data": {
    "edgesProcessed": 100,
    "edgesEvicted": 0,
    "activeEdges": 100,
    "updateCount": 5,
    "numCommunities": 8
  }
}
```

## 7. 动态调整配置

```bash
curl -X POST http://localhost:8080/api/stream/config \
  -H "Content-Type: application/json" \
  -d '{
    "windowSizeMs": 120000,
    "slideIntervalMs": 5000,
    "autoUpdateEnabled": true
  }'
```

## 8. 模拟连续边流场景

使用以下脚本模拟连续的边流输入：

```bash
#!/bin/bash

for i in {1..100}; do
  from=$((RANDOM % 50 + 1))
  to=$((RANDOM % 50 + 1))

  curl -s -X POST http://localhost:8080/api/stream/edges \
    -H "Content-Type: application/json" \
    -d "{\"fromVertexId\":$from, \"toVertexId\":$to, \"label\":\"LINK\", \"weight\":1.0}" > /dev/null

  echo "Sent edge $from -> $to"
  sleep 0.1
done

echo "Stream completed!"
```

## 9. 使用Java API

```java
@SpringBootApplication
public class StreamApp implements CommandLineRunner {

    @Autowired
    private GraphStreamProcessor streamProcessor;

    public static void main(String[] args) {
        SpringApplication.run(StreamApp.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. 初始化
        streamProcessor.initializeFromGraph();

        // 2. 添加事件监听器
        streamProcessor.addListener(new GraphStreamProcessor.StreamListener() {
            @Override
            public void onUpdateCompleted(GraphStreamProcessor.StreamProcessingResult result) {
                System.out.println("Update completed! Communities: " +
                    new HashSet<>(result.getCommunities().values()).size());
            }
        });

        // 3. 发送边流
        for (int i = 1; i <= 100; i++) {
            Edge edge = new Edge(i, i % 50 + 1, "LINK");
            streamProcessor.processEdge(edge);
            Thread.sleep(100);
        }

        // 4. 手动触发更新
        GraphStreamProcessor.StreamProcessingResult result =
            streamProcessor.performUpdate();

        // 5. 查看结果
        Map<Long, Double> pageRanks = result.getPageRanks();
        Map<Long, Long> communities = result.getCommunities();

        System.out.println("Active edges: " + result.getActiveEdges());
        System.out.println("Processing time: " + result.getProcessingTimeMs() + "ms");
    }
}
```

## 10. 常见问题

**Q: 为什么PageRank总和不是1？**
A: 增量计算使用局部归一化，如需精确归一化，可以在结果后手动处理。

**Q: 社区数量为什么会变化？**
A: 增量算法会根据边的添加和删除动态调整社区结构，这是正常现象。

**Q: 内存占用过高怎么办？**
A: 1. 减小窗口大小(windowSizeMs) 2. 增加滑动频率 3. 启用外存计算

**Q: 如何禁用自动更新？**
A: 设置`graphdb.stream.auto-update-enabled=false`或调用API：
```bash
curl -X POST http://localhost:8080/api/stream/config \
  -H "Content-Type: application/json" \
  -d '{"autoUpdateEnabled": false}'
```

## 11. 性能调优建议

1. **高吞吐场景**
   - 关闭自动更新，改为定时批量更新
   - 增大消息批量大小
   - 增加窗口大小

2. **低延迟场景**
   - 启用自动更新
   - 减小更新间隔
   - 限制传播深度

3. **大规模图**
   - 配置足够的堆内存
   - 启用外存溢出
   - 增加分区数量
