import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import LanguageRouter from './components/LanguageRouter';
import Layout from './components/Layout';
import Home from './pages/Home';
import AllListings from './pages/AllListings';
import Concept from './pages/Concept';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import MyListings from './pages/MyListings';
import Inbox from './pages/Inbox';
import Thread from './pages/Thread';
import Profile from './pages/Profile';
import Verification from './pages/Verification';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <LanguageRouter>
          <AuthProvider>
            <Routes>
              <Route path="/:lang/login" element={<Login />} />
              <Route path="/:lang/register" element={<Register />} />

              <Route
                path="/:lang"
                element={
                  <Layout>
                    <Home />
                  </Layout>
                }
              />

              <Route
                path="/:lang/all-listings"
                element={
                  <Layout>
                    <AllListings />
                  </Layout>
                }
              />

              <Route
                path="/:lang/concept"
                element={
                  <Layout>
                    <Concept />
                  </Layout>
                }
              />

              <Route
                path="/:lang/listings/:id"
                element={
                  <Layout>
                    <ListingDetail />
                  </Layout>
                }
              />

              <Route
                path="/:lang/listing/:slug"
                element={
                  <Layout>
                    <ListingDetail />
                  </Layout>
                }
              />

              <Route
                path="/:lang/listings/new"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateListing />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/listings/:id/edit"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditListing />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/my-listings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MyListings />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/inbox"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Inbox />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/inbox/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Thread />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/verification"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Verification />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/checkout/:planSlug"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Checkout />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/:lang/checkout/success"
                element={
                  <Layout>
                    <CheckoutSuccess />
                  </Layout>
                }
              />

              <Route path="/" element={<Navigate to="/en" replace />} />
              <Route path="*" element={<Navigate to="/en" replace />} />
            </Routes>
          </AuthProvider>
        </LanguageRouter>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
