# AI Gateway

Bu klasör, asistanın model çağrıları için LiteLLM AI Gateway kurar. Uygulamanın REST kapısı değildir. Front-end ve back-end buraya tarayıcıdan değil, yalnızca back-end süreci bağlanır.

## Neden

Back-end artık Gemini adresini ve Gemini anahtarını bilmez. İstek `corporate-assistant` adlı modele gider. Hangi sağlayıcının cevaplayacağı bu kapıda durur. Gemini yerine başka bir model bağlamak için back-end kodu değişmez; `config.yaml` içindeki alias güncellenir.

## LiteLLM ne yapar

OpenAI biçimindeki `POST /v1/chat/completions` isteğini alır, alias’ı `gemini/gemini-2.5-flash` modeline çevirir ve Gemini’ye iletir. Sanal anahtar, hız sınırı, bütçe ve harcama kaydı bu katmandadır.

## Anahtarlar

| Anahtar | Nerede | Ne işe yarar |
|---|---|---|
| `GEMINI_API_KEY` | Yalnızca bu klasörün `.env` dosyası | Gateway’in Gemini’ye çıkması |
| `LITELLM_MASTER_KEY` | Yalnızca bu klasörün `.env` dosyası | Anahtar üretmek ve gateway yönetimi |
| Sanal anahtar | `back-end/.env` içinde `AI_GATEWAY_KEY` | Back-end’in yalnızca `corporate-assistant` çağırması |

Master key front-end’e veya back-end sürecine verilmez. Gemini anahtarı back-end’de durmaz.

Model alias, back-end’in gördüğü addır (`corporate-assistant`). Gerçek model adı yalnızca `config.yaml` içindedir.

Sanal anahtar, master key ile üretilen sınırlı kimliktir. Bu kurulumda model listesi, dakika başına istek, dakika başına token ve bütçe ile kısıtlanır. Master key ise yönetim içindir; uygulama onu kullanmaz.

## Çalıştırma

1. `.env` yoksa `.env.example` dosyasını kopyalayın. Varsa üzerine yazmayın. `GEMINI_API_KEY`, `LITELLM_MASTER_KEY` ve `POSTGRES_PASSWORD` boş kalamaz; Postgres boş parolayla kapanır. Bu dosya git’e girmez.

2. Kapıyı açın:

```powershell
cd infra/ai-gateway
docker compose up -d
```

LiteLLM `http://127.0.0.1:4000` adresindedir. Postgres konteynerin dışına port açmaz.

3. Sanal anahtar üretin. Master key’i komut satırına yapıştırmadan, ortam değişkeninden okuyun:

```powershell
$headers = @{ Authorization = "Bearer $env:LITELLM_MASTER_KEY" }
$body = @{
  models = @("corporate-assistant")
  max_budget = 5
  budget_duration = "30d"
  rpm_limit = 20
  tpm_limit = 20000
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4000/key/generate -Headers $headers -ContentType "application/json" -Body $body
```

Dönen `key` değerini `back-end/.env` içine yazın:

```text
AI_GATEWAY_URL=http://localhost:4000
AI_GATEWAY_KEY=<sanal anahtar>
AI_GATEWAY_MODEL=corporate-assistant
ASSISTANT_TIMEOUT_MS=
```

4. Back-end ve front-end:

```powershell
cd back-end
npm run dev
```

`http://localhost:3001`

```powershell
cd front-end
npm run dev
```

`http://localhost:5173`

## Sınırlar

Uygulama içindeki çalışan başına hız sınırı durur. Bu, tek kullanıcının art arda üretim denemesini keser.

Gateway’deki RPM/TPM ve sanal anahtar bütçesi toplam model harcamasını keser. `config.yaml` deployment için 30 istek / 40000 token sınırı taşır. Sanal anahtar ayrıca 20 RPM, 20000 TPM ve 30 günde 5 birim bütçe ile örneklendirilmiştir. Sayılar `config.yaml` ve anahtar üretme gövdesinden değiştirilir.

## Maskeleme

E-posta, telefon, TCKN benzeri sayı, kart, API anahtarı, Bearer/JWT ve `password`/`secret` atamaları back-end’de, LiteLLM’e gitmeden hemen önce yer tutucuya çevrilir. FTS araması ham soruyla yapılır. Maske geri açılmaz. Ayrıntı `back-end/src/security/sensitiveData.ts` dosyasındadır.

## Production

- İmaj etiketi `v1.103.2` olarak sabitlenmiştir. `latest` kullanmayın.
- Gateway’i genel internete açmayın. Back-end ile arasında özel ağ ve TLS olsun.
- Master key, Gemini anahtarı ve sanal anahtar bir secret manager’da dursun. Repoya ve loga yazılmasın.
- `store_prompts_in_spend_logs` kapalıdır. Prompt gövdesini loglamayın. Saklama süresi ayrıca tanımlanmalıdır.
- Postgres’i yedekleyin. Tek konteyner yüksek erişilebilirlik değildir.
- Bu regex maskeleme gerçek bir DLP değildir. Production’da ayrı bir tarayıcıya bırakılacak biçimde tek modülde durur.
- Demo oturum gerçek SSO değildir. Uygulama hız sınırı süreç belleğindedir; birden fazla back-end kopyasında ortak sayaç olmaz.
