import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Send } from "lucide-react";
import { conversations, messages } from "@/mock/data";
import { EmptyState } from "./EmptyState";
import { StateSwitch, useViewState } from "./ViewState";

type Role = "worker" | "employer";

export function ConversationList({ role, activeId }: { role: Role; activeId?: string | undefined }) {
  const state = useViewState();
  return (
    <StateSwitch state={state} empty={<EmptyState icon={MessageCircle} title="No messages yet" text={role === "worker" ? "When an employer writes to you, it shows here." : "Open a worker profile and tap Send message."} />}>
      <ul className="divide-y">
        {conversations.map((c) => (
          <li key={c.peer.id}>
            <Link to={role === "worker" ? "/worker/messages/$id" : "/employer/messages/$id"} params={{ id: c.peer.id }}
              className={`flex items-center gap-3 p-4 hover:bg-muted ${activeId === c.peer.id ? "bg-secondary" : ""}`}>
              <img src={c.peer.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <p className="truncate font-bold">{role === "worker" ? c.peer.companyName : c.peer.name}</p>
                  <span className="shrink-0 text-sm text-muted-foreground">{c.lastMessage.sentAt}</span>
                </div>
                <p className={`truncate text-sm ${c.unreadCount ? "font-bold" : "text-muted-foreground"}`}>
                  {c.lastMessage.fromMe && "You: "}{c.lastMessage.content}
                </p>
              </div>
              {c.unreadCount > 0 && <span className="h-3 w-3 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
            </Link>
          </li>
        ))}
      </ul>
    </StateSwitch>
  );
}

export function ChatThread() {
  const [text, setText] = useState("");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.fromMe ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"}`}>
              <p>{m.content}</p>
              <p className={`mt-1 text-right text-xs ${m.fromMe ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{m.sentAt}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); setText(""); }} className="sticky bottom-0 flex gap-2 border-t bg-background p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply"
          className="h-14 min-w-0 flex-1 rounded-full border bg-card px-5 text-base outline-none focus:border-primary" />
        <button type="submit" aria-label="Send" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Send className="h-6 w-6" />
        </button>
      </form>
    </div>
  );
}

export function peerFor(id: string) {
  return conversations.find((c) => c.peer.id === id)?.peer;
}
