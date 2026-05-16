- [x] test sonuçları dönüyor ama nedense kod doğru olmasına rağmen hepsi yanlış. en iyisi biz geri dönelim eski sisteme. görünen testler ayrı ayrı çalıştırılır. sınav bitiminde hidden test case'ler çalışır. buna göre frontend ve backend işlemlerini ve temizliğini yapalım.

- [x] quizlerim sayfasında sıralama ölçütü kullanıcı tercihi olarak kaydedilmeli ve sayfa yeniden yüklendiğinde kullanıcının son tercihi ile başlamalı.

- [x] profil sekmesinde görünen ad güncellemesi çalışmıyor. end point var mı kontrol et, end point bağlı mı kontrol et ve gerekli güncelleme işlemlerini tamamla.

- [x] profile sekmesinde şifre güncellemesi çalışmıyor. end point var mı kontrol et, end point bağlı mı kontrol et ve gerekli güncelleme işlemlerini tamamla.

- [x] admin quizler sekmesinde quiz silinince quiz listesi yenilenmiyor. ayrıca admin quizlerde seçim işlemi, tümünü seç, seçimi sıfırla ve seçilenleri sil gibi bir özellik isterim. tabi bunun için bir endpoint var mı yani toplu silme endpointi olması gerekir ve bunun frontend bağlantıları oluşturulması gerekir.

- [ ] admin oturumlar yönetimi çok doğru değil sanki, sadece anonim katılımcılar gözüküyor ama bu böyle olmaması gerekir. olması gereken şuanda aktif giriş yapan kullanıcıları çeker(giriş yapılı). kullanıcıları zorla sonlandır diyerek giriş yapmış adamı çıkış yapmasına zorlar.(değişiklikler sonrasında test edildiğinde doğru şekilde oturumlar geliyor fakat ilk olarak kullanıcı kendisi için oturumu sonlandır diyebiliyor bu nasıl oluyor(sekmeyi yenileyince çıkış yapmıyor), diğer kullanıcılar da çıkış yapmıyor bu durumda. olması gereken token reset gibi bir duruma geçip kullanıcının session'ını sonlandırmak değil mi burada?)

- [x] admin sistem logları sayfası log kaydı bulunamadı diyor, gerekli log bağlantı işlemleri var mı? docker logları falan bağlanıyor mu? çünkü amacı runner loglarını görüntülemek, api responseları falan görüntülemek.

- [x] pasif kullanıcı ne yapamıyor şuanda? çünkü pasif kullanıcı girişi sağlanabiliyor...

- [ ] sonuç ekranında puan ve yapılanlar gösteriliyor fakat gizli test case'ler tamamlanmadan neye göre puan hesaplanıyor?

- [x] public altındaki favicon.svg ve icon.svg değiştirildi. bunun frontend tarafında uygulanıp güncellenmesi lazım ve navbar ve dashboard'da isim yanında logo olsun isterim. 

- [ ] admin kullanıcıları kendi profiline girip düzeltemiyor. bu expected mı yoksa yanlışlık mı?
  - sen iki farklı dashboard oluşturmuşsun fakat neden bunun yerine dashboarddaki item'lar admin ise üzerine yenilerini eklese?

- [ ] login ve register ekranına logo
- [ ] quiz oluşturmada çıktı sorusunda çıktıyı kullan ve çıktı yanlış gösteriyor(1 2 3 4 5 yerine Execution finished successfully.)
