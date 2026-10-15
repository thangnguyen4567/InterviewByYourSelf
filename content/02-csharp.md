---
id: csharp
title: C#
icon: 🟣
order: 2
description: Câu hỏi phỏng vấn C# và .NET: type system, generics, LINQ, async/await, threading, GC, hiệu năng và tính năng C# hiện đại.
---

# Type system & bộ nhớ cơ bản

## Value type và Reference type khác nhau thế nào? [junior]
| | Value type | Reference type |
|---|---|---|
| Ví dụ | `int`, `double`, `bool`, `struct`, `enum`, `DateTime` | `class`, `string`, `array`, `delegate`, `interface`, `record` |
| Lưu trữ | Chứa **trực tiếp dữ liệu** | Chứa **tham chiếu** tới object trên **managed heap** |
| Gán / truyền tham số | **Copy toàn bộ giá trị** | Copy **tham chiếu** (cùng trỏ một object) |
| `null` | Không (trừ `Nullable<T>`) | Có |
| Kế thừa | Không (ngầm định từ `ValueType`) | Có |

```csharp
var p1 = new PointStruct { X = 1 };
var p2 = p1; p2.X = 5;      // p1.X vẫn = 1

var c1 = new PointClass { X = 1 };
var c2 = c1; c2.X = 5;      // c1.X = 5
```

**Lưu ý / bẫy thường gặp:** "value type nằm trên stack" chỉ đúng một phần — value type là field của class, phần tử của array, hay bị capture trong closure/async thì nằm trên **heap**. Điểm khác biệt cốt lõi là **ngữ nghĩa copy**, không phải vị trí lưu trữ.

## struct, class và record khác nhau thế nào? Khi nào dùng struct? [mid]
| | `class` | `struct` | `record` / `record struct` |
|---|---|---|---|
| Kiểu | Reference | Value | Reference / Value |
| Equality mặc định | Reference equality | Value (qua reflection, chậm) | **Value equality** được sinh sẵn |
| Kế thừa | Có | Không | `record class` có |
| Tiện ích | — | — | `with`, `ToString`, `Deconstruct` |

```csharp
public record Person(string Name, int Age);
var a = new Person("An", 30);
var b = a with { Age = 31 };     // non-destructive mutation
Console.WriteLine(a == new Person("An", 30)); // True

public readonly record struct Point(double X, double Y);
```

**Dùng struct khi:** kiểu nhỏ (khuyến nghị ≤ 16 byte), logic như một giá trị (tọa độ, tiền, màu), **immutable**, tạo nhiều và sống ngắn → giảm áp lực GC.

**Lưu ý / bẫy thường gặp:** struct lớn bị copy tốn kém; struct mutable gây bug (sửa bản copy trong `List<T>`, property getter). Nên khai báo `readonly struct`. Struct luôn có default value (mọi field = 0/null).

## Boxing và Unboxing là gì? Tại sao ảnh hưởng hiệu năng? [junior]
- **Boxing**: chuyển value type thành `object` (hoặc interface) → cấp phát object mới trên heap và copy giá trị vào.
- **Unboxing**: lấy giá trị từ object ra value type → kiểm tra kiểu và copy ra.

```csharp
int x = 42;
object o = x;          // boxing
int y = (int)o;        // unboxing
long z = (long)o;      // InvalidCastException! phải unbox đúng kiểu

ArrayList list = new(); list.Add(1);       // boxing
List<int> list2 = new(); list2.Add(1);     // không boxing (generics)
```

Ảnh hưởng: mỗi lần boxing là một **heap allocation** → tăng áp lực GC, tốn CPU copy, mất cache locality.

Các trường hợp boxing ẩn:
- Dùng collection non-generic (`ArrayList`, `Hashtable`).
- Gọi method của `object` trên struct không override (`GetHashCode`, `Equals`).
- Ép struct về interface (`IComparable c = myStruct;`).
- `string.Format("{0}", 5)` với overload `object` (string interpolation hiện đại đã tránh được).

**Lưu ý / bẫy thường gặp:** sửa giá trị của bản boxed không ảnh hưởng tới biến gốc — đây là hai bản sao khác nhau.

## Tại sao string là immutable? Khi nào dùng StringBuilder? [junior]
`string` là reference type nhưng **immutable**: mọi thao tác như `+`, `Replace`, `ToUpper` đều tạo **string mới**.

Lý do thiết kế:
- **Thread-safe** tự nhiên.
- An toàn làm key trong `Dictionary` (hash không đổi).
- Cho phép **string interning** (các literal giống nhau dùng chung một instance).
- Bảo mật: đường dẫn, connection string không bị thay đổi sau khi kiểm tra.

```csharp
// Tệ: O(n^2), tạo n string tạm
string s = "";
for (int i = 0; i < 10_000; i++) s += i;

// Tốt
var sb = new StringBuilder(capacity: 50_000);
for (int i = 0; i < 10_000; i++) sb.Append(i);
string result = sb.ToString();
```

**Khi nào dùng StringBuilder:** nối chuỗi trong vòng lặp hoặc số lần không biết trước. Với vài phép nối cố định, `+` hoặc **string interpolation** đã được compiler tối ưu (`string.Concat`, `DefaultInterpolatedStringHandler`). Còn có `string.Join`, `string.Create`, `Span<char>` cho hot path.

**Lưu ý / bẫy thường gặp:** so sánh string nên chỉ định `StringComparison.Ordinal`/`OrdinalIgnoreCase` thay vì `ToLower()` (tạo string mới và lỗi culture như "Turkish I").

## ref, out và in khác nhau thế nào? [mid]
Cả ba đều truyền tham số **by reference** (truyền địa chỉ, không copy):

| | `ref` | `out` | `in` |
|---|---|---|---|
| Phải khởi tạo trước khi truyền | Có | Không | Có |
| Method phải gán giá trị | Không | **Bắt buộc** | Không được gán (read-only) |
| Mục đích | Đọc và sửa | Trả thêm giá trị | Tránh copy struct lớn |

```csharp
void Swap(ref int a, ref int b) => (a, b) = (b, a);

if (int.TryParse("123", out var n)) { /* dùng n */ }

double Length(in Vector3 v) => Math.Sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z);
```

Mở rộng: `ref return`, `ref local`, `ref readonly` parameter (C# 12), `ref struct` (như `Span<T>`), `scoped`.

**Lưu ý / bẫy thường gặp:**
- `in` với struct **không** `readonly` có thể gây **defensive copy** khi gọi method → mất lợi ích hiệu năng. Kết hợp với `readonly struct`.
- Không dùng `ref/out/in` trong `async` method và iterator (trước C# 13).
- Truyền reference type bằng `ref` cho phép gán lại **chính biến** ở phía caller.

## Nullable reference types (C# 8) là gì? [mid]
Bật `<Nullable>enable</Nullable>`, compiler phân biệt:
- `string` — **non-nullable**: không được gán `null`.
- `string?` — **nullable**: phải kiểm tra trước khi dereference.

Đây là **static analysis lúc compile** (warnings), không thay đổi runtime — `string` và `string?` cùng là `System.String`.

```csharp
public string GetName(User? user)
{
    if (user is null) return "Guest";
    return user.Name;               // compiler biết user != null
}

string name = maybeNull!;            // null-forgiving: "tôi chắc chắn"
string display = user?.Name ?? "N/A";
user ??= new User();
```

Attributes hỗ trợ phân tích: `[NotNullWhen(true)]`, `[MaybeNull]`, `[NotNull]`, `[MemberNotNull]`, `[DoesNotReturn]`.

```csharp
bool TryGet(string key, [NotNullWhen(true)] out Item? item);
```

So sánh: `int?` là `Nullable<int>` (kiểu thật ở runtime, có `HasValue`/`Value`), còn `string?` chỉ là annotation.

**Lưu ý / bẫy thường gặp:** lạm dụng `!` làm mất ý nghĩa; deserialization/EF có thể vẫn trả về `null` cho property non-nullable. Nên bật `TreatWarningsAsErrors` cho nullable warnings.

# Generics, Delegates & Lambdas

## Generics trong C# là gì? Các loại constraint? [junior]
**Generics** cho phép viết code tái sử dụng với **type safety** và **không boxing**. Khác Java (type erasure), .NET giữ thông tin generic ở runtime (reified generics): mỗi value type có bản JIT riêng, reference types dùng chung một bản.

```csharp
public class Repository<T> where T : class, IEntity, new()
{
    public T Create() => new T();
}

public static T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;
```

| Constraint | Ý nghĩa |
|---|---|
| `where T : class` / `class?` | Reference type |
| `where T : struct` | Non-nullable value type |
| `where T : new()` | Có constructor không tham số |
| `where T : BaseClass` / `IInterface` | Kế thừa / implement |
| `where T : U` | T kế thừa từ type parameter khác |
| `where T : notnull` | Không null |
| `where T : unmanaged` | Value type không chứa reference |
| `where T : Enum` / `Delegate` | (C# 7.3) |
| `allows ref struct` | (C# 13) cho phép `Span<T>` |

C# 11 có **generic math** với static abstract interface members: `where T : INumber<T>`.

## Covariance và Contravariance là gì? [senior]
Variance cho phép chuyển đổi ngầm giữa các generic type có quan hệ kế thừa. Chỉ áp dụng cho **generic interface và delegate**, và chỉ với **reference type**.

- **Covariance (`out T`)**: dùng type **cụ thể hơn** ở chỗ cần type tổng quát hơn. T chỉ xuất hiện ở vị trí **output** (return).
- **Contravariance (`in T`)**: dùng type **tổng quát hơn** ở chỗ cần type cụ thể hơn. T chỉ xuất hiện ở vị trí **input** (tham số).

```csharp
// Covariance: IEnumerable<out T>
IEnumerable<string> strings = new List<string>();
IEnumerable<object> objects = strings;            // OK

// Contravariance: Action<in T>, IComparer<in T>
Action<object> printObj = o => Console.WriteLine(o);
Action<string> printStr = printObj;               // OK

Func<object, string> f = o => o.ToString()!;
Func<string, object> g = f;                       // in T, out TResult
```

Tự định nghĩa: `interface IProducer<out T> { T Get(); }`, `interface IConsumer<in T> { void Put(T item); }`.

**Lưu ý / bẫy thường gặp:** `List<T>` là **invariant** (vừa đọc vừa ghi) nên `List<string>` không gán được cho `List<object>`. Array lại covariant (`object[] arr = new string[1]`) nhưng không an toàn: `arr[0] = 1` ném `ArrayTypeMismatchException` lúc runtime.

## Delegate, event, Func, Action, Predicate khác nhau thế nào? [junior]
- **Delegate**: kiểu an toàn đại diện cho tham chiếu tới method (giống function pointer type-safe). Là **multicast** — có thể chứa nhiều method (`+=`).
- **Func<T..., TResult>**: delegate generic có giá trị trả về.
- **Action<T...>**: delegate generic trả về `void`.
- **Predicate<T>**: tương đương `Func<T, bool>`.
- **event**: wrapper bọc delegate, giới hạn bên ngoài chỉ được `+=`/`-=`, **chỉ class sở hữu mới được invoke**.

```csharp
public delegate int Operation(int a, int b);

Func<int, int, int> add = (a, b) => a + b;
Action<string> log = Console.WriteLine;
Predicate<int> isEven = x => x % 2 == 0;

public class Button
{
    public event EventHandler<ClickEventArgs>? Clicked;
    protected virtual void OnClicked(ClickEventArgs e) => Clicked?.Invoke(this, e);
}
button.Clicked += (s, e) => Console.WriteLine("Clicked");
```

**Event so với public delegate field:** với field, code bên ngoài có thể gán `= null` (xóa mọi subscriber) hoặc tự gọi delegate. `event` ngăn điều đó.

**Lưu ý / bẫy thường gặp:** quên `-=` khiến publisher sống lâu giữ tham chiếu tới subscriber → **memory leak**. Với multicast `Func`, chỉ nhận được giá trị trả về của handler cuối cùng.

## Lambda và Closure trong C#? Bẫy capture biến trong vòng lặp? [mid]
**Lambda** là anonymous function: `x => x * 2`. **Closure** xảy ra khi lambda **capture biến** từ scope bên ngoài. Compiler sinh một **class ẩn (display class)** chứa biến được capture dưới dạng field — biến được capture **theo tham chiếu**, không phải theo giá trị tại thời điểm tạo lambda.

```csharp
int counter = 0;
Action inc = () => counter++;
inc(); inc();
Console.WriteLine(counter);   // 2

// Bẫy với for: các lambda dùng chung biến i
var actions = new List<Action>();
for (int i = 0; i < 3; i++)
    actions.Add(() => Console.Write(i));
actions.ForEach(a => a());    // 333

// Cách sửa: copy ra biến cục bộ
for (int i = 0; i < 3; i++) { int copy = i; actions.Add(() => Console.Write(copy)); }
```

Từ C# 5, `foreach` tạo biến mới mỗi vòng nên không bị lỗi này (nhưng `for` vẫn bị).

Hiệu năng: closure gây **heap allocation** (display class + delegate). Dùng **`static` lambda** (C# 9) để compiler đảm bảo không capture: `list.Where(static x => x > 0)`.

**Lưu ý / bẫy thường gặp:** capture `this` trong lambda đăng ký vào event/timer sống lâu làm object không được GC thu hồi.

## Extension methods là gì? Ưu nhược điểm? [junior]
**Extension method** cho phép "thêm" method vào type có sẵn mà không sửa source hay kế thừa. Đây là **cú pháp tiện lợi** — compiler chuyển thành lời gọi static method.

```csharp
public static class StringExtensions
{
    public static bool IsNullOrBlank(this string? s) => string.IsNullOrWhiteSpace(s);

    public static IEnumerable<T> WhereNotNull<T>(this IEnumerable<T?> source) where T : class
        => source.Where(x => x is not null)!;
}

"  ".IsNullOrBlank();   // tương đương StringExtensions.IsNullOrBlank("  ")
```

Yêu cầu: method `static` trong **static non-generic class**, tham số đầu có `this`, namespace phải được `using`.

**Ưu điểm:** fluent API (toàn bộ LINQ là extension methods trên `IEnumerable<T>`), mở rộng type của bên thứ ba, interface (`IServiceCollection.AddXxx()`).

**Nhược điểm / lưu ý:**
- Không truy cập được member `private`/`protected`.
- **Instance method luôn được ưu tiên** hơn extension method cùng signature.
- Có thể gọi trên biến `null` (không ném `NullReferenceException` ngay) — cần tự kiểm tra.
- Không có tính đa hình (resolve lúc compile theo static type).

C# 14 mở rộng thêm **extension members** (extension properties, static extensions) qua khối `extension`.

# LINQ

## Deferred execution trong LINQ là gì? [mid]
Hầu hết toán tử LINQ (`Where`, `Select`, `OrderBy`, `Take`...) **không chạy ngay** mà chỉ xây dựng một pipeline. Query chỉ thực thi khi được **enumerate**: `foreach`, `ToList()`, `ToArray()`, `Count()`, `First()`, `Sum()`...

```csharp
var numbers = new List<int> { 1, 2, 3 };
var query = numbers.Where(n => { Console.Write("x"); return n > 1; });

numbers.Add(4);                 // ảnh hưởng tới kết quả
var a = query.ToList();         // in "xxxx", kết quả [2,3,4]
var b = query.Count();          // chạy LẠI lần nữa: "xxxx"
```

Phân loại:
- **Deferred streaming**: `Where`, `Select` — xử lý từng phần tử.
- **Deferred non-streaming**: `OrderBy`, `GroupBy` — phải đọc hết nguồn khi bắt đầu enumerate.
- **Immediate**: `ToList`, `Count`, `Max`, `First`, `Any`.

**Lưu ý / bẫy thường gặp:**
- **Multiple enumeration**: enumerate `IEnumerable` nhiều lần → chạy lại query (có thể gọi DB/IO nhiều lần). Materialize bằng `ToList()` khi cần dùng lại.
- Exception chỉ xuất hiện lúc enumerate, không phải lúc khai báo query.
- Biến được capture thay đổi trước khi enumerate sẽ làm thay đổi kết quả.

## IEnumerable<T> khác IQueryable<T> như thế nào? [mid]
| | `IEnumerable<T>` | `IQueryable<T>` |
|---|---|---|
| Namespace | `System.Collections.Generic` | `System.Linq` |
| Thực thi | **In-memory** (LINQ to Objects) | Bởi **query provider** (EF Core → SQL) |
| Tham số lambda | `Func<T, bool>` (delegate đã compile) | `Expression<Func<T, bool>>` (**expression tree**) |
| Lọc | Trên client sau khi lấy dữ liệu | Dịch thành SQL, lọc ở DB |

```csharp
// Tốt: WHERE và TOP được dịch sang SQL
var users = db.Users.Where(u => u.IsActive).Take(10).ToList();

// Tệ: AsEnumerable() kéo TOÀN BỘ bảng về rồi mới lọc
var users2 = db.Users.AsEnumerable().Where(u => u.IsActive).Take(10).ToList();

// Tệ: trả về IEnumerable từ repository làm mất khả năng compose query
IEnumerable<User> GetAll() => db.Users;
```

**Lưu ý / bẫy thường gặp:**
- Gọi method C# tùy ý trong `IQueryable` (ví dụ `MyHelper(u.Name)`) → EF Core không dịch được → exception (hoặc client evaluation ở projection cuối).
- Expose `IQueryable` ra ngoài tầng repository giúp linh hoạt nhưng làm rò rỉ chi tiết persistence; cân nhắc trade-off.

## First, FirstOrDefault, Single, SingleOrDefault khác nhau thế nào? Any vs Count? [junior]
| Method | 0 phần tử | 1 phần tử | Nhiều phần tử |
|---|---|---|---|
| `First()` | Exception | Trả về | Trả về phần tử đầu |
| `FirstOrDefault()` | `default` | Trả về | Phần tử đầu |
| `Single()` | Exception | Trả về | **Exception** |
| `SingleOrDefault()` | `default` | Trả về | **Exception** |

- `Single` thể hiện **ràng buộc nghiệp vụ** "phải có đúng một" (ví dụ tìm theo khóa duy nhất), nhưng phải duyệt thêm để kiểm tra phần tử thứ hai (SQL `TOP 2`).
- `First` dừng ngay khi tìm thấy (SQL `TOP 1`).
- .NET 6+: `FirstOrDefault(defaultValue)`.

```csharp
var user = users.FirstOrDefault(u => u.Id == id) ?? throw new NotFoundException();

if (orders.Any(o => o.IsPaid)) { }      // tốt: dừng ở phần tử đầu thỏa mãn
if (orders.Count(o => o.IsPaid) > 0) { } // tệ: đếm hết
```

**Lưu ý / bẫy thường gặp:** `First()` mà không có `OrderBy` trên DB thì thứ tự không được đảm bảo. Với `List<T>`, dùng property `.Count` thay vì `Count()`. EF Core: `Find()` kiểm tra change tracker trước khi query.

## Những bẫy hiệu năng thường gặp khi dùng LINQ? [senior]
- **Multiple enumeration** của `IEnumerable` → materialize một lần.
- **Lồng `Where`/`Contains` O(n²)**: `list1.Where(x => list2.Contains(x))` với `list2` là List → chuyển thành `HashSet<T>` hoặc dùng `Join`.

```csharp
var ids = new HashSet<int>(otherIds);
var result = items.Where(i => ids.Contains(i.Id)).ToList();
```

- **Allocation**: mỗi toán tử tạo iterator + delegate; closure capture biến → allocation. Trong hot path dùng vòng lặp `for`/`foreach` hoặc `Span<T>`.
- `OrderBy(...).First()` → O(n log n); dùng `MinBy`/`MaxBy` (.NET 6) O(n).
- `Count() > 0` thay vì `Any()`; `Where(...).First()` thay vì `First(predicate)` (khác biệt nhỏ).
- **EF Core**: N+1 khi lazy loading; dùng `Include`, projection `Select` chỉ cột cần, `AsNoTracking()` cho read-only, `AsSplitQuery()` tránh cartesian explosion, phân trang `Skip/Take` trên `IQueryable`.
- `ToList()` quá sớm trên `IQueryable` kéo dữ liệu thừa về.

.NET 7-9 đã tối ưu đáng kể LINQ (vectorization cho `Sum`, `Min`, `Max` trên array/span), nhưng nguyên tắc vẫn là: **đo bằng BenchmarkDotNet** trước khi tối ưu.

# Async/Await

## async/await hoạt động như thế nào bên dưới? [mid]
Compiler biến method `async` thành một **state machine** (struct implement `IAsyncStateMachine`):

1. Code chạy **đồng bộ** cho tới `await` đầu tiên.
2. Tại `await`, nếu `Task` **chưa hoàn thành**: lưu trạng thái (biến cục bộ, vị trí), đăng ký **continuation**, và **trả quyền điều khiển** về cho caller (thread được giải phóng).
3. Khi Task hoàn thành, continuation chạy tiếp từ vị trí đã lưu — trên `SynchronizationContext` gốc (nếu có) hoặc thread pool.
4. Nếu Task đã hoàn thành sẵn (`IsCompleted`), chạy tiếp đồng bộ, không tốn chi phí chuyển ngữ cảnh.

```csharp
public async Task<string> GetDataAsync(CancellationToken ct)
{
    using var client = new HttpClient();
    var response = await client.GetAsync(url, ct);    // thread không bị block
    return await response.Content.ReadAsStringAsync(ct);
}
```

Điểm quan trọng:
- **async ≠ multithreading**. Với I/O-bound, không có thread nào "chờ" cả — OS sẽ báo khi I/O xong.
- CPU-bound mới cần `Task.Run` để đẩy sang thread pool.
- Exception được lưu vào Task và ném lại khi `await`.

**Lưu ý / bẫy thường gặp:** "async all the way" — trộn sync và async (`.Result`, `.Wait()`) gây deadlock và thread pool starvation.

## Task và ValueTask khác nhau thế nào? Khi nào dùng ValueTask? [senior]
- **`Task`/`Task<T>`**: class (reference type) → mỗi lần trả về là một heap allocation (trừ các task được cache như `Task.CompletedTask`, `Task.FromResult(true)`).
- **`ValueTask`/`ValueTask<T>`**: struct, có thể bọc **trực tiếp kết quả** (không allocation) hoặc một `Task`, hoặc một `IValueTaskSource` (có thể tái sử dụng).

**Dùng `ValueTask` khi:** method **thường hoàn thành đồng bộ** (cache hit, buffer đã có dữ liệu) và nằm trong **hot path**.

```csharp
public ValueTask<User> GetUserAsync(int id)
{
    if (_cache.TryGetValue(id, out var user))
        return ValueTask.FromResult(user);          // không allocation
    return new ValueTask<User>(LoadFromDbAsync(id));
}
```

**Giới hạn khi tiêu thụ ValueTask (rất hay hỏi):**
- Chỉ được **await một lần**.
- Không được await **đồng thời** từ nhiều nơi.
- Không gọi `.Result`/`.GetAwaiter().GetResult()` khi chưa hoàn thành.
- Cần dùng nhiều lần → `.AsTask()`.

| | Task | ValueTask |
|---|---|---|
| Kiểu | class | struct |
| Await nhiều lần | Có | Không |
| `Task.WhenAll` | Trực tiếp | Cần `.AsTask()` |

**Mặc định dùng `Task`**; chỉ dùng `ValueTask` khi có số liệu benchmark chứng minh.

## ConfigureAwait(false) là gì? Khi nào cần dùng? [mid]
Mặc định `await` capture **`SynchronizationContext`** hiện tại (hoặc `TaskScheduler`) và chạy continuation **trên context đó**:
- WinForms/WPF/MAUI: UI thread.
- ASP.NET (classic, .NET Framework): request context.

`ConfigureAwait(false)` nói rằng: "không cần quay lại context gốc" → continuation chạy trên **thread pool**.

```csharp
// Trong library code
public async Task<Data> LoadAsync()
{
    var json = await _http.GetStringAsync(url).ConfigureAwait(false);
    return JsonSerializer.Deserialize<Data>(json)!;
}
```

Lợi ích: tránh **deadlock** khi caller block bằng `.Result`, giảm chi phí marshal về UI thread.

| Ngữ cảnh | Khuyến nghị |
|---|---|
| **Library** dùng chung | Dùng `ConfigureAwait(false)` |
| UI code cần cập nhật control sau await | **Không** dùng |
| **ASP.NET Core** | Không có SynchronizationContext → không bắt buộc |

.NET 8 có thêm `ConfigureAwait(ConfigureAwaitOptions.SuppressThrowing | ForceYielding)`.

**Lưu ý / bẫy thường gặp:** `ConfigureAwait(false)` chỉ có tác dụng nếu Task **chưa hoàn thành** khi await; các `await` sau trong cùng method vẫn cần thêm nếu muốn chắc chắn. Nó **không** sửa được deadlock nếu có một `await` nào khác thiếu nó.

## Tại sao gọi .Result hoặc .Wait() có thể gây deadlock? [senior]
Kịch bản kinh điển trên UI app hoặc ASP.NET classic (có `SynchronizationContext` chỉ cho phép một thread):

```csharp
// UI button click
private void Button_Click(object s, EventArgs e)
{
    var data = GetDataAsync().Result;   // (1) BLOCK UI thread chờ Task
}

private async Task<string> GetDataAsync()
{
    await Task.Delay(1000);             // (2) capture UI context
    return "done";                      // (3) continuation cần UI thread để chạy
}
```

1. UI thread bị block tại `.Result`, chờ Task hoàn thành.
2. Khi `Task.Delay` xong, continuation phải chạy **trên UI thread** (do context được capture).
3. UI thread đang bị block → continuation không bao giờ chạy → Task không bao giờ hoàn thành → **deadlock**.

**Giải pháp:**
- **Async all the way**: `var data = await GetDataAsync();` (event handler dùng `async void`).
- Trong library: `ConfigureAwait(false)` ở mọi `await`.
- Bất đắc dĩ phải gọi sync: `Task.Run(() => GetDataAsync()).GetAwaiter().GetResult()` (vẫn tốn thread).

Trên **ASP.NET Core** không có SynchronizationContext nên không deadlock kiểu này, nhưng blocking vẫn gây **thread pool starvation** khi tải cao.

**Lưu ý / bẫy thường gặp:** `.GetAwaiter().GetResult()` ném exception gốc thay vì `AggregateException` như `.Result`, nhưng **vẫn deadlock** như nhau.

## async void có vấn đề gì? Xử lý exception trong async thế nào? [mid]
**`async void`** chỉ nên dùng cho **event handler**. Vấn đề:
- Caller **không thể await** → không biết khi nào xong.
- Exception **không thể catch** bởi caller; nó được ném lên `SynchronizationContext` → thường làm **crash process**.
- Khó test.

```csharp
public async void Bad() { throw new Exception(); }       // crash app
public async Task Good() { throw new Exception(); }      // exception nằm trong Task

try { await Good(); } catch (Exception ex) { /* bắt được */ }
```

Xử lý nhiều Task:

```csharp
var t1 = LoadAAsync(); var t2 = LoadBAsync();
try
{
    await Task.WhenAll(t1, t2);      // await chỉ ném exception ĐẦU TIÊN
}
catch
{
    var all = new[] { t1, t2 }.Where(t => t.IsFaulted).Select(t => t.Exception!);
}
```

- `Task.WhenAll` + `await` ném exception đầu tiên; xem toàn bộ trong `task.Exception` (`AggregateException`).
- **Fire-and-forget** task mà không quan sát exception → bị nuốt (sự kiện `TaskScheduler.UnobservedTaskException`). Trong ASP.NET Core nên dùng `BackgroundService`/queue.

**Lưu ý / bẫy thường gặp:** lambda truyền vào `Action` (ví dụ `list.ForEach(async x => await ...)`) thực chất là `async void`.

## CancellationToken được dùng như thế nào? [mid]
**Cancellation** trong .NET là cơ chế **cooperative**: code tự kiểm tra token và dừng, không có cơ chế "kill" thread.

- `CancellationTokenSource` (CTS): phía phát lệnh hủy (`Cancel()`, `CancelAfter()`).
- `CancellationToken`: truyền xuống các method, kiểm tra `IsCancellationRequested` hoặc `ThrowIfCancellationRequested()`.

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
try
{
    await ProcessAsync(items, cts.Token);
}
catch (OperationCanceledException) { /* timeout hoặc user hủy */ }

async Task ProcessAsync(IEnumerable<Item> items, CancellationToken ct)
{
    foreach (var item in items)
    {
        ct.ThrowIfCancellationRequested();
        await _repo.SaveAsync(item, ct);    // luôn truyền token xuống
    }
}

// Kết hợp nhiều token
using var linked = CancellationTokenSource.CreateLinkedTokenSource(ct, appStopping);
```

Trong ASP.NET Core, inject `CancellationToken` vào action → tự hủy khi client ngắt kết nối (`HttpContext.RequestAborted`).

**Lưu ý / bẫy thường gặp:** quên `Dispose` CTS có timer; bắt `OperationCanceledException` (lớp cha của `TaskCanceledException`); không nên coi hủy là lỗi khi log.

# Threading & Concurrency

## lock hoạt động thế nào? Monitor, Mutex, SemaphoreSlim khác nhau ra sao? [mid]
`lock(obj)` là cú pháp cho `Monitor.Enter/Exit` trong `try/finally`, đảm bảo chỉ **một thread** vào critical section.

```csharp
private readonly object _sync = new();   // .NET 9: private readonly Lock _sync = new();
public void Add(int v) { lock (_sync) { _total += v; } }
```

| Primitive | Phạm vi | Đặc điểm |
|---|---|---|
| `lock` / `Monitor` | Trong process | Nhẹ, reentrant, **không dùng được với await** |
| `System.Threading.Lock` (.NET 9) | Trong process | Nhanh hơn lock trên object |
| `Mutex` | **Cross-process** (named) | Nặng (kernel object), có thread affinity |
| `SemaphoreSlim` | Trong process | Cho phép **N** thread, có **`WaitAsync`** |
| `Semaphore` | Cross-process | Kernel object |
| `ReaderWriterLockSlim` | Trong process | Nhiều reader / một writer |

```csharp
private readonly SemaphoreSlim _gate = new(1, 1);
public async Task UpdateAsync()
{
    await _gate.WaitAsync();
    try { await _db.SaveAsync(); }
    finally { _gate.Release(); }
}
```

**Lưu ý / bẫy thường gặp:** không `lock(this)`, `lock(typeof(X))` hay lock trên string (có thể bị code khác lock cùng object). Không thể `await` bên trong `lock` (compile error) — dùng `SemaphoreSlim`. `SemaphoreSlim` không reentrant.

## Concurrent collections trong .NET? ConcurrentDictionary có hoàn toàn thread-safe không? [mid]
Namespace `System.Collections.Concurrent`:
- `ConcurrentDictionary<TKey, TValue>`: fine-grained locking, đọc gần như lock-free.
- `ConcurrentQueue<T>`, `ConcurrentStack<T>`: lock-free.
- `ConcurrentBag<T>`: tối ưu khi cùng thread vừa thêm vừa lấy.
- `BlockingCollection<T>`: producer/consumer có bounded capacity (hiện nay ưu tiên **`System.Threading.Channels`** cho async).

```csharp
var cache = new ConcurrentDictionary<string, Lazy<Data>>();

var data = cache.GetOrAdd(key, k => new Lazy<Data>(() => LoadData(k))).Value;

counts.AddOrUpdate(word, 1, (_, old) => old + 1);
```

**Bẫy:** `GetOrAdd(key, factory)` và `AddOrUpdate` **không đảm bảo factory chỉ chạy một lần** — khi nhiều thread cùng thêm, factory có thể chạy nhiều lần (chỉ một kết quả được lưu). Nếu factory tốn kém hoặc có side effect → bọc bằng `Lazy<T>` như trên.

Ngoài ra, chuỗi thao tác `if (!dict.ContainsKey(k)) dict[k] = v;` **không atomic** dù dùng ConcurrentDictionary — dùng `TryAdd`, `GetOrAdd`, `TryUpdate`.

Lựa chọn khác: **Immutable collections** (`ImmutableList`, `FrozenDictionary` .NET 8 cho dữ liệu đọc nhiều, ghi ít).

## Interlocked và volatile dùng để làm gì? [senior]
**`Interlocked`** cung cấp thao tác **atomic** trên biến chia sẻ không cần lock (dùng lệnh CPU như `LOCK CMPXCHG`):

```csharp
private int _count;
Interlocked.Increment(ref _count);           // _count++ an toàn
Interlocked.Add(ref _total, 5);
Interlocked.Exchange(ref _state, 1);

// Compare-and-swap: lock-free update
int initial, computed;
do {
    initial = _max;
    computed = Math.Max(initial, value);
} while (Interlocked.CompareExchange(ref _max, computed, initial) != initial);
```

`_count++` **không atomic**: gồm đọc, tăng, ghi → race condition (lost update).

**`volatile`** đảm bảo **visibility và ordering**: mỗi lần đọc lấy giá trị mới nhất từ memory (acquire), ghi có release semantics; ngăn compiler/JIT/CPU reorder hay cache biến trong register.

```csharp
private volatile bool _stop;
// thread A: while (!_stop) { ... }   // không bị tối ưu thành vòng lặp vô hạn
// thread B: _stop = true;
```

| | volatile | Interlocked | lock |
|---|---|---|---|
| Visibility | Có | Có | Có |
| Atomic read-modify-write | **Không** | Có | Có |
| Nhiều biến / thao tác phức tạp | Không | Không | Có |

**Lưu ý / bẫy thường gặp:** `volatile` không làm `x++` an toàn. Code lock-free rất khó đúng — ưu tiên `lock` hoặc concurrent collections trừ khi profiling chứng minh cần thiết.

## Thread, ThreadPool, Task và Parallel khác nhau thế nào? [mid]
- **`Thread`**: OS thread thật, tốn ~1MB stack, tạo/hủy đắt. Dùng khi cần thread chạy rất lâu, cần set priority, apartment state (STA).
- **`ThreadPool`**: pool các worker thread tái sử dụng, có thuật toán hill-climbing tự điều chỉnh số thread.
- **`Task`**: abstraction cấp cao đại diện cho **một công việc** (có thể không gắn thread nào — như I/O). Hỗ trợ continuation, cancellation, exception, `async/await`. Mặc định chạy trên ThreadPool.
- **`Parallel.For/ForEach`**: data parallelism cho **CPU-bound**, chia việc ra nhiều core.
- **`Parallel.ForEachAsync`** (.NET 6): giới hạn độ song song cho tác vụ async.

```csharp
await Task.Run(() => HeavyCompute());                // CPU-bound offload

Parallel.ForEach(images, new ParallelOptions { MaxDegreeOfParallelism = 4 }, Resize);

await Parallel.ForEachAsync(urls, new ParallelOptions { MaxDegreeOfParallelism = 8 },
    async (url, ct) => await DownloadAsync(url, ct));

var thread = new Thread(Worker) { IsBackground = true };
```

**Lưu ý / bẫy thường gặp:**
- Không dùng `Task.Run` để "bọc" I/O async trong ASP.NET Core — lãng phí thread.
- Long-running blocking work trên ThreadPool → **thread pool starvation**; dùng `TaskCreationOptions.LongRunning`.
- `Parallel.ForEach` với lambda `async` → thành `async void`, không chờ được.

## Race condition, deadlock là gì và cách phòng tránh? [senior]
**Race condition**: kết quả phụ thuộc vào thứ tự thực thi không xác định của các thread khi truy cập chung dữ liệu, ít nhất một bên ghi.

```csharp
if (!_cache.ContainsKey(k)) _cache[k] = Load(k);   // check-then-act: race
```

Phòng tránh: lock, `Interlocked`, concurrent collections, **immutability**, tránh shared mutable state, message passing (`Channel<T>`, actor).

**Deadlock** xảy ra khi đủ **4 điều kiện Coffman**: mutual exclusion, hold and wait, no preemption, **circular wait**.

```csharp
// Thread 1: lock(A) { lock(B) {...} }
// Thread 2: lock(B) { lock(A) {...} }   // vòng chờ → deadlock
```

Phòng tránh:
- **Lock ordering** nhất quán (luôn lấy A trước B).
- Giữ lock ngắn nhất có thể, **không gọi code bên ngoài** (callback, event, I/O) khi đang giữ lock.
- Timeout: `Monitor.TryEnter(obj, TimeSpan)`, `SemaphoreSlim.WaitAsync(timeout)`.
- Async: không block async code (`.Result`).
- Database: thứ tự cập nhật bảng nhất quán, transaction ngắn.

Công cụ chẩn đoán: `dotnet-dump analyze` (lệnh `clrstack`, `syncblk`), Visual Studio Parallel Stacks, `dotnet-counters` (theo dõi thread pool queue length).

# Garbage Collection & quản lý tài nguyên

## Garbage Collector trong .NET hoạt động như thế nào? Generations là gì? [mid]
.NET GC là **tracing, generational, compacting** collector:
1. **Mark**: từ các **GC roots** (biến stack, static fields, CPU registers, GC handles), đánh dấu mọi object còn được tham chiếu.
2. **Sweep/Compact**: giải phóng object không được đánh dấu, dồn các object còn sống lại để tránh phân mảnh và cập nhật tham chiếu.

**Generational hypothesis**: hầu hết object chết trẻ.

| Generation | Chứa | Tần suất thu gom |
|---|---|---|
| **Gen 0** | Object mới cấp phát | Rất thường xuyên, rất nhanh |
| **Gen 1** | Sống sót qua Gen 0 (buffer) | Thường |
| **Gen 2** | Object sống lâu (cache, singleton) | Hiếm, đắt (full GC) |
| **LOH** | Object ≥ 85.000 byte | Thu gom cùng Gen 2 |
| **POH** (.NET 5) | Pinned objects | |

Chế độ: **Workstation** vs **Server GC** (mỗi core một heap, throughput cao — mặc định ASP.NET Core), **Background/Concurrent GC** giảm thời gian dừng; .NET 8 có **DATAS** điều chỉnh heap động.

**Lưu ý / bẫy thường gặp:** gọi `GC.Collect()` thủ công gần như luôn là sai — làm object bị đẩy lên generation cao hơn sớm. Mục tiêu tối ưu là **giảm allocation** chứ không phải điều khiển GC.

## Large Object Heap (LOH) là gì? Vấn đề và giải pháp? [senior]
Object có kích thước **≥ 85.000 byte** (thường là array lớn, string lớn) được cấp phát trên **LOH**.

Đặc điểm:
- Chỉ được thu gom khi **Gen 2 GC** (full GC) → đắt.
- Mặc định **không compact** (vì copy object lớn tốn kém) → **phân mảnh** bộ nhớ, có thể gây `OutOfMemoryException` dù tổng bộ nhớ trống vẫn còn.
- Cấp phát trên LOH phải xóa (zero) vùng nhớ → chậm.

Giải pháp:
- **`ArrayPool<T>.Shared`** để thuê/trả buffer thay vì cấp phát mới:

```csharp
var buffer = ArrayPool<byte>.Shared.Rent(1024 * 1024);
try
{
    int read = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length));
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer);
}
```

- `RecyclableMemoryStream` (Microsoft.IO) thay `MemoryStream` cho buffer lớn.
- Xử lý **streaming** (`Stream`, `IAsyncEnumerable`, `System.IO.Pipelines`) thay vì đọc toàn bộ vào `byte[]`/`string`.
- Compact thủ công khi thật cần: `GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;`.

**Lưu ý / bẫy thường gặp:** `List<T>` lớn khi tăng capacity tạo array mới gấp đôi trên LOH — khởi tạo capacity trước nếu biết kích thước. Buffer thuê từ `ArrayPool` có thể **lớn hơn** kích thước yêu cầu.

## IDisposable và using dùng để làm gì? [junior]
GC chỉ quản lý **managed memory**. Tài nguyên **unmanaged** hoặc có hạn (file handle, socket, DB connection, timer, `HttpResponseMessage`) cần được giải phóng **chủ động, xác định thời điểm** → implement `IDisposable`.

`using` đảm bảo `Dispose()` được gọi kể cả khi có exception (biên dịch thành `try/finally`).

```csharp
// using statement
using (var conn = new SqlConnection(cs))
{
    await conn.OpenAsync();
}

// using declaration (C# 8): dispose ở cuối scope
using var file = File.OpenRead(path);
using var reader = new StreamReader(file);

// Async dispose
await using var stream = new FileStream(path, FileMode.Open);
```

`IAsyncDisposable` với `DisposeAsync()` cho tài nguyên cần flush/đóng bất đồng bộ.

Trong DI container (ASP.NET Core), service `Scoped`/`Transient` implement `IDisposable` được container tự dispose khi scope kết thúc — không tự dispose object do container cấp.

**Lưu ý / bẫy thường gặp:** `HttpClient` là ngoại lệ nổi tiếng — tạo và dispose liên tục gây **socket exhaustion**; dùng `IHttpClientFactory` hoặc một instance tĩnh với `SocketsHttpHandler.PooledConnectionLifetime`.

## Finalizer là gì? Dispose pattern đầy đủ? [senior]
**Finalizer** (`~ClassName()`) được GC gọi trước khi thu hồi object — dùng làm **lưới an toàn** khi người dùng quên `Dispose` tài nguyên unmanaged.

Nhược điểm của finalizer:
- Thời điểm chạy **không xác định**; chạy trên **finalizer thread** riêng.
- Object có finalizer **sống thêm ít nhất một chu kỳ GC** (được đưa vào finalization queue rồi f-reachable queue) → bị promote lên generation cao hơn.
- Exception trong finalizer làm crash process.

```csharp
public class NativeResource : IDisposable
{
    private IntPtr _handle;
    private bool _disposed;

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);       // không cần finalizer nữa
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing)
        {
            // giải phóng managed resources (các IDisposable khác)
        }
        // giải phóng unmanaged resources
        CloseHandle(_handle);
        _disposed = true;
    }

    ~NativeResource() => Dispose(disposing: false);
}
```

Trong finalizer (`disposing: false`) **không được** chạm vào managed object khác vì chúng có thể đã bị finalize.

**Khuyến nghị hiện đại:** hầu như không viết finalizer; bọc native handle bằng **`SafeHandle`** (đã có sẵn finalizer đáng tin cậy) và class chỉ cần implement `Dispose` đơn giản.

## Memory leak trong ứng dụng .NET có thể xảy ra như thế nào? Cách chẩn đoán? [senior]
Dù có GC, "leak" xảy ra khi object **vẫn được tham chiếu ngoài ý muốn** từ GC root:

- **Event handler** không unsubscribe: publisher sống lâu (static, singleton) giữ subscriber.
- **Static collections/cache** tăng không giới hạn → dùng `MemoryCache` có expiration/size limit.
- **Closure** capture object lớn trong delegate sống lâu.
- **Timer** (`System.Threading.Timer`) không dispose.
- **DI lifetime sai**: singleton giữ service scoped (captive dependency), `DbContext` bị giữ trong singleton.
- Không dispose `IDisposable` / unmanaged resource, `CancellationTokenSource` có đăng ký callback.
- `ThreadLocal`, `AsyncLocal` giữ dữ liệu lớn.
- LOH fragmentation (không hẳn leak nhưng triệu chứng giống).

Chẩn đoán:

```bash
dotnet-counters monitor -p <pid> --counters System.Runtime
dotnet-gcdump collect -p <pid>
dotnet-dump collect -p <pid>
dotnet-dump analyze dump.dmp
```

Trong `dotnet-dump analyze`: `dumpheap -stat` (loại object chiếm nhiều nhất), `gcroot <address>` (tìm chuỗi tham chiếu giữ object). Công cụ GUI: Visual Studio Diagnostic Tools, **dotMemory**, PerfView.

Giải pháp: weak event pattern, `WeakReference<T>`, `ConditionalWeakTable`, `ValidateScopes` trong DI để phát hiện captive dependency.

# Exceptions & Pattern Matching

## Best practices khi xử lý exception trong C#? throw vs throw ex? [mid]
**`throw;` vs `throw ex;`:**
- `throw;` **giữ nguyên stack trace** gốc.
- `throw ex;` **reset stack trace** về vị trí hiện tại → mất thông tin nơi lỗi xảy ra.

```csharp
try { Process(); }
catch (SqlException ex) when (ex.Number == 1205)    // exception filter (deadlock)
{
    _logger.LogWarning(ex, "Deadlock, retrying");
    throw;                                         // giữ stack trace
}
catch (IOException ex)
{
    throw new DataImportException("Import failed", ex);   // wrap với InnerException
}
```

Best practices:
- **Catch exception cụ thể**, không `catch (Exception)` tràn lan (trừ ở boundary: middleware, top-level handler — và phải log).
- Không dùng exception cho **luồng điều khiển thông thường** (đắt: capture stack trace) → dùng `TryParse`, `TryGetValue`, Result pattern.
- Không nuốt exception (`catch { }`).
- Dùng `finally`/`using` để dọn tài nguyên.
- Custom exception: kế thừa `Exception`, tên kết thúc bằng `Exception`, cung cấp các constructor chuẩn.
- Guard clauses: `ArgumentNullException.ThrowIfNull(arg)`, `ArgumentOutOfRangeException.ThrowIfNegative(x)` (.NET 8).
- Exception filter `when` không unwind stack → tiện cho logging.
- ASP.NET Core: global handler qua `IExceptionHandler` (.NET 8) + `ProblemDetails`.

**Lưu ý / bẫy thường gặp:** `ExceptionDispatchInfo.Capture(ex).Throw()` để ném lại exception ở chỗ khác mà vẫn giữ stack trace.

## Pattern matching trong C# hiện đại gồm những gì? [mid]
C# 7-11 bổ sung nhiều dạng pattern dùng với `is`, `switch` statement và **switch expression**:

```csharp
// Type pattern + declaration
if (shape is Circle { Radius: > 0 } c) Console.WriteLine(c.Radius);

// Switch expression với property, relational, logical patterns
decimal Discount(Order o) => o switch
{
    { Customer.IsVip: true, Total: >= 1000 } => 0.2m,
    { Total: >= 1000 }                       => 0.1m,
    { Total: > 0 and < 100 }                 => 0m,
    null                                     => throw new ArgumentNullException(nameof(o)),
    _                                        => 0.05m,
};

// Tuple pattern
string Rps(string a, string b) => (a, b) switch
{
    ("rock", "scissors") or ("paper", "rock") => "win",
    var (x, y) when x == y                    => "draw",
    _                                         => "lose",
};

// List pattern (C# 11)
if (args is [var first, .., var last]) { }
if (input is not null) { }
```

Các loại pattern: **constant**, **type**, **declaration**, **var**, **discard `_`**, **property** (kể cả extended `A.B: x`), **positional** (dùng `Deconstruct`), **tuple**, **relational** (`<`, `>=`), **logical** (`and`, `or`, `not`), **list** và **slice** (`..`).

**Lưu ý / bẫy thường gặp:** compiler cảnh báo khi switch expression không **exhaustive**; nếu không khớp sẽ ném `SwitchExpressionException`. Thứ tự các arm quan trọng — arm tổng quát đặt trước sẽ "che" arm cụ thể (compile error).

## is null khác == null như thế nào? [junior]
- `x == null` gọi **toán tử `==`** — có thể bị **overload** bởi class (ví dụ `UnityEngine.Object` hay class tự định nghĩa) → kết quả có thể không đúng ý nghĩa "tham chiếu là null".
- `x is null` luôn kiểm tra **tham chiếu null thực sự**, không bị ảnh hưởng bởi overload, và hoạt động với generic type không ràng buộc.

```csharp
if (obj is null) { }
if (obj is not null) { }        // C# 9

T Check<T>(T value)
{
    if (value is null) throw new ArgumentNullException();   // OK với mọi T
    // if (value == null) ... cũng được với generic nhưng khác ngữ nghĩa với struct
    return value;
}

// Kiểm tra null kết hợp type
if (obj is string s) Console.WriteLine(s.Length);   // s chắc chắn not null
```

Các toán tử liên quan:
- `?.` null-conditional: `user?.Address?.City`
- `??` null-coalescing: `name ?? "Guest"`
- `??=` gán nếu null
- `?.` gán (C# 14): `customer?.Order = order;`

**Lưu ý / bẫy thường gặp:** với **record**, `==` được sinh sẵn để so sánh value equality; `is null` vẫn là cách rõ ràng nhất khi kiểm tra null.

# Hiệu năng & tính năng nâng cao

## Span<T> và Memory<T> là gì? Khi nào dùng? [senior]
**`Span<T>`** là `ref struct` biểu diễn một **vùng nhớ liên tục** (array, stack memory qua `stackalloc`, native memory, một phần của string) mà **không copy và không cấp phát**.

```csharp
ReadOnlySpan<char> line = "2024-01-15,VCB,95000";
int comma = line.IndexOf(',');
ReadOnlySpan<char> datePart = line[..comma];        // không tạo string mới
DateOnly date = DateOnly.Parse(datePart);

Span<byte> buffer = stackalloc byte[256];           // stack, không GC
```

Hạn chế của `Span<T>` (vì là `ref struct`, chỉ sống trên stack):
- Không làm field của class, không boxing, không dùng trong lambda capture.
- Không dùng qua `await` hoặc trong iterator (C# 13 nới lỏng với `scoped`/`allows ref struct`).

**`Memory<T>`** là struct thường (có thể nằm trên heap) → dùng được trong **async method**, lưu làm field; gọi `.Span` khi cần xử lý đồng bộ.

```csharp
async Task<int> ReadAsync(Stream s, Memory<byte> buffer)
{
    int n = await s.ReadAsync(buffer);
    return Parse(buffer.Span[..n]);
}
```

| | `Span<T>` | `Memory<T>` |
|---|---|---|
| Kiểu | `ref struct` | `struct` |
| Async / field | Không | Có |
| Hiệu năng | Nhanh nhất | Kém hơn một chút |

Dùng cho: parsing, xử lý buffer mạng/file, hot path giảm allocation. Kết hợp `ArrayPool<T>`, `System.IO.Pipelines`.

## Reflection là gì? Ưu nhược điểm và cách thay thế? [mid]
**Reflection** (`System.Reflection`) cho phép đọc metadata và thao tác với type **lúc runtime**: liệt kê property/method, tạo instance, gọi method, đọc attribute.

```csharp
Type t = typeof(User);
foreach (PropertyInfo p in t.GetProperties(BindingFlags.Public | BindingFlags.Instance))
    Console.WriteLine($"{p.Name}: {p.GetValue(user)}");

object instance = Activator.CreateInstance(t)!;
MethodInfo m = t.GetMethod("Validate")!;
m.Invoke(instance, null);
```

**Ứng dụng:** DI container, serializer (JSON), ORM, test framework, plugin system, model binding trong ASP.NET Core.

**Nhược điểm:**
- **Chậm** hơn gọi trực tiếp nhiều lần (lookup metadata, boxing tham số, kiểm tra quyền).
- Mất type safety, lỗi chỉ phát hiện lúc runtime.
- Có thể phá vỡ encapsulation (truy cập `private`).
- **Không tương thích tốt với trimming và Native AOT**.

**Tối ưu / thay thế:**
- Cache `PropertyInfo`/`MethodInfo`; tạo delegate một lần bằng `Delegate.CreateDelegate` hoặc **compiled Expression Trees**.
- **Source Generators** (sinh code lúc compile): `System.Text.Json` source gen, `[LoggerMessage]`, `[GeneratedRegex]`.
- `UnsafeAccessor` (.NET 8) để truy cập private member nhanh, AOT-friendly.
- Generic static cache `static class Cache<T>`.

## Attributes trong C# là gì? Cách tạo custom attribute? [junior]
**Attribute** là metadata khai báo gắn vào assembly, class, method, property, parameter... Bản thân attribute không làm gì; nó được đọc bởi **compiler**, **runtime/framework** (qua reflection) hoặc **source generator**.

```csharp
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class MaskedAttribute : Attribute
{
    public MaskedAttribute(char maskChar = '*') => MaskChar = maskChar;
    public char MaskChar { get; }
}

public class Customer
{
    [Required, StringLength(100)]
    public string Name { get; set; } = "";

    [Masked('#')]
    public string CardNumber { get; set; } = "";
}

// Đọc attribute
var props = typeof(Customer).GetProperties()
    .Where(p => p.GetCustomAttribute<MaskedAttribute>() is not null);
```

Ví dụ attributes phổ biến: `[Obsolete]`, `[Serializable]`, `[Flags]`, `[HttpGet]`, `[Authorize]`, `[JsonPropertyName]`, `[Required]`, `[Fact]` (xUnit), `[MethodImpl(MethodImplOptions.AggressiveInlining)]`, `[CallerMemberName]`.

C# 11 hỗ trợ **generic attributes**: `[TypeConverter<MyConverter>]`.

**Lưu ý / bẫy thường gặp:** tham số của attribute phải là **hằng số lúc compile** (primitive, string, `typeof`, enum, mảng của chúng). Tên class nên kết thúc bằng `Attribute` (khi dùng có thể bỏ hậu tố).

## Dependency Injection lifetimes trong .NET: Singleton, Scoped, Transient? [mid]
| Lifetime | Instance | Ví dụ phù hợp |
|---|---|---|
| **Transient** | Mới mỗi lần resolve | Service nhẹ, stateless |
| **Scoped** | Một instance mỗi **scope** (mỗi HTTP request) | `DbContext`, unit of work, user context |
| **Singleton** | Một instance cho cả ứng dụng | Cache, configuration, `HttpClient` handler, client SDK thread-safe |

```csharp
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddKeyedSingleton<ICache, RedisCache>("redis");   // .NET 8
```

**Captive dependency** (bẫy phổ biến nhất): **Singleton phụ thuộc Scoped** → service scoped bị "giam" sống suốt vòng đời app (ví dụ `DbContext` dùng chung giữa các request → lỗi thread-safety, dữ liệu cũ). Development mode bật `ValidateScopes` sẽ ném exception.

Dùng scoped service trong singleton/background service:

```csharp
public class Worker(IServiceScopeFactory scopeFactory) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    }
}
```

**Lưu ý / bẫy thường gặp:** singleton phải **thread-safe**; transient implement `IDisposable` resolve từ root provider sẽ bị giữ tới khi app tắt.

# Tính năng C# hiện đại (C# 8 - 13)

## Record và init-only properties (C# 9) là gì? [junior]
**`init` accessor** cho phép gán property **chỉ trong lúc khởi tạo** (constructor hoặc object initializer), sau đó immutable.

```csharp
public class Config
{
    public string Host { get; init; } = "localhost";
    public int Port { get; init; }
}
var c = new Config { Host = "db", Port = 5432 };
// c.Port = 1;  // compile error
```

**Record** là kiểu tập trung vào **dữ liệu** với:
- **Value-based equality** (`Equals`, `GetHashCode`, `==`, `!=` sinh tự động).
- `ToString()` dễ đọc: `Person { Name = An, Age = 30 }`.
- **`with` expression** tạo bản sao có sửa đổi.
- **Positional syntax** sinh constructor, `init` properties, `Deconstruct`.

```csharp
public record Person(string FirstName, string LastName)
{
    public string FullName => $"{FirstName} {LastName}";
}

var p = new Person("An", "Nguyen");
var (first, _) = p;                       // Deconstruct
var p2 = p with { LastName = "Tran" };
```

`record` = `record class` (reference type); `record struct` (C# 10) là value type (mặc định mutable, nên dùng `readonly record struct`).

Phù hợp: **DTO**, Value Object, message/event, kết quả trả về.

**Lưu ý / bẫy thường gặp:** `with` là **shallow copy**; record chứa `List<T>` thì equality so sánh **tham chiếu** của list, không so sánh nội dung. Không nên dùng record cho EF Core entity (equality theo giá trị xung đột với identity tracking).

## Primary constructors (C# 12) hoạt động thế nào? Khác gì record? [mid]
C# 12 cho phép khai báo **primary constructor** cho mọi `class` và `struct`:

```csharp
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    public async Task PlaceAsync(Order order)
    {
        logger.LogInformation("Placing {Id}", order.Id);
        await repo.AddAsync(order);
    }
}

public class Account(string id, decimal balance)
{
    public string Id { get; } = id;               // khởi tạo property từ tham số
    public decimal Balance { get; private set; } = balance;
}
```

Khác biệt với record:
| | Primary ctor (class) | Positional record |
|---|---|---|
| Sinh public property | **Không** | Có (`init`) |
| Value equality, `with`, `Deconstruct` | Không | Có |
| Tham số | Là **biến capture** trong toàn bộ class | Thành property |

**Lưu ý / bẫy thường gặp:**
- Tham số primary constructor **không phải `readonly` field** — có thể bị gán lại trong class. Nếu cần bất biến, gán vào `private readonly` field.
- Nếu vừa dùng tham số trong method vừa khởi tạo property từ nó, compiler sẽ lưu **hai bản** (warning CS9124) → dễ lệch trạng thái.
- Constructor khác phải gọi `this(...)` tới primary constructor.

Rất tiện cho DI trong ASP.NET Core, giảm boilerplate field + constructor.

## Collection expressions (C# 12) là gì? [junior]
Cú pháp thống nhất `[...]` để khởi tạo collection cho nhiều kiểu target: array, `List<T>`, `Span<T>`, `ImmutableArray<T>`, interface như `IEnumerable<T>`...

```csharp
int[] a = [1, 2, 3];
List<string> names = ["An", "Binh"];
Span<int> span = [1, 2, 3];
IReadOnlyList<int> ro = [4, 5];
int[] empty = [];

// Spread operator ..
int[] merged = [..a, 4, ..ro];

// Dùng trực tiếp làm tham số
ProcessIds([1, 2, 3]);
```

Ưu điểm:
- Ngắn gọn, nhất quán giữa các kiểu.
- Compiler chọn cách khởi tạo **tối ưu** cho từng target type (ví dụ biết trước size, dùng `stackalloc`/inline array cho `Span`, `Array.Empty<T>()` cho `[]`).
- Kiểu custom hỗ trợ bằng `[CollectionBuilder(typeof(Builder), "Create")]`.

**Lưu ý / bẫy thường gặp:** collection expression cần **target type** — `var x = [1, 2];` không compile. Khi target là interface (`IEnumerable<T>`), kiểu cụ thể do compiler quyết định — không nên giả định là `List<T>` để ép kiểu.

## required members (C# 11) giải quyết vấn đề gì? [mid]
Object initializer + `init` cho phép immutable nhưng **không bắt buộc** gán → property có thể bị bỏ trống. `required` buộc **caller phải gán** property đó khi khởi tạo; kiểm tra lúc compile.

```csharp
public class User
{
    public required string Email { get; init; }
    public required string Name { get; init; }
    public string? Phone { get; init; }
}

var u = new User { Email = "a@b.com", Name = "An" };   // OK
var bad = new User { Email = "a@b.com" };              // compile error CS9035

public class Admin : User
{
    [SetsRequiredMembers]
    public Admin(string email) { Email = email; Name = "Admin"; }
}
var admin = new Admin("x@y.com");                      // OK nhờ SetsRequiredMembers
```

Lợi ích:
- Kết hợp tốt với **nullable reference types**: property non-nullable mà không cần constructor dài hay gán `= null!`.
- Phù hợp DTO, configuration, options class.
- `System.Text.Json` (.NET 7+) tôn trọng `required` khi deserialize (thiếu field → exception).

**Lưu ý / bẫy thường gặp:** `required` chỉ đảm bảo **được gán**, không đảm bảo giá trị **khác null** hay hợp lệ — vẫn cần validation. Constructor có `[SetsRequiredMembers]` tắt kiểm tra cho mọi required member, nên phải chắc chắn đã gán hết.

## Kể tên các tính năng nổi bật từ C# 8 đến C# 13. [senior]
| Phiên bản | Tính năng nổi bật |
|---|---|
| **C# 8** (.NET Core 3) | Nullable reference types, **async streams** (`IAsyncEnumerable`, `await foreach`), **default interface methods**, switch expression, ranges/indices (`^1`, `..`), `using` declaration, `??=`, static local functions |
| **C# 9** (.NET 5) | **Records**, `init`, top-level statements, pattern matching nâng cao (`and/or/not`, relational), target-typed `new()`, covariant return, function pointers, source generators |
| **C# 10** (.NET 6) | `record struct`, **global using**, **file-scoped namespace**, extended property patterns, constant interpolated strings, lambda cải tiến (natural type, attributes) |
| **C# 11** (.NET 7) | **Raw string literals** `"""`, **required members**, **list patterns**, **generic math** (static abstract interface members), generic attributes, `file` access modifier, UTF-8 literals `"abc"u8` |
| **C# 12** (.NET 8) | **Primary constructors** cho class/struct, **collection expressions**, alias any type (`using Point = (int X, int Y);`), default lambda parameters, inline arrays, `ref readonly` parameters, interceptors (preview) |
| **C# 13** (.NET 9) | **`params` collections** (`params Span<T>`, `params IEnumerable<T>`), `System.Threading.Lock`, `\e` escape, `ref`/`unsafe` trong async/iterator, `allows ref struct`, partial properties, implicit index `^` trong object initializer, overload resolution priority |

```csharp
// Raw string + async streams + params span
var json = """
    { "name": "An" }
    """;
await foreach (var item in GetItemsAsync()) { }
static int Sum(params ReadOnlySpan<int> xs) { int s = 0; foreach (var x in xs) s += x; return s; }
```

C# 14 (.NET 10) tiếp tục với `field` keyword trong property, extension members, null-conditional assignment.

## Default interface methods và static abstract members trong interface? [senior]
**Default interface methods (C# 8)**: interface có thể chứa **implementation mặc định** cho method.
- Mục đích chính: **thêm method vào interface đã public** mà không phá vỡ các class implement cũ (API evolution).
- Method mặc định chỉ gọi được qua **kiểu interface**, không qua kiểu class (trừ khi class tự cài đặt).

```csharp
public interface ILogger
{
    void Log(string message);
    void LogError(Exception ex) => Log($"ERROR: {ex.Message}");   // default impl
}

class ConsoleLogger : ILogger { public void Log(string m) => Console.WriteLine(m); }

ILogger l = new ConsoleLogger();
l.LogError(new Exception("x"));         // OK
// new ConsoleLogger().LogError(...)    // compile error
```

**Static abstract members (C# 11)**: interface khai báo **static member mà type implement bắt buộc phải cung cấp** — nền tảng của **generic math**.

```csharp
public interface IParsable<TSelf> where TSelf : IParsable<TSelf>
{
    static abstract TSelf Parse(string s);
}

static T Sum<T>(IEnumerable<T> xs) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var x in xs) total += x;   // dùng operator + qua interface
    return total;
}
```

**Lưu ý / bẫy thường gặp:** default interface methods dễ dẫn tới "diamond problem" (cần implementation cụ thể nhất, nếu mơ hồ sẽ báo lỗi compile); không nên biến interface thành abstract class trá hình. Static abstract members chỉ dùng được thông qua **generic type parameter**, không gọi trực tiếp trên interface.
