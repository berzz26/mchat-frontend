import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AuthPage() {
    const [username, setUsername] = useState<string>("");
    const [isNewUser, setIsNewUser] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_API_URL;


    const handleAuth = async () => {
        if (!username.trim()) {
            setError("Username is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const endpoint = isNewUser ? `${BACKEND_URL}/auth/signup` : `${BACKEND_URL}/auth/login`;
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Something went wrong");
                setLoading(false);
                return;
            }

            localStorage.setItem("user", JSON.stringify(data.message));
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Server error, try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
            <div className="flex flex-col space-y-4 w-80 p-6 rounded-xl bg-gray-900 shadow-lg">
                <h1 className="text-2xl font-bold text-center">Welcome To Mchat</h1>

                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="px-4 py-2 rounded-lg text-white border-white"
                />

                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={isNewUser}
                        onChange={() => setIsNewUser((prev) => !prev)}
                    />
                    <span>Create new user?</span>
                </label>

                <button
                    onClick={handleAuth}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-600 disabled:opacity-50"
                >
                    {loading ? "Please wait..." : isNewUser ? "Sign Up" : "Login"}
                </button>

                {error && <p className="text-red-400 text-center">{error}</p>}
            </div>
        </div>
    );
}

export default AuthPage;
