---
topic: csharp
---

## Đoạn code sau in ra gì? [junior]
```csharp
struct P { public int X; }

var a = new P { X = 1 };
var b = a;
b.X = 2;
Console.WriteLine(a.X);
```
- [x] `1`
- [ ] `2`
- [ ] `0`
- [ ] Lỗi biên dịch vì struct không được gán field trực tiếp
> `struct` là value type: phép gán `b = a` copy toàn bộ giá trị, nên sửa `b` không ảnh hưởng `a`. Nếu `P` là `class`, cả hai cùng trỏ một object và kết quả là 2.

## Đoạn code sau in ra gì? [junior]
```csharp
string s = "abc";
s.ToUpper();
Console.WriteLine(s);
```
- [ ] `ABC`
- [x] `abc`
- [ ] Chuỗi rỗng
- [ ] Lỗi biên dịch vì bỏ qua giá trị trả về
> `string` là immutable: `ToUpper()` trả về một chuỗi mới chứ không sửa chuỗi gốc. Phải viết `s = s.ToUpper();`. Bỏ qua giá trị trả về không gây lỗi biên dịch.

## Đoạn code sau in ra gì? [junior]
```csharp
string a = "hi";
string b = new string(new[] { 'h', 'i' });
Console.WriteLine(a == b);
```
- [ ] `False` vì hai biến trỏ tới hai object khác nhau
- [ ] Lỗi biên dịch
- [x] `True`
- [ ] Phụ thuộc vào string interning nên không xác định
> `string` overload toán tử `==` để so sánh nội dung, nên kết quả là True dù là hai instance khác nhau. Chỉ khi ép về `object` thì `==` mới so sánh reference.

## Dòng nào sau đây gây ra boxing? [junior]
- [ ] `int x = 5; long y = x;`
- [ ] `int[] arr = new int[10];`
- [ ] `List<int> list = new() { 5 };`
- [x] `int x = 5; object o = x;`
> Boxing là khi value type được bọc vào một object trên heap, ví dụ gán `int` cho `object` hoặc interface. `List<int>` là generic nên lưu trực tiếp `int`, không boxing; `int` → `long` chỉ là implicit numeric conversion.

## Câu lệnh `using (var conn = new SqlConnection(cs)) { ... }` đảm bảo điều gì? [junior]
- [ ] Connection được mở tự động khi vào block
- [x] `conn.Dispose()` được gọi khi ra khỏi block, kể cả khi có exception
- [ ] GC thu hồi `conn` ngay lập tức khi ra khỏi block
- [ ] Mọi exception trong block bị nuốt
> `using` được compile thành `try/finally` gọi `Dispose()`. Dispose giải phóng tài nguyên unmanaged (trả connection về pool) nhưng không có nghĩa là bộ nhớ object được GC thu hồi ngay.

## Đoạn code sau in ra gì? [junior]
```csharp
int? x = null;
int y = x ?? 10;
Console.WriteLine(y + (x ?? 0));
```
- [ ] Ném `NullReferenceException`
- [ ] `0`
- [ ] Lỗi biên dịch vì không thể cộng `int` với `int?`
- [x] `10`
> `x ?? 10` trả về 10 vì `x` là null, `x ?? 0` trả về 0, tổng là 10. Biểu thức `x ?? 0` có kiểu `int` nên phép cộng hợp lệ.

## Khác biệt chính giữa `const` và `readonly` field? [junior]
- [x] `const` phải có giá trị lúc compile-time; `readonly` có thể được gán trong constructor lúc runtime
- [ ] `readonly` chỉ dùng được cho value type
- [ ] `const` có thể được gán lại trong constructor
- [ ] Không có khác biệt, chỉ là hai cú pháp tương đương
> Giá trị `const` được nhúng trực tiếp vào assembly gọi nó (nên đổi giá trị cần build lại các assembly phụ thuộc), và `const` ngầm định là static. `readonly` dùng được cho mọi kiểu, gán ở khai báo hoặc constructor.

## Đoạn code sau in ra gì? [junior]
```csharp
static int F()
{
    try { return 1; }
    finally { Console.Write("F "); }
}
Console.Write(F());
```
- [ ] `1`
- [ ] `1 F `
- [x] `F 1`
- [ ] Lỗi biên dịch vì không được `return` trong `try` có `finally`
> Khối `finally` luôn chạy trước khi method thực sự trả về, nên "F " được in trước, sau đó `Console.Write` mới in giá trị 1 được trả về.

## Phát biểu nào đúng về từ khóa `var`? [junior]
- [ ] Biến `var` có kiểu động giống `dynamic`, có thể đổi kiểu lúc runtime
- [ ] `var` chỉ dùng được cho kiểu anonymous
- [ ] `var` làm chậm chương trình vì phải suy luận kiểu lúc runtime
- [x] Kiểu được compiler suy luận lúc compile-time và cố định; biến vẫn là strongly typed
> `var x = 5;` hoàn toàn tương đương `int x = 5;` sau khi biên dịch, nên không có chi phí runtime. `dynamic` mới là kiểu được resolve lúc runtime.

## `Console.WriteLine(7 / 2 + 7 % 2);` in ra gì? [junior]
- [ ] `4.5`
- [x] `4`
- [ ] `3.5`
- [ ] `5`
> Hai toán hạng đều là `int` nên `7 / 2` là phép chia nguyên = 3, và `7 % 2` = 1; tổng là 4. Muốn có 3.5 phải dùng `7 / 2.0` hoặc ép kiểu sang `double`.

## Gọi `new List<int>().First()` sẽ xảy ra gì? [junior]
- [ ] Trả về `0`
- [ ] Trả về `null`
- [x] Ném `InvalidOperationException`
- [ ] Ném `IndexOutOfRangeException`
> `First()` ném `InvalidOperationException` ("Sequence contains no elements") khi chuỗi rỗng. `FirstOrDefault()` mới trả về `default(T)`, với `int` là 0.

## Một class C# có thể kế thừa như thế nào? [junior]
- [ ] Kế thừa nhiều class và nhiều interface
- [ ] Chỉ implement một interface
- [ ] Kế thừa nhiều class nhưng không implement interface
- [x] Kế thừa tối đa một class và implement nhiều interface
> C# chỉ hỗ trợ đơn kế thừa class để tránh vấn đề diamond, nhưng cho phép implement nhiều interface. `struct` không kế thừa class nhưng vẫn implement được interface.

## Đoạn code sau in ra gì? [mid]
```csharp
var list = new List<int> { 1, 2, 3 };
var q = list.Where(x => x > 1);
list.Add(4);
Console.WriteLine(q.Count());
```
- [ ] `2`
- [x] `3`
- [ ] `4`
- [ ] Ném `InvalidOperationException` vì collection bị sửa
> LINQ dùng deferred execution: `Where` chỉ tạo query, việc lọc chạy khi `Count()` được gọi, lúc đó list đã có 4 phần tử (2, 3, 4 thỏa điều kiện). Exception "Collection was modified" chỉ xảy ra khi sửa list trong lúc đang enumerate.

## Với EF Core, đoạn code sau làm gì? [mid]
```csharp
IEnumerable<User> users = db.Users;
var adults = users.Where(u => u.Age > 18).ToList();
```
- [ ] Sinh SQL có `WHERE Age > 18`, chỉ lấy user phù hợp
- [ ] Lỗi biên dịch vì `DbSet` không gán được cho `IEnumerable`
- [x] Lấy toàn bộ bảng Users về bộ nhớ rồi lọc bằng LINQ to Objects
- [ ] Ném exception vì EF không dịch được lambda
> Vì biến có kiểu tĩnh `IEnumerable<User>`, overload `Enumerable.Where(Func<>)` được chọn thay vì `Queryable.Where(Expression<>)`, nên filter chạy trên client. Giữ kiểu `IQueryable<User>` để điều kiện được dịch sang SQL.

## Đoạn code sau in ra gì? [mid]
```csharp
record PR(int X);
class PC { public int X; public PC(int x) => X = x; }

Console.WriteLine($"{new PR(1) == new PR(1)} {new PC(1) == new PC(1)}");
```
- [x] `True False`
- [ ] `False False`
- [ ] `True True`
- [ ] `False True`
> `record` được compiler sinh value-based equality (`Equals`, `==`, `GetHashCode` theo các thuộc tính). `class` thông thường dùng reference equality nên hai instance khác nhau luôn khác.

## Đoạn code sau in ra gì? [mid]
```csharp
var actions = new List<Action>();
for (int i = 0; i < 3; i++)
    actions.Add(() => Console.Write(i));
foreach (var a in actions) a();
```
- [ ] `012`
- [ ] `222`
- [x] `333`
- [ ] `000`
> Biến `i` của vòng `for` chỉ có một instance cho toàn bộ vòng lặp, các lambda capture cùng biến đó và đọc giá trị cuối cùng là 3. Từ C# 5, `foreach` tạo biến mới cho mỗi lần lặp nên sẽ in `012`.

## Vì sao nên tránh `async void` (trừ event handler)? [mid]
- [ ] `async void` chạy đồng bộ nên block thread
- [x] Caller không thể `await` hay bắt exception; exception bị ném lên SynchronizationContext và có thể crash process
- [ ] `async void` không được phép dùng `await` bên trong
- [ ] Compiler không cho phép khai báo `async void`
> Không có `Task` trả về nên caller không biết khi nào method xong và `try/catch` bao quanh lời gọi không bắt được exception. Dùng `async Task` để exception được lưu trong Task và rethrow khi await.

## Gọi `GetDataAsync().Result` trong event handler WinForms/WPF (method có `await` không dùng `ConfigureAwait(false)`) dẫn tới điều gì? [mid]
- [ ] Chạy bình thường, chỉ chậm hơn một chút
- [ ] Ném `TaskCanceledException`
- [ ] Compiler cảnh báo và tự chuyển thành `await`
- [x] Deadlock: UI thread bị block chờ Task, còn continuation lại cần UI thread để chạy tiếp
> Continuation sau `await` được post về SynchronizationContext của UI thread, nhưng thread đó đang bị `.Result` block — hai bên chờ nhau mãi. Giải pháp là dùng `async` xuyên suốt ("async all the way").

## Từ khóa `event` thêm ràng buộc gì so với một public field kiểu delegate? [mid]
- [ ] Event chỉ cho phép một subscriber
- [ ] Event tự động chạy handler trên thread pool
- [x] Code bên ngoài class chỉ được `+=`/`-=`, không thể gán `=` hay invoke event
- [ ] Event bắt buộc handler phải là `async`
> `event` đóng gói delegate: chỉ class khai báo mới được raise và thay thế toàn bộ invocation list. Với public delegate field, code bên ngoài có thể `= null` xóa mọi subscriber hoặc tự invoke.

## Đoạn code sau in ra gì? [mid]
```csharp
object o = 5L;
var r = o switch
{
    int i => "int",
    long l when l > 3 => "big long",
    long => "long",
    _ => "other"
};
Console.WriteLine(r);
```
- [ ] `int`
- [ ] `long`
- [ ] `other`
- [x] `big long`
> `5L` là `long` được box nên type pattern `int` không khớp (không có chuyển đổi kiểu ngầm khi unbox). Nhánh `long l when l > 3` khớp trước nhánh `long`, vì switch expression xét các nhánh theo thứ tự.

## Dòng nào sau đây biên dịch thành công? [mid]
- [x] `IEnumerable<object> x = new List<string>();`
- [ ] `List<object> x = new List<string>();`
- [ ] `IList<object> x = new List<string>();`
- [ ] `Action<string> a = (Action<object>)null; Action<object> b = a;`
> `IEnumerable<out T>` là covariant nên `IEnumerable<string>` gán được cho `IEnumerable<object>`. `List<T>` và `IList<T>` invariant vì cho phép ghi. `Action<in T>` là contravariant: gán `Action<object>` cho `Action<string>` được, chiều ngược lại thì không.

## Đoạn code sau in ra gì? [mid]
```csharp
string a = "hello";
string b = "hel" + "lo";
Console.WriteLine((object)a == (object)b);
```
- [ ] `False` vì `b` được tạo lúc runtime
- [x] `True`
- [ ] Lỗi biên dịch vì không thể so sánh `object`
- [ ] Ném `InvalidCastException`
> `"hel" + "lo"` là biểu thức hằng nên compiler gộp thành literal "hello"; mọi literal giống nhau đều được intern thành cùng một instance. Nếu một phần là biến (không phải `const`), phép nối diễn ra lúc runtime và kết quả sẽ là False.

## Khác biệt giữa `throw;` và `throw ex;` trong khối `catch (Exception ex)`? [mid]
- [ ] Không có khác biệt
- [ ] `throw;` nuốt exception, `throw ex;` ném lại
- [ ] `throw ex;` giữ nguyên stack trace, `throw;` reset stack trace
- [x] `throw;` giữ nguyên stack trace gốc, `throw ex;` reset stack trace về vị trí catch
> `throw ex;` khiến stack trace bắt đầu từ dòng rethrow, làm mất thông tin nơi lỗi thực sự xảy ra. Nếu cần rethrow ở chỗ khác mà vẫn giữ stack, dùng `ExceptionDispatchInfo.Capture(ex).Throw()`.

## Trong Dispose pattern, vì sao `Dispose()` thường gọi `GC.SuppressFinalize(this)`? [mid]
- [x] Tài nguyên đã được giải phóng nên không cần chạy finalizer; object không phải qua finalization queue và được thu hồi sớm hơn
- [ ] Để GC thu hồi object ngay lập tức tại dòng đó
- [ ] Để ngăn object bị dùng lại sau khi dispose
- [ ] Vì nếu không gọi, `Dispose()` sẽ bị chạy hai lần
> Object có finalizer phải sống thêm ít nhất một chu kỳ GC (được đưa lên generation cao hơn) để finalizer thread chạy. `SuppressFinalize` loại bỏ chi phí đó khi đã dọn dẹp tất định; nó không kích hoạt GC và không ngăn dùng lại object (cần tự kiểm tra cờ `_disposed`).

## Đoạn code sau in ra gì? [senior]
```csharp
int count = 0;
Parallel.For(0, 100_000, _ => count++);
Console.WriteLine(count);
```
- [x] Một số không xác định, thường nhỏ hơn 100000
- [ ] Luôn là `100000`
- [ ] Lỗi biên dịch vì không được sửa biến capture trong lambda
- [ ] Luôn ném `AggregateException` do race condition
> `count++` gồm đọc–cộng–ghi, không atomic, nên các thread ghi đè kết quả của nhau (lost update) mà không có exception nào. Sửa bằng `Interlocked.Increment(ref count)` hoặc dùng overload `Parallel.For` có thread-local state rồi cộng dồn.

## Phát biểu nào đúng về `ValueTask<T>`? [senior]
- [ ] Luôn nhanh hơn `Task<T>` nên nên thay thế mọi `Task<T>`
- [ ] Có thể `await` nhiều lần và gọi `.Result` an toàn như `Task<T>`
- [x] Chỉ nên được await đúng một lần; nếu cần await nhiều lần hoặc kết hợp `WhenAll`, phải gọi `.AsTask()`
- [ ] Là reference type nên được cache tự động
> `ValueTask<T>` là struct, giúp tránh cấp phát khi kết quả thường hoàn thành đồng bộ, nhưng nó có thể bọc một `IValueTaskSource` được pool và tái sử dụng — await lần hai có thể đọc nhầm kết quả của thao tác khác. Với đường async thực sự, nó không nhanh hơn `Task<T>`.

## Phát biểu nào đúng về `ConfigureAwait(false)`? [senior]
- [ ] Làm cho method chạy đồng bộ
- [x] Continuation không được post về SynchronizationContext/TaskScheduler đã capture, mà chạy trên thread pool; trong ASP.NET Core (không có SynchronizationContext) hiệu quả hầu như không đáng kể
- [ ] Ngăn exception được ném ra khi await
- [ ] Bắt buộc dùng trong ASP.NET Core để tránh deadlock
> Code thư viện nên dùng `ConfigureAwait(false)` để không phụ thuộc context của caller (tránh deadlock sync-over-async ở UI/ASP.NET cũ). ASP.NET Core không có SynchronizationContext nên không gặp deadlock kiểu này.

## Đoạn code sau in ra gì? [senior]
```csharp
interface IInc { void Inc(); }
struct C : IInc { public int V; public void Inc() => V++; }

var c = new C();
IInc i = c;
i.Inc();
i.Inc();
Console.WriteLine($"{c.V} {((C)i).V}");
```
- [ ] `2 2`
- [ ] `0 0`
- [x] `0 2`
- [ ] `2 0`
> Gán struct cho interface gây boxing: `i` trỏ tới bản copy trên heap. `Inc()` sửa bản boxed nên `c.V` vẫn 0, còn unbox `(C)i` cho ra 2. Đây là lý do mutable struct rất dễ gây bug.

## Đoạn code sau in ra gì? [senior]
```csharp
struct Counter { public int V; public void Inc() => V++; }
class Holder
{
    public readonly Counter C;
    public void Run() { C.Inc(); C.Inc(); Console.WriteLine(C.V); }
}
new Holder().Run();
```
- [ ] `2`
- [ ] Lỗi biên dịch vì gọi method trên readonly field
- [ ] `1`
- [x] `0`
> Khi gọi method non-readonly trên một `readonly` struct field, compiler tạo defensive copy để đảm bảo field không bị sửa, nên mỗi `Inc()` chỉ tác động lên bản sao. Khai báo `readonly struct` hoặc `readonly` member giúp tránh copy ngầm này.

## Phát biểu nào đúng về `Span<T>`? [senior]
- [ ] `Span<T>` có thể làm field của class và được capture trong lambda
- [ ] `Span<T>` luôn cấp phát bộ nhớ mới trên heap khi slice
- [ ] `Span<T>` chỉ trỏ được tới mảng managed
- [x] `Span<T>` là `ref struct`, chỉ sống trên stack: không thể làm field của class, không bị box và không thể giữ qua một `await`
> Ràng buộc ref struct đảm bảo Span không sống lâu hơn vùng nhớ nó trỏ tới (mảng, `stackalloc`, native memory). Slice không cấp phát. Khi cần lưu trên heap hoặc qua await, dùng `Memory<T>`.

## Object có kích thước bao nhiêu thì được cấp phát trên Large Object Heap (LOH) trong .NET? [senior]
- [ ] Từ 1 MB trở lên
- [x] Từ 85.000 byte trở lên
- [ ] Từ 4 KB trở lên (bằng một trang bộ nhớ)
- [ ] LOH chỉ dành cho string
> Object ≥ 85.000 byte vào LOH, được thu gom cùng Gen 2 và mặc định không bị compact, nên dễ gây phân mảnh. Vì vậy nên dùng `ArrayPool<T>` cho buffer lớn cấp phát thường xuyên.

## Vì sao đoạn code sau không biên dịch được và cách sửa? [senior]
```csharp
lock (_sync)
{
    await SaveAsync();
}
```
- [ ] `lock` chỉ nhận value type
- [ ] Thiếu `ConfigureAwait(false)`; thêm vào sẽ biên dịch được
- [x] Không được `await` trong `lock` vì Monitor gắn với thread, mà continuation có thể chạy trên thread khác; dùng `SemaphoreSlim.WaitAsync()`
- [ ] Phải đổi `_sync` thành `static`
> Monitor yêu cầu thread release phải là thread đã acquire; sau `await` code có thể tiếp tục trên thread khác, nên compiler cấm (CS1996). `SemaphoreSlim` không có thread affinity và hỗ trợ chờ bất đồng bộ.

## Khi `await Task.WhenAll(t1, t2)` và cả hai task đều fault, điều gì xảy ra? [senior]
- [ ] Ném `AggregateException` chứa cả hai exception
- [x] `await` chỉ rethrow exception đầu tiên; toàn bộ exception nằm trong `task.Exception.InnerExceptions` của task WhenAll
- [ ] Exception bị nuốt, cần kiểm tra `IsFaulted` thủ công
- [ ] Ném exception của task hoàn thành fault sau cùng
> `await` unwrap `AggregateException` và chỉ ném exception đầu tiên để code `catch` tự nhiên hơn. Muốn log đủ, giữ tham chiếu tới task WhenAll và đọc `Exception.InnerExceptions`; `.Wait()`/`.Result` mới ném `AggregateException`.

## Đoạn code sau in ra gì? [senior]
```csharp
IEnumerable<int> Gen()
{
    try
    {
        yield return 1;
        yield return 2;
    }
    finally { Console.Write("F"); }
}
foreach (var x in Gen()) { Console.Write(x); break; }
```
- [ ] `1`
- [ ] `12F`
- [ ] `F1`
- [x] `1F`
> `foreach` gọi `Dispose()` trên enumerator khi thoát vòng lặp (kể cả bằng `break`), và `Dispose()` của iterator chạy các khối `finally` đang chờ. Nếu tự gọi `MoveNext()` mà không dispose, "F" sẽ không bao giờ được in.

## Phát biểu nào đúng về nullable reference types (`#nullable enable`)? [senior]
- [ ] Runtime tự ném `ArgumentNullException` khi gán null cho `string`
- [ ] `string?` và `string` là hai kiểu khác nhau trong IL
- [x] Chỉ là phân tích tĩnh lúc compile: sinh warning, không thêm kiểm tra runtime; toán tử `!` chỉ tắt warning
- [ ] Làm `Nullable<T>` áp dụng được cho class
> NRT được biểu diễn bằng attribute metadata (`NullableAttribute`), cùng một kiểu `System.String` trong IL. Vẫn phải validate input ở public API (ví dụ `ArgumentNullException.ThrowIfNull`) vì caller có thể tắt NRT hoặc dùng `!`.

## Đoạn code EF Core sau gây ra gì? [senior]
```csharp
bool IsVip(Customer c) => c.Orders.Count > 10;
var vips = db.Customers.Where(c => IsVip(c)).ToList();
```
- [ ] EF Core tự dịch nội dung `IsVip` sang SQL
- [ ] EF Core âm thầm load toàn bộ bảng rồi lọc trên client
- [x] Ném `InvalidOperationException` vì không dịch được method C# tùy ý sang SQL
- [ ] Lỗi biên dịch vì lambda gọi method local
> Từ EF Core 3.0, client evaluation chỉ được phép ở `Select` cuối cùng; ở `Where` nó ném exception "could not be translated". EF chỉ thấy lời gọi method chứ không thấy nội dung method, nên phải viết điều kiện trực tiếp trong expression (`c.Orders.Count > 10`).
