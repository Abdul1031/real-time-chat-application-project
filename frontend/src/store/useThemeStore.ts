import { create } from "zustand";

// this is the theme store, it will keep which theme is selected
interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
}

// this zustand store is handling theme (like dark, light, coffee etc.)
export const useThemeStore = create<ThemeState>((set) => ({
  // theme is saved in local storage, if nothing is there we use "coffee" as default
  theme: localStorage.getItem("chat-theme") || "coffee",

  // this function updates the theme and also saves it in local storage
  setTheme: (theme: string) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
