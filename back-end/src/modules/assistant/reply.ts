export type SourceRecord = {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updatedAt: string;
};

const ANSWERS: Record<string, string> = {
  izin: "Yıllık izin talebinizi planlanan başlangıç tarihinden en az üç iş günü önce çalışan portalından iletmeniz gerekir. Yönetici onayından sonra izin bakiyeniz güncellenir.",
  vpn: "Kurumsal VPN için şirket cihazındaki güncel istemciyi açın, kurumsal hesabınızla giriş yapın ve çok faktörlü doğrulamayı tamamlayın. Sorun sürerse BT Destek talebi oluşturun.",
  bordro:
    "Aylık bordronuz takip eden ayın ilk iş gününde çalışan portalında yayımlanır. Kesinti ayrıntılarını bordro açıklamalarında görebilirsiniz.",
  masraf:
    "Masraf belgenizi harcama tarihinden sonraki on iş günü içinde PDF, PNG veya JPG biçiminde yükleyin.",
};

const NOT_FOUND =
  "Bu soru için örnek bilgi setimde doğrudan bir yanıt bulunmuyor. İlgili ekibin incelemesi için destek talebi oluşturabilirsiniz.";

export function replyToQuestion(
  question: string,
  sources: SourceRecord[],
): { text: string; source?: SourceRecord } {
  const normalized = question.toLocaleLowerCase("tr-TR");
  const sourceId = normalized.includes("vpn")
    ? "vpn"
    : normalized.includes("bordro")
      ? "bordro"
      : normalized.includes("masraf")
        ? "masraf"
        : normalized.includes("izin")
          ? "izin"
          : undefined;
  const source = sourceId
    ? sources.find((item) => item.id === sourceId)
    : undefined;
  const text = source ? ANSWERS[source.id] : undefined;
  if (!source || !text) return { text: NOT_FOUND };
  return { text, source };
}
