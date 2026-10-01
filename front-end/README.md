# Kurumsal Bilgi ve Destek Asistanı — ön yüz

Çalışan portalının React uygulaması. Kurumsal sorulara kaynaklı yanıt ve destek talebi oluşturma bu ön yüzden yürür.

## Gereksinimler

- Node.js 22.16+ (tüm proje)
- Çalışan API. Varsayılan adres `http://localhost:3001`

## Kurulum

```bash
cd front-end
npm ci
```

API adresini değiştirmek için `VITE_API_URL` tanımlayın. Ayar yoksa varsayılan `http://localhost:3001` kullanılır. Örnek değer `front-end/.env.example` dosyasındadır.

## Çalıştırma

Önce API’yi `http://localhost:3001` adresinde başlatın, ardından:

```bash
cd front-end
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

## Komutlar

```bash
npm run dev      # http://localhost:5173
npm run lint     # oxlint
npm run build    # tsc -b && vite build
npm test         # vitest
```

## CORS

API’de `CORS_ORIGIN` varsayılanı `http://localhost:5173` olduğu için uygulamayı `http://127.0.0.1:5173` üzerinden açmak CORS hatası verir. `localhost` kullanılmalı veya `CORS_ORIGIN` ayarlanmalıdır.
