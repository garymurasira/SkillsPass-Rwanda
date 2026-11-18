import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getThread, getUnreadCount, listConversations, sendMessage, type ConversationPage, type Message, type Peer } from "../api/messages";
import { useAuth } from "../auth/context";

export const messageKeys = {
  conversations: ["messages", "conversations"] as const,
  unread: ["messages", "unread"] as const,
  thread: (peerId: string) => ["messages", "thread", peerId] as const,
};

/** How often screens ask the server for news. Short enough to feel live, long enough to be kind to mobile data. */
export const POLL_THREAD_MS = 5_000;
export const POLL_LIST_MS = 15_000;
export const POLL_UNREAD_MS = 30_000;

const THREAD_PAGE = 50;

// ── The conversation list and the unread badge ──

export const useConversations = () =>
  useInfiniteQuery({
    queryKey: messageKeys.conversations,
    queryFn: ({ pageParam, signal }): Promise<ConversationPage> => listConversations(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.offset + last.limit < last.total ? last.offset + last.limit : undefined),
    refetchInterval: POLL_LIST_MS,
  });

/** Number of unread messages, for the badge on the Messages tab. Only asks while signed in. */
export function useUnreadCount() {
  const { status } = useAuth();
  return useQuery({
    queryKey: messageKeys.unread,
    queryFn: ({ signal }) => getUnreadCount(signal),
    enabled: status === "authenticated",
    refetchInterval: POLL_UNREAD_MS,
    select: (d) => d.unread,
  });
}

// ── One conversation ──

/** What the thread screen holds in the cache: the messages so far, and where polling continues from. */
export interface ThreadData {
  peer: Peer;
  /** Oldest first, no duplicates. */
  items: Message[];
  /** The highest seq fetched from the server (0 when there is none). Polling asks for everything after it. */
  cursor: number;
  /** Older messages exist that haven't been loaded. */
  hasOlder: boolean;
}

/** Merges two lists of messages by id and keeps them in seq order. */
export function mergeMessages(a: Message[], b: Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const m of a) byId.set(m.id, m);
  for (const m of b) byId.set(m.id, m);
  return [...byId.values()].sort((x, y) => x.seq - y.seq);
}

const refreshLists = (qc: QueryClient) => {
  void qc.invalidateQueries({ queryKey: messageKeys.unread });
  void qc.invalidateQueries({ queryKey: messageKeys.conversations });
};

/**
 * The first fetch loads the latest messages. Every poll after that asks only for messages newer
 * than the cursor, so a quiet conversation costs a few bytes per poll.
 */
export function useThread(peerId: string) {
  return useQuery({
    queryKey: messageKeys.thread(peerId),
    queryFn: async ({ client, signal }): Promise<ThreadData> => {
      const previous = client.getQueryData<ThreadData>(messageKeys.thread(peerId));

      if (!previous) {
        const first = await getThread(peerId, { limit: THREAD_PAGE }, signal);
        refreshLists(client); // opening a conversation marks it read
        return { peer: first.peer, items: first.items, cursor: first.cursor ?? 0, hasOlder: first.hasMore };
      }

      let cursor = previous.cursor;
      let peer = previous.peer;
      let incoming: Message[] = [];
      for (let i = 0; i < 5; i++) {
        const page = await getThread(peerId, { after: cursor, limit: 100 }, signal);
        peer = page.peer;
        incoming = incoming.concat(page.items);
        cursor = page.cursor ?? cursor;
        if (!page.hasMore) break;
      }
      if (incoming.some((m) => !m.fromMe)) refreshLists(client);
      // Read the cache again: a message we just sent may have been added while we were waiting.
      const latest = client.getQueryData<ThreadData>(messageKeys.thread(peerId)) ?? previous;
      return { peer, items: mergeMessages(latest.items, incoming), cursor: Math.max(cursor, latest.cursor), hasOlder: latest.hasOlder };
    },
    staleTime: 0,
    // Pauses by itself while the tab is in the background. Keeps going after a blip if there is
    // something to show, but stops hammering the server for a conversation that can't be loaded.
    refetchInterval: (q) => (q.state.data || q.state.status !== "error" ? POLL_THREAD_MS : false),
    retry: false,
  });
}

/** Loads the page of messages before the oldest one on screen. */
export function useLoadOlder(peerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const current = qc.getQueryData<ThreadData>(messageKeys.thread(peerId));
      const oldest = current?.items[0]?.seq;
      if (!current || oldest === undefined) return;
      const page = await getThread(peerId, { before: oldest, limit: THREAD_PAGE });
      qc.setQueryData<ThreadData>(messageKeys.thread(peerId), (d) =>
        d && { ...d, items: mergeMessages(page.items, d.items), hasOlder: page.hasMore },
      );
    },
  });
}

export function useSendMessage(peerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(peerId, content),
    onSuccess: (message) => {
      // Show it at once. The cursor is left alone on purpose: the next poll may bring earlier
      // messages from them, and merging by id means our own message is never shown twice.
      qc.setQueryData<ThreadData>(messageKeys.thread(peerId), (d) => d && { ...d, items: mergeMessages(d.items, [message]) });
      void qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}
