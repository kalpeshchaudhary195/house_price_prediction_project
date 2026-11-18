import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  const { theme } = useTheme();

  return (
    <div className="site-wrapper" data-theme={theme}>
      <ThemeToggle />
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
