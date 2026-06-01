import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/settings/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="px-6 py-4 border-b flex items-center justify-between gap-4">
      <Link href="/pile">
        <Image
          src="/grey-pile-of-shame.png"
          alt="Grey Pile of Shame"
          width={2816}
          height={1536}
          className="h-10 w-auto"
          priority
        />
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/pile" className="text-gray-600 hover:text-gray-900">
          Pile
        </Link>
        <Link href="/collection" className="text-gray-600 hover:text-gray-900">
          Collection
        </Link>
        {user && (
          <form action={signOutAction}>
            <button type="submit" className="text-gray-500 hover:text-gray-800">
              Log out
            </button>
          </form>
        )}
      </nav>
    </header>
  );
}
