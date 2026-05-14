import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IdlePage from './pages/IdlePage';
import UnknownFingerprintPage from './pages/UnknownFingerprintPage';
import RegisterPage from './pages/RegisterPage';
import MenuPage from './pages/MenuPage';
import BorrowPage from './pages/BorrowPage';
import ScanPage from './pages/ScanPage';
import ReturnPage from './pages/ReturnPage';
import SuccessPage from './pages/SuccessPage';
import AdminPage from './pages/AdminPage';
import SimulatorPage from './pages/SimulatorPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IdlePage />} />
        <Route path="/unknown" element={<UnknownFingerprintPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/borrow" element={<BorrowPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/return" element={<ReturnPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
      </Routes>
    </Router>
  );
}

export default App;