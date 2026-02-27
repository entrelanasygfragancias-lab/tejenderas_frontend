import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const CustomLogo = ({ className = "w-20 h-20" }: { className?: string }) => (
    <Logo className={className} />
);

export default function Footer() {
    const [showMapModal, setShowMapModal] = useState(false);

    return (
        <>
            <footer id="contacto" className="bg-graphite text-white pt-32 lg:pt-48 mt-0 max-md:pt-16 max-md:pb-12 pb-24 overflow-hidden relative border-t-8 border-transparent" >
                <div className="absolute top-0 left-0 w-full h-4 bg-linear-to-r from-pink-hot via-purple-500 to-teal"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-hot rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal rounded-full blur-[100px] opacity-20"></div>

                <div className="max-w-360 mx-auto safe-mobile-margin md:px-12 relative z-10 flex flex-col items-center">

                    {/* Top Section: Brand */}
                    <div className="flex flex-col items-center mb-24 max-md:mb-16">
                        <div className="flex flex-col md:flex-row items-center gap-10 max-md:gap-6">
                            <CustomLogo className="w-32 h-32 max-md:w-20 max-md:h-20 rounded-4xl p-4 shadow-2xl transform hover:rotate-6 transition-transform duration-500" />
                            <div className="text-center md:text-left">
                                <h2 className="text-4xl md:text-6xl max-md:text-2xl font-black leading-none tracking-tighter mb-2">ENTRE LANAS</h2>
                                <h3 className="text-xl md:text-3xl max-md:text-lg font-bold text-pink-hot tracking-[0.2em] leading-none mb-4">Y FRAGANCIAS</h3>
                                <p className="text-white/80 font-black text-[10px] md:text-xs tracking-[0.3em] uppercase italic border border-white/10 px-3 py-1 rounded-md inline-block">NIT 20421751 - 2</p>
                            </div>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-full h-px bg-linear-to-r from-transparent via-gray-700 to-transparent mb-16 max-md:mb-20"></div>

                    {/* Contact Info (Bottom) */}
                    <div className="flex flex-col md:flex-row gap-12 max-md:gap-6 md:gap-32 justify-center items-center w-full mb-12 max-md:pt-12">
                        <div
                            onClick={() => setShowMapModal(true)}
                            className="flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform duration-300"
                        >
                            <div className="w-16 h-16 max-md:w-10 max-md:h-10 rounded-2xl bg-gray-800 flex items-center justify-center mb-4 max-md:mb-2 text-pink-hot group-hover:bg-pink-hot group-hover:text-white transition-all duration-300 shadow-lg border border-gray-700 group-hover:border-pink-hot">
                                <svg className="w-8 h-8 max-md:w-5 max-md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <h5 className="text-white font-black text-lg max-md:text-xs mb-1 uppercase tracking-wide group-hover:text-pink-hot transition-colors">Visítanos</h5>
                            <p className="text-gray-400 text-lg max-md:text-xs group-hover:text-white transition-colors">Carrera 11# 6-08, Barrio el Rosario, Chía</p>
                        </div>

                        <div className="hidden md:block w-px h-24 bg-gray-800"></div>

                        <a
                            href="https://wa.me/573124578081"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform duration-300"
                        >
                            <div className="w-16 h-16 max-md:w-10 max-md:h-10 rounded-2xl bg-gray-800 flex items-center justify-center mb-4 max-md:mb-2 text-pink-hot group-hover:bg-pink-hot group-hover:text-white transition-all duration-300 shadow-lg border border-gray-700 group-hover:border-pink-hot">
                                <svg className="w-8 h-8 max-md:w-5 max-md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                            <h5 className="text-white font-black text-lg max-md:text-xs mb-1 uppercase tracking-wide group-hover:text-pink-hot transition-colors">Llámanos o Escribe</h5>
                            <p className="text-gray-400 text-lg max-md:text-xs group-hover:text-white transition-colors">+57 312 457 8081 - 314 461 6230</p>
                        </a>
                    </div>

                    <div className="border-t border-gray-800 pt-10 max-md:pt-6 text-center w-full">
                        <p className="text-gray-500 font-bold text-lg max-md:text-xs mb-4">&copy; 2026 Entre Lanas y Fragancias. Todos los derechos reservados.</p>
                        <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-tighter text-white/30">
                            <Link to="/legal#terminos" className="hover:text-pink-hot transition-colors">Términos y Condiciones</Link>
                            <span className="opacity-10">|</span>
                            <Link to="/legal#datos" className="hover:text-teal transition-colors">Tratamiento de Datos</Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Google Maps Modal */}
            {showMapModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-graphite/90 backdrop-blur-md animate-fadeIn" onClick={() => setShowMapModal(false)}>
                    <div className="bg-white rounded-4xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl border-4 border-pink-hot relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowMapModal(false)}
                            className="absolute top-4 right-4 z-10 w-12 h-12 bg-white text-graphite rounded-full flex items-center justify-center font-black shadow-lg hover:bg-pink-hot hover:text-white transition-all transform hover:rotate-90 border-2 border-graphite"
                        >
                            ✕
                        </button>
                        <div className="bg-graphite text-white py-4 px-8 flex items-center justify-between">
                            <h3 className="text-2xl font-black uppercase tracking-widest">Nuestra Ubicación</h3>
                        </div>
                        <div className="grow w-full h-full">
                            <iframe
                                src="https://maps.google.com/maps?q=Carrera+11+%23+6-08%2C+Ch%C3%ADa%2C+Cundinamarca&z=17&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
