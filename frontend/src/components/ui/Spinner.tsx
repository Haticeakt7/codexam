// ==========================================================
// Spinner – Yükleme Göstergesi Bileşeni
// ==========================================================
//
// PROPS:
//   - size?:      "sm" | "md" | "lg"  (default: "md")
//   - className?: string → ek CSS (örn: "mx-auto" ortalama için)
//
// TASARIM NOTLARI:
//   - animate-spin dairesi: border-2, border-border, border-t-primary
//   - sm: h-4 w-4  → buton içi, küçük alanlar
//   - md: h-6 w-6  → kart/panel içi genel yükleme
//   - lg: h-10 w-10 → tam sayfa yükleme ekranları
//   - role="status" aria-label="Yükleniyor" → erişilebilirlik
//
// KULLANIM ÖRNEKLERİ:
//   <Spinner />                       ← md, sola hizalı
//   <Spinner className="mx-auto" />   ← ortalanmış
//   <Spinner size="lg" />             ← tam sayfa
//   Button içinde: <Spinner size="sm" /> (loading prop ile otomatik)
//
// ==========================================================

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };

export default function Spinner({ size = "md", className = "" }: Props) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-border border-t-primary ${sizes[size]} ${className}`}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}
