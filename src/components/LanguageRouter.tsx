import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Language } from '../contexts/LanguageContext';

const supportedLanguages: Language[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja'];

export default function LanguageRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];

    if (!supportedLanguages.includes(firstPart as Language)) {
      const savedLang = localStorage.getItem('language') as Language;
      const browserLang = navigator.language.split('-')[0] as Language;
      const defaultLang = supportedLanguages.includes(savedLang) ? savedLang :
                          supportedLanguages.includes(browserLang) ? browserLang : 'en';

      const newPath = `/${defaultLang}${location.pathname}${location.search}`;
      navigate(newPath, { replace: true });
    }
  }, [location, navigate]);

  return <>{children}</>;
}
