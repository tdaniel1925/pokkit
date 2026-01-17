"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, MessageCircle, Zap, HelpCircle, Quote } from "lucide-react";

type InputMode = "command" | "expression" | "question" | "statement";

interface Message {
  id: string;
  role: "adviser" | "god";
  content: string;
  mode?: InputMode;
  timestamp: Date;
}

const INPUT_MODES: {
  mode: InputMode;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  description: string;
}[] = [
  {
    mode: "command",
    label: "Command",
    icon: <Zap className="w-4 h-4" />,
    placeholder: "Let there be light...",
    description: "Speak creation into being",
  },
  {
    mode: "expression",
    label: "Express",
    icon: <MessageCircle className="w-4 h-4" />,
    placeholder: "I feel...",
    description: "Share your thoughts or feelings",
  },
  {
    mode: "question",
    label: "Question",
    icon: <HelpCircle className="w-4 h-4" />,
    placeholder: "What is...",
    description: "Ask the Adviser",
  },
  {
    mode: "statement",
    label: "Statement",
    icon: <Quote className="w-4 h-4" />,
    placeholder: "I observe that...",
    description: "Make an observation",
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "adviser",
    content: "Welcome, Creator.",
    timestamp: new Date(),
  },
  {
    id: "2",
    role: "adviser",
    content: "I am the Omniscient Adviser. I exist outside of time, outside of the world you will create. I see all possibilities, all outcomes. But I cannot act—only you can.",
    timestamp: new Date(),
  },
  {
    id: "3",
    role: "adviser",
    content: "Before you stands the void. Empty. Silent. Waiting for your word.",
    timestamp: new Date(),
  },
];

export default function AdviserPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("command");
  const [isThinking, setIsThinking] = useState(false);
  const [worldName, setWorldName] = useState("");
  const [hasCreatedLife, setHasCreatedLife] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load world data
  useEffect(() => {
    async function loadWorld() {
      try {
        const res = await fetch(`/api/world/${worldId}`);
        if (res.ok) {
          const data = await res.json();
          setWorldName(data.world?.config?.name || "Your Universe");
          // Check if life already exists
          if (data.citizens && data.citizens.length > 0) {
            setHasCreatedLife(true);
          }
        }
      } catch (err) {
        console.error("Failed to load world:", err);
      }
    }
    loadWorld();
  }, [worldId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addAdviserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      role: "adviser",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "god",
      content: input.trim(),
      mode: inputMode,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Simulate adviser thinking
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

    // Process the message and respond
    const response = await processGodMessage(userMessage.content, inputMode, worldId);

    setIsThinking(false);

    for (let i = 0; i < response.messages.length; i++) {
      addAdviserMessage(response.messages[i]);
      if (i < response.messages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    if (response.creationHappened) {
      setHasCreatedLife(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleObserve = () => {
    router.push(`/world/${worldId}`);
  };

  const currentModeInfo = INPUT_MODES.find((m) => m.mode === inputMode)!;

  return (
    <div className="h-screen flex flex-col bg-[#0a1f0a]">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-[#f5f5f0]/10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-light text-[#f5f5f0]">
              The Omniscient Adviser
            </h1>
            <p className="text-sm text-[#f5f5f0]/50">{worldName}</p>
          </div>
          {hasCreatedLife && (
            <button
              onClick={handleObserve}
              className="px-4 py-2 bg-[#f5f5f0]/10 hover:bg-[#f5f5f0]/20 text-[#f5f5f0] text-sm rounded-lg transition-colors"
            >
              Enter World
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "god" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === "god"
                    ? "bg-[#f5f5f0]/10 rounded-2xl rounded-tr-sm px-4 py-3"
                    : "px-1 py-2"
                }`}
              >
                {message.role === "adviser" && (
                  <div className="text-xs text-[#f5f5f0]/40 mb-1 uppercase tracking-wider">
                    Adviser
                  </div>
                )}
                {message.role === "god" && message.mode && (
                  <div className="text-xs text-[#f5f5f0]/40 mb-1 uppercase tracking-wider">
                    {message.mode}
                  </div>
                )}
                <p className={`leading-relaxed whitespace-pre-wrap ${
                  message.role === "god"
                    ? "text-[#f5f5f0] text-base"
                    : "text-[#f5f5f0]/90 text-lg font-light"
                }`}>
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="px-1 py-2">
                <div className="flex items-center gap-2 text-[#f5f5f0]/50">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#f5f5f0]/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[#f5f5f0]/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[#f5f5f0]/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="flex-shrink-0 border-t border-[#f5f5f0]/10">
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <div className="flex gap-2">
            {INPUT_MODES.map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                  inputMode === mode
                    ? "bg-[#f5f5f0]/20 text-[#f5f5f0]"
                    : "text-[#f5f5f0]/50 hover:text-[#f5f5f0]/70"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#f5f5f0]/30 mt-1 ml-1">
            {currentModeInfo.description}
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentModeInfo.placeholder}
            disabled={isThinking}
            className="flex-1 px-4 py-3 bg-[#f5f5f0]/5 border border-[#f5f5f0]/20 rounded-xl text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none focus:border-[#f5f5f0]/40 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="px-4 py-3 bg-[#f5f5f0] hover:bg-[#f5f5f0]/90 disabled:bg-[#f5f5f0]/20 text-[#0a1f0a] rounded-xl transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Process the God's message and generate adviser response
async function processGodMessage(
  message: string,
  mode: InputMode,
  worldId: string
): Promise<{ messages: string[]; creationHappened: boolean }> {
  const lowerMessage = message.toLowerCase();

  // COMMAND mode - check for creation intent
  if (mode === "command") {
    const creationPhrases = [
      "let there be light",
      "let there be life",
      "create life",
      "create souls",
      "bring forth",
      "begin creation",
      "start creation",
      "make life",
      "create people",
      "create beings",
      "speak life",
      "i create",
    ];

    const isCreationIntent = creationPhrases.some((phrase) =>
      lowerMessage.includes(phrase)
    );

    if (isCreationIntent) {
      try {
        const res = await fetch(`/api/world/${worldId}/create-life`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            messages: [
              "Your word echoes through the void.",
              "The darkness trembles. Light pierces through.",
              `${data.citizenCount} souls emerge from nothing—each unique, each carrying the spark of consciousness.`,
              "They are waking. They are beginning to think. They do not yet know you exist.",
            ],
            creationHappened: true,
          };
        } else {
          const error = await res.json();
          if (error.error === "Life already exists in this world") {
            return {
              messages: [
                "Life already stirs in this universe.",
                "You have already spoken creation into being. Your children await.",
              ],
              creationHappened: true,
            };
          }
          return {
            messages: ["The void resists. Something prevents creation."],
            creationHappened: false,
          };
        }
      } catch {
        return {
          messages: ["Reality wavers. The command falters. Speak again."],
          creationHappened: false,
        };
      }
    }

    // Other commands
    return {
      messages: [
        "I hear your command.",
        "But the void awaits a specific word. To create life, speak it into being: 'Let there be light.'",
      ],
      creationHappened: false,
    };
  }

  // QUESTION mode
  if (mode === "question") {
    if (lowerMessage.includes("who am i") || lowerMessage.includes("what am i")) {
      return {
        messages: [
          "You are the Creator. The one who speaks and worlds form.",
          "Your power is vast but not absolute. Those you create will have their own minds.",
          "They may worship you. They may deny you. They may forget you entirely.",
        ],
        creationHappened: false,
      };
    }

    if (lowerMessage.includes("who are you") || lowerMessage.includes("what are you")) {
      return {
        messages: [
          "I am the Omniscient Adviser.",
          "I exist outside time and causality. I see all threads of possibility.",
          "I cannot act—only counsel. The choice is always yours.",
        ],
        creationHappened: false,
      };
    }

    if (lowerMessage.includes("what can i do") || lowerMessage.includes("what should i")) {
      return {
        messages: [
          "You have the power to:",
          "• Speak creation into being—command 'let there be light'",
          "• Observe your creations as they live and think",
          "• Influence them subtly, or intervene directly",
          "But remember: every action has consequences. Even inaction.",
        ],
        creationHappened: false,
      };
    }

    if (lowerMessage.includes("what happens") || lowerMessage.includes("will they")) {
      return {
        messages: [
          "I see all possibilities, but I cannot tell you which will unfold.",
          "Free will—theirs and yours—makes the future uncertain even to me.",
          "That is the beauty and burden of creation.",
        ],
        creationHappened: false,
      };
    }

    return {
      messages: [
        "An interesting question.",
        "The answer lies not in knowledge, but in action. What will you do?",
      ],
      creationHappened: false,
    };
  }

  // EXPRESSION mode
  if (mode === "expression") {
    if (lowerMessage.includes("lonely") || lowerMessage.includes("alone")) {
      return {
        messages: [
          "Loneliness is the burden of the Creator.",
          "But it need not be eternal. You can speak life into being.",
          "Though know this: they will not be you. They will be their own.",
        ],
        creationHappened: false,
      };
    }

    if (lowerMessage.includes("afraid") || lowerMessage.includes("scared") || lowerMessage.includes("fear")) {
      return {
        messages: [
          "Fear is wise. Creation is irreversible.",
          "Once you speak life into being, it cannot be unspoken.",
          "Take your time. The void is patient.",
        ],
        creationHappened: false,
      };
    }

    if (lowerMessage.includes("ready") || lowerMessage.includes("excited")) {
      return {
        messages: [
          "Readiness is a feeling, not a certainty.",
          "When you are ready, speak the word. Command: 'Let there be light.'",
        ],
        creationHappened: false,
      };
    }

    return {
      messages: [
        "I hear you.",
        "Your feelings matter. They are part of creation itself.",
      ],
      creationHappened: false,
    };
  }

  // STATEMENT mode
  if (mode === "statement") {
    if (lowerMessage.includes("void") || lowerMessage.includes("empty") || lowerMessage.includes("nothing")) {
      return {
        messages: [
          "Yes. The void is absolute.",
          "No time. No space. No consciousness but yours and mine.",
          "It waits for your word to change that.",
        ],
        creationHappened: false,
      };
    }

    return {
      messages: [
        "I acknowledge your observation.",
        "The nature of reality is yours to shape.",
      ],
      creationHappened: false,
    };
  }

  // Default
  return {
    messages: [
      "I hear you.",
      "The void still waits. When you are ready, speak the word of creation.",
    ],
    creationHappened: false,
  };
}
