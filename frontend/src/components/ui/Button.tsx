// ==========================================================
// Button – Genel Amaçlı Buton Bileşeni
// ==========================================================
//
// PROPS:
//   - variant: "primary" | "secondary" | "danger" | "ghost"  (default: "primary")
//   - size:    "sm" | "md" | "lg"                            (default: "md")
//   - loading: boolean → Spinner gösterir, disabled yapar    (default: false)
//   - leftIcon: ReactNode → buton solunda ikon (loading=true ise gizlenir)
//   - ...rest: tüm standart HTMLButtonElement prop'ları geçer
//
// TASARIM NOTLARI:
//   - primary:   bg-primary text-white, hover→bg-primary-hover
//   - secondary: bg-surface2, border-border, hover→bg-surface
//   - danger:    bg-danger text-white, hover→opacity-90
//   - ghost:     text-muted, hover→text-text + bg-surface2
//   - disabled veya loading iken: opacity-50, cursor-not-allowed
//   - Tüm varyantlarda: active:scale-[0.98] (hafif press efekti)
//   - focus-visible: ring-2 ring-primary/50 (erişilebilirlik)
//
// KULLANIM ÖRNEKLERİ:
//   <Button>Kaydet</Button>
//   <Button variant="danger" onClick={handleDelete}>Sil</Button>
//   <Button loading={isPending}>Gönderiliyor...</Button>
//   <Button variant="secondary" leftIcon={<PlusIcon />}>Ekle</Button>
//
// ==========================================================

import { type ReactNode, type ButtonHTMLAttributes } from "react";
import Spinner from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
}

const variantCls: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:scale-[0.98]",
  secondary:
    "bg-surface2 text-text border border-border hover:bg-surface active:scale-[0.98]",
  danger:
    "bg-danger text-white hover:opacity-90 active:scale-[0.98]",
  ghost:
    "text-muted hover:text-text hover:bg-surface2 active:scale-[0.98]",
};

const sizeCls: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 ${variantCls[variant]} ${sizeCls[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
    </button>
  );
}
