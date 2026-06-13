import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

async function credentialsSignIn(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/notes"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/sign-in?error=CredentialsSignin");
    }
    throw error;
  }
}

async function oauthSignIn(provider: "github" | "google") {
  "use server";
  await signIn(provider, { redirectTo: "/notes" });
}

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to DevNotes</CardTitle>
          <CardDescription>
            Markdown-first, code-aware notes for developers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <form action={oauthSignIn.bind(null, "github")}>
              <Button type="submit" variant="outline" className="w-full">
                Continue with GitHub
              </Button>
            </form>
            <form action={oauthSignIn.bind(null, "google")}>
              <Button type="submit" variant="outline" className="w-full">
                Continue with Google
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <Separator className="flex-1" />
          </div>

          <form action={credentialsSignIn} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && (
              <p className="text-destructive text-sm">
                Invalid email or password.
              </p>
            )}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">
          By continuing you agree to the Terms and Privacy Policy.
        </CardFooter>
      </Card>
    </div>
  );
}
