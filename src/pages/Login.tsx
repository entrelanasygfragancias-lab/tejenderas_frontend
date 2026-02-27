import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { AxiosError } from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(email, password);
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 safe-mobile-margin flex justify-center relative overflow-hidden">
            {/* Back to home button */}
            <div className="absolute top-6 left-6 z-50">
                <Link
                    to="/"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-graphite font-black uppercase tracking-widest text-xs rounded-xl border-4 border-white shadow-[4px_4px_0px_0px_#FF4D8D] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    <span>Inicio</span>
                </Link>
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-48 h-48 bg-pink-hot rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-md:safe-mobile-margin px-6 relative z-10">
                <div className="text-center mb-6 flex flex-col items-center">
                    <Logo className="w-44 h-44 max-md:w-32 max-md:h-32 mb-4 drop-shadow-2xl filter hover:scale-105 transition-transform duration-300 mx-auto" />
                    <h1 className="text-5xl max-md:text-4xl font-black text-white mb-2 tracking-tighter">
                        ENTRE LANAS <span className="text-pink-hot">Y FRAGANCIAS</span>
                    </h1>
                    <p className="text-gray-400 font-bold text-lg max-md:text-sm uppercase tracking-widest">Panel de Acceso</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[3rem] max-md:rounded-[2rem] border-8 max-md:border-4 border-white shadow-[12px_12px_0px_0px_#FE6196] max-md:shadow-[8px_8px_0px_0px_#FE6196] py-16 px-14 max-md:p-8 relative mt-4 min-h-[300px] max-md:min-h-[400px] flex flex-col justify-center">
                    {/* Decorative pin/tape (optional visual flair) */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-teal w-20 h-20 max-md:w-16 max-md:h-16 rounded-full border-8 max-md:border-4 border-graphite flex items-center justify-center shadow-[4px_4px_0px_0px_#333] z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 max-md:h-8 max-md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-4xl font-black text-graphite text-center mb-8 uppercase tracking-tight">Bienvenido</h2>

                        {error && (
                            <div className="bg-red-pink/10 border-4 border-red-pink text-red-pink px-6 py-4 rounded-2xl mb-8 font-black text-base text-center uppercase tracking-wide">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <label htmlFor="email" className="block text-sm font-black text-graphite mb-3 uppercase tracking-widest">
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-6 py-5 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-pink-hot focus:bg-white transition-all font-bold"
                                    placeholder="admin@telarshop.com"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-black text-graphite mb-3 uppercase tracking-widest">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-6 py-5 bg-grey-light/30 border-4 border-graphite rounded-2xl text-graphite text-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-pink-hot focus:bg-white transition-all font-bold"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 px-8 bg-pink-hot hover:bg-red-pink text-white font-black uppercase tracking-widest rounded-2xl border-4 border-graphite shadow-[6px_6px_0px_0px_#333] hover:shadow-[3px_3px_0px_0px_#333] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-xl"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Procesando...
                                    </span>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </form>

                        <div className="mt-10 text-center pt-8 border-t-4 border-dashed border-gray-200">
                            <p className="text-gray-500 font-bold text-lg">
                                ¿No tienes cuenta?{' '}
                                <Link to="/register" className="text-teal hover:text-pink-hot font-black uppercase tracking-wide transition-colors ml-1">
                                    Regístrate aquí
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
