import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Remet la page en haut à chaque changement de route (sinon la nouvelle page s'ouvre
// à la position de défilement de la précédente et semble en faire partie).
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
