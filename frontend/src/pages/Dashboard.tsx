import { useState, useRef, useEffect, type ComponentType } from "react";
import Sidebar from "../components/ui/Layout/SideBar";
import { Input } from "@/components/ui/input";
import DashboardMap from "../components/dashboard/DashboardMap";
import UpcomingAppointments from "../components/dashboard/UpcomingAppointments";
import HealthMetrics from "../components/dashboard/HealthMetrics";
import { APPOINTMENTS_ENDPOINTS, USER_ENDPOINTS } from "@/lib/config";
import {
  Activity,
  Bell,
  CalendarDays,
  Clock,
  Heart,
  Search,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuth } from "firebase/auth";
import { format } from "date-fns";

interface HealthMetricsProps {
  blood_pressure?: string;
  weight?: number;
  height?: number;
  allergies?: string;
  blood_group?: string;
  heart_rate?: string;
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  iconContainerClassName: string;
  iconClassName: string;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconContainerClassName,
  iconClassName,
}: SummaryCardProps) {
  return (
    <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${iconContainerClassName}`}
        >
          <Icon className={`h-5 w-5 ${iconClassName}`} />
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Live summary
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [nextAppointment, setNextAppointment] = useState({
    date: "",
    time: "",
  });
  const overlayRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [bmi, setBmi] = useState("Unavailable");
  const [metrics, setMetrics] = useState<HealthMetricsProps>({});
  const hasNextAppointment = Boolean(
    nextAppointment.date && nextAppointment.time,
  );

  const defaultUser = { name: "Guest", email: "Not Available" };
  const sessionUser = sessionStorage.getItem("authUser");
  const user = (() => {
    try {
      const parsed = sessionUser ? JSON.parse(sessionUser) : defaultUser;

      return {
        name: typeof parsed?.name === "string" ? parsed.name : defaultUser.name,
        email:
          typeof parsed?.email === "string" ? parsed.email : defaultUser.email,
      };
    } catch {
      return defaultUser;
    }
  })();

  const firstName = user.name.split(" ")[0] || "Guest";
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";
  const todayLabel = format(new Date(), "EEEE, MMMM d");

  const parsedBmi = Number.parseFloat(bmi);
  const hasBmiValue = Number.isFinite(parsedBmi);
  const bmiStatus = !hasBmiValue
    ? "Profile incomplete"
    : parsedBmi < 18.5
      ? "Needs attention"
      : parsedBmi < 25
        ? "Healthy range"
        : parsedBmi < 30
          ? "Monitor trend"
          : "High BMI";

  const completedHealthDetails = [
    metrics.blood_pressure,
    metrics.weight,
    metrics.height,
    metrics.allergies,
    metrics.blood_group,
    metrics.heart_rate,
  ].filter((value) => value !== undefined && value !== null && value !== "").length;

  const heroHighlights = [
    {
      label: "Next visit",
      value: hasNextAppointment
        ? `${nextAppointment.date} at ${nextAppointment.time}`
        : "No appointment scheduled",
      helper: hasNextAppointment
        ? "Your next booked consultation is already on the calendar."
        : "Book your next visit to stay ahead of routine care.",
      icon: CalendarDays,
    },
    {
      label: "BMI status",
      value: hasBmiValue ? `${bmi} • ${bmiStatus}` : "Add height and weight",
      helper: hasBmiValue
        ? "A quick view of your latest body-mass index category."
        : "Complete your profile to unlock a more accurate health snapshot.",
      icon: Heart,
    },
    {
      label: "Health profile",
      value: `${completedHealthDetails}/6 core details saved`,
      helper:
        completedHealthDetails >= 4
          ? "Your medical profile is shaping up well."
          : "Add a few more vitals and medical details for better recommendations.",
      icon: ShieldCheck,
    },
  ];

  const handleProfileSelect = () => setShowOverlay((prev) => !prev);

  useEffect(() => {
    const fetchRecentAppointments = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          return;
        }

        const token = await currentUser.getIdToken();
        const response = await fetch(APPOINTMENTS_ENDPOINTS.recent, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch recent appointments");
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const nextAppt = data.data[0];
          setNextAppointment({
            date: format(new Date(nextAppt.start_time), "MMMM d, yyyy"),
            time: format(new Date(nextAppt.start_time), "h:mm a"),
          });
        }
      } catch (err) {
        console.error("Failed to fetch recent appointments:", err);
      }
    };

    fetchRecentAppointments();
  }, []);

  const fetchBMI = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error("No logged-in user");
        return;
      }

      const token = await currentUser.getIdToken();
      if (!token) {
        throw new Error("No token provided");
      }

      const response = await fetch(USER_ENDPOINTS.fetchUser, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch user data");
      }

      const userData = result.records[0];
      const { height, weight } = userData;

      if (height && weight) {
        const heightInMeters = height / 100;
        const bmiValue = weight / (heightInMeters * heightInMeters);
        setBmi(bmiValue.toFixed(2));
      } else {
        setBmi("Unavailable");
      }

      setMetrics({
        blood_pressure: userData.blood_pressure?.toString(),
        weight: userData.weight,
        height: userData.height,
        allergies: userData.allergies,
        blood_group: userData.blood_group,
        heart_rate: userData.heart_rate,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      overlayRef.current &&
      !overlayRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setShowOverlay(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchBMI();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 xl:p-8">
        <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/85 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Care dashboard
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Track appointments, essential health details, and nearby care
                services from one calm workspace.
              </p>
            </div>
          </div>

          <div className="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:min-w-[280px]">
              <Input
                type="search"
                placeholder="Search..."
                className="h-11 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-4 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-200"
              />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            </div>

            <div className="relative flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-sky-50 hover:text-sky-700"
              >
                <Bell className="h-5 w-5" />
              </Button>

              <Button
                ref={buttonRef}
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 !text-white shadow-[0_14px_28px_-16px_rgba(2,132,199,0.75)] transition-transform duration-200 hover:-translate-y-0.5 hover:from-sky-600 hover:to-cyan-700"
                onClick={handleProfileSelect}
              >
                <User className="h-5 w-5" />
              </Button>

              {showOverlay && (
                <div
                  ref={overlayRef}
                  className="absolute right-0 top-full z-10 mt-3 w-72 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-sm font-semibold text-white">
                      {(firstName[0] ?? "G").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Signed in as</p>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Email
                    </p>
                    <p className="mt-2 break-all text-sm font-medium text-slate-700">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
          <Card className="relative overflow-hidden rounded-[32px] border-0 bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-600 p-0 text-white shadow-[0_28px_70px_-30px_rgba(14,116,144,0.65)]">
            <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -right-8 bottom-0 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl" />
            <div className="relative flex h-full flex-col gap-6 p-6 sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    {todayLabel}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-cyan-100">
                      {greeting}
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      Welcome back, {firstName}
                    </h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-cyan-50/90 sm:text-base">
                    Your health overview is ready. Review appointments, keep
                    your profile complete, and stay connected to the care you
                    need without friction.
                  </p>
                </div>

                <div className="max-w-sm rounded-3xl bg-white/10 p-4 shadow-lg ring-1 ring-white/20 backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/75">
                    Patient profile
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {user.name}
                  </p>
                  <p className="mt-1 break-all text-sm text-cyan-50/80">
                    {user.email}
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm text-cyan-50">
                    <ShieldCheck className="h-4 w-4" />
                    {completedHealthDetails >= 4
                      ? "Health profile is in good shape"
                      : "Add more health details for better insights"}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl bg-white/12 p-4 shadow-lg ring-1 ring-white/15 backdrop-blur-sm"
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm font-medium text-cyan-100">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold leading-7 text-white">
                        {item.value}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                        {item.helper}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <SummaryCard
              title="Next appointment"
              value={
                hasNextAppointment
                  ? nextAppointment.time
                  : "No visit booked yet"
              }
              description={
                hasNextAppointment
                  ? `${nextAppointment.date} is reserved in your care schedule.`
                  : "Schedule a checkup or follow-up to keep your care plan moving."
              }
              icon={Clock}
              iconContainerClassName="bg-sky-100"
              iconClassName="text-sky-600"
            />
            <SummaryCard
              title="BMI overview"
              value={hasBmiValue ? `${bmi} (${bmiStatus})` : "Profile needs data"}
              description={
                hasBmiValue
                  ? "Your current BMI has been calculated from the latest height and weight on file."
                  : "Add height and weight in your profile to reveal a more complete health snapshot."
              }
              icon={Activity}
              iconContainerClassName="bg-emerald-100"
              iconClassName="text-emerald-600"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] xl:col-span-2">
            <DashboardMap />
          </Card>

          <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]">
            <UpcomingAppointments />
          </Card>
          <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]">
            <HealthMetrics
              blood_pressure={metrics.blood_pressure}
              weight={metrics.weight}
              height={metrics.height}
              allergies={metrics.allergies}
              blood_group={metrics.blood_group}
              heart_rate={metrics.heart_rate}
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
