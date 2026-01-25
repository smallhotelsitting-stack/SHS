import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { t, language } = useLanguage();
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || language;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(`/${currentLang}`);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white shadow-soft-lg rounded-3xl p-10 border border-neutral-100">
        <Link
          to={`/${currentLang}`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.backToHome')}
        </Link>

        <div className="mb-8">
          <div className="bg-primary-500 p-3 inline-block rounded-2xl mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-normal text-neutral-900 mb-2"><span className="font-bold">{t('auth.welcomeBack')}</span></h1>
        <p className="text-neutral-600 mb-8">{t('auth.signInAccount')}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl text-red-700 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition text-base text-neutral-900"
              placeholder={t('auth.placeholder.email')}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition text-base text-neutral-900"
              placeholder={t('auth.placeholder.password')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary-500 text-white py-4 font-semibold rounded-full hover:bg-secondary-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? `${t('auth.signIn')}...` : t('auth.signIn')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-neutral-600">
            {t('auth.noAccount')}{' '}
            <Link to={`/${currentLang}/register`} className="text-secondary-600 hover:text-secondary-700 font-semibold">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
