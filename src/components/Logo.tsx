import { GraduationCap } from "lucide-react";

export function Logo({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-elegant)] ${className}`}
    >
      <GraduationCap className="h-6 w-6" />
    </span>
  );
}
