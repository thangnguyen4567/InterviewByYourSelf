---
topic: dotnet
---

## Trong .NET, vai trò của JIT compiler là gì? [junior]
- [ ] Biên dịch C# thành IL lúc build
- [x] Biên dịch IL thành native code tại runtime, khi method được gọi lần đầu
- [ ] Thu gom bộ nhớ không còn được tham chiếu
- [ ] Kiểm tra cú pháp C# trước khi chạy
> Compiler C# (Roslyn) sinh IL lúc build; JIT của CLR mới dịch IL sang mã máy lúc chạy. Thu gom bộ nhớ là việc của GC, không phải JIT.

## Service đăng ký bằng `AddScoped` được tạo bao nhiêu lần trong ASP.NET Core? [junior]
- [ ] Một lần cho toàn ứng dụng
- [ ] Mỗi lần được inject
- [x] Một lần cho mỗi HTTP request (scope)
- [ ] Mỗi thread một instance
> Scoped tạo một instance cho mỗi scope, và ASP.NET Core tạo một scope cho mỗi request. "Mỗi lần inject" là hành vi của Transient.

## Service đăng ký bằng `AddTransient` có đặc điểm nào? [junior]
- [x] Tạo instance mới mỗi lần được resolve từ container
- [ ] Tạo một instance cho mỗi request
- [ ] Tạo một instance duy nhất và tái sử dụng mãi
- [ ] Chỉ được tạo khi ứng dụng khởi động
> Transient luôn tạo mới mỗi lần resolve, kể cả nhiều lần trong cùng một request. Một instance mỗi request là Scoped.

## Khác biệt giữa `app.Use(...)` và `app.Run(...)` trong pipeline middleware? [junior]
- [ ] `Use` chỉ chạy ở môi trường Development
- [ ] `Run` chạy song song với các middleware khác
- [ ] `Use` là terminal middleware, `Run` gọi tiếp middleware kế tiếp
- [x] `Run` là terminal middleware (không có `next`), `Use` có thể gọi `next` để chuyển tiếp
> `Run` kết thúc pipeline nên các middleware đăng ký sau nó không bao giờ chạy. `Use` nhận delegate `next` và quyết định có gọi tiếp hay short-circuit.

## Với `WebApplication.CreateBuilder` mặc định, key `ConnectionStrings:Default` có trong cả `appsettings.json` và environment variable. Giá trị nào được dùng? [junior]
- [ ] Giá trị trong `appsettings.json`, vì file được đọc trước
- [x] Giá trị từ environment variable, vì provider đăng ký sau ghi đè provider trước
- [ ] Ứng dụng ném exception vì key bị trùng
- [ ] Giá trị được nối lại thành một chuỗi
> Thứ tự mặc định: appsettings.json → appsettings.{Env}.json → User Secrets (Development) → environment variables → command-line; provider sau thắng. Đọc trước không có nghĩa là ưu tiên cao hơn.

## Khi nào nên dùng `AsNoTracking()` trong EF Core? [junior]
- [ ] Khi cần cập nhật entity rồi gọi `SaveChanges()`
- [ ] Khi muốn EF tự động load navigation property
- [x] Khi query chỉ đọc dữ liệu, không cần sửa và lưu lại
- [ ] Khi muốn bật lazy loading
> `AsNoTracking` bỏ qua change tracker nên nhanh hơn và tốn ít bộ nhớ hơn cho query chỉ đọc. Nếu cần sửa rồi `SaveChanges`, entity phải được track (hoặc attach lại).

## Người dùng đã đăng nhập hợp lệ nhưng không có quyền truy cập endpoint. ASP.NET Core mặc định trả về status code nào? [junior]
- [ ] 401 Unauthorized
- [ ] 400 Bad Request
- [ ] 404 Not Found
- [x] 403 Forbidden
> 403 (Forbid) nghĩa là đã xác thực nhưng không đủ quyền. 401 (Challenge) dành cho request chưa xác thực hoặc token không hợp lệ.

## Controller có attribute `[ApiController]`, model gửi lên vi phạm `[Required]`. Điều gì xảy ra? [junior]
- [x] Framework tự động trả về 400 với `ValidationProblemDetails`, action không được gọi
- [ ] Action vẫn chạy, developer phải tự kiểm tra `ModelState.IsValid`
- [ ] Framework ném `ValidationException` và trả 500
- [ ] Thuộc tính vi phạm được gán giá trị mặc định rồi tiếp tục
> `[ApiController]` bật automatic HTTP 400 response khi ModelState không hợp lệ. Không có `[ApiController]` thì action mới chạy và phải tự kiểm tra `ModelState.IsValid`.

## Trong `Microsoft.Extensions.Logging`, log level nào nghiêm trọng nhất? [junior]
- [ ] Error
- [x] Critical
- [ ] Warning
- [ ] Fatal
> Thứ tự: Trace < Debug < Information < Warning < Error < Critical. "Fatal" là tên level của Serilog/NLog, không phải của `LogLevel` trong .NET.

## Cần ghi đè config `Logging:LogLevel:Default` bằng environment variable trên Linux. Tên biến đúng là gì? [junior]
- [ ] `Logging:LogLevel:Default`
- [ ] `Logging.LogLevel.Default`
- [x] `Logging__LogLevel__Default`
- [ ] `LOGGING-LOGLEVEL-DEFAULT`
> Dấu `:` không dùng được trong tên env var ở mọi nền tảng, nên .NET dùng double underscore `__` thay cho dấu phân cấp. Dấu chấm và gạch ngang không được hiểu là phân cấp.

## Phát biểu nào đúng về .NET Framework 4.8 và .NET 8? [junior]
- [ ] Cả hai đều chạy được trên Linux
- [x] .NET 8 cross-platform (Windows, Linux, macOS), còn .NET Framework chỉ chạy trên Windows
- [ ] .NET Framework 4.8 mới hơn .NET 8
- [ ] .NET 8 không hỗ trợ ASP.NET Core
> .NET (Core/5+) là nền tảng cross-platform, open source; .NET Framework 4.8.x là bản cuối của dòng Framework, chỉ cho Windows và chỉ còn được bảo trì.

## Trong xUnit, muốn chạy cùng một test với nhiều bộ dữ liệu đầu vào, dùng gì? [junior]
- [ ] `[Fact]` lặp lại nhiều lần
- [ ] `[TestCase]`
- [ ] `[TestMethod]` kèm `[DataRow]`
- [x] `[Theory]` kèm `[InlineData]` (hoặc `[MemberData]`)
> xUnit dùng `[Theory]` cho data-driven test. `[TestCase]` là của NUnit, `[TestMethod]`/`[DataRow]` là của MSTest.

## Đoạn code sau có vấn đề gì? [mid]
```csharp
builder.Services.AddDbContext<AppDbContext>();
builder.Services.AddSingleton<ReportService>(); // ReportService inject AppDbContext qua constructor
```
- [ ] Không có vấn đề
- [ ] Lỗi compile
- [x] Captive dependency: DbContext (scoped) bị singleton giữ suốt vòng đời ứng dụng
- [ ] DbContext bị dispose mỗi request nên luôn NullReferenceException
> Singleton giữ DbContext mãi, dùng chung giữa các request đồng thời nên không thread-safe và change tracker phình to. Ở Development, scope validation sẽ ném exception khi resolve; nó không phải lỗi compile.

## Pipeline sau gặp lỗi gì? [mid]
```csharp
app.UseRouting();
app.UseAuthorization();
app.UseAuthentication();
app.MapControllers();
```
- [ ] Không lỗi, thứ tự giữa hai middleware này không quan trọng
- [x] Authorization chạy khi `HttpContext.User` chưa được xác thực, nên endpoint có `[Authorize]` luôn bị từ chối
- [ ] Routing không hoạt động vì phải đặt sau Authorization
- [ ] Authentication sẽ chạy hai lần
> `UseAuthentication` phải chạy trước `UseAuthorization` để gán `User` từ token/cookie. Đặt ngược lại thì authorization chỉ thấy user anonymous và trả 401 dù token hợp lệ.

## Khác biệt chính giữa `IOptionsSnapshot<T>` và `IOptionsMonitor<T>`? [mid]
- [ ] `IOptionsSnapshot` là singleton, `IOptionsMonitor` là scoped
- [ ] Chỉ `IOptionsSnapshot` đọc lại được khi file config thay đổi
- [ ] `IOptionsMonitor` không hỗ trợ named options
- [x] `IOptionsSnapshot` là scoped (tính lại mỗi request); `IOptionsMonitor` là singleton, luôn trả giá trị mới nhất và có `OnChange`
> Vì là scoped, `IOptionsSnapshot` không inject được vào singleton; `IOptionsMonitor` thì được. Cả hai đều phản ánh thay đổi config, chỉ `IOptions<T>` là cố định sau lần đọc đầu.

## `BackgroundService` cần dùng `AppDbContext` (scoped) mỗi lần xử lý job. Cách đúng là gì? [mid]
- [x] Inject `IServiceScopeFactory`, tạo scope cho mỗi lần xử lý rồi resolve DbContext từ scope đó
- [ ] Inject trực tiếp `AppDbContext` vào constructor của BackgroundService
- [ ] Đổi DbContext sang `AddSingleton`
- [ ] Gọi `new AppDbContext()` một lần và dùng mãi
> Hosted service là singleton nên không được giữ service scoped. Tạo scope ngắn cho mỗi đơn vị công việc đảm bảo DbContext được dispose đúng lúc; đổi DbContext thành singleton gây lỗi thread-safety.

## Đoạn code sau (lazy loading đang bật) gây ra vấn đề gì và sửa thế nào? [mid]
```csharp
var orders = await db.Orders.ToListAsync();
foreach (var o in orders)
    Console.WriteLine(o.Customer.Name);
```
- [ ] Không có vấn đề vì EF Core tự cache Customer
- [ ] Lỗi deadlock, sửa bằng `ConfigureAwait(false)`
- [x] N+1 query, sửa bằng `Include(o => o.Customer)` hoặc projection `Select` lấy đúng cột cần
- [ ] Lỗi `NullReferenceException`, sửa bằng `AsNoTracking()`
> Mỗi lần truy cập `o.Customer` sinh thêm một query, tổng cộng 1 + N. `AsNoTracking` không giải quyết N+1; eager loading hoặc projection gom về một query.

## Vì sao nên dùng `IHttpClientFactory` thay vì `new HttpClient()` trong mỗi request? [mid]
- [ ] Vì `HttpClient` không hỗ trợ async
- [x] Tránh socket exhaustion và vẫn cập nhật DNS nhờ pool và xoay vòng `HttpMessageHandler` theo lifetime
- [ ] Vì `HttpClient` không thể gửi header Authorization
- [ ] Vì factory tự cache response HTTP
> Tạo/dispose `HttpClient` liên tục để lại nhiều socket ở TIME_WAIT; còn một `HttpClient` static sống mãi thì không nhận thay đổi DNS. Factory pool handler (mặc định 2 phút) để giải quyết cả hai.

## Trong MVC filter pipeline, filter nào có thể chạy trước model binding? [mid]
- [ ] Action filter
- [ ] Result filter
- [ ] Exception filter
- [x] Resource filter (sau Authorization filter)
> Thứ tự: Authorization → Resource → model binding → Action → Result; Exception filter xử lý lỗi phát sinh. Action filter chạy sau model binding nên đã thấy argument được bind.

## Trong ASP.NET Core, gọi `.Result` hoặc `.Wait()` trên Task trong controller gây vấn đề chính nào khi tải cao? [mid]
- [ ] Deadlock do `SynchronizationContext` như ASP.NET cổ điển
- [ ] Compile error
- [x] Thread pool starvation: thread bị block chờ I/O, request mới phải chờ thread, latency tăng vọt
- [ ] Task bị chạy hai lần
> ASP.NET Core không có `SynchronizationContext` nên không deadlock kiểu cổ điển, nhưng sync-over-async chiếm thread trong lúc chờ I/O. Dưới tải, thread pool tăng thread chậm nên hệ thống nghẽn.

## Câu log sau có vấn đề gì? [mid]
```csharp
_logger.LogInformation($"Order {order.Id} created by {userId}");
```
- [ ] Không có vấn đề, đây là cách khuyến nghị
- [x] Mất structured logging (không có property `OrderId`, `UserId`) và luôn tốn chi phí format chuỗi kể cả khi level bị tắt
- [ ] Lỗi runtime vì thiếu tham số
- [ ] Log sẽ bị ghi ở level Error
> Nên dùng message template `LogInformation("Order {OrderId} created by {UserId}", order.Id, userId)` để sink như Seq/Elastic index được property. String interpolation tạo chuỗi trước khi logger kiểm tra level.

## Một JWT access token (hết hạn sau 7 ngày) bị lộ. Phát biểu nào đúng? [mid]
- [ ] Server có thể thu hồi ngay vì JWT được lưu trong session
- [ ] Đổi mật khẩu người dùng sẽ tự làm token mất hiệu lực
- [ ] Token sẽ hết hiệu lực khi user đăng xuất trên client
- [x] Token stateless vẫn hợp lệ đến khi hết hạn, trừ khi có cơ chế denylist/introspection; nên dùng access token ngắn hạn kèm refresh token
> JWT bearer được validate bằng chữ ký và `exp`, server không tra cứu trạng thái. Đổi mật khẩu hay đăng xuất không ảnh hưởng token đã phát, trừ khi tự thêm kiểm tra (vd. security stamp, denylist).

## Ứng dụng chạy 3 instance sau load balancer, dùng `IMemoryCache` cho danh mục sản phẩm. Khi admin sửa sản phẩm, vấn đề gì xảy ra? [mid]
- [x] Chỉ instance xử lý request sửa được xoá cache, các instance khác trả dữ liệu cũ đến khi hết hạn
- [ ] Cache tự đồng bộ giữa các instance
- [ ] `IMemoryCache` ném exception khi có nhiều instance
- [ ] Load balancer tự xoá cache trên mọi instance
> `IMemoryCache` nằm trong bộ nhớ process. Cần distributed cache (Redis), HybridCache kèm cơ chế invalidation, hoặc pub/sub để báo các node xoá cache.

## Đoạn code sau ném exception gì? [mid]
```csharp
var t1 = db.Users.CountAsync();
var t2 = db.Orders.CountAsync();
await Task.WhenAll(t1, t2); // cùng một instance DbContext
```
- [ ] Không lỗi, hai query chạy song song nhanh hơn
- [x] `InvalidOperationException`: một operation thứ hai bắt đầu trên context trước khi operation trước hoàn tất
- [ ] `DbUpdateConcurrencyException`
- [ ] `TimeoutException`
> DbContext không thread-safe và không hỗ trợ nhiều operation song song. Muốn chạy song song thì mỗi task dùng một DbContext riêng (vd. qua `IDbContextFactory`).

## Hai người cùng sửa một `Product` có property `[Timestamp] byte[] RowVersion`. Người thứ hai gọi `SaveChanges` sau. Điều gì xảy ra và nên xử lý thế nào? [senior]
- [ ] Bản ghi của người thứ hai ghi đè lên, EF không phát hiện được
- [ ] Database lock bản ghi cho đến khi người thứ nhất commit
- [x] EF ném `DbUpdateConcurrencyException` vì UPDATE ... WHERE RowVersion = @old ảnh hưởng 0 dòng; bắt lỗi, reload giá trị DB rồi merge hoặc báo người dùng
- [ ] EF tự động retry cho đến khi thành công
> Optimistic concurrency không lock, chỉ kiểm tra token trong mệnh đề WHERE. Last-write-wins chỉ xảy ra khi không có concurrency token; retry mù sẽ ghi đè thay đổi của người khác.

## Team muốn dùng Native AOT cho một API chạy serverless để giảm cold start. Đánh giá nào chính xác nhất? [senior]
- [ ] Native AOT tương thích mọi thư viện, chỉ cần bật `PublishAot`
- [ ] Native AOT làm chậm startup nhưng tăng throughput
- [ ] Native AOT chỉ khả dụng trên Windows
- [x] Startup nhanh và tốn ít bộ nhớ hơn, nhưng phải trim-safe, không có dynamic code generation, MVC controllers không được hỗ trợ (dùng Minimal API + source generator)
> AOT biên dịch trước toàn bộ sang native và trim code, nên reflection động hoặc `Reflection.Emit` bị hạn chế. Đổi lại throughput đỉnh có thể thấp hơn JIT có Dynamic PGO, chứ không phải startup chậm hơn.

## API chạy 5 pod Kubernetes, mỗi pod gọi `db.Database.Migrate()` lúc khởi động. Cách tiếp cận nào phù hợp nhất cho production? [senior]
- [ ] Giữ nguyên vì EF Core luôn xử lý tốt nhiều pod chạy migration đồng thời
- [x] Tách migration thành bước riêng trong CD pipeline (idempotent SQL script hoặc migration bundle) chạy trước khi rollout app
- [ ] Chuyển sang `Database.EnsureCreated()` cho an toàn
- [ ] Cho pod đầu tiên chạy migration bằng cách `Thread.Sleep` ngẫu nhiên ở các pod khác
> Chạy migration lúc startup buộc app có quyền DDL, làm startup chậm/fail khi migration lỗi và khó kiểm soát rollback. `EnsureCreated` bỏ qua hoàn toàn hệ thống migrations nên không dùng được để nâng cấp schema.

## Typed client `PaymentClient` (đăng ký bằng `AddHttpClient<PaymentClient>`) được inject vào một singleton. Sau vài giờ, gateway đổi IP và mọi request đều lỗi. Nguyên nhân và cách sửa? [senior]
- [ ] Do `HttpClient` không hỗ trợ DNS, phải hardcode IP
- [ ] Do Polly retry quá nhiều lần
- [x] Singleton giữ mãi HttpClient/handler nên không được xoay vòng; dùng `IHttpClientFactory` trong singleton, hoặc `SocketsHttpHandler` với `PooledConnectionLifetime`
- [ ] Do typed client là singleton nên bị dispose sớm
> Typed client được đăng ký transient; khi bị singleton capture, handler không bao giờ được thay mới nên giữ kết nối tới IP cũ. Giới hạn lifetime của connection mới giúp DNS được resolve lại.

## Key cache "top-products" hết hạn đúng giờ cao điểm, hàng trăm request cùng query DB nặng khiến DB quá tải. Giải pháp phù hợp nhất? [senior]
- [x] Chống cache stampede: chỉ cho một request tính lại cho mỗi key (single-flight/lock, hoặc `HybridCache` trong .NET 9+), kèm jitter cho expiration
- [ ] Dùng `IMemoryCache.GetOrCreateAsync` vì nó đã đảm bảo factory chỉ chạy một lần
- [ ] Giảm TTL xuống 1 giây để dữ liệu luôn mới
- [ ] Tăng connection pool size của DB
> `IMemoryCache.GetOrCreateAsync` không có khoá theo key nên nhiều request vẫn chạy factory đồng thời. `HybridCache` gộp các lời gọi đồng thời cho cùng key; giảm TTL chỉ làm stampede xảy ra thường xuyên hơn.

## Yêu cầu: chỉ tác giả mới được sửa bài viết của mình. Cách triển khai đúng trong ASP.NET Core? [senior]
- [ ] `[Authorize(Roles = "Author")]` trên action
- [ ] Một policy kiểm tra claim `sub` trong `[Authorize(Policy = "...")]`
- [ ] Middleware kiểm tra URL chứa userId
- [x] Load bài viết rồi gọi `IAuthorizationService.AuthorizeAsync(User, post, requirement)` với handler so sánh `post.AuthorId` và user hiện tại
> Đây là resource-based authorization: quyết định cần dữ liệu của resource, mà attribute `[Authorize]` chạy trước khi action load resource. Role "Author" chỉ cho biết user là tác giả nói chung, không phải tác giả của bài này.

## Query `Include(o => o.Items).Include(o => o.Payments).Include(o => o.Notes)` trả về rất chậm và tốn băng thông dù số order ít. Nguyên nhân và cách xử lý? [senior]
- [ ] Do change tracking, thêm `AsNoTracking()` là đủ
- [x] Cartesian explosion do JOIN nhiều collection; dùng `AsSplitQuery()` hoặc projection chỉ lấy dữ liệu cần
- [ ] Do lazy loading, tắt lazy loading
- [ ] Do thiếu `ToListAsync()`
> JOIN ba collection nhân số dòng (Items × Payments × Notes) cho mỗi order. Split query tách thành nhiều query riêng, đổi lại thêm round-trip và không đảm bảo consistency giữa các query nếu không có transaction.

## Trên .NET 8, `ExecuteAsync` của một `BackgroundService` ném exception không được bắt. Hành vi mặc định là gì? [senior]
- [ ] Exception bị nuốt, service ngừng chạy nhưng app vẫn chạy bình thường
- [ ] Service tự restart sau 5 giây
- [x] Exception được log và host bị dừng (`BackgroundServiceExceptionBehavior.StopHost`)
- [ ] Exception được chuyển cho global exception handler middleware
> Từ .NET 6, mặc định là `StopHost`; trước đó exception bị nuốt âm thầm. Vì vậy nên bọc logic trong vòng lặp bằng try/catch và log; middleware chỉ xử lý exception trong HTTP pipeline.

## API có latency p99 tăng từ 50ms lên 10s khi tải tăng, nhưng CPU chỉ 20%, `dotnet-counters` cho thấy ThreadPool Queue Length và Thread Count tăng liên tục. Nguyên nhân có khả năng nhất? [senior]
- [ ] GC Gen2 chạy liên tục
- [ ] Database thiếu index
- [ ] Memory leak trong static dictionary
- [x] Thread pool starvation do code sync-over-async (`.Result`, `.Wait()`, I/O đồng bộ) block thread
> CPU thấp nhưng work item xếp hàng và thread count leo dần là dấu hiệu kinh điển của starvation. Thiếu index làm từng query chậm nhưng không làm queue length thread pool tăng như vậy nếu code async đúng.

## Endpoint xuất file mỗi request cấp phát `new byte[1_000_000]`, monitoring thấy Gen2 GC tăng mạnh. Cải thiện phù hợp nhất? [senior]
- [x] Dùng `ArrayPool<byte>.Shared` để thuê/trả buffer, hoặc stream dữ liệu trực tiếp ra response thay vì buffer toàn bộ
- [ ] Gọi `GC.Collect()` sau mỗi request
- [ ] Chuyển sang Workstation GC
- [ ] Tăng kích thước Gen0
> Mảng từ 85.000 byte trở lên vào Large Object Heap, chỉ được thu gom cùng Gen2 nên gây Gen2 GC tốn kém. `GC.Collect()` thủ công thường làm hiệu năng tệ hơn.

## Integration test dùng EF Core InMemory provider đều pass, nhưng production lỗi vi phạm unique constraint và transaction. Khuyến nghị nào phù hợp nhất? [senior]
- [ ] Viết thêm unit test mock `DbSet`
- [ ] Thay InMemory bằng SQLite in-memory là tương đương hoàn toàn production
- [x] Chạy integration test với database thật cùng engine (vd. Testcontainers) qua `WebApplicationFactory`
- [ ] Tắt constraint trên production cho giống môi trường test
> InMemory provider không phải database quan hệ: không enforce constraint, không có transaction thật, không dịch SQL. SQLite gần hơn nhưng vẫn khác SQL Server/PostgreSQL ở kiểu dữ liệu và hành vi SQL.

## App dùng cookie authentication chạy 3 instance sau load balancer (không sticky session). Người dùng thỉnh thoảng bị đăng xuất ngẫu nhiên hoặc lỗi antiforgery. Nguyên nhân và cách sửa? [senior]
- [ ] Cookie quá lớn, chuyển sang JWT
- [x] Mỗi instance có Data Protection key ring riêng nên không giải mã được cookie do instance khác tạo; persist key ring vào nơi dùng chung (Redis, blob, DB) và đặt cùng application name
- [ ] Clock skew giữa các instance, đồng bộ NTP
- [ ] Thiếu `UseHttpsRedirection`
> Cookie auth và antiforgery token được mã hoá bằng Data Protection; key ring mặc định lưu cục bộ trên từng máy. Sticky session chỉ che giấu vấn đề, và key vẫn mất khi container bị tạo lại.
