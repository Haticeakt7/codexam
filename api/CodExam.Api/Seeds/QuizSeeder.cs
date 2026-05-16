using System.Text.Json;
using CodExam.Domain.Entities;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Api.Seeds;

public static class QuizSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Quizzes.AnyAsync(q => q.Title.StartsWith("MBM") || q.Title.StartsWith("MYM")))
            return;

        var hatice = await db.Users.FirstOrDefaultAsync(u => u.Email == "hatice@demo.com");
        var emir   = await db.Users.FirstOrDefaultAsync(u => u.Email == "emir@demo.com");
        var seymen = await db.Users.FirstOrDefaultAsync(u => u.Email == "seymen@demo.com");

        if (hatice is null || emir is null || seymen is null) return;

        var now = DateTime.UtcNow;

        // ── MBM Quizleri ──────────────────────────────────────────────────────
        AddMBM201(db, seymen, now);
        AddMBM102(db, hatice, now);
        AddMBM301(db, emir,   now);
        AddMBM303(db, seymen, now);
        AddMBM404(db, hatice, now);
        AddMBM202(db, emir,   now);
        AddMBM401(db, seymen, now);

        // ── MYM Quizleri ──────────────────────────────────────────────────────
        AddMYM201(db, hatice, now);
        AddMYM301(db, emir,   now);
        AddMYM302(db, seymen, now);
        AddMYM202(db, hatice, now);
        AddMYM401(db, emir,   now);
        AddMYM303(db, seymen, now);
        AddMYM102(db, hatice, now);
        AddMYM404(db, emir,   now);

        await db.SaveChangesAsync();
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    static JsonDocument J(string raw) => JsonDocument.Parse(raw);

    static Quiz Quiz(Guid ownerId, string title, string desc, int dur, QuizStatus status,
        DateTime now, DateTime? startsAt = null, DateTime? endsAt = null)
    {
        var pub = status is QuizStatus.Published or QuizStatus.Active or QuizStatus.Ended
            ? now - TimeSpan.FromDays(status == QuizStatus.Ended ? 14 : 3) : (DateTime?)null;
        return new Quiz
        {
            Id               = Guid.NewGuid(),
            OwnerId          = ownerId,
            Title            = title,
            Description      = desc,
            DurationMinutes  = dur,
            Mode             = QuizMode.FreeStyle,
            Status           = status,
            ParticipationToken = Guid.NewGuid(),
            AntiCheatOptions = J("""{"tabSwitch":false,"fullscreen":false,"clipboard":false}"""),
            FormSchema       = J("""[{"key":"name","label":"Ad Soyad","type":"text","required":true,"isIdentity":true},{"key":"student_id","label":"Öğrenci No","type":"text","required":true,"isIdentity":false}]"""),
            PublishedAt      = pub,
            StartsAt         = startsAt,
            EndsAt           = endsAt,
            CreatedAt        = now - TimeSpan.FromDays(status == QuizStatus.Ended ? 20 : status == QuizStatus.Draft ? 1 : 10),
            UpdatedAt        = now - TimeSpan.FromDays(1),
        };
    }

    static Question Question(Guid quizId, QuestionType type, string title, string body,
        int pts, int order, JsonDocument options, DateTime now)
        => new()
        {
            Id        = Guid.NewGuid(),
            QuizId    = quizId,
            Type      = type,
            Title     = title,
            Body      = body,
            Points    = pts,
            OrderNo   = order,
            Options   = options,
            CreatedAt = now,
            UpdatedAt = now,
        };

    static TestCase TC(Guid qId, string input, string expected, bool visible, int order, DateTime now)
        => new()
        {
            Id             = Guid.NewGuid(),
            QuestionId     = qId,
            Input          = input,
            ExpectedOutput = expected,
            IsVisible      = visible,
            OrderNo        = order,
            CreatedAt      = now,
        };

    // ═════════════════════════════════════════════════════════════════════════
    // MBM 201 – Veri Yapıları ve Algoritmalar  (seymen, 60 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMBM201(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MBM 201 – Veri Yapıları ve Algoritmalar",
            "Temel veri yapıları (dizi, yığın, kuyruk, bağlı liste) ve algoritma analizi konularını içeren dönem sonu sınavı.",
            60, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – Binary Search (Coding)
        var q1 = Question(quiz.Id, QuestionType.Coding,
            "İkili Arama (Binary Search) Algoritması",
            "Sıralı bir tam sayı dizisi ve bir hedef değer veriliyor. İkili arama algoritmasıyla hedefin indeksini döndürün.\n\nEğer hedef yoksa **-1** döndürün.\n\n**Girdi Formatı:**\n- Satır 1: boşlukla ayrılmış sıralı tam sayılar\n- Satır 2: aranan hedef\n\n**Örnek:**\n```\nGirdi:  1 3 5 7 9 11 / 7\nÇıktı:  3\n```",
            20, 1,
            J("""{"allowedLanguages":["python","javascript"],"starterCode":"def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    # Kodunuzu buraya yazın\n    pass\n\narr = list(map(int, input().split()))\ntarget = int(input())\nprint(binary_search(arr, target))"}"""),
            now);
        db.Questions.Add(q1);
        db.TestCases.AddRange(
            TC(q1.Id, "1 3 5 7 9 11\n7",  "3",  true,  1, now),
            TC(q1.Id, "2 4 6 8 10\n5",    "-1", true,  2, now),
            TC(q1.Id, "42\n42",            "0",  false, 3, now),
            TC(q1.Id, "1 2 3 4 5 6 7 8 9 10\n1", "0", false, 4, now));

        // Q2 – Zaman Karmaşıklığı (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Zaman Karmaşıklığı Analizi",
            "Aşağıdaki sıralama algoritmalarından hangisinin **ortalama** zaman karmaşıklığı **O(n log n)**'dir?",
            10, 2,
            J("""{"choices":[{"id":"a","text":"Bubble Sort – O(n²)"},{"id":"b","text":"Merge Sort – O(n log n)"},{"id":"c","text":"Insertion Sort – O(n²)"},{"id":"d","text":"Selection Sort – O(n²)"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q3 – Yığın (Stack) Çıktısı (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "Yığın (Stack) Operasyonları Çıktısı",
            "Aşağıdaki Python kodunu çalıştırdığınızda ekranda ne görünür? Her `print` çıktısını ayrı satıra yazın.",
            10, 3,
            J("""{"codeBlock":"stack = []\nstack.append(5)\nstack.append(3)\nstack.append(8)\nprint(stack.pop())\nstack.append(1)\nprint(stack.pop())\nprint(len(stack))","codeLanguage":"python","expectedOutput":"8\n1\n2","matchMode":"trimmed"}"""),
            now));

        // Q4 – BFS Veri Yapısı (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "BFS için Kullanılan Veri Yapısı",
            "Genişlik Öncelikli Arama (Breadth-First Search) algoritmasında hangi veri yapısı kullanılır? Kısa ve net yanıt verin.",
            10, 4,
            J("""{"acceptedAnswers":["kuyruk","queue","FIFO","kuyruk (queue)","Queue"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q5 – Bağlı Liste Hatası (BugFix)
        var q5 = Question(quiz.Id, QuestionType.BugFix,
            "Bağlı Liste Traversal Hatası",
            "Aşağıdaki bağlı liste kodunda bir hata bulunmaktadır. Listedeki tüm düğümleri doğru sırada yazdıracak şekilde düzeltin.\n\n**Beklenen çıktı:** `1 -> 2 -> 3 -> None`",
            15, 5,
            J("""{"buggyCode":"class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\nhead = Node(1)\nhead.next = Node(2)\nhead.next.next = Node(3)\n\ncurrent = head\nwhile current:\n    print(current.val, end=' ')\n    if current.next:\n        print('-> ', end='')\n    current = current.next.next  # HATA\nprint('None')","correctCode":"class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\nhead = Node(1)\nhead.next = Node(2)\nhead.next.next = Node(3)\n\ncurrent = head\nwhile current:\n    print(current.val, end=' ')\n    if current.next:\n        print('-> ', end='')\n    current = current.next\nprint('None')","codeLanguage":"python"}"""),
            now);
        db.Questions.Add(q5);
        db.TestCases.AddRange(
            TC(q5.Id, "", "1 -> 2 -> 3 -> None", true, 1, now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MBM 102 – Nesne Yönelimli Programlama  (hatice, 45 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMBM102(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MBM 102 – Nesne Yönelimli Programlama",
            "OOP prensipleri (encapsulation, inheritance, polymorphism, abstraction) ve Python'da sınıf kullanımı.",
            45, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – OOP Prensipleri (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Kapsülleme (Encapsulation) Prensibi",
            "Nesne yönelimli programlamada **encapsulation** (kapsülleme) prensibi en iyi şekilde hangisi ile açıklanır?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Alt sınıflar üst sınıfın metotlarını override edebilir"},{"id":"b","text":"Veri ve metotlar bir sınıf içinde gizlenerek dış erişime kapatılır"},{"id":"c","text":"Bir nesne birden fazla türde davranış sergileyebilir"},{"id":"d","text":"Soyut sınıflar doğrudan örneklenemez"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q2 – Kalıtım Çıktısı (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "Kalıtım ve Polimorfizm Çıktısı",
            "Aşağıdaki Python kodunu çalıştırdığınızda ekranda ne çıkar?",
            10, 2,
            J("""{"codeBlock":"class Hayvan:\n    def __init__(self, isim):\n        self.isim = isim\n    def ses_cikar(self):\n        return '...'\n\nclass Kopek(Hayvan):\n    def ses_cikar(self):\n        return f'{self.isim}: Hav!'\n\nclass Kedi(Hayvan):\n    def ses_cikar(self):\n        return f'{self.isim}: Miyav!'\n\nhayvanlar = [Kopek('Karabaş'), Kedi('Pamuk'), Kopek('Fıstık')]\nfor h in hayvanlar:\n    print(h.ses_cikar())","codeLanguage":"python","expectedOutput":"Karabaş: Hav!\nPamuk: Miyav!\nFıstık: Hav!","matchMode":"trimmed"}"""),
            now));

        // Q3 – Banka Hesabı (Coding)
        var q3 = Question(quiz.Id, QuestionType.Coding,
            "Banka Hesabı Sınıfı",
            "Aşağıdaki işlemleri destekleyen bir `BankAccount` sınıfı yazın:\n- `deposit(miktar)`: bakiyeye ekler\n- `withdraw(miktar)`: yeterliyse bakiyeden düşer, değilse bir şey yapmaz\n- `get_balance()`: mevcut bakiyeyi döndürür\n\n**Girdi:** İlk satır işlem sayısı `n`, sonraki `n` satır `deposit X`, `withdraw X` veya `balance` komutlarından biri.\n\n**Çıktı:** Her `balance` komutu için bakiye.",
            20, 3,
            J("""{"allowedLanguages":["python","javascript"],"starterCode":"class BankAccount:\n    def __init__(self):\n        self.balance = 0\n\n    def deposit(self, amount):\n        # TODO\n        pass\n\n    def withdraw(self, amount):\n        # TODO – yetersiz bakiyede işlem yapma\n        pass\n\n    def get_balance(self):\n        # TODO\n        pass\n\naccount = BankAccount()\nn = int(input())\nfor _ in range(n):\n    parts = input().split()\n    if parts[0] == 'deposit':\n        account.deposit(int(parts[1]))\n    elif parts[0] == 'withdraw':\n        account.withdraw(int(parts[1]))\n    elif parts[0] == 'balance':\n        print(account.get_balance())"}"""),
            now);
        db.Questions.Add(q3);
        db.TestCases.AddRange(
            TC(q3.Id, "3\ndeposit 1000\nwithdraw 300\nbalance",              "700", true,  1, now),
            TC(q3.Id, "4\ndeposit 500\ndeposit 200\nwithdraw 100\nbalance",   "600", true,  2, now),
            TC(q3.Id, "3\ndeposit 200\nwithdraw 500\nbalance",               "200", false, 3, now));

        // Q4 – Polimorfizm Tanımı (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Polimorfizm Tanımı",
            "OOP'ta **polimorfizm** ne anlama gelir? Kısa bir tanım yazın (anahtar kelime yeterli).",
            10, 4,
            J("""{"acceptedAnswers":["çok biçimlilik","polymorphism","çok şekillilik","aynı arayüzle farklı davranış"],"matchMode":"exactIgnoreCase"}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MBM 301 – İşletim Sistemleri  (emir, 50 dk, Active)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMBM301(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MBM 301 – İşletim Sistemleri",
            "Process yönetimi, bellek yönetimi, deadlock ve CPU zamanlama algoritmalarını kapsayan vize sınavı.",
            50, QuizStatus.Active, now,
            startsAt: now.AddHours(-2),
            endsAt:   now.AddHours(3));
        db.Quizzes.Add(quiz);

        // Q1 – Deadlock (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Deadlock Koşulları",
            "Coffman'ın deadlock koşullarından hangisi **yanlış** belirtilmiştir?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Mutual Exclusion – kaynak aynı anda yalnızca bir process tarafından kullanılabilir"},{"id":"b","text":"Hold and Wait – bir process kaynak tutarken başka kaynak bekleyebilir"},{"id":"c","text":"Preemption – kaynaklar zorla geri alınabilir (deadlock oluşur)"},{"id":"d","text":"Circular Wait – processler döngüsel bekleme zinciri oluşturur"}],"correctIds":["c"],"multiSelect":false}"""),
            now));

        // Q2 – Sanal Bellek (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Sanal Bellek Avantajı",
            "İşletim sistemlerinde **sanal bellek** kullanımının temel avantajı aşağıdakilerden hangisidir?",
            10, 2,
            J("""{"choices":[{"id":"a","text":"CPU hızını doğrudan artırır"},{"id":"b","text":"Programların fiziksel RAM'den daha büyük adres uzayı kullanmasına olanak tanır"},{"id":"c","text":"Disk I/O işlemlerini tamamen ortadan kaldırır"},{"id":"d","text":"Tüm processler aynı fiziksel adresleri paylaşır"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q3 – Context Switching (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Context Switching",
            "İşletim sistemlerinde **context switching** (bağlam geçişi) nedir? Kısaca tanımlayın.",
            10, 3,
            J("""{"acceptedAnswers":["cpu nun bir process ten diğerine geçişi","context switch","işlemci durumunun kaydedilerek başka bir processe geçilmesi","process durumunun kaydedilmesi"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q4 – FCFS Zamanlama (Coding)
        var q4 = Question(quiz.Id, QuestionType.Coding,
            "FCFS CPU Zamanlama Algoritması",
            "**FCFS (First Come First Served)** zamanlama algoritmasını implement edin.\n\nHer process `arrival_time` ve `burst_time` ile verilir. Processlerin ortalama bekleme süresini **virgülden sonra iki basamak** olarak yazdırın.\n\n**Girdi Formatı:**\n- Satır 1: process sayısı `n`\n- Sonraki `n` satır: `arrival_time burst_time`\n\n**Örnek:**\n```\n3\n0 5\n1 3\n2 1\nÇıktı: 3.33\n```",
            20, 4,
            J("""{"allowedLanguages":["python","javascript"],"starterCode":"def fcfs_avg_wait(processes):\n    # processes: [(arrival, burst), ...] sıralanmış geliş zamanına göre\n    # Ortalama bekleme süresini döndür\n    pass\n\nn = int(input())\nprocesses = [tuple(map(int, input().split())) for _ in range(n)]\nprocesses.sort(key=lambda x: x[0])\nprint(f'{fcfs_avg_wait(processes):.2f}')"}"""),
            now);
        db.Questions.Add(q4);
        db.TestCases.AddRange(
            TC(q4.Id, "3\n0 5\n1 3\n2 1", "3.33", true,  1, now),
            TC(q4.Id, "3\n0 4\n0 3\n0 2", "3.67", true,  2, now),
            TC(q4.Id, "1\n0 10",           "0.00", false, 3, now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MBM 303 – Veritabanı Sistemleri  (seymen, 55 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMBM303(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MBM 303 – Veritabanı Sistemleri",
            "İlişkisel veritabanı tasarımı, normalizasyon (1NF–3NF), SQL ve ACID özellikleri.",
            55, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – ACID (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "ACID – Isolation Özelliği",
            "ACID özelliklerinden **Isolation** (yalıtım) ne sağlar?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Transaction tamamlandığında veriler kalıcı olarak saklanır"},{"id":"b","text":"Eş zamanlı çalışan transaction'lar birbirini etkilemez"},{"id":"c","text":"Transaction ya tamamen gerçekleşir ya da hiç gerçekleşmez"},{"id":"d","text":"Veri her zaman tutarlı bir durumda kalır"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q2 – Normalizasyon (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "3. Normal Form (3NF) Koşulu",
            "Bir tablonun **Üçüncü Normal Formda (3NF)** olabilmesi için 2NF'ye ek olarak hangi koşul sağlanmalıdır? Anahtar kavramı yazın.",
            10, 2,
            J("""{"acceptedAnswers":["transitif bağımlılık olmamalı","geçişli bağımlılık yok","transitive dependency","transitif fonksiyonel bağımlılık"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q3 – SQL Çıktısı (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "Departman Bazlı Maaş Analizi Çıktısı",
            "Aşağıdaki Python kodu bir çalışan tablosunu simüle ediyor. Çıktısı nedir?",
            10, 3,
            J("""{"codeBlock":"calisanlar = [\n    ('Ali',    'IT',  8000),\n    ('Ayse',   'HR',  6000),\n    ('Mehmet', 'IT',  9000),\n    ('Fatma',  'HR',  7000),\n]\ntoplam = {}\nsayac = {}\nfor _, dept, maas in calisanlar:\n    toplam[dept] = toplam.get(dept, 0) + maas\n    sayac[dept]  = sayac.get(dept, 0) + 1\nfor dept in sorted(toplam):\n    print(f'{dept}: {toplam[dept] // sayac[dept]}')","codeLanguage":"python","expectedOutput":"HR: 6500\nIT: 8500","matchMode":"trimmed"}"""),
            now));

        // Q4 – Ortalama Maaş (Coding)
        var q4 = Question(quiz.Id, QuestionType.Coding,
            "Departmana Göre Ortalama Maaş",
            "Çalışan listesi verildiğinde her departmanın **ortalama maaşını** (tam sayı bölmesi) departman adına göre **alfabetik sırayla** yazdırın.\n\n**Girdi:**\n- Satır 1: çalışan sayısı `n`\n- Sonraki `n` satır: `isim departman maas`\n\n**Çıktı:** Her departman için `DEPARTMAN: ortalama_maas`",
            20, 4,
            J("""{"allowedLanguages":["python","javascript"],"starterCode":"from collections import defaultdict\n\nn = int(input())\ntoplam   = defaultdict(int)\nsayac    = defaultdict(int)\n\nfor _ in range(n):\n    parcalar = input().split()\n    isim, dept, maas = parcalar[0], parcalar[1], int(parcalar[2])\n    # TODO: toplamı ve sayacı güncelle\n\n# TODO: alfabetik sırayla yazdır"}"""),
            now);
        db.Questions.Add(q4);
        db.TestCases.AddRange(
            TC(q4.Id, "4\nAli IT 8000\nAyse HR 6000\nMehmet IT 9000\nFatma HR 7000",     "HR: 6500\nIT: 8500",             true,  1, now),
            TC(q4.Id, "3\nCan Yazilim 12000\nEce Yazilim 10000\nOzan Yazilim 11000",     "Yazilim: 11000",                  true,  2, now),
            TC(q4.Id, "2\nA X 5000\nB Y 7000",                                           "X: 5000\nY: 7000",                false, 3, now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MBM 404 – Yapay Zeka ve Makine Öğrenmesi  (hatice, 60 dk, Draft)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMBM404(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MBM 404 – Yapay Zeka ve Makine Öğrenmesi",
            "Makine öğrenmesi temelleri: supervised/unsupervised learning, gradient descent, overfitting ve değerlendirme metrikleri.",
            60, QuizStatus.Draft, now);
        db.Quizzes.Add(quiz);

        // Q1 – Supervised Learning (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Denetimli Öğrenme (Supervised Learning)",
            "Aşağıdakilerden hangisi **denetimli öğrenme (supervised learning)** örneğidir?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"E-posta spam tespiti (etiketli veriyle)"},{"id":"b","text":"K-Means ile müşteri segmentasyonu"},{"id":"c","text":"Q-Learning ile oyun oynama"},{"id":"d","text":"GAN ile görüntü üretimi"}],"correctIds":["a"],"multiSelect":false}"""),
            now));

        // Q2 – Overfitting Önleme (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Overfitting'i Önleme Yöntemleri",
            "Makine öğrenmesinde **overfitting** problemini önlemek için aşağıdakilerden hangisi **kullanılmaz**?",
            10, 2,
            J("""{"choices":[{"id":"a","text":"Regularization (L1/L2)"},{"id":"b","text":"Dropout katmanı eklemek"},{"id":"c","text":"Eğitim veri setini küçültmek"},{"id":"d","text":"Cross-validation kullanmak"}],"correctIds":["c"],"multiSelect":false}"""),
            now));

        // Q3 – Precision & Recall (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Precision ve Recall Dengesi",
            "Bir spam filtresi için Precision'ı yüksek tutmak ne anlama gelir? Kısaca açıklayın.",
            10, 3,
            J("""{"acceptedAnswers":["yanlış pozitif az","spam olmayan mailler spam diye işaretlenmez","false positive düşük","normal mailleri spam saymaz"],"matchMode":"exactIgnoreCase"}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MBM 202 – Ayrık Matematik  (emir, 40 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMBM202(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MBM 202 – Ayrık Matematik",
            "Graf teorisi, kombinatorik, mantık bağlantıları ve özyineleme konularını kapsayan sınav.",
            40, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – Graf Teorisi (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Euler Yolu Koşulu",
            "Bir grafın **Euler yoluna** sahip olabilmesi için gerekli koşul nedir?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Tüm köşelerin tek derecesi olmalıdır"},{"id":"b","text":"Tam olarak 0 veya 2 köşenin tek derecesi olmalıdır"},{"id":"c","text":"Graf yönsüz ve bağlı olmamalıdır"},{"id":"d","text":"Her köşe en az 2 kenara sahip olmalıdır"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q2 – Fibonacci Çıktısı (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "Fibonacci Serisi Çıktısı",
            "Aşağıdaki Python kodu çalıştırıldığında çıktı ne olur?",
            10, 2,
            J("""{"codeBlock":"def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\nprint(' '.join(str(fib(i)) for i in range(8)))","codeLanguage":"python","expectedOutput":"0 1 1 2 3 5 8 13","matchMode":"trimmed"}"""),
            now));

        // Q3 – Pigeonhole (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Pigeonhole Prensibi",
            "13 kişilik bir grupta aynı doğum ayına sahip en az kaç kişi olduğu garanti edilir? Sadece sayıyı yazın.",
            10, 3,
            J("""{"acceptedAnswers":["2","iki","en az 2"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q4 – Faktöriyel Hatası (BugFix)
        var q4 = Question(quiz.Id, QuestionType.BugFix,
            "Özyinelemeli Faktöriyel Hatası",
            "Aşağıdaki faktöriyel fonksiyonunda bir hata var. `0!` ve negatif olmayan sayıların faktöriyelini doğru hesaplayacak şekilde düzeltin.\n\n**Girdi:** Bir tam sayı `n` (0 ≤ n ≤ 10)\n**Çıktı:** n!",
            15, 4,
            J("""{"buggyCode":"def factorial(n):\n    if n == 0:\n        return 0  # HATA: 0! = 1 olmalı\n    return n * factorial(n - 1)\n\nn = int(input())\nprint(factorial(n))","correctCode":"def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\nn = int(input())\nprint(factorial(n))","codeLanguage":"python"}"""),
            now);
        db.Questions.Add(q4);
        db.TestCases.AddRange(
            TC(q4.Id, "5",  "120", true,  1, now),
            TC(q4.Id, "0",  "1",   true,  2, now),
            TC(q4.Id, "3",  "6",   false, 3, now),
            TC(q4.Id, "10", "3628800", false, 4, now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MBM 401 – Bilgisayar Ağları  (seymen, 45 dk, Ended)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMBM401(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MBM 401 – Bilgisayar Ağları",
            "OSI modeli, TCP/IP protokol ailesi, IP adresleme ve temel ağ kavramlarını kapsayan final sınavı.",
            45, QuizStatus.Ended, now,
            startsAt: now.AddDays(-15),
            endsAt:   now.AddDays(-14));
        db.Quizzes.Add(quiz);

        // Q1 – OSI Modeli (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "OSI Modeli – HTTP Katmanı",
            "HTTP protokolü OSI referans modelinin hangi katmanında çalışır?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Ağ Katmanı (Layer 3)"},{"id":"b","text":"Taşıma Katmanı (Layer 4)"},{"id":"c","text":"Uygulama Katmanı (Layer 7)"},{"id":"d","text":"Veri Bağı Katmanı (Layer 2)"}],"correctIds":["c"],"multiSelect":false}"""),
            now));

        // Q2 – TCP vs UDP (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "TCP ve UDP Karşılaştırması",
            "Aşağıdakilerden hangisi **TCP** için **yanlış** bir ifadedir?",
            10, 2,
            J("""{"choices":[{"id":"a","text":"Bağlantı kurulmadan veri gönderir (connectionless)"},{"id":"b","text":"Akış kontrolü ve tıkanıklık kontrolü sağlar"},{"id":"c","text":"Three-way handshake ile bağlantı kurar"},{"id":"d","text":"Veri sırasını ve bütünlüğünü garanti eder"}],"correctIds":["a"],"multiSelect":false}"""),
            now));

        // Q3 – ARP Protokolü (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "ARP Protokolünün Görevi",
            "**ARP (Address Resolution Protocol)** protokolünün temel görevi nedir?",
            10, 3,
            J("""{"acceptedAnswers":["ip adresini mac adresine çevirir","ip den mac e dönüşüm","fiziksel adres çözümlemesi","mac adresi öğrenir"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q4 – IP Sınıfı Çıktısı (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "IP Adresi Sınıfı Belirleme",
            "Aşağıdaki Python kodu çalıştırıldığında ne yazdırır?",
            10, 4,
            J("""{"codeBlock":"def ip_sinifi(ip):\n    ilk = int(ip.split('.')[0])\n    if ilk < 128:\n        return 'A'\n    elif ilk < 192:\n        return 'B'\n    else:\n        return 'C'\n\nadresler = ['10.0.0.1', '172.16.5.1', '192.168.1.100']\nfor adres in adresler:\n    print(f'{adres} -> Sinif {ip_sinifi(adres)}')","codeLanguage":"python","expectedOutput":"10.0.0.1 -> Sinif A\n172.16.5.1 -> Sinif B\n192.168.1.100 -> Sinif C","matchMode":"trimmed"}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MYM 201 – Yazılım Geliştirme Süreçleri  (hatice, 40 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMYM201(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MYM 201 – Yazılım Geliştirme Süreçleri",
            "Agile, Scrum, Kanban ve yazılım yaşam döngüsü modellerini kapsayan sınav.",
            40, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – Agile Manifesto (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Agile Manifestosu Değerleri",
            "Agile Manifesto'ya göre aşağıdakilerden hangisi **daha fazla değer taşır**?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Süreçler ve araçlar – Bireyler ve etkileşimler üzerinde"},{"id":"b","text":"Bireyler ve etkileşimler – Süreçler ve araçlar üzerinde"},{"id":"c","text":"Kapsamlı dokümantasyon – Çalışan yazılım üzerinde"},{"id":"d","text":"Sözleşme müzakeresi – Müşteri işbirliği üzerinde"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q2 – Scrum Rolleri (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Scrum'da Roller",
            "Scrum'da **Product Backlog**'un içeriğinden ve önceliklendirilmesinden kim sorumludur?",
            10, 2,
            J("""{"choices":[{"id":"a","text":"Scrum Master"},{"id":"b","text":"Development Team"},{"id":"c","text":"Product Owner"},{"id":"d","text":"Stakeholder"}],"correctIds":["c"],"multiSelect":false}"""),
            now));

        // Q3 – Definition of Done (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Definition of Done (DoD) Kavramı",
            "Scrum'da **Definition of Done** ne işe yarar? Kısa bir açıklama yazın.",
            10, 3,
            J("""{"acceptedAnswers":["bir işin bitmiş sayılma kriteri","tamamlanma kriterleri","bir user story nin bitti sayılma koşulları","done kriterleri"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q4 – Kanban (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Kanban Temel Prensibi",
            "Kanban'ın temel prensiplerinden biri nedir?",
            10, 4,
            J("""{"choices":[{"id":"a","text":"Her sprint 2 haftada tamamlanmalıdır"},{"id":"b","text":"WIP (Work In Progress) limiti belirlenerek iş akışı kısıtlanır"},{"id":"c","text":"Daily Standup toplantıları zorunludur"},{"id":"d","text":"Backlog grooming sprint başında yapılır"}],"correctIds":["b"],"multiSelect":false}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MYM 301 – Tasarım Desenleri  (emir, 50 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMYM301(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MYM 301 – Yazılım Tasarım Desenleri",
            "Creational, Structural ve Behavioral tasarım desenlerini kapsayan sınav (GoF).",
            50, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – Singleton (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Singleton Deseninin Amacı",
            "**Singleton** tasarım deseni hangi sorunu çözmek için kullanılır?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Nesneler arası bağımlılığı azaltmak"},{"id":"b","text":"Bir sınıfın yalnızca tek bir örneğinin (instance) var olmasını garanti etmek"},{"id":"c","text":"Nesne oluşturma işlemini alt sınıflara bırakmak"},{"id":"d","text":"Bir nesnenin durumunu kaydetmek ve geri yüklemek"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q2 – Factory Pattern Çıktısı (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "Factory Method Pattern Çıktısı",
            "Aşağıdaki Python kodu çalıştırıldığında ne yazdırır?",
            10, 2,
            J("""{"codeBlock":"class Sekil:\n    def alan(self):\n        return 0\n\nclass Daire(Sekil):\n    def __init__(self, r):\n        self.r = r\n    def alan(self):\n        return round(3.14159 * self.r ** 2, 2)\n\nclass Dikdortgen(Sekil):\n    def __init__(self, g, y):\n        self.g, self.y = g, y\n    def alan(self):\n        return self.g * self.y\n\ndef sekil_olustur(tur, *args):\n    return {'daire': Daire, 'dikdortgen': Dikdortgen}[tur](*args)\n\ns1 = sekil_olustur('daire', 5)\ns2 = sekil_olustur('dikdortgen', 4, 6)\nprint(s1.alan())\nprint(s2.alan())","codeLanguage":"python","expectedOutput":"78.54\n24","matchMode":"trimmed"}"""),
            now));

        // Q3 – Singleton Hatası (BugFix)
        var q3 = Question(quiz.Id, QuestionType.BugFix,
            "Singleton Implementasyon Hatası",
            "Aşağıdaki Singleton implementasyonunda bir hata var. Sınıfın her çağrıda aynı instance'ı döndürmesini sağlayın.\n\n**Beklenen çıktı:** `True`",
            15, 3,
            J("""{"buggyCode":"class Logger:\n    _instance = None\n\n    @classmethod\n    def get_instance(cls):\n        if cls._instance is not None:  # HATA: 'is None' olmalı\n            cls._instance = cls()\n        return cls._instance\n\n    def __init__(self):\n        self.logs = []\n\nlog1 = Logger.get_instance()\nlog2 = Logger.get_instance()\nprint(log1 is log2)","correctCode":"class Logger:\n    _instance = None\n\n    @classmethod\n    def get_instance(cls):\n        if cls._instance is None:\n            cls._instance = cls()\n        return cls._instance\n\n    def __init__(self):\n        self.logs = []\n\nlog1 = Logger.get_instance()\nlog2 = Logger.get_instance()\nprint(log1 is log2)","codeLanguage":"python"}"""),
            now);
        db.Questions.Add(q3);
        db.TestCases.AddRange(
            TC(q3.Id, "", "True", true, 1, now));

        // Q4 – Observer vs Mediator (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Observer ve Mediator Desenlerinin Farkı",
            "**Observer** deseni ile **Mediator** deseninin temel farkı nedir? Anahtar kelimeyle yanıtlayın.",
            10, 4,
            J("""{"acceptedAnswers":["observer direkt bildirim mediator merkezi","observer yayın abonelik mediator merkezi iletişim","pub sub vs merkezi koordinatör","doğrudan bildirim vs merkezi broker"],"matchMode":"exactIgnoreCase"}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MYM 302 – Test ve Kalite Güvencesi  (seymen, 35 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMYM302(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MYM 302 – Test ve Kalite Güvencesi",
            "Yazılım test türleri, test piramidi, TDD ve kod kalitesi konularını kapsayan quiz.",
            35, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – White-box (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "White-Box Test Tekniği",
            "Aşağıdakilerden hangisi **white-box** (beyaz kutu) test tekniğidir?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Boundary Value Analysis"},{"id":"b","text":"Equivalence Partitioning"},{"id":"c","text":"Statement Coverage (İfade Kapsama)"},{"id":"d","text":"Decision Table Testing"}],"correctIds":["c"],"multiSelect":false}"""),
            now));

        // Q2 – Test Piramidi (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Test Piramidi",
            "Test piramidinin tabanını (en geniş katmanı) oluşturan test türü nedir?",
            10, 2,
            J("""{"acceptedAnswers":["unit test","birim test","unit testler","birim testler"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q3 – Caesar Cipher (Coding)
        var q3 = Question(quiz.Id, QuestionType.Coding,
            "Caesar Şifrelemesi",
            "**Caesar şifreleme** algoritmasını implement edin. Sadece harfleri kaydırın, diğer karakterler değişmesin.\n\n**Girdi:**\n- Satır 1: metin (büyük ve/veya küçük harfler, boşluk içerebilir)\n- Satır 2: kaydırma miktarı (pozitif tam sayı)\n\n**Çıktı:** Şifrelenmiş metin",
            20, 3,
            J("""{"allowedLanguages":["python","javascript"],"starterCode":"def caesar(text, shift):\n    sonuc = []\n    for ch in text:\n        if ch.isalpha():\n            base = ord('A') if ch.isupper() else ord('a')\n            # TODO: kaydırma yap (alfabenin dışına çıkma!)\n            sonuc.append(ch)\n        else:\n            sonuc.append(ch)\n    return ''.join(sonuc)\n\nmetin = input()\nkaydirma = int(input())\nprint(caesar(metin, kaydirma))"}"""),
            now);
        db.Questions.Add(q3);
        db.TestCases.AddRange(
            TC(q3.Id, "HELLO\n3",    "KHOOR",  true,  1, now),
            TC(q3.Id, "ABCXYZ\n3",   "DEFABC", true,  2, now),
            TC(q3.Id, "hello\n13",   "uryyb",  false, 3, now),
            TC(q3.Id, "Test 123\n1", "Uftu 123", false, 4, now));

        // Q4 – Mock Kullanımı (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Mock Kullanımının Amacı",
            "Unit test yazarken **mock** (sahte nesne) ne zaman kullanılır?",
            10, 4,
            J("""{"choices":[{"id":"a","text":"Kodun daha hızlı çalışması için"},{"id":"b","text":"Harici bağımlılıkları (DB, API) test ortamında taklit etmek için"},{"id":"c","text":"Sadece UI bileşenlerini test etmek için"},{"id":"d","text":"Production ortamında hataları ayıklamak için"}],"correctIds":["b"],"multiSelect":false}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MYM 202 – Web Teknolojileri  (hatice, 45 dk, Active)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMYM202(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MYM 202 – Web Teknolojileri",
            "HTTP protokolü, REST mimarisi, CORS, ve web geliştirme temellerini kapsayan sınav.",
            45, QuizStatus.Active, now,
            startsAt: now.AddHours(-1),
            endsAt:   now.AddHours(4));
        db.Quizzes.Add(quiz);

        // Q1 – HTTP Durum Kodları (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "HTTP Durum Kodları",
            "HTTP **404** durum kodu ne anlama gelir?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Sunucu hatası"},{"id":"b","text":"İstek başarıyla işlendi"},{"id":"c","text":"İstenen kaynak bulunamadı"},{"id":"d","text":"Yetkisiz erişim"}],"correctIds":["c"],"multiSelect":false}"""),
            now));

        // Q2 – Async Output (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "Python Async İşlem Sıralaması",
            "Aşağıdaki Python kodu sıralı (synchronous) çalışıyor. Çıktı ne olur?",
            10, 2,
            J("""{"codeBlock":"gorevler = ['kullanici_getir', 'veri_isle', 'eposta_gonder']\nprint('Baslıyor...')\nfor i, gorev in enumerate(gorevler, 1):\n    print(f'Gorev {i}: {gorev} tamamlandi')\nprint('Bitti.')","codeLanguage":"python","expectedOutput":"Baslıyor...\nGorev 1: kullanici_getir tamamlandi\nGorev 2: veri_isle tamamlandi\nGorev 3: eposta_gonder tamamlandi\nBitti.","matchMode":"trimmed"}"""),
            now));

        // Q3 – Palindrome (Coding)
        var q3 = Question(quiz.Id, QuestionType.Coding,
            "Palindrome Kontrolü",
            "Verilen string'in palindrome olup olmadığını kontrol edin (büyük/küçük harf duyarsız).\n\n**Girdi:** Bir metin satırı\n**Çıktı:** `Evet` veya `Hayır`",
            20, 3,
            J("""{"allowedLanguages":["python","javascript"],"starterCode":"def palindrome_mi(s):\n    # TODO: s'in palindrome olup olmadığını döndür\n    pass\n\ns = input().strip().lower()\nprint('Evet' if palindrome_mi(s) else 'Hayir')"}"""),
            now);
        db.Questions.Add(q3);
        db.TestCases.AddRange(
            TC(q3.Id, "racecar",  "Evet",  true,  1, now),
            TC(q3.Id, "hello",    "Hayir", true,  2, now),
            TC(q3.Id, "Madam",    "Evet",  false, 3, now),
            TC(q3.Id, "A",        "Evet",  false, 4, now));

        // Q4 – CORS (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "CORS Nedir?",
            "**CORS (Cross-Origin Resource Sharing)** ne anlama gelir ve neden gereklidir?",
            10, 4,
            J("""{"acceptedAnswers":["farklı origin dan kaynak paylaşımı","cross origin isteklere izin verme mekanizması","tarayıcı güvenlik politikası","başka alan adından istek yapılabilmesi"],"matchMode":"exactIgnoreCase"}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MYM 401 – Yazılım Mimarisi  (emir, 55 dk, Draft)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMYM401(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MYM 401 – Yazılım Mimarisi",
            "Mimari desenler (MVC, MVVM), SOLID prensipleri, microservices ve monolith karşılaştırması.",
            55, QuizStatus.Draft, now);
        db.Quizzes.Add(quiz);

        // Q1 – MVC (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "MVC Mimarisinde View'ın Görevi",
            "MVC (Model-View-Controller) mimarisinde **View** bileşeninin birincil görevi nedir?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"İş mantığını (business logic) uygular"},{"id":"b","text":"Veri tabanı işlemlerini yönetir"},{"id":"c","text":"Kullanıcı arayüzünü sunar ve veriyi gösterir"},{"id":"d","text":"Kullanıcı girdilerini doğrular ve yönlendirir"}],"correctIds":["c"],"multiSelect":false}"""),
            now));

        // Q2 – Microservices (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Microservices Mimarisinin Avantajı",
            "Microservices mimarisinin monolith mimariye kıyasla **temel avantajı** nedir?",
            10, 2,
            J("""{"choices":[{"id":"a","text":"Tüm servisler tek bir veritabanı kullanır"},{"id":"b","text":"Her servis bağımsız olarak deploy edilebilir ve ölçeklendirilebilir"},{"id":"c","text":"Servisler arası iletişim kurmaya gerek yoktur"},{"id":"d","text":"Geliştirme süreci daha basittir"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q3 – SOLID (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "SOLID – Open/Closed Prensibi",
            "SOLID prensiplerinden **Open/Closed Prensibi**'ni kısaca açıklayın.",
            10, 3,
            J("""{"acceptedAnswers":["açık genişlemeye kapalı değişime","extension için açık modification için kapalı","genişletmeye açık değiştirmeye kapalı","open for extension closed for modification"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q4 – Tight Coupling BugFix
        var q4 = Question(quiz.Id, QuestionType.BugFix,
            "Tight Coupling Hatası",
            "Aşağıdaki kodda `NotificationService` doğrudan `EmailSender` örneği oluşturuyor (tight coupling). **Dependency Injection** kullanarak düzeltin ve çıktının `Email: Sınav başladı!` olmasını sağlayın.",
            15, 4,
            J("""{"buggyCode":"class EmailSender:\n    def gonder(self, mesaj):\n        print(f'Email: {mesaj}')\n\nclass NotificationService:\n    def __init__(self):\n        self.sender = EmailSender()  # HATA: dışarıdan verilmeli\n\n    def bildir(self, mesaj):\n        self.sender.gonder(mesaj)\n\nservis = NotificationService()\nservis.bildir('Sınav başladı!')","correctCode":"class EmailSender:\n    def gonder(self, mesaj):\n        print(f'Email: {mesaj}')\n\nclass NotificationService:\n    def __init__(self, sender):  # Dependency Injection\n        self.sender = sender\n\n    def bildir(self, mesaj):\n        self.sender.gonder(mesaj)\n\nservis = NotificationService(EmailSender())\nservis.bildir('Sınav başladı!')","codeLanguage":"python"}"""),
            now);
        db.Questions.Add(q4);
        db.TestCases.AddRange(
            TC(q4.Id, "", "Email: Sınav başladı!", true, 1, now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MYM 303 – DevOps ve CI/CD  (seymen, 40 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMYM303(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MYM 303 – DevOps ve CI/CD",
            "Docker, container teknolojileri, CI/CD pipeline'ları ve Infrastructure as Code konularını kapsayan sınav.",
            40, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – Docker (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Docker Image ve Container Farkı",
            "Docker'da **image** ve **container** arasındaki temel fark nedir?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"Image çalışan bir instance'tır; container şablondur"},{"id":"b","text":"Image salt okunur şablondur; container image'ın çalışan instance'ıdır"},{"id":"c","text":"Image ve container aynı şeydir"},{"id":"d","text":"Container kaynak kodunu, image ise çalıştırılabilir dosyayı içerir"}],"correctIds":["b"],"multiSelect":false}"""),
            now));

        // Q2 – CI Pipeline (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "CI Pipeline Aşamaları",
            "**Continuous Integration (CI)** pipeline'ında tipik olarak hangi adım **bulunmaz**?",
            10, 2,
            J("""{"choices":[{"id":"a","text":"Kod derleme (build)"},{"id":"b","text":"Otomatik testlerin çalıştırılması"},{"id":"c","text":"Production sunucusuna manuel deploy"},{"id":"d","text":"Statik kod analizi (linting)"}],"correctIds":["c"],"multiSelect":false}"""),
            now));

        // Q3 – IaC (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Infrastructure as Code (IaC)",
            "**Infrastructure as Code (IaC)** yaklaşımı ne anlama gelir?",
            10, 3,
            J("""{"acceptedAnswers":["altyapı kod olarak yönetilir","sunucu konfigürasyonu kod dosyalarıyla tanımlanır","altyapı kod ile otomatize edilir","infrastructure kod ile provision edilir"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q4 – Servis Durumları Çıktısı (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "Servis Durumları Çıktısı",
            "Aşağıdaki Python kodunu çalıştırdığınızda ne yazdırılır?",
            10, 4,
            J("""{"codeBlock":"servisler = [\n    ('api',      'running'),\n    ('worker',   'running'),\n    ('frontend', 'stopped'),\n    ('nginx',    'running'),\n]\nfor isim, durum in servisler:\n    print(f'{isim}: {durum}')","codeLanguage":"python","expectedOutput":"api: running\nworker: running\nfrontend: stopped\nnginx: running","matchMode":"trimmed"}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MYM 102 – Python ile Algoritma  (hatice, 50 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMYM102(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MYM 102 – Python ile Algoritma",
            "Python sözdizimi, temel algoritmalar ve veri yapıları kullanımını pratiğe döken sınav.",
            50, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – FizzBuzz (Coding)
        var q1 = Question(quiz.Id, QuestionType.Coding,
            "FizzBuzz",
            "Klasik FizzBuzz problemini çözün:\n- 3'e bölünebiliyorsa `Fizz`\n- 5'e bölünebiliyorsa `Buzz`\n- Her ikisine de bölünebiliyorsa `FizzBuzz`\n- Diğerleri için sayıyı yazdırın\n\n**Girdi:** Bir tam sayı `n`\n**Çıktı:** 1'den n'e kadar her sayı için sonuç (her biri ayrı satırda)",
            20, 1,
            J("""{"allowedLanguages":["python","javascript","cpp","java"],"starterCode":"n = int(input())\nfor i in range(1, n + 1):\n    # TODO: FizzBuzz mantığını yaz\n    pass"}"""),
            now);
        db.Questions.Add(q1);
        db.TestCases.AddRange(
            TC(q1.Id, "15", "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", true,  1, now),
            TC(q1.Id, "5",  "1\n2\nFizz\n4\nBuzz",                                                       true,  2, now),
            TC(q1.Id, "1",  "1",                                                                          false, 3, now));

        // Q2 – Liste Dilimleme Çıktısı (OutputPrediction)
        db.Questions.Add(Question(quiz.Id, QuestionType.OutputPrediction,
            "Python Liste Dilimleme (Slicing) Çıktısı",
            "Aşağıdaki Python kodunu çalıştırdığınızda ekranda ne görünür?",
            10, 2,
            J("""{"codeBlock":"lst = [10, 20, 30, 40, 50, 60, 70]\nprint(lst[2:5])\nprint(lst[::-1])\nprint(lst[::2])","codeLanguage":"python","expectedOutput":"[30, 40, 50]\n[70, 60, 50, 40, 30, 20, 10]\n[10, 30, 50, 70]","matchMode":"trimmed"}"""),
            now));

        // Q3 – Bubble Sort Hatası (BugFix)
        var q3 = Question(quiz.Id, QuestionType.BugFix,
            "Bubble Sort Sıralama Yönü Hatası",
            "Aşağıdaki bubble sort kodu yanlış yönde sıralıyor. **Küçükten büyüğe** (artan) sıralama yapacak şekilde düzeltin.\n\n**Girdi:** Satır 1: `n`, Satır 2: `n` adet tam sayı\n**Çıktı:** Sıralı liste",
            15, 3,
            J("""{"buggyCode":"def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] < arr[j + 1]:  # HATA: '>' olmalı\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n\nn = int(input())\narr = list(map(int, input().split()))\nprint(bubble_sort(arr))","correctCode":"def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n\nn = int(input())\narr = list(map(int, input().split()))\nprint(bubble_sort(arr))","codeLanguage":"python"}"""),
            now);
        db.Questions.Add(q3);
        db.TestCases.AddRange(
            TC(q3.Id, "5\n3 1 4 1 5",  "[1, 1, 3, 4, 5]", true,  1, now),
            TC(q3.Id, "4\n9 2 7 4",    "[2, 4, 7, 9]",    true,  2, now),
            TC(q3.Id, "3\n5 5 5",      "[5, 5, 5]",       false, 3, now));

        // Q4 – Python List vs Tuple (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "Python List ve Tuple Farkı",
            "Python'da **list** ve **tuple** arasındaki temel fark nedir?",
            10, 4,
            J("""{"choices":[{"id":"a","text":"List sıralıdır, tuple sırasızdır"},{"id":"b","text":"List değiştirilebilir (mutable), tuple değiştirilemez (immutable)"},{"id":"c","text":"Tuple daha yavaştır çünkü kopyalanır"},{"id":"d","text":"List sayısal veriler için, tuple metinsel veriler için kullanılır"}],"correctIds":["b"],"multiSelect":false}"""),
            now));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MYM 404 – API Tasarımı ve REST  (emir, 45 dk, Published)
    // ═════════════════════════════════════════════════════════════════════════
    static void AddMYM404(AppDbContext db, User owner, DateTime now)
    {
        var quiz = Quiz(owner.Id,
            "MYM 404 – API Tasarımı ve REST",
            "RESTful API prensipleri, HTTP metodları, API versiyonlama ve GraphQL karşılaştırması.",
            45, QuizStatus.Published, now);
        db.Quizzes.Add(quiz);

        // Q1 – HTTP Metodları (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "HTTP Metotlarının Semantiği – PUT vs PATCH",
            "**PUT** ve **PATCH** metodları arasındaki temel fark nedir?",
            10, 1,
            J("""{"choices":[{"id":"a","text":"PUT bir kaynağın tamamını değiştirir; PATCH kısmi güncelleme yapar"},{"id":"b","text":"PATCH bir kaynağın tamamını değiştirir; PUT kısmi güncelleme yapar"},{"id":"c","text":"PUT yeni kaynak oluşturur; PATCH mevcut kaynağı siler"},{"id":"d","text":"İkisi de aynı işlevi görür, sadece isim farkı vardır"}],"correctIds":["a"],"multiSelect":false}"""),
            now));

        // Q2 – Idempotent (ShortAnswer)
        db.Questions.Add(Question(quiz.Id, QuestionType.ShortAnswer,
            "Idempotent Operasyon Tanımı",
            "REST'te **idempotent** operasyon ne anlama gelir? Kısa yanıt verin.",
            10, 2,
            J("""{"acceptedAnswers":["aynı isteği n kez yapmak tek kez yapmakla aynı sonucu verir","aynı sonucu verir","çok kez yapılması tek kez yapılmasına eşdeğer","birden fazla aynı istek aynı sonuç"],"matchMode":"exactIgnoreCase"}"""),
            now));

        // Q3 – Two Sum (Coding)
        var q3 = Question(quiz.Id, QuestionType.Coding,
            "Two Sum – İki Sayının Toplamı",
            "Bir tam sayı dizisi ve hedef bir değer verildiğinde, toplamı hedefe eşit olan **iki sayının indekslerini** bulun ve küçükten büyüğe sıralı olarak yazdırın. Çözüm yoksa `-1` yazdırın.\n\n**Girdi:**\n- Satır 1: boşlukla ayrılmış tam sayılar\n- Satır 2: hedef değer\n\n**Örnek:**\n```\n2 7 11 15\n9\nÇıktı: 0 1\n```",
            20, 3,
            J("""{"allowedLanguages":["python","javascript"],"starterCode":"def two_sum(nums, target):\n    # TODO: toplamı target olan iki indeksi döndür\n    # Çözüm yoksa None döndür\n    pass\n\nnums = list(map(int, input().split()))\ntarget = int(input())\nresult = two_sum(nums, target)\nif result:\n    print(*sorted(result))\nelse:\n    print(-1)"}"""),
            now);
        db.Questions.Add(q3);
        db.TestCases.AddRange(
            TC(q3.Id, "2 7 11 15\n9",  "0 1", true,  1, now),
            TC(q3.Id, "3 2 4\n6",      "1 2", true,  2, now),
            TC(q3.Id, "1 2 3\n10",     "-1",  false, 3, now),
            TC(q3.Id, "5 1 8 3 6\n9",  "1 4", false, 4, now));

        // Q4 – REST vs GraphQL (MCQ)
        db.Questions.Add(Question(quiz.Id, QuestionType.MultipleChoice,
            "REST ve GraphQL Karşılaştırması",
            "**GraphQL**'in REST'e kıyasla **temel avantajı** nedir?",
            10, 4,
            J("""{"choices":[{"id":"a","text":"GraphQL her zaman daha hızlıdır"},{"id":"b","text":"İstemci tam olarak ihtiyaç duyduğu veriyi isteyebilir (over/under-fetching yok)"},{"id":"c","text":"GraphQL HTTP kullanmaz"},{"id":"d","text":"REST'ten farklı olarak kimlik doğrulama desteklemez"}],"correctIds":["b"],"multiSelect":false}"""),
            now));
    }
}
