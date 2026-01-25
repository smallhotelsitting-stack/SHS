import { useLanguage } from '../contexts/LanguageContext';
import { useLanguageNavigate } from '../hooks/useLanguageNavigate';
import { useAuth } from '../contexts/AuthContext';
import { Hotel, Briefcase, Shield, CheckCircle, Globe, Users, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PricingSection from '../components/PricingSection';

export default function Concept() {
  const { t, language } = useLanguage();
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || language;
  const navigate = useLanguageNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary-50 via-white to-house-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            to={`/${currentLang}`}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-neutral-900">{t('concept.title')}</h1>
            <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed">
              {t('concept.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">{t('concept.howItWorks')}</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              {t('concept.platformDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-br from-primary-50 to-cream-100 rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all border border-primary-100">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
                  <Hotel className="w-9 h-9 text-primary-700" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-primary-900 mb-4">{t('concept.forOwners')}</h3>
              <p className="text-neutral-700 mb-6 text-lg leading-relaxed">
                {t('concept.ownersDescription')}
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-neutral-800">{t('concept.verifiedSitters')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-neutral-800">{t('concept.propertyProtection')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-neutral-800">{t('concept.flexibleTerms')}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (user) {
                    navigate('/listings/new');
                  } else {
                    navigate('/register?role=owner');
                  }
                }}
                className="inline-flex items-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-full font-bold hover:bg-primary-800 hover:gap-4 transition-all shadow-md"
              >
                {t('home.postYourListing')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-secondary-50 to-cream-100 rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all border border-secondary-100">
              <div className="mb-6">
                <div className="w-16 h-16 bg-secondary-200 rounded-2xl flex items-center justify-center">
                  <Briefcase className="w-9 h-9 text-secondary-700" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-primary-900 mb-4">{t('concept.forSitters')}</h3>
              <p className="text-neutral-700 mb-6 text-lg leading-relaxed">
                {t('concept.sittersDescription')}
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-secondary-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-neutral-800">{t('concept.unlimitedSits')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-secondary-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-neutral-800">{t('concept.worldwideAccess')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-secondary-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-neutral-800">{t('concept.freeVerifications')}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (user) {
                    navigate('/listings/new');
                  } else {
                    navigate('/register?role=sitter');
                  }
                }}
                className="inline-flex items-center gap-2 bg-secondary-700 text-white px-6 py-3 rounded-full font-bold hover:bg-secondary-800 hover:gap-4 transition-all shadow-md"
              >
                {t('home.joinAsSitter')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">{t('concept.safetyTitle')}</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              {t('concept.safetyDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary-700" />
              </div>
              <h3 className="text-2xl font-bold text-primary-900 mb-4">{t('concept.verificationProcess')}</h3>
              <p className="text-neutral-600 leading-relaxed">
                {t('concept.verificationDescription')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary-700" />
              </div>
              <h3 className="text-2xl font-bold text-primary-900 mb-4">{t('concept.community')}</h3>
              <p className="text-neutral-600 leading-relaxed">
                {t('concept.communityDescription')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-primary-700" />
              </div>
              <h3 className="text-2xl font-bold text-primary-900 mb-4">{t('concept.support')}</h3>
              <p className="text-neutral-600 leading-relaxed">
                {t('concept.supportDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">{t('concept.whyChooseUs')}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary-700" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-900 mb-2">{t('concept.globalNetwork')}</h3>
                <p className="text-neutral-600">{t('concept.globalNetworkDescription')}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary-700" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-900 mb-2">{t('concept.topRated')}</h3>
                <p className="text-neutral-600">{t('concept.topRatedDescription')}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-700" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-900 mb-2">{t('concept.securePayments')}</h3>
                <p className="text-neutral-600">{t('concept.securePaymentsDescription')}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary-700" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-900 mb-2">{t('concept.easyProcess')}</h3>
                <p className="text-neutral-600">{t('concept.easyProcessDescription')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PricingSection />

      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-3 bg-secondary-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-secondary-600 transition-all shadow-lg"
          >
            {t('concept.getStarted')}
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
