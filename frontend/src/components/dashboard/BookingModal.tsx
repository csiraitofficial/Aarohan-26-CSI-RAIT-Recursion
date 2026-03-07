import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { DOCTOR_ENDPOINTS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { X, Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface BookingModalProps {
    doctor: {
        id: number;
        name: string;
        specialty?: string;
        clinic_name?: string;
    };
    onClose: () => void;
    onBooked: () => void;
}

interface Slot {
    time: string;
    display_time: string;
    available: boolean;
}

export default function BookingModal({ doctor, onClose, onBooked }: BookingModalProps) {
    const [selectedDate, setSelectedDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    });
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [message, setMessage] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const getToken = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");
        return user.getIdToken();
    };

    useEffect(() => {
        fetchSlots();
    }, [selectedDate]);

    const fetchSlots = async () => {
        try {
            setIsLoading(true);
            setSelectedSlot(null);
            setMessage("");
            const token = await getToken();
            const res = await fetch(DOCTOR_ENDPOINTS.doctorSlots(doctor.id, selectedDate), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.slots) {
                setSlots(data.slots);
                if (data.slots.length === 0) {
                    setMessage("No availability on this date. Try another day.");
                }
            } else {
                setSlots([]);
                setMessage(data.message || "No slots available");
            }
        } catch (err) {
            console.error("Error fetching slots:", err);
            setMessage("Failed to load available slots");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedSlot) return;

        try {
            setIsBooking(true);
            const token = await getToken();
            const res = await fetch(DOCTOR_ENDPOINTS.bookDoctor, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    doctor_id: doctor.id,
                    start_time: selectedSlot,
                    title: `Appointment with Dr. ${doctor.name}`,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Booking failed");
            }

            setBookingSuccess(true);
            setTimeout(() => {
                onBooked();
                onClose();
            }, 2000);
        } catch (err: any) {
            setMessage(err.message || "Failed to book appointment");
        } finally {
            setIsBooking(false);
        }
    };

    const changeDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d >= today) {
            setSelectedDate(d.toISOString().split("T")[0]);
        }
    };

    const formatDisplayDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    if (bookingSuccess) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Appointment Booked!</h3>
                    <p className="text-gray-600">
                        Your appointment with Dr. {doctor.name} has been confirmed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold">Book Appointment</h3>
                            <p className="text-blue-100 text-sm mt-1">
                                Dr. {doctor.name} {doctor.specialty && `· ${doctor.specialty}`}
                            </p>
                            {doctor.clinic_name && (
                                <p className="text-blue-200 text-xs mt-0.5">{doctor.clinic_name}</p>
                            )}
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-5 overflow-y-auto max-h-[60vh]">
                    {/* Date Selector */}
                    <div className="mb-5">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Select Date
                        </label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatDisplayDate(selectedDate)}</p>
                    </div>

                    {/* Slots */}
                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            <Clock className="inline h-4 w-4 mr-1" />
                            Available Slots
                        </label>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
                            </div>
                        ) : slots.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {slots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        onClick={() => slot.available && setSelectedSlot(slot.time)}
                                        disabled={!slot.available}
                                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedSlot === slot.time
                                                ? "bg-blue-600 text-white shadow-md"
                                                : slot.available
                                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                            }`}
                                    >
                                        {slot.display_time}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        {message && (
                            <p className="text-sm text-amber-600 mt-3 bg-amber-50 p-3 rounded-lg">{message}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t p-5 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleBook}
                        disabled={!selectedSlot || isBooking}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isBooking ? "Booking..." : "Confirm Booking"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
