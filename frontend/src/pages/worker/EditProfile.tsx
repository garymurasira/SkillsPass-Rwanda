import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { currentWorker } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { Field } from "@/components/Field";
import { LocationSelect } from "@/components/LocationSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function EditProfile() {
  const navigate = useNavigate();
  const [bio, setBio] = useState(currentWorker.bio);
  return (
    <>
      <PageHeader title="Edit profile" back />
      <form className="space-y-5 p-4" onSubmit={(e) => { e.preventDefault(); toast.success("Profile saved"); navigate({ to: "/worker" }); }}>
        <Field label="Your name" defaultValue={currentWorker.name} />
        <LocationSelect defaultProvince={currentWorker.region} defaultDistrict={currentWorker.city} />
        <div className="space-y-2">
          <Label className="text-base">About me</Label>
          <Textarea value={bio} maxLength={300} onChange={(e) => setBio(e.target.value)} rows={5} className="text-base" placeholder="What work do you do? Where?" />
          <p className="text-right text-sm text-muted-foreground">{bio.length} / 300</p>
        </div>
        <label className="flex items-center justify-between gap-4 rounded-2xl border p-4">
          <span className="font-bold">Let employers see my phone number</span>
          <Switch defaultChecked={currentWorker.shareContact} />
        </label>
        <Button type="submit" size="lg" className="h-14 w-full text-lg">Save</Button>
      </form>
    </>
  );
}
