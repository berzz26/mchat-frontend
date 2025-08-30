import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import axios from "axios";

// --- 1. A single, unified interface for all server events ---
interface ServerPayload {
  type: "new_message" | "user_count_update" | "user_joined" | "user_left";
  // Optional properties since they vary by event type
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
  const [usersConnected, setUsersConnected] = useState(0); // This will now be updated correctly
  const socketRef = useRef<Socket | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<null | HTMLDivElement>(null); // Ref for auto-scroll

  const [userInfo] = useState(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const storedUser = JSON.parse(user);
        return { id: storedUser.id, name: storedUser.username || "Anonymous" };
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error);
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
      navigate('/auth');
      return;
    }
    getHistory();

    socketRef.current = io(BACKEND_URL, {
      query: { userId: userInfo.id, roomId, username: userInfo.name },
    });

    const socket = socketRef.current;

    // --- 2. A single listener to handle ALL server events ---
    socket.on("server", (payload: ServerPayload) => {
      switch (payload.type) {
        case "new_message":
          // Safety check to prevent optimistic update duplication
          if (payload.userId === userInfo.id) return;

          const newMessage: Message = {
            id: payload.id!,
            user: payload.userId!,
            name: payload.name!,
            text: payload.text!,
            sentAt: payload.sentAt!,
          };
          setMessages((prev) => [...prev, newMessage]);
          break;

        // --- 3. CORRECTED: User count is handled here! ---
        case "user_count_update":
          setUsersConnected(payload.count!);
          break;

        case "user_joined":
          // Optional: Add a system message like "User X has joined"
          console.log(`User ${payload.userId} joined the room.`);
          break;

        case "user_left":
          // Optional: Add a system message like "User X has left"
          console.log(`User ${payload.userId} left the room.`);
          break;
      }
    });

    // --- The separate, incorrect listener is now REMOVED ---

    return () => {
      socket.disconnect();
    };
  }, [userInfo.id, roomId, userInfo.name, navigate]);


  // Effect for auto-scrolling
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
      alert("Room ID copied!");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-200 p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
        <h1 className="text-xl md:text-2xl font-medium text-gray-100">
          Chat Room
        </h1>
        <div className="flex space-x-4 text-sm md:text-base text-gray-400">
          <span>UserID: {userInfo.id?.substring(0, 8)}...</span>
          <span>Online: {usersConnected}</span>
        </div>
      </div>

      {/* Messages Container */}
      {loading ? <div>Loading history...</div> : (
        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start ${m.user === userInfo.id ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-xl ${m.user === userInfo.id
                  ? "bg-gray-700 text-gray-100"
                  : "bg-gray-800 text-gray-200"
                  }`}
              >
                <b className="font-semibold">
                  {m.user === userInfo.id ? "You" : m.name}:
                </b>{" "}
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Auto-scroll target */}
        </div>
      )}

      {/* Input Section */}
      <div className="flex items-center space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-md bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all duration-200"
        />
        <button
          onClick={sendMessage}
          className="px-6 py-2 rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all duration-200"
        >
          Send
        </button>
      </div>

      {/* Room ID */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={copyRoomId}
          className="px-4 py-2 bg-gray-800 text-gray-400 rounded-md text-xs hover:text-gray-200 transition-colors duration-200"
        >
          {roomId}
          <span className="ml-2">Copy Room ID</span>
        </button>
      </div>
    </div>
  );
}

export default ChatPage;