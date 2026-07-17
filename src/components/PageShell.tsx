import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-paper min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link to="/" className="btn-bf-outline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <div className="kente-stripe mb-8 h-1.5 w-24 rounded-full" />
        <h1 className="mb-8 text-4xl font-bold text-gradient-bf">{title}</h1>
        <div className="card-glass rounded-2xl p-8 text-base leading-relaxed text-foreground/80">
          {children}
        </div>
      </div>
    </div>
  );
}
