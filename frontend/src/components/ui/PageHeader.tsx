// ==========================================================
// PageHeader – Sayfa Üst Başlık Bileşeni
// ==========================================================
//
// PROPS:
//   - title:         string           → ana başlık (text-xl font-bold)
//   - subtitle?:     string           → açıklama (text-sm text-muted)
//   - breadcrumbs?:  BreadcrumbItem[] → { label, href? }[] navigasyon izi
//   - action?:       ReactNode        → sağ üst köşe (buton, badge vs.)
//
// TASARIM NOTLARI:
//   - mb-6, flex items-start justify-between
//   - Breadcrumb: "/" ayraçlı, text-xs text-muted, href varsa hover:text-primary
//   - Başlık: truncate (uzun isimlerde taşmaz)
//   - action: shrink-0 (metni itmez, soldan sıkışmaz)
//
// KULLANIM ÖRNEKLERİ:
//   <PageHeader
//     title="Veri Yapıları Sınavı"
//     subtitle="12 soru · Aktif"
//     breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav" }]}
//     action={<Button onClick={publish}>Yayınla</Button>}
//   />
//
//   <PageHeader title="Kullanıcılar" />
//
// ==========================================================

import { type ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-xs text-muted">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="truncate text-xl font-bold text-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
