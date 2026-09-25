import { sourceDocuments } from "../data";
import type { SourceDocument } from "../types";

export function reply(question: string): {
  source?: SourceDocument;
  text: string;
} {
  const normalized = question.toLocaleLowerCase("tr-TR");
  const source = normalized.includes("vpn")
    ? sourceDocuments[1]
    : normalized.includes("bordro")
      ? sourceDocuments[2]
      : normalized.includes("masraf")
        ? sourceDocuments[3]
        : sourceDocuments[0];
  const answers: Record<string, string> = {
    izin: "Yıllık izin talebinizi planlanan başlangıç tarihinden en az üç iş günü önce çalışan portalından iletmeniz gerekir. Yönetici onayından sonra izin bakiyeniz güncellenir.",
    vpn: "Kurumsal VPN için şirket cihazındaki güncel istemciyi açın, kurumsal hesabınızla giriş yapın ve çok faktörlü doğrulamayı tamamlayın. Sorun sürerse BT Destek talebi oluşturun.",
    bordro:
      "Aylık bordronuz takip eden ayın ilk iş gününde çalışan portalında yayımlanır. Kesinti ayrıntılarını bordro açıklamalarında görebilirsiniz.",
    masraf:
      "Masraf belgenizi harcama tarihinden sonraki on iş günü içinde PDF, PNG veya JPG biçiminde yükleyin.",
  };
  const known = ["izin", "vpn", "bordro", "masraf"].some((term) =>
    normalized.includes(term),
  );
  return {
    source: known ? source : undefined,
    text: known
      ? answers[source.id]
      : "Bu soru için örnek bilgi setimde doğrudan bir yanıt bulunmuyor. İlgili ekibin incelemesi için destek talebi oluşturabilirsiniz.",
  };
}
