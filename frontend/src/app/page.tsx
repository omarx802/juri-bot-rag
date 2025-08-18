"use client";

import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import { Send } from "lucide-react";
import DarkVeil from "@/components/DarkVeil/DarkVeil";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [constitution, setConstitution] = useState("2014");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsTyping(true);

    socket.emit("query", query, constitution);

    socket.on("response", (response: string) => {
      const botMessage: Message = { role: "bot", content: response };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
  <main className="relative w-full min-h-screen overflow-hidden">
    <div className="fixed inset-0 -z-10">
      <DarkVeil/>
    </div>
    <div className="flex flex-col h-screen items-center justify-center bg-transparent text-white p-4">
      <div className="flex flex-col w-full max-w-xl h-full bg-gray-900 opacity-85 rounded-2xl shadow-lg overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-xl p-2 max-w-[70%] shadow-md ${
                  msg.role === "user"
                    ? "bg-gray-600 text-white"
                    : "bg-cyan-700 text-gray-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-xl p-4 max-w-[70%] bg-gray-700 text-gray-100 shadow-md animate-pulse">
                Typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3 bg-gray-800">
          <textarea
            className="flex-1 p-3 rounded-xl bg-gray-700 text-white resize-none focus:outline-none placeholder-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question..."
          />
          <button
            onClick={handleSend}
            className="px-4 py-3 bg-cyan-700 rounded-full hover:bg-cyan-900 transition"
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  </main>
  );
}
