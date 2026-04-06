"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/ideas", label: "Ideas" },
  { href: "/business", label: "Business" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function SiteNav() {
  const pathname = usePathname() || "";

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-nav-brand" href="/">
          AETHRA
        </Link>
        <nav className="site-nav-links" aria-label="Primary">
          {links.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/" || pathname === ""
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>
        <span className="site-nav-status" aria-live="polite">
          ACTIVE
        </span>
      </div>
    </header>
  );
}
