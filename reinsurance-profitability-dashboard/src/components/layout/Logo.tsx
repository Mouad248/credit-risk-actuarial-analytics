import { BRAND } from '@/config/brand';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

// Logo générique : un pictogramme de barres (indicateurs) et le nom du projet.
const Logo = ({ className = '', showText = true }: LogoProps) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <svg width="36" height="36" viewBox="0 0 36 36" role="img" aria-label={`Logo ${BRAND.name}`}>
      <rect width="36" height="36" rx="9" fill="#2563eb" />
      <rect x="8" y="19" width="5" height="9" rx="1.5" fill="#fff" />
      <rect x="15.5" y="13" width="5" height="15" rx="1.5" fill="#fff" opacity="0.9" />
      <rect x="23" y="8" width="5" height="20" rx="1.5" fill="#fff" opacity="0.8" />
    </svg>
    {showText && <span className="text-xl font-semibold tracking-tight text-brand-gray-dark">{BRAND.name}</span>}
  </span>
);

export default Logo;
