import { Template, FieldConfig } from '../types';
import { generateId } from './mockGenerator';

function createFieldConfig(overrides: Partial<FieldConfig>): FieldConfig {
  return {
    id: generateId(),
    name: '',
    type: 'string',
    rules: {},
    level: 0,
    ...overrides
  };
}

export const templates: Template[] = [
  {
    id: 'user-list',
    name: '用户列表',
    description: '包含用户基本信息：ID、姓名、邮箱、手机号、年龄、地址等',
    icon: 'users',
    fields: [
      createFieldConfig({ name: 'id', type: 'number', rules: { min: 1, max: 9999, isInteger: true } }),
      createFieldConfig({ name: 'name', type: 'string', rules: { pattern: 'name' } }),
      createFieldConfig({ name: 'email', type: 'string', rules: { pattern: 'email' } }),
      createFieldConfig({ name: 'phone', type: 'string', rules: { pattern: 'phone' } }),
      createFieldConfig({ name: 'age', type: 'number', rules: { min: 18, max: 65, isInteger: true } }),
      createFieldConfig({ name: 'address', type: 'string', rules: { pattern: 'address' } }),
      createFieldConfig({ name: 'isActive', type: 'boolean', rules: { trueProbability: 0.8 } }),
      createFieldConfig({ name: 'createdAt', type: 'string', rules: { pattern: 'date' } })
    ]
  },
  {
    id: 'product-list',
    name: '商品列表',
    description: '电商商品数据：名称、价格、库存、分类、描述等',
    icon: 'shopping-bag',
    fields: [
      createFieldConfig({ name: 'id', type: 'number', rules: { min: 1000, max: 99999, isInteger: true } }),
      createFieldConfig({ name: 'name', type: 'string', rules: { pattern: 'word', minLength: 5, maxLength: 20 } }),
      createFieldConfig({ name: 'price', type: 'number', rules: { min: 9.9, max: 9999.99, isInteger: false, decimalPlaces: 2 } }),
      createFieldConfig({ name: 'stock', type: 'number', rules: { min: 0, max: 500, isInteger: true } }),
      createFieldConfig({ name: 'category', type: 'string', rules: { pattern: 'word', minLength: 3, maxLength: 10 } }),
      createFieldConfig({ name: 'description', type: 'string', rules: { pattern: 'sentence' } }),
      createFieldConfig({ name: 'isOnSale', type: 'boolean', rules: { trueProbability: 0.6 } }),
      createFieldConfig({ name: 'imageUrl', type: 'string', rules: { pattern: 'url' } })
    ]
  },
  {
    id: 'article-list',
    name: '文章列表',
    description: '博客文章数据：标题、作者、内容摘要、发布时间、阅读量等',
    icon: 'file-text',
    fields: [
      createFieldConfig({ name: 'id', type: 'number', rules: { min: 1, max: 9999, isInteger: true } }),
      createFieldConfig({ name: 'title', type: 'string', rules: { pattern: 'sentence', minLength: 10, maxLength: 50 } }),
      createFieldConfig({ name: 'author', type: 'string', rules: { pattern: 'name' } }),
      createFieldConfig({ name: 'summary', type: 'string', rules: { pattern: 'sentence' } }),
      createFieldConfig({ name: 'content', type: 'string', rules: { pattern: 'sentence' } }),
      createFieldConfig({ name: 'views', type: 'number', rules: { min: 10, max: 10000, isInteger: true } }),
      createFieldConfig({ name: 'likes', type: 'number', rules: { min: 0, max: 1000, isInteger: true } }),
      createFieldConfig({ name: 'isPublished', type: 'boolean', rules: { trueProbability: 0.9 } }),
      createFieldConfig({ name: 'publishDate', type: 'string', rules: { pattern: 'date' } }),
      createFieldConfig({ name: 'tags', type: 'array', rules: { arrayMinLength: 1, arrayMaxLength: 5, arrayItemType: 'string' } })
    ]
  },
  {
    id: 'order-list',
    name: '订单列表',
    description: '电商订单数据：订单号、用户ID、商品列表、总价、状态等',
    icon: 'shopping-cart',
    fields: [
      createFieldConfig({ name: 'orderId', type: 'string', rules: { pattern: 'uuid' } }),
      createFieldConfig({ name: 'userId', type: 'number', rules: { min: 1, max: 9999, isInteger: true } }),
      createFieldConfig({
        name: 'items',
        type: 'array',
        rules: { arrayMinLength: 1, arrayMaxLength: 5 },
        children: [
          createFieldConfig({ name: 'productId', type: 'number', rules: { min: 1000, max: 99999, isInteger: true }, level: 1 }),
          createFieldConfig({ name: 'productName', type: 'string', rules: { pattern: 'word' }, level: 1 }),
          createFieldConfig({ name: 'quantity', type: 'number', rules: { min: 1, max: 10, isInteger: true }, level: 1 }),
          createFieldConfig({ name: 'price', type: 'number', rules: { min: 9.9, max: 9999.99, isInteger: false }, level: 1 })
        ]
      }),
      createFieldConfig({ name: 'totalAmount', type: 'number', rules: { min: 10, max: 50000, isInteger: false, decimalPlaces: 2 } }),
      createFieldConfig({ name: 'status', type: 'string', rules: { pattern: 'word' } }),
      createFieldConfig({ name: 'createdAt', type: 'string', rules: { pattern: 'date' } })
    ]
  }
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}
