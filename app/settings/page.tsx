import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signOutAction, requestAccountDeletionAction } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Data & privacy
        </h2>
        <p className="text-sm text-muted-foreground">
          Requesting deletion will flag your account for removal. All your data will be permanently
          deleted within 30 days.
        </p>
        <form action={requestAccountDeletionAction}>
          <Button type="submit" variant="destructive">
            Delete my account
          </Button>
        </form>
      </section>
    </div>
  );
}
