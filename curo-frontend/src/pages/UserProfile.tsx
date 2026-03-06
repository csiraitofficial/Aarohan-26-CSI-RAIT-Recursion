import { useState, useEffect } from "react";
import Sidebar from "../components/ui/Layout/SideBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuth } from "firebase/auth";
import { USER_ENDPOINTS } from "@/lib/config";
import {
  User,
  Settings,
  Heart,
  Ruler,
  Weight,
  Calendar,
  AlertCircle,
  Activity,
} from "lucide-react";

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    bloodGroup: "",
    allergies: "",
    heartRate: "",
    bloodPressure: "",
    height: "",
    weight: "",
    dob: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const normalizeDateForInput = (value?: string | null) => {
    if (!value) return "";
    // If value is already yyyy-mm-dd, use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Handle dd-mm-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split("-");
      return `${yyyy}-${mm}-${dd}`;
    }
    // Handle full ISO datetime
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return "";
  };

  const parseNumericValue = (value: string) => {
    if (!value) return null;
    const numberPart = String(value).replace(/[^\d.]/g, "");
    if (!numberPart) return null;
    const parsed = Number(numberPart);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const mapApiUserToForm = (record: any) => ({
    name: record?.name ?? "",
    email: record?.email ?? "",
    bloodGroup: record?.blood_group ?? "",
    allergies: record?.allergies ?? "",
    heartRate: record?.heart_rate?.toString?.() ?? "",
    bloodPressure: record?.blood_pressure ?? "",
    height: record?.height?.toString?.() ?? "",
    weight: record?.weight?.toString?.() ?? "",
    dob: normalizeDateForInput(record?.date_of_birth),
  });

  const fetchUserData = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      const response = await fetch(USER_ENDPOINTS.fetchUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok) {
        const firstRecord = Array.isArray(result?.records) ? result.records[0] : null;
        if (firstRecord) {
          setUserData(mapApiUserToForm(firstRecord));
        }
      } else {
        console.error("Error fetching user data:", result.error);
      }
    } else {
      console.error("No user is signed in.");
    }
  };

  const updateUserData = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      const response = await fetch(USER_ENDPOINTS.updateProfile, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blood_group: userData.bloodGroup,
          allergies: userData.allergies,
          heart_rate: parseNumericValue(userData.heartRate),
          blood_pressure: userData.bloodPressure,
          height: parseNumericValue(userData.height),
          weight: parseNumericValue(userData.weight),
          date_of_birth: userData.dob,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage(
          result?.message || "Profile updated successfully.",
        );
        setIsEditing(false);
      } else {
        setErrorMessage(
          result?.details || result?.error || "Failed to update profile.",
        );
        console.error("Error updating profile:", result.error);
      }
    } else {
      setErrorMessage("No user is signed in.");
      console.error("No user is signed in.");
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const getFieldIcon = (key: keyof typeof userData) => {
    const icons = {
      name: <User className="w-5 h-5 text-blue-500" />,
      email: <Settings className="w-5 h-5 text-purple-500" />,
      bloodGroup: <Activity className="w-5 h-5 text-red-500" />,
      allergies: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      heartRate: <Heart className="w-5 h-5 text-red-500" />,
      bloodPressure: <Activity className="w-5 h-5 text-green-500" />,
      height: <Ruler className="w-5 h-5 text-indigo-500" />,
      weight: <Weight className="w-5 h-5 text-blue-500" />,
      dob: <Calendar className="w-5 h-5 text-purple-500" />,
    };
    return icons[key] || null;
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex items-center justify-center p-0">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Profile
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Manage your personal information and health data in one secure
              place.
            </p>
          </header>

          <Card className="p-8 shadow-lg bg-white/80 backdrop-blur-sm">
            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-700">
                {successMessage}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(userData).map((key) => (
                <div key={key} className="relative group">
                  <div className="flex items-center space-x-2 mb-1.5">
                    {getFieldIcon(key as keyof typeof userData)}
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                  </div>
                  <Input
                    type={key === "dob" ? "date" : "text"}
                    value={userData[key as keyof typeof userData]}
                    disabled={!isEditing}
                    className={`mt-1 transition-all duration-200 ${
                      isEditing
                        ? "border-blue-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500"
                        : "bg-gray-50"
                    } ${!isEditing && "cursor-not-allowed opacity-75"}`}
                    onChange={(e) =>
                      setUserData({ ...userData, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-8 space-x-4">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="px-6 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateUserData}
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
