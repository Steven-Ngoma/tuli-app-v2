import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import TuliLogo from './components/TuliLogo';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Units from './components/Units';
import HowItWorks from './components/HowItWorks';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Marketplace from './pages/Marketplace';
import SellerRegister from './pages/seller/SellerRegister';
import SellerLogin from './pages/seller/SellerLogin';
import SellerDashboard from './pages/seller/SellerDashboard';
import Chat from './pages/Chat';
import BuyerChats from './pages/BuyerChats';
import Services from './pages/Services';
import RestaurantMenu from './pages/RestaurantMenu';
import ShopPage from './pages/ShopPage';
import DriverRegister from './pages/driver/DriverRegister';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/chat')) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
};

const HomePage = () => {
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.hash && target.hash.startsWith('#') && target.origin === window.location.origin) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <>
      <Hero />
      <Units />
      <HowItWorks />
      <Contact />
    </>
  );
};

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isChat = pathname.startsWith('/chat');
  const isHome = pathname === '/';
  return (
    <div className="App">
      {!isChat && <Navbar />}
      {children}
      {isHome && <Footer />}
    </div>
  );
};

function App() {
  const [splash, setSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1800);
    const t2 = setTimeout(() => setSplash(false), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (splash) return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#1B4332',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.6s ease',
      zIndex: 9999
    }}>
      <TuliLogo size={80} />
      <span style={{
        fontSize: '2.8rem', fontWeight: 800,
        background: 'linear-gradient(135deg, #F39C12, #FFB347)',
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        color: 'transparent', letterSpacing: '-0.5px'
      }}>TULI</span>
    </div>
  );

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/services" element={<Services />} />
          <Route path="/restaurant/:sellerId" element={<RestaurantMenu />} />
          <Route path="/shop/:sellerId" element={<ShopPage />} />
          <Route path="/seller/register" element={<SellerRegister />} />
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/chat/:sellerId/:productId" element={<Chat />} />
          <Route path="/buyer/chats" element={<BuyerChats />} />
          <Route path="/driver/register" element={<DriverRegister />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
