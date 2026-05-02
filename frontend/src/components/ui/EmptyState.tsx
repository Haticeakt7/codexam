// ==========================================================
// EmptyState – Boş Veri Durumu Bileşeni
// ==========================================================
//
// PROPS:
//   - icon?:        ReactNode → emoji veya SVG ikon (bg-surface2 daire içinde)
//   - title:        string   → ana mesaj (text-sm font-medium)
//   - description?: string   → alt açıklama (text-xs text-muted)
//   - action?:      { label: string; onClick: () => void } → eylem butonu
//
// TASARIM NOTLARI:
//   - Dikey ortalanmış, metin ortada, py-16
//   - İkon: h-14 w-14 daire, bg-surface2, text-2xl text-muted
//   - Buton: size="sm" primary varyant
//   - Table içinde veya sayfa seviyesinde kullanılır
//
// KULLANIM ÖRNEKLERİ:
//   <EmptyState
//     icon="📋"
//     title="Henüz quiz oluşturmadınız"
//     description="İlk quizinizi oluşturmak için butona tıklayın."
//     action={{ label: "Yeni Quiz", onClick: () => navigate("/dashboard/new") }}
//   />
//
//   <EmptyState title="Kayıt bulunamadı" />
//
// ==========================================================

import { type ReactNode } from "react";
import Button from "@/components/ui/Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface2 text-2xl text-muted">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
