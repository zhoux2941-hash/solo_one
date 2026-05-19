# 分布式向量数据库 (VectorDB)

一个高性能的分布式向量数据库，支持向量的插入、删除、更新和相似度搜索。

## 功能特性

### 索引类型
- **HNSW (Hierarchical Navigable Small World)**: 适合高召回率场景，基于图结构的近似最近邻搜索
- **IVF_PQ (Inverted File with Product Quantization)**: 适合大规模压缩场景，支持高效的向量压缩和快速搜索

### 距离度量
- 欧氏距离 (Euclidean Distance)
- 余弦相似度 (Cosine Similarity)

### 向量维度
- 支持 128、256、512 维度

### 分布式特性
- 多 Shard 分片（基于向量 ID 的哈希）
- 每个 Shard 独立构建索引
- 批量插入支持（每次最多 1000 条）
- Top-K 搜索（K ≤ 100）

### 持久化
- 索引持久化存储
- 热加载支持

## 项目结构

```
.
├── CMakeLists.txt          # CMake 构建配置
├── vcpkg.json              # vcpkg 依赖配置
├── proto/
│   └── vectordb.proto      # gRPC 接口定义
├── src/
│   ├── common/             # 公共工具
│   │   ├── types.h         # 类型定义
│   │   ├── vector.h/cpp    # 向量工具
│   │   └── distance.h/cpp  # 距离计算
│   ├── index/              # 索引实现
│   │   ├── vector_index.h  # 索引基类
│   │   ├── hnsw_index.h/cpp  # HNSW 索引
│   │   └── ivf_pq_index.h/cpp # IVF_PQ 索引
│   ├── storage/            # 存储层
│   │   └── mmap_storage.h/cpp # mmap 存储
│   ├── db/                 # 数据库核心
│   │   ├── shard.h/cpp     # 分片管理
│   │   └── shard_manager.h/cpp # 分片管理器
│   ├── server/             # gRPC 服务端
│   │   ├── server.h/cpp    # 服务实现
│   │   └── main.cpp        # 服务端入口
│   └── client/             # gRPC 客户端
│       ├── client.h/cpp    # 客户端实现
│       └── main.cpp        # 客户端示例
└── tests/                  # 单元测试
```

## 构建说明

### 环境要求
- C++20 兼容编译器
- CMake 3.20+
- vcpkg 包管理器

### 依赖库
- gRPC
- Protobuf
- Google Test
- fmt

### 构建步骤

1. 安装 vcpkg 并设置环境变量
```bash
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
bootstrap-vcpkg.bat  # Windows
# 或
./bootstrap-vcpkg.sh  # Linux/macOS

export VCPKG_ROOT=/path/to/vcpkg
```

2. 创建构建目录并构建
```bash
mkdir build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake
cmake --build . --config Release
```

## 使用说明

### 启动服务端

```bash
./vectordb_server [address] [data_dir]

# 示例
./vectordb_server 0.0.0.0:50051 ./data
```

### 运行客户端示例

```bash
./vectordb_client [server_address]

# 示例
./vectordb_client localhost:50051
```

### gRPC 接口

#### CreateCollection - 创建集合
```
rpc CreateCollection(CreateCollectionRequest) returns (CreateCollectionResponse)

参数:
- name: 集合名称
- dimension: 向量维度 (128, 256, 512)
- index_type: 索引类型 (INDEX_TYPE_HNSW, INDEX_TYPE_IVF_PQ)
- distance_metric: 距离度量 (DISTANCE_EUCLIDEAN, DISTANCE_COSINE)
- shard_count: 分片数量
```

#### DropCollection - 删除集合
```
rpc DropCollection(DropCollectionRequest) returns (DropCollectionResponse)

参数:
- name: 集合名称
```

#### Insert - 插入向量
```
rpc Insert(InsertRequest) returns (InsertResponse)

参数:
- collection: 集合名称
- vectors: 向量列表 (最多 1000 条)
```

#### Delete - 删除向量
```
rpc Delete(DeleteRequest) returns (DeleteResponse)

参数:
- collection: 集合名称
- ids: 向量 ID 列表
```

#### Update - 更新向量
```
rpc Update(UpdateRequest) returns (UpdateResponse)

参数:
- collection: 集合名称
- vectors: 向量列表 (最多 1000 条)
```

#### Search - 相似向量搜索
```
rpc Search(SearchRequest) returns (SearchResponse)

参数:
- collection: 集合名称
- query_vector: 查询向量
- top_k: 返回结果数量 (最多 100)

返回:
- 相似向量列表，包含 ID 和距离
```

## 运行测试

```bash
cd build
./run_tests
```

## 技术细节

### HNSW 索引
- 使用分层导航小世界图结构
- 支持动态插入和删除
- 配置参数：M（每层邻居数）、ef_construction（构建时搜索邻居数量）、ef_search（搜索时扩展数量）

### IVF_PQ 索引
- 倒排文件 + 乘积量化
- 支持大规模向量压缩存储
- 需要先训练再插入
- 配置参数：nlist（聚类中心数量）、m（子空间数量）、nbits（每个子空间编码位数）

### 分片策略
- 基于向量 ID 的哈希分片
- 一致性哈希确保均匀分布
- 每个分片独立构建和维护索引

### 持久化
- 索引文件二进制序列化
- 支持热加载
- 数据目录自动管理

## License

MIT
