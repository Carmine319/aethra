import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container page-bg not-found-shell">
      <div className="wrap section-inner not-found-inner">
        <p className="section-kicker">404</p>
        <h1 className="section-title not-found-title">Page not found</h1>
        <p className="editorial-intro not-found-lede">
          The requested path does not exist or has moved.
        </p>
        <Link className="btn btn-primary" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
