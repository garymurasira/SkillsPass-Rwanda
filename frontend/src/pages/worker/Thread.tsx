import { ThreadView } from "@/components/Messages";

export default function WorkerThread({ id }: { id: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <ThreadView peerId={id} role="worker" />
    </div>
  );
}
