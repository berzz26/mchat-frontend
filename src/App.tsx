import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/Auth";
// import HomePage from "./pages/HomePage";
// import JoinPage from "./pages/JoinPage";
// import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/chat/:roomId" element={<ChatPage />} /> */
          <Route path="/auth" element={< AuthPage />} />

        }
      </Routes>
    </Router>
  );
}

export default App;
