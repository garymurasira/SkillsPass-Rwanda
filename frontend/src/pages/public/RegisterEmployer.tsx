import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { LocationSelect } from "@/components/LocationSelect";
import { AuthLayout } from "./AuthLayout";

export default function RegisterEmployer() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Register as employer">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/otp", search: { flow: "employer" } }); }}>
        <Field label="Your name" />
        <Field label="Phone number" type="tel" placeholder="078 000 0000" />
        <Field label="Company name" />
        <LocationSelect />
        <Field label="Contact info" placeholder="Email or office address" />
        <Button type="submit" size="lg" className="h-14 w-full text-lg">Send me a code</Button>
      </form>
    </AuthLayout>
  );
}
