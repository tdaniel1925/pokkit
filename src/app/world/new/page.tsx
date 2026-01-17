"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NewWorldPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [config, setConfig] = useState({
    name: "",
    populationSize: 25,
    culturalEntropy: 0.5,
    beliefPlasticity: 0.5,
    crisisFrequency: 0.3,
    authoritySkepticismIndex: 0.5,
  });

  const handleCreate = async () => {
    if (!config.name.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/world", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        const { worldId } = await res.json();
        router.push(`/world/${worldId}`);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create world");
      }
    } catch (error) {
      console.error("Failed to create world:", error);
      alert("Failed to create world");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Create New World</h1>
        </div>

        {/* Form */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              World Name
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="e.g., Genesis, Eden, Nova..."
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-divine-500"
              maxLength={100}
            />
          </div>

          {/* Population */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Population Size: {config.populationSize}
            </label>
            <input
              type="range"
              min={5}
              max={100}
              value={config.populationSize}
              onChange={(e) =>
                setConfig({ ...config, populationSize: parseInt(e.target.value) })
              }
              className="w-full accent-divine-500"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>5 (intimate)</span>
              <span>100 (society)</span>
            </div>
          </div>

          {/* Cultural Entropy */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Cultural Entropy: {(config.culturalEntropy * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={config.culturalEntropy * 100}
              onChange={(e) =>
                setConfig({ ...config, culturalEntropy: parseInt(e.target.value) / 100 })
              }
              className="w-full accent-divine-500"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Homogeneous</span>
              <span>Chaotic</span>
            </div>
          </div>

          {/* Belief Plasticity */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Belief Plasticity: {(config.beliefPlasticity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={config.beliefPlasticity * 100}
              onChange={(e) =>
                setConfig({ ...config, beliefPlasticity: parseInt(e.target.value) / 100 })
              }
              className="w-full accent-divine-500"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Rigid beliefs</span>
              <span>Fluid beliefs</span>
            </div>
          </div>

          {/* Authority Skepticism */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Authority Skepticism: {(config.authoritySkepticismIndex * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={config.authoritySkepticismIndex * 100}
              onChange={(e) =>
                setConfig({
                  ...config,
                  authoritySkepticismIndex: parseInt(e.target.value) / 100,
                })
              }
              className="w-full accent-divine-500"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Trusting</span>
              <span>Skeptical</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-neutral-800/50 rounded-lg p-4 text-sm text-neutral-400">
            <p>
              <strong className="text-neutral-200">Remember:</strong> You are not
              creating subjects to control. You are seeding a world of autonomous
              beings who will evolve beyond your initial design.
            </p>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!config.name.trim() || isCreating}
            className="w-full flex items-center justify-center gap-2 bg-divine-600 hover:bg-divine-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            {isCreating ? "Creating..." : "Create World"}
          </button>
        </div>
      </div>
    </div>
  );
}
