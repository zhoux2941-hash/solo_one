import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { Orders } from "@/pages/Orders";
import { Profile } from "@/pages/Profile";
import { useAppStore } from "@/store";

export default function App() {
  const releaseExpiredOrders = useAppStore(state => state.releaseExpiredOrders);
  
  useEffect(() => {
    const checkInterval = setInterval(() => {
      releaseExpiredOrders();
    }, 10000);
    
    releaseExpiredOrders();
    
    return () => clearInterval(checkInterval);
  }, [releaseExpiredOrders]);
  
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}
