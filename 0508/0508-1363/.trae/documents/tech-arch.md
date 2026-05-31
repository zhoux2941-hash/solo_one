# vCard联系人管理系统 - 技术架构文档

## 1. 技术栈选型

| 类别 | 技术选择 | 版本 | 说明 |
|------|----------|------|------|
| 前端框架 | React | 18.x | 组件化开发，生态完善 |
| 语言 | TypeScript | 5.x | 类型安全，提升代码可维护性 |
| 构建工具 | Vite | 5.x | 快速构建，热更新 |
| 状态管理 | Zustand | 4.x | 轻量级，简单易用 |
| 样式方案 | Tailwind CSS | 3.x | 原子化CSS，快速开发 |
| UI组件 | Headless UI | 2.x | 无样式组件，灵活定制 |
| 图标 | Lucide React | 0.3.x | 现代化图标库 |

## 2. 项目目录结构

```
src/
├── assets/              # 静态资源
│   └── styles/          # 全局样式
├── components/          # UI组件
│   ├── common/          # 通用组件（Button, Modal, Input等）
│   ├── layout/          # 布局组件（Header, Sidebar等）
│   ├── contact/         # 联系人相关组件
│   └── upload/          # 上传相关组件
├── hooks/               # 自定义Hooks
├── store/               # 状态管理
│   └── contactStore.ts  # 联系人状态
├── types/               # TypeScript类型定义
│   └── contact.ts       # 联系人类型
├── utils/               # 工具函数
│   ├── vcardParser.ts   # vCard解析器
│   ├── vcardExporter.ts # vCard导出器
│   ├── csvExporter.ts   # CSV导出器
│   └── deduplicator.ts  # 去重工具
├── pages/               # 页面组件
│   └── Home.tsx         # 主页
├── App.tsx              # 应用入口
└── main.tsx             # 渲染入口
```

## 3. 核心模块设计

### 3.1 数据模型

```typescript
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phones: Phone[];
  emails: Email[];
  addresses: Address[];
  birthday?: string;
  organization?: string;
  title?: string;
  note?: string;
  photo?: string;
}

interface Phone {
  type: string; // home, work, mobile, etc.
  number: string;
  preferred?: boolean;
}

interface Email {
  type: string;
  address: string;
  preferred?: boolean;
}

interface Address {
  type: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}
```

### 3.2 vCard解析引擎

**职责**：解析vCard文件内容，转换为内部Contact对象

**主要功能**：
- 支持vCard 2.1, 3.0, 4.0格式
- 解析BEGIN:VCARD到END:VCARD块
- 处理字段编码（QUOTED-PRINTABLE, BASE64）
- 处理多值字段和参数

**接口设计**：
```typescript
class VCardParser {
  parse(content: string): Contact[];
  private parseLine(line: string): VCardField;
  private decodeValue(value: string, encoding: string): string;
}
```

### 3.3 去重模块

**职责**：检测和合并重复联系人

**去重策略**：
- 策略1：电话号码完全匹配
- 策略2：邮箱地址完全匹配  
- 策略3：姓名 + 组织匹配

**接口设计**：
```typescript
class ContactDeduplicator {
  findDuplicates(contacts: Contact[]): DuplicateGroup[];
  mergeDuplicates(group: DuplicateGroup): Contact;
  private compareByPhone(a: Contact, b: Contact): boolean;
  private compareByEmail(a: Contact, b: Contact): boolean;
}
```

### 3.4 导出模块

**vCard导出器**：
- 输出vCard 3.0格式
- 支持选择性字段导出

**CSV导出器**：
- 表头：姓名、电话、邮箱、组织、地址、生日
- 支持UTF-8 BOM，兼容Excel

## 4. 状态管理设计

### Contact Store
```typescript
interface ContactState {
  contacts: Contact[];
  selectedIds: Set<string>;
  searchQuery: string;
  groupBy: 'none' | 'organization';
  filter: ContactFilter;
  
  // Actions
  addContacts: (contacts: Contact[]) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContacts: (ids: string[]) => void;
  deduplicate: () => void;
  setSearchQuery: (query: string) => void;
  setGroupBy: (groupBy: 'none' | 'organization') => void;
  clearAll: () => void;
}
```

## 5. 组件层次结构

```
App
└── Home
    ├── Header
    │   ├── Logo
    │   ├── ImportButton
    │   └── ExportMenu
    ├── MainLayout
    │   ├── Sidebar
    │   │   ├── StatsPanel
    │   │   └── GroupList
    │   └── Content
    │       ├── SearchBar
    │       ├── ViewToggle (卡片/表格)
    │       ├── ContactList / ContactTable
    │       │   └── ContactCard / ContactRow
    │       └── Pagination
    ├── UploadModal
    ├── ContactEditorModal
    └── DeduplicateModal
```

## 6. 关键数据流

### 6.1 文件上传流程
```
用户选择文件 → FileReader读取 → VCardParser解析 → 
ContactStore.addContacts() → 自动去重 → 列表刷新
```

### 6.2 搜索过滤流程
```
用户输入搜索词 → setSearchQuery() → 
computed过滤contacts → 列表重新渲染
```

### 6.3 导出流程
```
用户点击导出 → 获取选中/全部联系人 → 
选择导出格式 → 调用对应Exporter → 
生成Blob → 触发浏览器下载
```

## 7. 性能优化策略

1. **虚拟滚动**：使用react-window处理大量联系人列表
2. **防抖搜索**：搜索输入防抖300ms
3. **记忆化计算**：使用useMemo缓存过滤和分组结果
4. **懒加载**：联系人详情按需加载
5. **Web Worker**：大文件解析在Web Worker中执行

## 8. 扩展性考虑

1. **插件化解析器**：支持不同格式的导入导出插件
2. **自定义字段**：支持vCard扩展字段的展示和编辑
3. **主题系统**：支持明暗主题切换
4. **国际化**：预留i18n接口
5. **API钩子**：支持与外部通讯录API集成
