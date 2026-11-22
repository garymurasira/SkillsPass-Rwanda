import { api } from "./client";

// Hand-pinned shapes (see backend/src/modules/messaging/*.ts).
// Messaging is plain request/response: the screens poll, using `seq` as a cursor.

export interface Peer {
  id: string;
  name: string;
  /** Workers have a photo; employers don't. */
  photoUrl: string | null;
  /** Set when the other person is an employer. */
  companyName: string | null;
}

export interface Conversation {
  peer: Peer;
  lastMessage: { content: string; sentAt: string; fromMe: boolean };
  unreadCount: number;
}

export interface ConversationPage {
  items: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface Message {
  id: string;
  /** A global, ever-increasing number: the order of messages and the polling cursor. */
  seq: number;
  content: string;
  sentAt: string;
  fromMe: boolean;
  readAt: string | null;
}

export interface Thread {
  peer: Peer;
  /** Oldest first. */
  items: Message[];
  /** More messages exist beyond this page, in the direction we asked for. */
  hasMore: boolean;
  /** Pass as `after` to get only newer messages. */
  cursor: number | null;
}

export const CONVERSATIONS_PAGE_SIZE = 20;
export const MAX_MESSAGE_LENGTH = 1000;

export const listConversations = (offset: number, signal?: AbortSignal) =>
  api.get<ConversationPage>("/messages", { query: { limit: CONVERSATIONS_PAGE_SIZE, offset }, ...(signal ? { signal } : {}) });

export const getUnreadCount = (signal?: AbortSignal) =>
  api.get<{ unread: number }>("/messages/unread-count", signal ? { signal } : undefined);

/**
 * The conversation with one person. Opening it marks what they sent you as read.
 *  - no cursor: the newest `limit` messages
 *  - `before`: older than that seq    - `after`: only newer than that seq (polling)
 */
export const getThread = (peerId: string, q: { before?: number; after?: number; limit?: number } = {}, signal?: AbortSignal) =>
  api.get<Thread>(`/messages/with/${peerId}`, { query: { ...q }, ...(signal ? { signal } : {}) });

export const sendMessage = (recipientId: string, content: string) =>
  api.post<Message>("/messages", { recipientId, content });
