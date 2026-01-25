import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Download, Home as HomeIcon } from 'lucide-react';

export default function CheckoutSuccess() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    if (!user) {
      navigate(`/${lang}/login`);
      return;
    }

    const state = location.state as { planName?: string };
    if (state?.planName) {
      setPlanName(state.planName);
    }

    refreshProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-12 text-white text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100">Your subscription is now active</p>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Welcome to {planName}!</h3>
              <ul className="space-y-3 text-neutral-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Your account has been upgraded successfully</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You'll be billed annually on your renewal date</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Check your email for a receipt and confirmation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>All premium features are now available</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-neutral-200 pt-8">
              <h3 className="font-semibold text-neutral-900 mb-4">What's Next?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  to={`/${lang}/profile`}
                  className="p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <p className="font-semibold text-primary-900 mb-1">View Your Profile</p>
                  <p className="text-sm text-primary-700">See your new premium badge</p>
                </Link>
                <Link
                  to={`/${lang}/listings/new`}
                  className="p-4 bg-secondary-50 border border-secondary-200 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <p className="font-semibold text-secondary-900 mb-1">Create a Listing</p>
                  <p className="text-sm text-secondary-700">Start enjoying premium features</p>
                </Link>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to={`/${lang}`}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <HomeIcon className="w-5 h-5" />
                Back to Home
              </Link>
              <button
                onClick={() => window.print()}
                className="flex-1 bg-neutral-100 text-neutral-900 px-6 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Receipt
              </button>
            </div>

            <div className="bg-neutral-50 rounded-lg p-6 text-center text-sm text-neutral-600">
              <p className="mb-2">Need help or have questions?</p>
              <a
                href="mailto:support@smallhotelsitting.com"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Contact our support team
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
