import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { DOCTOR_ENDPOINTS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Trash2, Save } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface AvailabilitySlot {
    id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export default function DoctorAvailability() {
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const getToken = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");
        return user.getIdToken();
    };

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            setIsLoading(true);
            const token = await getToken();
            const res = await fetch(DOCTOR_ENDPOINTS.availability, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.availability && data.availability.length > 0) {
                setSlots(data.availability);
            } else {
                // Default: Mon-Fri 9:00-17:00
                setSlots(
                    [1, 2, 3, 4, 5].map((day) => ({
                        day_of_week: day,
                        start_time: "09:00",
                        end_time: "17:00",
                        is_active: true,
                    }))
                );
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveMessage("");
            const token = await getToken();
            const res = await fetch(DOCTOR_ENDPOINTS.availability, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ slots }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setSaveMessage("Availability saved successfully!");
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (err) {
            console.error("Error saving availability:", err);
            setSaveMessage("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const addSlot = () => {
        setSlots([...slots, { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_active: true }]);
    };

    const removeSlot = (index: number) => {
        setSlots(slots.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
        const updated = [...slots];
        (updated[index] as any)[field] = value;
        setSlots(updated);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Set Your Availability</h2>
                    <p className="text-sm text-gray-500 mt-1">Define when patients can book appointments with you</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={addSlot} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                        <Plus className="h-4 w-4 mr-1" /> Add Slot
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {saveMessage && (
                <div className={`p-3 rounded-lg text-sm ${saveMessage.includes("success") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {saveMessage}
                </div>
            )}

            <div className="space-y-3">
                {slots.map((slot, index) => (
                    <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${slot.is_active ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={slot.is_active}
                                onChange={(e) => updateSlot(index, "is_active", e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                        </div>

                        <select
                            value={slot.day_of_week}
                            onChange={(e) => updateSlot(index, "day_of_week", parseInt(e.target.value))}
                            className="border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[140px]"
                        >
                            {DAYS.map((day, i) => (
                                <option key={i} value={i}>{day}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateSlot(index, "start_time", e.target.value)}
                                className="border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateSlot(index, "end_time", e.target.value)}
                                className="border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSlot(index)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {slots.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">No availability slots</h3>
                    <p className="text-gray-400 mt-1">Add slots to let patients book appointments</p>
                    <Button onClick={addSlot} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="h-4 w-4 mr-1" /> Add Your First Slot
                    </Button>
                </div>
            )}
        </div>
    );
}
