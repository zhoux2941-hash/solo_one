import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { escapeHtmlManual } from '@/utils/format';

export interface Reply {
  id: string;
  messageId: string;
  nickname: string;
  content: string;
  createdAt: number;
}

export interface Message {
  id: string;
  nickname: string;
  content: string;
  likes: number;
  createdAt: number;
  sessionId: string;
  replies: Reply[];
}

interface TreeholeState {
  messages: Message[];
  likedIds: string[];
  sessionId: string;
  addMessage: (content: string) => void;
  deleteMessage: (id: string) => void;
  toggleLike: (id: string) => void;
  addReply: (messageId: string, content: string) => void;
  generateNickname: () => string;
  generateId: () => string;
}

const SESSION_KEY = 'treehole_session_id';
const MAX_MESSAGES = 30;

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const useTreeholeStore = create<TreeholeState>()(
  persist(
    (set, get) => ({
      messages: [],
      likedIds: [],
      sessionId: getOrCreateSessionId(),

      generateId: () => {
        return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      },

      generateNickname: () => {
        const randomNum = Math.floor(Math.random() * 900) + 100;
        return `游客${randomNum}`;
      },

      addMessage: (content: string) => {
        if (!content.trim()) return;
        if (content.length > 200) return;

        const { messages, sessionId, generateId, generateNickname } = get();
        const newMessage: Message = {
          id: generateId(),
          nickname: escapeHtmlManual(generateNickname()),
          content: escapeHtmlManual(content.trim()),
          likes: 0,
          createdAt: Date.now(),
          sessionId,
          replies: [],
        };

        const newMessages = [newMessage, ...messages].slice(0, MAX_MESSAGES);
        set({ messages: newMessages });
      },

      deleteMessage: (id: string) => {
        const { messages, sessionId } = get();
        const message = messages.find(m => m.id === id);
        if (message && message.sessionId === sessionId) {
          set({
            messages: messages.filter(m => m.id !== id),
          });
        }
      },

      toggleLike: (id: string) => {
        const { messages, likedIds } = get();
        const isLiked = likedIds.includes(id);

        set({
          messages: messages.map(m =>
            m.id === id
              ? { ...m, likes: m.likes + (isLiked ? -1 : 1) }
              : m
          ),
          likedIds: isLiked
            ? likedIds.filter(lid => lid !== id)
            : [...likedIds, id],
        });
      },

      addReply: (messageId: string, content: string) => {
        if (!content.trim()) return;

        const { messages, generateId, generateNickname } = get();
        const newReply: Reply = {
          id: generateId(),
          messageId,
          nickname: escapeHtmlManual(generateNickname()),
          content: escapeHtmlManual(content.trim()),
          createdAt: Date.now(),
        };

        set({
          messages: messages.map(m =>
            m.id === messageId
              ? { ...m, replies: [...m.replies, newReply] }
              : m
          ),
        });
      },
    }),
    {
      name: 'treehole-storage',
      partialize: (state) => ({
        messages: state.messages,
        likedIds: state.likedIds,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.sessionId = getOrCreateSessionId();
            state.messages = state.messages.map(msg => ({
              ...msg,
              nickname: escapeHtmlManual(msg.nickname),
              content: escapeHtmlManual(msg.content),
              replies: msg.replies.map(reply => ({
                ...reply,
                nickname: escapeHtmlManual(reply.nickname),
                content: escapeHtmlManual(reply.content),
              })),
            }));
          }
        };
      },
    }
  )
);
