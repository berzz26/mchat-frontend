import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/Auth";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <Router>
      <Routes>
        {<Route path="/" element={<HomePage />} />}
       
        <Route path="/room/:roomId" element={<ChatPage />} />  
        <Route path="/auth" element={< AuthPage />} />
        


      </Routes>
    </Router>
  );
}

export default App;
