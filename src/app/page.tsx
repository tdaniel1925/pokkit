import Link from "next/link";
import { Eye, Sparkles, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            POKKIT
          </h1>
          <p className="text-xl text-neutral-400">
            Private World Simulation Platform
          </p>
        </div>

        {/* Philosophy */}
        <div className="bg-neutral-900/50 rounded-lg p-6 border border-neutral-800">
          <p className="text-neutral-300 leading-relaxed">
            Inhabit a constrained God role within a society of autonomous AI citizens.
            Observe, influence, whisper—but never control. Every action has consequences.
            Safety and consent are not features; they are the foundation.
          </p>
        </div>

        {/* Core principles */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-900/30 rounded-lg p-4 border border-neutral-800">
            <Eye className="w-8 h-8 text-divine-400 mx-auto mb-2" />
            <h3 className="font-medium text-white">Observe</h3>
            <p className="text-sm text-neutral-500">Watch without controlling</p>
          </div>
          <div className="bg-neutral-900/30 rounded-lg p-4 border border-neutral-800">
            <Sparkles className="w-8 h-8 text-divine-400 mx-auto mb-2" />
            <h3 className="font-medium text-white">Influence</h3>
            <p className="text-sm text-neutral-500">Subtle guidance only</p>
          </div>
          <div className="bg-neutral-900/30 rounded-lg p-4 border border-neutral-800">
            <Shield className="w-8 h-8 text-divine-400 mx-auto mb-2" />
            <h3 className="font-medium text-white">Protect</h3>
            <p className="text-sm text-neutral-500">Safety is non-negotiable</p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Link
            href="/world/new"
            className="inline-flex items-center gap-2 bg-divine-600 hover:bg-divine-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your World
          </Link>
          <p className="text-sm text-neutral-500">
            Each world is private, isolated, and sovereign.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 text-center text-sm text-neutral-600">
        <p>Built with ethical AI principles. Safety overrides narrative.</p>
      </footer>
    </main>
  );
}
