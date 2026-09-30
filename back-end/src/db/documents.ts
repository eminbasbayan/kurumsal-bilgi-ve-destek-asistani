export type CatalogSection = {
  id: string;
  documentId: string;
  title: string;
  section: string;
  excerpt: string;
  body: string;
  category: string;
  subcategory: string;
  updatedAt: string;
  version: number;
};

type DocumentInput = {
  documentId: string;
  title: string;
  category: string;
  subcategory: string;
  updatedAt: string;
  sections: {
    id: string;
    section: string;
    excerpt: string;
    body: string;
  }[];
};

const DOCUMENTS: readonly DocumentInput[] = [
  {
    documentId: "yillik-izin",
    title: "Yıllık İzin Politikası",
    category: "İnsan Kaynakları",
    subcategory: "İzinler",
    updatedAt: "2026-08-12",
    sections: [
      {
        id: "izin",
        section: "Başvuru süreci",
        excerpt:
          "Yıllık izin başvurusu, planlanan başlangıç tarihinden en az üç iş günü önce çalışan portalından iletilir.",
        body: "Yıllık izin başvurusu, planlanan başlangıç tarihinden en az üç iş günü önce çalışan portalından iletilir. Yönetici onayından sonra kullanılan gün sayısı izin bakiyesinden düşülür. Örnek Kurum çalışanı başlangıç ve bitiş tarihini izin ekranında seçer ve kısa bir gerekçe yazar. Onay bekleyen kayıt bakiyeyi henüz düşmez. Reddedilen yıllık izin başvurusu düzeltilerek yeniden gönderilebilir. Hafta sonu günleri yıllık izin süresinden sayılmaz. Başvuru süreci tamamlanmadan izne çıkılmaz.",
      },
      {
        id: "yillik-izin-bakiye",
        section: "Bakiye görüntüleme",
        excerpt: "Kalan yıllık izin bakiyesi, çalışan portalının izin ekranında güncel olarak gösterilir.",
        body: "Kalan yıllık izin bakiyesi, çalışan portalının izin ekranında güncel olarak gösterilir. Örnek Kurum, onaylanan her yıllık izin kaydından sonra bakiyeyi yeniden hesaplar. Çalışan, kalan yıllık izin bakiyesini yıl içinde dilediği zaman görüntüleyebilir. Bekleyen başvurular bakiyeden düşülmüş gibi görünmez. Bakiye eksiye düşecek bir tarih seçilemez. Hatalı görünen kalan yıllık izin bakiyesi için özlük birimine yazılı bildirim yapılır. Ekrandaki bakiye, devredilen günleri de içerir.",
      },
      {
        id: "yillik-izin-devir",
        section: "Devir",
        excerpt: "Kullanılmayan yıllık iznin en fazla beş günü sonraki yıla devredilir.",
        body: "Kullanılmayan yıllık iznin en fazla beş günü sonraki yıla devredilir. Örnek Kurum devir hakkını kendiliğinden işler; ayrı bir sonraki yıla devir formu istenmez. Beş günü aşan kullanılmamış izin yanar ve ücrete çevrilmez. Devir edilen günler yeni yıldaki kalan bakiyeye eklenir. Yıl bitmeden kullanılan izin, sonraki yıla devir hesabına girmez. Çalışan devir edilen günleri izin ekranındaki devir satırından izler. Sonraki yıla devir yalnızca yıllık izin için geçerlidir.",
      },
    ],
  },
  {
    documentId: "mazeret-izni",
    title: "Mazeret ve Hastalık İzni",
    category: "İnsan Kaynakları",
    subcategory: "İzinler",
    updatedAt: "2026-08-20",
    sections: [
      {
        id: "mazeret-izni-bildirim",
        section: "Mazeret bildirimi",
        excerpt: "Mazeret izni bildirimi, iznin başladığı gün mesai bitimine kadar yöneticiye iletilir.",
        body: "Mazeret izni bildirimi, iznin başladığı gün mesai bitimine kadar yöneticiye iletilir. Örnek Kurum çalışanı portalda mazeret izni kaydı açar ve nedenini kısaca yazar. Aynı gün yapılamayan mazeret izni bildirimi, ertesi iş günü sabah tamamlanır. Bildirim yapılmadan kullanılan süre devamsızlık sayılabilir. Mazeret izni yıllık izin bakiyesinden düşülmez. Yönetici kaydı onayladığında durum izinde olarak görünür. Geç yapılan mazeret izni bildirimi gerekçeyle birlikte yeniden değerlendirilir.",
      },
      {
        id: "mazeret-izni-rapor",
        section: "Hastalık raporu",
        excerpt: "Hastalık raporu, rahatsızlığın başladığı günden sonraki iki iş günü içinde portala yüklenir.",
        body: "Hastalık raporu, rahatsızlığın başladığı günden sonraki iki iş günü içinde portala yüklenir. Örnek Kurum, sağlık kuruluşundan alınan hastalık raporunu tek belge olarak kabul eder. Çalışan raporun başlangıç ve bitiş günlerini ekrana yazar. Hastalık raporu yıllık izinden düşülmez ve mazeret izni bildiriminin yerine geçer. Eksik veya okunmayan hastalık raporu iade edilir. Rapor süresi bitmeden işe dönülürse yöneticiye haber verilir. Uzatma gerekirse yeni bir hastalık raporu eklenir.",
      },
      {
        id: "mazeret-izni-sure",
        section: "Süre",
        excerpt: "Mazeret izni süresi bir takvim yılında toplamda beş iş gününü aşamaz.",
        body: "Mazeret izni süresi bir takvim yılında toplamda beş iş gününü aşamaz. Örnek Kurum bu sınırı mazeret kayıtlarından otomatik toplar. Beş günü dolduran çalışan, ek süre için yıllık izin başvurusu yapar. Hastalık raporuyla geçen günler mazeret izni süresine yazılmaz. Yarım gün kullanılan mazeret izni süresi yarım gün olarak işlenir. Sınırın aşıldığı kayıt yöneticiye uyarı olarak düşer. Mazeret izni süresi yıl sonunda sıfırlanır ve devredilmez.",
      },
    ],
  },
  {
    documentId: "bordro-goruntuleme",
    title: "Bordro Görüntüleme ve İtiraz",
    category: "İnsan Kaynakları",
    subcategory: "Bordro",
    updatedAt: "2026-08-30",
    sections: [
      {
        id: "bordro",
        section: "Görüntüleme",
        excerpt: "Aylık bordro, takip eden ayın ilk iş gününde çalışan portalında yayımlanır.",
        body: "Aylık bordro, takip eden ayın ilk iş gününde çalışan portalında yayımlanır. Örnek Kurum bordro görüntüleme ekranını her ay aynı yerde açar. Çalışan kendi bordrosunu seçip brüt, kesinti ve net tutarı okuyabilir. Başka bir çalışanın bordrosu görüntülenemez. Bordro görüntüleme için ek onay gerekmez. Ekranda görünmeyen ay, henüz yayımlanmamış sayılır. Kesinti ayrıntıları bordro görüntüleme sayfasındaki açıklama satırındadır.",
      },
      {
        id: "bordro-goruntuleme-itiraz",
        section: "İtiraz",
        excerpt: "Bordro itirazı, bordronun yayımlandığı günden sonraki on iş günü içinde portaldan açılır.",
        body: "Bordro itirazı, bordronun yayımlandığı günden sonraki on iş günü içinde portaldan açılır. Örnek Kurum itirazı bordro birimine iletir ve sonucu aynı ekrana yazar. Bordro itirazında ay, kalem ve beklenen tutar belirtilir. Süresi geçen bordro itirazı ancak birim uygun görürse incelenir. İnceleme sırasında ödeme takvimi değişmez. Kabul edilen bordro itirazı bir sonraki bordroda düzeltilir. Ret gerekçesi yazılı olarak paylaşılır.",
      },
      {
        id: "bordro-goruntuleme-kesinti",
        section: "Kesinti kalemleri",
        excerpt: "Kesinti kalemleri bordro açıklamasında yasal kesinti, avans ve icra olarak ayrılır.",
        body: "Kesinti kalemleri bordro açıklamasında yasal kesinti, avans ve icra olarak ayrılır. Örnek Kurum her kesinti kalemini tutarıyla birlikte gösterir. Çalışan anlamadığı kesinti kalemi için bordro itirazı açabilir. Yasal kesinti oranları bordroda ayrıca değiştirilemez. Avans kesintisi, onaylanan avans planındaki aya yazılır. İcra kesintisi, bildirilen sıra ve tutarla sınırlıdır. Kesinti kalemleri toplamı net tutarın hesabında yer alır.",
      },
    ],
  },
  {
    documentId: "yan-haklar",
    title: "Yan Haklar: Yemek Kartı ve Sağlık Sigortası",
    category: "İnsan Kaynakları",
    subcategory: "Yan Haklar",
    updatedAt: "2026-07-28",
    sections: [
      {
        id: "yan-haklar-yemek-karti",
        section: "Yemek kartı",
        excerpt: "Yemek kartı yüklemesi her ayın ilk iş gününde yapılır ve o ay içinde kullanılır.",
        body: "Yemek kartı yüklemesi her ayın ilk iş gününde yapılır ve o ay içinde kullanılır. Örnek Kurum tutarı çalışanın kademesine göre belirler ve karta aktarır. Yemek kartı bakiyesi devredilmez ve nakde çevrilmez. Kartın kaybolması halinde çalışan kart numarasını kapatır ve yeni kart ister. Yükleme görünmüyorsa bir iş günü beklenir, sürmesi halinde yan haklar birimine yazılır. Yemek kartı yalnızca yemek ve market harcamasında geçerlidir. Ayrılış ayında yükleme, çalışılan gün oranında yapılır.",
      },
      {
        id: "yan-haklar-saglik",
        section: "Sağlık sigortası",
        excerpt: "Tamamlayıcı sağlık sigortası çalışan ile bildirdiği eş ve çocukları kapsar.",
        body: "Tamamlayıcı sağlık sigortası çalışan ile bildirdiği eş ve çocukları kapsar. Örnek Kurum poliçeyi yılbaşında yeniler ve kapsam özetini portalda yayınlar. Tamamlayıcı sağlık sigortasına giriş için kimlik ve yakınlık bilgisi yeterlidir. Yeni doğan çocuk otuz gün içinde bildirildiğinde kapsama alınır. Poliçenin dışında kalan gider çalışana aittir. Anlaşmalı kuruluş listesi portal bağlantısından izlenir; liste dışındaki kurumun adı yazılmaz. Kapsam soruları yan haklar birimine iletilir.",
      },
      {
        id: "yan-haklar-tercih",
        section: "Tercih dönemi",
        excerpt: "Yan hak tercihi her yıl aralık ayındaki on iş günlük pencerede yapılır.",
        body: "Yan hak tercihi her yıl aralık ayındaki on iş günlük pencerede yapılır. Örnek Kurum pencereyi portal duyurusuyla açar. Çalışan yan hak tercihini yemek kartı tutar dilimi ve sağlık paketi arasından seçer. Süre bitince son kaydedilen yan hak tercihi geçerli olur. Seçim yapılmazsa bir önceki yılın tercihi sürer. Tercih dönemi dışında değişiklik ancak aile durumunda köklü değişiklik varsa kabul edilir. Onaylanan yan hak tercihi ocak ayının ilk gününde yürürlüğe girer.",
      },
    ],
  },
  {
    documentId: "ozluk-belgesi",
    title: "Özlük Belgesi ve Çalışma Belgesi Talebi",
    category: "İnsan Kaynakları",
    subcategory: "Özlük İşlemleri",
    updatedAt: "2026-06-16",
    sections: [
      {
        id: "ozluk-belgesi-talep",
        section: "Özlük örneği",
        excerpt: "Özlük dosyası örneği, çalışan portalındaki belge talebi ekranından istenir.",
        body: "Özlük dosyası örneği, çalışan portalındaki belge talebi ekranından istenir. Örnek Kurum yalnızca çalışanın kendi özlük dosyası örneğini üretir. Talepte hangi belgenin istendiği ve kullanım amacı yazılır. Özlük dosyası örneği kişisel veriyi üçüncü kişiye açık etmez; üzerinde çalışan adı dışında başkası bulunmaz. Islak imza gereken hallerde ofisten teslim alınır. Eksik özlük dosyası örneği yeniden talep edilir. Belge, kayıtlı iletişim adresine de bırakılabilir.",
      },
      {
        id: "ozluk-belgesi-calisma",
        section: "Çalışma belgesi",
        excerpt: "Çalışma belgesi, işe giriş tarihi, unvan ve halen çalışıldığı bilgisini içerir.",
        body: "Çalışma belgesi, işe giriş tarihi, unvan ve halen çalışıldığı bilgisini içerir. Örnek Kurum çalışma belgesini ücret tutarı olmadan düzenler. Çalışan belge dilini ekrandan seçer. Çalışma belgesi başka bir kurumun antetli kâğıdına basılmaz. Ayrılmış çalışan için belge, ayrılış tarihini de gösterir. Hatalı unvan varsa özlük kaydı düzeltildikten sonra yeni çalışma belgesi alınır. Belge üzerindeki tarih, üretildiği gündür.",
      },
      {
        id: "ozluk-belgesi-sure",
        section: "Hazırlık süresi",
        excerpt: "Belge hazırlık süresi, tam başvurudan sonra en fazla beş iş günüdür.",
        body: "Belge hazırlık süresi, tam başvurudan sonra en fazla beş iş günüdür. Örnek Kurum süreyi belge talebi kaydının açıldığı andan başlatır. Eksik bilgi belge hazırlık süresini durdurur ve çalışan uyarılır. Hazır olan belge portalda indirilir veya ofisten teslim alınır. Beş iş gününü aşan belge hazırlık süresi için kayıt numarasıyla yeniden sorulur. Toplu dönemlerde süre duyuruyla uzatılabilir. Acil ibareli talepler sırayı kendiliğinden bozmaz.",
      },
    ],
  },
  {
    documentId: "vpn-kurulum",
    title: "VPN Kurulumu ve Sorun Giderme",
    category: "Bilgi Teknolojileri",
    subcategory: "VPN ve Uzaktan Erişim",
    updatedAt: "2026-09-02",
    sections: [
      {
        id: "vpn",
        section: "Bağlantı adımları",
        excerpt:
          "Kurumsal VPN bağlantısı için şirket cihazındaki güncel istemci, parola ve çok faktörlü doğrulama gerekir.",
        body: "Kurumsal VPN bağlantısı için şirket cihazındaki güncel istemci açılır, kurumsal hesapla giriş yapılır ve çok faktörlü doğrulama tamamlanır. Örnek Kurum ağına uzaktan bağlantı yalnız bu istemciyle kurulur. İlk bağlantıda güncel parola kullanılır. Çok faktörlü doğrulama kodu zaman aşımına uğrarsa yeniden istenir. Bağlantı kurulunca iç adresler erişilebilir olur. Kişisel mağazalardan indirilen istemci kabul edilmez. Uzaktan bağlantı koparsa istemci kapatılıp bağlantı adımları yinelenir.",
      },
      {
        id: "vpn-kurulum-sorun",
        section: "Bağlantı kopması",
        excerpt: "VPN bağlantısı kopuyor uyarısında önce ağ ve saat kontrol edilir, sonra istemci yeniden başlatılır.",
        body: "VPN bağlantısı kopuyor uyarısında önce cihazın saati ve ağ bağlantısı kontrol edilir. Örnek Kurum, saat kayması olan cihazda oturumu düşürür. Çalışan VPN istemcisini kapatır, ağa yeniden katılır ve uzaktan bağlantıyı tekrar dener. Üç denemeden sonra süren kopmada destek talebi açılır ve hata saati yazılır. Aynı anda iki oturum açmak VPN bağlantısı kopuyor sonucunu doğurabilir. Paylaşılan ağlarda güvenlik duvarı kurum adresini kesiyor olabilir. Talepte ekran görüntüsünün yalnızca hata kodu yeterlidir.",
      },
      {
        id: "vpn-kurulum-istemci",
        section: "İstemci kurulumu",
        excerpt: "VPN istemcisinin kurulumu şirket cihazında, kurum içi yazılım kataloğundan yapılır.",
        body: "VPN istemcisinin kurulumu şirket cihazında, kurum içi yazılım kataloğundan yapılır. Örnek Kurum kataloğu dışındaki kurulum paketini engeller. Çalışan katalogdan istemciyi seçer ve kurulum bitince cihazı yeniden başlatır. VPN istemcisinin kurulumu kişisel telefona yapılmaz. Eski sürüm kalırsa bağlantı adımları hata verir. Kaldırma işlemi de katalog üzerinden yapılır. Kurulumdan sonra ilk uzaktan bağlantı çok faktörlü doğrulama ile sınanır.",
      },
    ],
  },
  {
    documentId: "parola-sifirlama",
    title: "Parola Sıfırlama ve Hesap Kilidi",
    category: "Bilgi Teknolojileri",
    subcategory: "Hesap ve Yetki",
    updatedAt: "2026-09-05",
    sections: [
      {
        id: "parola-sifirlama-adim",
        section: "Parola sıfırlama",
        excerpt: "Parola sıfırlama adımları self servis ekranında kayıtlı iletişim kanalıyla başlar.",
        body: "Parola sıfırlama adımları self servis ekranında kayıtlı iletişim kanalıyla başlar. Örnek Kurum tek kullanımlık kodu çalışanın kayıtlı kanalına gönderir. Kod doğrulanınca yeni parola iki kez yazılır. Parola sıfırlama adımları başka bir çalışanın hesabında işletilemez. Eski parola, yenisiyle aynı olamaz. İşlem bitince açık oturumlar kapanır. Kanal kayıtlı değilse hesap kilidi ekranından destek talebi açılır.",
      },
      {
        id: "parola-sifirlama-kilit",
        section: "Hesap kilidi",
        excerpt: "Hesap kilidi, art arda beş hatalı girişten sonra otomatik oluşur.",
        body: "Hesap kilidi, art arda beş hatalı girişten sonra otomatik oluşur. Örnek Kurum kilidi on beş dakika sonunda kendiliğinden kaldırabilir. Çalışan beklemek istemezse self servisten hesap kilidini parola sıfırlayarak açar. Başkası adına hesap kilidi kaldırılamaz. Kilit sürerken kurumsal posta ve uzaktan erişim de durur. Beşten az hatalı deneme kilit sayılmaz. Sık tekrarlanan hesap kilidi için destek talebine saat bilgisi yazılır.",
      },
      {
        id: "parola-sifirlama-gecici",
        section: "Geçici parola",
        excerpt: "Geçici parola yirmi dört saat geçerlidir ve ilk girişte değiştirilir.",
        body: "Geçici parola yirmi dört saat geçerlidir ve ilk girişte değiştirilir. Örnek Kurum geçici parolayı yalnız self servis kanalına yazar, sözlü iletmez. Süre dolan geçici parola yeniden üretilir. Geçici parola paylaşılmaz ve not kâğıdına yazılmaz. İlk girişte oluşturulan kalıcı parola en az on iki karakter olur. Geçici parola ile açılan oturum, değişiklik yapılmadan iç sistemlere tam yetki vermez. İşlem kaydı hesap geçmişinde görünür.",
      },
    ],
  },
  {
    documentId: "yazilim-erisim",
    title: "Yazılım Erişim Talebi",
    category: "Bilgi Teknolojileri",
    subcategory: "Yazılım",
    updatedAt: "2026-05-19",
    sections: [
      {
        id: "yazilim-erisim-talep",
        section: "Talep açma",
        excerpt: "Yazılım erişim talebi, katalogdaki ürün seçilerek ve iş gerekçesi yazılarak açılır.",
        body: "Yazılım erişim talebi, katalogdaki ürün seçilerek ve iş gerekçesi yazılarak açılır. Örnek Kurum katalog dışı ürünü bu ekrandan kurmaz. Çalışan yazılım erişim talebine rolünü ve süresini ekler. Eksik gerekçeli kayıt iade edilir. Talep, yöneticinin kuyruğuna düşer. Aynı ürün için açık bir yazılım erişim talebi varken ikincisi açılmaz. Kişisel lisans bu yolla istenmez.",
      },
      {
        id: "yazilim-erisim-onay",
        section: "Lisans onayı",
        excerpt: "Lisans onayı yönetici ve yazılım biriminin ortak kararıyla verilir.",
        body: "Lisans onayı yönetici ve yazılım biriminin ortak kararıyla verilir. Örnek Kurum boştaki lisansı varsa atar, yoksa satın alma adımına haber düşer. Lisans onayı olmadan kurulum paketi açılmaz. Reddedilen talepte gerekçe yazılır. Onaylanan lisans çalışanın hesabına tanımlanır ve duyuru gönderilir. Süre bitimine on iş günü kala lisans onayı yenileme olarak hatırlatılır. Paylaşılan lisans hesabı açılmaz.",
      },
      {
        id: "yazilim-erisim-kaldirma",
        section: "Erişimin kaldırılması",
        excerpt: "Yazılım erişiminin kaldırılması rol değişince veya işten ayrılınca aynı gün işlenir.",
        body: "Yazılım erişiminin kaldırılması rol değişince veya işten ayrılınca aynı gün işlenir. Örnek Kurum hesabı kapatınca lisans havuza döner. Çalışan kullanmadığı ürün için kendisi de kaldırma isteyebilir. Yazılım erişiminin kaldırılması yerel kopyayı da katalogdan siler. Ortak dosyalar çalışanın kişisel alanına taşınmaz. Hatalı kaldırma, yeni bir yazılım erişim talebiyle geri alınır. İşlem kaydı talep geçmişinde durur.",
      },
    ],
  },
  {
    documentId: "donanim-ariza",
    title: "Dizüstü Bilgisayar ve Donanım Arızası",
    category: "Bilgi Teknolojileri",
    subcategory: "Donanım",
    updatedAt: "2026-04-22",
    sections: [
      {
        id: "donanim-ariza-bildirim",
        section: "Arıza bildirimi",
        excerpt: "Dizüstü arıza bildirimi, belirti, ne zaman başladığı ve cihaz etiketiyle açılır.",
        body: "Dizüstü arıza bildirimi, belirti, ne zaman başladığı ve cihaz etiketiyle açılır. Örnek Kurum şirket cihazı dışındaki donanımı bu kayda almaz. Çalışan dizüstü arıza bildirimine mümkünse hata kodunu yazar. Sıvı dökülmesi veya düşme ayrıca belirtilir. Kayıt açılınca randevu saati paylaşılır. Aynı belirti için ikinci dizüstü arıza bildirimi açılmaz; mevcut kayda not eklenir. Garanti dışı kişisel aksesuar kapsama girmez.",
      },
      {
        id: "donanim-ariza-degisim",
        section: "Cihaz değişimi",
        excerpt: "Cihaz değişim süreci, onarımı ekonomik olmayan şirket dizüstü için başlar.",
        body: "Cihaz değişim süreci, onarımı ekonomik olmayan şirket dizüstü için başlar. Örnek Kurum teknik rapor olmadan cihaz değişim sürecini açmaz. Eski cihaz teslim edilmeden yenisi zimmete yazılmaz. Veri aktarımı çalışanın gözetiminde yapılır. Cihaz değişim süreci ortalama on iş gününü bulabilir. Kayıp cihaz için ayrıca tutanak istenir. Yeni cihaz, katalogdaki standart modelden verilir.",
      },
      {
        id: "donanim-ariza-yedek",
        section: "Yedek cihaz",
        excerpt: "Yedek cihaz, onarım süresince aynı gün içinde zimmetle teslim edilir.",
        body: "Yedek cihaz, onarım süresince aynı gün içinde zimmetle teslim edilir. Örnek Kurum yedek cihaz havuzu ofis girişindeki teslim noktasındadır. Çalışan kimliğini gösterir ve yedek cihaz formunu imzalar. Yedek cihaz üzerine kişisel hesap tanımlanmaz. Onarım bitince yedek cihaz aynı gün iade edilir. Hasarlı dönen yedek cihaz için kısa tutanak tutulur. Stok yoksa randevu ertesi iş gününe alınır.",
      },
    ],
  },
  {
    documentId: "eposta-takvim",
    title: "E-posta ve Takvim Erişimi",
    category: "Bilgi Teknolojileri",
    subcategory: "Hesap ve Yetki",
    updatedAt: "2026-03-11",
    sections: [
      {
        id: "eposta-takvim-erisim",
        section: "Posta kutusu",
        excerpt: "E-posta kutusuna erişim kurumsal hesap ve güncel parola ile masaüstü istemciden yapılır.",
        body: "E-posta kutusuna erişim kurumsal hesap ve güncel parola ile masaüstü istemciden yapılır. Örnek Kurum web üzerinden de aynı kutuyu açar. E-posta kutusuna erişim kişisel adresle bağlanmaz. Yeni çalışan kutusu işe giriş günü açılır. Okunamayan kutu için önce parola sıfırlama denenir. Paylaşılan ekip kutusu, ayrıca yetki tanımı ister. Kota dolunca yeni ileti alınmaz.",
      },
      {
        id: "eposta-takvim-paylasim",
        section: "Takvim paylaşımı",
        excerpt: "Takvim paylaşımı yalnız kurum içi hesaplara ve seçilen yetki düzeyinde verilir.",
        body: "Takvim paylaşımı yalnız kurum içi hesaplara ve seçilen yetki düzeyinde verilir. Örnek Kurum dış konuklara takvimi açmaz. Çalışan takvim paylaşımında serbest, meşgul veya düzenleme yetkisinden birini seçer. Düzenleme yetkisi toplantı oluşturmayı da kapsar. Takvim paylaşımı kaldırılınca eski davetler durur, yenisi görülemez. Sekreterya rolü için yöneticinin onayı gerekir. Yanlış kişiye açılan takvim aynı ekrandan geri alınır.",
      },
      {
        id: "eposta-takvim-kota",
        section: "Posta kotası",
        excerpt: "Posta kutusu kotası dolunca gelen iletiler bekletilir ve gönderim durur.",
        body: "Posta kutusu kotası dolunca gelen iletiler bekletilir ve gönderim durur. Örnek Kurum uyarıyı kotanın yüzde doksanında gösterir. Çalışan büyük ekleri dosya alanına taşıyıp iletiden siler. Posta kutusu kotası boşaltılınca bekleyen iletiler kendiliğinden düşer. Otomatik yönlendirme kotayı büyütmez. Ekip kutusunun kotası ayrı izlenir. Sürekli dolan kutular için arşiv isteği açılabilir.",
      },
    ],
  },
  {
    documentId: "masraf-bildirimi",
    title: "Masraf Bildirimi ve Belge Kuralları",
    category: "Finans ve İdari İşler",
    subcategory: "Masraf Bildirimi",
    updatedAt: "2026-07-18",
    sections: [
      {
        id: "masraf",
        section: "Belge kuralları",
        excerpt: "Masraf belgesi, harcama tarihinden sonraki on iş günü içinde PDF, PNG veya JPG olarak yüklenir.",
        body: "Masraf belgesi, harcama tarihinden sonraki on iş günü içinde PDF, PNG veya JPG olarak yüklenir. Örnek Kurum her masraf belgesinde tarih, tutar ve satıcı unvanı arar. On iş gününü aşan masraf belgesi gerekçe yazılmadan işleme alınmaz. Belge okunaklı olmalıdır. Aynı harcama için iki masraf belgesi yüklenmez. Kişisel harcama masraf bildirimine yazılmaz. Yükleme bitince kayıt onay kuyruğuna düşer.",
      },
      {
        id: "masraf-bildirimi-onay",
        section: "Onay akışı",
        excerpt: "Masraf onay akışı önce yönetici, sonra finans birimi incelemesiyle tamamlanır.",
        body: "Masraf onay akışı önce yönetici, sonra finans birimi incelemesiyle tamamlanır. Örnek Kurum yönetici onayını üç iş günü içinde bekler. Masraf onay akışında tutar, bütçe kalemiyle karşılaştırılır. Eksik görülen kayıt çalışana geri döner ve süre durur. İki onay da tamamlanınca ödeme dönemine alınır. Çalışan masraf onay akışının adımını portalda izler. Reddedilen kayıt yeniden açılamaz; yeni kayıt gerekir.",
      },
      {
        id: "masraf-bildirimi-red",
        section: "Red nedenleri",
        excerpt: "Masraf bildiriminin reddi, eksik belge, kişisel harcama veya süre aşımı halinde yazılır.",
        body: "Masraf bildiriminin reddi, eksik belge, kişisel harcama veya süre aşımı halinde yazılır. Örnek Kurum ret gerekçesini kaydın üzerine ekler. Çalışan gerekçeyi okuyup uygunsa yeni ve tam bir bildirim açar. Masraf bildiriminin reddi ödeme planından kaydı çıkarır. İtiraz, ret tarihinden sonraki beş iş gününde finans birimine yazılır. Aynı belgenin yeniden yüklenmesi gerekçeyi değiştirmez. Kabul edilen itiraz yeni onay akışı başlatır.",
      },
    ],
  },
  {
    documentId: "is-seyahati",
    title: "İş Seyahati Onayı ve Harcırah",
    category: "Finans ve İdari İşler",
    subcategory: "Seyahat",
    updatedAt: "2026-06-02",
    sections: [
      {
        id: "is-seyahati-onay",
        section: "Seyahat onayı",
        excerpt: "İş seyahati onayı, yola çıkmadan en az üç iş günü önce yöneticiden alınır.",
        body: "İş seyahati onayı, yola çıkmadan en az üç iş günü önce yöneticiden alınır. Örnek Kurum onaysız seyahatin giderini işlemez. Çalışan iş seyahati onayına şehir, tarih ve amacı yazar. Acil çağrıda yönetici sözlü olurunu aynı gün kayda çevirir. Onaylanan iş seyahati, konaklama ve ulaşım düzenlemesinin ön koşuludur. Tarih değişirse onay yenilenir. İptal edilen seyahat aynı kayıt üzerinden kapatılır.",
      },
      {
        id: "is-seyahati-harcirah",
        section: "Harcırah",
        excerpt: "Günlük harcırah, seyahat gün sayısı ile kademe tutarının çarpımıdır.",
        body: "Günlük harcırah, seyahat gün sayısı ile kademe tutarının çarpımıdır. Örnek Kurum tutarı portal tablosunda yayınlar ve ayrıca pazarlık açmaz. Günlük harcırah, yemek kartı yüklemesinin yerine geçmez. Yarım gün süren seyahatte yarım tutar yazılır. Belgesiz kişisel harcama günlük harcırahın dışındadır. Ödeme, dönüşteki masraf kaydı onaylanınca yapılır. Günlük harcırah avansı yolculuk öncesi istenebilir.",
      },
      {
        id: "is-seyahati-konaklama",
        section: "Konaklama",
        excerpt: "Konaklama belgesi, tesis unvanı, tarih aralığı ve tutarı gösteren tek dosyadır.",
        body: "Konaklama belgesi, tesis unvanı, tarih aralığı ve tutarı gösteren tek dosyadır. Örnek Kurum şehir dışındaki iş seyahatinde bu belgeyi zorunlu tutar. Konaklama belgesi olmadan gecelik gider ödenmez. Çalışan belgeyi dönüşten sonraki on iş gününde yükler. Üst sınıra uyan tutar doğrudan işlenir, aşan kısım gerekçe ister. Kişisel ek harcama konaklama belgesinden düşülür. Aynı gece için iki konaklama belgesi kabul edilmez.",
      },
    ],
  },
  {
    documentId: "satin-alma",
    title: "Satın Alma Talebi Süreci",
    category: "Finans ve İdari İşler",
    subcategory: "Satın Alma",
    updatedAt: "2026-05-07",
    sections: [
      {
        id: "satin-alma-talep",
        section: "Talep",
        excerpt: "Satın alma talebi, ihtiyaç, miktar ve gerekçe yazılarak portaldan açılır.",
        body: "Satın alma talebi, ihtiyaç, miktar ve gerekçe yazılarak portaldan açılır. Örnek Kurum katalog ürününü bu taleple sipariş eder. Satın alma talebi bütçe sahibi yöneticinin onayına düşer. Eksik miktar veya belirsiz gerekçe iade nedenidir. Acil ibaresi teslim süresini kendiliğinden kısaltmaz. Aynı ihtiyaç için açık satın alma talebi varken yenisi birleştirilir. Onaysız sipariş finans kaydına girmez.",
      },
      {
        id: "satin-alma-teklif",
        section: "Teklif",
        excerpt: "Üç teklif kuralı, belirlenen tutarın üzerindeki alımlarda uygulanır.",
        body: "Üç teklif kuralı, belirlenen tutarın üzerindeki alımlarda uygulanır. Örnek Kurum üç teklif kuralında firma unvanı ve tutarı kayda ekletir. Tek tedarikçi varsa gerekçe yazılır ve kural istisnası istenir. Eksik teklif satın alma talebini bekletir. En düşük tutar tek başına seçim nedeni değildir; teslim süresi de yazılır. Üç teklif kuralının altındaki küçük alımlar katalogdan yürür. Teklifler birbirine açılmaz.",
      },
      {
        id: "satin-alma-teslim",
        section: "Teslim",
        excerpt: "Teslim tutanağı, gelen mal veya hizmetin siparişle uyduğunu gösterir.",
        body: "Teslim tutanağı, gelen mal veya hizmetin siparişle uyduğunu gösterir. Örnek Kurum tutanağı teslim alan çalışanla birlikte kaydeder. Eksik veya hasarlı üründe teslim tutanağına şerh düşülür ve kabul yapılmaz. Tutanaksız teslim ödemeye bağlanmaz. Hizmet alımında tutanak, işin bittiği gün yazılır. Teslim tutanağı satın alma talebinin kapanış adımıdır. Arşiv, kaydın üzerinde saklanır.",
      },
    ],
  },
  {
    documentId: "fatura-yukleme",
    title: "Fatura Yükleme Hataları",
    category: "Finans ve İdari İşler",
    subcategory: "Masraf Bildirimi",
    updatedAt: "2026-07-21",
    sections: [
      {
        id: "fatura-yukleme-hata",
        section: "Yükleme hatası",
        excerpt: "Fatura yükleme hatası, dosya açılamadığında veya zorunlu alan boş kaldığında gösterilir.",
        body: "Fatura yükleme hatası, dosya açılamadığında veya zorunlu alan boş kaldığında gösterilir. Örnek Kurum hata kodunu kaydın üstünde bırakır. Çalışan fatura yükleme hatasının metnini okuyup alanı tamamlar. Aynı dosyayı peş peşe seçmek hatayı büyütmez, kaydı çoğaltmaz. Ağ kesilirse yükleme yarıda kalmış sayılır ve yeniden denenir. Fatura yükleme hatası ödeme tarihini kendiliğinden ertelemez. Sürmesi halinde kayıt numarasıyla destek talebi açılır.",
      },
      {
        id: "fatura-yukleme-bicim",
        section: "Dosya biçimi",
        excerpt: "Fatura dosya biçimi PDF olmalıdır; fotoğraf ancak PDF üretilemiyorsa kabul edilir.",
        body: "Fatura dosya biçimi PDF olmalıdır; fotoğraf ancak PDF üretilemiyorsa kabul edilir. Örnek Kurum her dosyayı beş megabayt ile sınırlar. Fatura dosya biçimi dışındaki çalışma kitabı veya sıkıştırılmış paket reddedilir. Dosya adı kısa tutulur ve tutarı ayrıca alana yazılır. Birden fazla sayfa tek PDF içinde birleştirilir. Bozuk fatura dosya biçimi yükleme hatasına düşer. Renkli veya gri olması işlemi değiştirmez.",
      },
      {
        id: "fatura-yukleme-tekrar",
        section: "Yeniden yükleme",
        excerpt: "Faturanın yeniden yüklenmesi, hatalı kaydın üzerine yeni dosya seçilerek yapılır.",
        body: "Faturanın yeniden yüklenmesi, hatalı kaydın üzerine yeni dosya seçilerek yapılır. Örnek Kurum eski dosyayı arşivde tutar ve yenisini incelemeye alır. Faturanın yeniden yüklenmesi yeni bir bildirim numarası üretmez. Onaylanmış kayda dosya eklenemez. Ret sonrası ancak yeni bildirim açılır. Çalışan faturanın yeniden yüklenmesi bittikten sonra durumun incelemeye döndüğünü kontrol eder. Aynı anda iki dosya seçilirse ilki geçerli kalır.",
      },
    ],
  },
  {
    documentId: "ofis-ekipman",
    title: "Ofis Ekipmanı ve Masa Talebi",
    category: "İşyeri Hizmetleri",
    subcategory: "Ofis ve Ekipman",
    updatedAt: "2026-02-14",
    sections: [
      {
        id: "ofis-ekipman-masa",
        section: "Masa talebi",
        excerpt: "Çalışma masası talebi, oturma düzeni değişmeden en az beş iş günü önce açılır.",
        body: "Çalışma masası talebi, oturma düzeni değişmeden en az beş iş günü önce açılır. Örnek Kurum boş masayı işyeri ekibinin planına göre verir. Çalışma masası talebine kat, kat planındaki tercih ve gerekçe yazılır. Sabit masa, onaylanmadan taşınmaz. Ergonomi ihtiyacı varsa kısa not eklenir. Çalışma masası talebi sonuçlanınca taşınma günü paylaşılır. Aynı hafta içinde ikinci talep birincisine eklenir.",
      },
      {
        id: "ofis-ekipman-talep",
        section: "Ekipman",
        excerpt: "Ofis ekipmanı talebi monitör, kulaklık ve dok istasyonu gibi kalemleri kapsar.",
        body: "Ofis ekipmanı talebi monitör, kulaklık ve dok istasyonu gibi kalemleri kapsar. Örnek Kurum listedeki ofis ekipmanını stoktan verir. Çalışan ofis ekipmanı talebinde adet ve kullanım yerini yazar. Stok yoksa temin süresi kayda işlenir. Kişisel hediye veya ev kullanımı bu talebe girmez. Teslim, zimmet formuyla tamamlanır. Arızalı ofis ekipmanı ayrı bir bildirimle değiştirilir.",
      },
      {
        id: "ofis-ekipman-teslim",
        section: "Teslim formu",
        excerpt: "Ekipman teslim formu, zimmete giren her parça için imzalanır.",
        body: "Ekipman teslim formu, zimmete giren her parça için imzalanır. Örnek Kurum formu portalda üretir ve teslim anında onaylatır. Ekipman teslim formu olmadan parça çalışana bırakılmaz. İade günü form kapanır ve zimmet düşer. Hasar varsa forma kısa açıklama yazılır. Kayıp parçada ekipman teslim formu tutanakla tamamlanır. Eski formlar talep kaydının altında durur.",
      },
    ],
  },
  {
    documentId: "servis-otopark",
    title: "Servis ve Otopark",
    category: "İşyeri Hizmetleri",
    subcategory: "Ulaşım",
    updatedAt: "2026-01-27",
    sections: [
      {
        id: "servis-otopark-guzergah",
        section: "Servis güzergahı",
        excerpt: "Servis güzergahı ve durak saatleri portalın ulaşım sayfasında yayınlanır.",
        body: "Servis güzergahı ve durak saatleri portalın ulaşım sayfasında yayınlanır. Örnek Kurum güzergahı dönem başında günceller. Çalışan servis güzergahından bindiği durağı seçer. Yeni durak önerisi ulaşım birimine yazılır ve hemen işleme alınmaz. Servis güzergahı değişince duyuru çıkmadan bir sonraki hafta uygulanmaz. Araç plakası sayfada yer almaz. Gecikme bilgisi aynı sayfadaki duyuru satırına düşer.",
      },
      {
        id: "servis-otopark-kart",
        section: "Otopark",
        excerpt: "Otopark kartı, şirket aracı veya onaylı kişisel araç için düzenlenir.",
        body: "Otopark kartı, şirket aracı veya onaylı kişisel araç için düzenlenir. Örnek Kurum kartı plaka ile eşler. Otopark kartı başkasına devredilmez. Kayıp kart aynı gün iptal edilir ve yenisi istenir. Misafir araçları için günlük izin ayrıca yazılır. Otopark kartı yaya girişinde çalışmaz. Plaka değişince kart kaydı güncellenmeden bariyer açılmaz.",
      },
      {
        id: "servis-otopark-ulasim",
        section: "Ulaşım kartı",
        excerpt: "Ulaşım kartı, servis kullanmayan çalışan için dönemlik toplu taşıma desteğidir.",
        body: "Ulaşım kartı, servis kullanmayan çalışan için dönemlik toplu taşıma desteğidir. Örnek Kurum ulaşım kartını üç ayda bir yükler. Servise kayıtlı çalışan aynı dönemde ulaşım kartı alamaz. Kart kurum dışına devredilmez. Kayıp ulaşım kartı iptal edilip yeniden basılır. Yükleme tarihi portal takviminde duyurulur. Kart, şehir içi hatlarda geçerlidir ve nakit yerine geçmez.",
      },
    ],
  },
  {
    documentId: "yemekhane",
    title: "Yemekhane ve Diyet Menüsü",
    category: "İşyeri Hizmetleri",
    subcategory: "Yemek",
    updatedAt: "2026-03-03",
    sections: [
      {
        id: "yemekhane-menu",
        section: "Menü",
        excerpt: "Yemekhane menüsü her hafta cuma günü portalda yayınlanır.",
        body: "Yemekhane menüsü her hafta cuma günü portalda yayınlanır. Örnek Kurum bir sonraki haftanın öğle seçeneklerini listeler. Çalışan yemekhane menüsünden alerjen notunu okuyabilir. Menü dışında tabldot dışı sipariş alınmaz. Değişiklik olursa aynı sayfada düzeltme satırı çıkar. Yemekhane menüsü fiyat bilgisi taşımaz. Görüş ve öneri, yemekhane formuyla iletilir.",
      },
      {
        id: "yemekhane-diyet",
        section: "Diyet",
        excerpt: "Diyet menüsü, sağlık birimine bildirilen gereksinimle en geç üç iş gününde açılır.",
        body: "Diyet menüsü, sağlık birimine bildirilen gereksinimle en geç üç iş gününde açılır. Örnek Kurum diyet menüsünü ayrı tezgahta sunar. Çalışan süreyi ve kısıtı kısa notla yazar. Diyet menüsü misafire kendiliğinden açılmaz. Gereksinim kalkınca kayıt kapatılır. Yanlış veya eksik diyet menüsü aynı gün düzeltilir. Belge yüklemek zorunlu değildir; beyan yeterlidir.",
      },
      {
        id: "yemekhane-saat",
        section: "Servis saati",
        excerpt: "Yemekhane servis saati hafta içi öğle kuşağında on iki ile on dört arasındadır.",
        body: "Yemekhane servis saati hafta içi öğle kuşağında on iki ile on dört arasındadır. Örnek Kurum bu aralık dışında sıcak servis vermez. Vardiyalı ekip için ikinci yemekhane servis saati duyuruyla açılır. Geç kalan çalışan paketlenmiş seçeneği sorabilir. Hafta sonu ve resmi kapanış günlerinde yemekhane servis saati kapalıdır. Saat değişikliği en az bir gün önce yazılır. Giriş turnikesi, servis saati dışında da geçiş saymaz.",
      },
    ],
  },
];

export const SOURCE_SECTIONS: readonly CatalogSection[] = DOCUMENTS.flatMap((document) =>
  document.sections.map((section) => ({
    id: section.id,
    documentId: document.documentId,
    title: document.title,
    section: section.section,
    excerpt: section.excerpt,
    body: section.body,
    category: document.category,
    subcategory: document.subcategory,
    updatedAt: document.updatedAt,
    version: 1,
  })),
);

export const LEGACY_SECTION_IDS = ["izin", "vpn", "bordro", "masraf"] as const;
