import { PageHeader } from "@/components/PageHeader";
import { SettingsCommon } from "../SettingsCommon";

export default function WorkerSettings() {
  return (<><PageHeader title="Settings" /><SettingsCommon phoneTo="/worker/settings/phone" /></>);
}
