import React from 'react';
import { AuthProvider } from './context/AuthContext'; // Asegúrate de importar el AuthProvider
import { CarritoProvider  } from './context/CarritoContext.jsx';  // Importa el CarritoProvider
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AppRoutes from './routes/AppRoutes';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  return (
    <AuthProvider>  {/* Envuelve tu app con el AuthProvider */}
      <CarritoProvider> {/* Envuelve tu app con el CarritoProvider */}
        <Navbar />
        <main className="pt-20 min-h-[80vh] bg-white font-sans text-black">
          <AppRoutes />
        </main>
        <Footer />
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;
