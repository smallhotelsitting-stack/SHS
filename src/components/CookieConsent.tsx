import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const saveConsent = async (acceptAll: boolean = false) => {
    const finalPrefs = acceptAll ? { necessary: true, analytics: true, marketing: true } : preferences;

    localStorage.setItem('cookie_consent', JSON.stringify(finalPrefs));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());

    if (user) {
      await supabase.from('gdpr_consents').insert([
        { user_id: user.id, consent_type: 'cookies', granted: finalPrefs.necessary },
        { user_id: user.id, consent_type: 'analytics', granted: finalPrefs.analytics },
        { user_id: user.id, consent_type: 'marketing', granted: finalPrefs.marketing }
      ]);
    }

    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-white rounded-3xl shadow-soft-lg border border-neutral-200 z-50 p-6">
      <div className="">
        <div className="flex items-start gap-4">
          <div className="bg-primary-100 p-3 rounded-2xl">
            <Cookie className="w-6 h-6 text-primary-700" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary-900 mb-2">Cookie Preferences</h3>
            <p className="text-sm text-neutral-600 mb-4">
              We use cookies to enhance your experience, analyze site traffic, and provide personalized content.
              You can customize your preferences or accept all cookies.
            </p>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="w-4 h-4 text-primary-700 rounded"
                />
                <span className="text-neutral-700">
                  <strong>Necessary</strong> - Required for site functionality (Always enabled)
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="w-4 h-4 text-primary-700 rounded cursor-pointer"
                />
                <span className="text-neutral-700">
                  <strong>Analytics</strong> - Help us improve by analyzing site usage
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="w-4 h-4 text-primary-700 rounded cursor-pointer"
                />
                <span className="text-neutral-700">
                  <strong>Marketing</strong> - Personalized content and ads
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => saveConsent(true)}
                className="px-5 py-2.5 bg-primary-700 text-white rounded-full hover:bg-primary-800 transition-all font-semibold text-sm shadow-md"
              >
                Accept All
              </button>
              <button
                onClick={() => saveConsent(false)}
                className="px-5 py-2.5 bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-all font-semibold text-sm"
              >
                Save Preferences
              </button>
              <button
                onClick={() => {
                  setPreferences({ necessary: true, analytics: false, marketing: false });
                  saveConsent(false);
                }}
                className="px-5 py-2.5 border-2 border-neutral-300 text-neutral-700 rounded-full hover:bg-neutral-50 transition-all font-semibold text-sm"
              >
                Reject All
              </button>
            </div>
          </div>

          <button
            onClick={() => saveConsent(false)}
            className="text-neutral-400 hover:text-neutral-600 transition p-1 rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
