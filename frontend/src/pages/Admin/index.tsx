// ==========================================================
// AdminDashboard – Admin Panel Router
// ROUTE: /admin/*  (PrivateRoute: sadece Admin)
// ==========================================================
//
// AMAÇ:
//   Admin alt sayfaları için routing container.
//   AdminLayout'u sararak /admin altındaki tüm rotaları yönetir.
//
// ALT ROTALAR:
//   /admin           → AdminStats   (varsayılan)
//   /admin/users     → AdminUsers
//   /admin/quizzes   → AdminQuizzes
//   /admin/sessions  → AdminSessions
//   /admin/system    → AdminSystem
//
// YAPISI:
//   Bu bileşen AdminLayout içinde React Router <Routes> + <Route> kullanır.
//   Her alt bileşen kendi sayfasında bulunur ve lazy import ile yüklenebilir.
//
// NOT:
//   AdminLayout bileşeni sidebar navigasyonu ve header'ı içerir.
//   Bu bileşen sadece routing sorumluluğunu üstlenir.
// ==========================================================

import { Routes, Route } from "react-router-dom";
import AdminStats from "./AdminStats";
import AdminUsers from "./AdminUsers";
import AdminQuizzes from "./AdminQuizzes";
import AdminSessions from "./AdminSessions";
import AdminSystem from "./AdminSystem";

export default function AdminDashboard() {
  return (
    // TODO: AdminLayout bileşenini implement edince buraya sarın
    // <AdminLayout>
    <Routes>
      <Route index element={<AdminStats />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="quizzes" element={<AdminQuizzes />} />
      <Route path="sessions" element={<AdminSessions />} />
      <Route path="system" element={<AdminSystem />} />
    </Routes>
    // </AdminLayout>
  );
}
