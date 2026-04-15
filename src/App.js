import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
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
import LocalMarketPage from './pages/LocalMarketPage';

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
  const isHome = pathname === '/home';
  return (
    <div className="App">
      {!isChat && <Navbar />}
      {children}
      {isHome && <Footer />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/services" element={<Services />} />
          <Route path="/restaurant/:sellerId" element={<RestaurantMenu />} />
          <Route path="/shop/:sellerId" element={<ShopPage />} />
          <Route path="/market/:sellerId" element={<LocalMarketPage />} />
          <Route path="/seller/register" element={<SellerRegister />} />
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/chat/:sellerId/:productId" element={<Chat />} />
          <Route path="/buyer/chats" element={<BuyerChats />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
