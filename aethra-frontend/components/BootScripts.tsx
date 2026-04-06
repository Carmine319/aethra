"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export default function BootScripts() {
  const path = usePathname() || "";
  const isHome = path === "/" || path === "";

  return (
    <>
      <Script src="/aethra-modules/components/card.js" strategy="afterInteractive" />
      <Script src="/aethra-modules/components/button.js" strategy="afterInteractive" />
      {isHome ? (
        <>
          <Script
            src="/aethra-modules/app/main.js"
            type="module"
            strategy="afterInteractive"
          />
          <Script
            src="/aethra-modules/unified-system.js"
            strategy="afterInteractive"
          />
          <Script src="/aethra-modules/ageGate.js" strategy="afterInteractive" />
        </>
      ) : null}
    </>
  );
}
