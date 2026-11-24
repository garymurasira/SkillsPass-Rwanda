import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { SettingsCommon } from "../SettingsCommon";

export default function WorkerSettings() {
  const { t } = useTranslation();
  return (<><PageHeader title={t("worker.settings.title")} /><SettingsCommon phoneTo="/worker/settings/phone" /></>);
}
