import type { NotificationItem, SourceDocument, SupportRequest } from "./types";

export const profile = {
  name: "Deniz Yılmaz",
  initials: "DY",
  title: "Kıdemli Ürün Uzmanı",
  department: "Dijital Ürünler",
  email: "deniz.yilmaz@ornek-kurum.com",
  employeeNo: "S-10428",
  location: "İstanbul Merkez Ofis",
};

export const categories: Record<string, string[]> = {
  "Bilgi Teknolojileri": [
    "VPN ve Uzaktan Erişim",
    "Donanım",
    "Yazılım",
    "Hesap ve Yetki",
  ],
  "İnsan Kaynakları": ["İzinler", "Yan Haklar", "Özlük İşlemleri", "Bordro"],
  "Finans ve İdari İşler": ["Masraf Bildirimi", "Satın Alma", "Seyahat"],
  "İşyeri Hizmetleri": ["Ofis ve Ekipman", "Ulaşım", "Yemek"],
};

const timeline = (createdAt: string, status: string, updatedAt: string) => [
  { label: "Talep oluşturuldu", date: createdAt },
  { label: `Durum güncellendi: ${status}`, date: updatedAt },
];

const request = (
  id: number,
  number: string,
  subject: string,
  category: string,
  subcategory: string,
  status: SupportRequest["status"],
  priority: SupportRequest["priority"],
  createdAt: string,
  updatedAt: string,
  description: string,
): SupportRequest => ({
  id,
  number,
  subject,
  category,
  subcategory,
  status,
  priority,
  createdAt,
  updatedAt,
  description,
  team:
    category === "Bilgi Teknolojileri"
      ? "BT Destek Ekibi"
      : `${category} Ekibi`,
  attachments: [],
  messages:
    id === 2
      ? [
          {
            id: 1,
            author: "BT Destek",
            role: "support",
            text: "Bağlantı kaydınızı inceliyoruz. Kullandığınız işletim sistemi bilgisini paylaşabilir misiniz?",
            date: "22 Eyl 2026, 14:35",
          },
        ]
      : [],
  timeline: timeline(createdAt, status, updatedAt),
});

export const initialRequests: SupportRequest[] = [
  request(
    1,
    "DST-2026-1042",
    "Eylül bordromdaki yemek kesintisi",
    "İnsan Kaynakları",
    "Bordro",
    "İnceleniyor",
    "Normal",
    "21 Eyl 2026, 09:12",
    "Bugün, 10:24",
    "Eylül bordromda yemek desteği kesintisi görünüyor. Kontrol edilmesini rica ederim.",
  ),
  request(
    2,
    "DST-2026-1041",
    "VPN bağlantısı sık sık kopuyor",
    "Bilgi Teknolojileri",
    "VPN ve Uzaktan Erişim",
    "Kullanıcıdan Bilgi Bekleniyor",
    "Yüksek",
    "20 Eyl 2026, 16:40",
    "22 Eyl 2026, 14:35",
    "Ev ağından bağlandığımda VPN oturumu yaklaşık on dakikada bir kapanıyor.",
  ),
  request(
    3,
    "DST-2026-1038",
    "Harici monitör talebi",
    "Bilgi Teknolojileri",
    "Donanım",
    "Devam Ediyor",
    "Normal",
    "18 Eyl 2026, 11:06",
    "21 Eyl 2026, 15:20",
    "Evden çalışma günleri için harici monitör talep ediyorum.",
  ),
  request(
    4,
    "DST-2026-1032",
    "Ağustos ulaşım masrafı",
    "Finans ve İdari İşler",
    "Masraf Bildirimi",
    "Çözüldü",
    "Normal",
    "12 Eyl 2026, 13:44",
    "17 Eyl 2026, 09:30",
    "Ulaşım masrafımın ödeme listesinde görünmediğini fark ettim.",
  ),
  request(
    5,
    "DST-2026-1027",
    "Yıllık izin bakiyesi",
    "İnsan Kaynakları",
    "İzinler",
    "Kapatıldı",
    "Düşük",
    "8 Eyl 2026, 10:15",
    "11 Eyl 2026, 16:05",
    "İzin bakiyemde iki günlük fark bulunuyor.",
  ),
  request(
    6,
    "DST-2026-1020",
    "Proje klasörü erişim yetkisi",
    "Bilgi Teknolojileri",
    "Hesap ve Yetki",
    "Yeni",
    "Yüksek",
    "5 Eyl 2026, 14:22",
    "5 Eyl 2026, 14:22",
    "Yeni proje klasörü için düzenleme yetkisine ihtiyacım var.",
  ),
  request(
    7,
    "DST-2026-1018",
    "Seyahat avansı süreci",
    "Finans ve İdari İşler",
    "Seyahat",
    "Çözüldü",
    "Normal",
    "3 Eyl 2026, 09:32",
    "6 Eyl 2026, 12:48",
    "Müşteri ziyareti öncesi seyahat avansı sürecini öğrenmek istiyorum.",
  ),
  request(
    8,
    "DST-2026-1012",
    "Yeni çalışan ekipmanları",
    "İşyeri Hizmetleri",
    "Ofis ve Ekipman",
    "Devam Ediyor",
    "Normal",
    "29 Ağu 2026, 15:11",
    "2 Eyl 2026, 11:10",
    "Ekibimize katılacak çalışan için masa ekipmanları hazırlanmalı.",
  ),
  request(
    9,
    "DST-2026-1008",
    "Lisans yenileme talebi",
    "Bilgi Teknolojileri",
    "Yazılım",
    "Kapatıldı",
    "Düşük",
    "25 Ağu 2026, 10:44",
    "28 Ağu 2026, 17:00",
    "Tasarım uygulaması lisansımın yenilenmesini rica ederim.",
  ),
  request(
    10,
    "DST-2026-1003",
    "Yan hak seçim ekranı",
    "İnsan Kaynakları",
    "Yan Haklar",
    "İnceleniyor",
    "Normal",
    "18 Ağu 2026, 08:55",
    "19 Ağu 2026, 14:18",
    "Yan hak tercihlerimi kaydederken ekran hata veriyor.",
  ),
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Talebiniz güncellendi",
    text: "DST-2026-1042 numaralı talebiniz inceleniyor.",
    date: "Bugün, 10:24",
    read: false,
    requestId: 1,
  },
  {
    id: 2,
    title: "Bilgi bekleniyor",
    text: "BT Destek, VPN talebiniz için ek bilgi istedi.",
    date: "Dün, 14:35",
    read: false,
    requestId: 2,
  },
  {
    id: 3,
    title: "Talebiniz çözüldü",
    text: "DST-2026-1032 numaralı talebiniz çözüldü.",
    date: "17 Eyl, 09:30",
    read: true,
    requestId: 4,
  },
];

export const sourceDocuments: SourceDocument[] = [
  {
    id: "izin",
    title: "Çalışan İzin Prosedürü",
    section: "4.2 Yıllık İzin Kullanımı",
    excerpt:
      "Yıllık izin talepleri planlanan başlangıç tarihinden en az üç iş günü önce çalışan portalından iletilir. Yönetici onayı sonrasında izin bakiyesinden düşülür.",
    updatedAt: "12 Ağustos 2026",
  },
  {
    id: "vpn",
    title: "Uzaktan Erişim Rehberi",
    section: "3.1 VPN Bağlantısı",
    excerpt:
      "Kurumsal VPN bağlantısı için çok faktörlü kimlik doğrulama gerekir. İlk bağlantıda şirket cihazına kurulu istemci ve güncel parola kullanılmalıdır.",
    updatedAt: "2 Eylül 2026",
  },
  {
    id: "bordro",
    title: "Bordro ve Yan Haklar Rehberi",
    section: "2.4 Bordro Görüntüleme",
    excerpt:
      "Aylık bordrolar takip eden ayın ilk iş gününde çalışan portalında yayımlanır. Kesinti ayrıntıları bordro açıklamaları alanında gösterilir.",
    updatedAt: "30 Ağustos 2026",
  },
  {
    id: "masraf",
    title: "Masraf Yönetimi Prosedürü",
    section: "5.3 Belge Yükleme",
    excerpt:
      "Masraf belgeleri harcama tarihinden itibaren on iş günü içinde PDF, PNG veya JPG biçiminde sisteme yüklenmelidir.",
    updatedAt: "18 Temmuz 2026",
  },
];
