import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, languages, type Language } from '../contexts/LanguageContext';
import { Menu, X, Search, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getTranslatedContent } from '../utils/translations';
import type { Listing } from '../types/database';
import CookieConsent from './CookieConsent';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || language;
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Listing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      setMenuOpen(false);
      await signOut();
      navigate(`/${currentLang}/login`, { replace: true });
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still navigate to login even if there's an error
      navigate(`/${currentLang}/login`, { replace: true });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchListings = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
          .eq('status', 'active')
          .is('deleted_at', null)
          .limit(5)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      searchListings();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/${currentLang}?search=${encodeURIComponent(searchTerm)}`);
      setSearchOpen(false);
      setSearchResults([]);
      setSearchTerm('');
    }
  };

  const handleResultClick = (slug: string) => {
    navigate(`/${currentLang}/listing/${slug}`);
    setSearchOpen(false);
    setSearchResults([]);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-neutral-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16 md:h-20 lg:h-24">
            {/* Left Section: Icon Logo */}
            <div className="flex items-center">
              <Link to={`/${currentLang}`} className="flex items-center transition-transform hover:scale-[1.05]">
                <img
                  src="/system-images/left_icon_logo.png?v=2"
                  alt="Small Hotel Sitting Icon"
                  className="h-12 md:h-16 lg:h-20 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Center Section: Absolute Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] z-10">
              <Link to={`/${currentLang}`} className="flex items-center transition-transform hover:scale-[1.05]">
                <img
                  src="/system-images/banner_logo_v2.png?v=2"
                  alt="Small Hotel Sitting Logo"
                  className="h-24 md:h-44 lg:h-64 w-auto object-contain drop-shadow-sm"
                />
              </Link>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-1 md:gap-3 z-20">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 hover:bg-neutral-50 transition-colors rounded-full text-neutral-500 hover:text-primary-600"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Desktop Auth Section */}
              <div className="hidden md:flex items-center gap-4">
                {!user ? (
                  <>
                    <Link
                      to={`/${currentLang}/login`}
                      className="text-sm font-bold text-neutral-700 hover:text-primary-600 px-2"
                    >
                      {t('nav.signIn')}
                    </Link>
                    <Link
                      to={`/${currentLang}/register`}
                      className="bg-primary-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/10 transition-all hover:scale-105"
                    >
                      {t('nav.signUp')}
                    </Link>
                  </>
                ) : (
                  <Link
                    to={`/${currentLang}/profile`}
                    className="flex items-center gap-2 bg-neutral-50 border border-neutral-100 rounded-full px-4 py-1.5 hover:bg-neutral-100 transition-all"
                  >
                    <span className="text-sm font-bold text-neutral-700">{profile?.name?.split(' ')[0] || 'Profile'}</span>
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase">
                      {profile?.name?.[0] || user.email?.[0] || 'U'}
                    </div>
                  </Link>
                )}
              </div>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 hover:bg-neutral-50 transition-all rounded-full border border-neutral-100 shadow-sm"
                >
                  <span className="text-xl leading-none">{languages.find(l => l.code === language)?.flag}</span>
                </button>
                {languageMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white shadow-2xl border border-neutral-100 rounded-2xl py-2 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLanguageMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 transition-colors flex items-center space-x-3 hover:bg-neutral-50 ${language === lang.code ? 'text-primary-600 font-bold' : 'text-neutral-700'
                          }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hamburger Menu */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2.5 hover:bg-neutral-50 transition-colors rounded-full text-neutral-500"
                aria-label="Menu"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-neutral-200 bg-white py-4">
            <div className="px-4 relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('home.search')}
                  className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </form>

              {searchTerm.length >= 2 && (
                <div className="absolute left-4 right-4 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="px-4 py-3 text-center text-neutral-500">
                      {t('home.searching')}...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((listing) => {
                        const content = getTranslatedContent(
                          { title: listing.title, description: listing.description, location: listing.location },
                          listing.translations as any,
                          currentLang as Language
                        );
                        return (
                          <button
                            key={listing.id}
                            onClick={() => handleResultClick(listing.slug)}
                            className="w-full px-4 py-3 hover:bg-neutral-50 transition-colors text-left flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 mt-1">
                              <MapPin className="w-4 h-4 text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-900 truncate">{content.title}</p>
                              <p className="text-sm text-neutral-600 truncate">{content.location}</p>
                              <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{content.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-center text-neutral-500">
                      {t('home.noResults')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {menuOpen && (
          <div className="border-t border-neutral-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {user && profile ? (
                <>
                  <Link
                    to={`/${currentLang}/listings/new`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 bg-secondary-500 text-white font-semibold text-center hover:bg-secondary-600 transition-all rounded-full"
                  >
                    {t('nav.post')}
                  </Link>
                  <Link
                    to={`/${currentLang}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.browse')}
                  </Link>
                  <Link
                    to={`/${currentLang}/all-listings`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.allListings') || 'All Listings'}
                  </Link>
                  <Link
                    to={`/${currentLang}/inbox`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.messages')}
                  </Link>
                  <Link
                    to={`/${currentLang}/concept`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.concept')}
                  </Link>
                  {profile.role === 'admin' && (
                    <Link
                      to={`/${currentLang}/admin`}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-neutral-700 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
                    >
                      {t('nav.admin')}
                    </Link>
                  )}
                  <hr className="my-2 border-neutral-200" />
                  <Link
                    to={`/${currentLang}/profile`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.myProfile')}
                  </Link>
                  <Link
                    to={`/${currentLang}/my-listings`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.myListings')}
                  </Link>
                  <Link
                    to={`/${currentLang}/verification`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.verification')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    {t('nav.signOut')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={`/${currentLang}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.browse')}
                  </Link>
                  <Link
                    to={`/${currentLang}/all-listings`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.allListings') || 'All Listings'}
                  </Link>
                  <Link
                    to={`/${currentLang}/concept`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors font-medium"
                  >
                    {t('nav.concept')}
                  </Link>
                  <hr className="my-2 border-neutral-200" />
                  <Link
                    to={`/${currentLang}/login`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 bg-secondary-500 text-white font-semibold text-center hover:bg-secondary-600 transition-all rounded-full"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    to={`/${currentLang}/register`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-secondary-600 border-2 border-secondary-500 font-semibold text-center hover:bg-secondary-50 transition-all rounded-full"
                  >
                    {t('nav.signUp')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        {children}
      </main>

      <footer className="bg-white text-neutral-900 border-t border-neutral-200 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <img src="/system-images/banner_logo_v2.png?v=2" alt="Small Hotel Sitting Logo" className="w-56 md:w-64 object-contain" />
              </div>
              <div className="flex justify-center items-center gap-6 mb-4">
                <Link
                  to={`/${currentLang}/concept`}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
                >
                  {t('footer.howItWorks')}
                </Link>
                <a
                  href="mailto:contact@smallhotelsitting.com"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
                >
                  {t('footer.contactUs')}
                </a>
                <Link
                  to={`/${currentLang}/register`}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
                >
                  {t('footer.joinNow')}
                </Link>
              </div>
              <p className="text-neutral-600 text-xs">
                &copy; 2025 Small Hotel Sitting. {t('footer.allRightsReserved')}
              </p>
            </div>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div >
  );
}
