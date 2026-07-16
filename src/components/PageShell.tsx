import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { DrapeauBF } from "./DrapeauBF";
import { HamburgerMenu } from "./HamburgerMenu";

export function PageShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="bg-paper min-h-screen text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Campus<span className="text-terracotta">Link</span>
            </span>
            <DrapeauBF className="h-5 w-8" />
          </div>
        </Link>
        <HamburgerMenu />
      </header>
      <div className="kente-stripe mx-auto mt-2 h-1.5 w-full max-w-7xl rounded-full opacity-80" />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold text-foreground">{title}</h1>
        {children}
      </main>
    </div>
  );
}
