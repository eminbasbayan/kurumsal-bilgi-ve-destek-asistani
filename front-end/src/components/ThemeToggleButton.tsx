import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { IconButton, Theme, Tooltip } from "@radix-ui/themes";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

export type ThemeAppearance = "light" | "dark";

const STORAGE_KEY = "portal-appearance";

const ThemeAppearanceContext = createContext<{
  appearance: ThemeAppearance;
  toggleAppearance: () => void;
} | null>(null);

function readAppearance(): ThemeAppearance {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function AppTheme({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<ThemeAppearance>(readAppearance);

  useLayoutEffect(() => {
    document.documentElement.dataset.appearance = appearance;
    localStorage.setItem(STORAGE_KEY, appearance);
  }, [appearance]);

  const toggleAppearance = () =>
    setAppearance((current) => (current === "light" ? "dark" : "light"));

  return (
    <ThemeAppearanceContext.Provider value={{ appearance, toggleAppearance }}>
      <Theme
        accentColor="blue"
        appearance={appearance}
        grayColor="slate"
        radius="medium"
        scaling="100%"
      >
        {children}
      </Theme>
    </ThemeAppearanceContext.Provider>
  );
}

export function ThemeToggleButton() {
  const theme = useContext(ThemeAppearanceContext);
  if (!theme) return null;
  const isDark = theme.appearance === "dark";
  const label = isDark ? "Açık temaya geç" : "Koyu temaya geç";
  return (
    <Tooltip content={label}>
      <IconButton variant="soft" aria-label={label} onClick={theme.toggleAppearance}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </IconButton>
    </Tooltip>
  );
}
