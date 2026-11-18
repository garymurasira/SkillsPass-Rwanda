import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { AuthLayout } from "./AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Sign in">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/otp", search: { flow: "worker" } }); }}>
        <Field label="Phone number" type="tel" placeholder="078 000 0000" />
        <Button type="submit" size="lg" className="h-14 w-full text-lg">Send me a code</Button>
      </form>
      <p className="text-center">No account yet? <Link to="/" className="font-bold text-primary underline underline-offset-4">Register</Link></p>
    </AuthLayout>
  );
}
