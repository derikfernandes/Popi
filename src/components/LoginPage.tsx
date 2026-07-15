import React, { useState } from "react";
import {
  Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff, AlertCircle, Landmark, ShieldCheck
} from "lucide-react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "../firebase";

export default function LoginPage() {
  const [isRegisterModel, setIsRegisterModel] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      let msg = "Erro ao tentar autenticar com Google.";
      if (err.code === "auth/popup-closed-by-user") {
        msg = "Sessão de login cancelada pelo usuário.";
      } else if (err.code === "auth/popup-blocked") {
        msg = "O navegador bloqueou o popup de login. Permita popups para este site e tente novamente.";
      } else if (err.code === "auth/unauthorized-domain") {
        msg = `Este domínio (${window.location.hostname}) não está autorizado no Firebase. Adicione-o em Authentication > Settings > Authorized domains no Console do Firebase.`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve conter no mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      if (isRegisterModel) {
        if (!name) {
          setError("O nome é obrigatório para o cadastro.");
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, name);
        setSuccess("Conta criada com sucesso! Sincronizando dados...");
      } else {
        await signInWithEmail(email, password);
        setSuccess("Login efetuado com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
      let translatedError = "Ocorreu um erro ao tentar processar sua solicitação.";

      switch (err.code) {
        case "auth/invalid-email":
          translatedError = "O endereço de e-mail informado é inválido.";
          break;
        case "auth/user-disabled":
          translatedError = "Este usuário foi desativado pelo administrador.";
          break;
        case "auth/user-not-found":
          translatedError = "Não encontramos nenhum usuário registrado com este e-mail.";
          break;
        case "auth/wrong-password":
          translatedError = "Senha incorreta. Verifique os dados digitados.";
          break;
        case "auth/email-already-in-use":
          translatedError = "Já existe uma conta registrada com este endereço de e-mail.";
          break;
        case "auth/weak-password":
          translatedError = "A senha escolhida é muito fraca. Escolha uma senha mais forte.";
          break;
        case "auth/invalid-credential":
          translatedError = "Credenciais inválidas. Verifique seu e-mail e senha.";
          break;
        default:
          if (err.message) translatedError = err.message;
      }
      setError(translatedError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur p-2.5 rounded-xl border border-white/10">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase">POPI Generator</h1>
            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
              Prefeitura de São José dos Campos
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black leading-tight tracking-tight">
            Mapeamento inteligente<br />de rotinas públicas.
          </h2>
          <p className="text-blue-100/80 text-sm max-w-md leading-relaxed">
            Gere Procedimentos Operativos Padrão Inteligentes com apoio de IA, analise gargalos
            e proponha melhorias TO-BE de forma padronizada e segura.
          </p>
          <div className="flex items-center gap-2 text-xs text-blue-200 font-bold bg-white/5 border border-white/10 px-3 py-2 rounded-xl w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Ambiente corporativo protegido
          </div>
        </div>

        <div className="relative z-10 text-[10px] text-blue-200/60 font-bold uppercase tracking-wider font-mono">
          Plataforma POPI v1.2
        </div>
      </div>

      {/* Right auth form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase">POPI Generator</h1>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                Prefeitura de São José dos Campos
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black tracking-wider uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
            Acesso ao Sistema
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-3 text-slate-900">
            {isRegisterModel ? "Criar Conta Corporativa" : "Entrar no POPI Generator"}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5">
            {isRegisterModel
              ? "Cadastre-se para sincronizar seus POPIs com a nuvem segura."
              : "Faça login para acessar o painel de mapeamento."}
          </p>

          <div className="mt-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs rounded-r-lg flex items-center gap-2.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegisterModel && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu-email@prefeitura.sp.gov.br"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-500/20 active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed duration-200"
              >
                {isRegisterModel ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>
                  {loading
                    ? "Processando..."
                    : isRegisterModel ? "Finalizar Cadastro" : "Acessar Painel"}
                </span>
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase">
                <span className="bg-slate-50 px-3 text-slate-400">Ou continuar com</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6a5.66 5.66 0 0 1-2.45 3.71v3.08h3.97c2.32-2.14 3.65-5.22 3.65-8.62z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.97-3.08a7.45 7.45 0 0 1-11.96-4.14H1.18v3.18A11.98 11.98 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M4.03 13.87a7.21 7.21 0 0 1 0-4.5V6.19H1.18a11.97 11.97 0 0 0 0 11.62l2.85-2.19c-.19-.59-.3-1.22-.3-1.87z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.94 11.94 0 0 0 1.18 6.19l2.85 2.19c.75-2.25 2.87-3.63 7.97-3.63z" />
              </svg>
              <span>Conta Google</span>
            </button>

            <div className="mt-6 text-center text-xs">
              <span className="text-slate-500 font-medium">
                {isRegisterModel ? "Já possui uma conta?" : "Ainda não tem cadastro?"}
              </span>{" "}
              <button
                onClick={() => {
                  setIsRegisterModel(!isRegisterModel);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-extrabold underline cursor-pointer transition"
              >
                {isRegisterModel ? "Fazer Login" : "Criar nova conta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
