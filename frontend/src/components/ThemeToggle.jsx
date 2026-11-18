import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-switch"
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
    >
      <span className="switch-ball"></span>
    </button>
  );
}
