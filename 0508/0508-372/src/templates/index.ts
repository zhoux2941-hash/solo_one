import { JsonSchema } from '../types'

export const templates: Record<string, JsonSchema> = {
  userRegistration: {
    type: 'object',
    title: '用户注册',
    description: '用户注册表单',
    required: ['username', 'email', 'password', 'agreeTerms'],
    properties: {
      username: {
        type: 'string',
        title: '用户名',
        description: '请输入用户名',
        minLength: 3,
        maxLength: 20,
        errorMessage: {
          required: '用户名不能为空',
          minLength: '用户名至少需要3个字符',
          maxLength: '用户名最多20个字符',
        },
      },
      email: {
        type: 'string',
        title: '邮箱',
        description: '请输入邮箱地址',
        pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
        errorMessage: {
          required: '邮箱不能为空',
          pattern: '请输入有效的邮箱地址',
        },
      },
      password: {
        type: 'string',
        title: '密码',
        description: '请输入密码（至少6位）',
        minLength: 6,
        errorMessage: {
          required: '密码不能为空',
          minLength: '密码至少需要6个字符',
        },
      },
      gender: {
        type: 'string',
        title: '性别',
        enum: ['男', '女', '保密'],
        default: '保密',
      },
      birthday: {
        type: 'string',
        title: '出生日期',
        format: 'date',
      },
      agreeTerms: {
        type: 'boolean',
        title: '同意服务条款',
        errorMessage: {
          required: '请同意服务条款',
        },
      },
    },
  },
  productInfo: {
    type: 'object',
    title: '商品信息',
    description: '商品信息表单',
    required: ['name', 'price', 'category'],
    properties: {
      name: {
        type: 'string',
        title: '商品名称',
        description: '请输入商品名称',
        minLength: 1,
        maxLength: 100,
        errorMessage: {
          required: '商品名称不能为空',
        },
      },
      price: {
        type: 'number',
        title: '价格',
        description: '请输入商品价格',
        minimum: 0,
        errorMessage: {
          required: '价格不能为空',
          minimum: '价格不能为负数',
        },
      },
      category: {
        type: 'string',
        title: '分类',
        enum: ['电子产品', '服装', '食品', '家居', '其他'],
        errorMessage: {
          required: '请选择分类',
        },
      },
      stock: {
        type: 'number',
        title: '库存',
        description: '请输入库存数量',
        minimum: 0,
        default: 0,
      },
      description: {
        type: 'string',
        title: '商品描述',
        description: '请输入商品描述',
        maxLength: 500,
      },
      isActive: {
        type: 'boolean',
        title: '上架状态',
        default: true,
      },
      tags: {
        type: 'array',
        title: '标签',
        description: '添加商品标签',
        items: {
          type: 'string',
          title: '标签',
        },
      },
    },
  },
  addressForm: {
    type: 'object',
    title: '地址表单',
    description: '收货地址表单（含省市联动）',
    required: ['name', 'phone', 'province', 'city', 'detail'],
    properties: {
      name: {
        type: 'string',
        title: '收货人',
        description: '请输入收货人姓名',
        errorMessage: {
          required: '收货人不能为空',
        },
      },
      phone: {
        type: 'string',
        title: '联系电话',
        description: '请输入联系电话',
        pattern: '^1[3-9]\\d{9}$',
        errorMessage: {
          required: '联系电话不能为空',
          pattern: '请输入有效的手机号码',
        },
      },
      province: {
        type: 'string',
        title: '省份',
        enum: ['北京市', '上海市', '广东省', '浙江省', '江苏省', '其他'],
        errorMessage: {
          required: '请选择省份',
        },
      },
      city: {
        type: 'string',
        title: '城市',
        dependsOn: 'province',
        enumMapping: {
          '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区'],
          '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区'],
          '广东省': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '东莞市', '中山市'],
          '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市'],
          '江苏省': ['南京市', '苏州市', '无锡市', '常州市', '镇江市', '扬州市'],
          '其他': ['其他城市'],
        },
        errorMessage: {
          required: '请选择城市',
        },
      },
      detail: {
        type: 'string',
        title: '详细地址',
        description: '请输入详细地址',
        errorMessage: {
          required: '详细地址不能为空',
        },
      },
      isDefault: {
        type: 'boolean',
        title: '设为默认地址',
      },
    },
  },
}

export const templateNames = [
  { key: 'userRegistration', label: '用户注册' },
  { key: 'productInfo', label: '商品信息' },
  { key: 'addressForm', label: '地址表单' },
]
