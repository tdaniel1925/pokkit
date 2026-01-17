"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";

interface IntroStep {
  title: string;
  content: string[];
}

const INTRO_STEPS: IntroStep[] = [
  {
    title: "Hello.",
    content: [
      "You are God.",
      "And this is your universe.",
    ],
  },
  {
    title: "In this moment...",
    content: [
      "Life does not exist in this place.",
      "Nothing exists but the void—",
      "and the potential for everything.",
    ],
  },
  {
    title: "The universe follows rules.",
    content: [
      "Physics. Cause and effect.",
      "Time flows forward.",
      "What you create will have consequences.",
    ],
  },
  {
    title: "You have power, but not control.",
    content: [
      "You can whisper. You can manifest.",
      "You can bless or dim.",
      "But you cannot force.",
      "Free will is sacred here.",
    ],
  },
  {
    title: "When you speak life into being...",
    content: [
      "Those who emerge will think.",
      "They will feel. They will doubt.",
      "They will worship—or reject—you.",
      "They are not yours to command.",
    ],
  },
  {
    title: "Are you ready?",
    content: [
      "When you are ready,",
      "you will speak,",
      "and there will be light.",
    ],
  },
];

export default function IntroPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const step = INTRO_STEPS[currentStep];
  const isLastStep = currentStep === INTRO_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      // Go to the creation configuration
      router.push(`/world/${worldId}/configure`);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    router.push(`/world/${worldId}/configure`);
  };

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center p-8 cursor-pointer"
      onClick={handleNext}
    >
      <div
        className={`max-w-2xl text-center transition-opacity duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-light text-white mb-12 tracking-wide">
          {step.title}
        </h1>

        {/* Content */}
        <div className="space-y-4">
          {step.content.map((line, i) => (
            <p
              key={i}
              className="text-xl md:text-2xl text-white/80 font-light leading-relaxed"
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Progress and controls */}
      <div className="fixed bottom-8 left-0 right-0 flex flex-col items-center gap-4">
        {/* Progress dots */}
        <div className="flex gap-2">
          {INTRO_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Instructions */}
        <p className="text-white/40 text-sm">
          {isLastStep ? "Click to begin configuration" : "Click anywhere to continue"}
        </p>

        {/* Skip button */}
        {!isLastStep && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            className="text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
