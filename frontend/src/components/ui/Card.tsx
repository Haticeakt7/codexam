// ==========================================================
// Card / CardHeader – İçerik Kartı Bileşeni
// ==========================================================
//
// Card PROPS:
//   - children: ReactNode → kart içeriği
//   - padding?:  boolean → iç dolgu (default: true → p-5)
//   - className?: string → ek CSS sınıfları
//
// CardHeader PROPS:
//   - title:     string   → kart başlığı (text-sm font-semibold)
//   - subtitle?:  string   → açıklama (text-xs text-muted)
//   - action?:    ReactNode → sağ tarafa hizalanan eylem alanı (buton, badge vs.)
//
// TASARIM NOTLARI:
//   - Card: rounded-xl, border-border, bg-surface, shadow-sm
//   - padding=false: Monaco editörü veya tam genişlik tablo için kullanılır
//   - CardHeader: mb-4, flex items-start justify-between
//   - action alanı: shrink-0 → taşmaz, sağ hizalı kalır
//
// KULLANIM ÖRNEKLERİ:
//   <Card>
//     <CardHeader title="Quiz Listesi" subtitle="5 quiz" action={<Button>Ekle</Button>} />
//     ...içerik...
//   </Card>
//
//   <Card padding={false}>
//     <Table ... />
//   </Card>
//
// ==========================================================

import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-sm ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
