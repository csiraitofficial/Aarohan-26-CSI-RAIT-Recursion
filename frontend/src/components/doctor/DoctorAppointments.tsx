import { useState } from "react";
import { getAuth } from "firebase/auth";
import { DOCTOR_ENDPOINTS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, MessageSquare, Clock, User, Mail, FileText, Calendar } from "lucide-react";

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

interface DoctorAppointmentsProps {
    appointments: Appointment[];
    isLoading: boolean;
    onRefresh: () => void;
}

export default function DoctorAppointments({ appointments, isLoading, onRefresh }: DoctorAppointmentsProps) {
    const [noteModalId, setNoteModalId] = useState<number | null>(null);
    const [noteText, setNoteText] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const getToken = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");
        return user.getIdToken();
    };

    const handleCancel = async (id: number) => {
        try {
            setActionLoading(id);
            const token = await getToken();
            const res = await fetch(DOCTOR_ENDPOINTS.cancelAppointment(String(id)), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to cancel");
            onRefresh();
        } catch (err) {
            console.error("Cancel error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (id: number) => {
        try {
            setActionLoading(id);
            const token = await getToken();
            const res = await fetch(DOCTOR_ENDPOINTS.completeAppointment(String(id)), {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to complete");
            onRefresh();
        } catch (err) {
            console.error("Complete error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendNote = async (id: number) => {
        try {
            setActionLoading(id);
            const token = await getToken();
            const res = await fetch(DOCTOR_ENDPOINTS.noteAppointment(String(id)), {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ note: noteText }),
            });
            if (!res.ok) throw new Error("Failed to send note");
            setNoteModalId(null);
            setNoteText("");
            onRefresh();
        } catch (err) {
            console.error("Note error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            scheduled: "bg-blue-100 text-blue-700",
            completed: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500">No appointments yet</h3>
                <p className="text-gray-400 mt-1">Appointments booked by patients will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">{appt.title || "Appointment"}</h3>
                                {getStatusBadge(appt.status)}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{formatDate(appt.start_time)} at {formatTime(appt.start_time)}</span>
                                </div>
                                {appt.patient_name && (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span>{appt.patient_name}</span>
                                    </div>
                                )}
                                {appt.patient_email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span>{appt.patient_email}</span>
                                    </div>
                                )}
                                {appt.doctor_note && (
                                    <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 rounded-lg">
                                        <FileText className="h-4 w-4 text-yellow-600 mt-0.5" />
                                        <span className="text-yellow-800">{appt.doctor_note}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {appt.status === "scheduled" && (
                            <div className="flex gap-2 ml-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => handleComplete(appt.id)}
                                    disabled={actionLoading === appt.id}
                                >
                                    <CheckCircle className="h-4 w-4 mr-1" /> Complete
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleCancel(appt.id)}
                                    disabled={actionLoading === appt.id}
                                >
                                    <XCircle className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={() => { setNoteModalId(appt.id); setNoteText(appt.doctor_note || ""); }}
                                    disabled={actionLoading === appt.id}
                                >
                                    <MessageSquare className="h-4 w-4 mr-1" /> Note
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Note Modal */}
            {noteModalId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Note to Patient</h3>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg p-3 h-32 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            placeholder="Write your note here..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => { setNoteModalId(null); setNoteText(""); }}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleSendNote(noteModalId)}
                                disabled={!noteText.trim() || actionLoading === noteModalId}
                            >
                                {actionLoading === noteModalId ? "Sending..." : "Send Note"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
