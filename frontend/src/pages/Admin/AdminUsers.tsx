// ==========================================================
// AdminUsers – Kullanıcı Yönetimi
// ROUTE: /admin/users  (Admin only)
// ==========================================================
//
// AMAÇ:
//   Tüm kullanıcıları listeler. Rol güncelleme, pasifleştirme ve silme işlemleri.
//
// BAĞLI HOOKLAR:
//   - useAdminUsers()        → @/hooks/useAdmin → GET /api/admin/users
//                              data: User[], isLoading: boolean
//                              Destekleyecek: arama, filtreleme, pagination
//   - useUpdateUserRole()    → @/hooks/useAdmin → PUT /api/admin/users/:id (rol)
//   - useDeactivateUser()    → @/hooks/useAdmin → PUT /api/admin/users/:id (status: inactive)
//   - useDeleteUser()        → @/hooks/useAdmin → DELETE /api/admin/users/:id
//
// LOCAL STATE:
//   - search: string → arama filtresi (debounce ile)
//   - roleFilter: "all" | "Admin" | "User"
//   - deleteTarget: User | null → silme onayı için
//
// UI TASARIM:
//   AdminLayout içinde arama + filtre + tablo.
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │  Kullanıcı Yönetimi                                          │
//   │  [🔍 Ara...] [Tümü ▾] ← arama ve rol filtresi              │
//   ├──────────────────────────────────────────────────────────────┤
//   │  Ad             E-posta          Rol      Durum   İşlem      │
//   │  Ahmet Yılmaz  ahmet@...        [User▾]  Aktif   [⛔][🗑️]   │
//   │  Admin User    admin@...        [Admin▾] Aktif   [⛔][🗑️]   │
//   │  ...                                                         │
//   ├──────────────────────────────────────────────────────────────┤
//   │  [← Önceki]  Sayfa 1/5  [Sonraki →]  ← pagination          │
//   └──────────────────────────────────────────────────────────────┘
//
//   Tablo tasarım notları:
//     - Rol: inline dropdown (Admin / User) → değişince useUpdateUserRole
//     - [⛔] Pasifleştir: aktif kullanıcıları devre dışı bırakır
//     - [🗑️] Sil: ConfirmDialog → useDeleteUser (soft delete)
//     - Pasif kullanıcı satırı: muted/soluk stil
//     - Kayıt tarihi ve son giriş tarihi opsiyonel olarak gösterilebilir
//     - isLoading: tablo yerine Spinner
//     - Boş: EmptyState "Kullanıcı bulunamadı"
//
// NAVIGASYON:
//   - Sayfalar arası: pagination
// ==========================================================

import { useAdminUsers, useUpdateUser, useDeleteUser } from "@/hooks/useAdmin";
import type { AdminUser } from "@/api/types";

export default function AdminUsers() {
  // const { data: users, isLoading } = useAdminUsers();
  // const { mutate: updateRole } = useUpdateUserRole();
  // const { mutate: deleteUser } = useDeleteUser();

  // const [search, setSearch] = useState("");
  // const [roleFilter, setRoleFilter] = useState<"all" | "Admin" | "User">("all");
  // const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useAdminUsers; void useUpdateUser; void useDeleteUser;
  const _: AdminUser | null = null; void _;
  return null;
}
