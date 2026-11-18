import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { Logo } from "@/components/Logo";

export default function AdminLogin() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-muted p-4">
      <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/admin" }); }} className="w-full max-w-md space-y-5 rounded-3xl border bg-card p-6 shadow-sm">
        <Logo />
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6 text-primary" />Staff sign in</h1>
        <Field label="Phone number" type="tel" />
        <Field label="SMS code" placeholder="6 digits" />
        <Field label="Authenticator code" placeholder="6 digits" />
        <Button type="submit" size="lg" className="h-12 w-full">Sign in</Button>
      </form>
    </div>
  );
}
