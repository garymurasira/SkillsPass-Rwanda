import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Field } from "@/components/Field";
import { LocationSelect } from "@/components/LocationSelect";
import { Button } from "@/components/ui/button";
import { SettingsCommon } from "../SettingsCommon";

export default function EmployerSettings() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-xl">
        <SettingsCommon phoneTo="/employer/settings/phone">
          <form className="space-y-4 rounded-2xl border p-4" onSubmit={(e) => { e.preventDefault(); toast.success("Company profile saved"); }}>
            <h2 className="text-lg font-bold">Company profile</h2>
            <Field label="Your name" defaultValue="Alexis Kamanzi" />
            <Field label="Company name" defaultValue="Inzozi Builders" />
            <LocationSelect defaultProvince="Kigali" defaultDistrict="Gasabo" />
            <Field label="Contact info" defaultValue="info@inzozi.rw" />
            <Button type="submit" size="lg" className="h-12 w-full">Save</Button>
          </form>
        </SettingsCommon>
      </div>
    </>
  );
}
