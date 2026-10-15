---
topic: design-patterns
---

## Pattern nào cho phép thêm hành vi cho object tại runtime mà không sửa class gốc, bằng cách bọc object? [junior]
- [ ] Adapter
- [x] Decorator
- [ ] Facade
- [ ] Singleton
> Decorator bọc object cùng interface để thêm hành vi; Adapter đổi interface chứ không thêm hành vi.

## Class sau vi phạm nguyên lý nào rõ ràng nhất? [junior]
```csharp
class PayrollService {
    public decimal CalculateSalary(Employee e) { /* ... */ }
    public void SaveToDatabase(Employee e) { /* SQL ... */ }
    public void SendPayslipEmail(Employee e) { /* SMTP ... */ }
}
```
- [ ] Liskov Substitution Principle
- [ ] Interface Segregation Principle
- [x] Single Responsibility Principle
- [ ] Dependency Inversion Principle
> Class gánh ba lý do thay đổi (nghiệp vụ tính lương, persistence, gửi email) nên vi phạm SRP. Nó cũng phụ thuộc cụ thể vào SQL/SMTP, nhưng vấn đề nổi bật nhất là trộn nhiều trách nhiệm.

## Cách implement Singleton thread-safe, lazy và gọn nhất trong C# hiện đại là gì? [junior]
- [ ] Kiểm tra `if (_instance == null) _instance = new X();` trong property `Instance`
- [ ] Đánh dấu constructor là `public static`
- [ ] Dùng `[ThreadStatic]` cho field `_instance`
- [x] Dùng `private static readonly Lazy<X> _lazy = new(() => new X());`
> `Lazy<T>` mặc định dùng `LazyThreadSafetyMode.ExecutionAndPublication` nên vừa lazy vừa thread-safe. Kiểm tra null đơn thuần không an toàn khi nhiều thread vào cùng lúc; `[ThreadStatic]` tạo mỗi thread một instance.

## Bạn cần tạo object `HttpRequest` có hàng chục tham số tùy chọn, muốn code gọi dạng `.WithHeader(...).WithTimeout(...).Build()`. Pattern phù hợp nhất? [junior]
- [x] Builder
- [ ] Prototype
- [ ] Abstract Factory
- [ ] Composite
> Builder tách quá trình xây dựng từng bước cho object phức tạp, tránh constructor "telescoping". Prototype là clone từ object có sẵn, không giải quyết vấn đề nhiều tham số.

## Hệ thống mới dùng interface `IPaymentGateway`, nhưng thư viện cũ của đối tác chỉ có class `LegacyPayClient.SendXml(string)`. Bạn viết class implement `IPaymentGateway` và gọi `LegacyPayClient` bên trong. Đó là pattern gì? [junior]
- [ ] Proxy
- [ ] Bridge
- [x] Adapter
- [ ] Decorator
> Adapter chuyển interface có sẵn sang interface mà client mong đợi. Proxy và Decorator giữ nguyên interface của object được bọc.

## Pattern nào cung cấp một interface đơn giản, thống nhất cho một tập hợp subsystem phức tạp (ví dụ một `OrderFacade.PlaceOrder()` gọi kho, thanh toán, vận chuyển)? [junior]
- [ ] Mediator
- [x] Facade
- [ ] Composite
- [ ] Flyweight
> Facade che giấu độ phức tạp của nhiều subsystem sau một API đơn giản. Mediator điều phối giao tiếp hai chiều giữa các colleague, không chỉ đơn giản hóa API cho client.

## Ứng dụng cho phép người dùng chọn cách tính phí ship (theo cân nặng, theo khoảng cách, đồng giá) và đổi tại runtime. Pattern phù hợp nhất? [junior]
- [ ] Template Method
- [ ] Singleton
- [ ] Observer
- [x] Strategy
> Strategy đóng gói từng thuật toán vào class riêng cùng interface, client chọn/đổi khi runtime. Template Method cố định khung thuật toán qua kế thừa, không đổi linh hoạt khi runtime.

## `event EventHandler<OrderPlacedEventArgs> OrderPlaced;` trong C# là hiện thực idiomatic của pattern nào? [junior]
- [x] Observer
- [ ] Command
- [ ] Mediator
- [ ] Chain of Responsibility
> Event/delegate cho phép nhiều subscriber đăng ký và được thông báo khi publisher phát sự kiện, đúng bản chất Observer.

## Từ khóa `yield return` trong một method trả về `IEnumerable<T>` giúp hiện thực pattern nào một cách tự động? [junior]
- [ ] Memento
- [ ] Visitor
- [x] Iterator
- [ ] Prototype
> Compiler sinh ra state machine implement `IEnumerator<T>`, cho phép duyệt tuần tự mà không lộ cấu trúc bên trong, chính là Iterator.

## Đoạn code sau vi phạm nguyên lý SOLID nào? [junior]
```csharp
interface IWorker { void Work(); void Eat(); }
class Robot : IWorker {
    public void Work() { /* ... */ }
    public void Eat() => throw new NotImplementedException();
}
```
- [ ] Single Responsibility Principle
- [x] Interface Segregation Principle
- [ ] Open/Closed Principle
- [ ] Dependency Inversion Principle
> Interface "béo" buộc `Robot` implement method không cần, vi phạm ISP; nên tách `IWorkable` và `IEatable`. Việc throw cũng có mùi LSP, nhưng nguyên nhân gốc là interface gộp quá nhiều.

## Trong ASP.NET Core, service đăng ký bằng `AddScoped` có vòng đời như thế nào? [junior]
- [ ] Mỗi lần resolve tạo một instance mới
- [ ] Một instance duy nhất cho toàn ứng dụng
- [ ] Một instance cho mỗi thread
- [x] Một instance cho mỗi scope, thường là mỗi HTTP request
> Scoped sống trong một scope (mỗi request một scope). Transient là mỗi lần resolve một instance mới; Singleton là một instance cho cả app.

## Cây menu gồm `MenuItem` và `SubMenu` (chứa nhiều `MenuItem` hoặc `SubMenu` khác), client gọi `Render()` như nhau cho cả lá lẫn nhánh. Đó là pattern gì? [junior]
- [ ] Decorator
- [ ] Chain of Responsibility
- [ ] Flyweight
- [x] Composite
> Composite tổ chức object thành cấu trúc cây part-whole và cho phép xử lý lá và nhóm đồng nhất qua cùng interface.

## Đoạn code sau vi phạm nguyên lý SOLID nào? [mid]
```csharp
class Bird { public virtual void Fly() {} }
class Penguin : Bird { public override void Fly() => throw new NotSupportedException(); }
```
- [ ] Interface Segregation Principle
- [ ] Single Responsibility Principle
- [x] Liskov Substitution Principle
- [ ] Open/Closed Principle
> Code dùng `Bird` sẽ hỏng khi nhận `Penguin`, tức subtype không thay thế được base type, vi phạm LSP. Cách sửa là tách hành vi bay ra abstraction riêng như `IFlyable`.

## Trong ASP.NET Core, một service Singleton nhận một service Scoped qua constructor. Điều gì xảy ra? [mid]
- [x] Đây là captive dependency: service Scoped bị giữ sống như Singleton; ở môi trường Development (scope validation bật) container ném `InvalidOperationException` khi resolve
- [ ] Container tự động tạo mới service Scoped cho mỗi request bên trong Singleton
- [ ] Container tự hạ cấp Singleton thành Scoped
- [ ] Không có vấn đề gì vì Scoped và Singleton đều được dispose khi app tắt
> Singleton chỉ được tạo một lần nên dependency Scoped bên trong cũng bị "bắt giữ" suốt đời app (ví dụ `DbContext` dùng chung giữa các request). Cách đúng là inject `IServiceScopeFactory` và tạo scope khi cần.

## Điểm khác biệt cốt lõi giữa Factory Method và Abstract Factory là gì? [mid]
- [ ] Factory Method chỉ dùng static method, Abstract Factory dùng instance method
- [x] Factory Method để subclass quyết định tạo một loại product; Abstract Factory là object tạo cả một họ product liên quan, bảo đảm chúng tương thích với nhau
- [ ] Abstract Factory không dùng interface, Factory Method bắt buộc dùng interface
- [ ] Factory Method thuộc nhóm structural, Abstract Factory thuộc nhóm creational
> Factory Method dựa vào kế thừa để override một method tạo object; Abstract Factory dựa vào composition, client nhận một factory tạo ra cả họ (ví dụ `WinButton` + `WinCheckbox`). Cả hai đều là creational.

## Class sau là pattern gì? [mid]
```csharp
class LazyImage : IImage {
    private RealImage? _real;
    private readonly string _path;
    public LazyImage(string path) => _path = path;
    public void Display() {
        _real ??= new RealImage(_path); // chỉ load file khi thật sự cần
        _real.Display();
    }
}
```
- [ ] Decorator
- [ ] Adapter
- [ ] Flyweight
- [x] Virtual Proxy
> Proxy cùng interface với subject, kiểm soát truy cập vào nó, ở đây trì hoãn khởi tạo object tốn kém (virtual proxy). Khác Decorator ở mục đích: không thêm hành vi mới, và tự quản lý vòng đời subject thay vì nhận từ bên ngoài.

## Đơn hàng có các trạng thái Draft → Paid → Shipped. Mỗi trạng thái là một class, tự quyết định trạng thái tiếp theo và gán lại cho `Order`. Đó là pattern gì? [mid]
- [x] State
- [ ] Strategy
- [ ] Command
- [ ] Memento
> Trong State, các state biết nhau và tự chuyển trạng thái của context, nên hành vi object thay đổi theo trạng thái nội tại. Strategy thường do client chọn và các strategy không biết nhau.

## Pipeline middleware của ASP.NET Core (`app.Use(async (ctx, next) => { ...; await next(); })`) là ví dụ điển hình của pattern nào? [mid]
- [ ] Observer
- [ ] Mediator
- [x] Chain of Responsibility
- [ ] Iterator
> Mỗi middleware xử lý request rồi quyết định chuyển tiếp cho middleware kế tiếp (`next`) hay short-circuit, đúng mô hình Chain of Responsibility.

## Base class có method `public void Export()` gọi lần lượt `ReadData()`, `Format()`, `Write()`; các subclass chỉ override `Format()`. Đó là pattern gì? [mid]
- [ ] Strategy
- [ ] Builder
- [ ] Bridge
- [x] Template Method
> Template Method định nghĩa khung thuật toán ở base class và để subclass override một số bước. Strategy thay cả thuật toán qua composition, không qua kế thừa.

## Yêu cầu: hỗ trợ Undo/Redo cho các thao tác trong editor và có thể xếp hàng đợi thao tác. Pattern nào là nền tảng phù hợp nhất? [mid]
- [ ] Observer
- [x] Command
- [ ] Facade
- [ ] Flyweight
> Command đóng gói mỗi thao tác thành object có `Execute()`/`Undo()`, dễ lưu vào stack undo/redo hoặc queue. Memento có thể hỗ trợ lưu trạng thái, nhưng không mô hình hóa thao tác.

## Trong EF Core, phát biểu nào đúng về Unit of Work và Repository? [mid]
- [ ] EF Core không có khái niệm Unit of Work, phải tự viết
- [ ] `DbSet<T>` là Unit of Work, `DbContext` là Repository
- [x] `DbContext` đóng vai trò Unit of Work (theo dõi thay đổi, `SaveChanges` commit một lần) và `DbSet<T>` gần giống Repository
- [ ] Mỗi lần gọi `Add()` trên `DbSet` là một transaction được commit ngay
> `DbContext` theo dõi các entity thay đổi và ghi tất cả trong `SaveChanges()` (mặc định trong một transaction). Gọi `Add()` chỉ đánh dấu state `Added`, chưa ghi xuống DB.

## Đoạn code sau in ra gì? [mid]
```csharp
class Emp {
    public List<string> Skills = new();
    public Emp Clone() => (Emp)MemberwiseClone();
}
var a = new Emp(); a.Skills.Add("C#");
var b = a.Clone(); b.Skills.Add("SQL");
Console.WriteLine(a.Skills.Count);
```
- [ ] 1
- [x] 2
- [ ] 0
- [ ] Ném `InvalidCastException`
> `MemberwiseClone` là shallow copy: field tham chiếu `Skills` được copy địa chỉ nên `a` và `b` dùng chung một list. Muốn độc lập cần deep copy, ví dụ `Skills = new List<string>(Skills)`.

## Theo Dependency Inversion Principle trong Clean Architecture, interface `IOrderRepository` nên được đặt ở đâu? [mid]
- [ ] Trong project Infrastructure, cạnh class `EfOrderRepository`
- [ ] Trong project Web/API để controller dễ dùng
- [ ] Trong một project "Shared" mà mọi layer đều tham chiếu, kể cả Infrastructure tham chiếu ngược Web
- [x] Trong layer Domain/Application (module cấp cao); Infrastructure tham chiếu vào đó để implement
> DIP yêu cầu module cấp cao sở hữu abstraction, module cấp thấp phụ thuộc vào abstraction đó, nhờ vậy chiều phụ thuộc bị đảo ngược. Đặt interface ở Infrastructure khiến Application vẫn phụ thuộc vào tầng thấp.

## Một background service đăng ký Singleton cần đọc cấu hình và nhận giá trị mới khi file `appsettings.json` thay đổi lúc runtime. Nên inject gì? [mid]
- [ ] `IOptions<T>`
- [ ] `IOptionsSnapshot<T>`
- [x] `IOptionsMonitor<T>`
- [ ] `IConfiguration` đọc một lần trong constructor rồi lưu vào field
> `IOptionsMonitor<T>` là singleton, `CurrentValue` luôn phản ánh cấu hình mới và có `OnChange`. `IOptionsSnapshot<T>` là scoped nên không inject được vào Singleton; `IOptions<T>` chỉ đọc một lần.

## Vì sao Service Locator (ví dụ gọi `ServiceLocator.Get<IEmailSender>()` bên trong method) thường bị xem là anti-pattern? [senior]
- [ ] Vì nó luôn chậm hơn constructor injection hàng chục lần
- [ ] Vì nó không hỗ trợ lifetime Scoped
- [x] Vì dependency bị ẩn khỏi chữ ký class: không nhìn constructor biết class cần gì, lỗi thiếu đăng ký chỉ lộ ra lúc runtime, và test phải cấu hình locator toàn cục
- [ ] Vì C# không cho phép generic method static
> Vấn đề chính là hidden dependency và coupling với locator, không phải hiệu năng. Ở một số chỗ như composition root hoặc factory hạ tầng, dùng `IServiceProvider` vẫn chấp nhận được.

## Khi nào Visitor pattern là lựa chọn kém phù hợp? [senior]
- [ ] Khi cấu trúc class ổn định nhưng thường xuyên thêm thao tác mới
- [x] Khi thường xuyên thêm loại element mới vào hierarchy
- [ ] Khi cần double dispatch theo cả kiểu visitor và kiểu element
- [ ] Khi muốn gom logic của một thao tác (ví dụ export) vào một chỗ
> Thêm một element mới buộc phải thêm method `Visit(NewElement)` vào interface visitor và mọi visitor hiện có. Visitor tỏa sáng khi hierarchy ổn định và thao tác thay đổi nhiều, đúng như các phương án còn lại mô tả.

## Phát biểu nào phân biệt đúng Bridge và Adapter? [senior]
- [ ] Bridge chuyển đổi interface không tương thích, Adapter tách abstraction khỏi implementation
- [ ] Bridge chỉ dùng được với kế thừa, Adapter chỉ dùng composition
- [ ] Hai pattern giống hệt nhau về cấu trúc và mục đích, chỉ khác tên
- [x] Bridge được thiết kế từ đầu để abstraction và implementation biến đổi độc lập; Adapter thường được áp dụng sau để ghép các class có sẵn không tương thích
> Cả hai đều dùng composition để ủy quyền, nhưng khác mục đích và thời điểm: Bridge là quyết định thiết kế up-front tránh bùng nổ subclass (Shape x Renderer), Adapter là giải pháp tích hợp hậu kỳ.

## Trong Flyweight pattern (ví dụ render hàng triệu ký tự trong editor), phần nào được chia sẻ giữa các object? [senior]
- [x] Intrinsic state (ví dụ font, glyph) bất biến và độc lập ngữ cảnh; extrinsic state (vị trí, màu riêng) do client truyền vào khi dùng
- [ ] Extrinsic state được chia sẻ, intrinsic state lưu riêng trong từng object
- [ ] Toàn bộ state được chia sẻ, kể cả vị trí của từng ký tự
- [ ] Không có state nào được chia sẻ, Flyweight chỉ là object pool
> Flyweight tiết kiệm bộ nhớ bằng cách chia sẻ intrinsic state bất biến; state phụ thuộc ngữ cảnh phải để bên ngoài. Object pool tái sử dụng instance theo thời gian, khác với chia sẻ đồng thời của Flyweight.

## Với Microsoft.Extensions.DependencyInjection mặc định, đăng ký như sau gây ra điều gì khi resolve `IProductRepo`? [senior]
```csharp
public class CachedProductRepo : IProductRepo {
    public CachedProductRepo(IProductRepo inner, IMemoryCache cache) { /* ... */ }
}
services.AddScoped<IProductRepo, ProductRepo>();
services.AddScoped<IProductRepo, CachedProductRepo>();
```
- [ ] `CachedProductRepo` tự động bọc `ProductRepo` như một Decorator
- [x] Ném `InvalidOperationException` do circular dependency, vì `IProductRepo` resolve ra `CachedProductRepo` (đăng ký cuối) và nó lại cần `IProductRepo`
- [ ] `inner` nhận giá trị `null`
- [ ] Container chọn `ProductRepo` vì nó được đăng ký trước
> Container mặc định không hỗ trợ decorator: đăng ký sau thắng và tự phụ thuộc chính nó. Cần đăng ký bằng factory (`sp => new CachedProductRepo(sp.GetRequiredService<ProductRepo>(), ...)`) hoặc dùng `Decorate<,>()` của Scrutor.

## Specification được viết như sau và dùng với EF Core. Vấn đề là gì? [senior]
```csharp
class ActiveCustomerSpec {
    public Func<Customer, bool> IsSatisfiedBy => c => c.IsActive && !c.IsDeleted;
}
var list = _db.Customers.Where(new ActiveCustomerSpec().IsSatisfiedBy).ToList();
```
- [ ] Không biên dịch được vì `Where` không nhận `Func`
- [ ] EF Core dịch `Func` sang SQL giống hệt `Expression`
- [ ] EF Core ném exception "could not be translated" ngay lập tức
- [x] `Where(Func<...>)` bind vào `Enumerable.Where`, nên EF tải toàn bộ bảng Customers về memory rồi mới lọc phía client
> Chỉ `Expression<Func<T,bool>>` mới đi qua `Queryable.Where` và được dịch sang SQL. Với `Func`, `DbSet` bị xem như `IEnumerable<T>`, không lỗi nhưng gây vấn đề hiệu năng nghiêm trọng.

## Generic repository có method `IQueryable<T> GetAll()` trả thẳng `IQueryable` ra Application layer. Nhận xét nào chính xác nhất? [senior]
- [ ] Đây là cách đóng gói tốt nhất vì caller không biết gì về EF Core
- [x] Abstraction bị rò rỉ: logic truy vấn và hành vi của LINQ provider (lazy execution, giới hạn dịch SQL) tràn ra caller; test bằng LINQ to Objects có thể pass trong khi query thật lỗi
- [ ] `IQueryable` luôn thực thi ngay nên không có lazy execution
- [ ] Không thể dùng `Include()` trên `IQueryable` trả về từ repository
> Lộ `IQueryable` khiến repository gần như chỉ là lớp vỏ của `DbSet`, query rải rác khắp nơi và phụ thuộc ngầm vào EF. Phương án phổ biến là trả kết quả đã materialize hoặc nhận Specification.

## Ghép nào sau đây là đúng giữa thành phần .NET và design pattern? (chọn nhiều) [senior]
- [x] `GZipStream` bọc một `Stream` khác và cũng kế thừa `Stream` là Decorator
- [x] `IObservable<T>`/`IObserver<T>` là Observer
- [ ] `Task<T>` là Memento vì lưu kết quả để dùng lại
- [x] `StringBuilder` / `IHostBuilder` là Builder
> Stream wrapper cùng base type và thêm hành vi là Decorator; `IObservable` là Observer chuẩn; các `*Builder` xây object từng bước. `Task<T>` đại diện cho một thao tác bất đồng bộ (gần với Future/Promise), không phải Memento lưu snapshot trạng thái để khôi phục.

## Đoạn TypeScript sau thể hiện pattern nào? [senior]
```typescript
interface TrafficLightState { next(light: TrafficLight): void; color: string; }
class Red implements TrafficLightState {
  color = 'red';
  next(light: TrafficLight) { light.setState(new Green()); }
}
class Green implements TrafficLightState {
  color = 'green';
  next(light: TrafficLight) { light.setState(new Yellow()); }
}
class TrafficLight {
  constructor(private state: TrafficLightState = new Red()) {}
  setState(s: TrafficLightState) { this.state = s; }
  change() { this.state.next(this); }
}
```
- [ ] Strategy, vì mỗi class là một thuật toán thay thế được
- [ ] Chain of Responsibility, vì mỗi class chuyển tiếp sang class kế tiếp
- [x] State, vì các state tự chuyển context sang state kế tiếp và hành vi của `TrafficLight` phụ thuộc trạng thái hiện tại
- [ ] Memento, vì `TrafficLight` lưu lại state cũ
> Cấu trúc giống Strategy (cùng interface, composition), nhưng dấu hiệu quyết định là state biết state kế tiếp và gọi `setState` trên context. Chain of Responsibility chuyển một request qua chuỗi handler, không thay đổi trạng thái của context.

## Nhược điểm chính của Abstract Factory khi hệ thống phát triển là gì? [senior]
- [x] Thêm một loại product mới vào họ (ví dụ thêm `CreateSlider()`) buộc phải sửa interface factory và mọi concrete factory
- [ ] Không thể thêm một họ product mới (ví dụ theme mới) mà không sửa client
- [ ] Client phải biết concrete class của từng product
- [ ] Các product trong cùng họ có thể không tương thích với nhau
> Thêm họ mới (một concrete factory mới) thì dễ và tuân OCP, nhưng thêm loại product mới thì ảnh hưởng toàn bộ hierarchy. Bảo đảm tính tương thích trong họ chính là ưu điểm của pattern này.

## Mỗi repository tự tạo `DbContext` riêng. Hệ quả của đoạn code sau là gì? [senior]
```csharp
class OrderRepo { private readonly AppDbContext _db = new AppDbContext(); /* Add + _db.SaveChanges() */ }
class StockRepo { private readonly AppDbContext _db = new AppDbContext(); /* Update + _db.SaveChanges() */ }
// Service:
_orderRepo.Add(order);      // SaveChanges thành công
_stockRepo.Decrease(item);  // SaveChanges ném exception
```
- [ ] EF Core tự rollback cả đơn hàng vì cùng connection string
- [ ] Cả hai thao tác đều không được lưu vì exception
- [ ] Không biên dịch được vì hai `DbContext` cùng kiểu
- [x] Đơn hàng đã được commit còn tồn kho thì không, dữ liệu không nhất quán vì thiếu Unit of Work chung
> Hai context là hai unit of work độc lập, mỗi `SaveChanges` là một transaction riêng. Cần chia sẻ một `DbContext` scoped (hoặc UoW/transaction bao ngoài) để commit atomic.

## Override nào sau đây vi phạm Liskov Substitution Principle? [senior]
```csharp
class Account {
    // Hợp đồng: chấp nhận mọi amount > 0, sau khi gọi số dư giảm đúng amount
    public virtual void Withdraw(decimal amount) { /* ... */ }
}
```
- [ ] Subclass ghi log thêm trước khi gọi `base.Withdraw(amount)`
- [x] Subclass ném exception nếu `amount > 1_000_000`, dù base chấp nhận mọi `amount > 0`
- [ ] Subclass chấp nhận cả `amount == 0` và không làm gì
- [ ] Subclass gửi thêm thông báo sau khi rút thành công
> LSP cấm subtype làm mạnh precondition hoặc làm yếu postcondition. Giới hạn số tiền là precondition chặt hơn nên code dùng `Account` có thể hỏng; chấp nhận thêm `amount == 0` là nới lỏng precondition, được phép.
