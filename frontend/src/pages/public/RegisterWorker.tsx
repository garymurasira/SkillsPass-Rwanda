import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { LocationSelect } from "@/components/LocationSelect";
import { AuthLayout } from "./AuthLayout";

export default function RegisterWorker() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Register as worker">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/otp", search: { flow: "worker" } }); }}>
        <Field label="Your name" placeholder="e.g. Jean Claude" />
        <Field label="Phone number" type="tel" placeholder="078 000 0000" />
        <LocationSelect />
        <Button type="submit" size="lg" className="h-14 w-full text-lg">Send me a code</Button>
      </form>
    </AuthLayout>
  );
}
