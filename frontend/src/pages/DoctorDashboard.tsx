import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { DOCTOR_ENDPOINTS } from "@/lib/config";
import DoctorSidebar from "@/components/doctor/DoctorSidebar";
import DoctorAppointments from "@/components/doctor/DoctorAppointments";
import DoctorAvailability from "@/components/doctor/DoctorAvailability";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";

interface DoctorProfile {
    id: number;
    name: string;
    email: string;
    specialty: string;
    clinic_name: string;
    clinic_address: string;
    phone: string;
}

interface Appointment {
    id: number;
    start_time: string;
    end_time?: string;
    title?: string;
    description?: string;
    status: string;
    doctor_note?: string;
    patient_name?: string;
    patient_email?: string;
}

export default function DoctorDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [authReady, setAuthReady] = useState(false);

    // Wait for Firebase to restore auth state on refresh
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("Doctor dashboard - Firebase user restored:", user.email, user.uid);
                setAuthReady(true);
            } else {
                // Check if we have a saved doctor session
                const saved = sessionStorage.getItem("doctorUser");
                if (!saved) {
                    setError("Not logged in. Please login as a doctor first.");
                    setIsLoading(false);
                }
                setAuthReady(true);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch data only after auth is ready
    useEffect(() => {
        if (authReady) {
            fetchDoctorData();
        }
    }, [authReady]);

    const fetchDoctorData = async () => {
        try {
            setIsLoading(true);
            setError("");

            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                setError("Not logged in as a doctor. Please login at /doctor/auth first.");
                setIsLoading(false);
                return;
            }

            const token = await user.getIdToken();

            // Fetch profile and appointments in parallel
            const [profileRes, apptsRes] = await Promise.all([
                fetch(DOCTOR_ENDPOINTS.profile, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(DOCTOR_ENDPOINTS.appointments, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setDoctor(profileData.doctor);
            } else {
                const errData = await profileRes.json().catch(() => ({}));
                console.error("Profile fetch failed:", errData);
                setError(`Could not load doctor profile. You may be logged in as a patient. Please login at /doctor/auth first. (${errData.error || profileRes.statusText})`);
            }

            if (apptsRes.ok) {
                const apptsData = await apptsRes.json();
                setAppointments(apptsData.appointments || []);
            } else {
                const errData = await apptsRes.json().catch(() => ({}));
                console.error("Appointments fetch failed:", errData);
            }
        } catch (err: any) {
            console.error("Error fetching doctor data:", err);
            setError(err.message || "Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    const todayAppointments = appointments.filter((a) => {
        const today = new Date().toDateString();
        return new Date(a.start_time).toDateString() === today && a.status === "scheduled";
    });

    const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
    const completedCount = appointments.filter((a) => a.status === "completed").length;
    const uniquePatients = new Set(appointments.map((a) => a.patient_email).filter(Boolean)).size;

    const stats = [
        { label: "Today's Appointments", value: todayAppointments.length, icon: Calendar, color: "bg-blue-50 text-blue-600" },
        { label: "Scheduled", value: scheduledCount, icon: Clock, color: "bg-amber-50 text-amber-600" },
        { label: "Completed", value: completedCount, icon: CheckCircle, color: "bg-green-50 text-green-600" },
        { label: "Total Patients", value: uniquePatients, icon: Users, color: "bg-purple-50 text-purple-600" },
    ];

    return (
        <div className="flex h-screen w-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <DoctorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 overflow-auto">
                <header className="sticky top-0 z-10 bg-white border-b shadow-sm p-4">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {activeTab === "overview" && "Dashboard Overview"}
                            {activeTab === "appointments" && "Appointments"}
                            {activeTab === "availability" && "Availability Settings"}
                        </h1>
                        {doctor && (
                            <p className="text-gray-600 mt-1">
                                Welcome, <span className="font-semibold text-emerald-600">Dr. {doctor.name}</span>
                                {doctor.specialty && <span className="text-gray-400"> · {doctor.specialty}</span>}
                            </p>
                        )}
                    </div>
                </header>

                {error && (
                    <div className="max-w-7xl mx-auto px-6 pt-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                            <a href="/doctor/auth" className="text-red-600 underline text-sm font-medium mt-1 inline-block">
                                Go to Doctor Login →
                            </a>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto p-6">
                    {activeTab === "overview" && (
                        <div className="space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                                <p className="text-sm text-gray-500">{stat.label}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Today's Appointments */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Appointments</h2>
                                {todayAppointments.length > 0 ? (
                                    <DoctorAppointments
                                        appointments={todayAppointments}
                                        isLoading={isLoading}
                                        onRefresh={fetchDoctorData}
                                    />
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                                        <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                        <p className="text-gray-500">No appointments scheduled for today</p>
                                    </div>
                                )}
                            </div>

                            {/* Doctor Info Card */}
                            {doctor && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-gray-500">Name:</span> <span className="font-medium">Dr. {doctor.name}</span></div>
                                        <div><span className="text-gray-500">Specialty:</span> <span className="font-medium">{doctor.specialty || "—"}</span></div>
                                        <div><span className="text-gray-500">Clinic:</span> <span className="font-medium">{doctor.clinic_name || "—"}</span></div>
                                        <div><span className="text-gray-500">Email:</span> <span className="font-medium">{doctor.email}</span></div>
                                        <div><span className="text-gray-500">Address:</span> <span className="font-medium">{doctor.clinic_address || "—"}</span></div>
                                        <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{doctor.phone || "—"}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "appointments" && (
                        <DoctorAppointments
                            appointments={appointments}
                            isLoading={isLoading}
                            onRefresh={fetchDoctorData}
                        />
                    )}

                    {activeTab === "availability" && (
                        <DoctorAvailability />
                    )}
                </div>
            </main>
        </div>
    );
}
