import type { ReactNode } from "react";
import { SITE_ROUTES, type SiteRoute } from "../lib/site-navigation";

export function SiteHeader({
  activeRoute,
  home = false,
  children,
}: Readonly<{
  activeRoute: SiteRoute;
  home?: boolean;
  children?: ReactNode;
}>) {
  return (
    <header className="site-header">
      <a
        className="brand"
        href={home ? "#top" : "/"}
        aria-label="Astro Engine home"
      >
        <span className="brand-mark" aria-hidden="true">
          ✣
        </span>
        <span>Astro Engine</span>
      </a>
      <nav className="primary-nav" aria-label="Primary navigation">
        {SITE_ROUTES.map((route) => (
          <a
            key={route.key}
            href={home && route.key === "sky" ? "#sky" : route.href}
            aria-current={activeRoute === route.key ? "page" : undefined}
          >
            <span className="nav-label-desktop">{route.desktopLabel}</span>
            <span className="nav-label-mobile">{route.mobileLabel}</span>
          </a>
        ))}
        {children}
      </nav>
      <a className="github-link" href="https://github.com/nivaaz/astro-engine">
        GitHub <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}
