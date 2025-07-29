import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * Theme type which can be either "light" or "dark".
 */
type Theme = "light" | "dark";

/**
 * Shape of the context value provided by ThemeContext.
 * @property {Theme} theme - Current theme mode.
 * @property {() => void} toggleTheme - Function to toggle the theme.
 */
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

/**
 * React context for the theme, possibly undefined before provider.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props for the ThemeProvider component.
 * @property {ReactNode} children - React child nodes.
 */
interface ThemeProviderProps {
    children: ReactNode;
}

/**
 * Provides the theme context to its children.
 * Initializes theme state from localStorage or defaults to "light".
 * Updates the `data-theme` attribute on `<html>` and syncs localStorage.
 * 
 * @param {ThemeProviderProps} props - Props including children elements.
 * @returns {JSX.Element} The ThemeContext provider wrapping children.
 */
export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem("theme") as Theme) || "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    /**
     * Toggles the current theme between "light" and "dark".
     */
    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Custom hook to access the current theme context.
 * Throws if used outside the ThemeProvider.
 * 
 * @throws {Error} When used outside of ThemeProvider.
 * @returns {ThemeContextType} The theme context value.
 */
export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
