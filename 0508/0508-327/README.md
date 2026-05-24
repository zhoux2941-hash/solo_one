# 血糖仪数据同步工具

基于WebBluetooth的血糖监测数据同步工具，支持多品牌血糖仪，本地数据存储，隐私保护。

## 功能特性

### 🔗 设备连接
- 支持 Contour (拜耳)
- 支持 罗氏 (Roche)
- 支持 鱼跃 (Yuwell)
- WebBluetooth 实时连接

### 📊 数据管理
- IndexedDB 本地存储
- 历史测量记录管理
- 餐前/餐后标记

### 📈 趋势分析
- 日/周/月视图图表
- 正常范围标注 (3.9-10.0 mmol/L)
- 异常值高亮显示

### 🧮 统计分析
- 平均血糖
- 标准差
- 预估糖化血红蛋白 (HbA1c)
- 测量次数统计

### 📄 报告导出
- PDF 报告生成
- 包含统计数据和图表
- 最近记录列表

### 🔒 隐私保护
- 所有数据仅存储在本地浏览器
- 不上传任何服务器
- 同步性能优化 (<30秒)

## 浏览器要求

需要支持 Web Bluetooth API 的浏览器：
- Chrome 56+
- Edge 79+
- Opera 43+

注意：Firefox 和 Safari 目前不支持 Web Bluetooth API。

## 使用方法

1. 在支持的浏览器中打开 `index.html`
2. 选择血糖仪品牌
3. 点击"连接设备"按钮
4. 在蓝牙设备列表中选择您的血糖仪
5. 点击"同步数据"获取历史测量记录
6. 查看血糖趋势图和统计数据
7. 可导出PDF报告保存

## 技术栈

- 原生 JavaScript (ES6+)
- Web Bluetooth API
- IndexedDB
- Chart.js (图表)
- jsPDF + html2canvas (PDF导出)

## 血糖标准

- 正常范围: 3.9 - 10.0 mmol/L
- 低于3.9 mmol/L: 偏低
- 高于10.0 mmol/L: 偏高

## HbA1c计算公式

```
HbA1c = (平均血糖 + 4.29) / 1.59
```

## 注意事项

1. 首次使用需要授权蓝牙权限
2. 确保血糖仪已开启蓝牙
3. 部分设备可能需要配对
4. 演示模式会生成模拟数据用于测试

## 文件结构

```
.
├── index.html          # 主页面
├── styles.css          # 样式文件
├── database.js         # IndexedDB 数据库
├── bluetooth.js        # WebBluetooth 连接
├── charts.js           # 图表渲染
├── stats.js            # 统计计算
├── export.js           # PDF导出
└── app.js              # 主应用逻辑
```