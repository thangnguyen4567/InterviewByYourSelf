---
id: dotnet
title: .NET / ASP.NET Core
icon: 🔷
order: 3
description: Runtime .NET, ASP.NET Core pipeline, DI, EF Core, bảo mật, hiệu năng, testing và .NET Aspire
---

# Nền tảng .NET & Runtime

## CLR, CTS, CLS và IL là gì? Chúng liên quan với nhau thế nào? [junior]
**CLR (Common Language Runtime)** là môi trường thực thi của .NET: quản lý bộ nhớ (GC), JIT compile, type safety, exception handling, thread, security.

- **IL / MSIL / CIL (Intermediate Language)**: compiler C#/F#/VB biên dịch source thành IL (nằm trong assembly `.dll`/`.exe` cùng metadata), không phải mã máy.
- **CTS (Common Type System)**: định nghĩa tập kiểu dữ liệu chung (value type, reference type, class, interface...) mà mọi ngôn ngữ .NET dùng chung, nhờ đó một class C# có thể được kế thừa trong VB.
- **CLS (Common Language Specification)**: tập con của CTS, các quy tắc tối thiểu để thư viện có thể dùng được từ mọi ngôn ngữ .NET (ví dụ: không public `uint`, không phân biệt tên chỉ khác hoa/thường).

```text
C# source --(Roslyn)--> IL + metadata (.dll) --(CLR/JIT)--> Native code --> CPU
```

**Lưu ý / bẫy thường gặp:** IL không phải "bytecode chạy bằng interpreter" — CLR luôn JIT sang native code trước khi thực thi.

## JIT, Tiered Compilation, ReadyToRun và Native AOT khác nhau thế nào? [mid]
- **JIT (Just-In-Time)**: compile IL sang native code lúc runtime, theo từng method khi được gọi lần đầu. Ưu: tối ưu theo CPU thực tế. Nhược: startup chậm.
- **Tiered Compilation**: Tier 0 compile nhanh, ít tối ưu; method gọi nhiều được recompile ở Tier 1 với tối ưu đầy đủ. Kết hợp **Dynamic PGO** (mặc định từ .NET 8) để tối ưu dựa trên profile thực tế.
- **ReadyToRun (R2R)**: pre-compile một phần sang native khi publish, vẫn còn IL để JIT lại khi cần. Cải thiện startup, file lớn hơn.
- **Native AOT**: compile toàn bộ sang native binary, không cần JIT/runtime cài sẵn. Startup rất nhanh, memory thấp, phù hợp serverless, container, CLI.

| | JIT | R2R | Native AOT |
|---|---|---|---|
| Startup | Chậm | Nhanh hơn | Rất nhanh |
| Peak perf | Cao (PGO) | Cao | Tốt, không có PGO động |
| Reflection/dynamic | Đầy đủ | Đầy đủ | Hạn chế |

**Lưu ý / bẫy thường gặp:** Native AOT không hỗ trợ tốt reflection động, `Assembly.Load`, một số thư viện (EF Core còn hạn chế); cần dùng source generator (ví dụ `System.Text.Json` source gen) và chú ý trimming warnings.

## .NET Framework, .NET Core và .NET 5+ khác nhau thế nào? [junior]
- **.NET Framework (1.0 – 4.8.x)**: chỉ chạy Windows, gắn với OS, có WebForms, WCF server, WPF/WinForms. Hiện chỉ còn bảo trì, không có tính năng mới.
- **.NET Core (1.0 – 3.1)**: viết lại, cross-platform (Windows/Linux/macOS), open-source, modular qua NuGet, hiệu năng cao, hỗ trợ side-by-side versions.
- **.NET 5+ (5, 6, 7, 8, 9, 10...)**: hợp nhất thành một nền tảng duy nhất ("one .NET"), bỏ chữ "Core". Bản chẵn (6, 8, 10) là **LTS** (3 năm), bản lẻ là **STS** (18 tháng – 2 năm).

**Điểm chính khi so sánh:**
- Cross-platform & container-friendly → .NET 5+.
- Hiệu năng: .NET hiện đại nhanh hơn đáng kể (Span, Kestrel, PGO).
- Ứng dụng legacy dùng WebForms/WCF server/AppDomain → vẫn ở .NET Framework hoặc cần migrate (CoreWCF, gRPC).

**Lưu ý / bẫy thường gặp:** .NET Standard là *specification* API để chia sẻ thư viện giữa Framework và Core; với dự án mới chỉ target .NET 8+ thì không cần .NET Standard nữa.

## Garbage Collector trong .NET hoạt động thế nào? [mid]
GC của .NET là **generational, mark-and-compact**:

- **Gen 0**: object mới tạo, thu gom thường xuyên và rất nhanh.
- **Gen 1**: vùng đệm giữa object ngắn hạn và dài hạn.
- **Gen 2**: object sống lâu (cache, singleton), thu gom ít và tốn kém.
- **LOH (Large Object Heap)**: object ≥ 85KB, mặc định không compact, thu cùng Gen 2. **POH** (Pinned Object Heap) cho object pinned.

Chế độ: **Workstation** vs **Server GC** (mỗi core một heap, throughput cao — mặc định cho ASP.NET Core), **Concurrent/Background GC** giảm pause.

`IDisposable`/`using` dùng để giải phóng **unmanaged resource** (file handle, connection) một cách deterministic — GC không làm việc đó kịp thời.

```csharp
await using var conn = new SqlConnection(cs);
await conn.OpenAsync();
```

**Lưu ý / bẫy thường gặp:** Gọi `GC.Collect()` thủ công hầu như luôn là sai. Memory leak trong .NET thường do giữ reference (static collection, event handler chưa unsubscribe, cache không giới hạn), không phải do GC.

## async/await hoạt động thế nào? Vì sao phải "async all the way"? [mid]
Compiler biến method `async` thành **state machine**. Khi `await` một task chưa hoàn thành, method trả quyền điều khiển về caller, thread được trả về ThreadPool; khi I/O xong, phần tiếp theo (continuation) chạy trên một thread khác.

- Lợi ích chính trên server: **không block thread** khi chờ I/O → tăng throughput, tránh ThreadPool starvation.
- `async` không làm code CPU-bound nhanh hơn; CPU-bound dùng `Task.Run` (thường chỉ ở UI/client).

**"Async all the way"**: không trộn sync và async. Gọi `.Result` / `.Wait()` sẽ block thread và có thể gây **deadlock** (trong môi trường có SynchronizationContext như WinForms/WPF/ASP.NET cũ) hoặc starvation.

```csharp
// Sai
var user = _repo.GetUserAsync(id).Result;
// Đúng
var user = await _repo.GetUserAsync(id);
```

**Lưu ý / bẫy thường gặp:**
- Tránh `async void` (trừ event handler) vì exception không bắt được.
- `ConfigureAwait(false)` hữu ích trong library; ASP.NET Core không có SynchronizationContext nên ít quan trọng.
- Dùng `ValueTask` cho hot path thường hoàn thành đồng bộ; luôn truyền `CancellationToken`.

# ASP.NET Core Pipeline & Hosting

## Middleware là gì? Request pipeline trong ASP.NET Core hoạt động thế nào? [junior]
**Middleware** là component xử lý HTTP request/response, được ghép thành chuỗi (pipeline). Mỗi middleware có thể:
- Xử lý request rồi gọi `next()` để chuyển cho middleware kế tiếp.
- **Short-circuit** (không gọi `next`) để trả response ngay.
- Xử lý response trên đường quay về (sau `await next()`).

```text
Request -> [ExceptionHandler] -> [HTTPS] -> [Static] -> [Routing] -> [Auth] -> [Endpoint]
Response <-        <-               <-          <-           <-          <-
```

```csharp
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();
    await next(context);
    logger.LogInformation("{Path} took {Ms}ms", context.Request.Path, sw.ElapsedMilliseconds);
});
```

**Lưu ý / bẫy thường gặp:** Không được ghi vào response body/header sau khi response đã bắt đầu gửi (`context.Response.HasStarted`).

## Use, Run, Map, MapWhen và UseWhen khác nhau thế nào? [junior]
- **`Use`**: thêm middleware có tham số `next`, có thể gọi tiếp hoặc short-circuit.
- **`Run`**: middleware **terminal**, không có `next`, kết thúc pipeline. Mọi thứ đăng ký sau `Run` không bao giờ chạy.
- **`Map("/path", ...)`**: rẽ nhánh pipeline theo path prefix; nhánh không quay lại pipeline chính.
- **`MapWhen(predicate, ...)`**: rẽ nhánh theo điều kiện bất kỳ (header, query...), không quay lại.
- **`UseWhen(predicate, ...)`**: rẽ nhánh có điều kiện nhưng **quay lại** pipeline chính nếu nhánh không short-circuit.

```csharp
app.Map("/health-raw", b => b.Run(ctx => ctx.Response.WriteAsync("OK")));
app.UseWhen(ctx => ctx.Request.Path.StartsWithSegments("/api"),
    b => b.UseMiddleware<ApiKeyMiddleware>());
app.Run(ctx => ctx.Response.WriteAsync("Fallback"));
```

**Lưu ý / bẫy thường gặp:** Không nhầm `app.Map(...)` (branch middleware) với `app.MapGet(...)` (endpoint routing).

## Thứ tự middleware quan trọng thế nào? Thứ tự khuyến nghị là gì? [mid]
Middleware chạy theo **đúng thứ tự đăng ký** cho request, và ngược lại cho response. Sai thứ tự gây lỗi bảo mật hoặc chức năng.

Thứ tự khuyến nghị:
```csharp
app.UseExceptionHandler("/error"); // sớm nhất để bắt mọi exception
app.UseHsts();
app.UseHttpsRedirection();
app.UseStaticFiles();              // short-circuit file tĩnh, không qua auth
app.UseRouting();
app.UseCors();                     // sau Routing, trước Auth
app.UseAuthentication();           // xác định "bạn là ai"
app.UseAuthorization();            // kiểm tra "bạn được làm gì"
app.UseRateLimiter();
app.UseResponseCaching();          // hoặc UseOutputCache
app.MapControllers();
```

**Bẫy thường gặp:**
- `UseAuthorization` trước `UseAuthentication` → user luôn anonymous, 401.
- `UseCors` sau auth → preflight `OPTIONS` bị chặn.
- Exception handler đặt muộn → không bắt được lỗi của middleware phía trước.

Từ .NET 6 với `WebApplication`, `UseRouting`/`UseEndpoints` được thêm ngầm nếu không gọi, nhưng nên gọi tường minh khi cần đặt middleware giữa chúng.

## Kestrel là gì? Có cần reverse proxy (IIS, Nginx) không? [mid]
**Kestrel** là web server cross-platform, hiệu năng cao, mặc định của ASP.NET Core, hỗ trợ HTTP/1.1, HTTP/2, HTTP/3 và TLS.

Mô hình triển khai:
- **Kestrel trực tiếp ra Internet**: được hỗ trợ từ .NET Core 2.1+, phù hợp container sau load balancer.
- **Sau reverse proxy** (Nginx, IIS, YARP, cloud LB): proxy lo TLS termination, load balancing, static file, rate limit, bảo vệ thêm.
- **IIS in-process hosting**: app chạy trong worker process `w3wp.exe` qua ASP.NET Core Module (hiệu năng tốt hơn out-of-process).

Khi đứng sau proxy, cần cấu hình **Forwarded Headers** để lấy đúng IP client và scheme:

```csharp
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownProxies.Add(IPAddress.Parse("10.0.0.10"));
});
app.UseForwardedHeaders();
```

**Lưu ý / bẫy thường gặp:** Quên `UseForwardedHeaders` → redirect HTTPS lặp vô hạn hoặc log sai IP.

## IHostedService và BackgroundService dùng để làm gì? [mid]
Dùng để chạy **tác vụ nền** trong cùng process với app: consume message queue, job định kỳ, warm-up cache.

- **`IHostedService`**: có `StartAsync` và `StopAsync`, được host gọi khi khởi động/tắt.
- **`BackgroundService`**: abstract class implement `IHostedService`, chỉ cần override `ExecuteAsync(CancellationToken)`.

```csharp
public class OutboxWorker(IServiceScopeFactory scopeFactory, ILogger<OutboxWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(10));
        while (await timer.WaitForNextTickAsync(ct))
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // xử lý outbox...
        }
    }
}
builder.Services.AddHostedService<OutboxWorker>();
```

**Lưu ý / bẫy thường gặp:**
- Hosted service là **Singleton** → không inject trực tiếp `DbContext` (Scoped); dùng `IServiceScopeFactory`.
- Exception không bắt trong `ExecuteAsync` sẽ dừng host (mặc định từ .NET 6: `BackgroundServiceExceptionBehavior.StopHost`).
- Với job phức tạp (cron, retry, cluster) cân nhắc Hangfire, Quartz.NET.

## Minimal API và Controllers khác nhau thế nào? Khi nào dùng cái nào? [mid]
**Controllers (MVC)**: class kế thừa `ControllerBase`, attribute routing, filters, model binding phong phú, convention rõ ràng.

**Minimal API** (.NET 6+): định nghĩa endpoint bằng lambda, ít boilerplate, startup nhanh, hỗ trợ Native AOT tốt hơn.

```csharp
var orders = app.MapGroup("/api/orders").RequireAuthorization();
orders.MapGet("/{id:int}", async (int id, IOrderService svc) =>
    await svc.GetAsync(id) is { } o ? Results.Ok(o) : Results.NotFound())
    .WithName("GetOrder");
```

| Tiêu chí | Controllers | Minimal API |
|---|---|---|
| Boilerplate | Nhiều hơn | Ít |
| Filters | Action/Result/Exception filters | Endpoint filters |
| Tổ chức | Theo class | `MapGroup`, extension methods |
| AOT | Không hỗ trợ | Hỗ trợ |
| Hiệu năng | Tốt | Tốt hơn một chút |

**Khi chọn:** Minimal API cho microservice nhỏ, vertical slice, AOT. Controllers cho API lớn, team quen MVC, cần nhiều convention/filter. Thực tế cả hai đều production-ready và có thể dùng chung.

# Dependency Injection & Configuration

## Ba lifetime Singleton, Scoped, Transient khác nhau thế nào? [junior]
- **Transient**: tạo instance mới **mỗi lần resolve**. Dùng cho service nhẹ, stateless.
- **Scoped**: một instance **mỗi scope** — trong ASP.NET Core là mỗi HTTP request. Ví dụ điển hình: `DbContext`, Unit of Work.
- **Singleton**: một instance duy nhất cho toàn bộ vòng đời app. Dùng cho cache, config, `HttpClient` handler... **phải thread-safe**.

```csharp
builder.Services.AddTransient<IEmailBuilder, EmailBuilder>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddSingleton<IClock, SystemClock>();
```

**Lưu ý / bẫy thường gặp:**
- Container dispose các service `IDisposable` mà nó tạo khi scope kết thúc (Scoped/Transient) hoặc khi app tắt (Singleton).
- Transient `IDisposable` resolve từ root provider sẽ bị giữ đến khi app tắt → memory leak.
- Singleton có state mutable mà không lock → race condition.

## Captive dependency là gì? Làm sao phát hiện và tránh? [mid]
**Captive dependency** xảy ra khi service có lifetime dài **giữ** dependency có lifetime ngắn hơn, ví dụ Singleton inject Scoped. Scoped service khi đó bị "giam" sống cả vòng đời app:
- `DbContext` bị chia sẻ giữa nhiều request/thread → lỗi "A second operation was started on this context", dữ liệu cũ, leak.

Quy tắc: dependency phải có lifetime **≥** consumer: Singleton → chỉ Singleton; Scoped → Scoped/Singleton; Transient → bất kỳ.

**Phát hiện:** bật `ValidateScopes` và `ValidateOnBuild` (mặc định bật trong Development):
```csharp
builder.Host.UseDefaultServiceProvider(o =>
{
    o.ValidateScopes = true;
    o.ValidateOnBuild = true;
});
```

**Cách xử lý khi Singleton cần Scoped:** inject `IServiceScopeFactory` và tạo scope khi cần:
```csharp
using var scope = _scopeFactory.CreateScope();
var repo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
```

**Lưu ý:** Transient inject vào Singleton cũng thực chất thành singleton — cẩn thận nếu Transient có state.

## Options pattern là gì? IOptions, IOptionsSnapshot, IOptionsMonitor khác nhau ra sao? [mid]
Options pattern bind một section cấu hình vào **class strongly-typed**, giúp tách cấu hình theo nhóm và validate.

```csharp
public class JwtOptions
{
    public const string Section = "Jwt";
    [Required] public string Issuer { get; init; } = default!;
    [Range(1, 1440)] public int ExpiryMinutes { get; init; }
}

builder.Services.AddOptions<JwtOptions>()
    .BindConfiguration(JwtOptions.Section)
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

| Interface | Lifetime | Reload khi config đổi | Named options |
|---|---|---|---|
| `IOptions<T>` | Singleton | Không | Không |
| `IOptionsSnapshot<T>` | Scoped | Có (mỗi request) | Có |
| `IOptionsMonitor<T>` | Singleton | Có (real-time, `OnChange`) | Có |

**Lưu ý / bẫy thường gặp:** Không inject `IOptionsSnapshot` vào Singleton (captive dependency) — dùng `IOptionsMonitor`. `ValidateOnStart()` giúp fail-fast khi deploy thay vì lỗi ở request đầu tiên.

## Hệ thống Configuration trong ASP.NET Core hoạt động thế nào? [junior]
Configuration là tập key-value được gộp từ nhiều **provider**, provider đăng ký sau **ghi đè** provider trước. Thứ tự mặc định của `WebApplication.CreateBuilder`:

1. `appsettings.json`
2. `appsettings.{Environment}.json`
3. User Secrets (chỉ Development)
4. Environment variables
5. Command-line arguments

Key phân cấp dùng `:` (`ConnectionStrings:Default`); trong environment variable dùng `__` (`ConnectionStrings__Default`) vì `:` không hợp lệ trên một số OS.

```csharp
var cs = builder.Configuration.GetConnectionString("Default");
var timeout = builder.Configuration.GetValue<int>("Http:TimeoutSeconds", 30);
```

Môi trường được xác định qua `ASPNETCORE_ENVIRONMENT` / `DOTNET_ENVIRONMENT` (Development, Staging, Production).

**Lưu ý / bẫy thường gặp:** Không commit secret vào `appsettings.json`. Development dùng User Secrets; Production dùng Azure Key Vault, AWS Secrets Manager, Kubernetes Secrets hoặc environment variable.

## Keyed services và đăng ký nhiều implementation cho một interface xử lý thế nào? [senior]
Khi đăng ký nhiều implementation cùng interface:
- Resolve `IService` → lấy **implementation đăng ký cuối cùng**.
- Resolve `IEnumerable<IService>` → lấy **tất cả** (hữu ích cho pipeline, strategy, validators).
- `TryAdd*` chỉ đăng ký nếu chưa có; `TryAddEnumerable` tránh trùng implementation.

Từ **.NET 8** có **keyed services** để chọn implementation theo key:

```csharp
builder.Services.AddKeyedScoped<IPaymentGateway, VnPayGateway>("vnpay");
builder.Services.AddKeyedScoped<IPaymentGateway, MomoGateway>("momo");

public class CheckoutService([FromKeyedServices("momo")] IPaymentGateway gateway) { }

// Hoặc chọn động
var gw = sp.GetRequiredKeyedService<IPaymentGateway>(method);
```

Các kỹ thuật khác: factory delegate, **decorator pattern** (thư viện Scrutor `Decorate<>`), open generics `AddScoped(typeof(IRepository<>), typeof(Repository<>))`.

**Lưu ý / bẫy thường gặp:** Resolve động bằng `IServiceProvider` khắp nơi là **Service Locator anti-pattern** — làm ẩn dependency, khó test. Chỉ dùng ở composition root/factory.

# Web API: Routing, Model Binding, Validation, Filters

## Routing trong ASP.NET Core hoạt động thế nào? Attribute routing vs conventional routing? [junior]
**Endpoint routing**: `UseRouting` match request với endpoint, middleware phía sau (CORS, Auth) có thể đọc metadata của endpoint, rồi endpoint được thực thi.

- **Conventional routing**: định nghĩa template tập trung, chủ yếu cho MVC có view: `{controller=Home}/{action=Index}/{id?}`.
- **Attribute routing**: khai báo trên controller/action — chuẩn cho Web API.

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet("{id:int:min(1)}")]
    public IActionResult Get(int id) => Ok();

    [HttpGet("by-slug/{slug:regex(^[[a-z0-9-]]+$)}")]
    public IActionResult GetBySlug(string slug) => Ok();
}
```

**Route constraints** (`int`, `guid`, `min`, `regex`, `alpha`...) giúp phân biệt route, **không nên** dùng thay validation (sai constraint trả 404 chứ không phải 400).

**Lưu ý / bẫy thường gặp:** Hai route mơ hồ cùng match → `AmbiguousMatchException`. Dùng `LinkGenerator`/`CreatedAtAction` để sinh URL thay vì nối chuỗi.

## Model binding lấy dữ liệu từ đâu? [ApiController] thay đổi gì? [mid]
Model binding map dữ liệu HTTP vào tham số action từ các nguồn: **route**, **query string**, **header**, **form**, **body** (JSON qua input formatter), và **services** (DI).

Chỉ định rõ nguồn: `[FromRoute]`, `[FromQuery]`, `[FromHeader]`, `[FromBody]`, `[FromForm]`, `[FromServices]`, `[AsParameters]` (Minimal API).

`[ApiController]` bật các hành vi:
- **Tự động trả 400** (`ValidationProblemDetails`) khi `ModelState` invalid.
- **Binding source inference**: complex type → `[FromBody]`, `IFormFile` → `[FromForm]`, tham số trùng route → `[FromRoute]`, còn lại → `[FromQuery]`.
- Bắt buộc attribute routing.
- Lỗi trả về dạng **ProblemDetails** (RFC 7807/9457).

```csharp
[HttpPut("{id}")]
public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto,
    [FromHeader(Name = "If-Match")] string? etag) { ... }
```

**Lưu ý / bẫy thường gặp:** Chỉ có **một** `[FromBody]` mỗi action (body stream đọc một lần). Over-posting: bind thẳng vào entity EF cho phép client sửa field không mong muốn → luôn dùng DTO.

## Validation dữ liệu đầu vào làm thế nào? DataAnnotations vs FluentValidation? [mid]
**DataAnnotations**: attribute `[Required]`, `[StringLength]`, `[Range]`, `[EmailAddress]`, `IValidatableObject` cho rule nhiều field. Tích hợp sẵn với model binding và `[ApiController]`.

**FluentValidation**: rule viết bằng code, tách khỏi DTO, dễ test, hỗ trợ rule phức tạp, conditional, async (kiểm tra DB).

```csharp
public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(i =>
            i.RuleFor(x => x.Quantity).InclusiveBetween(1, 100));
    }
}
```

| | DataAnnotations | FluentValidation |
|---|---|---|
| Vị trí rule | Trên model | Class riêng |
| Rule phức tạp | Hạn chế | Mạnh |
| Test | Khó hơn | Dễ |
| Tích hợp sẵn | Có | Cần đăng ký |

**Lưu ý / bẫy thường gặp:** Phân biệt **input validation** (định dạng, bắt buộc — ở API layer) với **business rule/invariant** (ví dụ "không được đặt quá hạn mức tín dụng" — thuộc domain). Minimal API (.NET 10) có validation tích hợp; trước đó cần endpoint filter.

## Filters trong ASP.NET Core MVC là gì? Thứ tự chạy ra sao? So với middleware? [mid]
Filters chạy **bên trong MVC action pipeline**, có quyền truy cập context MVC (ActionArguments, ModelState, IActionResult).

Thứ tự:
```text
Authorization -> Resource -> [Model binding] -> Action -> [Action executes]
-> Exception (nếu lỗi) -> Result -> [Result executes]
```

- **Authorization filter**: kiểm tra quyền sớm nhất.
- **Resource filter**: chạy trước model binding (cache, short-circuit).
- **Action filter**: trước/sau action (logging, validate argument).
- **Exception filter**: xử lý exception từ action.
- **Result filter**: trước/sau khi thực thi result (thêm header).

```csharp
public class ValidateTenantFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        if (!ctx.HttpContext.Request.Headers.ContainsKey("X-Tenant"))
        { ctx.Result = new BadRequestResult(); return; }
        await next();
    }
}
```

| | Middleware | Filter |
|---|---|---|
| Phạm vi | Mọi request | Chỉ MVC/endpoint |
| Context | HttpContext | ActionContext, ModelState |
| Dùng cho | Cross-cutting toàn app | Logic gắn với action |

Minimal API dùng **endpoint filters** (`AddEndpointFilter`). Filter cần DI dùng `[ServiceFilter]` hoặc `[TypeFilter]`.

## Xử lý exception toàn cục trong ASP.NET Core thế nào? [mid]
Không nên try/catch ở mọi action. Cách chuẩn:

- **`UseExceptionHandler`** + **`IExceptionHandler`** (.NET 8+): map exception sang ProblemDetails tập trung.
- **`AddProblemDetails()`**: chuẩn hóa response lỗi theo RFC 9457.
- `UseDeveloperExceptionPage` chỉ ở Development.

```csharp
public class DomainExceptionHandler(ILogger<DomainExceptionHandler> log) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is not DomainException de) return false; // để handler khác xử lý
        ctx.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
        await ctx.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Title = "Business rule violated", Detail = de.Message, Status = 422
        }, ct);
        return true;
    }
}
builder.Services.AddExceptionHandler<DomainExceptionHandler>();
builder.Services.AddProblemDetails();
app.UseExceptionHandler();
```

**Lưu ý / bẫy thường gặp:**
- Không trả stack trace ra client ở Production.
- Dùng exception cho luồng nghiệp vụ dự kiến (not found, validation) tốn hiệu năng; nhiều team dùng **Result pattern** cho lỗi dự kiến và exception cho lỗi bất thường.
- Log kèm `TraceId` và trả `traceId` trong ProblemDetails để tra cứu.

# Authentication & Authorization

## Authentication và Authorization khác nhau thế nào trong ASP.NET Core? [junior]
- **Authentication (xác thực)**: xác định **bạn là ai**. Authentication handler (JWT Bearer, Cookie, OIDC) đọc credential, tạo `ClaimsPrincipal` gán vào `HttpContext.User`. Thất bại → **401 Unauthorized**.
- **Authorization (phân quyền)**: xác định **bạn được làm gì**, dựa trên claims/roles/policies. Thất bại → **403 Forbidden**.

Khái niệm chính:
- **Claim**: một cặp key-value về user (`sub`, `email`, `role`, `tenant_id`).
- **ClaimsIdentity**: tập claims từ một scheme; **ClaimsPrincipal**: chứa một hoặc nhiều identity.
- **Scheme**: tên của một cách xác thực; có thể có nhiều scheme (cookie cho web, JWT cho API).

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...);
builder.Services.AddAuthorization();
app.UseAuthentication();
app.UseAuthorization();
```

**Lưu ý / bẫy thường gặp:** Đặt `[Authorize]` nhưng quên `UseAuthentication` hoặc đặt sai thứ tự middleware.

## Cấu hình JWT Bearer authentication thế nào? Cần validate những gì? [mid]
JWT gồm `header.payload.signature` (Base64Url). Server **không lưu session**, chỉ verify chữ ký và các claim.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = "https://login.example.com"; // tự lấy JWKS qua OIDC discovery
        o.Audience = "orders-api";
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
```

Phải validate: **signature**, **issuer (`iss`)**, **audience (`aud`)**, **expiry (`exp`/`nbf`)**, thuật toán (chặn `alg: none`).

**Best practices:**
- Access token ngắn hạn (5–15 phút) + **refresh token** lưu an toàn, có rotation và revoke.
- Ưu tiên ký bất đối xứng (RS256/ES256) để các service chỉ cần public key.
- Không đưa dữ liệu nhạy cảm vào payload (chỉ encode, không mã hóa).

**Lưu ý / bẫy thường gặp:** JWT không revoke được trước khi hết hạn → cần token ngắn hạn, denylist theo `jti`, hoặc reference token. SPA lưu token trong `localStorage` dễ bị XSS — cân nhắc pattern **BFF** với cookie HttpOnly.

## Cookie authentication khác JWT thế nào? Khi nào dùng cái nào? [mid]
| | Cookie auth | JWT Bearer |
|---|---|---|
| Lưu trạng thái | Ticket mã hóa trong cookie (có thể kèm session server) | Stateless, client giữ token |
| Gửi đi | Trình duyệt tự gửi | Client tự gắn header `Authorization: Bearer` |
| Rủi ro chính | **CSRF** | **XSS** (nếu lưu trong JS) |
| Phù hợp | Web app server-rendered, BFF | API cho mobile, service-to-service, SPA gọi API khác domain |
| Revoke | Dễ (xóa session, đổi security stamp) | Khó |

Cookie an toàn: `HttpOnly`, `Secure`, `SameSite=Lax/Strict`, kết hợp antiforgery token cho form.

```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.HttpOnly = true;
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        o.Cookie.SameSite = SameSiteMode.Lax;
        o.ExpireTimeSpan = TimeSpan.FromHours(8);
        o.SlidingExpiration = true;
    });
```

**Lưu ý / bẫy thường gặp:** Với API dùng cookie, mặc định handler redirect về trang login (302) — cần override `OnRedirectToLogin` để trả 401. Nhiều cluster cần chia sẻ **Data Protection keys** (Redis, blob) để cookie giải mã được trên mọi instance.

## Role-based, Claims-based và Policy-based authorization khác nhau thế nào? [mid]
- **Role-based**: `[Authorize(Roles = "Admin,Manager")]` — đơn giản nhưng khó mở rộng, dễ "bùng nổ role".
- **Claims-based**: yêu cầu claim cụ thể, ví dụ có claim `department=HR`.
- **Policy-based**: khái quát nhất — policy gồm một hoặc nhiều **requirement**, mỗi requirement được xử lý bởi **handler** có thể chứa logic bất kỳ, có DI.

```csharp
builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("HrOnly", p => p.RequireClaim("department", "HR"));
    o.AddPolicy("Adult", p => p.Requirements.Add(new MinimumAgeRequirement(18)));
});
builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();

public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext ctx, MinimumAgeRequirement req)
    {
        var dob = ctx.User.FindFirst("birthdate")?.Value;
        if (dob != null && Age(DateTime.Parse(dob)) >= req.Age) ctx.Succeed(req);
        return Task.CompletedTask;
    }
}
```

**Lưu ý:** Role thực chất cũng là claim (`ClaimTypes.Role`); nên dùng policy làm lớp trừu tượng để đổi logic mà không sửa controller.

## Resource-based authorization là gì? Ví dụ khi nào cần? [senior]
Policy thông thường quyết định dựa trên **user** trước khi vào action. Nhưng nhiều rule phụ thuộc vào **chính tài nguyên**: "chỉ tác giả mới được sửa bài viết", "manager chỉ duyệt đơn nghỉ phép của nhân viên trong phòng mình". Lúc kiểm tra attribute, tài nguyên chưa được load.

Giải pháp: inject `IAuthorizationService` và gọi sau khi load resource:

```csharp
public class LeaveOwnerHandler : AuthorizationHandler<OperationAuthorizationRequirement, LeaveRequest>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext ctx,
        OperationAuthorizationRequirement op, LeaveRequest leave)
    {
        if (op.Name == "Approve" && ctx.User.FindFirst("dept")?.Value == leave.DepartmentId)
            ctx.Succeed(op);
        return Task.CompletedTask;
    }
}

var leave = await _db.LeaveRequests.FindAsync(id);
var result = await _authz.AuthorizeAsync(User, leave, new OperationAuthorizationRequirement { Name = "Approve" });
if (!result.Succeeded) return Forbid();
```

**Lưu ý / bẫy thường gặp:**
- Kiểm tra quyền chỉ ở UI (ẩn nút) là không đủ — luôn kiểm tra ở server, tránh lỗi **IDOR** (đổi id trên URL để xem dữ liệu người khác).
- Với danh sách, filter ngay trong query (`Where(x => x.DeptId == userDept)`) hoặc dùng EF Core **global query filter** cho multi-tenant.

# Entity Framework Core

## Change tracking là gì? Khi nào dùng AsNoTracking? [junior]
`DbContext` theo dõi các entity được query (snapshot giá trị gốc) để khi gọi `SaveChanges` tự sinh `INSERT/UPDATE/DELETE` cho những gì thay đổi. Trạng thái entity: `Added`, `Unchanged`, `Modified`, `Deleted`, `Detached`.

**`AsNoTracking()`**: không đưa entity vào change tracker → nhanh hơn, ít memory. Dùng cho **truy vấn chỉ đọc** (list, report, API GET).

```csharp
var products = await _db.Products
    .AsNoTracking()
    .Where(p => p.IsActive)
    .Select(p => new ProductDto(p.Id, p.Name, p.Price)) // projection còn tốt hơn
    .ToListAsync(ct);
```

- `AsNoTrackingWithIdentityResolution()`: không tracking nhưng vẫn đảm bảo một entity chỉ có một instance trong kết quả.
- Có thể đặt mặc định: `UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)`.

**Lưu ý / bẫy thường gặp:** Projection bằng `Select` sang DTO tự động không tracking và chỉ lấy cột cần thiết. Sửa entity lấy bằng `AsNoTracking` rồi `SaveChanges` sẽ không có gì xảy ra — phải `Update()`/`Attach()`.

## Eager, Explicit và Lazy loading khác nhau thế nào? [mid]
- **Eager loading**: load navigation cùng query bằng `Include`/`ThenInclude` → một query (JOIN) hoặc nhiều query nếu `AsSplitQuery`.
- **Explicit loading**: load navigation sau, theo yêu cầu: `Entry(x).Collection(c => c.Items).LoadAsync()`.
- **Lazy loading**: navigation tự load khi truy cập lần đầu; cần package `Proxies` + navigation `virtual`, hoặc `ILazyLoader`.

```csharp
// Eager
var order = await _db.Orders
    .Include(o => o.Items).ThenInclude(i => i.Product)
    .FirstAsync(o => o.Id == id);

// Explicit
var customer = await _db.Customers.FindAsync(id);
await _db.Entry(customer!).Collection(c => c.Orders)
    .Query().Where(o => o.Year == 2025).LoadAsync();
```

| | Eager | Explicit | Lazy |
|---|---|---|---|
| Số query | Ít, dự đoán được | Có kiểm soát | Khó kiểm soát |
| Nguy cơ N+1 | Thấp | Trung bình | **Cao** |

**Lưu ý / bẫy thường gặp:** Lazy loading trong API dễ gây N+1 và lỗi khi serialize (vòng lặp, context đã dispose). Include nhiều collection gây **cartesian explosion** → dùng `AsSplitQuery()`.

## Vấn đề N+1 query là gì? Phát hiện và khắc phục thế nào? [mid]
**N+1**: một query lấy N bản ghi cha, rồi với mỗi bản ghi lại chạy thêm 1 query lấy dữ liệu con → N+1 round-trip tới DB. Thường do lazy loading hoặc query trong vòng lặp.

```csharp
// Sai: 1 + N query
var orders = await _db.Orders.ToListAsync();
foreach (var o in orders)
    total += await _db.OrderItems.Where(i => i.OrderId == o.Id).SumAsync(i => i.Price);

// Đúng: 1 query, tính toán ở DB
var totals = await _db.Orders
    .Select(o => new { o.Id, Total = o.Items.Sum(i => i.Price) })
    .ToListAsync();
```

**Phát hiện:**
- Bật log SQL: `LogTo(Console.WriteLine, LogLevel.Information)` hoặc category `Microsoft.EntityFrameworkCore.Database.Command`.
- Công cụ APM / OpenTelemetry tracing thấy hàng loạt span SQL giống nhau.
- MiniProfiler, SQL Profiler.

**Khắc phục:** `Include`, **projection** (`Select`), batch bằng `Where(x => ids.Contains(x.Id))`, tắt lazy loading.

**Lưu ý:** N+1 cũng xảy ra ở tầng HTTP (gọi API khác trong vòng lặp) và GraphQL (dùng DataLoader).

## Migrations trong EF Core hoạt động thế nào? Triển khai migration lên production ra sao? [mid]
Migration ghi lại thay đổi model thành code C# (`Up`/`Down`) và snapshot model. Bảng `__EFMigrationsHistory` lưu các migration đã áp dụng.

```bash
dotnet ef migrations add AddOrderStatus
dotnet ef database update
dotnet ef migrations script --idempotent -o migrate.sql
dotnet ef migrations bundle --self-contained
```

**Chiến lược triển khai production:**
- **Idempotent SQL script**: DBA review, chạy trong pipeline CI/CD — an toàn và kiểm soát nhất.
- **Migration bundle**: file thực thi chạy migration như một bước deploy riêng.
- `Database.Migrate()` lúc app khởi động: tiện cho dev, **rủi ro** khi nhiều instance cùng chạy và app cần quyền DDL.

**Thay đổi không gây downtime (expand/contract):**
1. Thêm cột mới nullable, deploy code ghi cả hai.
2. Backfill dữ liệu.
3. Chuyển code đọc cột mới.
4. Xóa cột cũ ở release sau.

**Lưu ý / bẫy thường gặp:** Rename property bị EF hiểu thành drop + add → mất dữ liệu; luôn review migration được sinh ra. Không sửa migration đã apply trên môi trường chung.

## Transaction trong EF Core xử lý thế nào? [mid]
- Mỗi lần `SaveChanges()` **mặc định chạy trong một transaction** — mọi thay đổi trong đó là atomic.
- Cần nhiều `SaveChanges` hoặc kết hợp raw SQL trong một đơn vị → dùng transaction tường minh:

```csharp
await using var tx = await _db.Database.BeginTransactionAsync(ct);
try
{
    _db.Orders.Add(order);
    await _db.SaveChangesAsync(ct);

    await _db.Database.ExecuteSqlInterpolatedAsync(
        $"UPDATE Stock SET Qty = Qty - {qty} WHERE ProductId = {pid}", ct);

    await tx.CommitAsync(ct);
}
catch
{
    await tx.RollbackAsync(ct);
    throw;
}
```

- Khi bật **retry strategy** (`EnableRetryOnFailure`), transaction tường minh phải bọc trong `_db.Database.CreateExecutionStrategy().ExecuteAsync(...)`.
- `TransactionScope` hỗ trợ ambient transaction nhưng cẩn thận với async (`TransactionScopeAsyncFlowOption.Enabled`) và distributed transaction.

**Lưu ý / bẫy thường gặp:** Transaction không trải được qua nhiều microservice/DB — dùng **Saga** + **Outbox**. Giữ transaction ngắn, không gọi HTTP bên ngoài bên trong transaction. Chọn isolation level phù hợp (mặc định SQL Server: Read Committed).

## Concurrency token / optimistic concurrency trong EF Core là gì? [senior]
**Optimistic concurrency**: không khóa bản ghi khi đọc; khi update, kiểm tra xem bản ghi có bị người khác sửa trong lúc đó không. EF thêm điều kiện vào `WHERE` của `UPDATE`; nếu 0 dòng bị ảnh hưởng → ném `DbUpdateConcurrencyException`.

```csharp
public class Product
{
    public int Id { get; set; }
    public decimal Price { get; set; }
    [Timestamp] public byte[] RowVersion { get; set; } = default!; // SQL Server rowversion
}
// PostgreSQL: dùng cột hệ thống xmin
// modelBuilder.Entity<Product>().Property<uint>("xmin").IsRowVersion();
```

```sql
UPDATE Products SET Price = @p0 WHERE Id = @p1 AND RowVersion = @p2
```

Xử lý xung đột:
```csharp
catch (DbUpdateConcurrencyException ex)
{
    var entry = ex.Entries.Single();
    var dbValues = await entry.GetDatabaseValuesAsync();
    // chiến lược: client wins / store wins / merge / trả 409 Conflict cho người dùng
}
```

Trong API, thường trả `RowVersion` cho client dưới dạng **ETag**, client gửi lại qua `If-Match`, server trả **409/412** khi lệch.

**So với pessimistic locking** (`SELECT ... FOR UPDATE`, `UPDLOCK`): an toàn hơn khi xung đột cao nhưng giảm throughput, nguy cơ deadlock.

## Compiled queries, raw SQL và các kỹ thuật tối ưu hiệu năng EF Core? [senior]
**Compiled queries**: bỏ qua bước dịch LINQ → SQL cho query gọi rất nhiều lần:
```csharp
private static readonly Func<AppDbContext, int, Task<Product?>> GetById =
    EF.CompileAsyncQuery((AppDbContext db, int id) => db.Products.FirstOrDefault(p => p.Id == id));
```
(EF Core vốn đã cache query plan; compiled query chỉ có lợi ở hot path.)

**Raw SQL:**
```csharp
var list = await _db.Products
    .FromSqlInterpolated($"SELECT * FROM Products WHERE Name LIKE {pattern}")
    .AsNoTracking().ToListAsync();
var rows = await _db.Database.SqlQuery<SalesDto>($"EXEC usp_Sales {year}").ToListAsync();
```
`FromSqlInterpolated`/`SqlQuery` **tự tham số hóa** → an toàn; `FromSqlRaw` với nối chuỗi → **SQL injection**.

**Kỹ thuật tối ưu khác:**
- `AsNoTracking`, projection `Select`, phân trang (keyset pagination cho bảng lớn).
- **Bulk operations** (.NET 7+): `ExecuteUpdateAsync`, `ExecuteDeleteAsync` — không load entity.
- **DbContext pooling**: `AddDbContextPool<T>()`.
- `AsSplitQuery` khi include nhiều collection.
- Index đúng cột filter/sort; xem execution plan.
- Dùng Dapper cho query đọc phức tạp/hot path (CQRS read side).

**Lưu ý / bẫy thường gặp:** Gọi `ToList()` quá sớm làm filter chạy trên memory (client evaluation). `ExecuteUpdate` bỏ qua change tracker và interceptor/domain event.

## DbContext nên có lifetime nào? DbContext có thread-safe không? [mid]
`DbContext` được thiết kế là **unit of work ngắn hạn** và **không thread-safe**.

- Trong ASP.NET Core: `AddDbContext` đăng ký mặc định là **Scoped** — mỗi request một instance.
- Không chạy song song nhiều query trên cùng một context (`Task.WhenAll` với cùng `_db`) → lỗi "A second operation was started on this context instance".
- Trong Singleton/BackgroundService/Blazor Server: dùng **`IDbContextFactory<T>`** để tạo context ngắn hạn.

```csharp
builder.Services.AddDbContextFactory<AppDbContext>(o => o.UseNpgsql(cs));

public class ReportJob(IDbContextFactory<AppDbContext> factory)
{
    public async Task RunAsync()
    {
        await using var db = await factory.CreateDbContextAsync();
        // ...
    }
}
```

- **DbContext pooling** (`AddDbContextPool`) tái sử dụng instance để giảm chi phí khởi tạo; context phải không giữ state riêng trong field.

**Lưu ý / bẫy thường gặp:** Để DbContext sống lâu (singleton) → change tracker phình to, dữ liệu cũ, memory leak. Có nên bọc thêm Repository/UoW trên EF không là chủ đề tranh luận: `DbContext` đã là UoW + `DbSet` là repository; chỉ thêm abstraction khi có lý do (domain thuần, test, đổi persistence).

# Caching, Logging & Health Checks

## IMemoryCache và IDistributedCache khác nhau thế nào? Khi nào dùng Redis? [mid]
- **`IMemoryCache`**: cache trong RAM của process. Rất nhanh, lưu object trực tiếp. Nhược: mỗi instance một cache riêng (không nhất quán khi scale out), mất khi restart.
- **`IDistributedCache`**: cache dùng chung giữa các instance (Redis, SQL Server, NCache), lưu `byte[]` nên cần serialize. Chậm hơn (network) nhưng nhất quán, sống qua restart.
- **`HybridCache`** (.NET 9): kết hợp L1 (memory) + L2 (distributed), có **stampede protection** và tag-based invalidation.

```csharp
var product = await _cache.GetOrCreateAsync($"product:{id}", async entry =>
{
    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
    entry.SlidingExpiration = TimeSpan.FromMinutes(2);
    entry.Size = 1;
    return await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
});
```

**Dùng Redis khi:** nhiều instance/container, cần chia sẻ session, rate limit, distributed lock, cache dữ liệu lớn.

**Lưu ý / bẫy thường gặp:**
- **Cache stampede**: nhiều request cùng miss → cùng đánh DB. `GetOrCreateAsync` của MemoryCache không chống được; dùng `HybridCache` hoặc lock.
- Luôn đặt expiration và giới hạn `SizeLimit` để tránh memory leak.
- Invalidation là phần khó nhất — xác định rõ chiến lược (TTL, xóa khi ghi, pub/sub).

## Response caching và Output caching khác nhau thế nào? [mid]
- **Response caching** (`UseResponseCaching` + `[ResponseCache]`): dựa trên **HTTP cache headers** (`Cache-Control`, `Vary`). Tuân theo header của client (client gửi `no-cache` thì bỏ qua), chủ yếu chỉ đặt header cho browser/proxy/CDN.
- **Output caching** (.NET 7+, `UseOutputCache`): cache phía server, **do server kiểm soát**, không phụ thuộc header client. Hỗ trợ policy, vary by query/header/route, **tag-based invalidation**, chống stampede, lưu trữ trong memory hoặc Redis.

```csharp
builder.Services.AddOutputCache(o =>
{
    o.AddPolicy("Products", p => p.Expire(TimeSpan.FromMinutes(5))
                                  .SetVaryByQuery("page", "category")
                                  .Tag("products"));
});
app.UseOutputCache();

app.MapGet("/products", GetProducts).CacheOutput("Products");
app.MapPost("/products", async (IOutputCacheStore store, ...) =>
{
    // ... tạo sản phẩm
    await store.EvictByTagAsync("products", default);
});
```

**Lưu ý / bẫy thường gặp:** Mặc định output cache chỉ cache GET/HEAD trả 200 và **không cache request có authenticated user** hoặc set cookie — tránh lộ dữ liệu cá nhân giữa người dùng. Nếu cache dữ liệu theo user, phải vary theo user một cách tường minh.

## Logging trong ASP.NET Core: ILogger, structured logging và Serilog? [mid]
`ILogger<T>` là abstraction logging chuẩn; provider (Console, Debug, EventSource, OpenTelemetry, Serilog...) quyết định log đi đâu. Mức log: `Trace < Debug < Information < Warning < Error < Critical`, cấu hình theo category trong `Logging:LogLevel`.

**Structured logging**: dùng **message template**, không nội suy chuỗi, để các tham số trở thành field có thể query:

```csharp
// Đúng: OrderId và Amount là property riêng
_logger.LogInformation("Order {OrderId} created with amount {Amount}", order.Id, order.Total);
// Sai: mất cấu trúc, tốn allocation
_logger.LogInformation($"Order {order.Id} created");
```

**Serilog**: thư viện phổ biến với nhiều **sink** (Seq, Elasticsearch, File, Loki), enricher (machine, thread, correlation id), cấu hình qua appsettings.

```csharp
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(new CompactJsonFormatter()));
app.UseSerilogRequestLogging();
```

**Lưu ý / bẫy thường gặp:** Không log password, token, PII. Hot path dùng **`LoggerMessage` source generator** (`[LoggerMessage]`) để tránh boxing/allocation. Dùng `BeginScope` để gắn context (TenantId, CorrelationId) cho mọi log trong scope.

## Health checks là gì? Liveness và readiness khác nhau thế nào? [mid]
Health checks cung cấp endpoint để orchestrator (Kubernetes, load balancer) biết app có khỏe không.

- **Liveness**: process còn sống và không bị treo? Fail → **restart** container. Chỉ nên kiểm tra bản thân app, không kiểm tra dependency.
- **Readiness**: app đã sẵn sàng nhận traffic chưa (DB, cache, warm-up)? Fail → **ngừng route traffic** nhưng không restart.
- **Startup probe**: cho app khởi động chậm thêm thời gian.

```csharp
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddNpgSql(cs, tags: ["ready"])           // AspNetCore.HealthChecks.NpgSql
    .AddRedis(redisCs, tags: ["ready"]);

app.MapHealthChecks("/health/live", new() { Predicate = r => r.Tags.Contains("live") });
app.MapHealthChecks("/health/ready", new() { Predicate = r => r.Tags.Contains("ready") });
```

Trạng thái: `Healthy`, `Degraded`, `Unhealthy`.

**Lưu ý / bẫy thường gặp:** Đưa kiểm tra DB vào liveness → DB chập chờn khiến **toàn bộ pod bị restart hàng loạt** (cascading failure). Không lộ chi tiết nội bộ ở endpoint public; health check phải nhanh và có timeout.

# Communication & Performance

## SignalR là gì? Hoạt động thế nào và scale ra sao? [mid]
**SignalR** là thư viện real-time, cho phép server **push** dữ liệu tới client (chat, notification, dashboard). Tự động chọn transport tốt nhất: **WebSockets** → Server-Sent Events → Long Polling.

- **Hub**: class server định nghĩa method client gọi và gửi message tới `Clients.All`, `Clients.User(id)`, `Clients.Group(name)`.
- Hỗ trợ strongly-typed hub, streaming, authentication (JWT qua query `access_token` với WebSocket).

```csharp
public class NotificationHub : Hub<INotificationClient>
{
    public Task JoinDepartment(string dept) =>
        Groups.AddToGroupAsync(Context.ConnectionId, dept);
}

// Gửi từ service bất kỳ
public class LeaveService(IHubContext<NotificationHub, INotificationClient> hub)
{
    public Task NotifyAsync(string userId, string msg) => hub.Clients.User(userId).Notify(msg);
}
```

**Scale out:** connection gắn với một server, nên khi có nhiều instance cần:
- **Backplane** (Redis) để phát message giữa các server, hoặc **Azure SignalR Service**.
- **Sticky sessions** nếu dùng transport không phải WebSocket.

**Lưu ý / bẫy thường gặp:** Hub là transient — không lưu state trong field. Client phải xử lý reconnect (`withAutomaticReconnect`) và message có thể mất khi mất kết nối (SignalR không đảm bảo delivery).

## gRPC trong .NET là gì? Khi nào chọn gRPC thay vì REST? [mid]
**gRPC** là RPC framework dùng **HTTP/2** và **Protocol Buffers** (binary, strongly-typed contract trong file `.proto`). .NET sinh code client/server từ `.proto`.

```protobuf
service Inventory {
  rpc GetStock (StockRequest) returns (StockReply);
  rpc WatchStock (StockRequest) returns (stream StockReply);
}
message StockRequest { string product_id = 1; }
message StockReply { int32 quantity = 1; }
```

```csharp
builder.Services.AddGrpc();
app.MapGrpcService<InventoryService>();
builder.Services.AddGrpcClient<Inventory.InventoryClient>(o => o.Address = new("https://inventory"));
```

Ưu điểm: payload nhỏ, nhanh, contract-first, **streaming 4 kiểu** (unary, server, client, bidirectional), deadline/cancellation tích hợp.

**Chọn gRPC khi:** giao tiếp service-to-service nội bộ, yêu cầu latency thấp, polyglot cần contract chặt, streaming.
**Chọn REST khi:** API public, browser client, cần dễ debug/caching HTTP.

**Lưu ý / bẫy thường gặp:** Browser không gọi gRPC trực tiếp — cần **gRPC-Web** hoặc JSON transcoding. Load balancer L4 không cân bằng tốt HTTP/2 long-lived connection → cần L7 LB hoặc client-side load balancing. Không đổi số field trong `.proto` để giữ backward compatibility.

## Vì sao nên dùng IHttpClientFactory thay vì new HttpClient? [mid]
Các vấn đề của `HttpClient`:
- `new HttpClient()` + dispose mỗi request → **socket exhaustion** (socket ở trạng thái TIME_WAIT).
- Một `HttpClient` static sống mãi → **không cập nhật DNS** thay đổi.

**`IHttpClientFactory`** quản lý pool `HttpMessageHandler`, xoay vòng handler định kỳ (mặc định 2 phút), hỗ trợ cấu hình tập trung và DelegatingHandler pipeline.

```csharp
builder.Services.AddHttpClient<IPaymentClient, PaymentClient>(c =>
{
    c.BaseAddress = new Uri("https://payment.internal");
    c.Timeout = TimeSpan.FromSeconds(10);
})
.AddHttpMessageHandler<CorrelationIdHandler>()
.AddStandardResilienceHandler(); // Microsoft.Extensions.Http.Resilience (Polly v8)
```

Các kiểu dùng: **named client**, **typed client** (khuyến nghị), hoặc `SocketsHttpHandler` với `PooledConnectionLifetime` cho singleton client.

**Resilience**: `AddStandardResilienceHandler` cung cấp sẵn retry (exponential backoff + jitter), circuit breaker, timeout, rate limiter.

**Lưu ý / bẫy thường gặp:** Không inject typed client vào Singleton (typed client là transient, handler sẽ bị giữ lại → mất lợi ích xoay vòng DNS). Chỉ retry request **idempotent**.

## Các kỹ thuật tối ưu hiệu năng ASP.NET Core thường gặp? [senior]
**I/O & concurrency:**
- Async all the way, không `.Result`/`.Wait()`; truyền `CancellationToken` (`HttpContext.RequestAborted`).
- Tránh ThreadPool starvation; theo dõi bằng `dotnet-counters`.

**Memory & allocation:**
- `Span<T>`, `Memory<T>`, `ArrayPool<T>`, `ObjectPool<T>`, `StringBuilder` pooling.
- `System.Text.Json` **source generator**; tránh LINQ/closure trên hot path.
- Stream dữ liệu lớn (`IAsyncEnumerable<T>`) thay vì load toàn bộ vào memory.

**Data access:**
- DbContext pooling, `AsNoTracking`, projection, index, tránh N+1.
- Connection pooling (mặc định trong ADO.NET) — luôn đóng connection sớm.

**HTTP:**
- `IHttpClientFactory`, HTTP/2/3, **response compression** (Brotli/Gzip), output cache, CDN cho static.
- Rate limiting (`AddRateLimiter`) bảo vệ hệ thống.

**Đo lường trước khi tối ưu:**
```bash
dotnet-counters monitor -n MyApi --counters System.Runtime,Microsoft.AspNetCore.Hosting
dotnet-trace collect -n MyApi
```
Dùng **BenchmarkDotNet** cho micro-benchmark, k6/NBomber cho load test, APM/OpenTelemetry để tìm bottleneck thật.

**Lưu ý / bẫy thường gặp:** Tối ưu sớm khi chưa có số liệu; phần lớn bottleneck thực tế nằm ở DB và network, không phải CPU.

## Rate limiting trong ASP.NET Core cấu hình thế nào? [mid]
Từ .NET 7 có middleware `Microsoft.AspNetCore.RateLimiting` với các thuật toán:

- **Fixed window**: N request mỗi cửa sổ cố định — đơn giản nhưng có burst ở ranh giới.
- **Sliding window**: chia cửa sổ thành segment, mượt hơn.
- **Token bucket**: token nạp đều đặn, cho phép burst có kiểm soát.
- **Concurrency limiter**: giới hạn số request đồng thời.

```csharp
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("per-user", ctx => RateLimitPartition.GetTokenBucketLimiter(
        ctx.User.Identity?.Name ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
        _ => new TokenBucketRateLimiterOptions
        {
            TokenLimit = 100, TokensPerPeriod = 20,
            ReplenishmentPeriod = TimeSpan.FromSeconds(10), QueueLimit = 0
        }));
});
app.UseRateLimiter();
app.MapGet("/api/search", Search).RequireRateLimiting("per-user");
```

**Lưu ý / bẫy thường gặp:** Limiter built-in là **in-memory theo instance** — khi scale out N instance, giới hạn thực tế là N lần. Cần rate limit toàn cục thì dùng Redis hoặc đặt ở API Gateway. Nên trả header `Retry-After`.

# Testing & .NET Aspire

## Unit test trong .NET với xUnit và Moq viết thế nào? [junior]
**xUnit**: framework test phổ biến. `[Fact]` cho test không tham số, `[Theory]` + `[InlineData]`/`[MemberData]` cho test tham số hóa. Mỗi test tạo **instance class mới** → constructor là setup, `IDisposable` là teardown; chia sẻ fixture qua `IClassFixture<T>`.

**Moq** (hoặc NSubstitute): tạo mock cho dependency để test cô lập.

```csharp
public class LeaveServiceTests
{
    private readonly Mock<ILeaveRepository> _repo = new();
    private readonly LeaveService _sut;
    public LeaveServiceTests() => _sut = new LeaveService(_repo.Object);

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Request_InvalidDays_Throws(int days)
    {
        await Assert.ThrowsAsync<ArgumentException>(() => _sut.RequestAsync("u1", days));
    }

    [Fact]
    public async Task Request_Valid_SavesOnce()
    {
        _repo.Setup(r => r.GetBalanceAsync("u1")).ReturnsAsync(10);
        await _sut.RequestAsync("u1", 2);
        _repo.Verify(r => r.AddAsync(It.Is<LeaveRequest>(l => l.Days == 2)), Times.Once);
    }
}
```

Cấu trúc **Arrange – Act – Assert**, tên test mô tả hành vi.

**Lưu ý / bẫy thường gặp:** Không mock những gì mình không sở hữu (ví dụ mock `DbContext`/`HttpClient` trực tiếp) — dùng integration test hoặc fake. Test quá phụ thuộc implementation (Verify mọi call) sẽ gãy khi refactor.

## Integration test với WebApplicationFactory làm thế nào? [mid]
`WebApplicationFactory<TEntryPoint>` (package `Microsoft.AspNetCore.Mvc.Testing`) khởi động app **in-memory** với `TestServer`, cho phép gửi HTTP request thật qua toàn bộ pipeline (middleware, routing, DI, filters) mà không cần mở port.

```csharp
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder().Build(); // Testcontainers

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseNpgsql(_db.GetConnectionString()));
            services.AddSingleton<IEmailSender, FakeEmailSender>();
        });
    }
    public Task InitializeAsync() => _db.StartAsync();
    public new Task DisposeAsync() => _db.DisposeAsync().AsTask();
}

public class OrdersApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Get_Unknown_Returns404()
    {
        var client = factory.CreateClient();
        var res = await client.GetAsync("/api/orders/999");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}
```

**Lưu ý / bẫy thường gặp:**
- Với top-level statements cần `public partial class Program { }` để test truy cập được.
- EF InMemory provider **không giống DB thật** (không có transaction, constraint, SQL dịch khác) → ưu tiên **Testcontainers** hoặc SQLite.
- Fake authentication bằng custom `AuthenticationHandler` cho test.
- Cô lập dữ liệu giữa các test (Respawn để reset DB).

## Test pyramid trong dự án .NET nên phân bổ thế nào? [senior]
```text
        /\        E2E / UI (Playwright)    - ít, chậm, dễ flaky
       /  \
      /----\      Integration (WebApplicationFactory, Testcontainers)
     /      \
    /--------\    Unit (xUnit + Moq)        - nhiều, nhanh, cô lập
```

- **Unit test**: domain logic, validators, handler thuần — chạy mili-giây, chiếm phần lớn.
- **Integration test**: API endpoint với DB thật (container), message broker, kiểm tra mapping EF, migration, serialization, auth.
- **Contract test** (Pact): đảm bảo consumer/provider giữa microservices không phá API của nhau.
- **E2E**: luồng nghiệp vụ quan trọng nhất.

**Thực tế hiện đại:** với API "mỏng" (CRUD), nhiều team theo mô hình **testing trophy** — đầu tư mạnh vào integration test vì giá trị cao hơn unit test toàn mock.

**Thực hành tốt:**
- Test hành vi qua public API, không test private method.
- **Architecture tests** (NetArchTest, ArchUnitNET) để đảm bảo Domain không tham chiếu Infrastructure.
- Đo coverage nhưng không đặt mục tiêu mù quáng; mutation testing (Stryker.NET) đánh giá chất lượng test.
- Chạy test trong CI, song song hóa, tránh phụ thuộc thời gian (`TimeProvider` từ .NET 8 để fake thời gian).

## .NET Aspire là gì? Giải quyết vấn đề gì? [mid]
**.NET Aspire** là stack có định hướng (opinionated) giúp xây dựng và chạy ứng dụng **cloud-native, phân tán** dễ hơn, đặc biệt ở môi trường dev local.

Các thành phần chính:
- **AppHost (orchestration)**: mô tả toàn bộ hệ thống bằng C# — project, container (Postgres, Redis, RabbitMQ), quan hệ giữa chúng. Chạy một lệnh là khởi động tất cả.
- **Service defaults**: project chia sẻ cấu hình chuẩn — OpenTelemetry (logs, metrics, traces), health checks, service discovery, resilience cho HttpClient.
- **Integrations (components)**: package NuGet cấu hình sẵn client cho Redis, PostgreSQL, Kafka... kèm health check và telemetry.
- **Dashboard**: xem logs, traces, metrics, trạng thái resource theo thời gian thực.

```csharp
var builder = DistributedApplication.CreateBuilder(args);
var db = builder.AddPostgres("pg").AddDatabase("hrm");
var cache = builder.AddRedis("cache");
var api = builder.AddProject<Projects.Hrm_Api>("api")
    .WithReference(db).WithReference(cache).WaitFor(db);
builder.AddNpmApp("web", "../web").WithReference(api);
builder.Build().Run();
```

Connection string và URL service được **inject tự động** qua configuration; service discovery cho phép gọi `https+http://api`.

**Lưu ý:** Aspire không phải là runtime production hay thay thế Kubernetes; nó hỗ trợ dev experience và có thể sinh manifest để deploy (Azure Container Apps, Kubernetes qua công cụ như Aspir8/azd).
