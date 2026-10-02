import assert from "node:assert/strict";
import { test } from "node:test";
import { createMaskState, maskText } from "../src/security/sensitiveData.js";

test("e-posta maskelenir", () => {
  assert.equal(maskText("Yazın emin@example.com adresine."), "Yazın [EMAIL_1] adresine.");
});

test("telefon maskelenir", () => {
  assert.equal(maskText("Ara 0555 123 45 67."), "Ara [PHONE_1].");
  assert.equal(maskText("Hat +90 555 111 22 33."), "Hat [PHONE_1].");
});

test("TCKN benzeri değer maskelenir", () => {
  assert.equal(maskText("TC kimlik numaram 12345678901."), "TC kimlik numaram [TCKN_1].");
});

test("kredi kartı benzeri değer maskelenir", () => {
  assert.equal(maskText("Kart 4111111111111111 bitti."), "Kart [CARD_1] bitti.");
  assert.equal(maskText("Kart 4111 1111 1111 1111 bitti."), "Kart [CARD_1] bitti.");
});

test("API anahtarı maskelenir", () => {
  assert.equal(maskText("anahtar sk-proj-abcDEF1234567890xyz"), "anahtar [API_KEY_1]");
});

test("Bearer token maskelenir", () => {
  assert.equal(maskText("Authorization Bearer abcdefghijklmnop"), "Authorization [TOKEN_1]");
});

test("JWT maskelenir", () => {
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signaturevalue";
  assert.equal(maskText(`oturum ${jwt}`), "oturum [TOKEN_1]");
});

test("birden fazla PII ayrı yer tutucu alır", () => {
  const text = "a@ornek.com ve b@ornek.com ile 12345678901";
  assert.equal(maskText(text), "[EMAIL_1] ve [EMAIL_2] ile [TCKN_1]");
});

test("parola ataması maskelenir", () => {
  assert.equal(maskText("password=gizli-deger"), "[SECRET_1]");
});

test("normal metin ve kaynak kimliği değişmez", () => {
  const text = "Yıllık izin başvurusu VPN bordro id: izin";
  assert.equal(maskText(text), text);
});

test("sayaç metinler arasında sürer", () => {
  const state = createMaskState();
  assert.equal(maskText("emin@example.com", state), "[EMAIL_1]");
  assert.equal(maskText("ikinci@example.com", state), "[EMAIL_2]");
});
