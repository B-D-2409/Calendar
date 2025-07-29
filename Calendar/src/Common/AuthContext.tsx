import { createContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/**
 * Represents a user object.
 * @typedef {Object} User
 * @property {string} _id - The user's unique ID.
 * @property {string} username - The username.
 * @property {string} email - The user's email.
 * @property {string} [firstName] - The user's first name (optional).
 * @property {string} [lastName] - The user's last name (optional).
 * @property {string} [phoneNumber] - The user's phone number (optional).
 * @property {string} [role] - The user's role (optional).
 * @property {boolean} [isBlocked] - Whether the user is blocked (optional).
 * @property {Object.<string, any>} [key] - Additional dynamic fields.
 */
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
/**
 * Authentication context shape.
 * @typedef {Object} AuthContextType
 * @property {User|null} user - The currently logged in user.
 * @property {string|null} token - The authentication token.
 * @property {(email: string, password: string) => Promise<User|null>} login - Function to log in a user.
 * @property {(userData: any) => Promise<any>} register - Function to register a new user.
 * @property {() => Promise<void>} logout - Function to log out the user.
 * @property {boolean} isLoggedIn - Whether a user is logged in.
 * @property {boolean} loading - Whether the authentication is being loaded.
 * @property {React.Dispatch<React.SetStateAction<User|null>>} setUser - Setter for the user state.
 */

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

/** Authentication context instance */
export const AuthContext = createContext<AuthContextType | null>(null);


const key = import.meta.env.VITE_BACK_END_URL || "http://localhost:5000";


/**
 * Props for the AuthProvider component.
 * @typedef {Object} AuthProviderProps
 * @property {ReactNode} children - The children components.
 */
interface AuthProviderProps {
  children: ReactNode;
}


/**
 * AuthProvider component that manages user authentication state and provides context to children.
 *
 * @param {AuthProviderProps} props - Component props
 * @returns {JSX.Element} React component
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();


  useEffect(() => {
    /**
  * Initializes the authentication state from localStorage.
  */
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


    /**
   * Handles user login and updates state/localStorage.
   *
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   * @returns {Promise<User|null>} Logged-in user object or null.
   */
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
        navigate('/calendar');
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

    /**
   * Registers a new user.
   *
   * @param {any} userData - The new user's data.
   * @returns {Promise<any>} The registration response.
   */
  const register = async (userData: any): Promise<any> => {
    try {
      const res = await axios.post(`${key}/api/auth/register`, userData);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Registration failed");
    }
  };


  /**
   * Logs the user out and clears authentication state.
   *
   * @returns {Promise<void>}
   */
  const logout = async (): Promise<void> => {
    await fetch(`${key}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
