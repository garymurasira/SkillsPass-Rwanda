import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/OtpInput";
import { AuthLayout } from "./AuthLayout";

export function OtpBody({ onDone, wrongNumberTo = "/login" }: { onDone: () => void; wrongNumberTo?: string }) {
  const [code, setCode] = useState("");
  const [secs, setSecs] = useState(60);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(secs - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  return (
    <div className="space-y-6">
      <p className="text-center text-lg">Enter the 6-digit code we sent by SMS.</p>
      <OtpInput value={code} onChange={setCode} />
      <Button size="lg" className="h-14 w-full text-lg" disabled={code.length < 6} onClick={onDone}>Continue</Button>
      <div className="flex justify-between text-base">
        <button type="button" disabled={secs > 0} onClick={() => setSecs(60)} className="h-12 font-bold text-primary disabled:text-muted-foreground">
          {secs > 0 ? `Resend code in ${secs}s` : "Resend code"}
        </button>
        <Link to={wrongNumberTo as "/"} className="flex h-12 items-center font-bold text-primary underline">Wrong number?</Link>
      </div>
    </div>
  );
}

export default function Otp({ flow }: { flow: "worker" | "employer" }) {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Enter code">
      <OtpBody onDone={() => navigate({ to: flow === "employer" ? "/employer" : "/worker" })} wrongNumberTo={flow === "employer" ? "/register/employer" : "/register/worker"} />
    </AuthLayout>
  );
}
