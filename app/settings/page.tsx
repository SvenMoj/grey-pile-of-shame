import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signOutAction, requestAccountDeletionAction } from "./actions";
import PasswordForm from "./PasswordForm";
import InstagramHandleForm from "./InstagramHandleForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("instagram_handle").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Account settings</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Account
        </h2>
        <Card>
          <CardContent className="pt-6 text-sm">
            <span className="text-muted-foreground">Signed in as </span>
            <span className="font-medium">{user?.email}</span>
          </CardContent>
        </Card>
        <form action={signOutAction}>
          <Button type="submit">Sign out</Button>
        </form>
      </section>

      <PasswordForm hasPassword={!!user?.user_metadata?.has_password} />

      <InstagramHandleForm currentHandle={profile?.instagram_handle ?? null} />

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Data & privacy
        </h2>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Requesting deletion will flag your account for removal. All your data will be
              permanently deleted within 30 days.
            </p>
            <form action={requestAccountDeletionAction}>
              <Button type="submit" variant="destructive">
                Delete my account
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
