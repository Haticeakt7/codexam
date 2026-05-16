// ==========================================================
// ConfirmDialog – Onay Diyaloğu Bileşeni
// ==========================================================
//
// PROPS:
//   - open:           boolean   → diyalog açık mı?
//   - onClose:        () => void → İptal ve dışarı tıklama
//   - onConfirm:      () => void → Onay butonu tıklaması
//   - title:          string    → modal başlığı
//   - message:        string    → "Bu işlem geri alınamaz." gibi uyarı metni
//   - confirmLabel?:  string    → onay butonu etiketi (default: "Confirm")
//   - danger?:        boolean   → onay butonu danger varyantı (default: false)
//   - loading?:       boolean   → onay işlemi süresince loading (default: false)
//
// TASARIM NOTLARI:
//   - Modal (size="sm") üzerine inşa edilmiştir
//   - Footer: İptal (ghost, sm) + Onayla (primary veya danger, sm)
//   - loading=true iken İptal disabled, Onayla loading spinner gösterir
//   - message: text-sm text-muted
//
// KULLANIM ÖRNEKLERİ:
//   <ConfirmDialog
//     open={!!deleteTarget}
//     onClose={() => setDeleteTarget(null)}
//     onConfirm={() => deleteQuiz(deleteTarget.id)}
//     title="Quiz'i Sil"
//     message="Bu quiz ve tüm soru/session verileri kalıcı olarak silinecek."
//     confirmLabel="Evet, Sil"
//     danger
//     loading={isPending}
//   />
//
// ==========================================================

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
