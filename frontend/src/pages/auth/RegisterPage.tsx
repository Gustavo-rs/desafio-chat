import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth-service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    if (password !== confirmPassword) {
      toast.error("As senhas precisam ser iguais");
      setLoading(false);
      return;
    }

    if (!username || !password || !confirmPassword) {
      toast.error("Todos os campos são obrigatórios");
      setLoading(false);
      return;
    }

    try {
      await authService.register({
        username: username,
        password: password
      });

      toast.success("Conta criada com sucesso");

      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100vh] w-full flex items-center justify-center">
      <div className="bg-white flex items-center justify-center px-4">
        <div className="p-10 min-w-[400px]">
          <h2 className="text-3xl font-bold text-center text-primary mb-1">
            Criar Conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                placeholder="Digite seu usuário"
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                placeholder="Digite sua senha"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                placeholder="Confirme sua senha"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/80 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span>
                  <Loader2 className="animate-spin" />
                </span>
              ) : (
                <span>Criar Conta</span>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 my-2">
              <div className="h-px w-full bg-gray-300"></div>
              <span className="text-gray-500 text-xs">OU</span>
              <div className="h-px w-full bg-gray-300"></div>
            </div>

            <p className="text-center text-sm mt-4 text-gray-700">
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:underline"
              >
                Faça login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
