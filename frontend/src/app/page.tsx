"use client";

import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  };

  useEffect(() => {
    const handleResponse = (response: string) => {
      const botMessage: Message = { role: "bot", content: response };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    };
    socket.on("response", handleResponse);
    return () => {
      socket.off("response", handleResponse);
    };
  }, []);

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

        {messages.length === 0 && (
          <div className="w-full opacity-80 text-center py-6 bg-gradient-to-r from-cyan-700 text-white text-3xl font-extrabold tracking-wider drop-shadow-lg animate-fade-in">
            Ask me anything about Tunisian Constitution!
          </div>
        )}
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
                    : "bg-pink-900 text-gray-100"
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
        <div className="p-4 border-t border-gray-700 flex flex-col gap-2 bg-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm font-semibold text-cyan-300 tracking-wide mr-2" htmlFor="constitution-select">
              Constitution:
            </label>
            <Select value={constitution} onValueChange={setConstitution}>
              <SelectTrigger id="constitution-select" className="w-56 bg-gray-700 border-cyan-700 text-cyan-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-cyan-700 text-cyan-200">
                <SelectItem value="2014">2014 Constitution</SelectItem>
                <SelectItem value="1959">1959 Constitution</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 items-end">
            <textarea
              className="flex-1 p-3 rounded-xl bg-gray-700 text-white resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400 border border-cyan-700"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask a question..."
            />
            <button
              onClick={handleSend}
              className="px-4 py-3 bg-gradient-to-br from-cyan-700 to-cyan-900 rounded-full hover:from-cyan-600 hover:to-cyan-800 shadow-lg transition flex items-center justify-center"
              aria-label="Send"
            >
              <Send />
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
  );
}
