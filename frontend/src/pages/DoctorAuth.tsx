import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { DOCTOR_AUTH_ENDPOINTS } from "@/lib/config";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { Stethoscope } from "lucide-react";

export default function DoctorAuthPage() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        const form = event.target as HTMLFormElement;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const isLogin = form.getAttribute("data-form-type") === "login";

        if (!isLogin) {
            const confirmPassword = (form.elements.namedItem("confirm-password") as HTMLInputElement).value;
            if (password !== confirmPassword) {
                setError("Passwords do not match");
                setIsLoading(false);
                return;
            }
            if (password.length < 6) {
                setError("Password must be at least 6 characters");
                setIsLoading(false);
                return;
            }
        }

        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                sessionStorage.setItem(
                    "doctorUser",
                    JSON.stringify({ uid: user.uid, email: user.email, role: "doctor" })
                );
                navigate(`/doctor/dashboard/${user.uid}`);
            } else {
                const name = (form.elements.namedItem("name") as HTMLInputElement).value;
                const specialty = (form.elements.namedItem("specialty") as HTMLInputElement).value;
                const clinic_name = (form.elements.namedItem("clinic_name") as HTMLInputElement).value;
                const clinic_address = (form.elements.namedItem("clinic_address") as HTMLInputElement).value;
                const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                const registerResponse = await fetch(DOCTOR_AUTH_ENDPOINTS.register, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        uid: user.uid,
                        email,
                        name,
                        specialty,
                        clinic_name,
                        clinic_address,
                        phone,
                    }),
                });

                if (!registerResponse.ok) {
                    const errorData = await registerResponse.json().catch(() => ({}));
                    throw new Error(errorData?.error || registerResponse.statusText);
                }

                sessionStorage.setItem(
                    "doctorUser",
                    JSON.stringify({ uid: user.uid, email: user.email, name, role: "doctor" })
                );
                navigate(`/doctor/dashboard/${user.uid}`);
            }
        } catch (err: any) {
            setError(err?.message || "An error occurred during authentication");
            console.error("Doctor auth error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const googleResponse = await fetch(DOCTOR_AUTH_ENDPOINTS.google, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                }),
            });

            if (!googleResponse.ok) {
                const errorData = await googleResponse.json().catch(() => ({}));
                throw new Error(errorData?.error || googleResponse.statusText);
            }

            sessionStorage.setItem(
                "doctorUser",
                JSON.stringify({ uid: user.uid, email: user.email, name: user.displayName, role: "doctor" })
            );
            navigate(`/doctor/dashboard/${user.uid}`);
        } catch (err: any) {
            setError(err?.message || "Google login failed");
            console.error("Doctor Google login error:", err);
        }
    };

    return (
        <div className="flex min-h-screen w-screen bg-gradient-to-b from-emerald-50 to-white">
            <div className="flex flex-col items-center justify-center w-full px-4 py-8 mx-auto">
                <div className="w-full sm:w-[480px] md:w-[540px] lg:w-[600px] bg-white rounded-2xl shadow-lg">
                    <div className="w-full px-6 py-8 md:px-8">
                        <div className="flex items-center justify-center mb-6">
                            <div className="p-3 bg-emerald-100 rounded-full mr-3">
                                <Stethoscope className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-emerald-800 block">
                                    Healix Doctor Portal
                                </span>
                                <span className="text-sm text-gray-500">
                                    Manage your practice digitally
                                </span>
                            </div>
                        </div>
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login" className="text-sm sm:text-base">
                                    Login
                                </TabsTrigger>
                                <TabsTrigger value="signup" className="text-sm sm:text-base">
                                    Register
                                </TabsTrigger>
                            </TabsList>
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                                    {error}
                                </div>
                            )}
                            <TabsContent value="login" className="w-full">
                                <form data-form-type="login" onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-700">Email</Label>
                                        <Input id="email" type="email" placeholder="doctor@example.com" required className="w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-gray-700">Password</Label>
                                        <Input id="password" type="password" required className="w-full" />
                                    </div>
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" type="submit" disabled={isLoading}>
                                        {isLoading ? "Logging in..." : "Login"}
                                    </Button>
                                </form>
                            </TabsContent>
                            <TabsContent value="signup" className="w-full">
                                <form data-form-type="signup" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                                            <Input id="name" placeholder="Dr. John Doe" required className="w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="specialty" className="text-gray-700">Specialty</Label>
                                            <Input id="specialty" placeholder="Cardiology" required className="w-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-700">Email</Label>
                                        <Input id="email" type="email" placeholder="doctor@example.com" required className="w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clinic_name" className="text-gray-700">Clinic / Hospital Name</Label>
                                        <Input id="clinic_name" placeholder="City Hospital" className="w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clinic_address" className="text-gray-700">Clinic Address</Label>
                                        <Input id="clinic_address" placeholder="123 Medical Lane, City" className="w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                                        <Input id="phone" type="tel" placeholder="+91 9876543210" className="w-full" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                                            <Input id="password" type="password" required className="w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password" className="text-gray-700">Confirm Password</Label>
                                            <Input id="confirm-password" type="password" required className="w-full" />
                                        </div>
                                    </div>
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" type="submit" disabled={isLoading}>
                                        {isLoading ? "Creating Account..." : "Create Doctor Account"}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full mt-6" onClick={handleGoogleLogin}>
                                <FcGoogle className="w-5 h-5 mr-2" />
                                Google
                            </Button>
                        </div>
                        <div className="mt-4 text-center">
                            <a href="/auth" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">
                                ← Back to Patient Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
