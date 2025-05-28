import { Outlet } from "react-router-dom";
import Header from "../components/Header/HeaderComponent";

export default function MainLayout() {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 p-4 relative z-0 overflow-hidden">
          <Outlet />
        </main>
      </div>
    );
  }
  
  