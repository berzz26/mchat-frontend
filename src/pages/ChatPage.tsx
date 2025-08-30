import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import axios from "axios";

interface ServerPayload {
  type: "new_message" | "user_count_update" | "user_joined" | "user_left";
  id?: string;
  userId?: string;
  name?: string;
  text?: string;
  sentAt?: string;
  count?: number;
}

interface Message {
  id: string;
  user: string;
  name: string;
  text: string;
  sentAt: string;
}

const BACKEND_URL = import.meta.env.VITE_API_URL;

function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [usersConnected, setUsersConnected] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null); // ✅ Toast state

  const [userInfo] = useState(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const storedUser = JSON.parse(user);
        return { id: storedUser.id, name: storedUser.username || "Anonymous" };
      }
    } catch {
      return { id: null, name: "Anonymous" };
    }
    return { id: null, name: "Anonymous" };
  });

  const getHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/room/get-message/${roomId}`);
      if (res.data.success) {
        const history: Message[] = res.data.message.map((m: any) => ({
          id: m.id,
          user: m.userId,
          name: m.User.username,
          text: m.text,
          sentAt: m.sentAt,
        }));
        setMessages(history);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo.id || !roomId) {
      navigate("/auth");
      return;
    }
    getHistory();

    socketRef.current = io(BACKEND_URL, {
      query: { userId: userInfo.id, roomId, username: userInfo.name },
    });

    const socket = socketRef.current;

    socket.on("server", (payload: ServerPayload) => {
      switch (payload.type) {
        case "new_message":
          if (payload.userId === userInfo.id) return;
          setMessages((prev) => [
            ...prev,
            {
              id: payload.id!,
              user: payload.userId!,
              name: payload.name!,
              text: payload.text!,
              sentAt: payload.sentAt!,
            },
          ]);
          break;
        case "user_count_update":
          setUsersConnected(payload.count!);
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userInfo.id, roomId, userInfo.name, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const socket = socketRef.current;
    if (!input.trim() || !socket || !userInfo.id || !roomId) return;

    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      user: userInfo.id,
      name: userInfo.name,
      text: input,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    socket.emit("client", {
      type: "send_message",
      roomId,
      userId: userInfo.id,
      text: input,
    });

    setInput("");
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setToast("Room ID copied ✅");
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100 p-6 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-4 right-4 bg-gray-800 text-gray-200 px-4 py-2 rounded-lg shadow-md text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
        <h1 className="text-lg md:text-xl font-medium text-gray-200">
          Chat Room
        </h1>
        <div className="flex space-x-4 text-xs md:text-sm text-gray-400">
          
          <span>🟢 Members Online: {usersConnected}</span>
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Loading chat…
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.user === userInfo.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm ${m.user === userInfo.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-200"
                  }`}
              >
                <span className="text-sm font-semibold">
                  {m.user === userInfo.id ? "You" : m.name}:
                </span>{" "}
                <span className="text-sm">{m.text}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

      )}

      {/* Input */}
      <div className="flex items-center space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all duration-200"
        />
        <button
          onClick={sendMessage}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          Send
        </button>
      </div>

      {/* Room ID */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={copyRoomId}
          className="px-4 py-2 bg-gray-900 text-gray-400 rounded-md text-xs hover:text-white transition"
        >
          {roomId} <span className="ml-2">copy</span>
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
