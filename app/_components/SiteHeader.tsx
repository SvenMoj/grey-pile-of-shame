import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
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
      </nav>
    </header>
  );
}
