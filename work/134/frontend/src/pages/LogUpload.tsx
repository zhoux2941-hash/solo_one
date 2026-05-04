import { useState, useRef } from 'react'
import {
  Card,
  Upload,
  Select,
  Button,
  Input,
  Tabs,
  message,
  Spin,
  Alert,
  Descriptions,
  Tag,
  Divider,
  Modal,
  Progress,
  Badge
} from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  InboxOutlined,
  PlayCircleOutlined,
  CloudUploadOutlined
} from '@ant-design/icons'
import { logApi, parseRuleApi } from '../services/api'
import '../App.css'

const { Dragger } = Upload
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

// 大文件阈值 (50MB)，超过此大小使用分块上传
const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024
// 分块大小 (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024

interface UploadResult {
  fileName?: string
  totalLines: number
  parsedCount: number
  savedCount: number
  error?: string
}

interface ParseRule {
  id: number
  ruleName: string
  logType: string
  ruleType: string
  pattern: string
  fieldMapping?: string
  sampleLog?: string
  isActive: boolean
}

interface TestResult {
  totalLines: number
  parsedCount: number
  results: Array<{
    timestamp?: string
    level?: string
    message?: string
    rawLog: string
    logType: string
    fields?: Record<string, unknown>
  }>
}

// 分块上传状态
interface ChunkUploadState {
  fileName: string
  fileSize: number
  totalChunks: number
  currentChunk: number
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  result?: UploadResult
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const LogUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [logType, setLogType] = useState('auto')
  const [parseRuleId, setParseRuleId] = useState<number | undefined>(undefined)
  const [source, setSource] = useState('')
  const [uploadResult, setUploadResult] = useState<UploadResult[] | null>(null)
  const [showResult, setShowResult] = useState(false)

  // 分块上传状态
  const [chunkUploadStates, setChunkUploadStates] = useState<Map<string, ChunkUploadState>>(new Map())
  const [showChunkProgress, setShowChunkProgress] = useState(false)
  const abortControllerRef = useRef<Map<string, AbortController>>(new Map())

  // 文本上传
  const [logText, setLogText] = useState('')
  const [textLogType, setTextLogType] = useState('auto')
  const [textParseRuleId, setTextParseRuleId] = useState<number | undefined>(undefined)
  const [textSource, setTextSource] = useState('')

  // 解析规则列表
  const [parseRules, setParseRules] = useState<ParseRule[]>([])
  const [loadingRules, setLoadingRules] = useState(false)

  // 测试解析
  const [testing, setTesting] = useState(false)
  const [testLogText, setTestLogText] = useState('')
  const [testLogType, setTestLogType] = useState('auto')
  const [testRuleType, setTestRuleType] = useState('regex')
  const [testPattern, setTestPattern] = useState('')
  const [testFieldMapping, setTestFieldMapping] = useState('')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showTestResult, setShowTestResult] = useState(false)

  // 加载解析规则
  const loadParseRules = async () => {
    setLoadingRules(true)
    try {
      const response = await parseRuleApi.getActiveRules()
      if (response.data.success) {
        setParseRules(response.data.data)
      }
    } catch (error) {
      console.error('加载解析规则失败:', error)
    } finally {
      setLoadingRules(false)
    }
  }

  // 文件上传处理
  const handleFileChange = (info: { fileList: Array<{ originFileObj?: File }> }) => {
    const newFiles = info.fileList
      .map(f => f.originFileObj)
      .filter(Boolean) as File[]
    setFiles(newFiles)
    setUploadResult(null)
    setShowResult(false)
    // 重置分块上传状态
    setChunkUploadStates(new Map())
  }

  // 分块上传单个文件
  const uploadFileWithChunks = async (
    file: File,
    logType: string,
    parseRuleId?: number,
    source?: string
  ): Promise<UploadResult> => {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`
    
    // 计算分块数量
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    
    // 更新状态
    setChunkUploadStates(prev => new Map(prev).set(fileKey, {
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      currentChunk: 0,
      progress: 0,
      status: 'uploading'
    }))

    let totalLines = 0
    let totalParsed = 0
    let totalSaved = 0

    try {
      // 逐个上传分块
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)
        const isLastChunk = i === totalChunks - 1

        console.log(`上传分块 ${i + 1}/${totalChunks}: ${start}-${end}`)

        const response = await logApi.uploadChunk({
          chunk,
          sessionId: fileKey,
          chunkIndex: i,
          totalChunks,
          logType,
          parseRuleId,
          source: source || file.name,
          isLastChunk
        })

        if (response.data.success) {
          totalLines += response.data.data.totalLines || 0
          totalParsed += response.data.data.parsedCount || 0
          totalSaved += response.data.data.savedCount || 0

          // 更新进度
          const progress = Math.round(((i + 1) / totalChunks) * 100)
          setChunkUploadStates(prev => {
            const newStates = new Map(prev)
            const state = newStates.get(fileKey)
            if (state) {
              newStates.set(fileKey, {
                ...state,
                currentChunk: i + 1,
                progress
              })
            }
            return newStates
          })
        } else {
          throw new Error(response.data.message || `分块 ${i + 1} 上传失败`)
        }
      }

      // 上传完成
      setChunkUploadStates(prev => {
        const newStates = new Map(prev)
        const state = newStates.get(fileKey)
        if (state) {
          newStates.set(fileKey, {
            ...state,
            status: 'success',
            progress: 100,
            result: {
              fileName: file.name,
              totalLines,
              parsedCount: totalParsed,
              savedCount: totalSaved
            }
          })
        }
        return newStates
      })

      return {
        fileName: file.name,
        totalLines,
        parsedCount: totalParsed,
        savedCount: totalSaved
      }

    } catch (error) {
      setChunkUploadStates(prev => {
        const newStates = new Map(prev)
        const state = newStates.get(fileKey)
        if (state) {
          newStates.set(fileKey, {
            ...state,
            status: 'error',
            error: error instanceof Error ? error.message : '上传失败'
          })
        }
        return newStates
      })

      throw error
    }
  }

  // 执行文件上传
  const handleFileUpload = async () => {
    if (files.length === 0) {
      message.warning('请先选择要上传的文件')
      return
    }

    // 检查是否有大文件
    const hasLargeFile = files.some(f => f.size > LARGE_FILE_THRESHOLD)
    
    if (hasLargeFile && files.length > 1) {
      message.warning('存在大文件，请单独上传以使用分块上传功能')
      return
    }

    setUploading(true)
    setChunkUploadStates(new Map())
    setShowChunkProgress(hasLargeFile)

    try {
      const results: UploadResult[] = []

      for (const file of files) {
        console.log(`处理文件: ${file.name}, 大小: ${formatFileSize(file.size)}`)

        if (file.size > LARGE_FILE_THRESHOLD) {
          // 大文件：分块上传
          message.info(`检测到大文件 ${file.name}，使用分块上传...`)
          
          const result = await uploadFileWithChunks(
            file,
            logType,
            parseRuleId,
            source || undefined
          )
          results.push(result)
        } else {
          // 小文件：普通上传
          const response = await logApi.uploadLog(
            file,
            logType,
            parseRuleId,
            source || undefined
          )

          if (response.data.success) {
            results.push({
              fileName: file.name,
              totalLines: response.data.data.totalLines,
              parsedCount: response.data.data.parsedCount,
              savedCount: response.data.data.savedCount
            })
          } else {
            throw new Error(response.data.message)
          }
        }
      }

      setUploadResult(results)
      setShowResult(true)
      message.success('上传成功')

    } catch (error) {
      console.error('上传失败:', error)
      message.error(error instanceof Error ? error.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  // 执行文本上传
  const handleTextUpload = async () => {
    if (!logText.trim()) {
      message.warning('请输入日志内容')
      return
    }

    setUploading(true)
    try {
      const response = await logApi.uploadLogText(
        logText,
        textLogType,
        textParseRuleId,
        textSource || undefined
      )

      if (response.data.success) {
        setUploadResult([{
          fileName: '文本上传',
          totalLines: response.data.data.totalLines,
          parsedCount: response.data.data.parsedCount,
          savedCount: response.data.data.savedCount
        }])
        setShowResult(true)
        message.success('上传成功')
      } else {
        message.error('上传失败: ' + response.data.message)
      }
    } catch (error) {
      console.error('上传失败:', error)
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  // 测试解析规则
  const handleTestParse = async () => {
    if (!testLogText.trim()) {
      message.warning('请输入测试日志')
      return
    }

    setTesting(true)
    try {
      const response = await logApi.testParseRule(
        testLogText,
        testLogType,
        testPattern ? testRuleType : undefined,
        testPattern || undefined,
        testFieldMapping || undefined
      )

      if (response.data.success) {
        setTestResult(response.data.data)
        setShowTestResult(true)
      } else {
        message.error('解析测试失败: ' + response.data.message)
      }
    } catch (error) {
      console.error('解析测试失败:', error)
      message.error('解析测试失败')
    } finally {
      setTesting(false)
    }
  }

  // 获取日志类型选项
  const logTypeOptions = [
    { label: '自动检测', value: 'auto' },
    { label: 'Nginx 日志', value: 'nginx' },
    { label: 'Apache 日志', value: 'apache' },
    { label: 'JSON Lines', value: 'json_lines' },
    { label: '自定义规则', value: 'custom' }
  ]

  return (
    <div className="log-upload">
      <Tabs defaultActiveKey="file" onChange={() => loadParseRules()}>
        <TabPane tab="文件上传" key="file">
          <Card>
            <Alert
              message="支持批量上传多个日志文件，支持 .log、.txt 等纯文本文件"
              type="info"
              style={{ marginBottom: 16 }}
            />

            <Divider>上传配置</Divider>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ minWidth: 120 }}>
                  <label>日志类型:</label>
                </div>
                <Select
                  value={logType}
                  onChange={(value) => {
                    setLogType(value)
                    if (value !== 'custom') {
                      setParseRuleId(undefined)
                    }
                  }}
                  style={{ width: 200 }}
                >
                  {logTypeOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>

                {logType === 'custom' && (
                  <>
                    <div style={{ minWidth: 100 }}>
                      <label>解析规则:</label>
                    </div>
                    <Select
                      placeholder="选择解析规则"
                      value={parseRuleId}
                      onChange={setParseRuleId}
                      style={{ width: 250 }}
                      loading={loadingRules}
                      onFocus={loadParseRules}
                    >
                      {parseRules.map(rule => (
                        <Option key={rule.id} value={rule.id}>
                          {rule.ruleName} ({rule.logType})
                        </Option>
                      ))}
                    </Select>
                  </>
                )}

                <div style={{ minWidth: 80 }}>
                  <label>来源标识:</label>
                </div>
                <Input
                  placeholder="如: access.log"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  style={{ width: 200 }}
                />
              </div>
            </div>

            <Divider>选择文件</Divider>

            {/* 大文件提示 */}
            {files.some(f => f.size > LARGE_FILE_THRESHOLD) && (
              <Alert
                message={
                  <span>
                    <Badge status="warning" text="检测到大文件" />
                    &nbsp;超过 {formatFileSize(LARGE_FILE_THRESHOLD)} 的文件将使用分块上传，自动支持流式解析，避免内存溢出
                  </span>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Dragger
              fileList={files.map((f, i) => ({
                uid: String(i),
                name: f.name,
                status: 'done' as const,
                originFileObj: f
              }))}
              onChange={handleFileChange}
              beforeUpload={() => false}
              multiple
              showUploadList={{
                showRemoveIcon: true,
                showDownloadIcon: false,
                showPreviewIcon: false,
                itemsRender: (items) => items.map(item => ({
                  ...item,
                  name: (
                    <span>
                      {item.name}
                      <Tag 
                        color={item.originFileObj && item.originFileObj.size > LARGE_FILE_THRESHOLD ? 'orange' : 'blue'}
                        style={{ marginLeft: 8 }}
                      >
                        {item.originFileObj ? formatFileSize(item.originFileObj.size) : ''}
                        {item.originFileObj && item.originFileObj.size > LARGE_FILE_THRESHOLD && ' (大文件)'}
                      </Tag>
                    </span>
                  )
                }))
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个或批量上传，支持 .log、.txt 等纯文本文件
                <br />
                大文件（超过 {formatFileSize(LARGE_FILE_THRESHOLD)}）自动使用分块上传 + 流式解析
              </p>
            </Dragger>

            {/* 分块上传进度显示 */}
            {showChunkProgress && chunkUploadStates.size > 0 && (
              <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                  <CloudUploadOutlined style={{ marginRight: 8 }} />
                  分块上传进度
                </div>
                {Array.from(chunkUploadStates.entries()).map(([key, state]) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>
                        {state.fileName}
                        <Tag 
                          color={
                            state.status === 'success' ? 'success' :
                            state.status === 'error' ? 'error' :
                            state.status === 'uploading' ? 'processing' : 'default'
                          }
                          style={{ marginLeft: 8 }}
                        >
                          {state.status === 'uploading' && `分块 ${state.currentChunk}/${state.totalChunks}`}
                          {state.status === 'success' && '上传成功'}
                          {state.status === 'error' && '上传失败'}
                          {state.status === 'pending' && '等待中'}
                        </Tag>
                      </span>
                      <span style={{ color: '#666' }}>
                        {state.progress}%
                      </span>
                    </div>
                    <Progress
                      percent={state.progress}
                      status={
                        state.status === 'success' ? 'success' :
                        state.status === 'error' ? 'exception' :
                        'active'
                      }
                      strokeColor={
                        state.status === 'success' ? '#52c41a' :
                        state.status === 'error' ? '#ff4d4f' :
                        '#1890ff'
                      }
                    />
                    {state.error && (
                      <Alert
                        message={state.error}
                        type="error"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleFileUpload}
                loading={uploading}
                disabled={files.length === 0}
                size="large"
              >
                开始上传 ({files.length} 个文件)
              </Button>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="文本上传" key="text">
          <Card>
            <Alert
              message="直接粘贴日志内容进行上传，适合少量日志的快速上传"
              type="info"
              style={{ marginBottom: 16 }}
            />

            <Divider>上传配置</Divider>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ minWidth: 120 }}>
                  <label>日志类型:</label>
                </div>
                <Select
                  value={textLogType}
                  onChange={(value) => {
                    setTextLogType(value)
                    if (value !== 'custom') {
                      setTextParseRuleId(undefined)
                    }
                  }}
                  style={{ width: 200 }}
                >
                  {logTypeOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>

                {textLogType === 'custom' && (
                  <>
                    <div style={{ minWidth: 100 }}>
                      <label>解析规则:</label>
                    </div>
                    <Select
                      placeholder="选择解析规则"
                      value={textParseRuleId}
                      onChange={setTextParseRuleId}
                      style={{ width: 250 }}
                      loading={loadingRules}
                      onFocus={loadParseRules}
                    >
                      {parseRules.map(rule => (
                        <Option key={rule.id} value={rule.id}>
                          {rule.ruleName} ({rule.logType})
                        </Option>
                      ))}
                    </Select>
                  </>
                )}

                <div style={{ minWidth: 80 }}>
                  <label>来源标识:</label>
                </div>
                <Input
                  placeholder="如: access.log"
                  value={textSource}
                  onChange={e => setTextSource(e.target.value)}
                  style={{ width: 200 }}
                />
              </div>
            </div>

            <Divider>输入日志内容</Divider>

            <TextArea
              placeholder="粘贴日志内容，每行一条日志..."
              value={logText}
              onChange={e => setLogText(e.target.value)}
              rows={15}
              style={{ fontFamily: 'Consolas, Monaco, monospace' }}
            />

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={handleTextUpload}
                loading={uploading}
                disabled={!logText.trim()}
                size="large"
              >
                上传日志
              </Button>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="测试解析" key="test">
          <Card>
            <Alert
              message="在此测试解析规则，无需保存到数据库即可预览解析效果"
              type="info"
              style={{ marginBottom: 16 }}
            />

            <Divider>测试配置</Divider>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ minWidth: 120 }}>
                  <label>日志类型:</label>
                </div>
                <Select
                  value={testLogType}
                  onChange={setTestLogType}
                  style={{ width: 200 }}
                >
                  {logTypeOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ minWidth: 120 }}>
                  <label>规则类型:</label>
                </div>
                <Select
                  value={testRuleType}
                  onChange={setTestRuleType}
                  style={{ width: 200 }}
                >
                  <Option value="regex">正则表达式</Option>
                  <Option value="grok">Grok 模式</Option>
                </Select>

                <div style={{ minWidth: 120 }}>
                  <label>解析模式:</label>
                </div>
                <Input
                  placeholder="输入正则表达式或 Grok 模式"
                  value={testPattern}
                  onChange={e => setTestPattern(e.target.value)}
                  style={{ width: 400 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ minWidth: 120 }}>
                  <label>字段映射:</label>
                </div>
                <Input
                  placeholder='{"group1": "timestamp", "group2": "level"}'
                  value={testFieldMapping}
                  onChange={e => setTestFieldMapping(e.target.value)}
                  style={{ width: 400 }}
                />
              </div>
            </div>

            <Divider>输入测试日志</Divider>

            <TextArea
              placeholder="粘贴测试日志内容..."
              value={testLogText}
              onChange={e => setTestLogText(e.target.value)}
              rows={8}
              style={{ fontFamily: 'Consolas, Monaco, monospace' }}
            />

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleTestParse}
                loading={testing}
                disabled={!testLogText.trim()}
                size="large"
              >
                测试解析
              </Button>
            </div>

            {showTestResult && testResult && (
              <div style={{ marginTop: 24 }}>
                <Divider>解析结果</Divider>
                
                <Alert
                  message={`解析完成: 共 ${testResult.totalLines} 行，成功解析 ${testResult.parsedCount} 行`}
                  type={testResult.parsedCount > 0 ? 'success' : 'warning'}
                  style={{ marginBottom: 16 }}
                />

                <div className="test-result-panel">
                  {testResult.results.map((result, index) => (
                    <div key={index} className="test-result-item">
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                        第 {index + 1} 行 {result.level && <Tag>{result.level}</Tag>}
                      </div>
                      <Descriptions size="small" bordered column={1}>
                        <Descriptions.Item label="原始日志">
                          <code>{result.rawLog}</code>
                        </Descriptions.Item>
                        <Descriptions.Item label="解析时间">
                          {result.timestamp || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="日志级别">
                          {result.level || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="消息">
                          {result.message || '-'}
                        </Descriptions.Item>
                        {result.fields && Object.keys(result.fields).length > 0 && (
                          <Descriptions.Item label="额外字段">
                            <pre className="json-view">
                              {JSON.stringify(result.fields, null, 2)}
                            </pre>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* 上传结果弹窗 */}
      <Modal
        title="上传结果"
        open={showResult}
        onOk={() => setShowResult(false)}
        onCancel={() => setShowResult(false)}
        width={700}
      >
        {uploadResult && uploadResult.map((result, index) => (
          <div key={index} style={{ marginBottom: index < uploadResult.length - 1 ? 16 : 0 }}>
            <Descriptions title={result.fileName || `文件 ${index + 1}`} bordered size="small">
              <Descriptions.Item label="总行数">{result.totalLines}</Descriptions.Item>
              <Descriptions.Item label="解析成功">
                <Tag color="green">{result.parsedCount}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="保存成功">
                <Tag color="blue">{result.savedCount}</Tag>
              </Descriptions.Item>
            </Descriptions>
            {result.error && (
              <Alert message={result.error} type="error" style={{ marginTop: 8 }} />
            )}
          </div>
        ))}
      </Modal>
    </div>
  )
}

export default LogUpload
