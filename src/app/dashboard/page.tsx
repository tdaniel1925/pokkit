/**
 * Dashboard Page - Multi-World Hub
 * Shows user's worlds and allows navigation
 */

import { WorldList } from "@/components/world-list";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Pokkit
          </h1>
          <p className="text-gray-400 text-sm">Divine World Simulation</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <WorldList />
      </main>
    </div>
  );
}
