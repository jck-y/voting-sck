import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CandidatesPage from "./pages/CandidatesPage";
import "./styles/global.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
      </Routes>
    </Router>
  );
};

export default App;
