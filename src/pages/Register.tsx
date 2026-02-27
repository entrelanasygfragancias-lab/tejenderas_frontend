import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { AxiosError } from 'axios';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [department, setDepartment] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await register(name, email, password, passwordConfirmation, address, phone, city, department);
            navigate('/');
        } catch (err) {
            const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
            if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0];
                setError(firstError[0]);
            } else {
                setError(error.response?.data?.message || 'Error al registrarse');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-graphite relative overflow-hidden py-20">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute bottom-10 left-10 w-64 h-64 bg-lime rounded-full blur-3xl"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-pink-hot rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-2xl safe-mobile-margin relative z-10">
                {/* Logo / Header */}
                <div className="text-center mb-6 md:mb-10 flex flex-col items-center">
                    <Logo className="w-24 h-24 md:w-32 md:h-32 mb-4 md:mb-6 drop-shadow-2xl filter hover:scale-105 transition-transform duration-300 mx-auto" />
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tighter">
                        ENTRE LANAS <span className="text-pink-hot">Y FRAGANCIAS</span>
                    </h1>
                    <p className="text-gray-400 font-bold text-sm md:text-lg uppercase tracking-widest">Crea tu cuenta de cliente</p>
                </div>

                {/* Register Card */}
                <div className="bg-white rounded-4xl md:rounded-[3rem] border-4 md:border-8 border-white shadow-[8px_8px_0px_0px_#1EA49D] md:shadow-[12px_12px_0px_0px_#1EA49D] p-6 md:p-14 relative mt-4">
                    {/* Decorative pin/tape */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-pink-hot w-20 h-20 rounded-full border-8 border-graphite flex items-center justify-center shadow-[4px_4px_0px_0px_#333] z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-3xl md:text-4xl font-black text-graphite text-center mb-8 uppercase tracking-tight">Registro</h2>

                        {error && (
                            <div className="bg-red-pink/10 border-4 border-red-pink text-red-pink px-6 py-4 rounded-2xl mb-8 font-black text-base text-center uppercase tracking-wide">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-black text-graphite mb-2 uppercase tracking-widest">
                                    Nombre completo
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-4 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-teal focus:bg-white transition-all font-bold"
                                    placeholder="Tu nombre"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-black text-graphite mb-2 uppercase tracking-widest">
                                        Correo electrónico
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-5 py-4 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-teal focus:bg-white transition-all font-bold"
                                        placeholder="correo@ejemplo.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-black text-graphite mb-2 uppercase tracking-widest">
                                        Teléfono
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-5 py-4 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-teal focus:bg-white transition-all font-bold"
                                        placeholder="Ej: 3001234567"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-sm font-black text-graphite mb-2 uppercase tracking-widest">
                                    Dirección de Envío
                                </label>
                                <input
                                    id="address"
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-5 py-4 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-teal focus:bg-white transition-all font-bold"
                                    placeholder="Carrera 1 # 2-3, Barrio..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-black text-graphite mb-2 uppercase tracking-widest">
                                        Ciudad/Municipio
                                    </label>
                                    <input
                                        id="city"
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-5 py-4 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-teal focus:bg-white transition-all font-bold"
                                        placeholder="Ej: Bogotá"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="department" className="block text-sm font-black text-graphite mb-2 uppercase tracking-widest">
                                        Departamento
                                    </label>
                                    <input
                                        id="department"
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full px-5 py-4 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-teal focus:bg-white transition-all font-bold"
                                        placeholder="Ej: Cundinamarca"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-black text-graphite mb-2 uppercase tracking-widest">
                                        Contraseña
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-4 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-teal focus:bg-white transition-all font-bold"
                                        placeholder="Mínimo 8 caracteres"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="passwordConfirmation" className="block text-sm font-black text-graphite mb-2 uppercase tracking-widest">
                                        Confirmar contraseña
                                    </label>
                                    <input
                                        id="passwordConfirmation"
                                        type="password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        className="w-full px-5 py-4 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-teal focus:bg-white transition-all font-bold"
                                        placeholder="Repite tu contraseña"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 px-8 bg-teal hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl border-4 border-graphite shadow-[6px_6px_0px_0px_#333] hover:shadow-[3px_3px_0px_0px_#333] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-4 text-xl"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Registrando...
                                    </span>
                                ) : (
                                    'Registrarse'
                                )}
                            </button>
                        </form>

                        <div className="mt-10 text-center pt-8 border-t-4 border-dashed border-gray-200">
                            <p className="text-gray-500 font-bold text-lg">
                                ¿Ya tienes cuenta?{' '}
                                <Link to="/login" className="text-pink-hot hover:text-teal font-black uppercase tracking-wide transition-colors ml-1">
                                    Inicia Sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
