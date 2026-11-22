import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, MessageCircle, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { assetUrl } from "@/lib/api/config";
import { errorMessage } from "@/lib/api/error-messages";
import { hasErrorCode } from "@/lib/api/errors";
import { MAX_MESSAGE_LENGTH, type Peer } from "@/lib/api/messages";
import { formatMessageDay, formatMessageTime } from "@/lib/format";
import { useConversations, useLoadOlder, useSendMessage, useThread } from "@/lib/queries/messages";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import { ErrorRetry } from "./ErrorRetry";
import { ListSkeleton } from "./Skeletons";
import { PageHeader } from "./PageHeader";

type Role = "worker" | "employer";

function Avatar({ peer, className = "h-14 w-14" }: { peer: Peer; className?: string }) {
  const photo = assetUrl(peer.photoUrl);
  if (photo) return <img src={photo} alt="" className={`${className} shrink-0 rounded-full object-cover`} />;
  const Icon = peer.companyName ? Building2 : UserRound;
  return <div className={`${className} grid shrink-0 place-items-center rounded-full bg-muted text-muted-foreground`}><Icon className="h-1/2 w-1/2" /></div>;
}

/** Workers talk to companies, employers talk to workers. */
const peerTitle = (role: Role, peer: Peer) => (role === "worker" ? (peer.companyName ?? peer.name) : peer.name);

export function ConversationList({ role, activeId }: { role: Role; activeId?: string | undefined }) {
  const q = useConversations();
  const conversations = q.data?.pages.flatMap((p) => p.items) ?? [];

  if (q.isPending) return <div className="p-4"><ListSkeleton rows={4} /></div>;
  if (q.isError) return <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />;
  if (conversations.length === 0) {
    return <EmptyState icon={MessageCircle} title="No messages yet" text={role === "worker" ? "When an employer writes to you, it shows here." : "Open a worker profile and tap Send message."} />;
  }

  return (
    <>
      <ul className="divide-y">
        {conversations.map((c) => (
          <li key={c.peer.id}>
            <Link to={role === "worker" ? "/worker/messages/$id" : "/employer/messages/$id"} params={{ id: c.peer.id }}
              className={`flex items-center gap-3 p-4 hover:bg-muted ${activeId === c.peer.id ? "bg-secondary" : ""}`}>
              <Avatar peer={c.peer} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <p className="truncate font-bold">{peerTitle(role, c.peer)}</p>
                  <span className="shrink-0 text-sm text-muted-foreground">{formatMessageDay(c.lastMessage.sentAt)}</span>
                </div>
                <p className={`truncate text-sm ${c.unreadCount ? "font-bold" : "text-muted-foreground"}`}>
                  {c.lastMessage.fromMe && "You: "}{c.lastMessage.content}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground" aria-label={`${c.unreadCount} unread`}>{c.unreadCount}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {q.hasNextPage && (
        <div className="p-4">
          <Button variant="outline" className="h-12 w-full" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
            {q.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}

/** Header, messages and the box to write in, for the conversation with one person. */
export function ThreadView({ peerId, role }: { peerId: string; role: Role }) {
  const q = useThread(peerId);
  const send = useSendMessage(peerId);
  const older = useLoadOlder(peerId);
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const items = q.data?.items ?? [];
  const last = items.at(-1)?.id;

  // Follow new messages, unless the person has scrolled up to read older ones.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [last]);

  // A different conversation starts at the bottom again.
  useEffect(() => { stickToBottom.current = true; setText(""); }, [peerId]);

  const title = q.data ? peerTitle(role, q.data.peer) : "Chat";
  // On a laptop the employer sees the list beside the chat, so the back arrow is only needed on phones.
  const backMode = role === "employer" ? "mobile" : true;

  if (q.isPending) return (<><PageHeader title="Chat" back={backMode} /><div className="p-4"><ListSkeleton rows={3} /></div></>);
  if (!q.data) {
    return (
      <>
        <PageHeader title="Chat" back={backMode} />
        {hasErrorCode(q.error, "PEER_NOT_FOUND")
          ? <EmptyState icon={MessageCircle} title="We couldn't find this conversation" />
          : <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />}
      </>
    );
  }

  function submit() {
    const content = text.trim();
    if (!content || send.isPending) return;
    stickToBottom.current = true;
    send.mutate(content, {
      onSuccess: () => setText(""),
      onError: (e) => toast.error(errorMessage(e)), // the text stays in the box so nothing is lost
    });
  }

  return (
    <>
      <PageHeader title={title} back={backMode} />
      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4"
          onScroll={(e) => { const el = e.currentTarget; stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
          {q.data.hasOlder && (
            <Button variant="outline" className="h-11 w-full" disabled={older.isPending} onClick={() => { stickToBottom.current = false; older.mutate(); }}>
              {older.isPending ? "Loading…" : "Show earlier messages"}
            </Button>
          )}
          {items.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">
              {role === "employer" ? `No messages yet. Say hello to ${q.data.peer.name}.` : "No messages yet."}
            </p>
          )}
          {items.map((m) => (
            <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.fromMe ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"}`}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-right text-xs ${m.fromMe ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{formatMessageTime(m.sentAt)}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="sticky bottom-0 flex gap-2 border-t bg-background p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_MESSAGE_LENGTH} aria-label="Message"
            placeholder={role === "worker" ? "Write a reply" : "Write a message"}
            className="h-14 min-w-0 flex-1 rounded-full border bg-card px-5 text-base outline-none focus:border-primary" />
          <button type="submit" aria-label="Send" disabled={!text.trim() || send.isPending}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
            <Send className="h-6 w-6" />
          </button>
        </form>
      </div>
    </>
  );
}
