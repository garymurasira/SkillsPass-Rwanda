import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConversationList, ThreadView } from "./Messages";
import type { ThreadData } from "@/lib/queries/messages";
import type { Conversation, Message } from "@/lib/api/messages";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
  useRouter: () => ({ history: { back: vi.fn() } }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const sendMutate = vi.fn();
const olderMutate = vi.fn();
let thread: { data?: ThreadData; isPending: boolean; isError?: boolean; error?: unknown; refetch: () => void };
let conversations: Conversation[] = [];
vi.mock("@/lib/queries/messages", () => ({
  useThread: () => thread,
  useSendMessage: () => ({ mutate: sendMutate, isPending: false }),
  useLoadOlder: () => ({ mutate: olderMutate, isPending: false }),
  useConversations: () => ({ data: { pages: [{ items: conversations }] }, isPending: false, isError: false, hasNextPage: false }),
}));

const m = (seq: number, fromMe: boolean): Message => ({ id: `m${seq}`, seq, content: `hello ${seq}`, sentAt: "2026-11-12T10:00:00Z", fromMe, readAt: null });
const data = (over: Partial<ThreadData> = {}): ThreadData => ({
  peer: { id: "p1", name: "Eric Habimana", photoUrl: null, companyName: null }, items: [], cursor: 0, hasOlder: false, ...over,
});

beforeEach(() => { sendMutate.mockReset(); olderMutate.mockReset(); });

describe("ThreadView", () => {
  it("shows the conversation under the other person's name", () => {
    thread = { data: data({ items: [m(1, false), m(2, true)] }), isPending: false, refetch: vi.fn() };
    render(<ThreadView peerId="p1" role="employer" />);
    expect(screen.getByText("Eric Habimana")).toBeInTheDocument();
    expect(screen.getByText("hello 1")).toBeInTheDocument();
    expect(screen.getByText("hello 2")).toBeInTheDocument();
  });

  it("invites an employer to say hello in an empty conversation", () => {
    thread = { data: data(), isPending: false, refetch: vi.fn() };
    render(<ThreadView peerId="p1" role="employer" />);
    expect(screen.getByText("No messages yet. Say hello to Eric Habimana.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a message")).toBeInTheDocument();
  });

  it("titles a worker's chat with the company, and offers a reply box", () => {
    thread = { data: data({ peer: { id: "e1", name: "Alexis", photoUrl: null, companyName: "BuildCo" } }), isPending: false, refetch: vi.fn() };
    render(<ThreadView peerId="e1" role="worker" />);
    expect(screen.getByText("BuildCo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a reply")).toBeInTheDocument();
  });

  it("sends the trimmed text, and won't send an empty message", () => {
    thread = { data: data(), isPending: false, refetch: vi.fn() };
    render(<ThreadView peerId="p1" role="employer" />);
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "  Are you free?  " } });
    fireEvent.click(send);
    expect(sendMutate).toHaveBeenCalledWith("Are you free?", expect.anything());
  });

  it("offers earlier messages only when there are some", () => {
    thread = { data: data({ items: [m(9, false)], hasOlder: true }), isPending: false, refetch: vi.fn() };
    render(<ThreadView peerId="p1" role="employer" />);
    fireEvent.click(screen.getByRole("button", { name: "Show earlier messages" }));
    expect(olderMutate).toHaveBeenCalled();
  });
});

describe("ConversationList", () => {
  const convo = (unreadCount: number): Conversation => ({
    peer: { id: "e1", name: "Alexis", photoUrl: null, companyName: "BuildCo" },
    lastMessage: { content: "See you at 8", sentAt: "2026-11-12T10:00:00Z", fromMe: false }, unreadCount,
  });

  it("lists companies for a worker, with the unread count", () => {
    conversations = [convo(3)];
    render(<ConversationList role="worker" />);
    expect(screen.getByText("BuildCo")).toBeInTheDocument();
    expect(screen.getByText("See you at 8")).toBeInTheDocument();
    expect(screen.getByLabelText("3 unread")).toBeInTheDocument();
  });

  it("shows no unread mark when everything is read", () => {
    conversations = [convo(0)];
    render(<ConversationList role="worker" />);
    expect(screen.queryByLabelText(/unread/)).not.toBeInTheDocument();
  });

  it("explains how a conversation starts when there are none", () => {
    conversations = [];
    const { unmount } = render(<ConversationList role="worker" />);
    expect(screen.getByText("When an employer writes to you, it shows here.")).toBeInTheDocument();
    unmount();
    render(<ConversationList role="employer" />);
    expect(screen.getByText("Open a worker profile and tap Send message.")).toBeInTheDocument();
  });
});
