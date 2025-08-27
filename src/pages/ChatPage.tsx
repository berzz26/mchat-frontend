import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";

// --- 1. Updated Message Interface ---
// Matches the rich data object sent by the backend.
interface Message {
  id: string; // Unique ID for React key
  user: string; // The userId of the sender
  name: string; // The display name of the sender
  text: string;
  sentAt: string; // ISO date string
}

// Server now sends typed messages, so we handle the payload.
interface ServerMessagePayload {
  type: "new_message";
  id: string;
  roomId: string;
  userId: string;
  name: string;
  text: string;
  sentAt: string;
}

const BACKEND_URL = `http://localhost:3000`;

function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [usersConnected, setUsersConnected] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // --- 2. Retrieve Full User Info ---
  // Assumes localStorage stores an object with 'id' and 'username'.
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

  useEffect(() => {
    if (!userInfo.id || !roomId) return;

    // Use a ref to store the socket instance
    socketRef.current = io(BACKEND_URL, {
      query: { userId: userInfo.id, roomId },
    });

    const socket = socketRef.current;

    // --- 3. Handle Specific Message Types ---
    // The server-side fix means we no longer need to check if the message is our own.
    // This listener will only receive messages from other users.
    socket.on("server", (payload: ServerMessagePayload) => {
      if (payload.type === "new_message") {
        const newMessage: Message = {
          id: payload.id,
          user: payload.userId,
          name: payload.name,
          text: payload.text,
          sentAt: payload.sentAt,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    socket.on("user_count_update", (count: number) => {
      setUsersConnected(count);
    });

    return () => {
      socket.disconnect();
    };
  }, [userInfo.id, roomId]);

  const sendMessage = () => {
    const socket = socketRef.current;
    if (!input.trim() || !socket || !userInfo.id || !roomId) return;

    // --- 4. Improved Optimistic Update ---
    // Create a temporary message that matches the new interface.
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`, // Temporary unique ID
      user: userInfo.id,
      name: userInfo.name, // Display "You" logic is handled in JSX
      text: input,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    // Send the message to the server
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
          <span>UserID: {userInfo.id}</span>
          <span>Users: {usersConnected}</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
        {messages.map((m) => (
          <div
            // --- 5. Use Unique ID for Key ---
            key={m.id}
            className={`flex items-start ${
              m.user === userInfo.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-xl ${
                m.user === userInfo.id
                  ? "bg-gray-700 text-gray-100"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              <b className="font-semibold">
                {/* --- 6. Display User's Name --- */}
                {m.user === userInfo.id ? "You" : m.name}:
              </b>{" "}
              {m.text}
            </div>
          </div>
        ))}
      </div>

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