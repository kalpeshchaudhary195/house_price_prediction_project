import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Layout from './components/Layout.jsx';

import Home from './pages/Home.jsx';
import Prediction from './pages/Prediction.jsx';
import Properties from './pages/Properties.jsx';
import Analytics from './pages/Analytics.jsx';
import History from './pages/History.jsx';
import ModelPerformance from './pages/ModelPerformance.jsx';
import Settings from './pages/Settings.jsx';
import About from './pages/About.jsx';
import Features from './pages/Features.jsx';
import Feedback from './pages/Feedback.jsx';
import Contact from './pages/Contact.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* 7 Core Requested Navigation Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<History />} />
            <Route path="/model-performance" element={<ModelPerformance />} />
            <Route path="/settings" element={<Settings />} />

            {/* Preserved Secondary Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Route>
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  );
}
