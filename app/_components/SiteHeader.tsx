import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="px-6 py-4 border-b">
      <Link href="/pile">
        <Image
          src="/grey-pile-of-shame-logo.png"
          alt="Grey Pile of Shame"
          width={2816}
          height={1536}
          className="h-10 w-auto"
          priority
        />
      </Link>
    </header>
  );
}
