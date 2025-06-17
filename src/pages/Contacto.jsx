import React from 'react';
import '../styles/Contacto.css';

const Contacto = () => {
  return (
    <div className="contacto-container">
      <div className="contacto-hero">
        <div className="hero-content">
          <h1 className="hero-title">Contáctanos</h1>
          <p className="hero-subtitle">
            Estamos aquí para ayudarte. Encuentra nuestra información de contacto y respuestas a las preguntas más frecuentes.
          </p>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="contacto-content">
        <div className="container">
          <div className="contacto-info-center">
            <h2 className="section-title center">Información de Contacto</h2>
            
            <div className="info-cards">
              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="info-content">
                  <h3>Dirección</h3>
                  <p>Esmeralda 1289,Coronel<br />Concepción, Chile</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-phone"></i>
                </div>
                <div className="info-content">
                  <h3>Teléfono</h3>
                  <p>+56 2 2234 5678</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="info-content">
                  <h3>Email</h3>
                  <p>contacto@urbandrip.cl</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="info-content">
                  <h3>Horarios</h3>
                  <p>Lun - Vie: 9:00 - 18:00<br />Sáb: 10:00 - 16:00</p>
                </div>
              </div>
            </div>

            <div className="social-links">
              <h3>Síguenos</h3>
              <div className="social-icons">
                <a href="#" className="social-link facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="social-link instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="social-link twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-link whatsapp">
                  <i className="fab fa-whatsapp"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de FAQ */}
      <div className="faq-section">
        <div className="container">
          <h2 className="section-title center">Preguntas Frecuentes</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3>¿Cuál es el tiempo de entrega?</h3>
              <p>El tiempo de entrega es de 2-5 días hábiles en Concepción y 5-7 días hábiles en otras regiones.</p>
            </div>

            <div className="faq-item">
              <h3>¿Qué métodos de pago aceptan?</h3>
              <p>Aceptamos tarjetas de crédito, débito, transferencias bancarias y Webpay.</p>
            </div>

            <div className="faq-item">
              <h3>¿El envío tiene costo?</h3>
              <p>El envío es gratuito en compras sobre $50.000. Bajo ese monto tiene un costo de $3.990.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cómo puedo hacer seguimiento a mi pedido?</h3>
              <p>Una vez confirmado tu pedido, recibirás un código de seguimiento por email para rastrear tu envío.</p>
            </div>

            <div className="faq-item">
              <h3>¿Qué tallas están disponibles?</h3>
              <p>Manejamos tallas desde XS hasta XXL. Puedes consultar nuestra guía de tallas en cada producto.</p>
            </div>

            <div className="faq-item">
              <h3>¿Hacen envíos a regiones?</h3>
              <p>Sí, enviamos a todo Chile. Los tiempos de entrega pueden variar según la región de destino.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cómo puedo contactar soporte?</h3>
              <p>Puedes contactarnos por teléfono, email o WhatsApp. Nuestro equipo responde en horario comercial.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacto;