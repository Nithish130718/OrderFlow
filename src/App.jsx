import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Notifications from './pages/Notifications';
import Services from './pages/Services';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Navbar />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/services" element={<Services />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
