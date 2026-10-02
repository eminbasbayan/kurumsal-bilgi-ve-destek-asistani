# Playwright MCP ile uçtan uca proje testi

## Kullanım

Codex'te bu projeyi aç, model olarak **GPT-6.1 Sol** seç ve aşağıdaki **Görev metni** bölümünü yeni göreve yapıştır. Prompt model seçimini kendisi değiştirmez. MCP ayarı yeni eklendiyse oturumu yeniden açıp Playwright araçlarının yüklendiğini kontrol et.

Bu metin 30 Eylül 2026 tarihindeki proje yapısı incelenerek hazırlandı: front-end artık TanStack Query üzerinden back-end'e bağlı; çalışan ve destek personeli rolleri mevcut; front-end'de Vitest, back-end'de node:test testleri bulunuyor. Çalıştıran ajan güncel dosyaları tekrar okuyacak. Bu prompt hazırlanırken test çalıştırılmadı.

Playwright'ın önerdiği erişilebilirlik snapshot'ı → kullanıcı işlemi → sonucu gözleme akışı ve temiz oturum seçeneği esas alındı. [Playwright MCP rehberi](https://playwright.dev/docs/getting-started-mcp)

Mevcut `.codex/config.toml`, `npx -y @playwright/mcp@latest` ve 30 saniye başlangıç süresiyle proje kapsamlı sunucuyu tanımlıyor. Codex bu yapılandırmayı güvenilen projelerde yükler; yapılandırma kaydı ile aktif araç bağlantısı ayrı ayrı doğrulanmalıdır. [Resmî OpenAI MCP dokümantasyonu](https://developers.openai.com/codex/mcp)

Görev; açık kapsam, ölçülebilir tamamlanma koşulları ve yeni bir neden olmadıkça başarılı kontrolleri tekrarlamama ilkesiyle düzenlendi. [Resmî OpenAI prompting rehberi](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6.1-sol)

---

## Görev metni

Bu projeyi **Playwright MCP kullanarak uçtan uca test et ve kanıta dayalı bir Türkçe test raporu oluştur**. Planı hazırladıktan sonra testleri gerçekten yürüt. Çalışan ve demo destek personeli deneyimlerini, aralarındaki veri tutarlılığını ve yetki sınırlarını kapsa.

Çalışma alanı: `C:\Users\eminb\Desktop\kurumsal-bilgi-ve-destek-asistanı`.

### 1. Kapsam ve çalışma biçimi

- Amacın mevcut ürünü sınamak ve bulguları raporlamak. Uygulama hatalarını bu görev kapsamında düzeltme; yeni ürün özelliği, kalıcı test framework'ü veya CI kurulumu ekleme. Gereken geçici test dosyalarını, kanıtları ve ortam ayarlarını hazırlayabilirsin.
- Mevcut kullanıcı değişikliklerini koru. Commit, push veya yayınlama yapma. Varsayılan `back-end/data/app.sqlite` veritabanını değiştirme veya sıfırlama.
- Rutin ve geri alınabilir test adımlarında tekrar onay istemeden ilerle. Eksik yetki, yüklenmemiş MCP araçları veya gerekli kullanıcı eylemi varsa somut engeli bildir; bağımsız kontrolleri sürdür.
- Kısa bir test planı çıkar, ilerleme durumunu dosyada güncelle ve yaklaşık her dakika anlamlı bir durum özeti paylaş. Tamamlanan işi bağlam yenilendiğinde tekrar yapma.
- Bir test başarısız olursa kanıtını al, aynı hatayı gereksiz yere tekrar üretme ve bağımsız senaryolara devam et. Hatanın engellediği sonraki senaryoları başarılı sayma.

### 2. Güncel projeyi analiz et

Önce `AGENTS.md`, işaret ettiği `C:\Users\eminb\.codex\RTK.md`, `PROJE_TANIMI.md` ve `.codex/skills/frontend-development/SKILL.md` dosyalarını oku. Ürün belgesindeki bölüm 14 kabul kriterlerini ve bölüm 17 destek personeli kurallarını test matrisine dönüştür. İlgili `.cursor/rules/` dosyalarını uygula.

Ayrıca şunları incele:

- `.codex/config.toml`, her iki projenin `package.json` dosyaları ve mevcut testler.
- `front-end/src/app/navigation.ts`, `front-end/src/app/App.tsx`, ilgili `src/pages/` ve `src/api/` modülleri.
- `back-end/src/index.ts`, `src/app.ts`, `src/config/constants.ts`, `src/db/seed.ts`, ilgili migration'lar ve `src/docs/openapi.ts`.

Route, API endpoint'i, seçici, demo hesap, hata kodu veya sunucu health endpoint'i uydurma. Bunları güncel koddan ve çalışan arayüzden belirle. Ürün belgesi ile kod arasında çelişki varsa bunu bulgu olarak kaydet; kodda mevcut olması davranışın doğru olduğu anlamına gelmez.

Çıktıları `.playwright-mcp/<benzersiz-run-id>/` altında tut. `plan.md`, `report.md`, `evidence/` ve gerekirse `fixtures/` oluştur. Yerel tarih/saat, çalışma sürümü veya Git commit bilgisi, başlangıçtaki değişiklik durumu ve kullanılan araç sürümlerini kaydet.

### 3. Playwright MCP bağlantısını doğrula

- Resmî rehberi kullan: https://playwright.dev/docs/getting-started-mcp. İstemci yapılandırması için https://developers.openai.com/codex/mcp adresine bak.
- Oturumda gerçekten sunulan Playwright MCP araçlarını keşfet ve parametre şemalarını incele. Dokümandaki araç adlarının kurulu sürümle aynı olduğunu varsayma; sürüme göre `ref`, `target` veya başka parametre adları değişebilir.
- Testi Codex'in bağlı Playwright MCP araçlarıyla yürüt. Yalnızca `npx --help`, MCP bağlantı kurulması, araçların listelenmesi, HTTP 200 veya sayfa metninde bir kelime bulunması ürün testinin geçtiği anlamına gelmez.
- Araçlar görünmüyorsa proje güveni, etkin sunucu ayarı, Node/npx erişimi ve başlangıç hatasını incele. Gerekli en küçük yapılandırma düzeltmesini belirle. Oturum yenilemesi gerekiyorsa tam olarak bunu bildir. El yapımı JSON-RPC istemcisi veya başka tarayıcı aracı kullanıp bunu Codex'in Playwright MCP bağlantısı çalışmış gibi sunma. Engellenen UI testlerini açıkça ayır; çalışabilen yerel kontrolleri tamamla.
- Temiz bir test tarayıcı oturumu kullan. Destekleniyorsa `--isolated` tercih et; mevcut kullanıcı tarayıcısına extension üzerinden bağlanma. Kalıcı profil kullanılıyorsa yalnızca bu çalışmaya ayrılan test origin'inin oturum durumunu yönet.
- Ek yetenekleri ancak ihtiyaç ve mevcut araç şeması gerektiriyorsa aç. `testing`, `network` veya kod çalıştırma araçlarının varsayılan olarak mevcut olduğunu varsayma. Geçici MCP ayarı gerekiyorsa mevcut Penpot kaydını ve diğer ayarları koru, yaptığın değişikliği raporla.

### 4. Ayrı test ortamını hazırla

- Node sürümünün back-end için `>=22.13` olduğunu doğrula. Kilit dosyalarını ve mevcut bağımlılıkları kullan. Bağımlılıklar eksikse ilgili dizinde `npm ci` çalıştır; gelişigüzel sürüm güncelleme yapma.
- Bu koşuya özel, kalıcı dosya tabanlı boş SQLite veritabanı oluştur: `.playwright-mcp/<run-id>/app.sqlite`. Back-end'e `DATABASE_PATH` olarak bunun **mutlak yolunu** ver. Seed ve migration mekanizmasının bu ayrı veritabanını hazırlamasını sağla.
- Kullanımda olmayan iki yerel port seç; örneğin API için 3101, front-end için 5175. Portların boş olduğunu doğrula. Başka görevlere ait süreçleri durdurma.
- Back-end sürecine `PORT=<api-portu>`, `DATABASE_PATH=<test-db-mutlak-yolu>`, `CORS_ORIGIN=http://localhost:<ui-portu>` ver ve `back-end/` içinden `npm run dev` ile başlat.
- API'nin gerçekten hazır olduğunu mevcut bir endpoint üzerinden doğrula; uydurma bir `/health` endpoint'ine güvenme.
- Front-end sürecine `VITE_API_URL=http://localhost:<api-portu>` ver ve `front-end/` içinden `npm run dev -- --host localhost --port <ui-portu> --strictPort` çalıştır.
- Tarayıcıda da `http://localhost:<ui-portu>` kullan. `localhost` ile `127.0.0.1` veya farklı portlar arasında sessiz geçiş yapma. Port değişirse CORS ve API adreslerini birlikte güncelle. Vite'ın başka porta otomatik geçmesiyle yanlış ortamı test etme.
- Ortam değişkenlerini başlattığın süreçlere uygula; kullanıcının kalıcı `.env` dosyalarını değiştirme. PowerShell kullan; arka planda yardımcı süreç başlatırken görünür pencere açma. Kendi süreçlerinin PID/terminal oturumlarını ve loglarını kaydet.

### 5. Tarayıcı test yöntemi

- İlk snapshot ile ekrandaki gerçek kontrolleri öğren. İşlemleri güncel snapshot referanslarıyla veya gözlemlenmiş erişilebilir rol/ad/label seçicileriyle yap. DOM değiştiğinde eski referansları yeniden kullanma.
- Giriş, soru gönderme, talep oluşturma, atama, mesaj ve durum değişikliklerini UI üzerinden gerçekleştir. DOM'a metin basma, uygulama state'ini değiştirme veya doğrudan API ile kayıt oluşturup UI adımını geçmiş sayma.
- Karmaşık bir doğrulama için MCP'nin sunduğu Playwright kod çalıştırma aracı gerekirse yalnızca bu oturumun sayfası üzerinde dar kapsamlı kullan. Koşula dayalı bekleme ve desteklenen otomatik yeniden deneme/assertion yöntemlerini tercih et; sabit uzun beklemeler ve dayanaksız tekrar döngüleri kullanma.
- Her senaryo için önkoşul, işlem, beklenen sonuç, gözlenen sonuç ve kanıt kaydet. İşlemin tamamlanmasını ve beklenen UI durumunu doğrula; sadece menü metninin bulunmasını yeterli sayma.
- Snapshot, ekran görüntüsü, konsol ve ağ kayıtlarını desteklenen `filename`/çıktı seçenekleriyle proje içindeki kanıt dizinine kaydet. MCP'nin izin verdiği dosya köklerini doğrula; izin dışındaki genel Temp dizinine dosya yazmayı tekrar tekrar deneme.
- context-mode mevcutsa büyük dosyaları ve logları orada analiz et. Çıktı aracı erişilemiyor veya gerçek proje kökünü yanlış tanıyorsa hatayı kaydet, izinleri gevşetmeden kullanılabilir yerel okuma araçlarıyla küçük ve hedefli bölümler incele.
- Hata ve kritik başarı adımlarında ekran görüntüsünü gerçekten açıp incele. Konsol hatası, başarısız istek ve CORS sorunlarını senaryoyla ilişkilendir. Beklenen 4xx doğrulama/yetki yanıtlarını beklenmeyen hatalardan ayır. Eksik favicon gibi ikincil hataları da önem derecesiyle kaydet.
- Token, authorization başlığı veya oturum bilgilerini rapora dökme. Gerekli ağ kanıtlarında bunları maskele.

### 6. Çalışan senaryoları

Güncel seed ile doğrulamak üzere demo çalışan hesabı `deniz.yilmaz@ornek-kurum.com`, parola `kurumsaldemo`. Test verilerine run-id içeren benzersiz bir önek koy. Sayaçları başlangıç değerleri ve yaptığın işlemlerin farklarıyla sınayarak sabit seed sayılarına bağımlılığı önle.

1. **Giriş ve oturum:** Korunan sayfaya girişsiz erişimi, boş/hatalı alanları, yanlış parolayı, parola görünürlüğünü, demo girişini, başarılı yönlendirmeyi ve yenilemeden sonra oturumu doğrula. Profil bilgilerini ve demo açıklamasını kontrol et. Çıkıştan sonra korunan sayfalara erişilemediğini dene.
2. **Ana Sayfa ve gezinme:** Bütün çalışan bölümlerine ulaş. Açık, bilgi bekleyen ve çözülen talep sayaçlarını gerçek kayıtlarla karşılaştır; durum kümelerini ürün belgesinden al.
3. **Bilgi Asistanı:** Yıllık izin, VPN, bordro ve masraf için ayrı sorular sor. Yanıtların soruyla ilgili ve birbirinden farklı olduğunu, açılabilir kaynakların doğru belge/bölüm ve demo bilgisi gösterdiğini doğrula. Kapsam dışı soruda bilgi bulunamadığı ve talep oluşturma seçeneği gösterildiğini sınayarak uydurma kaynak olmadığını kontrol et. Yeni/eski sohbet, kopyalama ve değerlendirme işlevlerini de gözlemlenebilir sonuçlarıyla dene.
4. **Asistandan talebe aktarım:** Sorunun, yanıtın, kaynakların ve bilinen kategori önerisinin forma taşındığını kontrol et. Bağlamı incele ve kaldır; kaldırılmış bağlamın gönderime sızmadığını ayrıca doğrula.
5. **Talep formu:** Zorunlu alanları, kategori-alt kategori bağımlılığını, güncel uzunluk sınırlarını ve öncelikleri sınayarak alan yanındaki hataları doğrula. Geçerli PDF/PNG/JPEG, desteklenmeyen tür ve 5 MB sınırı için ayrı test dosyaları kullan. Dosya adı/boyutu, kaldırma ve yalnızca metadata saklandığı açıklamasını kontrol et.
6. **Oluşturma ve tutarlılık:** UI üzerinden benzersiz bir BT talebi oluştur. İlk durum `Yeni`, ilk geçmiş kaydı oluşturma olmalı. Talep numarasıyla detay, liste, sayaç ve bildirim kaydını takip et. Hızlı çift gönderimin tek kayıt ürettiğini gözlemlenebilir sonuç ve gerektiğinde API kanıtıyla doğrula; butonun disabled olması tek başına yeterli değildir. Yenilemeden sonra verinin korunduğunu sınayarak bağımsız bir localStorage kopyasından gelmediğini incele.
7. **Liste ve detay:** Numara/konu araması, kategori/durum filtreleri, tarih sıralaması, filtre temizleme ve boş sonuç durumunu dene. Bilinmeyen talep için hata ve dönüş yolunu doğrula. Boş mesaj reddedilmeli; geçerli mesaj hemen görünmeli, yenilemede korunmalı ve güncelleme zamanı değişmeli.
8. **Bildirimler ve metin güvenliği:** Tek/tüm bildirimleri okundu işaretle; rozet, liste ve ilgili talebe yönlendirmeyi kontrol et. Zararsız HTML benzeri test metninin metin olarak render edildiğini doğrula. Çalışana atama/durum değiştirme/iç not kontrolü sunulmadığını kontrol et.

### 7. Destek personeli ve roller arası yaşam döngüsü

Güncel seed ile doğrulamak üzere demo hesaplar: BT için `ahmet.kaya@ornek-kurum.com` ve `elif.demir@ornek-kurum.com`; İK için `zeynep.arslan@ornek-kurum.com`. Demo parola `kurumsaldemo`.

Aynı browser context içindeki sekmelerin localStorage/token paylaştığını unutma. Roller arasında UI'dan çıkış ve yeniden giriş yap; eşzamanlı oturum gerekirse gerçekten ayrı context/profil desteğini doğrula. İki sekmede farklı rolün bağımsız kaldığını varsayma. Rol değişiminde önceki hesabın cache'inin görünmediğini kontrol et.

1. **Kuyruk ve ekip sınırı:** Destek rolü/ekibini profilde doğrula. Açık, atanmamış, bana atanmış ve bilgi bekleyen sayaçlarını kayıtlarla karşılaştır. Kuyruğun varsayılan açık kayıtlarını ve en eski oluşturma tarihinden sıralanmasını; durum, öncelik, atanmamış ve metin filtrelerini dene.
2. **Üstlenme ve atama:** Çalışanın oluşturduğu BT talebini bul ve üstlen. Aynı ekipte diğer personele ata; bana atananlar ve iç geçmiş değişmeli. Başka personele atanmış talebin doğrudan üstlenilemediğini, ekip dışına atanamadığını ve yalnızca atanan kişinin durum değiştirebildiğini/çalışana mesaj gönderebildiğini doğrula.
3. **Bilgi isteme ve yanıt:** Atanan personelle `Yeni → İnceleniyor → Kullanıcıdan Bilgi Bekleniyor` geçişlerini yap ve çalışana mesaj gönder. Çalışan olarak mesajı ve ilgili bildirimi gör, cevap ver. Durumun otomatik `İnceleniyor` olduğunu, geçmişte `Sistem` kaydı bulunduğunu ve bu otomatik geçişin ek çalışan bildirimi üretmediğini doğrula.
4. **İç not gizliliği:** Aynı ekipte atanmamış personelin de iç not ekleyebildiğini dene. Notun ve atama/iç not geçmişinin destek tarafında bulunduğunu; çalışan ekranı, bildirim, sayaç ve çalışan API yanıtında bulunmadığını doğrula. Sadece ekranda gizlenmiş olması yeterli değildir.
5. **Çözüm ve kapatma:** İzinli yoldan `Devam Ediyor → Çözüldü` akışını tamamla. Çözülen talebe çalışanın mesaj ekleyebildiğini, destek personelinin izinli yeniden açma geçişini ve gerekçesiz kapatmanın reddini dene. Gerekçeyle `Kapatıldı` durumuna getir; gerekçe çalışanın geçmişinde görünmeli. Kapalı talepte çalışan mesajı ve destek işlemleri reddedilmeli. Her aşamada detay, liste, sayaç, bildirim ve son durum değişikliği kaydı tutarlı olmalı.
6. **Olumsuz yetki/geçiş kontrolleri:** İK hesabıyla BT talebine erişimin var olmayan talep gibi ele alındığını; yanlış rolün korunan API işlemlerinin 403, girişsiz erişimin uygun 401 yanıtıyla reddedildiğini doğrula. Geçersiz/aynı duruma geçişleri, başkasına atanmış talepte yetkisiz yazmayı ve kapanmış talepte işlem yapmayı sınayarak başarısız girişimin veri değiştirmediğini kontrol et. Endpoint ve sözleşmeleri güncel koddan al.
7. **Çakışma:** Eski sürümle atama/durum değişikliği ve iki personelin aynı talebi üstlenmesi kurallarını doğrula. UI ile gerçek bağımsız oturum kurulabiliyorsa MCP üzerinden dene; kurulamıyorsa mevcut back-end testinin kapsamını incele ve çalıştır. Yarışı kontrol eden destekleyici API testi gerekiyorsa yalnızca ayrı test DB'sinde çalıştır. API kanıtını MCP üzerinden doğrulanmış UI senaryosu olarak etiketleme.

Negatif API kontrolleri ve gizlilik incelemesi, tarayıcı testlerini destekleyebilir. İş verisini doğrudan DB'ye yazarak UI akışındaki hatayı atlatma. Uygulama gerçek zamanlı push sunmuyorsa diğer roldeki güncellemeyi rota geçişi/yeniden sorgulama üzerinden kontrol et; beklenen otomatik yenilemeyle manuel yenilemeyi raporda ayır.

### 8. Mobil, tema, erişilebilirlik ve hata durumları

- Masaüstünde 1440×900, mobilde 390×844 görünüm kullan. Ana işlemler olan giriş, talep oluşturma, liste/detay, mesaj ve destek kuyruğunu her iki genişlikte dene. Bütün kombinasyonları sebepsiz tekrar çalıştırma.
- Açık/koyu temada gezinme, form, tablo/kart ve kaynak/dialog okunabilirliğini görsel olarak incele. Yatay taşma, kesilen içerik ve erişilemeyen ana düğmeleri kaydet.
- Klavyeyle Tab/Shift+Tab, Enter/Space ve Escape akışını; görünür odağı, etiketleri, dialog odağını ve kapanışta odağın dönüşünü dene. Bunu tam bir erişilebilirlik uygunluk sertifikası gibi sunma.
- Yüklenme, boş veri ve API erişilememe durumlarından temsilî örnekler dene. Ağ mock'u gerekiyorsa mevcut MCP yeteneğini kullan, bunu hata senaryosu olarak açıkça etiketle ve sonrasında kaldır. Başarılı ana akışları mock API üzerinde çalıştırma. Mevcut olmayan yetenek nedeniyle denenemeyen durumu kaydet.

### 9. Projenin mevcut kontrollerini çalıştır

Güncel package script'lerini yeniden doğrula. Kontrolleri ilgili dizinlerde birer kez çalıştır; çıkış kodu ve özeti kaydet:

```powershell
# front-end/ dizininde
npm run lint
npm test
npm run build

# back-end/ dizininde
npm run typecheck
npm test
npm run build
```

Bunları Playwright MCP tarayıcı testlerinden ayrı bir tabloda raporla. Başarısız kontrolün ilk anlamlı hatasını kaydet. Uygulama kodunu değiştirmeden bağımsız kontrollere devam et. Yeni değişiklik veya çözülmemiş hata yoksa başarılı testleri tekrar çalıştırma.

### 10. Kanıt, rapor ve bitirme koşulu

`report.md` şu bilgileri içersin:

- Gerçek kullanılan UI/API adresleri, ayrı veritabanı yolu, Node ve Playwright MCP sürümü elde edilebildiği ölçüde, tarayıcı/viewport/tema ve test kapsamı.
- Kabul kriteri ve senaryo bazında tablo: **ID | gereksinim | önkoşul/işlem | beklenen | gözlenen | GEÇTİ/KALDI/ENGELLENDİ/ÇALIŞTIRILMADI | kanıt dosyası**.
- Her bulgu için önem derecesi, etkilenen rol/sayfa, tekrar üretme adımları, beklenen-gerçekleşen farkı ve kanıt. Koddaki olası nedenleri doğrulanmış gözlemlerden ayrı belirt.
- Eksik araç, veri, ortam veya başka bir hata nedeniyle tamamlanamayan senaryolar ve gereken somut sonraki adım.
- Mevcut test/lint/build sonuçları, geçici yapılandırma değişiklikleri ve temizlik özeti.

Bir senaryoyu yalnızca ilgili sonuç gerçekten gözlendiyse GEÇTİ say. Ekran görüntüsünün alınmış olması, MCP sunucusunun başlaması veya test komutunun çalıştırılmış olması tek başına başarı değildir. Gizli/eksik kontrolleri ve denenmemiş işlevleri açıkça belirt.

İşin bitmesi için bölüm 14 ve 17'den çıkardığın her uygulanabilir kriter bir sonuçla eşleştirilmiş, ana yaşam döngüsü denenmiş, masaüstü/mobil kontroller tamamlanmış veya gerekçeli olarak engellenmiş, mevcut proje kontrolleri raporlanmış olmalı.

Sonunda yalnızca kendi başlattığın tarayıcı oturumlarını ve sunucuları kapat; kendi geçici ayarlarını güvenle geri al. Varsayılan veritabanını ve başka görevlerin süreçlerini koru. Kanıtları ve yeniden üretme için test DB'sini çıktı dizininde bırak; token içeren gereksiz oturum dökümlerini saklama. `.playwright-mcp/`, veritabanı, `node_modules/` ve `dist/` dosyalarını Git'e ekleme.

Kullanıcıya Türkçe kısa sonuç ver: geçen/kalan/engellenen senaryo sayıları, en önemli bulgular, neyin doğrulanamadığı ve raporun mutlak dosya bağlantısı. Gerçekte yapılmayan bir kontrolü yapmış gibi yazma.
