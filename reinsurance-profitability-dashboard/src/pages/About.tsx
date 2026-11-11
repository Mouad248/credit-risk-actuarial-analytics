import { useState, useEffect } from 'react';
import { BarChart3, Users, Map, Server, CheckCircle2, Circle } from 'lucide-react';
import { BRAND } from '@/config/brand';
import Logo from '@/components/layout/Logo';

const About = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Fonctionnalités principales
  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-brand-primary-dark" />,
      title: 'Rentabilité technique',
      description: "Ratio S/P, ratio technique, profitabilité et chiffre d'affaires, avec filtres par région, produit, type d'affaires et ligne d'affaires."
    },
    {
      icon: <Users className="h-8 w-8 text-brand-primary-dark" />,
      title: 'Analyse par cédante',
      description: 'Recherche approchée, sélection multiple, tendances annuelles, mix contractuel, pays de risque et détail par branche.'
    },
    {
      icon: <Map className="h-8 w-8 text-brand-primary-dark" />,
      title: 'Carte interactive',
      description: 'Rentabilité par région sur une carte avec zoom, déplacement, légende filtrable et accessibilité clavier.'
    },
    {
      icon: <Server className="h-8 w-8 text-brand-primary-dark" />,
      title: 'API REST typée',
      description: 'Backend FastAPI avec modèles Pydantic, calculs vectorisés avec pandas et caches mémoire.'
    }
  ];

  // Feuille de route
  const roadmap = [
    { done: true, label: "Calcul des indicateurs (S/P, ratio technique, profitabilité, croissance)" },
    { done: true, label: 'Tableau de bord Rentabilité et page Cédantes' },
    { done: true, label: 'Filtres, classements et recherche approchée' },
    { done: false, label: 'Base de données et chargement planifié des données' },
    { done: false, label: 'Authentification et gestion des droits' },
    { done: false, label: 'Tests automatisés et intégration continue' },
    { done: false, label: 'Modules investissements, solvabilité et IFRS 17' },
    { done: false, label: 'Projection du S/P final (triangles de développement)' }
  ];

  const stack = [
    { group: 'Frontend', items: 'React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, TanStack Query' },
    { group: 'Backend', items: 'Python, FastAPI, Pydantic, pandas, NumPy, RapidFuzz' },
    { group: 'Outils', items: 'ESLint, tests unitaires (carte, tableaux, hooks)' }
  ];

  return (
    <div className={`min-h-screen flex flex-col pt-20 pb-16 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* En-tête */}
      <section className="py-12 px-4 md:px-6 bg-gradient-to-r from-brand-gray-light to-brand-primary-light/20">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-dark mb-4 animate-fade-in">
            À propos de {BRAND.name}
          </h1>
          <p className="text-lg text-brand-gray max-w-3xl animate-fade-in">
            {BRAND.tagline}. Un projet personnel d'analyse de données et de génie logiciel, conçu pour évoluer.
          </p>
        </div>
      </section>

      {/* Présentation */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 flex justify-center">
              <Logo className="scale-[2.2] origin-center my-8" />
            </div>

            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-brand-gray-dark mb-6">Le projet</h2>
              <p className="text-lg text-brand-gray mb-6">
                {BRAND.description}
              </p>
              <p className="text-lg text-brand-gray mb-6">
                L'objectif est de passer d'un fichier de données volumineux à un outil de lecture rapide : repérer les cédantes, les régions
                et les lignes d'affaires qui créent ou détruisent de la valeur, puis descendre jusqu'au détail d'un contrat.
              </p>
              <div className="bg-brand-primary-dark/10 border-l-4 border-brand-primary-dark p-4 rounded">
                <p className="text-brand-gray-dark italic">
                  Les pages Rentabilité et Cédantes utilisent les données chargées par l'API ; l'accueil et les pages Investissements et
                  Risques présentent des valeurs d'exemple.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-16 px-4 md:px-6 bg-brand-gray-light/10">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-brand-gray-dark mb-12 text-center">Fonctionnalités</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-card card-hover-effect text-center">
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-brand-gray-dark mb-3">{feature.title}</h3>
                <p className="text-brand-gray">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-brand-gray-dark mb-10 text-center">Technologies</h2>
          <div className="space-y-4">
            {stack.map((s) => (
              <div key={s.group} className="glass-card flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <h3 className="text-lg font-semibold text-brand-primary-dark md:w-40">{s.group}</h3>
                <p className="text-brand-gray">{s.items}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feuille de route */}
      <section className="py-16 px-4 md:px-6 bg-brand-gray-dark text-white">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-10 text-center">Feuille de route</h2>
          <ul className="space-y-3">
            {roadmap.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-brand-primary-light shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 mt-0.5 text-brand-gray-light shrink-0" />
                )}
                <span className={item.done ? 'text-white' : 'text-brand-gray-light'}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default About;
