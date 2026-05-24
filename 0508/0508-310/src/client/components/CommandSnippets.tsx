import { useState, useEffect } from 'react';
import type { CommandSnippet } from '../types';
import { getSnippets, saveSnippet, deleteSnippet, updateSnippetUsage } from '../utils/storage';
import { generateId } from '../utils/crypto';

interface CommandSnippetsProps {
  onExecuteCommand: (command: string) => void;
  connected: boolean;
}

const CATEGORIES = ['全部', '常用', '系统', '文件', '网络', '进程'];

export function CommandSnippets({ onExecuteCommand, connected }: CommandSnippetsProps) {
  const [snippets, setSnippets] = useState<CommandSnippet[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CommandSnippet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formName, setFormName] = useState('');
  const [formCommand, setFormCommand] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('常用');

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = () => {
    setSnippets(getSnippets());
  };

  const filteredSnippets = snippets
    .filter(s => selectedCategory === '全部' || s.category === selectedCategory)
    .filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => (b.useCount || 0) - (a.useCount || 0));

  const handleExecute = (snippet: CommandSnippet) => {
    if (!connected) {
      alert('请先连接到服务器');
      return;
    }
    
    const commandToSend = snippet.command.endsWith('\n') 
      ? snippet.command 
      : snippet.command + '\n';
    
    onExecuteCommand(commandToSend);
    updateSnippetUsage(snippet.id);
    loadSnippets();
  };

  const handleOpenModal = (snippet?: CommandSnippet) => {
    if (snippet) {
      setEditingSnippet(snippet);
      setFormName(snippet.name);
      setFormCommand(snippet.command);
      setFormDescription(snippet.description || '');
      setFormCategory(snippet.category || '常用');
    } else {
      setEditingSnippet(null);
      setFormName('');
      setFormCommand('');
      setFormDescription('');
      setFormCategory('常用');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formCommand.trim()) {
      alert('请填写名称和命令');
      return;
    }

    const snippet: CommandSnippet = {
      id: editingSnippet?.id || generateId(),
      name: formName.trim(),
      command: formCommand.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      createdAt: editingSnippet?.createdAt || Date.now(),
      lastUsed: editingSnippet?.lastUsed,
      useCount: editingSnippet?.useCount || 0
    };

    saveSnippet(snippet);
    loadSnippets();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个命令片段吗？')) {
      deleteSnippet(id);
      loadSnippets();
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>命令片段</h3>
        <button 
          onClick={() => handleOpenModal()}
          style={addButtonStyle}
        >
          + 新建
        </button>
      </div>

      <div style={searchContainerStyle}>
        <input
            type="text"
            placeholder="搜索命令..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
      </div>

      <div style={categoryContainerStyle}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...categoryButtonStyle,
              ...(selectedCategory === cat ? categoryActiveStyle : {})
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={snippetsListStyle}>
        {filteredSnippets.length === 0 ? (
          <div style={emptyStyle}>
            {searchQuery ? '没有找到匹配的命令' : '暂无命令片段'}
          </div>
        ) : (
          filteredSnippets.map((snippet) => (
            <div
              key={snippet.id}
              style={snippetCardStyle}
            >
              <div style={snippetHeaderStyle}>
                <span style={snippetNameStyle}>{snippet.name}</span>
                <div style={snippetActionsStyle}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(snippet);
                    }}
                    style={iconButtonStyle}
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleDelete(snippet.id, e)}
                    style={{ ...iconButtonStyle, ...deleteButtonStyle }}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div style={snippetCommandStyle}>
                <code>{snippet.command}</code>
              </div>
              
              {snippet.description && (
                <div style={snippetDescStyle}>{snippet.description}</div>
              )}
              
              <div style={snippetFooterStyle}>
                <span style={snippetMetaStyle}>
                  {snippet.category} · 使用 {snippet.useCount || 0} 次
                </span>
                <button
                  onClick={() => handleExecute(snippet)}
                  style={{
                    ...executeButtonStyle,
                    ...(!connected ? executeButtonDisabledStyle : {})
                  }}
                  disabled={!connected}
                >
                  ▶ 执行
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={modalTitleStyle}>
              {editingSnippet ? '编辑命令片段' : '新建命令片段'}
            </h3>

            <div style={formGroupStyle}>
              <label style={labelStyle}>名称 *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                style={inputStyle}
                placeholder="例如：查看系统信息"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>命令 *</label>
              <textarea
                value={formCommand}
                onChange={(e) => setFormCommand(e.target.value)}
                style={{ ...inputStyle, ...textareaStyle }}
                placeholder="例如：uname -a"
                rows={3}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>描述</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={inputStyle}
                placeholder="命令功能描述（可选）"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>分类</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={inputStyle}
              >
                {CATEGORIES.filter(c => c !== '全部').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={modalButtonsStyle}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={cancelButtonStyle}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={saveButtonStyle}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#252526',
  borderRight: '1px solid #1e1e1e'
};

const headerStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid #1e1e1e',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#cccccc',
  fontSize: '14px',
  fontWeight: 600
};

const addButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#0e639c',
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: 500
};

const searchContainerStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderBottom: '1px solid #1e1e1e'
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: '#3c3c3c',
  border: '1px solid #555555',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box'
};

const categoryContainerStyle: React.CSSProperties = {
  padding: '8px 16px',
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  borderBottom: '1px solid #1e1e1e'
};

const categoryButtonStyle: React.CSSProperties = {
  padding: '4px 10px',
  backgroundColor: '#3c3c3c',
  border: 'none',
  borderRadius: '12px',
  color: '#cccccc',
  fontSize: '11px',
  cursor: 'pointer'
};

const categoryActiveStyle: React.CSSProperties = {
  backgroundColor: '#0e639c',
  color: '#ffffff'
};

const snippetsListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const emptyStyle: React.CSSProperties = {
  padding: '20px',
  textAlign: 'center',
  color: '#666666',
  fontSize: '13px'
};

const snippetCardStyle: React.CSSProperties = {
  backgroundColor: '#2d2d2d',
  borderRadius: '6px',
  padding: '12px',
  border: '1px solid #3c3c3c',
  cursor: 'pointer',
  ':hover': {
    borderColor: '#0e639c'
  }
};

const snippetHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
};

const snippetNameStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 500
};

const snippetActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px'
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '12px',
  padding: '2px 4px',
  borderRadius: '2px',
  opacity: 0.7,
  ':hover': {
    opacity: 1,
    backgroundColor: '#3c3c3c'
  }
};

const deleteButtonStyle: React.CSSProperties = {
  ':hover': {
    backgroundColor: '#cd3131'
  }
};

const snippetCommandStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  padding: '8px 10px',
  borderRadius: '4px',
  marginBottom: '6px'
};

const snippetDescStyle: React.CSSProperties = {
  color: '#858585',
  fontSize: '11px',
  marginBottom: '8px'
};

const snippetFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const snippetMetaStyle: React.CSSProperties = {
  color: '#666666',
  fontSize: '11px'
};

const executeButtonStyle: React.CSSProperties = {
  padding: '4px 12px',
  backgroundColor: '#0e639c',
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: 500
};

const executeButtonDisabledStyle: React.CSSProperties = {
  backgroundColor: '#3c3c3c',
  cursor: 'not-allowed',
  opacity: 0.5
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#252526',
  borderRadius: '8px',
  padding: '24px',
  width: '100%',
  maxWidth: '450px',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const modalTitleStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 600
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const labelStyle: React.CSSProperties = {
  color: '#cccccc',
  fontSize: '13px',
  fontWeight: 500
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: '#3c3c3c',
  border: '1px solid #555555',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none'
};

const textareaStyle: React.CSSProperties = {
  resize: 'vertical',
  fontFamily: 'monospace',
  fontSize: '12px'
};

const modalButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '20px'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#3c3c3c',
  border: '1px solid #555555',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '13px',
  cursor: 'pointer'
};

const saveButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#0e639c',
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '13px',
  cursor: 'pointer',
  fontWeight: 500
};
