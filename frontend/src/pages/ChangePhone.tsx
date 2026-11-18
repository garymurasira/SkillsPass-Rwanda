import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { OtpBody } from "./public/Otp";

export default function ChangePhone({ backTo }: { backTo: "/worker/settings" | "/employer/settings" }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  return (
    <>
      <PageHeader title={step === 1 ? "New phone number" : "Enter code"} back />
      <div className="space-y-5 p-4">
        <p className="text-sm font-bold text-muted-foreground">Step {step} of 2</p>
        {step === 1 ? (
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <Field label="New phone number" type="tel" placeholder="078 000 0000" />
            <Button type="submit" size="lg" className="h-14 w-full text-lg">Send me a code</Button>
          </form>
        ) : (
          <OtpBody wrongNumberTo={backTo + "/phone"} onDone={() => { toast.success("Phone number changed"); navigate({ to: backTo }); }} />
        )}
      </div>
    </>
  );
}
