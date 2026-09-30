# Kurumsal Bilgi ve Destek Asistanı

## 1. Belgenin amacı

Bu belge, **Kurumsal Bilgi ve Destek Asistanı** ürününün amacını, kullanıcılarını, kapsamını, iş kurallarını ve kabul ölçütlerini tanımlar. Belge teknoloji, platform ve uygulama yönteminden bağımsızdır. Ürün yöneticileri, tasarımcılar, geliştiriciler, test uzmanları ve yapay zekâ ajanları tarafından ortak referans olarak kullanılabilir.

Belgede bir özelliğin nasıl geliştirileceği değil, kullanıcıya hangi değeri sağlaması ve nasıl davranması gerektiği açıklanır.

## 2. Ürün özeti

Kurumsal Bilgi ve Destek Asistanı, şirket çalışanlarının günlük iş süreçlerinde ihtiyaç duydukları kurumsal bilgiye hızlıca ulaşmasını ve çözülemeyen konular için destek talebi oluşturup takip etmesini sağlayan çalışan portalıdır.

Ürün iki temel ihtiyacı tek deneyimde birleştirir:

1. Kurumsal konular hakkında soru sorma ve kaynağı gösterilen yanıt alma.
2. Destek talebi oluşturma, talebin durumunu izleme ve destek ekibiyle yazışma.

Ana kullanıcı yolculuğu:

```text
Giriş
  → Bilgi Asistanına soru sor
  → Yanıtı ve kaynağını incele
  → Sorun çözülmediyse destek talebi oluştur
  → Talebi ve yazışmaları takip et
  → Sonucu görüntüle
```

## 3. Ürün hedefleri

- Çalışanların kurumsal bilgiye ulaşmak için farklı kişi ve kanallara başvurma ihtiyacını azaltmak.
- Yanıtların hangi belgeye ve bölüme dayandığını açıkça göstermek.
- Bilgi arama ile destek talebi oluşturma arasındaki geçişi kolaylaştırmak.
- Çalışanın destek sürecindeki mevcut durumu ve geçmiş işlemleri anlayabilmesini sağlamak.
- Talepler, bildirimler, yazışmalar ve durum geçmişi arasında tutarlı bir deneyim sunmak.
- Kurumsal bilgiye güvenli, sade ve erişilebilir bir arayüz üzerinden ulaşılmasını sağlamak.

## 4. Hedef kullanıcı

Birincil kullanıcı, kurum bünyesinde çalışan ve aşağıdaki ihtiyaçlardan birine sahip olan kişidir:

- İnsan Kaynakları, Bilgi Teknolojileri, Finans veya İdari İşler süreçleri hakkında bilgi edinmek.
- Bir sorun veya hizmet ihtiyacı için destek talebi oluşturmak.
- Daha önce oluşturduğu talepleri bulmak ve durumlarını takip etmek.
- Destek ekibiyle yazışmak veya istenen ek bilgiyi paylaşmak.
- Bir talebin hangi aşamalardan geçtiğini görmek.

Birincil kullanıcı çalışandır. Bu sürüm ayrıca talepleri yöneten demo destek personeli rolünü Bölüm 17'deki sınırlarla kapsar. Yönetici ekranları kapsamda değildir.

## 5. Temel ürün ilkeleri

### 5.1. Kaynak gösterilebilirlik

Bilgi Asistanının verdiği doğrulanmış yanıtlar, ilgili kurumsal belge ve belge bölümüyle ilişkilendirilmelidir. Kullanıcı kaynak içeriğini ürün içinde açıp inceleyebilmelidir.

### 5.2. Şeffaflık

Kullanıcı, gördüğü içeriğin gerçek, örnek veya otomatik oluşturulmuş olduğunu anlayabilmelidir. Demo verileri, örnek destek mesajları ve kurgusal belgeler gerçek kurum kaydı gibi sunulmamalıdır.

### 5.3. Veri tutarlılığı

Aynı talebin durumu; ana sayfa sayaçlarında, talepler listesinde, talep detayında, bildirimlerde ve durum geçmişinde birbiriyle uyumlu olmalıdır.

### 5.4. Kullanıcı kontrolü

Asistan görüşmesinden destek talebine aktarılacak içerik, gönderimden önce kullanıcı tarafından görülebilmeli ve istenirse çıkarılabilmelidir.

### 5.5. Güvenli içerik gösterimi

Kullanıcının yazdığı metinler yalnızca içerik olarak gösterilmeli, çalıştırılabilir komut veya arayüz kodu olarak yorumlanmamalıdır.

### 5.6. Erişilebilirlik

Ana işlemler klavye, ekran okuyucu ve farklı ekran boyutlarıyla kullanılabilmelidir. Bir durum yalnızca renk ile anlatılmamalıdır.

## 6. Bilgi mimarisi

Çalışan portalı aşağıdaki ana bölümlerden oluşur:

- Giriş
- Ana Sayfa
- Bilgi Asistanı
- Yeni Destek Talebi
- Taleplerim
- Talep Detayı
- Bildirimler
- Profil

Giriş dışındaki bölümlerde ortak gezinme alanı, mevcut bölümün adı, bildirim erişimi ve kullanıcı alanı bulunmalıdır.

## 7. Fonksiyonel gereksinimler

### 7.1. Giriş

Giriş ekranında ürün adı, kısa açıklama, e-posta alanı, şifre alanı ve giriş işlemi bulunmalıdır.

Beklenen davranışlar:

- E-posta ve şifre alanları doğrulanmalıdır.
- Kullanıcı şifreyi görünür veya gizli duruma getirebilmelidir.
- Demo kullanımında kullanıcı, örnek hesapla doğrudan giriş yapabilmelidir.
- Başarılı girişten sonra Ana Sayfa açılmalıdır.
- Gerçek kimlik doğrulama yapılmıyorsa bu durum açıkça belirtilmelidir.
- Çalışmayan şifre sıfırlama veya tek oturum açma hizmetleri varmış gibi gösterilmemelidir.

### 7.2. Ana Sayfa

Ana Sayfa, kullanıcının mevcut durumunu hızlıca anlamasını ve ana işlemlere ulaşmasını sağlamalıdır.

İçerik ve davranışlar:

- Kullanıcıya kısa bir karşılama gösterilir.
- Bilgi Asistanına soru sorma ve yeni destek talebi oluşturma aksiyonları sunulur.
- Açık taleplerin sayısı gösterilir.
- Kullanıcıdan bilgi bekleyen taleplerin sayısı gösterilir.
- Çözülen taleplerin sayısı gösterilir.
- Yakın zamanda güncellenen talepler listelenir.
- Bilgi Asistanına yönlendiren örnek sorular sunulur.
- Sayaçlar mevcut talep kayıtlarından hesaplanır; sabit veya bağımsız değerler kullanılmaz.
- Yeni talep oluşturulduğunda ilgili sayaç ve listeler güncellenir.

### 7.3. Bilgi Asistanı

Bilgi Asistanı, ürünün ana bilgi edinme deneyimidir.

Kullanıcı şunları yapabilmelidir:

- Yeni sohbet başlatmak.
- Önceki sohbetleri görüntülemek.
- Önerilen sorulardan birini seçmek.
- Serbest metinle soru göndermek.
- Kullanıcı ve asistan mesajlarını kolayca ayırt etmek.
- Yanıt hazırlanırken işlem durumunu görmek.
- Asistan yanıtını kopyalamak.
- Yanıtı faydalı veya faydalı değil olarak değerlendirmek.
- Yanıttaki kaynakları açıp incelemek.
- Sorun çözülmediyse görüşmeden destek talebi oluşturmak.

Asistanın bilgi kapsamı en az şu konuları içermelidir:

| Konu | Beklenen bilgi alanı |
| --- | --- |
| Yıllık izin | Başvuru süreci, zamanlama ve izin bakiyesi |
| VPN erişimi | Bağlantı adımları ve temel sorun giderme |
| Bordro görüntüleme | Bordronun bulunduğu alan ve erişim desteği |
| Masraf talebi | Başvuru süresi, belge gereksinimi ve onay akışı |

Bu dört konu asgari kapsamdaki örneklerdir. Asistanın dayandığı kurgusal belgelerin listesi Bölüm 18.2'dedir.

Asistan davranış kuralları:

- Sorunun konusuna uygun yanıt verilmelidir; her soruya aynı yanıt verilmemelidir.
- Bilgi bulunamadığında bu durum açıkça söylenmelidir.
- Bilgi bulunamadığında destek talebi oluşturma seçeneği sunulmalıdır.
- Yanıt, gerçekten erişilebilen bir kaynak kaydıyla ilişkilendirilmelidir.
- Olmayan belge, politika veya bağlantı üretilmemelidir.

### 7.4. Kaynak görüntüleme

Bir asistan yanıtına bağlı kaynak açıldığında aşağıdaki bilgiler gösterilmelidir:

- Belge adı.
- İlgili bölümün adı.
- İlgili bölümün metni.
- Belgenin güncellenme tarihi.
- İçeriğin demo veya örnek olması durumunda bunu açıklayan bilgi.

Kaynak görüntüleme alanı, kullanıcının mevcut çalışmasını kaybetmeden kapatabileceği yardımcı bir panel veya iletişim penceresi olabilir. Açılış ve kapanışta klavye odağı doğru yönetilmelidir.

### 7.5. Asistandan destek talebine geçiş

Kullanıcı, bir asistan yanıtından destek talebi oluşturmayı seçtiğinde:

- Kullanıcının sorusu talebin konu ve açıklama alanlarına taşınmalıdır.
- Uygun kategori ve alt kategori biliniyorsa öneri olarak seçilmelidir.
- Asistan yanıtı ayrı bir bağlam alanında gösterilmelidir.
- Yanıtta kullanılan kaynaklar bağlama eklenmelidir.
- Kullanıcı aktarılacak içeriği göndermeden önce inceleyebilmelidir.
- Kullanıcı konuşma bağlamını talepten çıkarabilmelidir.

### 7.6. Yeni Destek Talebi

Talep formu aşağıdaki alanları içermelidir:

- Kategori.
- Alt kategori.
- Konu.
- Açıklama.
- Öncelik.
- Dosya ekleri.
- Varsa Bilgi Asistanından aktarılan konuşma bağlamı.

Kategoriler ve alt kategoriler:

| Kategori | Alt kategoriler |
| --- | --- |
| Bilgi Teknolojileri | VPN ve Uzaktan Erişim, Donanım, Yazılım, Hesap ve Yetki |
| İnsan Kaynakları | İzinler, Yan Haklar, Özlük İşlemleri, Bordro |
| Finans ve İdari İşler | Masraf Bildirimi, Satın Alma, Seyahat |
| İşyeri Hizmetleri | Ofis ve Ekipman, Ulaşım, Yemek |

Öncelik değerleri:

- Düşük
- Normal
- Yüksek

Form kuralları:

- Kategori, alt kategori, konu, açıklama ve öncelik zorunludur.
- Hatalar ilgili alanın yanında açıkça gösterilmelidir.
- Kategori değiştiğinde alt kategori seçenekleri ilgili kategoriye göre güncellenmelidir.
- Dosya başına üst sınır 5 MB olmalıdır.
- Kabul edilen dosya türleri PDF, PNG ve JPG/JPEG olmalıdır.
- Seçilen dosyaların adı ve boyutu listelenmelidir.
- Kullanıcı gönderimden önce seçilen dosyaları kaldırabilmelidir.
- Dosyanın içeriği saklanmıyorsa kullanıcıya bu durum açıkça belirtilmelidir.
- Geçerli gönderimde benzersiz talep numarası oluşturulmalıdır.
- Yeni talebin başlangıç durumu **Yeni** olmalıdır.
- İlk durum geçmişi kaydı talebin oluşturulduğunu göstermelidir.
- Aynı gönderim yanlışlıkla birden fazla talep oluşturmamalıdır.
- Başarılı gönderimden sonra kullanıcı yeni talebin detayına yönlendirilmelidir.

### 7.7. Taleplerim

Talepler listesinde aşağıdaki bilgiler bulunmalıdır:

- Talep numarası.
- Konu.
- Kategori.
- Öncelik.
- Durum.
- Son güncelleme zamanı.

Kullanıcı şunları yapabilmelidir:

- Konu veya talep numarasıyla arama yapmak.
- Duruma göre filtrelemek.
- Kategoriye göre filtrelemek.
- Son güncelleme tarihine göre sıralamak.
- Tüm filtreleri temizlemek.
- Talep detayını açmak.
- Yeni destek talebi oluşturmak.

Eşleşen talep yoksa açıklayıcı bir boş durum gösterilmelidir. Küçük ekranlarda liste, okunabilir talep kartlarına dönüşebilmelidir.

### 7.8. Talep Detayı

Talep detayında aşağıdaki bilgiler bulunmalıdır:

- Talep numarası.
- Konu ve açıklama.
- Durum.
- Kategori ve alt kategori.
- Öncelik.
- Oluşturulma ve son güncelleme zamanı.
- Atanan destek ekibi.
- Dosya bilgileri.
- Varsa Bilgi Asistanından aktarılan konuşma bağlamı ve kaynaklar.
- Çalışan ile destek ekibi arasındaki yazışmalar.
- Kronolojik durum geçmişi.

Yazışma davranışları:

- Kullanıcı boş olmayan yeni bir mesaj gönderebilmelidir.
- Gönderilen mesaj hemen yazışma listesinde görünmelidir.
- Mesaj talep kaydının parçası olarak korunmalıdır.
- Destek ekibine ait başlangıç mesajları örnek veriyse bu durum belirtilmelidir.
- Kullanıcıya canlı bir destek personelinin otomatik yanıt verdiği izlenimi oluşturulmamalıdır.

Durum geçmişi davranışları:

- Talep detayının içinde gösterilmelidir.
- Her kayıtta durum veya işlem açıklaması, zaman ve işlemi yapan kişi ya da ekip bulunmalıdır.
- Kayıtlar kronolojik olarak anlaşılır biçimde sunulmalıdır.
- Talebin mevcut durumu, durum geçmişindeki son durum değişikliği kaydıyla uyumlu olmalıdır.

Çalışan, destek ekibinin yönettiği talep durumlarını değiştirememelidir. Bilinmeyen talep numarasında hata görünümü ve Taleplerime dönme seçeneği sunulmalıdır.

### 7.9. Bildirimler

Bildirim alanında:

- Okunmuş ve okunmamış bildirimler ayırt edilmelidir.
- Kullanıcı tek bir bildirimi okundu işaretleyebilmelidir.
- Kullanıcı tüm bildirimleri okundu işaretleyebilmelidir.
- Bildirimden ilgili talebe gidilebilmelidir.
- Ortak gezinme alanındaki okunmamış bildirim sayısı güncel olmalıdır.

Bildirimler gerçek push veya e-posta gönderimi yapıyormuş gibi sunulmamalıdır.

### 7.10. Profil

Profil alanında aşağıdaki bilgiler salt okunur olarak gösterilmelidir:

- Ad soyad.
- Kurumsal e-posta.
- Departman.
- Unvan.
- Ad ve soyadın baş harflerinden oluşan avatar.

Bilgilerin demo verisi olduğu belirtilmelidir. Kullanıcı profil alanından çıkış yapabilmelidir.

## 8. İş kuralları

### 8.1. Talep durumları

Ürün genelinde yalnızca aşağıdaki durum adları kullanılmalıdır:

1. Yeni
2. İnceleniyor
3. Kullanıcıdan Bilgi Bekleniyor
4. Devam Ediyor
5. Çözüldü
6. Kapatıldı

Durum adları ekranlar arasında değiştirilmemeli veya eş anlamlı alternatiflerle çoğaltılmamalıdır.

### 8.2. Açık ve tamamlanmış talepler

- **Açık talepler:** Yeni, İnceleniyor, Kullanıcıdan Bilgi Bekleniyor ve Devam Ediyor durumundaki talepler.
- **Tamamlanmış talepler:** Çözüldü veya Kapatıldı durumundaki talepler.
- **Kullanıcı eylemi gereken talepler:** Kullanıcıdan Bilgi Bekleniyor durumundaki talepler.

### 8.3. Talep numarası

Her talep, kullanıcı tarafından kolayca tanınabilecek ve diğer taleplerden ayrılabilecek benzersiz bir numaraya sahip olmalıdır. Aynı numara iki farklı talebe verilmemelidir.

### 8.4. Tarih ve zaman

- Yeni talep ve mesajlarda gerçek oluşturulma zamanı kullanılmalıdır.
- Tarihler kullanıcının dil ve bölge ayarına uygun, anlaşılır biçimde gösterilmelidir.
- Liste sıralaması ile ekranda gösterilen son güncelleme zamanı aynı değere dayanmalıdır.

### 8.5. Veri bütünlüğü

- Bir talebe mesaj eklendiğinde son güncelleme zamanı yenilenmelidir.
- Yeni talep ana sayfa sayaçlarına ve talepler listesine yansımalıdır.
- Bildirimde ilişkilendirilen talep mevcut olmalıdır.
- Kaynak işareti, mevcut ve görüntülenebilir bir belge bölümüne karşılık gelmelidir.
- Örnek veriler her açılışta çoğaltılmamalıdır.

## 9. Örnek veri gereksinimleri

Demo veya test ortamında farklı kategori, öncelik ve durumları kapsayan en az 10 örnek talep bulunmalıdır.

Örnek konular:

- VPN bağlantı sorunu.
- E-posta erişim problemi.
- Bordro görüntüleme.
- Yıllık izin süreci.
- Ekipman talebi.
- Yazılım erişim talebi.
- Seyahat veya iş masrafı geri ödemesi.
- Fatura yükleme hatası.

Bazı taleplerde destek ekibi mesajları ve birden fazla durum geçmişi kaydı bulunmalıdır. Örnek durumlar, ürünün desteklediği bütün durumların kullanıcı tarafından görülebilmesini sağlamalıdır.

Örnek kullanıcı, kurum, belge, mesaj ve talepler açıkça kurgusal olmalıdır.

Demo bilgi dokümanları ve değerlendirme soruları açıkça kurgusaldır; kişisel veya gizli veri içermez.

## 10. Deneyim ve görsel dil

Ürün bir pazarlama sitesi gibi değil, günlük kullanılan kurumsal çalışan portalı gibi hissettirmelidir.

Beklenen karakter:

- Sade.
- Modern.
- Güven veren.
- Düzenli.
- Okunaklı.
- Görev odaklı.

Arayüz ilkeleri:

- İçerik ve ana işlemler güçlü bir görsel hiyerarşiye sahip olmalıdır.
- Birincil ve ikincil işlemler kolayca ayırt edilmelidir.
- Kart, form, tablo, bildirim ve durum bileşenleri bütün ekranlarda tutarlı olmalıdır.
- Uzun yanıtlar rahat okunabilecek satır uzunluğunda sunulmalıdır.
- Uzun konu, dosya adı ve kaynak metinleri taşma oluşturmamalıdır.
- Aşırı büyük başlıklar, yoğun dekorasyon, dikkat dağıtan hareket ve gereksiz görsel öğeler kullanılmamalıdır.
- Durum etiketleri renk yanında açık metin içermelidir.

## 11. Erişilebilirlik ve uyarlanabilirlik

- Ürün masaüstü, tablet ve mobil ekranlarda kullanılabilmelidir.
- Küçük ekranlarda gezinme alanı açılıp kapanabilmelidir.
- Formlar küçük ekranlarda tek sütuna dönüşmelidir.
- Talep tablosu mobilde okunabilir kartlara dönüşmelidir.
- Sohbet mesajları ve mesaj giriş alanı birbirini örtmemelidir.
- Bütün etkileşimli öğeler klavyeyle kullanılabilmelidir.
- Klavye odağı görünür olmalıdır.
- Form alanları anlaşılır etiketlere sahip olmalıdır.
- İkonla gösterilen işlemlerin erişilebilir adı bulunmalıdır.
- İletişim penceresi veya yan panel açıldığında odak içeride yönetilmeli, kapatıldığında açan öğeye dönmelidir.
- Başarı ve hata mesajları yardımcı teknolojiler tarafından algılanabilmelidir.
- Hareket azaltma tercihi olan kullanıcılar için gereksiz animasyonlar sınırlandırılmalıdır.

## 12. Boş, hata ve işlem durumları

Aşağıdaki durumlar ayrıca tasarlanmalıdır:

- Henüz sohbet bulunmaması.
- Henüz mesaj bulunmaması.
- Talep listesinde sonuç bulunamaması.
- Bildirim bulunmaması.
- Bilgi Asistanının eşleşen bilgi bulamaması.
- Bilinmeyen talep numarası.
- Form doğrulama hatası.
- Talep oluşturma işleminin sürmesi.
- Yanıt hazırlanması.
- Veri kalıcılığının veya bir yardımcı özelliğin kullanılamaması.

Her durumda kullanıcıya ne olduğu ve mümkünse bir sonraki adım açıkça anlatılmalıdır.

## 13. Kapsam dışı özellikler

Bu ürün tanımının mevcut kapsamında aşağıdakiler yoktur:

- Yönetici paneli.
- Gerçek kullanıcı dizini yönetimi.
- Gerçek kimlik doğrulama ve yetkilendirme altyapısı (Bölüm 17'deki roller demo amaçlıdır).
- Bölüm 18'de tanımlanan kaynakla sınırlı Bilgi Asistanı dışında yapay zekâ hizmeti. Serbest sohbet, kaynaksız üretim, eğitim/ince ayar ve gerçek kurum verisi kapsam dışıdır.
- Canlı destek personeli yanıt sistemi ve otomatik destek yanıtı (demo destek personeli mesajları Bölüm 17 kapsamındadır).
- Kurumsal belge yönetimi ve belge yayımlama süreci.
- Gerçek dosya depolama veya dosya içeriğine sonradan erişim.
- E-posta, SMS veya push bildirimi gönderimi.
- Çalışanın talep durumunu doğrudan değiştirmesi (Bölüm 17.6'daki otomatik geçiş hariç).
- Raporlama, yönetim analitiği veya hizmet seviyesi yönetimi.
- Ekipler arası talep devri ve destek personelinin talep kategorisini, önceliğini veya ekibini değiştirmesi.
- Destek personeline bildirim gönderimi.
- Destek personeli hesaplarının ve ekiplerinin ürün içinden yönetimi.

Bu özelliklerden biri gelecekte talep edilirse ayrı kapsam, rol, yetki, güvenlik ve veri gereksinimleriyle değerlendirilmelidir.

## 14. Kabul kriterleri

Ürün aşağıdaki koşullar sağlandığında temel kapsamı karşılamış sayılır:

- [ ] Kullanıcı girişten sonra bütün çalışan portalı bölümlerine ulaşabilir.
- [ ] Ana Sayfa sayaçları mevcut talep verileriyle tutarlıdır.
- [ ] Yıllık izin, VPN, bordro ve masraf soruları konuya uygun farklı yanıtlar üretir.
- [ ] Doğrulanmış yanıtta açılabilir kaynak bulunur ve kaynak ilgili belge bölümünü gösterir.
- [ ] Bilgi bulunamayan soruda bu durum açıkça belirtilir ve destek talebi önerilir.
- [ ] Asistan sorusu, yanıtı ve kaynakları destek talebi formuna aktarılabilir.
- [ ] Aktarılan konuşma bağlamı gönderimden önce incelenebilir ve çıkarılabilir.
- [ ] Geçerli talep yalnızca bir kez oluşturulur ve benzersiz numara alır.
- [ ] Yeni talep listede, detayda, sayaçlarda ve ilgili bildirimlerde görünür.
- [ ] Talebe boş olmayan mesaj eklenebilir ve mesaj hemen görünür.
- [ ] Talebin mevcut durumu ile durum geçmişindeki son durum değişikliği kaydı tutarlıdır.
- [ ] Arama, durum filtresi, kategori filtresi, tarih sıralaması ve filtre temizleme çalışır.
- [ ] Tek bildirim ve tüm bildirimler okundu işaretlenebilir.
- [ ] Okunmamış bildirim sayısı kullanıcı işlemlerine göre güncellenir.
- [ ] Bilinmeyen talep numarası anlaşılır hata ve geri dönüş seçeneği gösterir.
- [ ] Mobil ve masaüstü düzenlerinde ana işlemler kullanılabilir, içerik taşmaz.
- [ ] Ana işlemlerde işlevsiz düğme, boş bağlantı veya tamamlanmamış alan bulunmaz.
- [ ] Kullanıcı girdileri güvenli metin olarak gösterilir.
- [ ] Demo içerikler gerçek kurum verisi veya canlı hizmet gibi sunulmaz.
- [ ] Demo destek personeli hesabıyla giriş yapılabilir; rol ve ekip profilde görünür.
- [ ] Destek personeli yalnızca kendi ekibinin taleplerini ekip kuyruğunda ve bana atananlar listesinde görür.
- [ ] Destek personeli atanmamış talebi üstlenebilir ve talebi aynı ekipteki başka bir personele atayabilir.
- [ ] Durum yalnızca izin verilen geçişlerle değişir; Kapatıldı için gerekçe zorunludur.
- [ ] Personel mesajı çalışanın yazışmalarında görünür ve çalışana bildirim oluşturur.
- [ ] İç notlar ve atama kayıtları çalışana hiçbir yerde görünmez.
- [ ] Her atama, durum değişikliği, mesaj ve iç not durum geçmişine kaydedilir.
- [ ] Çalışan durum değiştirme, atama ve iç not işlemlerine erişemez; destek personeli çalışan bölümlerine erişemez.
- [ ] Kullanıcıdan bilgi bekleyen talebe çalışan yanıt verdiğinde talep İnceleniyor durumuna geçer.

## 15. Gelecekte projede çalışacak ajanlar için talimatlar

Bir yapay zekâ ajanı bu projede değişiklik yapmadan önce:

1. Kullanıcı isteğini bu belgedeki ürün amacı ve kapsamla karşılaştırmalıdır.
2. İstenen değişikliğin çalışan portalına mı, yoksa kapsam dışındaki başka bir role mi ait olduğunu belirlemelidir.
3. Talep, bildirim, sohbet, kaynak ve sayaçlar arasındaki veri tutarlılığını korumalıdır.
4. Yeni özellik eklerken ilgili boş, hata, yüklenme, erişilebilirlik ve mobil durumlarını birlikte ele almalıdır.
5. Yeni bir bilgi konusu ekleniyorsa yanıt, kaynak belge, ilgili bölüm ve destek talebi kategorisi arasındaki ilişkiyi tanımlamalıdır.
6. Gerçek entegrasyon bulunmayan bir işlevi çalışıyormuş gibi sunmamalıdır.
7. Kullanıcı tarafından özellikle istenmedikçe yönetici paneli, gerçek entegrasyon veya çalışan ve demo destek personeli dışında yeni bir kullanıcı rolü ekleyerek kapsamı büyütmemelidir. Destek personeli davranışlarında Bölüm 17'deki yetki sınırlarını korumalıdır.
8. Uygulama teknolojisiyle ilgili kararları bu ürün belgesine eklememeli; gerekiyorsa ayrı bir teknik tasarım belgesinde açıklamalıdır.

## 16. Terimler

| Terim | Tanım |
| --- | --- |
| Bilgi Asistanı | Kurumsal konulardaki sorulara kaynaklı yanıt sunan deneyim. |
| Kaynak | Asistan yanıtının dayandığı belge ve ilgili belge bölümü. |
| Destek talebi | Çalışanın çözüm veya hizmet almak için oluşturduğu kayıt. |
| Talep bağlamı | Asistan görüşmesinden talebe aktarılan soru, yanıt ve kaynaklar. |
| Durum geçmişi | Talebin yaşam döngüsündeki işlemlerin zaman sıralı kaydı. |
| Bildirim | Bir talebin oluşturulması veya güncellenmesiyle ilgili kullanıcı bilgilendirmesi. |
| Demo veri | Gerçek kişi, kurum veya işlemi temsil etmeyen örnek içerik. |
| Destek personeli | Tek bir destek ekibine bağlı, ekibinin taleplerini yöneten demo kullanıcı rolü. |
| Ekip kuyruğu | Bir destek ekibine atanmış taleplerin listesi. |
| Atanan personel | Talep üzerinde durum değiştirme ve mesaj gönderme yetkisi olan destek personeli. |
| İç not | Yalnızca destek personelinin görebildiği, talebe bağlı not. |

## 17. Destek Personeli (Demo)

### 17.1. Amaç ve kapsam

Bu bölüm, çalışan taleplerini yöneten demo destek personeli rolünü tanımlar. Rol, gerçek bir kimlik veya yetki altyapısına bağlı değildir ve demo davranışı olarak açıkça belirtilmelidir. Çalışan deneyimine ilişkin önceki bölümlerdeki kurallar geçerliliğini korur.

### 17.2. Roller ve demo hesaplar

- Üründe iki rol bulunmalıdır: **Çalışan** ve **Destek personeli**.
- Her destek personeli tek bir destek ekibine bağlı olmalıdır. Ekip adları, talep kategorisinden türetilen atanan ekip adlarıyla aynı olmalıdır (örneğin BT Destek Ekibi, İnsan Kaynakları Ekibi).
- Demo ortamında en az üç kurgusal destek personeli hesabı bulunmalıdır: iki kişi BT Destek Ekibinde, bir kişi İnsan Kaynakları Ekibinde.
- Giriş yapan kullanıcının rolü ve varsa ekibi profil bilgisinde görülebilmelidir.
- Destek personeli bulunmayan ekiplerin talepleri, bu sürümde hiçbir personelin kuyruğunda görünmez; bu durum demo sınırı olarak kabul edilir.

### 17.3. Yetki sınırları

- Çalışan yalnızca kendi taleplerini görüntüleyebilmeli ve yalnızca mesaj ekleyebilmelidir.
- Çalışan talep durumunu değiştirememeli, talep atayamamalı ve iç notları hiçbir şekilde görememelidir.
- Destek personeli çalışana ait talep oluşturma, Bilgi Asistanı ve bildirim bölümlerini kullanamamalıdır.
- Destek personeli yalnızca kendi ekibine atanmış talepleri görebilmelidir. Başka ekibin talebi, var olmayan talep gibi ele alınmalıdır.
- Yetkisiz bir işlem denendiğinde kullanıcıya açık bir hata mesajı gösterilmelidir.

### 17.4. Ekip kuyruğu ve bana atananlar

- Destek personeli ekibinin taleplerini tek bir kuyrukta görebilmelidir.
- Destek personeli yalnızca kendisine atanmış talepleri ayrıca listeleyebilmelidir.
- Kuyruk; duruma, önceliğe, atanmamış olmaya ve talep numarası, konu veya çalışan adına göre süzülebilmelidir.
- Kuyruk varsayılan olarak açık talepleri, en eski oluşturulan talep üstte olacak biçimde göstermelidir.
- Ekip özeti (açık, atanmamış, bana atanmış ve kullanıcıdan bilgi bekleyen talep sayıları) mevcut talep kayıtlarından hesaplanmalıdır.

### 17.5. Talebi üstlenme ve atama

- Destek personeli ekibindeki atanmamış bir talebi üstlenebilmelidir.
- Destek personeli bir talebi yalnızca aynı ekipteki başka bir destek personeline veya kendisine atayabilmelidir.
- Başka bir personele atanmış talep doğrudan üstlenilememelidir; bunun için atama işlemi kullanılmalıdır.
- Talebin durumunu değiştirmek ve çalışana mesaj göndermek için talebin işlemi yapan personele atanmış olması gerekir.
- İç not, talebin atandığı kişiden bağımsız olarak ekipteki her destek personeli tarafından eklenebilmelidir.

### 17.6. Durum yönetimi

Destek personeli, talep durumunu yalnızca Bölüm 8.1'deki durumlar arasında ve aşağıdaki geçişlere uygun olarak değiştirebilmelidir:

| Mevcut durum | İzin verilen yeni durumlar |
| --- | --- |
| Yeni | İnceleniyor, Kapatıldı |
| İnceleniyor | Kullanıcıdan Bilgi Bekleniyor, Devam Ediyor, Çözüldü |
| Kullanıcıdan Bilgi Bekleniyor | İnceleniyor, Devam Ediyor, Çözüldü |
| Devam Ediyor | İnceleniyor, Kullanıcıdan Bilgi Bekleniyor, Çözüldü |
| Çözüldü | Devam Ediyor, Kapatıldı |
| Kapatıldı | Yok (son durum) |

- Tabloda olmayan bir geçiş ve talebin zaten bulunduğu duruma geçiş reddedilmelidir.
- Kapatıldı durumuna geçişte kapatma gerekçesi zorunlu olmalıdır. Gerekçe çalışana durum geçmişinde gösterilmelidir.
- Kapatılmış talepte destek personeli hiçbir işlem yapamamalıdır.
- Çalışan, Kapatıldı durumundaki talebe mesaj ekleyemez. Çözüldü durumundaki talebe mesaj eklenebilir.
- Kullanıcıdan Bilgi Bekleniyor durumundaki talebe çalışan mesaj eklediğinde talep otomatik olarak İnceleniyor durumuna geçmeli ve bu geçiş durum geçmişinde "Sistem" tarafından yapılmış olarak görünmelidir.

### 17.7. Çalışana mesaj ve iç notlar

- Atanan destek personeli çalışana mesaj gönderebilmelidir. Mesaj talebin yazışmalarında destek ekibi mesajı olarak görünmeli ve son güncelleme zamanını yenilemelidir.
- Destek personeli yalnızca destek personelinin görebileceği iç notlar ekleyebilmelidir.
- İç not metni ve iç not eklendiği bilgisi çalışana hiçbir ekranda, bildirimde veya sayaçta yansımamalıdır.
- Mesaj ve iç notlar boş olamaz ve Bölüm 7.8'deki mesaj uzunluk sınırına tabidir.
- Demo destek personeli mesajları, gerçek ve canlı bir destek hizmeti gibi sunulmamalıdır.

### 17.8. Durum geçmişi ve işlem kaydı

- Üstlenme, atama, durum değişikliği, çalışana mesaj ve iç not işlemlerinin her biri durum geçmişine işlem türü, zaman, işlemi yapan kişi ve görünürlük bilgisiyle kaydedilmelidir.
- Durum değişikliği kaydı eski ve yeni durumu içermelidir.
- Üstlenme, atama ve iç not kayıtları yalnızca destek personeline görünmelidir. Durum değişikliği ve mesaj kayıtları çalışana da görünmelidir.
- Talebin mevcut durumu, durum geçmişindeki son durum değişikliği kaydıyla uyumlu olmalıdır. Durum değişikliği kaydı yoksa talep Yeni durumunda olmalıdır.
- Destek personeli bir talebin tüm geçmişini, çalışan yalnızca kendisine görünen kayıtları görebilmelidir.

### 17.9. Çalışan bildirimleri

- Destek personeli talep durumunu değiştirdiğinde veya çalışana mesaj gönderdiğinde, talep sahibine ilgili talebe bağlı bir bildirim oluşturulmalıdır.
- Atama, üstlenme, iç not ve otomatik durum geçişi çalışana bildirim oluşturmamalıdır.
- Destek personeline bildirim gönderilmez.

### 17.10. Eşzamanlı güncelleme

- Atama ve durum değişikliği, talebin personelin gördüğü sürümüne göre yapılmalıdır. Talep bu arada güncellendiyse işlem reddedilmeli ve personelden güncel hâli görüntülemesi istenmelidir.
- Aynı talebi iki personel aynı anda üstlenmeye çalışırsa yalnızca biri başarılı olmalıdır.

## 18. Kaynakla Sınırlı Bilgi Asistanı

Bilgi Asistanı, Örnek Kurum'un kurgusal politika belgelerindeki kısa bölümlere dayanır. Her bölümün bir kategorisi ve alt kategorisi vardır; bunlar destek talebindeki kategorilerle aynı listedendir. Belgeler kişisel veya gizli veri içermez.

Asistan, soruyu bu bölümlerle karşılaştırır ve en ilgili bölümleri seçer. Büyük-küçük harf, Türkçe ve ASCII yazım, ekler ve yaygın eş anlamlılar aynı konuya bağlanır. Yeterince güçlü bir eşleşme yoksa kaynak bulunamadı sayılır. Birden fazla konuyu içeren soruda ilgili bölümler birlikte ele alınır.

Kaynak bulunduğunda yanıt, sabit bir giriş cümlesiyle birlikte en ilgili bölümün metnini olduğu gibi alıntılar. Başka ilgili kaynak varsa bunlar ayrıca belirtilir. Bu yanıtta kaynakta olmayan bilgi eklenmez.

Kaynak bulunamadığında asistan bunu açıkça söyler ve destek talebi oluşturmayı önerir. Bu durumda kaynak listesi boştur.

Destek talebine geçerken, bulunan kaynakların tümü aynı kategori ve alt kategorideyse bu ikili öneri olarak kullanılır. Kaynaklar farklı kategori veya alt kategorideyse öneri yapılmaz; çalışan kendisi seçer. Kaynak yoksa kategori önerisi de yoktur.

Serbest sohbet, kaynaksız üretim, model eğitimi ve gerçek kurum verisi bu davranışın dışındadır.

### 18.2. Belge listesi

Asistanın kapsamı aşağıdaki kurgusal belgelerle sınırlıdır:

- Yıllık İzin Politikası
- Mazeret ve Hastalık İzni
- Bordro Görüntüleme ve İtiraz
- Yan Haklar: Yemek Kartı ve Sağlık Sigortası
- Özlük Belgesi ve Çalışma Belgesi Talebi
- VPN Kurulumu ve Sorun Giderme
- Parola Sıfırlama ve Hesap Kilidi
- Yazılım Erişim Talebi
- Dizüstü Bilgisayar ve Donanım Arızası
- E-posta ve Takvim Erişimi
- Masraf Bildirimi ve Belge Kuralları
- İş Seyahati Onayı ve Harcırah
- Satın Alma Talebi Süreci
- Fatura Yükleme Hataları
- Ofis Ekipmanı ve Masa Talebi
- Servis ve Otopark
- Yemekhane ve Diyet Menüsü
