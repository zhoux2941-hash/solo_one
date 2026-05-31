import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { parseGitLog, validateFormat } from '../utils/parser';

export function useGitLog() {
  const { setCommits, setError, setLoading, clearData } = useStore();

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      
      if (!validateFormat(text)) {
        setError('文件格式不正确，请确保是使用正确命令生成的git log文件');
        setLoading(false);
        return false;
      }

      const commits = parseGitLog(text);
      
      if (commits.length === 0) {
        setError('未能解析到有效的提交记录');
        setLoading(false);
        return false;
      }

      setCommits(commits);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setCommits, setError, setLoading]);

  const handleTextInput = useCallback((text: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!validateFormat(text)) {
        setError('文本格式不正确，请确保是使用正确命令生成的git log内容');
        setLoading(false);
        return false;
      }

      const commits = parseGitLog(text);
      
      if (commits.length === 0) {
        setError('未能解析到有效的提交记录');
        setLoading(false);
        return false;
      }

      setCommits(commits);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setCommits, setError, setLoading]);

  return {
    handleFileUpload,
    handleTextInput,
    clearData,
  };
}
