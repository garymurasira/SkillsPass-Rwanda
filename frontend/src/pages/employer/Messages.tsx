import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ChatThread, ConversationList, peerFor } from "@/components/Messages";

export default function EmployerMessages({ activeId }: { activeId?: string | undefined }) {
  const peer = activeId ? peerFor(activeId) : undefined;
  return (
    <div className="flex flex-1 md:h-screen">
      <div className={`w-full flex-col border-r md:flex md:w-80 md:shrink-0 ${activeId ? "hidden" : "flex"}`}>
        <PageHeader title="Messages" />
        <div className="overflow-y-auto"><ConversationList role="employer" activeId={activeId} /></div>
      </div>
      <div className={`min-w-0 flex-1 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
        {activeId ? (
          <>
            <PageHeader title={peer?.name ?? "Chat"} back />
            <ChatThread />
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-muted-foreground"><p className="flex items-center gap-2"><MessageCircle className="h-5 w-5" />Choose a conversation</p></div>
        )}
      </div>
    </div>
  );
}
