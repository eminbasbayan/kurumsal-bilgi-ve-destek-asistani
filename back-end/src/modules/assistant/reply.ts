export type SourceRecord = {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updatedAt: string;
};

const TOPIC_IDS = ["izin", "vpn", "bordro", "masraf"] as const;

type TopicId = (typeof TOPIC_IDS)[number];

const ANSWERS: Record<TopicId, string> = {
  izin: "Yıllık izin talebinizi planlanan başlangıç tarihinden en az üç iş günü önce çalışan portalından iletmeniz gerekir. Yönetici onayından sonra izin bakiyeniz güncellenir.",
  vpn: "Kurumsal VPN için şirket cihazındaki güncel istemciyi açın, kurumsal hesabınızla giriş yapın ve çok faktörlü doğrulamayı tamamlayın. Sorun sürerse BT Destek talebi oluşturun.",
  bordro:
    "Aylık bordronuz takip eden ayın ilk iş gününde çalışan portalında yayımlanır. Kesinti ayrıntılarını bordro açıklamalarında görebilirsiniz.",
  masraf:
    "Masraf belgenizi harcama tarihinden sonraki on iş günü içinde PDF, PNG veya JPG biçiminde yükleyin.",
};

const NOT_FOUND =
  "Bu soru için örnek bilgi setimde doğrudan bir yanıt bulunmuyor. İlgili ekibin incelemesi için destek talebi oluşturabilirsiniz.";

// tr-TR maps ASCII "I" to "ı", so "IZIN" becomes "ızın" and misses "izin".
// Folding dotless ı to i keeps Turkish and ASCII case variants on one key.
function foldTopicText(value: string): string {
  return value.toLocaleLowerCase("tr-TR").replaceAll("ı", "i");
}

function alsoParticle(topic: string): "da" | "de" {
  const vowels = topic.match(/[aeıioöuü]/gi);
  const last = vowels?.at(-1)?.toLocaleLowerCase("tr-TR");
  if (last === "a" || last === "ı" || last === "o" || last === "u") return "da";
  return "de";
}

function otherTopicsNote(topics: readonly string[]): string {
  const last = topics[topics.length - 1];
  if (!last) return "";
  const names =
    topics.length === 1
      ? last
      : topics.length === 2
        ? `${topics[0]} ve ${last}`
        : `${topics.slice(0, -1).join(", ")} ve ${last}`;
  const pronoun = topics.length === 1 ? "onu" : "onları";
  return `Sorunuzda ${names} ${alsoParticle(last)} geçiyor; ${pronoun} ayrı sorarsanız kaynaklı yanıt verebilirim.`;
}

export function replyToQuestion(
  question: string,
  sources: SourceRecord[],
): { text: string; source?: SourceRecord } {
  const folded = foldTopicText(question);
  const matches = TOPIC_IDS.flatMap((id) => {
    const index = folded.indexOf(foldTopicText(id));
    if (index < 0) return [];
    const source = sources.find((item) => item.id === id);
    if (!source) return [];
    return [{ id, index, source, text: ANSWERS[id] }];
  }).sort((left, right) => left.index - right.index);

  const primary = matches[0];
  if (!primary) return { text: NOT_FOUND };

  const others = matches.slice(1).map((item) => item.id);
  const note = otherTopicsNote(others);
  return {
    text: note ? `${primary.text} ${note}` : primary.text,
    source: primary.source,
  };
}
