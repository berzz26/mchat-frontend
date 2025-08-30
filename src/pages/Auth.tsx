import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AuthPage() {
    const [username, setUsername] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [loading, setLoading] = useState(false);
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
            const endpoint = isNewUser ? `${BACKEND_URL}/api/auth/signup` : `${BACKEND_URL}/api/auth/login`;
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
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
            <div className="relative z-10 flex w-full max-w-md flex-col space-y-6 rounded-3xl border border-gray-700 bg-gray-900/40 p-10 shadow-lg backdrop-blur-md">
                <h1 className="text-center font-sans text-3xl font-bold tracking-tight text-white">
                    Mchat
                </h1>
                <p className="text-center text-gray-400">
                    Sign in or create an account
                </p>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-5 py-3 text-white placeholder-gray-500 outline-none transition-colors duration-200 focus:border-purple-500"
                    />

                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={isNewUser}
                            onChange={() => setIsNewUser((prev) => !prev)}
                            className="h-5 w-5 rounded-md border-gray-700 bg-gray-800/50 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-400">Create a new account?</span>
                    </label>
                </div>

                <button
                    onClick={handleAuth}
                    disabled={loading}
                    className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                    {loading ? "Please wait..." : isNewUser ? "Sign Up" : "Login"}
                </button>

                {error && (
                    <p className="mt-4 text-center text-sm text-red-400">{error}</p>
                )}
            </div>

            {/* A subtle background animation for a "cool" effect */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute left-1/4 top-1/4 h-72 w-72 animate-blob rounded-full bg-purple-500 opacity-30 mix-blend-screen filter blur-3xl" />
                <div className="absolute right-1/4 bottom-1/4 h-72 w-72 animate-blob rounded-full bg-pink-500 animation-delay-2000 opacity-30 mix-blend-screen filter blur-3xl" />
                <div className="absolute left-1/2 bottom-1/2 h-72 w-72 animate-blob rounded-full bg-blue-500 animation-delay-4000 opacity-30 mix-blend-screen filter blur-3xl" />
            </div>
        </div>
    );
}

export default AuthPage;