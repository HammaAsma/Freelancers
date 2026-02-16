import { useContext, createContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Récupérer user au rechargement
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erreur parse user", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await apiLogin(email, password); // ⬅️ utiliser l’API de login
    const payload = data.data || data; // selon ton backend

    localStorage.setItem("accessToken", payload.accessToken);
    localStorage.setItem("user", JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const signup = async (email, password, first_name, last_name) => {
    const { data } = await apiRegister(email, password, first_name, last_name);
    const payload = data.data || data;

    localStorage.setItem("accessToken", payload.accessToken);
    localStorage.setItem("user", JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
