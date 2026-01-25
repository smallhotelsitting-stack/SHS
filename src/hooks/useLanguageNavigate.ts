import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function useLanguageNavigate() {
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { language } = useLanguage();

  const currentLang = lang || language;

  const languageNavigate = (path: string, options?: { replace?: boolean }) => {
    const pathWithLang = path.startsWith('/') ? `/${currentLang}${path}` : `/${currentLang}/${path}`;
    navigate(pathWithLang, options);
  };

  return languageNavigate;
}
