import {
  ATTACHMENT_MIME_TYPES,
  CATEGORIES,
  DEMO_EMAIL,
  DEMO_LOGIN_MESSAGE,
  DEMO_PASSWORD,
  DEMO_SUPPORT_ACCOUNTS,
  MAX_ASSISTANT_CONTEXT_LENGTH,
  MAX_CLOSE_REASON_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_SUBJECT_LENGTH,
  PRIORITIES,
  REQUEST_STATUSES,
  TIMELINE_EVENT_TYPES,
  USER_ROLES,
} from "../config/constants.js";

const categoryNames = Object.keys(CATEGORIES);
const categoryHelp = Object.entries(CATEGORIES)
  .map(([name, subcategories]) => `${name}: ${subcategories.join(", ")}`)
  .join(". ");

const errorSchema = { $ref: "#/components/schemas/Error" };
const bearer = [{ bearerAuth: [] }];
const supportAccounts = DEMO_SUPPORT_ACCOUNTS.map(
  (account) => `${account.email} (${account.team})`,
).join(", ");
const statusCounts = Object.fromEntries(
  REQUEST_STATUSES.map((status) => [status, { type: "integer" }]),
);

function json(schema: object, example?: unknown) {
  return {
    "application/json": {
      schema,
      ...(example === undefined ? {} : { example }),
    },
  };
}

function error(description: string, example = description) {
  return {
    description,
    content: json(errorSchema, { error: example }),
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
      `Demo destek personeli hesapları aynı parolayı kullanır: ${supportAccounts}.`,
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
    { name: "Asistan", description: "Kaynak bölümlerinden alıntı yapan bilgi asistanı" },
    { name: "Destek Personeli", description: "Demo destek personeli kuyruğu ve talep yönetimi" },
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
          role: { type: "string", enum: [...USER_ROLES] },
          team: { type: "string", nullable: true },
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
          name: { type: "string", maxLength: MAX_FILE_NAME_LENGTH, example: "ekran.png" },
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
          subject: { type: "string", maxLength: MAX_SUBJECT_LENGTH, example: "VPN bağlantısı kurulmuyor" },
          description: {
            type: "string",
            maxLength: MAX_DESCRIPTION_LENGTH,
            example: "Ev ağından bağlanırken oturum kapanıyor.",
          },
          priority: { type: "string", enum: [...PRIORITIES] },
          assistantContext: { type: "string", maxLength: MAX_ASSISTANT_CONTEXT_LENGTH },
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
        properties: { text: { type: "string", maxLength: MAX_MESSAGE_LENGTH, example: "Windows 11 kullanıyorum." } },
      },
      QuestionRequest: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string", maxLength: MAX_QUESTION_LENGTH, example: "VPN bağlantısını nasıl kurarım?" } },
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
      SourceDocument: {
        type: "object",
        required: ["id", "title", "section", "excerpt", "updatedAt", "demo", "documentId", "category", "subcategory"],
        properties: {
          id: { type: "string", example: "izin" },
          title: { type: "string", example: "Yıllık İzin Politikası" },
          section: { type: "string", example: "Başvuru süreci" },
          excerpt: { type: "string" },
          updatedAt: { type: "string", example: "2026-08-12" },
          demo: { type: "boolean", enum: [true] },
          documentId: { type: "string", example: "yillik-izin" },
          category: { type: "string", example: "İnsan Kaynakları" },
          subcategory: { type: "string", example: "İzinler" },
        },
        description: "Liste ve mesajlarda bölümün tam metni (body) dönmez.",
      },
      SourceDocumentDetail: {
        allOf: [
          { $ref: "#/components/schemas/SourceDocument" },
          {
            type: "object",
            required: ["body"],
            properties: { body: { type: "string", description: "Bölümün tam metni." } },
          },
        ],
      },
      ConversationMessage: {
        type: "object",
        required: ["id", "role", "text", "createdAt", "helpful", "source", "sources", "answerMode"],
        properties: {
          id: { type: "integer" },
          role: { type: "string", enum: ["user", "assistant"] },
          text: { type: "string" },
          createdAt: { type: "string" },
          helpful: { type: "boolean", nullable: true },
          source: { allOf: [{ $ref: "#/components/schemas/SourceDocument" }], nullable: true },
          sources: { type: "array", items: { $ref: "#/components/schemas/SourceDocument" } },
          answerMode: {
            type: "string",
            nullable: true,
            enum: ["quote", "no_source", "generated", "legacy"],
            description: "Kullanıcı mesajında null. v2 öncesi asistan mesajları legacy.",
          },
        },
      },
      SupportRequestListItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          number: { type: "string" },
          subject: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          subcategory: { type: "string" },
          priority: { type: "string", enum: [...PRIORITIES] },
          status: { type: "string", enum: [...REQUEST_STATUSES] },
          team: { type: "string" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
          assistantContext: { type: "string", nullable: true },
          employee: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              department: { type: "string" },
            },
          },
          assignee: {
            type: "object",
            nullable: true,
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
        },
      },
      SupportTimelineItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          label: { type: "string" },
          actor: { type: "string" },
          createdAt: { type: "string" },
          detail: { type: "string", nullable: true },
          eventType: { type: "string", enum: [...TIMELINE_EVENT_TYPES] },
          visibility: { type: "string", enum: ["public", "internal"] },
          actorId: { type: "integer", nullable: true },
          fromStatus: { type: "string", nullable: true, enum: [...REQUEST_STATUSES] },
          toStatus: { type: "string", nullable: true, enum: [...REQUEST_STATUSES] },
        },
      },
      InternalNote: {
        type: "object",
        properties: {
          id: { type: "integer" },
          author: {
            type: "object",
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
          text: { type: "string" },
          createdAt: { type: "string" },
        },
      },
      SupportRequestDetail: {
        allOf: [
          { $ref: "#/components/schemas/SupportRequestListItem" },
          {
            type: "object",
            properties: {
              employee: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  department: { type: "string" },
                  title: { type: "string" },
                  email: { type: "string" },
                },
              },
              contentStored: { type: "boolean", enum: [false] },
              attachments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    mimeType: { type: "string" },
                    sizeBytes: { type: "integer" },
                  },
                },
              },
              messages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    author: { type: "string" },
                    role: { type: "string", enum: ["employee", "support"] },
                    text: { type: "string" },
                    createdAt: { type: "string" },
                  },
                },
              },
              timeline: {
                type: "array",
                items: { $ref: "#/components/schemas/SupportTimelineItem" },
              },
              internalNotes: {
                type: "array",
                items: { $ref: "#/components/schemas/InternalNote" },
              },
            },
          },
        ],
      },
      StaffMember: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          initials: { type: "string" },
          title: { type: "string" },
          team: { type: "string" },
          openAssigned: { type: "integer" },
        },
      },
      SupportSummary: {
        type: "object",
        properties: {
          team: { type: "string" },
          open: { type: "integer" },
          unassigned: { type: "integer" },
          mine: { type: "integer" },
          waiting: { type: "integer" },
          byStatus: { type: "object", properties: statusCounts },
        },
      },
      AssignRequest: {
        type: "object",
        required: ["assigneeId", "expectedUpdatedAt"],
        properties: {
          assigneeId: { type: "integer", minimum: 1 },
          expectedUpdatedAt: { type: "string", minLength: 1 },
        },
      },
      StatusChangeRequest: {
        type: "object",
        required: ["status", "expectedUpdatedAt"],
        properties: {
          status: { type: "string", enum: [...REQUEST_STATUSES] },
          reason: { type: "string", maxLength: MAX_CLOSE_REASON_LENGTH },
          expectedUpdatedAt: { type: "string", minLength: 1 },
        },
      },
      NoteRequest: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string", minLength: 1, maxLength: MAX_NOTE_LENGTH },
        },
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
        responses: { "200": { description: "Özet" }, "401": error("Oturum gerekli."), "403": error("Bu işlem için yetkiniz yok.") },
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
        responses: { "200": { description: "Talep listesi" }, "400": error("Geçersiz süzgeç."), "401": error("Oturum gerekli."), "403": error("Bu işlem için yetkiniz yok.") },
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
          "403": error("Bu işlem için yetkiniz yok."),
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
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Talep bulunamadı."),
        },
      },
    },
    "/api/requests/{id}/messages": {
      post: {
        tags: ["Talepler"],
        summary: "Talebe çalışan mesajı ekle",
        description:
          "Son güncelleme yenilenir. Otomatik destek yanıtı üretilmez. Durum Kullanıcıdan Bilgi Bekleniyor ise aynı işlemde İnceleniyor olur; geçmişe önce Mesaj gönderildi, ardından aktörü Sistem olan Durum güncellendi: İnceleniyor satırı yazılır ve bu otomatik geçiş için bildirim oluşmaz. Kapatıldı durumundaki talebe mesaj eklenemez. Çözüldü durumunda mesaj eklenebilir.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/MessageRequest" }) },
        responses: {
          "201": { description: "Güncellenmiş talep" },
          "400": error("Mesaj boş olamaz."),
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Talep bulunamadı."),
          "409": error("Kapatılmış talebe mesaj eklenemez."),
        },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Bildirimler"],
        summary: "Bildirimleri ve okunmamış sayıyı getir",
        security: bearer,
        responses: { "200": { description: "Bildirim listesi" }, "401": error("Oturum gerekli."), "403": error("Bu işlem için yetkiniz yok.") },
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
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Bildirim bulunamadı."),
        },
      },
    },
    "/api/notifications/read-all": {
      post: {
        tags: ["Bildirimler"],
        summary: "Tüm bildirimleri okundu işaretle",
        security: bearer,
        responses: { "200": { description: "Okunmamış sayı sıfırlanır" }, "401": error("Oturum gerekli."), "403": error("Bu işlem için yetkiniz yok.") },
      },
    },
    "/api/sources": {
      get: {
        tags: ["Kaynaklar"],
        summary: "Örnek kaynak bölümlerini listele",
        description: "Her kayıt bir belge bölümüdür. Yanıtta body yoktur.",
        security: bearer,
        responses: { "200": { description: "Kaynak listesi" }, "401": error("Oturum gerekli."), "403": error("Bu işlem için yetkiniz yok.") },
      },
    },
    "/api/sources/{id}": {
      get: {
        tags: ["Kaynaklar"],
        summary: "Kaynak bölümünü getir",
        description: "body yalnız bu uçta döner.",
        security: bearer,
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "vpn" },
        ],
        responses: {
          "200": {
            description: "Belge adı, bölüm ve tam metin",
            content: json({ $ref: "#/components/schemas/SourceDocumentDetail" }),
          },
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Kaynak bulunamadı."),
        },
      },
    },
    "/api/conversations": {
      get: {
        tags: ["Asistan"],
        summary: "Sohbetleri listele",
        security: bearer,
        responses: { "200": { description: "Sohbet listesi" }, "401": error("Oturum gerekli."), "403": error("Bu işlem için yetkiniz yok.") },
      },
      post: {
        tags: ["Asistan"],
        summary: "Yeni sohbet aç",
        security: bearer,
        requestBody: { required: false, content: json({ $ref: "#/components/schemas/ConversationRequest" }) },
        responses: { "201": { description: "Sohbet oluşturuldu" }, "401": error("Oturum gerekli."), "403": error("Bu işlem için yetkiniz yok.") },
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
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Sohbet bulunamadı."),
        },
      },
    },
    "/api/conversations/{id}/messages": {
      post: {
        tags: ["Asistan"],
        summary: "Soru gönder ve kaynaklı yanıt al",
        description:
          "Soru bölüm düzeyinde aranır. Eşleşme yoksa sağlayıcı çağrılmaz, answerMode no_source olur ve sources boştur. Eşleşme varsa ve üretim doğrulanırsa answerMode generated olur; sources yalnızca atıf yapılan bölümleri atıf sırasıyla içerir. Anahtar yoksa, hata, zaman aşımı, kota, geçersiz çıktı, yetersiz bilgi, boş veya yabancı atıf ya da hız sınırı durumunda answerMode quote olur: sabit giriş cümlesi, en iyi bölümün değiştirilmemiş metni ve varsa diğer ilgili kaynaklar. source, sources dizisinin ilk elemanı ya da null'dur. Kullanıcı mesajında sources boş, answerMode null'dur.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/QuestionRequest" }) },
        responses: {
          "201": { description: "Kullanıcı sorusu ve asistan yanıtı" },
          "400": error("Soru boş olamaz."),
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
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
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Mesaj bulunamadı."),
        },
      },
    },
    "/api/support/summary": {
      get: {
        tags: ["Destek Personeli"],
        summary: "Ekip özetini getir",
        description: "Açık, atanmamış, bana atanmış ve kullanıcıdan bilgi bekleyen sayılar ekibin talep kayıtlarından hesaplanır.",
        security: bearer,
        responses: {
          "200": { description: "Ekip özeti", content: json({ $ref: "#/components/schemas/SupportSummary" }) },
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
        },
      },
    },
    "/api/support/requests": {
      get: {
        tags: ["Destek Personeli"],
        summary: "Ekip kuyruğunu veya bana atananları listele",
        description: "Yalnızca personelin ekibindeki talepler döner. Sıralama oluşturulma zamanı artan, sonra id artandır. status verilirse scope yok sayılır.",
        security: bearer,
        parameters: [
          { name: "queue", in: "query", schema: { type: "string", enum: ["team", "mine"], default: "team" }, description: "Varsayılan team." },
          { name: "scope", in: "query", schema: { type: "string", enum: ["all", "open", "closed"], default: "open" }, description: "Varsayılan open. status verilirse yok sayılır." },
          { name: "status", in: "query", schema: { type: "string", enum: [...REQUEST_STATUSES] } },
          { name: "priority", in: "query", schema: { type: "string", enum: [...PRIORITIES] } },
          { name: "unassigned", in: "query", schema: { type: "string", enum: ["true"] }, description: "Yalnızca true kabul edilir." },
          { name: "q", in: "query", schema: { type: "string" }, description: "Talep numarası, konu veya çalışan adı. Türkçe harf duyarsız." },
        ],
        responses: {
          "200": {
            description: "Talep listesi",
            content: json({
              type: "object",
              properties: {
                requests: { type: "array", items: { $ref: "#/components/schemas/SupportRequestListItem" } },
              },
            }),
          },
          "400": error("Geçersiz süzgeç."),
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
        },
      },
    },
    "/api/support/requests/{id}": {
      get: {
        tags: ["Destek Personeli"],
        summary: "Ekip talebinin detayını getir",
        description: "Tüm durum geçmişini ve iç notları içerir. Başka ekibin talebi bulunamadı sayılır.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        responses: {
          "200": { description: "Talep detayı", content: json({ $ref: "#/components/schemas/SupportRequestDetail" }) },
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Talep bulunamadı."),
        },
      },
    },
    "/api/support/staff": {
      get: {
        tags: ["Destek Personeli"],
        summary: "Aynı ekipteki destek personelini listele",
        description: "Personelin kendisi dahildir. Sıralama ada göredir.",
        security: bearer,
        responses: {
          "200": {
            description: "Ekip arkadaşları",
            content: json({
              type: "object",
              properties: {
                staff: { type: "array", items: { $ref: "#/components/schemas/StaffMember" } },
              },
            }),
          },
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
        },
      },
    },
    "/api/support/requests/{id}/claim": {
      post: {
        tags: ["Destek Personeli"],
        summary: "Atanmamış talebi üstlen",
        description:
          "Yalnızca atanmamış açık talep üstlenilir. Koşullu güncelleme assignee boşken başarılı olur. İşlem kaydı iç kullanımdır ve çalışana görünmez. Bildirim oluşmaz.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        responses: {
          "200": { description: "Güncellenmiş talep", content: json({ $ref: "#/components/schemas/SupportRequestDetail" }) },
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Talep bulunamadı."),
          "409": error(
            "Talep zaten size atanmış. Talep başka bir personele atanmış. Kapatılmış talepte işlem yapılamaz.",
            "Kapatılmış talepte işlem yapılamaz.",
          ),
        },
      },
    },
    "/api/support/requests/{id}/assign": {
      post: {
        tags: ["Destek Personeli"],
        summary: "Talebi aynı ekipteki personele ata",
        description:
          "Ekipteki her destek personeli atayabilir. expectedUpdatedAt talebin görülen güncelleme zamanıdır. İşlem kaydı iç kullanımdır. Bildirim oluşmaz.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/AssignRequest" }) },
        responses: {
          "200": { description: "Güncellenmiş talep", content: json({ $ref: "#/components/schemas/SupportRequestDetail" }) },
          "400": error(
            "Atanacak personel seçilmelidir. Güncelleme zamanı zorunludur. Talep yalnızca aynı ekipteki destek personeline atanabilir.",
            "Talep yalnızca aynı ekipteki destek personeline atanabilir.",
          ),
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Talep bulunamadı."),
          "409": error(
            "Talep siz işlem yaparken güncellendi. Güncel hâlini görüntüleyip tekrar deneyin. Kapatılmış talepte işlem yapılamaz. Talep zaten bu personele atanmış.",
            "Talep zaten bu personele atanmış.",
          ),
        },
      },
    },
    "/api/support/requests/{id}/status": {
      post: {
        tags: ["Destek Personeli"],
        summary: "Talep durumunu değiştir",
        description:
          "Yalnızca talebe atanan personel, izin verilen geçişlerle durum değiştirir. Kapatıldı için gerekçe zorunludur ve çalışana durum geçmişinde görünür. Çalışana bildirim oluşur.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/StatusChangeRequest" }) },
        responses: {
          "200": { description: "Güncellenmiş talep", content: json({ $ref: "#/components/schemas/SupportRequestDetail" }) },
          "400": error(
            "Bilinmeyen talep durumu. Güncelleme zamanı zorunludur. Gerekçe metin olmalıdır. Gerekçe en fazla 500 karakter olabilir. Kapatma gerekçesi zorunludur. reason alanı null gönderilirse 400 döner ve mesaj Gerekçe metin olmalıdır.",
            "Kapatma gerekçesi zorunludur.",
          ),
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Talep bulunamadı."),
          "409": error(
            'Talep siz işlem yaparken güncellendi. Güncel hâlini görüntüleyip tekrar deneyin. Kapatılmış talepte işlem yapılamaz. Bu işlem yalnızca talebe atanan personel tarafından yapılabilir. Talep zaten bu durumda. "<mevcut>" durumundan "<yeni>" durumuna geçilemez.',
            "Talep zaten bu durumda.",
          ),
        },
      },
    },
    "/api/support/requests/{id}/messages": {
      post: {
        tags: ["Destek Personeli"],
        summary: "Çalışana demo destek mesajı yaz",
        description:
          "Yalnızca talebe atanan personel mesaj yazar. Mesaj çalışanın yazışmasında destek ekibi mesajı olarak görünür ve çalışana bildirim oluşur. Demo mesajdır; canlı destek yanıtı değildir.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/MessageRequest" }) },
        responses: {
          "201": { description: "Güncellenmiş talep", content: json({ $ref: "#/components/schemas/SupportRequestDetail" }) },
          "400": error(
            "Mesaj boş olamaz. Mesaj en fazla 2000 karakter olabilir.",
            "Mesaj boş olamaz.",
          ),
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Talep bulunamadı."),
          "409": error(
            "Kapatılmış talepte işlem yapılamaz. Bu işlem yalnızca talebe atanan personel tarafından yapılabilir.",
            "Kapatılmış talepte işlem yapılamaz.",
          ),
        },
      },
    },
    "/api/support/requests/{id}/notes": {
      post: {
        tags: ["Destek Personeli"],
        summary: "İç not ekle",
        description:
          "Ekipteki her destek personeli iç not ekleyebilir. Not ve işlem kaydı çalışana görünmez; bildirim oluşmaz ve son güncelleme zamanı değişmez.",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/NoteRequest" }) },
        responses: {
          "201": { description: "Güncellenmiş talep", content: json({ $ref: "#/components/schemas/SupportRequestDetail" }) },
          "400": error(
            "Not boş olamaz. Not en fazla 2000 karakter olabilir.",
            "Not boş olamaz.",
          ),
          "401": error("Oturum gerekli."),
          "403": error("Bu işlem için yetkiniz yok."),
          "404": error("Talep bulunamadı."),
          "409": error("Kapatılmış talepte işlem yapılamaz."),
        },
      },
    },
  },
};
