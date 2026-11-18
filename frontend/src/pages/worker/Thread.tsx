import { PageHeader } from "@/components/PageHeader";
import { ChatThread, peerFor } from "@/components/Messages";

export default function WorkerThread({ id }: { id: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={peerFor(id)?.companyName ?? "Chat"} back />
      <ChatThread />
    </div>
  );
}
