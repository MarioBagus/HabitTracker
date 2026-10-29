import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router";
import { BottomNav } from "./components/BottomNav";
import { CalendarPage } from "./pages/CalendarPage";
import { HabitFormPage } from "./pages/HabitFormPage";
import { HabitsPage } from "./pages/HabitsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TodayPage } from "./pages/TodayPage";

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <main className="mx-auto min-h-dvh max-w-md px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="day/:date" element={<TodayPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="habits/new" element={<HabitFormPage />} />
        <Route path="habits/:id" element={<HabitFormPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<TodayPage />} />
      </Route>
    </Routes>
  );
}
