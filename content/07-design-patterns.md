---
id: design-patterns
title: Design Patterns
icon: 🧩
order: 7
description: Nguyên lý SOLID, các GoF pattern (Creational, Structural, Behavioral), enterprise pattern và cách áp dụng trong .NET/TypeScript
---

# Nguyên lý thiết kế (SOLID, DRY, KISS, YAGNI)

## SOLID là gì và tại sao quan trọng? [junior]
**SOLID** là 5 nguyên lý thiết kế hướng đối tượng do Robert C. Martin (Uncle Bob) tổng hợp, giúp code **dễ bảo trì, dễ mở rộng, dễ test**:

| Chữ | Nguyên lý | Ý chính |
|---|---|---|
| **S** | Single Responsibility | Một class chỉ có **một lý do để thay đổi** |
| **O** | Open/Closed | Mở để mở rộng, đóng để sửa đổi |
| **L** | Liskov Substitution | Subclass thay thế được base class mà không phá hành vi |
| **I** | Interface Segregation | Không ép client phụ thuộc vào method nó không dùng |
| **D** | Dependency Inversion | Phụ thuộc vào abstraction, không phụ thuộc vào implementation |

**Tại sao quan trọng:**
- Giảm **coupling**, tăng **cohesion**.
- Thay đổi một chỗ ít ảnh hưởng chỗ khác (giảm regression).
- Dễ viết unit test nhờ có thể mock dependency.
- Là nền tảng của hầu hết design pattern (Strategy, Decorator, DI...).

**Lưu ý / bẫy thường gặp:** SOLID là *guideline*, không phải luật tuyệt đối. Áp dụng máy móc (mỗi method một interface, mỗi class một file 10 dòng) dẫn tới over-engineering. Hãy nói được "khi nào **không** cần áp dụng".

## Single Responsibility Principle (SRP) là gì? Cho ví dụ vi phạm và cách sửa. [junior]
**SRP**: một class chỉ nên có **một lý do để thay đổi** — tức là chịu trách nhiệm cho một actor/khía cạnh nghiệp vụ duy nhất.

### Vi phạm
```csharp
public class InvoiceService
{
    public decimal CalculateTotal(Invoice inv) => inv.Lines.Sum(l => l.Price * l.Qty);
    public void SaveToDb(Invoice inv) { /* ADO.NET code */ }
    public byte[] ExportPdf(Invoice inv) { /* PDF rendering */ }
    public void SendEmail(Invoice inv) { /* SMTP */ }
}
```
Class này thay đổi khi: logic tính tiền đổi, DB đổi, template PDF đổi, mail server đổi → 4 lý do.

### Sửa
```csharp
public class InvoiceCalculator { public decimal Total(Invoice inv) => ...; }
public class InvoiceRepository : IInvoiceRepository { public void Save(Invoice inv) { ... } }
public class InvoicePdfExporter : IInvoiceExporter { public byte[] Export(Invoice inv) { ... } }
public class InvoiceNotifier { public Task SendAsync(Invoice inv) { ... } }
```

**Lợi ích:** mỗi class nhỏ, dễ test riêng, đổi PDF library không đụng tới logic tính tiền.

**Lưu ý / bẫy thường gặp:** SRP không có nghĩa "một class một method". Tiêu chí là **lý do thay đổi** (cohesion), không phải số dòng code.

## Open/Closed Principle (OCP) là gì? [junior]
**OCP**: module nên **mở để mở rộng** (thêm hành vi mới) nhưng **đóng để sửa đổi** (không phải sửa code đã ổn định).

### Vi phạm — mỗi lần thêm loại giảm giá phải sửa switch
```csharp
public decimal GetDiscount(Customer c, decimal amount) => c.Type switch
{
    "Regular" => 0,
    "Vip"     => amount * 0.1m,
    "Gold"    => amount * 0.2m,   // thêm loại mới = sửa method này
    _ => 0
};
```

### Sửa — dùng polymorphism (Strategy)
```csharp
public interface IDiscountPolicy { bool AppliesTo(Customer c); decimal Calc(decimal amount); }

public class VipDiscount : IDiscountPolicy
{
    public bool AppliesTo(Customer c) => c.Type == "Vip";
    public decimal Calc(decimal amount) => amount * 0.1m;
}

public class DiscountService(IEnumerable<IDiscountPolicy> policies)
{
    public decimal GetDiscount(Customer c, decimal amount)
        => policies.FirstOrDefault(p => p.AppliesTo(c))?.Calc(amount) ?? 0;
}
```
Thêm `GoldDiscount` chỉ cần tạo class mới và đăng ký DI — không sửa `DiscountService`.

**Lưu ý / bẫy thường gặp:** không thể "đóng" với mọi thay đổi. Chỉ áp dụng OCP ở các **điểm biến đổi đã biết/hay thay đổi**; một switch 3 case ổn định không cần biến thành 3 class.

## Liskov Substitution Principle (LSP) là gì? Ví dụ Rectangle/Square. [mid]
**LSP**: object của subclass phải **thay thế được** object của base class mà không làm sai tính đúng đắn của chương trình. Subclass không được **tăng precondition**, **giảm postcondition**, hay phá **invariant** của base.

### Vi phạm kinh điển
```csharp
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    public int Area => Width * Height;
}
public class Square : Rectangle
{
    public override int Width  { set { base.Width = base.Height = value; } }
    public override int Height { set { base.Width = base.Height = value; } }
}

void Resize(Rectangle r) { r.Width = 5; r.Height = 4; Debug.Assert(r.Area == 20); } // Square -> 16, fail
```

### Sửa
Không cho `Square` kế thừa `Rectangle`; dùng abstraction chung, immutable:
```csharp
public interface IShape { int Area { get; } }
public record Rectangle(int Width, int Height) : IShape { public int Area => Width * Height; }
public record Square(int Side) : IShape { public int Area => Side * Side; }
```

**Dấu hiệu vi phạm LSP:** override ném `NotSupportedException`, kiểm tra `if (x is SubType)` ở client, override method để "không làm gì".

**Ví dụ thực tế:** `ReadOnlyCollection<T>` implement `IList<T>` nhưng `Add` ném exception → vi phạm LSP nhẹ trong chính BCL.

## Interface Segregation Principle (ISP) là gì? [junior]
**ISP**: client không nên bị ép phụ thuộc vào những method mà nó không dùng. Nên tách **fat interface** thành nhiều interface nhỏ, tập trung.

### Vi phạm
```csharp
public interface IWorker
{
    void Work();
    void Eat();
    void Sleep();
}
public class Robot : IWorker
{
    public void Work() { ... }
    public void Eat()   => throw new NotImplementedException(); // vô nghĩa
    public void Sleep() => throw new NotImplementedException();
}
```

### Sửa
```csharp
public interface IWorkable { void Work(); }
public interface IFeedable { void Eat(); }
public interface IRestable { void Sleep(); }

public class Human : IWorkable, IFeedable, IRestable { ... }
public class Robot : IWorkable { public void Work() { ... } }
```

**Lợi ích:** giảm coupling, mock dễ hơn khi test, thay đổi một interface ít ảnh hưởng.

**Ví dụ thực tế:** .NET tách `IEnumerable<T>` → `IReadOnlyCollection<T>` → `ICollection<T>` → `IList<T>`; method chỉ đọc nên nhận `IReadOnlyList<T>` thay vì `List<T>`.

**Lưu ý / bẫy thường gặp:** `NotImplementedException` trong implementation là dấu hiệu rõ ràng của vi phạm ISP (và thường cả LSP).

## Dependency Inversion Principle (DIP) là gì? Khác gì Dependency Injection? [mid]
**DIP** gồm 2 ý:
1. Module cấp cao không phụ thuộc module cấp thấp; cả hai phụ thuộc **abstraction**.
2. Abstraction không phụ thuộc chi tiết; chi tiết phụ thuộc abstraction.

### Vi phạm
```csharp
public class OrderService
{
    private readonly SqlOrderRepository _repo = new SqlOrderRepository(); // gắn chặt SQL
    private readonly SmtpEmailSender _mail = new SmtpEmailSender();
}
```

### Sửa
```csharp
public interface IOrderRepository { Task SaveAsync(Order o); }
public interface IEmailSender { Task SendAsync(string to, string body); }

public class OrderService(IOrderRepository repo, IEmailSender mail)
{
    public async Task PlaceAsync(Order o) { await repo.SaveAsync(o); await mail.SendAsync(o.Email, "OK"); }
}
```
Interface `IOrderRepository` thuộc về tầng **domain/application** (module cấp cao sở hữu abstraction) — đây là điểm "inversion".

| Khái niệm | Bản chất |
|---|---|
| **DIP** | Nguyên lý thiết kế (hướng phụ thuộc) |
| **IoC** | Nguyên lý rộng: framework điều khiển luồng/tạo object thay vì code của bạn |
| **DI** | Kỹ thuật cụ thể để hiện thực DIP/IoC: truyền dependency từ ngoài vào (constructor, property, method) |

**Lưu ý / bẫy thường gặp:** dùng DI container nhưng interface nằm ở project Infrastructure thì vẫn chưa thực sự "inversion".

## DRY, KISS, YAGNI là gì? Khi nào chúng mâu thuẫn nhau? [junior]
- **DRY (Don't Repeat Yourself):** mỗi *mảnh tri thức* (business rule) chỉ nên có một biểu diễn duy nhất. Không chỉ là code trùng, mà là **logic trùng**.
- **KISS (Keep It Simple, Stupid):** chọn giải pháp đơn giản nhất đáp ứng yêu cầu; dễ đọc hơn "thông minh".
- **YAGNI (You Aren't Gonna Need It):** không xây tính năng/abstraction cho nhu cầu *tưởng tượng* trong tương lai.

**Mâu thuẫn thường gặp:**
- DRY quá mức → tạo abstraction chung cho 2 đoạn code *trông giống nhau* nhưng thay đổi vì lý do khác nhau → **wrong abstraction**, đầy `if` flag. Câu nổi tiếng của Sandi Metz: *"duplication is far cheaper than the wrong abstraction"*.
- OCP/SOLID áp dụng sớm có thể vi phạm YAGNI và KISS.

**Quy tắc thực tế:**
- **Rule of Three:** lặp lần thứ 3 mới refactor thành abstraction.
- Chỉ DRY những thứ là cùng một business rule (ví dụ công thức tính thuế), không DRY những thứ chỉ trùng ngẫu nhiên.

**Lưu ý / bẫy thường gặp:** trong microservices, chia sẻ thư viện chung để "DRY" giữa các service có thể tạo coupling khi deploy — đôi khi chấp nhận duplicate là đúng.

## Composition over Inheritance nghĩa là gì? [mid]
Ưu tiên **ghép object** (has-a) thay vì **kế thừa** (is-a) để tái sử dụng hành vi.

**Vấn đề của inheritance:**
- Coupling chặt với base class (*fragile base class problem*): sửa base phá subclass.
- Hành vi cố định lúc compile-time, không đổi lúc runtime.
- Bùng nổ class khi kết hợp nhiều chiều: `FlyingSwimmingDuck`, `RubberFlyingDuck`...
- C# chỉ cho đơn kế thừa class.

```csharp
// Inheritance: bùng nổ class
class Duck { } class MallardDuck : Duck { } class RubberDuck : Duck { /* override Fly để không bay */ }

// Composition
public interface IFlyBehavior { void Fly(); }
public class NoFly : IFlyBehavior { public void Fly() { } }
public class WingFly : IFlyBehavior { public void Fly() => Console.WriteLine("Flap"); }

public class Duck(IFlyBehavior fly)
{
    public IFlyBehavior Fly { get; set; } = fly; // đổi được lúc runtime
    public void PerformFly() => Fly.Fly();
}
```

**Khi nào inheritance vẫn hợp lý:** quan hệ is-a thực sự, ổn định, và tuân thủ LSP (ví dụ `ControllerBase`, `Exception` hierarchy), hoặc Template Method.

**Pattern dựa trên composition:** Strategy, Decorator, Composite, Bridge, State.

# Creational Patterns

## Singleton là gì? Cách implement thread-safe trong C#? [junior]
**Singleton** đảm bảo một class chỉ có **một instance duy nhất** và cung cấp điểm truy cập toàn cục.

### Các cách implement
```csharp
// 1. Không thread-safe — 2 thread có thể cùng tạo instance
public class Bad { private static Bad? _i; public static Bad Instance => _i ??= new Bad(); }

// 2. Double-checked locking
public sealed class Dcl
{
    private static volatile Dcl? _instance;
    private static readonly object _lock = new();
    private Dcl() { }
    public static Dcl Instance
    {
        get
        {
            if (_instance is null)
                lock (_lock) { _instance ??= new Dcl(); }
            return _instance;
        }
    }
}

// 3. Lazy<T> — khuyến nghị: lazy + thread-safe mặc định
public sealed class Config
{
    private static readonly Lazy<Config> _lazy = new(() => new Config());
    public static Config Instance => _lazy.Value;
    private Config() { }
}

// 4. Static readonly field — CLR đảm bảo type initializer chạy đúng 1 lần
public sealed class Eager { public static readonly Eager Instance = new(); private Eager() { } }
```

**Điểm chính:** constructor `private`, class `sealed`, `Lazy<T>` mặc định dùng `LazyThreadSafetyMode.ExecutionAndPublication`.

**Lưu ý / bẫy thường gặp:** trong ASP.NET Core nên dùng `services.AddSingleton<T>()` thay vì tự viết static Singleton.

## Tại sao Singleton đôi khi bị coi là anti-pattern? [mid]
Singleton "cổ điển" (static `Instance`) gặp nhiều vấn đề:

- **Global state ẩn:** bất kỳ đâu cũng gọi `Logger.Instance` → dependency không hiện trên constructor, khó hiểu luồng.
- **Khó unit test:** không mock/thay thế được; state rò rỉ giữa các test.
- **Vi phạm SRP:** class vừa lo nghiệp vụ vừa lo quản lý vòng đời của chính nó.
- **Tight coupling:** client phụ thuộc class cụ thể, không phải abstraction (vi phạm DIP).
- **Vấn đề concurrency:** state mutable dùng chung giữa các thread cần lock.
- **Khó mở rộng** khi sau này cần nhiều instance (multi-tenant).

### Giải pháp: để DI container quản lý lifetime
```csharp
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();

public class ProductService(ICacheService cache) { ... } // dependency tường minh, mock được
```

| | Static Singleton | DI Singleton lifetime |
|---|---|---|
| Testability | Kém | Tốt (inject mock) |
| Dependency | Ẩn | Tường minh |
| Lifetime | Class tự quản | Container quản |

**Lưu ý / bẫy thường gặp:** *captive dependency* — Singleton inject một service Scoped (vd `DbContext`) sẽ giữ nó sống mãi → bug dữ liệu và lỗi thread-safety. ASP.NET Core bật `ValidateScopes` ở Development để bắt lỗi này.

## Factory Method pattern là gì? [mid]
**Factory Method** định nghĩa một interface để tạo object, nhưng để **subclass quyết định** class cụ thể nào được khởi tạo. Nó tách việc *sử dụng* object khỏi việc *tạo* object.

```csharp
public interface INotification { void Send(string msg); }
public class EmailNotification : INotification { public void Send(string m) => Console.WriteLine($"Email: {m}"); }
public class SmsNotification : INotification { public void Send(string m) => Console.WriteLine($"SMS: {m}"); }

public abstract class NotificationCreator
{
    protected abstract INotification CreateNotification(); // factory method

    public void Notify(string msg)          // logic dùng chung
    {
        var n = CreateNotification();
        n.Send(msg);
    }
}
public class EmailCreator : NotificationCreator { protected override INotification CreateNotification() => new EmailNotification(); }
public class SmsCreator : NotificationCreator { protected override INotification CreateNotification() => new SmsNotification(); }
```

**Biến thể phổ biến trong thực tế — Simple Factory / factory delegate:**
```csharp
public class NotificationFactory(IServiceProvider sp)
{
    public INotification Create(string channel) => channel switch
    {
        "email" => sp.GetRequiredService<EmailNotification>(),
        "sms"   => sp.GetRequiredService<SmsNotification>(),
        _ => throw new ArgumentOutOfRangeException(nameof(channel))
    };
}
```

**Ví dụ trong .NET:** `IHttpClientFactory.CreateClient()`, `ILoggerFactory.CreateLogger()`, `DbProviderFactory.CreateConnection()`.

**Lưu ý / bẫy thường gặp:** "Simple Factory" (một method static có switch) không phải GoF pattern chính thức, nhưng rất hay được hỏi lẫn với Factory Method.

## Abstract Factory pattern là gì? [mid]
**Abstract Factory** cung cấp interface để tạo **một họ (family) các object liên quan** mà không chỉ định class cụ thể. Đảm bảo các sản phẩm tạo ra **tương thích với nhau**.

```csharp
public interface IButton { void Render(); }
public interface ICheckbox { void Render(); }

public interface IUiFactory
{
    IButton CreateButton();
    ICheckbox CreateCheckbox();
}

public class DarkThemeFactory : IUiFactory
{
    public IButton CreateButton() => new DarkButton();
    public ICheckbox CreateCheckbox() => new DarkCheckbox();
}
public class LightThemeFactory : IUiFactory
{
    public IButton CreateButton() => new LightButton();
    public ICheckbox CreateCheckbox() => new LightCheckbox();
}

public class SettingsPage(IUiFactory ui)
{
    public void Render() { ui.CreateButton().Render(); ui.CreateCheckbox().Render(); }
}
```
Đổi theme chỉ cần đổi factory được inject — không bao giờ có chuyện `DarkButton` đi cùng `LightCheckbox`.

**Ví dụ thực tế:** `DbProviderFactory` (tạo `DbConnection`, `DbCommand`, `DbParameter` cùng một provider: SqlClient/Npgsql), cross-platform UI toolkit.

**Nhược điểm:** thêm một loại sản phẩm mới (vd `ITextBox`) phải sửa interface và **tất cả** factory.

## Builder pattern là gì? Khi nào dùng? [junior]
**Builder** tách quá trình **xây dựng object phức tạp** khỏi biểu diễn của nó, cho phép tạo object theo từng bước, thường với **fluent API**.

**Khi nào dùng:**
- Constructor có quá nhiều tham số (*telescoping constructor*), nhiều tham số optional.
- Cần validate tổng thể trước khi tạo object.
- Muốn object tạo ra là **immutable**.

```csharp
public sealed class Email
{
    public string To { get; }
    public string Subject { get; }
    public string Body { get; }
    public IReadOnlyList<string> Cc { get; }
    internal Email(string to, string subject, string body, List<string> cc)
        => (To, Subject, Body, Cc) = (to, subject, body, cc);
}

public class EmailBuilder
{
    private string? _to, _subject; private string _body = ""; private readonly List<string> _cc = [];
    public EmailBuilder To(string to) { _to = to; return this; }
    public EmailBuilder Subject(string s) { _subject = s; return this; }
    public EmailBuilder Body(string b) { _body = b; return this; }
    public EmailBuilder Cc(string cc) { _cc.Add(cc); return this; }
    public Email Build()
    {
        if (string.IsNullOrWhiteSpace(_to)) throw new InvalidOperationException("To is required");
        return new Email(_to, _subject ?? "(no subject)", _body, _cc);
    }
}

var mail = new EmailBuilder().To("a@b.com").Subject("Hi").Cc("c@d.com").Build();
```

**Ví dụ trong .NET:** `WebApplication.CreateBuilder()`, `StringBuilder`, `UriBuilder`, `IHostBuilder`, EF Core `ModelBuilder`, test data builder trong unit test.

**Lưu ý / bẫy thường gặp:** với C# hiện đại, object đơn giản có thể dùng `record` + `init` + `required` thay cho Builder.

## Prototype pattern là gì? Shallow copy vs deep copy? [mid]
**Prototype** tạo object mới bằng cách **clone một object có sẵn** (prototype) thay vì khởi tạo từ đầu. Hữu ích khi việc tạo object tốn kém (load config, query DB) hoặc khi cần nhiều biến thể từ một mẫu.

```csharp
public class Document : ICloneable
{
    public string Title { get; set; } = "";
    public List<string> Tags { get; set; } = [];

    public Document ShallowCopy() => (Document)MemberwiseClone();

    public Document DeepCopy()
    {
        var copy = (Document)MemberwiseClone();
        copy.Tags = new List<string>(Tags);   // copy cả reference type bên trong
        return copy;
    }
    object ICloneable.Clone() => DeepCopy();
}
```

| | Shallow copy | Deep copy |
|---|---|---|
| Value type field | Copy giá trị | Copy giá trị |
| Reference type field | Copy **reference** (dùng chung object) | Tạo object mới |
| Rủi ro | Sửa `copy.Tags` ảnh hưởng bản gốc | An toàn nhưng tốn hơn |

**C# hiện đại:** `record` có sẵn `with` expression — là shallow clone:
```csharp
var p2 = p1 with { Name = "New" };
```

**Lưu ý / bẫy thường gặp:** `ICloneable` không chỉ rõ shallow hay deep nên Microsoft khuyên không dùng trong public API; nên tự định nghĩa method `DeepCopy()` rõ nghĩa.

# Structural Patterns

## Adapter pattern là gì? [junior]
**Adapter** chuyển đổi interface của một class thành interface khác mà client mong đợi, giúp các class **không tương thích** làm việc cùng nhau. Giống ổ chuyển đổi phích cắm.

```csharp
// Interface hệ thống của bạn
public interface IPaymentGateway { Task<bool> PayAsync(decimal amount, string currency); }

// SDK bên thứ 3 — không sửa được
public class StripeClient { public Task<StripeResult> CreateCharge(long amountInCents, string cur) => ...; }

// Adapter
public class StripeAdapter(StripeClient stripe) : IPaymentGateway
{
    public async Task<bool> PayAsync(decimal amount, string currency)
    {
        var result = await stripe.CreateCharge((long)(amount * 100), currency.ToLower());
        return result.Status == "succeeded";
    }
}
```

**Khi nào dùng:**
- Tích hợp thư viện bên thứ 3 / legacy code mà không muốn rò rỉ API của nó vào domain.
- Anti-Corruption Layer trong DDD.
- Dễ thay vendor (Stripe → PayPal) chỉ bằng adapter mới.

**Ví dụ trong .NET:** `StreamReader` (adapt `Stream` byte → text), `DbDataAdapter`, `TextReader`.

**Lưu ý / bẫy thường gặp:** Adapter **đổi interface** nhưng không thêm hành vi mới — khác với Decorator (giữ nguyên interface, thêm hành vi).

## Decorator pattern là gì? Áp dụng trong .NET thế nào? [mid]
**Decorator** gắn thêm hành vi cho object **một cách động** bằng cách bọc nó trong object khác **cùng interface**. Là giải pháp thay thế linh hoạt cho subclassing, tuân thủ OCP.

```csharp
public interface IProductRepository { Task<Product?> GetAsync(int id); }

public class SqlProductRepository : IProductRepository { public Task<Product?> GetAsync(int id) => ...; }

public class CachedProductRepository(IProductRepository inner, IMemoryCache cache) : IProductRepository
{
    public Task<Product?> GetAsync(int id) =>
        cache.GetOrCreateAsync($"product:{id}", _ => inner.GetAsync(id));
}

public class LoggingProductRepository(IProductRepository inner, ILogger<LoggingProductRepository> log) : IProductRepository
{
    public async Task<Product?> GetAsync(int id)
    {
        log.LogInformation("Get product {Id}", id);
        return await inner.GetAsync(id);
    }
}
```
Có thể xếp chồng: `Logging(Cached(Sql))`.

**Đăng ký với DI (dùng thư viện Scrutor):**
```csharp
services.AddScoped<IProductRepository, SqlProductRepository>();
services.Decorate<IProductRepository, CachedProductRepository>();
services.Decorate<IProductRepository, LoggingProductRepository>();
```

**Ví dụ trong .NET:** `BufferedStream`, `GZipStream`, `CryptoStream` bọc `Stream`; `DelegatingHandler` của `HttpClient`; MediatR pipeline behaviors.

**Lưu ý / bẫy thường gặp:** thứ tự decorator quan trọng (log trước hay sau cache cho kết quả khác nhau). Interface quá lớn khiến mỗi decorator phải forward rất nhiều method.

## Facade pattern là gì? [junior]
**Facade** cung cấp một **interface đơn giản, thống nhất** cho một subsystem phức tạp gồm nhiều class. Client chỉ làm việc với facade thay vì phải biết và điều phối hàng loạt object.

```csharp
public class CheckoutFacade(
    IInventoryService inventory,
    IPaymentService payment,
    IShippingService shipping,
    INotificationService notify)
{
    public async Task<OrderResult> PlaceOrderAsync(Cart cart, PaymentInfo pay)
    {
        await inventory.ReserveAsync(cart.Items);
        var tx = await payment.ChargeAsync(pay, cart.Total);
        var shipment = await shipping.CreateAsync(cart);
        await notify.OrderConfirmedAsync(cart.CustomerId, shipment.TrackingNo);
        return new OrderResult(tx.Id, shipment.TrackingNo);
    }
}
```
Controller chỉ gọi `checkout.PlaceOrderAsync(...)`.

**Lợi ích:**
- Giảm coupling giữa client và subsystem.
- Che giấu độ phức tạp, dễ dùng đúng.
- Subsystem vẫn có thể được dùng trực tiếp khi cần (facade không cấm).

**Ví dụ thực tế:** `File.ReadAllText()` che `FileStream` + `StreamReader` + encoding; `WebApplication` trong minimal API; Application Service trong Clean Architecture thường đóng vai facade.

**Lưu ý / bẫy thường gặp:** facade dễ phình thành **God object** nếu dồn mọi thứ vào — nên chia theo use case.

## Proxy pattern là gì? Các loại proxy? [mid]
**Proxy** cung cấp một object đại diện **cùng interface** với object thật để **kiểm soát truy cập** tới nó.

**Các loại proxy phổ biến:**
| Loại | Mục đích | Ví dụ |
|---|---|---|
| **Virtual proxy** | Lazy-load object tốn kém | EF Core lazy loading proxy cho navigation property |
| **Protection proxy** | Kiểm tra quyền trước khi gọi | Authorization wrapper |
| **Remote proxy** | Đại diện object ở process/máy khác | gRPC client stub, WCF proxy |
| **Caching proxy** | Cache kết quả | Caching layer |
| **Smart reference** | Đếm reference, logging, lock | — |

```csharp
public interface IReportService { Report Generate(int id); }

public class ReportServiceProxy(IReportService real, ICurrentUser user) : IReportService
{
    public Report Generate(int id)
    {
        if (!user.IsInRole("Manager")) throw new UnauthorizedAccessException();
        return real.Generate(id);
    }
}
```

**Dynamic proxy:** Castle DynamicProxy (dùng bởi Moq, NSubstitute), `DispatchProxy` trong .NET — tạo proxy lúc runtime để làm AOP (logging, transaction).

**Lưu ý / bẫy thường gặp:** về cấu trúc Proxy và Decorator gần như giống nhau; khác ở **ý định** — Proxy kiểm soát truy cập/vòng đời object thật (thường tự quản lý nó), Decorator thêm hành vi và được client xếp chồng.

## Composite pattern là gì? [mid]
**Composite** tổ chức object thành **cấu trúc cây** (part-whole hierarchy) và cho phép client xử lý **object đơn lẻ (leaf)** và **nhóm object (composite)** theo cùng một cách.

```csharp
public interface IMenuItem
{
    string Name { get; }
    decimal Price { get; }
}

public record Dish(string Name, decimal Price) : IMenuItem;

public class Combo(string name) : IMenuItem
{
    private readonly List<IMenuItem> _items = [];
    public string Name => name;
    public decimal Price => _items.Sum(i => i.Price) * 0.9m; // giảm 10%
    public Combo Add(IMenuItem item) { _items.Add(item); return this; }
}

var combo = new Combo("Family")
    .Add(new Dish("Pizza", 200))
    .Add(new Combo("Drinks").Add(new Dish("Coke", 20)).Add(new Dish("Tea", 15)));
Console.WriteLine(combo.Price); // client không cần biết là leaf hay composite
```

**Ứng dụng thực tế:**
- Cây thư mục/file, menu đa cấp, sơ đồ tổ chức (rất hay gặp trong HRM: phòng ban chứa phòng ban con và nhân viên).
- UI tree (WinForms `Control.Controls`, Angular component tree, DOM).
- Rule engine: `AndSpecification` chứa nhiều specification con.
- Expression tree.

**Lưu ý / bẫy thường gặp:** cân nhắc đặt `Add/Remove` ở interface chung (transparent nhưng leaf phải ném exception) hay chỉ ở composite (an toàn hơn về type).

## Bridge pattern là gì? Khác Adapter thế nào? [senior]
**Bridge** tách **abstraction** khỏi **implementation** để hai bên **phát triển độc lập**. Giải quyết bùng nổ class khi có hai chiều biến đổi (M x N subclass → M + N class).

```csharp
// Implementation hierarchy
public interface IMessageSender { void Send(string to, string content); }
public class EmailSender : IMessageSender { public void Send(string to, string c) { ... } }
public class SmsSender : IMessageSender { public void Send(string to, string c) { ... } }

// Abstraction hierarchy
public abstract class Notification(IMessageSender sender)
{
    protected IMessageSender Sender { get; } = sender;   // "cây cầu"
    public abstract void Notify(string to);
}
public class PasswordResetNotification(IMessageSender s) : Notification(s)
{
    public override void Notify(string to) => Sender.Send(to, "Reset your password...");
}
public class InvoiceNotification(IMessageSender s) : Notification(s)
{
    public override void Notify(string to) => Sender.Send(to, "Your invoice...");
}
```
Không cần `EmailPasswordReset`, `SmsPasswordReset`, `EmailInvoice`, `SmsInvoice`...

| | Bridge | Adapter |
|---|---|---|
| Thời điểm | Thiết kế **từ đầu** | Áp dụng **sau**, khi đã có code không tương thích |
| Mục đích | Cho 2 hierarchy phát triển độc lập | Làm 2 interface có sẵn khớp nhau |

**Ví dụ thực tế:** ADO.NET (`DbConnection` abstraction + provider), `ILogger` abstraction + logging providers, JDBC driver.

## Flyweight pattern là gì? [senior]
**Flyweight** giảm tiêu thụ bộ nhớ bằng cách **chia sẻ** phần trạng thái chung giữa rất nhiều object nhỏ.

- **Intrinsic state:** phần dùng chung, bất biến, lưu trong flyweight (font, texture, tên loại).
- **Extrinsic state:** phần riêng từng ngữ cảnh, client truyền vào khi dùng (vị trí x, y).

```csharp
public sealed class TreeType(string name, string color, byte[] texture) // intrinsic, immutable
{
    public void Draw(int x, int y) { /* render texture tại x,y */ }
}

public class TreeTypeFactory
{
    private readonly Dictionary<string, TreeType> _cache = new();
    public TreeType Get(string name, string color, Func<byte[]> loadTexture)
    {
        var key = $"{name}:{color}";
        if (!_cache.TryGetValue(key, out var t))
            _cache[key] = t = new TreeType(name, color, loadTexture());
        return t;
    }
}

public record Tree(int X, int Y, TreeType Type); // 1 triệu cây nhưng chỉ vài TreeType
```

**Ví dụ trong .NET:**
- **String interning** (`string.Intern`, literal string được intern tự động).
- Cache các boxed value nhỏ, `Task.CompletedTask`, `Array.Empty<T>()`.
- `ArrayPool<T>` / object pooling (gần với ý tưởng tái sử dụng).

**Lưu ý / bẫy thường gặp:** flyweight bắt buộc **immutable** (vì dùng chung); chỉ đáng dùng khi số lượng object thực sự lớn và đã đo được vấn đề bộ nhớ.

# Behavioral Patterns

## Strategy pattern là gì? [junior]
**Strategy** định nghĩa một **họ thuật toán**, đóng gói từng thuật toán vào class riêng và cho phép **hoán đổi chúng lúc runtime**. Client phụ thuộc vào interface strategy, không vào implementation.

```csharp
public interface IShippingStrategy { decimal Calculate(Order o); }

public class StandardShipping : IShippingStrategy { public decimal Calculate(Order o) => 30_000; }
public class ExpressShipping : IShippingStrategy { public decimal Calculate(Order o) => 50_000 + o.Weight * 5_000; }
public class FreeShipping : IShippingStrategy { public decimal Calculate(Order o) => 0; }

public class ShippingCalculator
{
    private readonly Dictionary<string, IShippingStrategy> _strategies;
    public ShippingCalculator(IEnumerable<IShippingStrategy> all)
        => _strategies = all.ToDictionary(s => s.GetType().Name.Replace("Shipping", ""));

    public decimal Calc(Order o, string method) => _strategies[method].Calculate(o);
}
```

**Ở dạng nhẹ** có thể dùng delegate: `Func<Order, decimal>`.

**Lợi ích:** loại bỏ `if/switch` lớn, tuân thủ OCP, mỗi thuật toán test riêng.

**Ví dụ trong .NET:** `IComparer<T>` truyền vào `List.Sort`, `IEqualityComparer<T>` cho `Dictionary`, authentication schemes, `IPasswordHasher`, retry policy của Polly.

**.NET 8+:** keyed services giúp chọn strategy theo key:
```csharp
services.AddKeyedScoped<IShippingStrategy, ExpressShipping>("express");
public class X([FromKeyedServices("express")] IShippingStrategy s) { }
```

## Observer pattern là gì? Áp dụng trong C# như thế nào? [junior]
**Observer** định nghĩa quan hệ **one-to-many**: khi **subject** thay đổi trạng thái, tất cả **observer** đã đăng ký được thông báo tự động. Giúp subject và observer **loosely coupled**.

### C# events (cách idiomatic)
```csharp
public class Stock
{
    public event EventHandler<decimal>? PriceChanged;
    private decimal _price;
    public decimal Price
    {
        get => _price;
        set { if (_price != value) { _price = value; PriceChanged?.Invoke(this, value); } }
    }
}

var vcb = new Stock();
vcb.PriceChanged += (s, p) => Console.WriteLine($"New price: {p}");
```

### Các hình thức khác
- `IObservable<T>` / `IObserver<T>` (nền tảng của Rx.NET).
- `INotifyPropertyChanged` trong WPF/MAUI data binding.
- Domain Events + MediatR `INotification` (in-process pub/sub).
- Message broker (RabbitMQ, Kafka) — Pub/Sub phân tán.

**Observer vs Pub/Sub:** Observer — subject biết danh sách observer, gọi trực tiếp, thường đồng bộ. Pub/Sub — có **broker** trung gian, publisher và subscriber không biết nhau.

**Lưu ý / bẫy thường gặp:**
- **Memory leak**: subscriber không `-=` unsubscribe khỏi event của object sống lâu → không được GC.
- Exception trong một handler có thể chặn các handler sau.
- Thứ tự notify không được đảm bảo theo nghiệp vụ.

## Command pattern là gì? [mid]
**Command** đóng gói một **request thành object**, chứa đủ thông tin để thực thi sau. Nhờ vậy có thể: xếp hàng (queue), log, **undo/redo**, retry, truyền qua mạng.

**Thành phần:** `Command` (interface `Execute`), `ConcreteCommand`, `Receiver` (object thực sự làm việc), `Invoker` (gọi command).

```csharp
public interface ICommand { void Execute(); void Undo(); }

public class AddTextCommand(TextEditor editor, string text) : ICommand
{
    public void Execute() => editor.Append(text);
    public void Undo() => editor.RemoveLast(text.Length);
}

public class CommandManager
{
    private readonly Stack<ICommand> _history = new();
    public void Run(ICommand cmd) { cmd.Execute(); _history.Push(cmd); }
    public void Undo() { if (_history.TryPop(out var c)) c.Undo(); }
}
```

**Ứng dụng thực tế:**
- **CQRS + MediatR**: `CreateOrderCommand : IRequest<Guid>` + handler — command là object dữ liệu, handler là receiver.
- `ICommand` trong WPF/MVVM (bind button tới command).
- Background job queue (Hangfire lưu job dạng serialized command).
- Transaction/macro, undo trong editor.

**Lưu ý / bẫy thường gặp:** trong CQRS, "command" thường chỉ là DTO (không có `Execute`) và logic nằm ở handler — vẫn là tinh thần Command pattern nhưng tách data và behavior.

## Template Method pattern là gì? [mid]
**Template Method** định nghĩa **khung (skeleton) của thuật toán** trong method của base class, để **subclass override một số bước** mà không thay đổi cấu trúc tổng thể. Dựa trên **inheritance**.

```csharp
public abstract class DataImporter
{
    // Template method: không virtual để giữ nguyên thứ tự
    public void Import(string path)
    {
        var raw = Read(path);
        var rows = Parse(raw);
        Validate(rows);
        Save(rows);
        OnCompleted(rows.Count);   // hook
    }

    protected virtual string Read(string path) => File.ReadAllText(path);
    protected abstract List<Row> Parse(string raw);       // bắt buộc override
    protected virtual void Validate(List<Row> rows) { }   // optional
    protected abstract void Save(List<Row> rows);
    protected virtual void OnCompleted(int count) { }     // hook
}

public class CsvEmployeeImporter : DataImporter
{
    protected override List<Row> Parse(string raw) => /* split CSV */;
    protected override void Save(List<Row> rows) { /* bulk insert */ }
}
```

**Nguyên tắc Hollywood:** "Don't call us, we'll call you" — base class gọi xuống subclass.

**Ví dụ trong .NET:** `BackgroundService.ExecuteAsync`, `Stream` (base có `CopyTo` dựa trên `Read`), `ControllerBase`, xUnit/NUnit lifecycle, `DbContext.OnModelCreating`.

**Lưu ý / bẫy thường gặp:** coupling chặt với base class; nếu chỉ cần đổi một bước, Strategy (composition) thường linh hoạt hơn.

## Chain of Responsibility là gì? Ví dụ trong ASP.NET Core? [mid]
**Chain of Responsibility** truyền request qua **chuỗi handler**; mỗi handler quyết định **xử lý** request hoặc **chuyển tiếp** cho handler tiếp theo (hoặc cả hai). Sender không cần biết ai sẽ xử lý.

### ASP.NET Core middleware chính là CoR
```csharp
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();
    await next(context);                  // chuyển cho middleware tiếp theo
    Console.WriteLine($"{context.Request.Path} took {sw.ElapsedMilliseconds}ms");
});

app.Use(async (context, next) =>
{
    if (!context.Request.Headers.ContainsKey("X-Api-Key"))
    {
        context.Response.StatusCode = 401; // short-circuit: không gọi next
        return;
    }
    await next(context);
});
```

### Cài đặt cổ điển
```csharp
public abstract class ApprovalHandler
{
    private ApprovalHandler? _next;
    public ApprovalHandler SetNext(ApprovalHandler next) { _next = next; return next; }
    public virtual string Handle(LeaveRequest r) => _next?.Handle(r) ?? "Rejected";
}
public class TeamLead : ApprovalHandler
{
    public override string Handle(LeaveRequest r) => r.Days <= 2 ? "Approved by TL" : base.Handle(r);
}
public class Manager : ApprovalHandler
{
    public override string Handle(LeaveRequest r) => r.Days <= 5 ? "Approved by Manager" : base.Handle(r);
}
```

**Ví dụ khác:** `DelegatingHandler` của HttpClient, MediatR pipeline behaviors, exception filter, quy trình phê duyệt nhiều cấp.

**Lưu ý / bẫy thường gặp:** thứ tự middleware rất quan trọng (`UseAuthentication` trước `UseAuthorization`); request có thể "rơi" qua hết chuỗi mà không ai xử lý.

## State pattern là gì? [mid]
**State** cho phép object **thay đổi hành vi khi trạng thái nội tại thay đổi** — trông như object đổi class. Mỗi trạng thái là một class, và các class state tự quyết định **chuyển sang state nào**.

```csharp
public interface IOrderState
{
    void Pay(Order o);
    void Ship(Order o);
    void Cancel(Order o);
}

public class PendingState : IOrderState
{
    public void Pay(Order o) => o.SetState(new PaidState());
    public void Ship(Order o) => throw new InvalidOperationException("Chưa thanh toán");
    public void Cancel(Order o) => o.SetState(new CancelledState());
}

public class PaidState : IOrderState
{
    public void Pay(Order o) => throw new InvalidOperationException("Đã thanh toán");
    public void Ship(Order o) => o.SetState(new ShippedState());
    public void Cancel(Order o) { /* hoàn tiền */ o.SetState(new CancelledState()); }
}

public class Order
{
    private IOrderState _state = new PendingState();
    internal void SetState(IOrderState s) => _state = s;
    public void Pay() => _state.Pay(this);
    public void Ship() => _state.Ship(this);
    public void Cancel() => _state.Cancel(this);
}
```

**Khi nào dùng:** object có nhiều trạng thái với hành vi khác hẳn nhau, và code đầy `switch (status)` lặp lại ở nhiều method — ví dụ quy trình duyệt đơn nghỉ phép, đơn hàng, workflow.

**Lưu ý / bẫy thường gặp:** với state machine đơn giản, một bảng transition hoặc thư viện như **Stateless** dễ đọc và bảo trì hơn nhiều class.

## Mediator pattern là gì? MediatR có phải Mediator pattern không? [mid]
**Mediator** định nghĩa một object trung gian **đóng gói cách các object tương tác** với nhau. Thay vì các component gọi trực tiếp nhau (quan hệ N-N), tất cả giao tiếp qua mediator (quan hệ N-1) → giảm coupling.

```csharp
public interface IChatMediator { void Send(string msg, User from); void Join(User u); }

public class ChatRoom : IChatMediator
{
    private readonly List<User> _users = [];
    public void Join(User u) => _users.Add(u);
    public void Send(string msg, User from)
    {
        foreach (var u in _users.Where(x => x != from)) u.Receive(msg, from.Name);
    }
}
public class User(string name, IChatMediator room)
{
    public string Name => name;
    public void Say(string msg) => room.Send(msg, this);
    public void Receive(string msg, string from) => Console.WriteLine($"{Name} <- {from}: {msg}");
}
```

**Về MediatR:** thư viện này chủ yếu là **in-process request/response dispatcher** (kết hợp Command + Mediator): controller gửi `IRequest` qua `IMediator.Send` mà không biết handler nào xử lý. Nó giảm coupling controller ↔ service, hỗ trợ pipeline behavior (CoR). Tuy nhiên nó không phải "mediator điều phối nhiều colleague" theo đúng nghĩa GoF.

**Ví dụ khác:** chat room, air traffic control, form UI phức tạp (thay đổi dropdown A ảnh hưởng B, C), Angular service dùng chung giữa các component.

**Lưu ý / bẫy thường gặp:** Mediator có thể thành **God object**. Lạm dụng MediatR cho mọi thứ làm khó trace code ("go to definition" không đến được handler).

## Iterator pattern là gì? Liên hệ IEnumerable và yield? [junior]
**Iterator** cung cấp cách **duyệt tuần tự** các phần tử của một collection **mà không lộ cấu trúc bên trong** (array, list, tree, hay dữ liệu stream).

Trong .NET, Iterator được tích hợp sẵn vào ngôn ngữ:
- `IEnumerable<T>` = aggregate (có `GetEnumerator()`).
- `IEnumerator<T>` = iterator (`MoveNext()`, `Current`, `Reset()`).
- `foreach` là cú pháp gọi iterator.
- `yield return` để compiler tự sinh state machine iterator.

```csharp
public class Department
{
    public string Name { get; init; } = "";
    public List<Department> Children { get; } = [];

    // Duyệt cây theo chiều sâu mà client không cần biết cấu trúc
    public IEnumerable<Department> Flatten()
    {
        yield return this;
        foreach (var child in Children)
            foreach (var d in child.Flatten())
                yield return d;
    }
}

foreach (var d in root.Flatten()) Console.WriteLine(d.Name);
```

**Đặc điểm `yield`:** **lazy / deferred execution** — phần tử chỉ được tính khi được yêu cầu, phù hợp với dữ liệu lớn hoặc vô hạn. Async version: `IAsyncEnumerable<T>` + `await foreach`.

**Lưu ý / bẫy thường gặp:** enumerate nhiều lần một `IEnumerable` lazy (đặc biệt là `IQueryable` của EF) sẽ chạy lại logic/query nhiều lần — dùng `.ToList()` khi cần materialize.

## Visitor pattern là gì? Khi nào dùng? [senior]
**Visitor** cho phép **thêm thao tác mới** lên một cấu trúc object (thường là cây) **mà không sửa các class phần tử**. Thao tác được tách ra class Visitor; mỗi phần tử có method `Accept(visitor)` gọi lại đúng overload → kỹ thuật **double dispatch**.

```csharp
public interface IShapeVisitor<T> { T Visit(Circle c); T Visit(Rectangle r); }

public abstract class Shape { public abstract T Accept<T>(IShapeVisitor<T> v); }
public class Circle(double r) : Shape
{
    public double R => r;
    public override T Accept<T>(IShapeVisitor<T> v) => v.Visit(this);
}
public class Rectangle(double w, double h) : Shape
{
    public double W => w; public double H => h;
    public override T Accept<T>(IShapeVisitor<T> v) => v.Visit(this);
}

public class AreaVisitor : IShapeVisitor<double>
{
    public double Visit(Circle c) => Math.PI * c.R * c.R;
    public double Visit(Rectangle r) => r.W * r.H;
}
public class SvgExportVisitor : IShapeVisitor<string> { /* thao tác mới, không sửa Shape */ }
```

**Trade-off:**
| Dễ | Khó |
|---|---|
| Thêm **thao tác** mới (thêm visitor) | Thêm **loại phần tử** mới (phải sửa mọi visitor) |

**Khi nào dùng:** cấu trúc phần tử ổn định, thao tác hay thay đổi — compiler/AST, xử lý document.

**Ví dụ trong .NET:** `ExpressionVisitor` (EF Core/LINQ provider dịch expression tree sang SQL), Roslyn `CSharpSyntaxVisitor`.

**Lưu ý:** C# hiện đại có **pattern matching** (`switch` trên type) có thể thay Visitor trong nhiều trường hợp đơn giản.

## Memento pattern là gì? [mid]
**Memento** cho phép **chụp và khôi phục trạng thái** trước đó của object **mà không vi phạm encapsulation** (không lộ field private ra ngoài).

**Thành phần:**
- **Originator:** object có state cần lưu; tạo memento và khôi phục từ memento.
- **Memento:** snapshot bất biến của state.
- **Caretaker:** giữ danh sách memento (lịch sử), không đọc/sửa nội dung.

```csharp
public class Editor
{
    private string _content = "";
    private int _cursor;

    public void Type(string text) { _content += text; _cursor = _content.Length; }

    public EditorMemento Save() => new(_content, _cursor);
    public void Restore(EditorMemento m) { _content = m.Content; _cursor = m.Cursor; }

    public sealed record EditorMemento(string Content, int Cursor); // immutable snapshot
}

public class History
{
    private readonly Stack<Editor.EditorMemento> _stack = new();
    public void Push(Editor.EditorMemento m) => _stack.Push(m);
    public Editor.EditorMemento? Pop() => _stack.TryPop(out var m) ? m : null;
}
```

**Ứng dụng:** undo/redo, checkpoint trong game, rollback form về giá trị ban đầu, snapshot trong Event Sourcing.

**Memento vs Command cho undo:**
- Memento: lưu **toàn bộ state** → đơn giản nhưng tốn bộ nhớ.
- Command: lưu **thao tác ngược** → tiết kiệm nhưng phải viết `Undo` cho từng command.

**Lưu ý / bẫy thường gặp:** snapshot object lớn liên tục gây tốn RAM; cần giới hạn lịch sử hoặc lưu diff.

# Enterprise & Architectural Patterns

## Repository pattern là gì? Có nên dùng Repository với EF Core không? [mid]
**Repository** là lớp trung gian giữa domain và data mapping, cung cấp interface **giống một collection trong bộ nhớ** để truy xuất aggregate, che giấu chi tiết persistence.

```csharp
public interface IEmployeeRepository
{
    Task<Employee?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Employee>> GetByDepartmentAsync(Guid deptId, CancellationToken ct = default);
    void Add(Employee e);
    void Remove(Employee e);
}

public class EmployeeRepository(AppDbContext db) : IEmployeeRepository
{
    public Task<Employee?> GetByIdAsync(Guid id, CancellationToken ct) =>
        db.Employees.Include(e => e.Contracts).FirstOrDefaultAsync(e => e.Id == id, ct);
    public void Add(Employee e) => db.Employees.Add(e);
    ...
}
```

**Tranh luận với EF Core:** `DbSet<T>` vốn đã là Repository, `DbContext` đã là Unit of Work.

| Nên dùng Repository khi | Không cần khi |
|---|---|
| DDD, muốn domain không phụ thuộc EF | App CRUD đơn giản |
| Đóng gói query phức tạp, tái sử dụng | Generic repository chỉ bọc lại `DbSet` |
| Có thể đổi data source / nhiều nguồn | Cần linh hoạt projection, `IQueryable` |

**Lưu ý / bẫy thường gặp:**
- **Generic Repository** `IRepository<T>` với `GetAll()` trả `IQueryable` → *leaky abstraction*, không mang lại giá trị.
- Repository nên theo **aggregate root**, không phải mỗi table một repository.
- Unit test bằng mock repository không bắt được lỗi LINQ-to-SQL; nên kết hợp integration test (Testcontainers/SQLite).

## Unit of Work pattern là gì? [mid]
**Unit of Work** theo dõi các thay đổi trên object trong một **business transaction** và **ghi tất cả xuống DB trong một lần commit** (atomic): hoặc tất cả thành công, hoặc rollback.

```csharp
public interface IUnitOfWork
{
    IEmployeeRepository Employees { get; }
    IContractRepository Contracts { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public class TransferEmployeeHandler(IUnitOfWork uow)
{
    public async Task Handle(Guid empId, Guid newDeptId)
    {
        var emp = await uow.Employees.GetByIdAsync(empId) ?? throw new NotFoundException();
        emp.TransferTo(newDeptId);
        uow.Contracts.Add(Contract.CreateAppendix(emp));
        await uow.SaveChangesAsync(); // một transaction duy nhất
    }
}
```

**Trong EF Core:** `DbContext` chính là Unit of Work — Change Tracker theo dõi entity thêm/sửa/xoá, `SaveChanges()` sinh các lệnh SQL trong **một transaction**.

**Điểm chính:**
- Các repository trong cùng UoW phải **dùng chung một DbContext** (DI Scoped đảm bảo điều này trong một request).
- Khi cần transaction trải nhiều `SaveChanges`, dùng `db.Database.BeginTransactionAsync()` hoặc `TransactionScope`.
- Không áp dụng được qua nhiều service/DB khác nhau → cần **Saga** hoặc **Outbox pattern**.

**Lưu ý / bẫy thường gặp:** gọi `SaveChanges()` bên trong từng repository method sẽ phá vỡ ý nghĩa Unit of Work.

## Specification pattern là gì? [senior]
**Specification** đóng gói một **business rule / điều kiện lọc** thành object có thể **tái sử dụng, kết hợp** (And/Or/Not) và test độc lập. Thường dùng với Repository để tránh bùng nổ method `GetActiveEmployeesByDeptAndSalary...`.

```csharp
public abstract class Specification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();
    public bool IsSatisfiedBy(T entity) => ToExpression().Compile()(entity);

    public Specification<T> And(Specification<T> other) => new AndSpecification<T>(this, other);
}

public class ActiveEmployeeSpec : Specification<Employee>
{
    public override Expression<Func<Employee, bool>> ToExpression() => e => e.Status == Status.Active;
}
public class InDepartmentSpec(Guid deptId) : Specification<Employee>
{
    public override Expression<Func<Employee, bool>> ToExpression() => e => e.DepartmentId == deptId;
}

// Repository
public Task<List<Employee>> FindAsync(Specification<Employee> spec) =>
    db.Employees.Where(spec.ToExpression()).ToListAsync();

var list = await repo.FindAsync(new ActiveEmployeeSpec().And(new InDepartmentSpec(itId)));
```

**Lợi ích:**
- Business rule một chỗ, dùng cho cả **query DB** (Expression dịch sang SQL) và **validate in-memory**.
- Repository gọn, không có hàng chục method query.

**Lưu ý / bẫy thường gặp:** kết hợp `Expression` cần `ParameterExpression` chung (dùng `ExpressionVisitor` hoặc LINQKit) nếu không EF sẽ không dịch được. Thư viện phổ biến: **Ardalis.Specification** (hỗ trợ cả Include, OrderBy, paging).

## Dependency Injection và IoC Container là gì? Các service lifetime trong .NET? [junior]
**Dependency Injection** là kỹ thuật cung cấp dependency cho object **từ bên ngoài** thay vì object tự `new`. **IoC Container** (`IServiceProvider` trong .NET) tự động tạo object và resolve cả cây dependency.

**Các kiểu injection:** constructor (khuyến nghị), property, method (`[FromServices]` trong action).

```csharp
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();

public class EmployeeService(IEmployeeRepository repo, IClock clock) { ... }
```

| Lifetime | Tạo instance | Dùng cho |
|---|---|---|
| **Singleton** | 1 lần cho cả app | Cache, config, stateless thread-safe service |
| **Scoped** | 1 lần mỗi scope (mỗi HTTP request) | `DbContext`, Unit of Work, current user |
| **Transient** | Mỗi lần resolve | Service nhẹ, stateless |

**Lợi ích:** loose coupling, dễ test (inject mock), cấu hình tập trung, quản lý lifetime và `Dispose` tự động.

**Lưu ý / bẫy thường gặp:**
- **Captive dependency:** Singleton phụ thuộc Scoped/Transient → Scoped bị "giữ" suốt đời app.
- Resolve Scoped service trong `BackgroundService` (Singleton) phải tạo scope: `IServiceScopeFactory.CreateScope()`.
- Constructor quá nhiều tham số (>5-6) là dấu hiệu class vi phạm SRP.

## Tại sao Service Locator được coi là anti-pattern? [senior]
**Service Locator** là một registry toàn cục mà class tự gọi để lấy dependency: `ServiceLocator.Get<IFoo>()` hoặc inject `IServiceProvider` rồi gọi `GetService<T>()` khắp nơi.

```csharp
// Service Locator
public class OrderService(IServiceProvider sp)
{
    public void Place(Order o)
    {
        var repo = sp.GetRequiredService<IOrderRepository>();   // dependency ẩn
        var mail = sp.GetRequiredService<IEmailSender>();
        ...
    }
}

// DI tường minh
public class OrderService(IOrderRepository repo, IEmailSender mail) { ... }
```

**Vấn đề:**
- **Dependency ẩn:** nhìn constructor không biết class cần gì; phải đọc toàn bộ code.
- **Lỗi runtime thay vì lúc khởi tạo:** thiếu đăng ký chỉ phát hiện khi chạy tới dòng đó.
- **Khó test:** phải setup cả container hoặc mock `IServiceProvider`.
- Class phụ thuộc vào **container** (infrastructure) — vi phạm DIP.

**Khi nào chấp nhận được:**
- **Composition root** / code hạ tầng: middleware factory, `IServiceScopeFactory` trong `BackgroundService`, factory chọn implementation theo runtime key.
- Framework code (ví dụ `HttpContext.RequestServices` trong filter).

**Lưu ý / bẫy thường gặp:** inject `IServiceProvider` vào business service gần như luôn là code smell — dùng factory hoặc keyed services thay thế.

## Null Object pattern là gì? [mid]
**Null Object** thay thế `null` bằng một object **cùng interface nhưng hành vi "không làm gì" / mặc định an toàn**, giúp loại bỏ các kiểm tra `if (x != null)` rải rác.

```csharp
public interface IDiscount { decimal Apply(decimal price); }

public class PercentDiscount(decimal pct) : IDiscount
{
    public decimal Apply(decimal price) => price * (1 - pct);
}

public sealed class NoDiscount : IDiscount
{
    public static readonly NoDiscount Instance = new();
    private NoDiscount() { }
    public decimal Apply(decimal price) => price;   // không làm gì
}

public IDiscount GetDiscount(string? code) =>
    code is null ? NoDiscount.Instance : new PercentDiscount(0.1m);

var final = GetDiscount(code).Apply(price);   // không cần check null
```

**Ví dụ trong .NET:**
- `NullLogger<T>.Instance`, `NullLoggerFactory` — dùng khi test hoặc không cần log.
- `Stream.Null`, `TextWriter.Null`.
- `Array.Empty<T>()`, `Enumerable.Empty<T>()` — trả collection rỗng thay vì `null`.
- `CancellationToken.None`.

**Lưu ý / bẫy thường gặp:** đừng dùng Null Object để **che giấu lỗi** thực sự (ví dụ không tìm thấy user khi bắt buộc phải có). Khi "không có" là tình huống cần xử lý khác, hãy dùng nullable reference types hoặc Result/Option type.

## Options pattern trong .NET là gì? IOptions, IOptionsSnapshot, IOptionsMonitor khác nhau thế nào? [mid]
**Options pattern** bind một section cấu hình (`appsettings.json`, env vars...) vào **class strongly-typed** và inject qua DI, thay vì đọc `IConfiguration["Smtp:Host"]` rải rác. Tuân thủ ISP (mỗi class chỉ nhận config mình cần) và SoC.

```csharp
public class SmtpOptions
{
    public const string Section = "Smtp";
    [Required] public string Host { get; set; } = "";
    [Range(1, 65535)] public int Port { get; set; } = 587;
}

builder.Services.AddOptions<SmtpOptions>()
    .BindConfiguration(SmtpOptions.Section)
    .ValidateDataAnnotations()
    .ValidateOnStart();          // fail fast khi khởi động

public class EmailSender(IOptions<SmtpOptions> opt) { private readonly SmtpOptions _o = opt.Value; }
```

| Interface | Lifetime | Reload khi config đổi | Named options |
|---|---|---|---|
| `IOptions<T>` | Singleton | Không | Không |
| `IOptionsSnapshot<T>` | Scoped | Có (mỗi request) | Có |
| `IOptionsMonitor<T>` | Singleton | Có, realtime + `OnChange` | Có |

**Lưu ý / bẫy thường gặp:** không inject `IOptionsSnapshot` vào Singleton service (lỗi captive dependency) — dùng `IOptionsMonitor` thay thế. Không nên đặt secret trong `appsettings.json`; dùng User Secrets / Key Vault.

# Phân biệt các pattern dễ nhầm

## Phân biệt Decorator, Proxy và Adapter? [mid]
Cả ba đều là **wrapper** bọc một object khác, nhưng khác nhau về **interface** và **ý định**:

| | Adapter | Decorator | Proxy |
|---|---|---|---|
| Interface | **Khác** với object được bọc (chuyển đổi) | **Giống** object được bọc | **Giống** object được bọc |
| Mục đích | Làm cho tương thích | **Thêm hành vi** | **Kiểm soát truy cập** |
| Xếp chồng | Hiếm | Thường xếp chồng nhiều lớp | Thường 1 lớp |
| Ai tạo object thật | Client truyền vào | Client truyền vào | Proxy thường tự quản lý (lazy, remote) |
| Ví dụ | `StripeAdapter : IPaymentGateway` | `CachedRepository`, `GZipStream` | EF lazy-loading proxy, gRPC stub, auth proxy |

**Cách nhớ nhanh:**
- **Adapter** — "nói ngôn ngữ khác" → dịch.
- **Decorator** — "làm thêm việc" → trang trí.
- **Proxy** — "người gác cổng/đại diện" → quyết định có cho gọi object thật hay không, gọi khi nào.

**Thêm Facade để so sánh:** Facade cũng bọc, nhưng bọc **cả một subsystem nhiều class** và cung cấp interface **mới, đơn giản hơn**.

**Lưu ý / bẫy thường gặp:** code của Decorator và Proxy có thể giống hệt nhau; khi phỏng vấn hãy nhấn mạnh vào **intent** — đó là cách GoF phân biệt pattern.

## Strategy và State khác nhau thế nào? [mid]
Về cấu trúc UML, Strategy và State **gần như giống hệt**: context giữ reference tới một interface và ủy quyền công việc cho implementation. Khác biệt nằm ở **ý định và ai điều khiển việc chuyển đổi**.

| | Strategy | State |
|---|---|---|
| Mục đích | Chọn **thuật toán** để làm một việc | Thay đổi **hành vi theo trạng thái** của object |
| Ai chọn/đổi | **Client** chọn từ bên ngoài | **Chính các state** tự chuyển sang state khác |
| Các implementation biết nhau? | Không, độc lập | Có, state biết state kế tiếp |
| Tần suất đổi | Thường chọn một lần | Thay đổi liên tục trong vòng đời |
| Ví dụ | Thuật toán sort, cách tính phí ship, nén zip/gzip | Đơn hàng Pending → Paid → Shipped; TCP connection |

```csharp
// Strategy: client quyết định
var calc = new ShippingCalculator(new ExpressShipping());

// State: object tự chuyển
order.Pay();   // PendingState bên trong gọi order.SetState(new PaidState())
```

**Cách nói khi phỏng vấn:** "Strategy trả lời câu hỏi *làm việc này bằng cách nào*, State trả lời *object đang ở trạng thái nào nên phản ứng ra sao*."

## Factory Method và Abstract Factory khác nhau thế nào? [mid]
| | Factory Method | Abstract Factory |
|---|---|---|
| Tạo | **Một** loại sản phẩm | **Một họ** sản phẩm liên quan |
| Cơ chế | **Inheritance**: subclass override method tạo | **Composition**: client nhận một object factory |
| Số method | 1 factory method | Nhiều method (`CreateButton`, `CreateCheckbox`...) |
| Mục tiêu | Hoãn quyết định class cụ thể cho subclass | Đảm bảo các sản phẩm **tương thích** với nhau |
| Ví dụ | `ILoggerFactory.CreateLogger()` | `DbProviderFactory` (Connection + Command + Parameter cùng provider) |

```csharp
// Factory Method
abstract class Dialog { protected abstract IButton CreateButton(); }

// Abstract Factory
interface IUiFactory { IButton CreateButton(); ICheckbox CreateCheckbox(); ITextBox CreateTextBox(); }
```

**Quan hệ giữa hai pattern:** mỗi method trong Abstract Factory thường được hiện thực như một Factory Method. Thiết kế thường **tiến hoá**: Simple Factory → Factory Method → Abstract Factory khi số loại sản phẩm tăng.

**Thêm Simple Factory:** một class/method static với `switch` trả về object theo tham số — không phải GoF pattern nhưng phổ biến nhất trong thực tế.

**Lưu ý / bẫy thường gặp:** trong ứng dụng có DI container, rất nhiều nhu cầu "factory" được giải quyết bằng chính container (`Func<T>`, keyed services, `ActivatorUtilities.CreateInstance`).

## Template Method và Strategy khác nhau thế nào? [mid]
Cả hai đều cho phép **thay đổi một phần thuật toán**, nhưng dùng cơ chế khác nhau:

| | Template Method | Strategy |
|---|---|---|
| Cơ chế | **Inheritance** | **Composition** |
| Mức độ | Thay đổi **một vài bước** trong khung cố định | Thay **toàn bộ thuật toán** |
| Thời điểm quyết định | Compile-time (chọn subclass) | Runtime (inject/đổi strategy) |
| Coupling | Chặt với base class | Lỏng, qua interface |
| Kết hợp nhiều biến thể | Khó (bùng nổ subclass) | Dễ (ghép nhiều strategy) |

```csharp
// Template Method: subclass override bước Parse
class CsvImporter : DataImporter { protected override List<Row> Parse(string raw) => ...; }

// Strategy: inject parser
class DataImporter(IParser parser, IWriter writer)
{
    public void Import(string path) => writer.Save(parser.Parse(File.ReadAllText(path)));
}
```

**Khi nào chọn cái nào:**
- Template Method: các bước có thứ tự cố định, nhiều code dùng chung trong base, framework muốn kiểm soát flow (`BackgroundService`).
- Strategy: cần đổi lúc runtime, test riêng từng phần, ghép nhiều chiều biến đổi (parser x writer).

**Lưu ý:** theo nguyên tắc composition over inheritance, Strategy thường được ưu tiên trong code ứng dụng hiện đại có DI.

# Pattern trong thực tế (.NET, framework)

## Kể tên các design pattern có sẵn trong ASP.NET Core và .NET? [mid]
| Pattern | Nơi xuất hiện |
|---|---|
| **Chain of Responsibility** | Middleware pipeline, `DelegatingHandler` của HttpClient, MediatR behaviors, filters |
| **Builder** | `WebApplication.CreateBuilder()`, `IHostBuilder`, `StringBuilder`, EF `ModelBuilder`, `UriBuilder` |
| **Factory** | `IHttpClientFactory`, `ILoggerFactory`, `IDbContextFactory<T>`, `DbProviderFactory` |
| **Singleton** | Service lifetime `AddSingleton` |
| **Strategy** | `IComparer<T>`, authentication handlers, `IPasswordHasher`, Polly policies |
| **Decorator** | `Stream` wrappers (`BufferedStream`, `GZipStream`, `CryptoStream`) |
| **Observer** | C# `event`, `IObservable<T>`, `IChangeToken`, `IOptionsMonitor.OnChange` |
| **Iterator** | `IEnumerable<T>`, `yield return`, `IAsyncEnumerable<T>` |
| **Proxy** | EF Core lazy-loading proxies, `DispatchProxy`, gRPC client |
| **Unit of Work / Repository** | `DbContext` / `DbSet<T>` |
| **Template Method** | `BackgroundService.ExecuteAsync`, `DbContext.OnModelCreating` |
| **Options** | `IOptions<T>` |
| **Null Object** | `NullLogger`, `Stream.Null`, `CancellationToken.None` |
| **Visitor** | `ExpressionVisitor`, Roslyn syntax visitors |
| **Adapter** | `StreamReader`, logging providers adapt Serilog/NLog vào `ILogger` |
| **Flyweight** | String interning, `ArrayPool<T>` |
| **Command** | MediatR `IRequest`, WPF `ICommand` |
| **MVC** | ASP.NET Core MVC |

**Mẹo phỏng vấn:** khi được hỏi "bạn dùng pattern nào trong dự án", hãy chọn 2-3 ví dụ có thật, nêu **vấn đề**, **pattern**, và **kết quả** (ví dụ "Decorator để thêm cache cho repository mà không sửa code cũ").

## Khi nào KHÔNG nên dùng design pattern? Làm sao tránh over-engineering? [senior]
Design pattern là **giải pháp cho vấn đề lặp lại**, không phải mục tiêu. Dùng pattern khi chưa có vấn đề tạo ra độ phức tạp không cần thiết.

**Dấu hiệu over-engineering:**
- Interface chỉ có đúng **một** implementation và không có lý do test/thay thế (đôi khi vẫn chấp nhận vì test).
- `AbstractFactoryFactoryProvider`, nhiều tầng chỉ forward lời gọi.
- Generic Repository bọc EF Core mà không thêm giá trị.
- Strategy cho một `if` hai nhánh không bao giờ thay đổi.
- Người mới cần đọc 8 file để hiểu một tính năng CRUD.

**Nguyên tắc chọn pattern:**
1. Bắt đầu đơn giản (**KISS, YAGNI**), viết code chạy đúng trước.
2. **Refactor tới pattern** khi xuất hiện "mùi": switch lặp lại → Strategy/State; constructor quá nhiều tham số → Builder; thêm hành vi cắt ngang → Decorator.
3. Hỏi: pattern này giảm chi phí thay đổi **thực tế** nào? Ai sẽ đọc code này?
4. Ưu tiên tính năng có sẵn của ngôn ngữ/framework: delegate/lambda thay Strategy nhỏ, `record with` thay Prototype, DI container thay Factory/Singleton, `event` thay Observer tự viết.

**Cách nói khi phỏng vấn (senior):** "Tôi coi pattern là vốn từ vựng chung trong team. Tôi không bắt đầu bằng pattern, mà bắt đầu bằng vấn đề, và chấp nhận một chút duplication cho đến khi rõ điểm biến đổi."

## Thiết kế hệ thống tính lương (payroll) với nhiều loại phụ cấp, khấu trừ hay thay đổi theo chính sách. Bạn dùng những pattern nào? [senior]
Đây là câu hỏi tình huống — nên trình bày theo **vấn đề → pattern**:

| Vấn đề | Pattern |
|---|---|
| Nhiều loại thành phần lương (phụ cấp, OT, thuế TNCN, BHXH) hay thay đổi | **Strategy** — mỗi thành phần là một `ISalaryComponent` |
| Thêm thành phần mới không sửa engine | **OCP** + đăng ký DI `IEnumerable<ISalaryComponent>` |
| Thứ tự tính có phụ thuộc (gross → BH → thuế → net) | **Chain of Responsibility / Pipeline** |
| Điều kiện áp dụng phức tạp (phòng ban, cấp bậc, thâm niên) | **Specification** |
| Nhóm phụ cấp lồng nhau | **Composite** |
| Chính sách theo quốc gia/công ty con | **Abstract Factory** tạo bộ rule tương thích |
| Audit, cache kết quả | **Decorator** |
| Quy trình duyệt bảng lương Draft → Submitted → Approved → Paid | **State** |
| Thông báo khi lương được duyệt | **Observer / Domain Events** |

```csharp
public interface ISalaryComponent
{
    int Order { get; }
    bool AppliesTo(PayrollContext ctx);
    void Apply(PayrollContext ctx);       // ghi vào ctx.Lines
}

public class PayrollEngine(IEnumerable<ISalaryComponent> components)
{
    public Payslip Calculate(Employee e, Period p)
    {
        var ctx = new PayrollContext(e, p);
        foreach (var c in components.OrderBy(x => x.Order).Where(x => x.AppliesTo(ctx)))
            c.Apply(ctx);
        return ctx.ToPayslip();
    }
}
```

**Điểm cộng khi trả lời:** nhắc tới việc lưu **version của công thức** theo kỳ lương, rule cấu hình được trong DB (rule engine) khi business muốn tự thay đổi, và test từng component độc lập.
