import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Legal.css';

export default function Legal() {
    return (
        <div className="legal-page">
            <Navbar onOpenCart={() => { }} />

            <main className="legal-main">
                <header className="legal-header">
                    <h1 className="legal-title">
                        Avisos <span style={{ color: '#FE6196' }}>Legales</span>
                    </h1>
                    <p style={{ color: '#666', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        En Entre Lanas y Fragancias, valoramos la transparencia y la confianza.
                    </p>
                </header>

                <div className="legal-content">
                    <section id="terminos" className="legal-section">
                        <h2>
                            <span className="legal-number">01</span>
                            Términos y Condiciones
                        </h2>

                        <div className="legal-text-block">
                            <p>
                                Al acceder y utilizar este sitio web, usted acepta cumplir con los siguientes términos y condiciones de uso:
                            </p>
                            <ul>
                                <li><strong>Compras y Pagos:</strong> Todos los precios están expresados en pesos colombianos e incluyen los impuestos de ley correspondientes.</li>
                                <li><strong>Envíos:</strong> Realizamos envíos a nivel nacional. Los tiempos de entrega son usualmente entre 3 a 7 días hábiles.</li>
                                <li><strong>Devoluciones:</strong> Las devoluciones aplican por defectos de fábrica dentro de los primeros 5 días hábiles.</li>
                                <li><strong>Propiedad Intelectual:</strong> Todo el contenido de este sitio es propiedad exclusiva de Entre Lanas y Fragancias.</li>
                            </ul>
                        </div>
                    </section>

                    <section id="datos" className="legal-section">
                        <h2>
                            <span className="legal-number" style={{ boxShadow: '4px 4px 0px 0px #2DD4BF' }}>02</span>
                            Tratamiento de Datos
                        </h2>

                        <div className="legal-text-block">
                            <p>
                                En cumplimiento de la Ley 1581 de 2012 (Habeas Data), informamos que sus datos son utilizados exclusivamente para gestionar sus pedidos y mejorar su experiencia.
                            </p>
                            <ul>
                                <li>Procesar y gestionar sus pedidos de compra.</li>
                                <li>Brindar soporte al cliente y responder consultas.</li>
                                <li>Enviar comunicaciones sobre promociones (opcional).</li>
                            </ul>
                            <div className="legal-highlight-box">
                                Sus datos nunca serán vendidos ni compartidos con terceros sin su consentimiento expreso. Para ejercer sus derechos de conocer, actualizar o rectificar sus datos, puede contactarnos a través de nuestros canales oficiales.
                            </div>
                        </div>
                    </section>
                </div>

                <div className="legal-btn-container">
                    <Link to="/" className="legal-btn-back">
                        Volver al Inicio
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}

