import { createClient } from "@/lib/supabase/server";
import { signOutAction, requestAccountDeletionAction } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Account settings</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account</h2>
        <div className="border rounded px-4 py-3 text-sm">
          <span className="text-gray-500">Signed in as </span>
          <span className="font-medium">{user?.email}</span>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="bg-gray-900 text-white rounded px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Data & privacy
        </h2>
        <p className="text-sm text-gray-500">
          Requesting deletion will flag your account for removal. All your data will be permanently
          deleted within 30 days.
        </p>
        <form action={requestAccountDeletionAction}>
          <button
            type="submit"
            className="border border-red-300 text-red-600 hover:bg-red-50 rounded px-4 py-2 text-sm"
          >
            Delete my account
          </button>
        </form>
      </section>
    </div>
  );
}
