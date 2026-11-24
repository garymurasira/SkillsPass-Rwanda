import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { ConversationList } from "@/components/Messages";

export default function WorkerMessages() {
  const { t } = useTranslation();
  return (<><PageHeader title={t("messages.title")} /><ConversationList role="worker" /></>);
}
