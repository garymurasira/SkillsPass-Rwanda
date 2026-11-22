import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Message, Peer, Thread } from "../api/messages";
import { mergeMessages, messageKeys, useThread, type ThreadData } from "./messages";

const getThread = vi.fn();
vi.mock("../api/messages", async (orig) => ({ ...(await orig<typeof import("../api/messages")>()), getThread: (...a: unknown[]) => getThread(...a) }));
vi.mock("../auth/context", () => ({ useAuth: () => ({ status: "authenticated" }) }));

const peer: Peer = { id: "p1", name: "Eric", photoUrl: null, companyName: null };
const msg = (seq: number, fromMe = false): Message => ({ id: `m${seq}`, seq, content: `text ${seq}`, sentAt: "2026-11-12T10:00:00Z", fromMe, readAt: null });
const page = (items: Message[], over: Partial<Thread> = {}): Thread => ({ peer, items, hasMore: false, cursor: items.at(-1)?.seq ?? null, ...over });

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

beforeEach(() => getThread.mockReset());

describe("mergeMessages", () => {
  it("combines lists without duplicates, in seq order", () => {
    expect(mergeMessages([msg(3), msg(1)], [msg(2), msg(3)]).map((m) => m.seq)).toEqual([1, 2, 3]);
  });
});

describe("useThread", () => {
  it("loads the latest messages first, then polls only for messages after the cursor", async () => {
    const { wrapper } = setup();
    getThread.mockResolvedValueOnce(page([msg(5), msg(6)], { hasMore: true }));
    const { result } = renderHook(() => useThread("p1"), { wrapper });

    await waitFor(() => expect(result.current.data?.items).toHaveLength(2));
    expect(getThread).toHaveBeenLastCalledWith("p1", { limit: 50 }, expect.anything());
    expect(result.current.data).toMatchObject({ cursor: 6, hasOlder: true });

    getThread.mockResolvedValueOnce(page([msg(7)]));
    await result.current.refetch();
    await waitFor(() => expect(result.current.data?.items.map((m) => m.seq)).toEqual([5, 6, 7]));
    expect(getThread).toHaveBeenLastCalledWith("p1", { after: 6, limit: 100 }, expect.anything());
    expect(result.current.data?.cursor).toBe(7);
  });

  it("keeps the cursor and the messages when a poll finds nothing new", async () => {
    const { wrapper } = setup();
    getThread.mockResolvedValueOnce(page([msg(1)]));
    const { result } = renderHook(() => useThread("p1"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    getThread.mockResolvedValueOnce(page([], { cursor: 1 }));
    await result.current.refetch();
    expect(result.current.data).toMatchObject({ cursor: 1 });
    expect(result.current.data?.items).toHaveLength(1);
  });

  it("does not lose a message we sent while a poll was running, and never shows it twice", async () => {
    const { client, wrapper } = setup();
    getThread.mockResolvedValueOnce(page([msg(1)]));
    const { result } = renderHook(() => useThread("p1"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    // we send message 2 (added to the cache by useSendMessage) ...
    client.setQueryData<ThreadData>(messageKeys.thread("p1"), (d) => d && { ...d, items: mergeMessages(d.items, [msg(2, true)]) });
    // ... and the next poll returns it again, along with their reply
    getThread.mockResolvedValueOnce(page([msg(2, true), msg(3)]));
    await result.current.refetch();

    await waitFor(() => expect(result.current.data?.items.map((m) => m.seq)).toEqual([1, 2, 3]));
  });

  it("follows up when more than one poll page of messages arrived", async () => {
    const { wrapper } = setup();
    getThread.mockResolvedValueOnce(page([msg(1)]));
    const { result } = renderHook(() => useThread("p1"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    getThread.mockResolvedValueOnce(page([msg(2)], { hasMore: true })).mockResolvedValueOnce(page([msg(3)]));
    await result.current.refetch();
    await waitFor(() => expect(result.current.data?.items.map((m) => m.seq)).toEqual([1, 2, 3]));
    expect(getThread).toHaveBeenLastCalledWith("p1", { after: 2, limit: 100 }, expect.anything());
  });
});
