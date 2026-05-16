// ==========================================================
// Badge – Durum/Etiket Rozeti Bileşeni
// ==========================================================
//
// PROPS:
//   - variant: "default" | "success" | "danger" | "warning" | "info" | "muted"
//   - children: ReactNode → rozet içi metin/ikon
//   - className?: string → ek CSS sınıfları
//
// TASARIM NOTLARI:
//   - default:  bg-primary/10 text-primary   → genel/nötr durum
//   - success:  bg-success/10 text-success   → Aktif, Başarılı, Onaylı
//   - danger:   bg-danger/10 text-danger     → Hata, Silindi, Kilitli
//   - warning:  bg-warning/10 text-warning   → Uyarı, Beklemede
//   - info:     bg-blue-500/10 text-blue-500 → Bilgi, Canlı
//   - muted:    bg-surface2 text-muted       → Draft, Bitti, Pasif
//   - Şekil: rounded-full, px-2.5 py-0.5, text-xs font-medium
//
// KULLANIM ALANLARINDAN ÖRNEKLER:
//   Quiz durumu:   <Badge variant="success">Aktif</Badge>
//                  <Badge variant="muted">Draft</Badge>
//   Session:       <Badge variant="info">Canlı</Badge>
//                  <Badge variant="danger">Kilitli</Badge>
//   Kaynak etiket: <Badge variant="default">API</Badge>
//
// ==========================================================

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantCls: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger:  "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  info:    "bg-blue-500/10 text-blue-500",
  muted:   "bg-surface2 text-muted",
};

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantCls[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
