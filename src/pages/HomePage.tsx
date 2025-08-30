// src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal"; // Import the new Modal component

interface Room {
   id: string;
   name: string;
   maxUsers?: number;
   userId: string;
   users?: string;
   creator: { username: string };
}

const HomePage: React.FC = () => {
   const navigate = useNavigate();
   const [rooms, setRooms] = useState<Room[]>([]);
   const [userRooms, setUserRooms] = useState<Room[]>([]);
   const [loading, setLoading] = useState(false);
   const BACKEND_URL = import.meta.env.VITE_API_URL;

   // State for modal visibility
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

   const [userId] = useState(() => {
      try {
         const user = localStorage.getItem("user");
         if (user) {
            const storedUser = JSON.parse(user);
            return storedUser.id;
         }
      } catch (error) {
         console.error("Failed to parse user data from localStorage:", error);
      }
      return null;
   });

   useEffect(() => {
      if (!userId) {
         navigate("/auth");
         return;
      }

      const fetchRooms = async () => {
         try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/api/room/get-rooms/${userId}`);
            if (res.data.success) {
               setRooms(res.data.message.generalRooms);
               setUserRooms(res.data.message.userRooms);
            }
         } catch (error) {
            console.error("Failed to fetch rooms", error);
         } finally {
            setLoading(false);
         }
      };

      fetchRooms();
   }, [userId, navigate, BACKEND_URL]);

   const handleCreateRoom = async (name: string) => {
      if (!userId) return;

      try {
         const res = await axios.post(`${BACKEND_URL}/api/room/create-room`, {
            userId,
            name,
         });

         if (res.data.success) {
            const roomId = res.data.message.id;
            alert("Room created successfully!");
             navigate(`/room/${roomId}`, { state: res.data.message });
            setRooms((prev) => [...prev, res.data.message]);
         }
      } catch (error) {
         console.error("Error creating room", error);
         alert("Failed to create room.");
      } finally {
         setIsCreateModalOpen(false);
      }
   };

   const handleJoinRoom = async (roomId: string) => {
      if (!userId) {
         navigate("/auth");
         return;
      }

      try {
         const res = await axios.post(
            `${BACKEND_URL}/api/room/join-room/${roomId}`,
            { userId }
         );

         if (res.data.success) {
            alert("Joined room successfully!");
            navigate(`/room/${roomId}`, { state: res.data.message });
         }
      } catch (error) {
         console.error("Error joining room", error);
         alert("Failed to join room.");
      } finally {
         setIsJoinModalOpen(false);
      }
   };

   if (!userId) {
      return null;
   }

   return (
      <div className="flex justify-center p-6 bg-black text-white min-h-screen">
         <div className="w-full max-w-2xl mx-auto flex flex-col space-y-8 rounded-3xl border border-gray-700 bg-gray-900/40 p-10 shadow-lg backdrop-blur-md">
            <h1 className="text-center font-sans text-3xl font-bold tracking-tight text-white">
               Chat Rooms
            </h1>

            {/* Action Buttons Section */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-purple-700"
               >
                  Create Room
               </button>
               <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="w-full rounded-xl bg-gray-700 py-3 font-semibold text-white transition-all duration-200 hover:bg-gray-600"
               >
                  Join Room by ID
               </button>
            </div>

            {/* My Rooms List Section */}
            <div className="space-y-6">
               <h2 className="text-xl font-semibold text-gray-200">My Rooms</h2>
               <div className="space-y-4">
                  {loading ? (
                     <p className="text-center text-gray-400">Loading rooms...</p>
                  ) : (
                     userRooms.map((room) => (
                        <li
                           key={room.id}
                           className="list-none p-4 bg-gray-800/50 rounded-xl flex justify-between items-center transition-all duration-200 hover:scale-[1.01] border border-gray-700"
                        >
                           <div>
                              <span className="block font-medium text-lg">{room.name}</span>
                              <span className="block text-xs text-gray-400">
                                 Created by {room.creator.username}
                              </span>
                           </div>
                           <button
                              onClick={() => handleJoinRoom(room.id)}
                              className="text-sm bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                           >
                              Join
                           </button>
                        </li>
                     ))
                  )}
               </div>
            </div>

            {/* General Rooms List Section */}
            <div className="space-y-6">
               <h2 className="text-xl font-semibold text-gray-200">General Rooms</h2>
               <div className="space-y-4">
                  {loading ? (
                     <p className="text-center text-gray-400">Loading rooms...</p>
                  ) : (
                     rooms.map((room) => (
                        <li
                           key={room.id}
                           className="list-none p-4 bg-gray-800/50 rounded-xl flex justify-between items-center transition-all duration-200 hover:scale-[1.01] border border-gray-700"
                        >
                           <div>
                              <span className="block font-medium text-lg">{room.name}</span>
                              <span className="block text-xs text-gray-400">
                                 Created by {room.creator.username}
                              </span>
                           </div>
                           <button
                              onClick={() => handleJoinRoom(room.id)}
                              className="text-sm bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                           >
                              Join
                           </button>
                        </li>
                     ))
                  )}
               </div>
            </div>
         </div>

         {/* Modals for creating and joining rooms */}
         <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onConfirm={handleCreateRoom}
            title="Create a New Room"
            placeholder="Enter room name"
            confirmText="Create"
            type="text"
         />
         <Modal
            isOpen={isJoinModalOpen}
            onClose={() => setIsJoinModalOpen(false)}
            onConfirm={handleJoinRoom}
            title="Join a Room"
            placeholder="Enter room ID"
            confirmText="Join"
            type="text"
         />
      </div>
   );
};

export default HomePage;