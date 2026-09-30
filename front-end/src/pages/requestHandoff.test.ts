import { describe, expect, it } from "vitest";
import { requestFields, withoutAssistantContext } from "./requestHandoff";

const NO_SOURCE =
  "Bu konuda doğrulanmış bir kaynak bulamadım. İstersen bir destek talebi oluşturabilirsin.";

describe("kaynağa göre kategori önerisi", () => {
  it("kategoriyi kaynak kimliğinden değil kategori alanından önerir", () => {
    const fields = requestFields({
      question: "izin, vpn, bordro ve masraf birlikte geçiyor",
      answer: "Kaynaklı yanıt",
      sources: [
        {
          id: "izin",
          title: "Belge",
          section: "Bölüm",
          category: "Bilgi Teknolojileri",
          subcategory: "VPN ve Uzaktan Erişim",
        },
      ],
    });
    expect(fields.category).toBe("Bilgi Teknolojileri");
    expect(fields.subcategory).toBe("VPN ve Uzaktan Erişim");
  });

  it("kaynak yoksa sorudaki kelimelere bakmadan kategori boş kalır", () => {
    const fields = requestFields({
      question: "VPN bağlantısını nasıl kurarım?",
      answer: "Kaynak eklenmemiş yanıt",
      sources: [],
    });
    expect(fields.category).toBe("");
    expect(fields.subcategory).toBe("");
    expect(fields.assistantContext).toBe("Kaynak eklenmemiş yanıt");
  });

  it("bilgi bulunamadığında yanıt bağlama geçer ve kaynak satırı eklenmez", () => {
    const question = "izin vpn bordro masraf hakkında genel bilgi";
    const fields = requestFields({
      question,
      answer: NO_SOURCE,
      sources: [],
    });
    expect(fields.category).toBe("");
    expect(fields.subcategory).toBe("");
    expect(fields.subject).toBe(question);
    expect(fields.description).toBe(question);
    expect(fields.assistantContext).toBe(NO_SOURCE);
    expect(fields.assistantContext.includes("Kaynak:")).toBe(false);
  });

  it("kategori alanı yoksa eski kimlik eşlemesi uygulanmaz", () => {
    const fields = requestFields({
      question: "Masraf belgesi nasıl yüklenir?",
      answer: "Kaynaklı yanıt",
      sources: [{ id: "vpn", title: "VPN", section: "Bağlantı adımları" }],
    });
    expect(fields.category).toBe("");
    expect(fields.subcategory).toBe("");
    expect(fields.assistantContext).toBe(
      "Kaynaklı yanıt\nKaynak: VPN · Bağlantı adımları",
    );
  });

  it("aynı kategori ve alt kategorideki kaynakların tümünü önerir", () => {
    const fields = requestFields({
      question: "Yıllık izin bakiyem ve başvuru süresi nedir?",
      answer: "İlgili politikaya göre alıntı.",
      sources: [
        {
          id: "yillik-izin-basvuru",
          title: "Yıllık İzin Politikası",
          section: "Başvuru süreci",
          category: "İnsan Kaynakları",
          subcategory: "İzinler",
        },
        {
          id: "yillik-izin-bakiye",
          title: "Yıllık İzin Politikası",
          section: "İzin bakiyesi",
          category: "İnsan Kaynakları",
          subcategory: "İzinler",
        },
      ],
    });
    expect(fields.category).toBe("İnsan Kaynakları");
    expect(fields.subcategory).toBe("İzinler");
    expect(fields.assistantContext).toBe(
      "İlgili politikaya göre alıntı.\nKaynak: Yıllık İzin Politikası · Başvuru süreci\nKaynak: Yıllık İzin Politikası · İzin bakiyesi",
    );
  });

  it("farklı kategori veya alt kategoride ilki seçilmeden boş kalır", () => {
    const differentCategory = requestFields({
      question: "İzin ve VPN birlikte",
      answer: "İki konu.",
      sources: [
        {
          id: "vpn",
          title: "VPN Kurulumu ve Sorun Giderme",
          section: "Bağlantı adımları",
          category: "Bilgi Teknolojileri",
          subcategory: "VPN ve Uzaktan Erişim",
        },
        {
          id: "izin",
          title: "Yıllık İzin Politikası",
          section: "Başvuru süreci",
          category: "İnsan Kaynakları",
          subcategory: "İzinler",
        },
      ],
    });
    expect(differentCategory.category).toBe("");
    expect(differentCategory.subcategory).toBe("");
    expect(differentCategory.assistantContext).toBe(
      "İki konu.\nKaynak: VPN Kurulumu ve Sorun Giderme · Bağlantı adımları\nKaynak: Yıllık İzin Politikası · Başvuru süreci",
    );

    const differentSubcategory = requestFields({
      question: "İzin ve bordro",
      answer: "İki alt konu.",
      sources: [
        {
          id: "izin",
          title: "Yıllık İzin Politikası",
          section: "Başvuru süreci",
          category: "İnsan Kaynakları",
          subcategory: "İzinler",
        },
        {
          id: "bordro",
          title: "Bordro Görüntüleme ve İtiraz",
          section: "Bordro görüntüleme",
          category: "İnsan Kaynakları",
          subcategory: "Bordro",
        },
      ],
    });
    expect(differentSubcategory.category).toBe("");
    expect(differentSubcategory.subcategory).toBe("");
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
          category: "Bilgi Teknolojileri",
          subcategory: "VPN ve Uzaktan Erişim",
        },
      ],
    });
    expect(fields.subject).toBe(question);
    expect(fields.description).toBe(question);
    expect(fields.category).toBe("Bilgi Teknolojileri");
    expect(fields.subcategory).toBe("VPN ve Uzaktan Erişim");
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

  it("açıklamayı 2000 karakterde sınırlar", () => {
    const question = `${"açıklama ".repeat(300)}son`;
    const fields = requestFields({
      question,
      answer: "Yanıt",
      sources: [],
    });
    expect(question.length).toBeGreaterThan(2000);
    expect(fields.description).toHaveLength(2000);
    expect(fields.description).toBe(question.slice(0, 2000));
    expect(fields.subject).toHaveLength(100);
    expect(fields.subject).toBe(question.replace(/\s+/g, " ").slice(0, 100));
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
          category: "İnsan Kaynakları",
          subcategory: "İzinler",
        },
      ],
    });
    expect(fields.assistantContext).toBe(
      "Üç iş günü önce iletin.\nKaynak: Çalışan İzin Prosedürü · 4.2 Yıllık İzin Kullanımı",
    );
    expect(fields.subject).toBe("Yıllık izin nasıl kullanılır?");
    expect(fields.description).toBe("Yıllık izin nasıl kullanılır?");
  });

  it("aktarım olmadığında alanlar boş kalır", () => {
    expect(requestFields(null)).toEqual({
      category: "",
      subcategory: "",
      subject: "",
      description: "",
      assistantContext: "",
    });
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
          category: "İnsan Kaynakları",
          subcategory: "Bordro",
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
