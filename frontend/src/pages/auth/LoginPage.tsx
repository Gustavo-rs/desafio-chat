import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { toast } from "sonner";
import authService from "../../services/auth-service";
import { useAuth } from "../../store/auth-store";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!username) {
      toast.error("Usuário é obrigatório");
      setLoading(false);
      return;
    }

    if (!password) {
      toast.error("Senha é obrigatória");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.auth({
        username,
        password,
      });

      login(response.data);

      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100vh] w-full flex">
      <div className="w-1/2 bg-white flex items-center justify-center px-4">
        <div className="p-10 min-w-[400px]">
          <h2 className="text-3xl font-bold text-center text-primary mb-1">
            Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1"
                placeholder="Digite seu usuário"
                autoComplete="new-username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1"
                placeholder="Digite sua senha"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/80 transition flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span>
                  <Loader2 className="animate-spin" />
                </span>
              ) : (
                <span>Entrar</span>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 my-2">
              <div className="h-px w-full bg-gray-300"></div>
              <span className="text-gray-500 text-xs">OU</span>
              <div className="h-px w-full bg-gray-300"></div>
            </div>

            <p className="text-center text-sm mt-4 text-gray-700">
              Primeira vez aqui?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-primary hover:underline"
              >
                Cadastre-se agora
              </button>
            </p>
          </form>
        </div>
      </div>
      <div className="w-1/2 bg-primary flex flex-col items-center justify-center">
        <img src={logo} alt="Logo" className="w-1/2" />
      </div>
    </div>
  );
}
