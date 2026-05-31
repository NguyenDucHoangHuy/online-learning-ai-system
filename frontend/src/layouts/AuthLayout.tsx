import { Outlet } from "react-router-dom";
import { BookOpen, ShieldCheck } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_32%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-950/30">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">EduSense</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                AI Learning Platform
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur sm:flex">
            <ShieldCheck size={14} className="text-blue-300" />
            Unified access for student and teacher roles
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
