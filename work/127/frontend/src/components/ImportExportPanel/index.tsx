import React, { useState, useRef } from 'react';
import { Card, Button, Upload, message, Space, Typography, Divider, Modal, Form, Input } from 'antd';
import { UploadOutlined, DownloadOutlined, ImportOutlined, PlusOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { importExportApi, networkApi } from '@/api';
import { useAppStore } from '@/store';

const { Title, Text, Paragraph } = Typography;

interface ImportExportPanelProps {
  networkId: string;
  onImportSuccess: () => void;
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  networkId,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [createNetworkVisible, setCreateNetworkVisible] = useState(false);
  const [form] = Form.useForm();

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importExportApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supply_chain_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('模板下载成功');
    } catch (error) {
      message.error('下载模板失败');
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: async (file) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        message.error('请上传Excel文件 (.xlsx 或 .xls)');
        return false;
      }

      setImporting(true);
      try {
        const result = await importExportApi.importFromExcel(networkId, file);
        
        const successMsg = `导入成功：创建 ${result.nodes_created} 个节点，${result.dependencies_created} 个依赖`;
        if (result.nodes_updated > 0 || result.dependencies_updated > 0) {
          message.success(`${successMsg}，更新 ${result.nodes_updated} 个节点，${result.dependencies_updated} 个依赖`);
        } else {
          message.success(successMsg);
        }

        if (result.errors.length > 0) {
          message.warning(`有 ${result.errors.length} 个警告，请检查导入数据`);
          console.warn('Import warnings:', result.errors);
        }

        onImportSuccess();
      } catch (error: any) {
        message.error(error.response?.data?.detail || '导入失败');
      } finally {
        setImporting(false);
      }

      return false;
    },
    showUploadList: false,
  };

  const handleCreateNetwork = async (values: any) => {
    try {
      await networkApi.create({
        name: values.name,
        description: values.description,
      });
      message.success('网络创建成功');
      setCreateNetworkVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('创建网络失败');
    }
  };

  return (
    <div className="space-y-4">
      <Card size="small">
        <div className="space-y-4">
          <div>
            <Title level={5}>
              <FileExcelOutlined style={{ marginRight: 8 }} />
              Excel 导入导出
            </Title>
            <Paragraph type="secondary">
              通过 Excel 文件批量导入或导出供应链网络数据
            </Paragraph>
          </div>

          <Divider />

          <div className="space-y-3">
            <Text strong>步骤 1: 下载模板</Text>
            <Paragraph type="secondary" className="text-sm">
              下载 Excel 模板，按照格式填写节点和依赖关系数据
            </Paragraph>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载导入模板
            </Button>
          </div>

          <Divider />

          <div className="space-y-3">
            <Text strong>步骤 2: 导入数据</Text>
            <Paragraph type="secondary" className="text-sm">
              选择填写好的 Excel 文件，导入到当前供应链网络
            </Paragraph>
            <Upload {...uploadProps}>
              <Button 
                icon={<UploadOutlined />}
                loading={importing}
                disabled={!networkId}
              >
                {importing ? '导入中...' : '选择 Excel 文件'}
              </Button>
            </Upload>
            {!networkId && (
              <Text type="danger" className="text-sm">
                请先选择或创建一个供应链网络
              </Text>
            )}
          </div>
        </div>
      </Card>

      <Card size="small" title="快速开始">
        <div className="space-y-3">
          <Paragraph type="secondary">
            没有数据？可以从以下方式开始：
          </Paragraph>
          <div className="space-y-2">
            <Button
              type="primary"
              block
              icon={<PlusOutlined />}
              onClick={() => setCreateNetworkVisible(true)}
            >
              创建新的供应链网络
            </Button>
            <Button
              block
              icon={<ImportOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载示例数据模板
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        title="创建新供应链网络"
        open={createNetworkVisible}
        onCancel={() => setCreateNetworkVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateNetwork}
        >
          <Form.Item
            name="name"
            label="网络名称"
            rules={[{ required: true, message: '请输入网络名称' }]}
          >
            <Input placeholder="例如：2024年全球供应链" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="网络描述信息" rows={3} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateNetworkVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ImportExportPanel;
