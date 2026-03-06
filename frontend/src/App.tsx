import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// Eager load essential pages
import HealixLandingPage from "./pages/landing";
import AuthPage from "./pages/signin";

// Lazy load other pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HealthRecords = lazy(() => import("./pages/HealthRecords"));
const MediChatPage = lazy(() => import("./pages/Medichat"));
const MedicineReminderPage = lazy(() => import("./pages/Reminder"));
const MedicinePricePage = lazy(() => import("./pages/MedicinePrice"));
const NearbyServicesPage = lazy(() => import("./pages/Findservices"));
const Appointments = lazy(() => import("./pages/Appointments"));
const PremiumPredictor = lazy(() => import("./pages/PremiumPredictor"));
const UserProfilePage = lazy(() => import("./pages/UserProfile"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-semibold">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HealixLandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/userdashboard/:uid" element={<Dashboard />} />
            <Route path="/healthrecords/:uid" element={<HealthRecords />} />
            <Route path="/medichat/:uid" element={<MediChatPage />} />
            <Route path="/reminder/:uid" element={<MedicineReminderPage />} />
            <Route path="/medicineprice/:uid" element={<MedicinePricePage />} />
            <Route
              path="/nearby-services/:uid"
              element={<NearbyServicesPage />}
            />
            <Route path="/appointments/:uid" element={<Appointments />} />
            <Route
              path="/premium-predictor/:uid"
              element={<PremiumPredictor />}
            />
            <Route path="/user-profile/:uid" element={<UserProfilePage />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;
