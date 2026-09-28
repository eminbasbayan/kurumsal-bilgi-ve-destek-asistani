import { describe, expect, it } from "vitest";
import { requestFields, withoutAssistantContext } from "./requestHandoff";

const NOT_FOUND =
  "Bu soru için örnek bilgi setimde doğrudan bir yanıt bulunmuyor. İlgili ekibin incelemesi için destek talebi oluşturabilirsiniz.";

describe("kaynağa göre kategori önerisi", () => {
  it("eşleşen kaynak kimliğinden kategori seçer", () => {
    const cases = [
      ["izin", "İnsan Kaynakları", "İzinler"],
      ["vpn", "Bilgi Teknolojileri", "VPN ve Uzaktan Erişim"],
      ["bordro", "İnsan Kaynakları", "Bordro"],
      ["masraf", "Finans ve İdari İşler", "Masraf Bildirimi"],
    ] as const;

    for (const [id, category, subcategory] of cases) {
      const fields = requestFields({
        question: "izin, vpn, bordro ve masraf birlikte geçiyor",
        answer: "Kaynaklı yanıt",
        sources: [{ id, title: "Belge", section: "Bölüm" }],
      });
      expect(fields.category).toBe(category);
      expect(fields.subcategory).toBe(subcategory);
    }
  });

  it("kaynak yoksa sorudaki kelimelere bakmadan kategori boş kalır", () => {
    const fields = requestFields({
      question: "VPN bağlantısını nasıl kurarım?",
      answer: "Kaynak eklenmemiş yanıt",
      sources: [],
    });
    expect(fields.category).toBe("");
    expect(fields.subcategory).toBe("");
  });

  it("bilgi bulunamadığında kategori boş kalır", () => {
    const fields = requestFields({
      question: "Kantin menüsü nerede?",
      answer: NOT_FOUND,
      sources: [],
    });
    expect(fields.category).toBe("");
    expect(fields.subcategory).toBe("");
  });

  it("eşlenmeyen kaynakta kategori boş kalır", () => {
    const fields = requestFields({
      question: "Masraf belgesi nasıl yüklenir?",
      answer: "Kaynaklı yanıt",
      sources: [{ id: "ofis", title: "Ofis Rehberi", section: "1.1 Ekipman" }],
    });
    expect(fields.category).toBe("");
    expect(fields.subcategory).toBe("");
  });
});

describe("asistandan talebe aktarma", () => {
  it("soruyu konu ve açıklamaya aktarır", () => {
    const question = "VPN bağlantısı kopuyor";
    const fields = requestFields({
      question,
      answer: "İstemciyi yeniden başlatın.",
      sources: [
        {
          id: "vpn",
          title: "Uzaktan Erişim Rehberi",
          section: "3.1 VPN Bağlantısı",
        },
      ],
    });
    expect(fields.subject).toBe(question);
    expect(fields.description).toBe(question);
  });

  it("konuyu 100 karakterde kısaltır", () => {
    const question = "Soru ".repeat(40).trim();
    const fields = requestFields({
      question,
      answer: "Yanıt",
      sources: [],
    });
    expect(question.length).toBeGreaterThan(100);
    expect(fields.subject).toHaveLength(100);
    expect(fields.subject).toBe(question.replace(/\s+/g, " ").slice(0, 100));
    expect(fields.description).toBe(question);
  });

  it("yanıt ve kaynakları ayrı bağlama yazar", () => {
    const fields = requestFields({
      question: "Yıllık izin nasıl kullanılır?",
      answer: "Üç iş günü önce iletin.",
      sources: [
        {
          id: "izin",
          title: "Çalışan İzin Prosedürü",
          section: "4.2 Yıllık İzin Kullanımı",
        },
      ],
    });
    expect(fields.assistantContext).toBe(
      "Üç iş günü önce iletin.\nKaynak: Çalışan İzin Prosedürü · 4.2 Yıllık İzin Kullanımı",
    );
    expect(fields.subject).toBe("Yıllık izin nasıl kullanılır?");
    expect(fields.description).toBe("Yıllık izin nasıl kullanılır?");
  });

  it("asistan bağlamını talepten çıkarır", () => {
    const fields = requestFields({
      question: "Bordroma nereden ulaşırım?",
      answer: "Çalışan portalında yayımlanır.",
      sources: [
        {
          id: "bordro",
          title: "Bordro ve Yan Haklar Rehberi",
          section: "2.4 Bordro Görüntüleme",
        },
      ],
    });
    const cleared = withoutAssistantContext({
      ...fields,
      priority: "Normal" as const,
      attachments: [],
    });
    expect(fields.assistantContext.length).toBeGreaterThan(0);
    expect(cleared.assistantContext).toBe("");
    expect(cleared.subject).toBe(fields.subject);
    expect(cleared.description).toBe(fields.description);
    expect(cleared.category).toBe("İnsan Kaynakları");
    expect(cleared.subcategory).toBe("Bordro");
  });
});
