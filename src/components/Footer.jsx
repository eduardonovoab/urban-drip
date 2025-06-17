import React from 'react';

const Footer = () => {
  const footerStyles = {
    footer: {
      backgroundColor: '#1e3a8a',
      color: 'white',
      marginTop: '3rem'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '3rem 1.5rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem'
    },
    section: {
      marginBottom: '1rem'
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#93c5fd',
      marginBottom: '1rem'
    },
    description: {
      color: '#dbeafe',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      marginBottom: '1rem'
    },
    socialContainer: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1rem'
    },
    socialLink: {
      color: '#93c5fd',
      textDecoration: 'none',
      fontSize: '1.2rem',
      transition: 'color 0.2s'
    },
    linkList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    linkItem: {
      marginBottom: '0.5rem'
    },
    link: {
      color: '#dbeafe',
      textDecoration: 'none',
      fontSize: '0.875rem',
      transition: 'color 0.2s'
    },
    emailContainer: {
      display: 'flex',
      marginBottom: '1rem'
    },
    emailInput: {
      flex: 1,
      padding: '0.5rem',
      backgroundColor: '#1e40af',
      color: 'white',
      border: '1px solid #3730a3',
      borderRadius: '4px 0 0 4px',
      fontSize: '0.875rem'
    },
    emailButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '0 4px 4px 0',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    contactInfo: {
      marginTop: '1rem'
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      color: '#dbeafe'
    },
    divider: {
      borderTop: '1px solid #3730a3',
      margin: 0
    },
    bottomSection: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    copyright: {
      fontSize: '0.875rem',
      color: '#93c5fd'
    },
    legalLinks: {
      display: 'flex',
      gap: '1.5rem',
      flexWrap: 'wrap'
    },
    legalLink: {
      color: '#93c5fd',
      textDecoration: 'none',
      fontSize: '0.875rem',
      transition: 'color 0.2s'
    }
  };

  return (
    <footer style={footerStyles.footer}>
      {/* Sección principal del footer */}
      <div style={footerStyles.container}>
        <div style={footerStyles.grid}>
          
          {/* Información de la empresa */}
          <div style={footerStyles.section}>
            <h3 style={footerStyles.title}>UrbanDrip</h3>
            <p style={footerStyles.description}>
              Tu destino para la moda urbana más fresh. Descubre las últimas tendencias 
              y exprésate con estilo único.
            </p>
            <div style={footerStyles.socialContainer}>
              <a 
                href="#" 
                style={footerStyles.socialLink}
                onMouseOver={(e) => e.target.style.color = 'white'}
                onMouseOut={(e) => e.target.style.color = '#93c5fd'}
              >
                📘
              </a>
              <a 
                href="#" 
                style={footerStyles.socialLink}
                onMouseOver={(e) => e.target.style.color = 'white'}
                onMouseOut={(e) => e.target.style.color = '#93c5fd'}
              >
                📷
              </a>
              <a 
                href="#" 
                style={footerStyles.socialLink}
                onMouseOver={(e) => e.target.style.color = 'white'}
                onMouseOut={(e) => e.target.style.color = '#93c5fd'}
              >
                🐦
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div style={footerStyles.section}>
            <h4 style={footerStyles.title}>Tienda</h4>
            <ul style={footerStyles.linkList}>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Nuevas Llegadas
                </a>
              </li>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Hombres
                </a>
              </li>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Mujeres
                </a>
              </li>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Accesorios
                </a>
              </li>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Ofertas
                </a>
              </li>
            </ul>
          </div>

          {/* Atención al cliente */}
          <div style={footerStyles.section}>
            <h4 style={footerStyles.title}>Ayuda</h4>
            <ul style={footerStyles.linkList}>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Centro de Ayuda
                </a>
              </li>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Envíos y Devoluciones
                </a>
              </li>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Guía de Tallas
                </a>
              </li>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Seguimiento de Pedido
                </a>
              </li>
              <li style={footerStyles.linkItem}>
                <a 
                  href="#" 
                  style={footerStyles.link}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = '#dbeafe'}
                >
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter y contacto */}
          <div style={footerStyles.section}>
            <h4 style={footerStyles.title}>Mantente Conectado</h4>
            <p style={footerStyles.description}>
              Suscríbete para recibir ofertas exclusivas y novedades.
            </p>
            <div style={footerStyles.emailContainer}>
              <input
                type="email"
                placeholder="Tu email"
                style={footerStyles.emailInput}
              />
              <button 
                style={footerStyles.emailButton}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                ✉️
              </button>
            </div>
            
            {/* Información de contacto */}
            <div style={footerStyles.contactInfo}>
              <div style={footerStyles.contactItem}>
                <span>📞</span>
                <span>+56 2 2234 5678</span>
              </div>
              <div style={footerStyles.contactItem}>
                <span>✉️</span>
                <span>hola@urbandrip.com</span>
              </div>
              <div style={footerStyles.contactItem}>
                <span>📍</span>
                <span>
Concepción, Chile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Línea divisoria */}
      <hr style={footerStyles.divider} />

      {/* Sección inferior */}
      <div style={footerStyles.bottomSection}>
        <p style={footerStyles.copyright}>
          &copy; {new Date().getFullYear()} UrbanDrip. Todos los derechos reservados.
        </p>
        <div style={footerStyles.legalLinks}>
          <a 
            href="#" 
            style={footerStyles.legalLink}
            onMouseOver={(e) => e.target.style.color = 'white'}
            onMouseOut={(e) => e.target.style.color = '#93c5fd'}
          >
            Política de Privacidad
          </a>
          <a 
            href="#" 
            style={footerStyles.legalLink}
            onMouseOver={(e) => e.target.style.color = 'white'}
            onMouseOut={(e) => e.target.style.color = '#93c5fd'}
          >
            Términos de Servicio
          </a>
          <a 
            href="#" 
            style={footerStyles.legalLink}
            onMouseOver={(e) => e.target.style.color = 'white'}
            onMouseOut={(e) => e.target.style.color = '#93c5fd'}
          >
            Cookies
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;