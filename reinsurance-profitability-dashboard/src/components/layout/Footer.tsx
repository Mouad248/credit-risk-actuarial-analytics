import { BRAND } from '@/config/brand';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">{BRAND.name}</h3>
            <p className="text-gray-300 text-sm">{BRAND.tagline}</p>
            <p className="text-gray-300 text-sm mt-2">Projet personnel</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Technologies</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Frontend : React, TypeScript, Vite, Tailwind CSS</li>
              <li>Backend : Python, FastAPI, pandas</li>
              <li>Graphiques : Recharts</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-300 hover:text-blue-400 transition-colors">Dashboard</a></li>
              <li><a href="/subscription" className="text-gray-300 hover:text-blue-400 transition-colors">Rentabilité</a></li>
              <li><a href="/cedantes" className="text-gray-300 hover:text-blue-400 transition-colors">Cédantes</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-blue-400 transition-colors">À propos</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-300">&copy; {currentYear} {BRAND.name}. Projet personnel.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
