import { useCallback } from 'react';
import { Box } from '@mui/material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingHero from '../components/landing/LandingHero';
import LandingServices from '../components/landing/LandingServices';
import LandingAbout from '../components/landing/LandingAbout';
import LandingContact from '../components/landing/LandingContact';
import LandingFooter from '../components/landing/LandingFooter';
import '../styles/landing.css';

export default function LandingPage() {
  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <Box className="landing-page">
      <LandingNavbar onNavigate={scrollToSection} />
      <LandingHero />
      <LandingServices />
      <LandingAbout />
      <LandingContact />
      <LandingFooter onNavigate={scrollToSection} />
    </Box>
  );
}
