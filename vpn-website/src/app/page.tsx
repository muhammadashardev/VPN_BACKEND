import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        <Dashboard />
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
        <span>Encrypted Tunnel v2.4.0</span>
        <span className="h-1 w-1 bg-zinc-800 rounded-full" />
        <span>Secure Protocol Active</span>
        <span className="h-1 w-1 bg-zinc-800 rounded-full" />
        <span>Military Grade AES-256</span>
      </div>
    </main>
  );
}
