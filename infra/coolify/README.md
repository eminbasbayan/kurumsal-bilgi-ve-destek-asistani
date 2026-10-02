# Coolify

GitHub üzerinden kurulum kökteki `docker-compose.yml` dosyasını kullanır. Yerel geliştirme kapısı `infra/ai-gateway/docker-compose.yml` dosyasında kalır; o dosya `127.0.0.1:4000` yayınlar ve production’da kullanılmaz.

## Coolify ayarı

1. GitHub App bu repoyu görebilsin.
2. Yeni kaynak: bu repo. Build Pack: **Docker Compose**.
3. Docker Compose Location: `docker-compose.yml` (depo kökü).
4. Deploy öncesi ortam değişkenleri:

| Değişken | Nerede geçer | Zorunlu |
|---|---|---|
| `VITE_API_URL` | Ön yüz derlemesi. Tarayıcının gördüğü API adresi, örneğin `https://api.ornek.com` | Evet |
| `CORS_ORIGIN` | API. Ön yüzün adresi, örneğin `https://portal.ornek.com` | Evet |
| `GEMINI_API_KEY` | Yalnızca LiteLLM | Evet |
| `LITELLM_MASTER_KEY` | Yalnızca LiteLLM | Evet |
| `AI_GATEWAY_KEY` | Yalnızca API. İlk kurulumda boş bırakılabilir | Hayır |

Postgres parolasını Coolify üretir. Master key ve Gemini anahtarı panele yazılır, repoya girmez.

5. Alan adları Compose içindeki `SERVICE_URL_*` değerlerinden gelir. Ön yüz 80, API 3001 portundadır. API alanına iç port eklenir: `https://api.ornek.com:3001`. Dış istek yine 443’e gelir.
6. LiteLLM ve Postgres’e alan adı vermeyin. API onlara `http://litellm:4000` ile iç ağdan gider.

## Sanal anahtar

İlk deploy `AI_GATEWAY_KEY` boşken de açılır. Asistan o halde alıntıya düşer. LiteLLM ayakta olduktan sonra master key ile `corporate-assistant` için sanal anahtar üretin, değeri Coolify’de `AI_GATEWAY_KEY` olarak kaydedin ve API’yi yeniden başlatın. Anahtar yalnızca bu modele, dakika başına 20 istek, 20000 token ve bütçe ile sınırlı olmalıdır. Üretim adımı `infra/ai-gateway/README.md` içindedir; adres bu kez kapının iç adresidir, genel internete açılmaz.

`VITE_API_URL` değişince ön yüz imajı yeniden derlenir. Çalışan konteynere sonradan yazmak yetmez.

Yerel `docker compose` (`infra/ai-gateway`) bu sunucu kurulumunun yerine geçmez. Coolify kökteki `docker-compose.yml` dosyasını kullanır.
