import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1120] p-6 text-zinc-200 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-800/80 p-2.5 shadow-inner">
              <img src="/logo.png" className="w-10 h-10 object-contain" alt="secureScan" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">secureScan</h1>
              <p className="text-sm text-zinc-500">{subtitle}</p>
            </div>
          </div>
          <Link to="/" className="text-xs font-semibold text-blue-300 hover:text-blue-200 transition-colors">
            Back to login
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-6 p-8 items-start">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500 font-bold">Authentication</p>
            <h2 className="text-3xl font-semibold text-zinc-100 mt-3 tracking-tight">{title}</h2>
            <p className="text-sm text-zinc-400 mt-3 leading-6">
              Sign in with your secureScan workspace credentials.
            </p>

            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#101828]/95 p-6 shadow-[0_24px_60px_rgba(2,6,23,0.35)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
