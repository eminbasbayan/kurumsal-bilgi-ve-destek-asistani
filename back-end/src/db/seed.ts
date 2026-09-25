import type { DatabaseSync } from "node:sqlite";
import { DEMO_EMAIL, DEMO_PASSWORD, teamFor } from "../config/constants.js";
import { hashPassword } from "../shared/passwords.js";
import { insertedId, transaction } from "./sql.js";

type SeedRequest = {
  id: number;
  number: string;
  subject: string;
  category: string;
  subcategory: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  description: string;
};

const at = (value: string) => new Date(value).toISOString();

const requests: SeedRequest[] = [
  {
    id: 1,
    number: "DST-2026-1042",
    subject: "Eylül bordromdaki yemek kesintisi",
    category: "İnsan Kaynakları",
    subcategory: "Bordro",
    status: "İnceleniyor",
    priority: "Normal",
    createdAt: at("2026-09-21T09:12:00+03:00"),
    updatedAt: at("2026-09-25T10:24:00+03:00"),
    description:
      "Eylül bordromda yemek desteği kesintisi görünüyor. Kontrol edilmesini rica ederim.",
  },
  {
    id: 2,
    number: "DST-2026-1041",
    subject: "VPN bağlantısı sık sık kopuyor",
    category: "Bilgi Teknolojileri",
    subcategory: "VPN ve Uzaktan Erişim",
    status: "Kullanıcıdan Bilgi Bekleniyor",
    priority: "Yüksek",
    createdAt: at("2026-09-20T16:40:00+03:00"),
    updatedAt: at("2026-09-22T14:35:00+03:00"),
    description:
      "Ev ağından bağlandığımda VPN oturumu yaklaşık on dakikada bir kapanıyor.",
  },
  {
    id: 3,
    number: "DST-2026-1038",
    subject: "Harici monitör talebi",
    category: "Bilgi Teknolojileri",
    subcategory: "Donanım",
    status: "Devam Ediyor",
    priority: "Normal",
    createdAt: at("2026-09-18T11:06:00+03:00"),
    updatedAt: at("2026-09-21T15:20:00+03:00"),
    description: "Evden çalışma günleri için harici monitör talep ediyorum.",
  },
  {
    id: 4,
    number: "DST-2026-1032",
    subject: "Ağustos ulaşım masrafı",
    category: "Finans ve İdari İşler",
    subcategory: "Masraf Bildirimi",
    status: "Çözüldü",
    priority: "Normal",
    createdAt: at("2026-09-12T13:44:00+03:00"),
    updatedAt: at("2026-09-17T09:30:00+03:00"),
    description: "Ulaşım masrafımın ödeme listesinde görünmediğini fark ettim.",
  },
  {
    id: 5,
    number: "DST-2026-1027",
    subject: "Yıllık izin bakiyesi",
    category: "İnsan Kaynakları",
    subcategory: "İzinler",
    status: "Kapatıldı",
    priority: "Düşük",
    createdAt: at("2026-09-08T10:15:00+03:00"),
    updatedAt: at("2026-09-11T16:05:00+03:00"),
    description: "İzin bakiyemde iki günlük fark bulunuyor.",
  },
  {
    id: 6,
    number: "DST-2026-1020",
    subject: "Proje klasörü erişim yetkisi",
    category: "Bilgi Teknolojileri",
    subcategory: "Hesap ve Yetki",
    status: "Yeni",
    priority: "Yüksek",
    createdAt: at("2026-09-05T14:22:00+03:00"),
    updatedAt: at("2026-09-05T14:22:00+03:00"),
    description: "Yeni proje klasörü için düzenleme yetkisine ihtiyacım var.",
  },
  {
    id: 7,
    number: "DST-2026-1018",
    subject: "Seyahat avansı süreci",
    category: "Finans ve İdari İşler",
    subcategory: "Seyahat",
    status: "Çözüldü",
    priority: "Normal",
    createdAt: at("2026-09-03T09:32:00+03:00"),
    updatedAt: at("2026-09-06T12:48:00+03:00"),
    description:
      "Müşteri ziyareti öncesi seyahat avansı sürecini öğrenmek istiyorum.",
  },
  {
    id: 8,
    number: "DST-2026-1012",
    subject: "Yeni çalışan ekipmanları",
    category: "İşyeri Hizmetleri",
    subcategory: "Ofis ve Ekipman",
    status: "Devam Ediyor",
    priority: "Normal",
    createdAt: at("2026-08-29T15:11:00+03:00"),
    updatedAt: at("2026-09-02T11:10:00+03:00"),
    description: "Ekibimize katılacak çalışan için masa ekipmanları hazırlanmalı.",
  },
  {
    id: 9,
    number: "DST-2026-1008",
    subject: "Lisans yenileme talebi",
    category: "Bilgi Teknolojileri",
    subcategory: "Yazılım",
    status: "Kapatıldı",
    priority: "Düşük",
    createdAt: at("2026-08-25T10:44:00+03:00"),
    updatedAt: at("2026-08-28T17:00:00+03:00"),
    description: "Tasarım uygulaması lisansımın yenilenmesini rica ederim.",
  },
  {
    id: 10,
    number: "DST-2026-1003",
    subject: "Yan hak seçim ekranı",
    category: "İnsan Kaynakları",
    subcategory: "Yan Haklar",
    status: "İnceleniyor",
    priority: "Normal",
    createdAt: at("2026-08-18T08:55:00+03:00"),
    updatedAt: at("2026-08-19T14:18:00+03:00"),
    description: "Yan hak tercihlerimi kaydederken ekran hata veriyor.",
  },
];

const sources = [
  {
    id: "izin",
    title: "Çalışan İzin Prosedürü",
    section: "4.2 Yıllık İzin Kullanımı",
    excerpt:
      "Yıllık izin talepleri planlanan başlangıç tarihinden en az üç iş günü önce çalışan portalından iletilir. Yönetici onayı sonrasında izin bakiyesinden düşülür.",
    updatedAt: "2026-08-12",
  },
  {
    id: "vpn",
    title: "Uzaktan Erişim Rehberi",
    section: "3.1 VPN Bağlantısı",
    excerpt:
      "Kurumsal VPN bağlantısı için çok faktörlü kimlik doğrulama gerekir. İlk bağlantıda şirket cihazına kurulu istemci ve güncel parola kullanılmalıdır.",
    updatedAt: "2026-09-02",
  },
  {
    id: "bordro",
    title: "Bordro ve Yan Haklar Rehberi",
    section: "2.4 Bordro Görüntüleme",
    excerpt:
      "Aylık bordrolar takip eden ayın ilk iş gününde çalışan portalında yayımlanır. Kesinti ayrıntıları bordro açıklamaları alanında gösterilir.",
    updatedAt: "2026-08-30",
  },
  {
    id: "masraf",
    title: "Masraf Yönetimi Prosedürü",
    section: "5.3 Belge Yükleme",
    excerpt:
      "Masraf belgeleri harcama tarihinden itibaren on iş günü içinde PDF, PNG veya JPG biçiminde sisteme yüklenmelidir.",
    updatedAt: "2026-07-18",
  },
];

export function seedIfEmpty(db: DatabaseSync): void {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM employees").get() as {
    count: number;
  };
  if (Number(existing.count) > 0) return;

  transaction(db, () => {
    const employee = db
      .prepare(
        `INSERT INTO employees
          (name, initials, title, department, email, employee_no, location, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "Deniz Yılmaz",
        "DY",
        "Kıdemli Ürün Uzmanı",
        "Dijital Ürünler",
        DEMO_EMAIL,
        "S-10428",
        "İstanbul Merkez Ofis",
        hashPassword(DEMO_PASSWORD),
      );
    const employeeId = insertedId(employee);

    const insertSource = db.prepare(
      `INSERT INTO source_documents (id, title, section, excerpt, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const source of sources) {
      insertSource.run(
        source.id,
        source.title,
        source.section,
        source.excerpt,
        source.updatedAt,
      );
    }

    const insertRequest = db.prepare(
      `INSERT INTO requests (
        id, employee_id, number, subject, description, category, subcategory,
        priority, status, team, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertTimeline = db.prepare(
      `INSERT INTO request_timeline (request_id, label, actor, created_at)
       VALUES (?, ?, ?, ?)`,
    );
    for (const request of requests) {
      const team = teamFor(request.category);
      insertRequest.run(
        request.id,
        employeeId,
        request.number,
        request.subject,
        request.description,
        request.category,
        request.subcategory,
        request.priority,
        request.status,
        team,
        request.createdAt,
        request.updatedAt,
      );
      insertTimeline.run(
        request.id,
        "Talep oluşturuldu",
        "Deniz Yılmaz",
        request.createdAt,
      );
      insertTimeline.run(
        request.id,
        `Durum güncellendi: ${request.status}`,
        team,
        request.updatedAt,
      );
    }

    db.prepare(
      `INSERT INTO request_messages (request_id, author, role, text, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      2,
      "BT Destek",
      "support",
      "Bağlantı kaydınızı inceliyoruz. Kullandığınız işletim sistemi bilgisini paylaşabilir misiniz?",
      at("2026-09-22T14:35:00+03:00"),
    );

    const insertNotification = db.prepare(
      `INSERT INTO notifications
        (id, employee_id, title, text, created_at, read, request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    insertNotification.run(
      1,
      employeeId,
      "Talebiniz güncellendi",
      "DST-2026-1042 numaralı talebiniz inceleniyor.",
      at("2026-09-25T10:24:00+03:00"),
      0,
      1,
    );
    insertNotification.run(
      2,
      employeeId,
      "Bilgi bekleniyor",
      "BT Destek, VPN talebiniz için ek bilgi istedi.",
      at("2026-09-24T14:35:00+03:00"),
      0,
      2,
    );
    insertNotification.run(
      3,
      employeeId,
      "Talebiniz çözüldü",
      "DST-2026-1032 numaralı talebiniz çözüldü.",
      at("2026-09-17T09:30:00+03:00"),
      1,
      4,
    );
  });
}
