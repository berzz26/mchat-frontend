import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Room {
   id: string;
   name: string;
   maxUsers?: number;
   userId: string;
   users?: string;
   creator: any;
}

const HomePage: React.FC = () => {
   const navigate = useNavigate();
   const [rooms, setRooms] = useState<Room[]>([]);
   const [userRooms, setUserRooms] = useState<Room[]>([]);
   const [loading, setLoading] = useState(false);
   const BACKEND_URL = import.meta.env.VITE_API_URL;

   // Use a state variable for userId to make it accessible throughout the component
   // The function inside useState is a "lazy initializer" that runs only once on initial render
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
         navigate("/auth"); // Redirect if not logged in
         return;
      }

      const fetchRooms = async () => {
         try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/room/get-rooms/${userId}`);
            if (res.data.success) {
               setRooms(res.data.message.generalRooms);
               setUserRooms(res.data.message.userRooms)
            }
         } catch (error) {
            console.error("Failed to fetch rooms", error);
         } finally {
            setLoading(false);
         }
      };

      fetchRooms();
   }, [userId, navigate, BACKEND_URL]); // Add BACKEND_URL to the dependency array

   const handleCreateRoom = async () => {
      if (!userId) {
         // No need to check again, the useEffect handles redirect
         return;
      }

      const name = prompt("Enter room name:");
      if (!name) return;

      try {
         const res = await axios.post(`${BACKEND_URL}/room/create-room`, {
            userId,
            name,
         });

         if (res.data.success) {
            alert("Room created successfully!");
            setRooms((prev) => [...prev, res.data.message]);
         }
      } catch (error) {
         console.error("Error creating room", error);
         alert("Failed to create room.");
      }
   };

   const handleJoinRoom = async (roomId?: string) => {
      if (!userId) {
         navigate("/auth");
         return;
      }

      if (!roomId) {
         roomId = prompt("Enter Room ID:") || "";
         if (!roomId) return;
      }

      try {
         const res = await axios.post(
            `${BACKEND_URL}/room/join-room/${roomId}`,
            { userId } // Pass userId in the body
         );

         if (res.data.success) {
            alert("Joined room successfully!");
            navigate(`/room/${roomId}`, { state: res.data.message });
         }
      } catch (error) {
         console.error("Error joining room", error);
         alert("Failed to join room.");
      }
   };

   if (!userId) {
      return null; // Don't render anything while redirecting
   }

   return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
         <h1 className="text-3xl font-bold mb-6">Welcome to Chat Rooms</h1>

         <div className="flex gap-4 mb-6">
            <button
               onClick={handleCreateRoom}
               className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
            >
               Create Room
            </button>
            <button
               onClick={() => handleJoinRoom()}
               className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
            >
               Join Room
            </button>
         </div>

         <div className="w-full max-w-md">
            <h2 className="text-xl font-semibold mb-3 ">My Rooms</h2>
            {loading ? (
               <p>Loading rooms...</p>
            ) : (
               <ul className="space-y-2">
                  {userRooms.map((room) => (
                     <li
                        key={room.id}
                        className="p-3 bg-gray-800 rounded-lg flex justify-between items-center"
                     >
                        <div>
                           <span className="block font-medium">{room.name}</span>
                           <span className="block text-xs text-gray-400">
                              Created by {room.creator.username}
                           </span>
                        </div>
                        <button
                           onClick={() => handleJoinRoom(room.id)}
                           className="text-sm bg-blue-500 px-2 py-1 rounded hover:bg-blue-600"
                        >
                           Join
                        </button>
                     </li>
                  ))}
               </ul>
            )}
            <h2 className="text-xl font-semibold mb-3 mt-12">General Rooms</h2>
            {loading ? (
               <p>Loading rooms...</p>
            ) : (
               <ul className="space-y-2">
                  {rooms.map((room) => (
                     <li
                        key={room.id}
                        className="p-3 bg-gray-800 rounded-lg flex justify-between items-center"
                     >
                        <div>
                           <span className="block font-medium">{room.name}</span>
                           <span className="block text-xs text-gray-400">
                              Created by {room.creator.username}
                           </span>
                        </div>

                        <button
                           onClick={() => handleJoinRoom(room.id)}
                           className="text-sm bg-blue-500 px-2 py-1 rounded hover:bg-blue-600"
                        >
                           Join
                        </button>
                     </li>
                  ))}


               </ul>
            )}

         </div>
      </div>
   );
};

export default HomePage;