import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';

export default function About() {
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white text-graphite font-sans selection:bg-pink-hot selection:text-white">
            <Navbar onOpenCart={() => setIsCartOpen(true)} />

            {/* Main Content */}
            <main className="pt-32 lg:pt-48 pb-48 lg:pb-64 safe-mobile-margin md:px-12 bg-white flex flex-col items-center">
                <div className="max-w-4xl w-full">
                    {/* Header */}
                    <div className="text-center mb-32 animate-fadeIn">
                        <span className="bg-lime text-graphite px-8 py-3 rounded-2xl text-xl max-md:text-sm font-black uppercase tracking-widest mb-12 inline-block border-4 border-graphite shadow-[6px_6px_0_0_rgba(51,51,51,0.5)]">
                            Conócenos mejor
                        </span>
                        <h1 className="text-6xl md:text-8xl max-md:text-4xl font-black mb-6 tracking-tighter text-center leading-none">
                            NUESTRA<br />
                            <span className="text-pink-hot italic">HISTORIA</span>
                        </h1>
                        <div className="w-40 h-3 bg-teal mx-auto rounded-full"></div>
                    </div>

                    {/* Story Content */}
                    <div className="grid grid-cols-1 gap-24">
                        <section className="bg-gray-50 p-16 md:p-24 max-md:p-8 rounded-3xl border-4 border-graphite shadow-[12px_12px_0_0_#333] relative overflow-hidden group hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-hot/10 rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>

                            <h2 className="text-3xl max-md:text-2xl font-black text-graphite mb-10 flex items-center justify-center gap-4">
                                <span className="w-12 h-1.5 bg-pink-hot rounded-full"></span>
                                El Comienzo
                                <span className="w-12 h-1.5 bg-pink-hot rounded-full"></span>
                            </h2>
                            <p className="text-2xl max-md:text-base text-gray-700 font-medium leading-relaxed mb-6 text-justify">
                                Nacimos de la pasión por crear. En <span className="text-pink-hot font-black">"Entre Lanas y Fragancias"</span>, fusionamos la tradición textil con una experiencia sensorial única.
                            </p>
                            <p className="text-2xl max-md:text-base text-gray-700 font-medium leading-relaxed text-justify">
                                Más que una tienda, somos un espacio donde cada hilo cuenta una historia y cada aroma despierta la creatividad. Nuestra misión es brindar a nuestros clientes materiales de la más alta calidad para que puedan dar vida a sus proyectos más ambiciosos.
                            </p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
                            <div className="bg-teal text-white p-14 max-md:p-8 rounded-2xl border-4 border-graphite shadow-[8px_8px_0_0_#333]">
                                <h3 className="text-2xl font-black mb-6 uppercase tracking-widest">Nuestra Visión</h3>
                                <p className="text-lg font-bold opacity-90 text-justify">
                                    Ser el referente nacional en insumos textiles y fragancias, inspirando a una comunidad de creadores y artesanos a través de la excelencia y la innovación.
                                </p>
                            </div>
                            <div className="bg-pink-hot text-white p-14 max-md:p-8 rounded-2xl border-4 border-graphite shadow-[8px_8px_0_0_#333]">
                                <h3 className="text-2xl font-black mb-6 uppercase tracking-widest">Nuestra Misión</h3>
                                <p className="text-lg font-bold opacity-90 text-justify">
                                    Proveer los mejores materiales y aromas, garantizando una experiencia de compra excepcional y apoyando el talento local con productos premium.
                                </p>
                            </div>
                        </div>

                        <section className="bg-lime p-16 md:p-24 max-md:p-8 rounded-3xl border-4 border-graphite shadow-[16px_16px_0_0_#333] text-center">
                            <h2 className="text-4xl max-md:text-2xl font-black text-graphite mb-6 uppercase tracking-tighter italic">
                                ¡Ven y forma parte de nuestra historia!
                            </h2>
                            <p className="text-xl max-md:text-base text-graphite/80 font-bold mb-8 max-w-2xl mx-auto">
                                Te invitamos a explorar nuestro showroom en Chía, donde podrás tocar nuestras telas y dejarte envolver por nuestras fragancias únicas.
                            </p>
                            <a
                                href="#contacto"
                                className="inline-block px-12 py-5 bg-graphite text-white font-black uppercase tracking-widest rounded-2xl hover:bg-pink-hot transition-all border-4 border-transparent hover:border-white shadow-xl"
                            >
                                Contáctanos
                            </a>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}
