import { PageHeader } from "@/components/PageHeader";
import { ConversationList } from "@/components/Messages";

export default function WorkerMessages() {
  return (<><PageHeader title="Messages" /><ConversationList role="worker" /></>);
}
