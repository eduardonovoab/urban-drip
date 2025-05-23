import React from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AppRoutes from './routes/AppRoutes';
import './index.css'; 

function App() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-[80vh] bg-white font-sans text-black">
        <AppRoutes />
      </main>
      <Footer />
    </>
  );
}

export default App;
