import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserPlus, Home, Hotel, ArrowLeft } from 'lucide-react';

export default function Register() {
  const { t, language } = useLanguage();
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || language;
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'owner') {
      setRole('host');
    } else if (roleParam === 'sitter') {
      setRole('guest');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, name, role);
      navigate(`/${currentLang}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white shadow-soft-lg rounded-3xl p-10 border border-neutral-100">
        <Link
          to={`/${currentLang}`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.backToHome')}
        </Link>

        <div className="mb-8">
          <div className="bg-secondary-500 p-3 inline-block rounded-2xl mb-6">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-normal text-neutral-900 mb-2"><span className="font-bold">{t('auth.createAccount')}</span></h1>
        <p className="text-neutral-600 mb-8">{t('auth.joinCommunity')}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl text-red-700 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-4">
              {t('auth.iWantTo')}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('guest')}
                className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${
                  role === 'guest'
                    ? 'border-secondary-500 bg-secondary-50 shadow-md'
                    : 'border-neutral-200 hover:border-neutral-300 hover:shadow-soft'
                }`}
              >
                <Home className={`w-10 h-10 mb-3 ${role === 'guest' ? 'text-secondary-600' : 'text-neutral-600'}`} />
                <span className={`font-semibold text-sm ${role === 'guest' ? 'text-secondary-900' : 'text-neutral-900'}`}>
                  {t('auth.beaSitter')}
                </span>
                <span className="text-xs text-neutral-500 mt-2 text-center">
                  {t('auth.offerServices')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('host')}
                className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${
                  role === 'host'
                    ? 'border-secondary-500 bg-secondary-50 shadow-md'
                    : 'border-neutral-200 hover:border-neutral-300 hover:shadow-soft'
                }`}
              >
                <Hotel className={`w-10 h-10 mb-3 ${role === 'host' ? 'text-secondary-600' : 'text-neutral-600'}`} />
                <span className={`font-semibold text-sm ${role === 'host' ? 'text-secondary-900' : 'text-neutral-900'}`}>
                  {t('auth.findSitter')}
                </span>
                <span className="text-xs text-neutral-500 mt-2 text-center">
                  {t('auth.requestHelp')}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-neutral-700 mb-2">
              {t('auth.name')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 outline-none transition text-base text-neutral-900"
              placeholder={t('auth.placeholder.name')}
            />
          </div>

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
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 outline-none transition text-base text-neutral-900"
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
              minLength={6}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 outline-none transition text-base text-neutral-900"
              placeholder={t('auth.placeholder.password')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary-500 text-white py-4 font-semibold rounded-full hover:bg-secondary-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? `${t('auth.createAccount')}...` : t('auth.createAccount')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-neutral-600">
            {t('auth.haveAccount')}{' '}
            <Link to={`/${currentLang}/login`} className="text-secondary-600 hover:text-secondary-700 font-semibold">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
