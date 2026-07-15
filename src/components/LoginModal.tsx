import React, { useState } from "react";
import { 
  X, Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff, AlertCircle, ChevronRight
} from "lucide-react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "../firebase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [isRegisterModel, setIsRegisterModel] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.code === "auth/popup-closed-by-user" 
          ? "Sessão de login cancelada pelo usuário." 
          : "Erro ao tentar autenticar com Google."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Simplistic validations
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
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        await signInWithEmail(email, password);
        setSuccess("Login efetuado com sucesso!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-150 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        id="login-modal-card"
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
            id="close-login-btn"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-black tracking-wider uppercase bg-blue-500/30 px-2.5 py-1 rounded-full text-blue-200">
            Acesso ao Sistema
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-2">
            {isRegisterModel ? "Criar Conta Corporativa" : "Entrar no POPI Generator"}
          </h2>
          <p className="text-xs text-blue-100/80 mt-1">
            {isRegisterModel 
              ? "Cadastre-se para sincronizar seus POPis com nossa nuvem segura."
              : "Sincronize seus dados com o banco de dados oficial da prefeitura."
            }
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
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
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition"
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
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition"
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
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition"
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
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-500/20 active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed duration-200`}
            >
              {isRegisterModel ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>
                {loading 
                  ? "Processando..." 
                  : isRegisterModel ? "Finalizar Cadastro" : "Acessar Painel"
                }
              </span>
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase">
              <span className="bg-white px-3 text-slate-400">Ou continuar com</span>
            </div>
          </div>

          {/* Google Login button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 pb-3 cursor-pointer shadow-sm hover:shadow active:translate-y-[1px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6a5.66 5.66 0 0 1-2.45 3.71v3.08h3.97c2.32-2.14 3.65-5.22 3.65-8.62z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.97-3.08a7.45 7.45 0 0 1-11.96-4.14H1.18v3.18A11.98 11.98 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M4.03 13.87a7.21 7.21 0 0 1 0-4.5V6.19H1.18a11.97 11.97 0 0 0 0 11.62l2.85-2.19c-.19-.59-.3-1.22-.3-1.87z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.94 11.94 0 0 0 1.18 6.19l2.85 2.19c.75-2.25 2.87-3.63 7.97-3.63z"
              />
            </svg>
            <span>Conta Google</span>
          </button>

          {/* Switch Action Links */}
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
  );
}
