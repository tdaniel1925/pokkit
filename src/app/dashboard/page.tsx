/**
 * Dashboard Page - Multi-World Hub
 * Shows user's worlds and allows navigation
 */

import { WorldList } from "@/components/world-list";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface-dark text-white">
      <header className="border-b border-green-900/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            Pokkit
          </h1>
          <p className="text-green-200/60 text-sm">Divine World Simulation</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <WorldList />
      </main>
    </div>
  );
}
