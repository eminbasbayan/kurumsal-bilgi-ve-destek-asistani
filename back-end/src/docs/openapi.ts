import {
  ATTACHMENT_MIME_TYPES,
  CATEGORIES,
  DEMO_EMAIL,
  DEMO_LOGIN_MESSAGE,
  DEMO_PASSWORD,
  PRIORITIES,
  REQUEST_STATUSES,
} from "../config/constants.js";

const categoryNames = Object.keys(CATEGORIES);
const categoryHelp = Object.entries(CATEGORIES)
  .map(([name, subcategories]) => `${name}: ${subcategories.join(", ")}`)
  .join(". ");

const errorSchema = { $ref: "#/components/schemas/Error" };
const bearer = [{ bearerAuth: [] }];

function json(schema: object, example?: unknown) {
  return {
    "application/json": {
      schema,
      ...(example === undefined ? {} : { example }),
    },
  };
}

function error(description: string) {
  return {
    description,
    content: json(errorSchema, { error: description }),
  };
}

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Kurumsal Bilgi ve Destek Asistanı API",
    version: "1.0.0",
    description: [
      "Çalışan portalının demo API'si. Gerçek kimlik dizini, canlı yapay zekâ veya dosya deposu yoktur.",
      `Denemek için önce Giriş yapın. E-posta: ${DEMO_EMAIL}. Parola: ${DEMO_PASSWORD}.`,
      DEMO_LOGIN_MESSAGE,
      "Dönen token değerini sağ üstteki Authorize alanına yapıştırın. Diğer uçlar bu belirteci ister.",
    ].join(" "),
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Kimlik", description: "Demo giriş, çıkış ve profil" },
    { name: "Talepler", description: "Destek talepleri ve yazışmalar" },
    { name: "Bildirimler", description: "Talep bildirimleri" },
    { name: "Kaynaklar", description: "Asistanın dayandığı örnek belgeler" },
    { name: "Asistan", description: "Kural tabanlı bilgi asistanı" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "POST /api/auth/login yanıtındaki token.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: { error: { type: "string" } },
      },
      Employee: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          initials: { type: "string" },
          title: { type: "string" },
          department: { type: "string" },
          email: { type: "string" },
          employeeNo: { type: "string" },
          location: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: DEMO_EMAIL },
          password: { type: "string", example: DEMO_PASSWORD },
        },
      },
      Attachment: {
        type: "object",
        required: ["name", "mimeType", "sizeBytes"],
        properties: {
          name: { type: "string", example: "ekran.png" },
          mimeType: { type: "string", enum: [...ATTACHMENT_MIME_TYPES] },
          sizeBytes: { type: "integer", maximum: 5 * 1024 * 1024, example: 1200 },
        },
        description: "Yalnızca üstveri kaydedilir. Dosya içeriği saklanmaz.",
      },
      CreateRequest: {
        type: "object",
        required: ["category", "subcategory", "subject", "description", "priority"],
        properties: {
          category: { type: "string", enum: categoryNames },
          subcategory: { type: "string", description: categoryHelp },
          subject: { type: "string", example: "VPN bağlantısı kurulmuyor" },
          description: { type: "string", example: "Ev ağından bağlanırken oturum kapanıyor." },
          priority: { type: "string", enum: [...PRIORITIES] },
          assistantContext: { type: "string" },
          clientRequestId: {
            type: "string",
            maxLength: 100,
            description: "Aynı değer ikinci bir talep açmaz; ilk kayıt döner.",
          },
          attachments: { type: "array", items: { $ref: "#/components/schemas/Attachment" } },
        },
      },
      MessageRequest: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string", example: "Windows 11 kullanıyorum." } },
      },
      QuestionRequest: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string", example: "VPN bağlantısını nasıl kurarım?" } },
      },
      ConversationRequest: {
        type: "object",
        properties: { title: { type: "string", example: "VPN sorusu" } },
      },
      FeedbackRequest: {
        type: "object",
        required: ["helpful"],
        properties: { helpful: { type: "boolean", example: true } },
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Kimlik"],
        summary: "Demo hesaba giriş yap",
        security: [],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/LoginRequest" }) },
        responses: {
          "200": {
            description: "Belirteç ve profil",
            content: json({
              type: "object",
              properties: {
                token: { type: "string" },
                demo: { type: "boolean" },
                message: { type: "string" },
                employee: { $ref: "#/components/schemas/Employee" },
              },
            }),
          },
          "400": error("E-posta ve parola zorunludur."),
          "401": error("E-posta veya parola hatalı."),
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Kimlik"],
        summary: "Oturumu kapat",
        security: bearer,
        responses: { "204": { description: "Oturum silindi" }, "401": error("Oturum gerekli.") },
      },
    },
    "/api/profile": {
      get: {
        tags: ["Kimlik"],
        summary: "Profili getir",
        security: bearer,
        responses: {
          "200": { description: "Çalışan profili", content: json({ $ref: "#/components/schemas/Employee" }) },
          "401": error("Oturum gerekli."),
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Talepler"],
        summary: "Kategori ve alt kategorileri getir",
        security: bearer,
        responses: {
          "200": { description: "Kategori listesi" },
          "401": error("Oturum gerekli."),
        },
      },
    },
    "/api/requests/summary": {
      get: {
        tags: ["Talepler"],
        summary: "Açık, bekleyen ve tamamlanan sayıları ile son talepler",
        security: bearer,
        responses: { "200": { description: "Özet" }, "401": error("Oturum gerekli.") },
      },
    },
    "/api/requests": {
      get: {
        tags: ["Talepler"],
        summary: "Talepleri ara ve süz",
        security: bearer,
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Talep numarası veya konu. Türkçe harf duyarsız." },
          { name: "status", in: "query", schema: { type: "string", enum: [...REQUEST_STATUSES] } },
          { name: "category", in: "query", schema: { type: "string", enum: categoryNames } },
          { name: "scope", in: "query", schema: { type: "string", enum: ["all", "open", "closed"] } },
        ],
        responses: { "200": { description: "Talep listesi" }, "400": error("Geçersiz süzgeç."), "401": error("Oturum gerekli.") },
      },
      post: {
        tags: ["Talepler"],
        summary: "Yeni talep oluştur",
        description: "Durum her zaman Yeni olur. Ek içeriği saklanmaz. Yanıtta contentStored false döner.",
        security: bearer,
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/CreateRequest" }) },
        responses: {
          "201": { description: "Talep oluşturuldu" },
          "200": { description: "Aynı clientRequestId ile daha önce oluşturulan talep" },
          "400": error("Zorunlu alan veya ek kuralı karşılanmadı."),
          "401": error("Oturum gerekli."),
        },
      },
    },
    "/api/requests/{id}": {
      get: {
        tags: ["Talepler"],
        summary: "Talep detayını getir",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        responses: {
          "200": { description: "Talep, yazışma, geçmiş ve ek üstverisi" },
          "401": error("Oturum gerekli."),
          "404": error("Talep bulunamadı."),
        },
      },
    },
    "/api/requests/{id}/messages": {
      post: {
        tags: ["Talepler"],
        summary: "Talebe çalışan mesajı ekle",
        description: "Son güncelleme yenilenir. Otomatik destek yanıtı üretilmez ve durum değişmez.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/MessageRequest" }) },
        responses: {
          "201": { description: "Güncellenmiş talep" },
          "400": error("Mesaj boş olamaz."),
          "401": error("Oturum gerekli."),
          "404": error("Talep bulunamadı."),
        },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Bildirimler"],
        summary: "Bildirimleri ve okunmamış sayıyı getir",
        security: bearer,
        responses: { "200": { description: "Bildirim listesi" }, "401": error("Oturum gerekli.") },
      },
    },
    "/api/notifications/{id}/read": {
      patch: {
        tags: ["Bildirimler"],
        summary: "Bildirimi okundu işaretle",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
        responses: {
          "200": { description: "Güncellenmiş bildirim" },
          "401": error("Oturum gerekli."),
          "404": error("Bildirim bulunamadı."),
        },
      },
    },
    "/api/notifications/read-all": {
      post: {
        tags: ["Bildirimler"],
        summary: "Tüm bildirimleri okundu işaretle",
        security: bearer,
        responses: { "200": { description: "Okunmamış sayı sıfırlanır" }, "401": error("Oturum gerekli.") },
      },
    },
    "/api/sources": {
      get: {
        tags: ["Kaynaklar"],
        summary: "Örnek kaynak belgelerini listele",
        security: bearer,
        responses: { "200": { description: "Kaynak listesi" }, "401": error("Oturum gerekli.") },
      },
    },
    "/api/sources/{id}": {
      get: {
        tags: ["Kaynaklar"],
        summary: "Kaynak belgesini getir",
        security: bearer,
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", enum: ["izin", "vpn", "bordro", "masraf"] }, example: "vpn" },
        ],
        responses: {
          "200": { description: "Belge adı, bölüm ve metin" },
          "401": error("Oturum gerekli."),
          "404": error("Kaynak bulunamadı."),
        },
      },
    },
    "/api/conversations": {
      get: {
        tags: ["Asistan"],
        summary: "Sohbetleri listele",
        security: bearer,
        responses: { "200": { description: "Sohbet listesi" }, "401": error("Oturum gerekli.") },
      },
      post: {
        tags: ["Asistan"],
        summary: "Yeni sohbet aç",
        security: bearer,
        requestBody: { required: false, content: json({ $ref: "#/components/schemas/ConversationRequest" }) },
        responses: { "201": { description: "Sohbet oluşturuldu" }, "401": error("Oturum gerekli.") },
      },
    },
    "/api/conversations/{id}": {
      get: {
        tags: ["Asistan"],
        summary: "Sohbeti ve mesajlarını getir",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Sohbet" },
          "401": error("Oturum gerekli."),
          "404": error("Sohbet bulunamadı."),
        },
      },
    },
    "/api/conversations/{id}/messages": {
      post: {
        tags: ["Asistan"],
        summary: "Soru gönder ve kural tabanlı yanıt al",
        description: "izin, vpn, bordro ve masraf konuları ilgili belgeye bağlanır. Eşleşme yoksa bilgi bulunamadığı söylenir.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/QuestionRequest" }) },
        responses: {
          "201": { description: "Kullanıcı sorusu ve asistan yanıtı" },
          "400": error("Soru boş olamaz."),
          "401": error("Oturum gerekli."),
          "404": error("Sohbet bulunamadı."),
        },
      },
    },
    "/api/assistant/messages/{id}/feedback": {
      patch: {
        tags: ["Asistan"],
        summary: "Asistan yanıtını değerlendir",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/FeedbackRequest" }) },
        responses: {
          "200": { description: "Değerlendirilmiş yanıt" },
          "400": error("Yalnızca asistan yanıtı değerlendirilebilir."),
          "401": error("Oturum gerekli."),
          "404": error("Mesaj bulunamadı."),
        },
      },
    },
  },
};
