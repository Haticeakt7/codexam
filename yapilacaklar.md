# CodExam – Yapılacaklar (Son Güncelleme: 2026-05-14)

## ✅ TÜMÜ TAMAMLANDI

Aşağıdaki tüm özellikler implement edildi ve entegre çalışıyor:

- [x] **Quiz katılım linki sistemi** — Her quize otomatik benzersiz UUID token (ParticipationToken) atanır. `/q/join/:token` rotası mevcut. Katılım linki QuizSettings sayfasında gösterilir ve kopyalanabilir.

- [x] **Quiz düzenleme iyileştirmeleri** — Quiz oluşturulduktan sonra başlık, açıklama, süre, mod gibi alanlar düzenlenebilir. Quiz aktif olana veya katılımcı girene kadar tüm alanlar değiştirilebilir. Sonrasında kilitleme (isStructureLocked) uygulanır; UI görsel olarak kilitli durumu gösterir (opacity-60, disabled input'lar).

- [x] **Draft/Publish sistemi** — Quiz oluşturulduğunda Draft modda başlar ve QuizSettings'e yönlendirilir. Yayınlama QuizSettings'teki publish bölümünden yapılır. Validasyon: ≥1 soru, StartsAt gelecekte veya null, FreeStyle→EndsAt zorunlu. Status akışı: Draft → Published (zamanlanmış) veya Active (hemen) → Ended/Archived.

- [x] **Quiz tarih/saat sistemi** — StartsAt ve EndsAt alanları eklendi. Gerçek Zamanlı mod: StartsAt'tan itibaren DurationMinutes boyunca aktif. Serbest Zamanlı mod: StartsAt→EndsAt arasında isteğe bağlı giriş. UTC dahili, görüntüler yerel saate çevrilir.

- [x] **Kod editörü yeniden boyutlandırılabilir paneller** — Solda Monaco editörü (varsayılan %55 genişlik), sağda üstte output, altında stdin. Dikey handle ile editör genişliği, yatay handle ile output/stdin yüksekliği fare ile sürüklenebilir. Harici kütüphane kullanılmadı (useVerticalResize + useHorizontalResize custom hook'ları).

- [x] **Çalışma alanı kalıcılığı** — Anonim kullanıcılar için localStorage (Zustand persist), giriş yapan kullanıcılar için DB persist (User.PreferencesJson). Panel boyutları ve editör tercihleri server ile debounced sync (1200ms tema/font, 2000ms layout). Giriş sonrası server'dan yüklenir (usePreferencesSync).

- [x] **Stdin paneli her zaman görünür** — Toggle butonu kaldırıldı. Stdin paneli hem Ana Sayfa'da hem Sınav ekranında her zaman açık ve hazır.

- [x] **Desteklenen diller entegrasyonu** — Backend appsettings.json'dan dil listesi okunur (6 dil: python, javascript, cpp, c, java, go). `/api/execute/languages` endpoint'i ile frontend dinamik dil listesini çeker (useLanguages hook, Infinity staleTime, fallback verisi). Monaco monacoLanguage alanı ile doğru syntax highlighting.

- [x] **Font size ayarı** — Her editör sayfasında +/- butonları ile font boyutu 8-32 arasında ayarlanabilir. Tercih localStorage'da saklanır, giriş yapan kullanıcılar için server'a sync edilir.

- [x] **Monaco tema sistemi** — vs-dark (varsayılan), vs (açık), hc-black (yüksek kontrast) seçenekleri. 🎨 butonu ile tema picker dropdown açılır. Tercih persist (localStorage + server).

- [x] **Kullanıcı tercihleri sistemi** — Unified preferencesStore: editorTheme + fontSize + layout. localStorage her zaman. Giriş yapan kullanıcılar için DB'de saklanır (User.PreferencesJson kolonu). Login sonrası GET /api/users/me/preferences ile otomatik yüklenir.

---

## ⬜ Kalan Görevler

- [ ] C, Java, Go runner Docker image'ları yazılacak (appsettings.json'da tanımlı, sadece Dockerfile'lar eksik)
- [ ] Unit, Integration, E2E testler
- [ ] JWT secret rotation + PostgreSQL backup prosedürü
