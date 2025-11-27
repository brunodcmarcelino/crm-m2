import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import logoImage from "../assets/logo.png";


export default function LoginPage() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname ?? "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const validate = () => {
        if (!email) return "Preencha o email.";
        if (!password) return "Preencha a senha.";
        return null;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        const v = validate();
        if (v) {
            setErrorMsg(v);
            return;
        }
        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);
        if (error) {
            setErrorMsg(error.message || "Erro ao entrar.");
        } else {
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">

                {/* LOGO + TÍTULO */}
                <div className="flex items-center gap-4 mb-6">
                    <img
                        src={logoImage}
                        alt="M2 Cortes e Artes"
                        className="w-12 h-12 rounded-md object-contain shadow-sm"
                    />
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">M2 Cortes e Artes</h1>
                        <p className="text-sm text-gray-500">Sistema</p>
                    </div>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    Entre com seu e-mail corporativo para acessar o sistema.
                </p>

                {/* FORM */}
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="seu@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Senha</label>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 transition pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass((s) => !s)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

                    {/* lembrar + esquecer senha */}
                    <div className="flex justify-between text-xs text-gray-600">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" /> Lembrar-me
                        </label>
                        <Link to="/forgot" className="text-purple-600 hover:underline">
                            Esqueci a senha
                        </Link>
                    </div>

                    {/* BOTÃO */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-lg shadow hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? "Entrando..." : "Entrar no sistema"}
                    </button>
                </form>

                {/* RODAPÉ */}
                <p className="mt-6 text-center text-sm text-gray-600">
                    Não tem conta?
                    <Link to="/signup" className="text-purple-600 ml-1 hover:underline">
                        Criar conta
                    </Link>
                </p>

                <p className="mt-4 text-xs text-center text-gray-400">
                    Sistema M2 Cortes e Artes — Protegido por Supabase Auth
                </p>
            </div>
        </div>
    );
}
