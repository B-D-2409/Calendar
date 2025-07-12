import { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  isBlocked?: boolean;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  login: async () => null,
  register: async () => {},
  logout: async () => {},
  isLoggedIn: false,
  loading: false,
  setUser: () => {},
};
export const AuthContext = createContext<AuthContextType | null>(null);


const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser && storedUser !== "undefined") {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Invalid stored user:", storedUser, e);
          localStorage.removeItem("user");
        }
      } else {
        localStorage.removeItem("user");
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const res = await axios.post(`${key}/api/auth/login`, {
      email,
      password,
    });
    const data = res.data;

    let fullUser = data.user;
    if (fullUser && fullUser.id) {
      try {
        const profileRes = await axios.get(`${key}/api/auth/users`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        const found = Array.isArray(profileRes.data)
          ? profileRes.data.find((u) => u._id === fullUser.id)
          : null;
        if (found) fullUser = found;
      } catch (e) {
        console.error("Fetching full user failed", e);
      }
    }

    localStorage.setItem("token", data.token);
    if (fullUser) {
      localStorage.setItem("user", JSON.stringify(fullUser));
    } else {
      localStorage.removeItem("user");
    }

    setToken(data.token);
    setUser(fullUser);
    return fullUser;
  };

  const register = async (userData: any): Promise<any> => {
    try {
      const res = await axios.post(`${key}/api/auth/register`, userData);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Registration failed");
    }
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    await fetch(`${key}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setToken(null);
    setUser(null);
  };

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoggedIn,
        loading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
