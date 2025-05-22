import { useUser } from "../../store/auth-store";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo-white.png";

export default function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="h-16 w-auto" />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">
            Olá, {user?.user?.username}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 h-9 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
