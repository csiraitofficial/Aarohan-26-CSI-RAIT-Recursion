import { Calendar, Clock, Activity, LogOut, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";


interface DoctorSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function DoctorSidebar({ activeTab, setActiveTab }: DoctorSidebarProps) {

    const handleLogout = () => {
        toast((t) => (
            <div className="flex flex-col space-y-2">
                <p className="text-sm">Are you sure you want to logout?</p>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => {
                            signOut(auth)
                                .then(() => {
                                    sessionStorage.removeItem("doctorUser");
                                    window.location.href = "/";
                                    toast.dismiss(t.id);
                                })
                                .catch((error) => {
                                    console.error("Sign-out error:", error);
                                    toast.dismiss(t.id);
                                });
                        }}
                    >
                        Yes
                    </Button>
                    <Button variant="outline" onClick={() => toast.dismiss(t.id)}>
                        No
                    </Button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const getButtonClass = (tabName: string) => {
        const isActive = activeTab === tabName;
        return `w-full justify-start ${isActive
            ? "bg-emerald-500 !text-white hover:bg-emerald-600"
            : "bg-transparent !text-gray-600 hover:!text-emerald-500 hover:bg-emerald-50"
            }`;
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
            <div className="flex items-center space-x-2 mb-8">
                <div className="p-2 bg-emerald-100 rounded-lg">
                    <Stethoscope className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <span className="text-xl font-bold text-emerald-800 block">Healix</span>
                    <span className="text-xs text-gray-500">Doctor Portal</span>
                </div>
            </div>

            <nav className="space-y-2 flex-1">
                <Button
                    variant={activeTab === "overview" ? "default" : "ghost"}
                    className={getButtonClass("overview")}
                    onClick={() => setActiveTab("overview")}
                >
                    <Activity className="mr-2 h-4 w-4" />
                    Overview
                </Button>
                <Button
                    variant={activeTab === "appointments" ? "default" : "ghost"}
                    className={getButtonClass("appointments")}
                    onClick={() => setActiveTab("appointments")}
                >
                    <Calendar className="mr-2 h-4 w-4" />
                    Appointments
                </Button>
                <Button
                    variant={activeTab === "availability" ? "default" : "ghost"}
                    className={getButtonClass("availability")}
                    onClick={() => setActiveTab("availability")}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    Availability
                </Button>
            </nav>

            <div className="space-y-2 pt-4 border-t border-gray-200">
                <Button
                    variant="ghost"
                    className="w-full justify-start bg-red-500 !text-white hover:bg-red-600"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}
