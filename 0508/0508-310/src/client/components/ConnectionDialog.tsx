import { useState, useEffect } from 'react';
import type { SSHConnection } from '../types';
import { generateId } from '../utils/crypto';

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: SSHConnection) => void;
  editConnection?: SSHConnection | null;
}

export function ConnectionDialog({ isOpen, onClose, onConnect, editConnection }: ConnectionDialogProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authType, setAuthType] = useState<'password' | 'key'>('password');
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    if (editConnection) {
      setName(editConnection.name);
      setHost(editConnection.host);
      setPort(editConnection.port);
      setUsername(editConnection.username);
      setPassword(editConnection.password || '');
      setPrivateKey(editConnection.privateKey || '');
      if (editConnection.privateKey) {
        setAuthType('key');
      }
    } else {
      setName('');
      setHost('');
      setPort(22);
      setUsername('');
      setPassword('');
      setPrivateKey('');
      setAuthType('password');
    }
  }, [editConnection, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const connection: SSHConnection = {
      id: editConnection?.id || generateId(),
      name: name || `${username}@${host}`,
      host,
      port,
      username,
      password: authType === 'password' ? password : undefined,
      privateKey: authType === 'key' ? privateKey : undefined,
      createdAt: editConnection?.createdAt || Date.now()
    };

    onConnect(connection);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <h2 style={titleStyle}>
          {editConnection ? 'Edit Connection' : 'New SSH Connection'}
        </h2>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Connection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="e.g., Production Server"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Host</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              style={inputStyle}
              placeholder="e.g., 192.168.1.100 or example.com"
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value))}
              style={inputStyle}
              min={1}
              max={65535}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              placeholder="e.g., root"
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Authentication Type</label>
            <div style={radioGroupStyle}>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  checked={authType === 'password'}
                  onChange={() => setAuthType('password')}
                  style={radioStyle}
                />
                Password
              </label>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  checked={authType === 'key'}
                  onChange={() => setAuthType('key')}
                  style={radioStyle}
                />
                Private Key
              </label>
            </div>
          </div>

          {authType === 'password' && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Enter password"
              />
            </div>
          )}

          {authType === 'key' && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Private Key</label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                style={{ ...inputStyle, ...textareaStyle }}
                placeholder="-----BEGIN RSA PRIVATE KEY-----"
                rows={6}
              />
            </div>
          )}

          <div style={buttonGroupStyle}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>
              Cancel
            </button>
            <button type="submit" style={connectButtonStyle}>
              {editConnection ? 'Save' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
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

const dialogStyle: React.CSSProperties = {
  backgroundColor: '#252526',
  borderRadius: '8px',
  padding: '24px',
  width: '100%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflow: 'auto'
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 600
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const fieldStyle: React.CSSProperties = {
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
  fontSize: '14px',
  outline: 'none'
};

const textareaStyle: React.CSSProperties = {
  resize: 'vertical',
  fontFamily: 'monospace',
  fontSize: '12px'
};

const radioGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px'
};

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: '#ffffff',
  cursor: 'pointer'
};

const radioStyle: React.CSSProperties = {
  cursor: 'pointer'
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '8px'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#3c3c3c',
  border: '1px solid #555555',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '14px',
  cursor: 'pointer'
};

const connectButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#0e639c',
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 500
};
