---
id: architecture
title: Architectures
icon: 🏛️
order: 4
description: Kiến trúc phần mềm, DDD, CQRS, microservices, messaging, distributed systems, scalability và system design
---

# Kiến trúc ứng dụng: Layered, Clean, Onion, Hexagonal

## Layered (N-tier) architecture là gì? Ưu nhược điểm? [junior]
Layered architecture chia ứng dụng thành các tầng theo trách nhiệm, mỗi tầng chỉ gọi tầng ngay bên dưới:

```text
+-------------------------+
| Presentation (API/UI)   |
+-------------------------+
| Business Logic (BLL)    |
+-------------------------+
| Data Access (DAL)       |
+-------------------------+
| Database                |
+-------------------------+
```

- **Layer** là phân tách logic; **tier** là phân tách vật lý (chạy trên máy/process khác nhau).
- **Strict layering**: chỉ gọi tầng kề dưới. **Relaxed**: được bỏ qua tầng.

**Ưu điểm:** dễ hiểu, phổ biến, phân chia công việc rõ, phù hợp CRUD.

**Nhược điểm:**
- Business logic **phụ thuộc vào Data Access** → domain bị gắn với DB/ORM, khó test.
- Thiết kế thường xuất phát từ database (database-driven), dễ sinh **anemic domain model**.
- Thay đổi một tính năng phải sửa xuyên qua mọi tầng.

**Lưu ý / bẫy thường gặp:** "Sinkhole anti-pattern" — request đi qua các tầng mà không có logic gì, chỉ chuyển tiếp. Đây là lý do nhiều hệ thống chuyển sang Clean/Onion (đảo chiều phụ thuộc) hoặc Vertical Slice.

## Clean Architecture là gì? Dependency rule nghĩa là gì? [mid]
Clean Architecture (Robert C. Martin) tổ chức code thành các vòng đồng tâm với **Dependency Rule**: *dependency trong source code chỉ được hướng vào trong*. Vòng trong không biết gì về vòng ngoài.

```text
+-----------------------------------------------+
| Frameworks & Drivers (Web, DB, UI, Devices)   |
|  +-----------------------------------------+  |
|  | Interface Adapters (Controllers, Repos) |  |
|  |  +-----------------------------------+  |  |
|  |  | Application (Use Cases)           |  |  |
|  |  |  +-----------------------------+  |  |  |
|  |  |  | Domain (Entities)           |  |  |  |
|  |  |  +-----------------------------+  |  |  |
|  |  +-----------------------------------+  |  |
|  +-----------------------------------------+  |
+-----------------------------------------------+
```

Cấu trúc solution .NET điển hình:
- **Domain**: entity, value object, domain event, interface thuần — không phụ thuộc framework.
- **Application**: use case/command handler, định nghĩa interface (`IOrderRepository`, `IEmailSender`).
- **Infrastructure**: implement interface (EF Core, SMTP, Redis).
- **WebApi/Presentation**: controller, DI composition root.

Nguyên lý cốt lõi là **Dependency Inversion**: Application định nghĩa abstraction, Infrastructure implement nó.

**Lợi ích:** domain test độc lập, đổi DB/framework ít ảnh hưởng, logic nghiệp vụ rõ ràng.
**Bẫy thường gặp:** over-engineering cho app CRUD đơn giản — quá nhiều project, mapping, interface chỉ có một implementation.

## Onion Architecture và Hexagonal Architecture (Ports & Adapters) khác gì Clean Architecture? [mid]
Cả ba cùng một ý tưởng: **domain ở trung tâm, hạ tầng ở ngoài, phụ thuộc hướng vào trong**. Khác nhau chủ yếu ở cách diễn đạt.

**Hexagonal (Alistair Cockburn)**:
- Ứng dụng là lõi, giao tiếp với bên ngoài qua **Ports** (interface) và **Adapters** (implementation).
- **Driving/primary adapters**: thứ gọi vào app (REST controller, CLI, test, message consumer).
- **Driven/secondary adapters**: thứ app gọi ra (DB, email, payment gateway).

```text
 [REST]  [gRPC]  [Test]          driving adapters
    \      |      /
   (Inbound Ports: IPlaceOrder)
        [ APPLICATION CORE ]
   (Outbound Ports: IOrderRepo, IPayment)
    /      |      \
 [EF]   [Kafka]  [Stripe]        driven adapters
```

**Onion (Jeffrey Palermo)**: các vòng Domain Model → Domain Services → Application Services → Infrastructure/UI/Tests ở ngoài cùng.

| | Hexagonal | Onion | Clean |
|---|---|---|---|
| Trọng tâm | Ports/Adapters, đối xứng in/out | Vòng tầng quanh domain | Use case + Dependency Rule |
| Năm | 2005 | 2008 | 2012 |

**Kết luận phỏng vấn:** khác biệt là thuật ngữ; điểm cốt lõi chung là **Dependency Inversion** và cô lập domain khỏi I/O.

## Vertical Slice Architecture là gì? So với Clean Architecture? [senior]
**Vertical Slice** (Jimmy Bogard) tổ chức code theo **feature/use case** thay vì theo tầng kỹ thuật. Mỗi slice chứa mọi thứ cần cho một request: endpoint, command/query, handler, validator, data access.

```text
Features/
  Leaves/
    SubmitLeave/  -> Endpoint.cs, Command.cs, Handler.cs, Validator.cs
    ApproveLeave/
    GetLeaveBalance/
```

- **Tối thiểu coupling giữa các slice, tối đa cohesion trong slice**.
- Mỗi slice tự chọn cách làm phù hợp: slice đơn giản dùng EF trực tiếp, slice phức tạp dùng domain model giàu.
- Thêm feature = thêm folder mới, ít khi sửa code chung.

| | Clean (theo tầng) | Vertical Slice |
|---|---|---|
| Tổ chức | Domain/Application/Infra | Theo feature |
| Thay đổi một feature | Chạm nhiều project | Chủ yếu một folder |
| Abstraction | Nhiều interface | Ít, theo nhu cầu |
| Rủi ro | Over-engineering | Trùng lặp code, logic domain phân tán |

**Thực tế:** thường kết hợp — Vertical Slice cho Application layer + một Domain project chung chứa aggregate/invariant. Phù hợp tốt với CQRS và MediatR/Minimal API.

## Áp dụng SOLID ở mức kiến trúc như thế nào? [mid]
- **S — Single Responsibility**: mỗi module/service có **một lý do để thay đổi** — tương ứng với một bounded context hoặc một capability nghiệp vụ, không phải "service Users làm mọi thứ".
- **O — Open/Closed**: mở rộng bằng plugin, strategy, event handler thay vì sửa lõi. Ví dụ thêm kênh thông báo mới (Zalo) bằng cách thêm implementation `INotificationChannel`.
- **L — Liskov Substitution**: adapter thay thế nhau được mà không phá vỡ contract (đổi Redis cache sang Memory cache, đổi provider SMS).
- **I — Interface Segregation**: API/contract nhỏ, tập trung theo client — ví dụ BFF cho từng loại client, port nhỏ thay vì repository "God interface".
- **D — Dependency Inversion**: nền tảng của Clean/Hexagonal — chính sách cấp cao (domain) không phụ thuộc chi tiết (DB, framework).

Các nguyên lý module-level khác (Uncle Bob): **Stable Dependencies** (phụ thuộc vào module ổn định hơn), **Acyclic Dependencies** (không có vòng phụ thuộc giữa module/service), **Common Closure** (những thứ thay đổi cùng nhau nằm cùng nhau).

**Lưu ý / bẫy thường gặp:** Áp dụng máy móc tạo ra quá nhiều abstraction. SOLID là công cụ để quản lý thay đổi, chỉ áp dụng ở nơi thực sự có biến động.

## DRY, KISS, YAGNI áp dụng thế nào khi thiết kế kiến trúc? Khi nào chúng mâu thuẫn? [mid]
- **DRY (Don't Repeat Yourself)**: mỗi *kiến thức* (rule nghiệp vụ) chỉ có một nguồn. Không phải "không bao giờ copy code".
- **KISS (Keep It Simple)**: chọn giải pháp đơn giản nhất đáp ứng yêu cầu — monolith trước microservices, Postgres trước khi thêm 3 loại DB.
- **YAGNI (You Aren't Gonna Need It)**: không xây tính năng/abstraction cho nhu cầu tưởng tượng (multi-tenant, plugin system "để sau dùng").

**Mâu thuẫn thường gặp:**
- **DRY vs decoupling trong microservices**: chia sẻ thư viện domain chung giữa các service tạo **coupling khi deploy** (đổi một lib phải release mọi service). Trong distributed system, chấp nhận trùng lặp có kiểm soát thường tốt hơn — "prefer duplication over the wrong abstraction".
- **YAGNI vs kiến trúc tiến hóa**: một số quyết định khó đảo ngược (schema dữ liệu, contract API public, ranh giới module) đáng đầu tư sớm; quyết định dễ đảo ngược thì trì hoãn.

**Cách trả lời tốt:** phân biệt quyết định **one-way door** (khó quay lại, cân nhắc kỹ) và **two-way door** (làm nhanh, sửa sau). Kiến trúc tốt là kiến trúc giữ được nhiều lựa chọn mở với chi phí thấp.

# Domain-Driven Design (DDD)

## DDD là gì? Strategic design và tactical design khác nhau thế nào? [mid]
**Domain-Driven Design** (Eric Evans) là cách tiếp cận thiết kế phần mềm xoay quanh **domain nghiệp vụ**, hợp tác chặt chẽ với domain expert, mô hình hóa nghiệp vụ trực tiếp trong code.

**Strategic design** — "big picture", chia hệ thống:
- **Ubiquitous Language**: ngôn ngữ chung giữa dev và business, dùng trong code, tài liệu, hội thoại.
- **Bounded Context**: ranh giới mà trong đó một model có ý nghĩa nhất quán.
- **Subdomain**: Core (tạo lợi thế cạnh tranh), Supporting, Generic (mua/dùng sẵn: auth, email).
- **Context Mapping**: quan hệ giữa các context.

**Tactical design** — building blocks trong một context:
- Entity, Value Object, Aggregate, Domain Service, Domain Event, Repository, Factory.

**Khi nào dùng DDD:** domain phức tạp, nhiều rule nghiệp vụ thay đổi, dự án dài hạn. **Không nên** dùng tactical DDD đầy đủ cho CRUD đơn giản.

**Lưu ý / bẫy thường gặp:** Nhiều team chỉ áp dụng tactical patterns (repository, aggregate) mà bỏ qua strategic design — trong khi giá trị lớn nhất của DDD nằm ở bounded context và ubiquitous language.

## Entity và Value Object khác nhau thế nào? [junior]
**Entity**: có **identity** (Id) xuyên suốt vòng đời; hai entity bằng nhau khi cùng Id dù thuộc tính khác nhau. Có thể thay đổi trạng thái. Ví dụ: `Employee`, `Order`.

**Value Object**: được định nghĩa hoàn toàn bởi **giá trị** các thuộc tính, không có identity, **immutable**, so sánh theo giá trị, có thể thay thế. Ví dụ: `Money`, `Address`, `DateRange`, `Email`.

```csharp
public sealed record Money
{
    public decimal Amount { get; }
    public string Currency { get; }
    public Money(decimal amount, string currency)
    {
        if (amount < 0) throw new ArgumentException("Amount must be >= 0");
        Amount = amount; Currency = currency;
    }
    public Money Add(Money other) => other.Currency == Currency
        ? new Money(Amount + other.Amount, Currency)
        : throw new InvalidOperationException("Currency mismatch");
}
```

Lợi ích Value Object:
- Đóng gói validation và hành vi (không còn `decimal` + `string` rời rạc).
- Tránh **primitive obsession**.
- Immutable → an toàn thread, dễ test.

EF Core map Value Object bằng **owned types** (`OwnsOne`) hoặc **complex types** (.NET 8+).

**Lưu ý:** Một khái niệm có thể là entity ở context này nhưng là value object ở context khác (ví dụ `Address` trong hệ thống giao hàng có thể cần identity).

## Aggregate và Aggregate Root là gì? Quy tắc thiết kế aggregate? [senior]
**Aggregate** là cụm entity và value object được xử lý như **một đơn vị nhất quán** cho thay đổi dữ liệu. **Aggregate Root** là entity duy nhất mà bên ngoài được tham chiếu và gọi vào; nó bảo vệ **invariant** của cả cụm.

```csharp
public class Order : AggregateRoot
{
    private readonly List<OrderLine> _lines = new();
    public IReadOnlyCollection<OrderLine> Lines => _lines;
    public OrderStatus Status { get; private set; }

    public void AddLine(ProductId productId, int qty, Money price)
    {
        if (Status != OrderStatus.Draft) throw new DomainException("Order is locked");
        if (_lines.Count >= 50) throw new DomainException("Too many lines");
        _lines.Add(new OrderLine(productId, qty, price));
    }
}
```

**Quy tắc thiết kế (Vaughn Vernon):**
1. Bảo vệ **invariant thực sự** trong ranh giới aggregate.
2. Thiết kế **aggregate nhỏ**.
3. Tham chiếu aggregate khác **bằng Id**, không bằng object reference.
4. Dùng **eventual consistency** giữa các aggregate (qua domain event).
5. **Một transaction chỉ sửa một aggregate**.

- Repository chỉ tồn tại cho aggregate root.
- Kết hợp optimistic concurrency (version) trên root.

**Bẫy thường gặp:** aggregate quá lớn (ví dụ `Customer` chứa toàn bộ `Orders`) → load chậm, xung đột concurrency cao. Setter public khiến invariant bị phá từ bên ngoài.

## Bounded Context là gì? Context Mapping gồm những pattern nào? [senior]
**Bounded Context** là ranh giới rõ ràng (thường theo team/subdomain) trong đó một model và ubiquitous language có nghĩa nhất quán. Cùng một từ có thể có nghĩa khác ở context khác: "Employee" trong **Recruitment** (ứng viên đã nhận việc) khác "Employee" trong **Payroll** (lương, thuế) và **Attendance** (ca, chấm công).

Thay vì một model "Employee" khổng lồ dùng chung, mỗi context có model riêng, chỉ chứa thứ nó cần.

**Context Mapping patterns:**
- **Shared Kernel**: hai context chia sẻ một phần model chung (coupling cao, cần phối hợp).
- **Customer/Supplier**: upstream phục vụ nhu cầu downstream.
- **Conformist**: downstream chấp nhận model của upstream.
- **Anti-Corruption Layer (ACL)**: downstream dịch model upstream sang model của mình, bảo vệ domain khỏi hệ thống legacy/bên thứ ba.
- **Open Host Service + Published Language**: upstream cung cấp API/contract chuẩn hóa cho nhiều consumer.
- **Separate Ways**: không tích hợp.

```text
[Recruitment] --(EmployeeHired event, Published Language)--> [HR Core]
[HR Core] --(ACL)--> [Legacy Payroll system]
```

**Ứng dụng:** bounded context là ứng viên tự nhiên cho ranh giới **module** trong modular monolith hoặc **microservice**.

## Domain Event là gì? Khác Integration Event thế nào? [mid]
**Domain Event** biểu diễn **một điều đã xảy ra** có ý nghĩa nghiệp vụ trong domain, đặt tên ở thì quá khứ: `LeaveRequestApproved`, `OrderPlaced`. Dùng để tách side effect khỏi aggregate và đạt eventual consistency giữa các aggregate.

```csharp
public record LeaveApproved(Guid LeaveId, Guid EmployeeId, int Days) : IDomainEvent;

public void Approve(Guid approverId)
{
    if (Status != LeaveStatus.Pending) throw new DomainException("Invalid state");
    Status = LeaveStatus.Approved;
    AddDomainEvent(new LeaveApproved(Id, EmployeeId, Days));
}
```

Thường dispatch trong `SaveChanges` (interceptor) qua MediatR — trước commit (cùng transaction) hoặc sau commit.

| | Domain Event | Integration Event |
|---|---|---|
| Phạm vi | Trong một bounded context/process | Giữa các service/context |
| Vận chuyển | In-memory | Message broker (RabbitMQ, Kafka) |
| Contract | Có thể thay đổi tự do | Public contract, cần versioning |
| Độ tin cậy | Cùng transaction | Cần **Outbox** để đảm bảo gửi |

**Lưu ý / bẫy thường gặp:** Publish integration event trực tiếp lên broker trong cùng code với `SaveChanges` → nếu một bên thất bại sẽ mất nhất quán (**dual-write problem**). Event chỉ nên chứa dữ liệu cần thiết, không đính kèm cả entity.

## Anemic domain model vs Rich domain model? Domain Service dùng khi nào? [mid]
**Anemic domain model**: entity chỉ có property get/set, toàn bộ logic nằm trong "service" class. Martin Fowler gọi là anti-pattern trong bối cảnh DDD vì invariant bị phân tán, ai cũng có thể đặt trạng thái không hợp lệ.

```csharp
// Anemic
leave.Status = "Approved"; leave.ApprovedBy = userId; // ở bất kỳ đâu
// Rich
leave.Approve(approver); // entity tự kiểm tra trạng thái & quyền, phát domain event
```

**Rich domain model**: entity đóng gói dữ liệu + hành vi, setter private, constructor/factory đảm bảo object luôn hợp lệ.

**Domain Service** dùng khi logic nghiệp vụ:
- Không thuộc tự nhiên về một entity/value object nào.
- Liên quan nhiều aggregate. Ví dụ: `LeavePolicyService.CalculateEntitlement(employee, policy, year)`, `TransferService` chuyển tiền giữa hai tài khoản.

Domain service là **stateless**, nằm trong Domain layer, dùng ngôn ngữ nghiệp vụ.

Phân biệt với **Application Service**: điều phối use case (load aggregate, gọi domain, lưu, gửi email, transaction) — không chứa rule nghiệp vụ.

**Lưu ý:** Anemic model không phải lúc nào cũng sai — với CRUD đơn giản, transaction script/anemic là lựa chọn hợp lý (KISS).

# CQRS, Event Sourcing & MediatR

## CQRS là gì? Khi nào nên áp dụng? [mid]
**CQRS (Command Query Responsibility Segregation)** tách model **ghi** (Command — thay đổi trạng thái, không trả dữ liệu nghiệp vụ) và model **đọc** (Query — trả dữ liệu, không có side effect).

Các mức áp dụng:
1. **Tách ở code**: Command handler dùng domain model + EF, Query handler dùng projection/Dapper trả DTO — cùng một DB.
2. **Tách DB**: write DB (chuẩn hóa) và read DB/read model (denormalized, Elasticsearch, Redis) đồng bộ qua event → **eventual consistency**.

```text
            +--> Command --> Domain Model --> Write DB --(events)--+
Client -----|                                                      v
            +--> Query  --> Read Model (denormalized) <---- Projector
```

**Lợi ích:** tối ưu đọc/ghi độc lập (đọc thường chiếm 80-90% traffic), model ghi tập trung invariant, model đọc đơn giản và nhanh, scale riêng.

**Khi nào áp dụng:** domain phức tạp, yêu cầu đọc khác biệt lớn với cấu trúc ghi (dashboard, search), tải đọc/ghi chênh lệch.

**Bẫy thường gặp:** áp dụng CQRS có tách DB cho CRUD đơn giản → phức tạp không cần thiết; UI phải xử lý dữ liệu chưa kịp đồng bộ (read-your-writes). CQRS **không bắt buộc** đi kèm Event Sourcing.

## Event Sourcing là gì? Ưu nhược điểm? [senior]
**Event Sourcing**: thay vì lưu trạng thái hiện tại, lưu **chuỗi event bất biến** đã xảy ra với aggregate. Trạng thái hiện tại = replay (fold) toàn bộ event.

```text
Account #42 event stream:
 v1 AccountOpened   { owner: "An" }
 v2 MoneyDeposited  { amount: 500 }
 v3 MoneyWithdrawn  { amount: 200 }
 => Balance hiện tại = 300
```

- **Event store** (EventStoreDB, Marten trên Postgres) append-only, optimistic concurrency theo version stream.
- **Snapshot** định kỳ để không phải replay hàng nghìn event.
- **Projection** sinh read model (thường kết hợp CQRS).

**Ưu điểm:**
- Audit trail đầy đủ, tự nhiên (tài chính, chấm công, pháp lý).
- Time travel: tái tạo trạng thái tại thời điểm bất kỳ, debug.
- Tạo read model mới bằng cách replay lại event cũ.
- Event là nguồn tích hợp tự nhiên cho hệ thống khác.

**Nhược điểm:**
- Phức tạp, đường cong học tập cao.
- **Event versioning/schema evolution** (upcasting) khó.
- Query trên trạng thái hiện tại phải qua projection; eventual consistency.
- Xóa dữ liệu (GDPR) khó với store bất biến (crypto-shredding).

**Lưu ý:** chỉ dùng cho bounded context thực sự cần lịch sử, không áp dụng toàn hệ thống.

## MediatR là gì? Ưu nhược điểm khi dùng trong dự án .NET? [mid]
**MediatR** là thư viện implement **Mediator pattern** in-process: controller gửi request (command/query) tới mediator, mediator tìm handler tương ứng. Hỗ trợ request/response, notification (publish nhiều handler) và **pipeline behaviors**.

```csharp
public record ApproveLeave(Guid LeaveId) : IRequest<Result>;

public class ApproveLeaveHandler(AppDbContext db) : IRequestHandler<ApproveLeave, Result>
{
    public async Task<Result> Handle(ApproveLeave cmd, CancellationToken ct) { ... }
}

public class ValidationBehavior<TReq, TRes>(IEnumerable<IValidator<TReq>> validators)
    : IPipelineBehavior<TReq, TRes> where TReq : notnull
{
    public async Task<TRes> Handle(TReq req, RequestHandlerDelegate<TRes> next, CancellationToken ct)
    {
        // validate tất cả validators, ném ValidationException nếu lỗi
        return await next();
    }
}
```

**Ưu điểm:**
- Controller mỏng, mỗi use case một handler (hợp với CQRS, Vertical Slice).
- Cross-cutting (validation, logging, transaction, caching) qua pipeline behavior.

**Nhược điểm:**
- Thêm indirection: khó "Go to definition" từ controller tới handler.
- Có thể chỉ là "service locator đẹp" nếu dự án nhỏ.
- Từ phiên bản 13 (2025) MediatR chuyển sang **license thương mại** cho doanh nghiệp lớn → nhiều team cân nhắc lựa chọn khác (Mediator source-generator, Wolverine, tự viết dispatcher đơn giản).

**Lưu ý:** MediatR là in-process, **không phải** message bus; không cung cấp retry/durability.

## Read model / projection trong CQRS được đồng bộ thế nào? Xử lý eventual consistency ở UI? [senior]
**Cách đồng bộ read model:**
- **Synchronous projection**: cập nhật read model trong cùng transaction với write — nhất quán ngay nhưng coupling và chậm ghi.
- **Asynchronous projection**: write side phát event (qua outbox / CDC như Debezium) → projector consume và cập nhật read DB. Có độ trễ (lag) nhưng scale tốt.

Projector phải **idempotent** (event có thể giao lại) và xử lý **theo thứ tự** trong mỗi aggregate (lưu `lastProcessedVersion`). Có khả năng **rebuild** projection từ đầu.

**Xử lý eventual consistency phía UI:**
- Command trả về id/version mới; client **optimistic update** hiển thị ngay.
- **Read-your-writes**: query kèm version tối thiểu, server chờ projection đạt version đó hoặc đọc từ write DB.
- Push qua SignalR/WebSocket khi projection hoàn tất.
- Hiển thị trạng thái "Đang xử lý" thay vì giả định đã xong.
- Thiết kế UX theo nghiệp vụ: "Đơn của bạn đã được tiếp nhận" (task-based UI).

**Lưu ý / bẫy thường gặp:** Đo và giám sát **projection lag** như một metric quan trọng; đặt SLA rõ (ví dụ < 2 giây).

# Monolith, Modular Monolith & Microservices

## So sánh Monolith, Modular Monolith và Microservices? [mid]
| Tiêu chí | Monolith | Modular Monolith | Microservices |
|---|---|---|---|
| Deploy | Một đơn vị | Một đơn vị | Độc lập từng service |
| Ranh giới module | Thường mờ | Rõ, được enforce | Rõ (qua network) |
| Giao tiếp | In-process | In-process qua public API của module | Network (HTTP/gRPC/message) |
| Transaction | ACID dễ | ACID (hoặc theo module) | Distributed → Saga |
| Scale | Toàn bộ app | Toàn bộ app | Từng service |
| Độ phức tạp vận hành | Thấp | Thấp | **Cao** (observability, CI/CD, network) |
| Tự chủ team | Thấp | Trung bình | Cao |
| Công nghệ | Một stack | Một stack | Polyglot |

**Monolith** ưu: đơn giản, debug dễ, hiệu năng in-process; nhược: "big ball of mud" khi lớn, deploy chung rủi ro, khó scale từng phần.

**Microservices** ưu: deploy/scale độc lập, cô lập lỗi, team tự chủ; nhược: distributed system (network failure, latency, consistency), chi phí hạ tầng & DevOps cao.

**Modular monolith** là điểm cân bằng: ranh giới như microservices nhưng chi phí vận hành như monolith, có thể tách ra service khi cần.

**Lưu ý:** "Distributed monolith" — microservices nhưng phải deploy cùng nhau, gọi đồng bộ dây chuyền, chung DB — là tệ nhất của cả hai thế giới.

## Khi nào nên chọn microservices? Khi nào không? [senior]
**Nên chọn microservices khi:**
- Tổ chức có **nhiều team** (Conway's Law) cần deploy độc lập, tốc độ release cao.
- Các phần hệ thống có **yêu cầu scale/khả dụng khác biệt rõ** (ví dụ chấm công giờ cao điểm vs báo cáo).
- Domain đã hiểu rõ, **bounded context ổn định**.
- Có năng lực DevOps: CI/CD tự động, container orchestration, observability, on-call.
- Cần cô lập lỗi hoặc công nghệ khác nhau cho từng phần.

**Không nên khi:**
- Startup/MVP, domain còn thay đổi nhiều → ranh giới sai sẽ rất đắt để sửa.
- Team nhỏ (< ~10–15 dev).
- Thiếu hạ tầng tự động hóa và giám sát.
- Lý do chỉ là "trend" hoặc "để scale" khi monolith chưa gặp giới hạn thực tế.

**Chiến lược khuyến nghị:** **Monolith-first** (Martin Fowler) → modular monolith với ranh giới rõ → tách service từ module có nhu cầu thực sự (scale, team, tần suất deploy). Với hệ thống legacy dùng **Strangler Fig pattern**: đặt proxy/gateway phía trước, chuyển dần từng chức năng sang service mới.

**Câu trả lời mạnh:** nêu rằng microservices là giải pháp cho **vấn đề tổ chức và scale**, đánh đổi bằng độ phức tạp phân tán — không phải mặc định tốt hơn.

## Modular monolith được thiết kế thế nào để giữ ranh giới module? [senior]
Mỗi module tương ứng một **bounded context** (ví dụ: Employees, Attendance, Payroll, Leave), có:
- **Public API/contract** nhỏ (interface, integration event) — module khác chỉ được gọi qua đây.
- Phần nội bộ (`internal`) gồm domain, handler, data access.
- **Schema DB riêng** (hoặc ít nhất bảng riêng), không JOIN chéo bảng module khác; mỗi module có DbContext riêng.

```text
src/
  Host (WebApi, composition root)
  Modules/
    Leave/      Leave.Contracts, Leave.Core (internal)
    Payroll/    Payroll.Contracts, Payroll.Core
  Shared/       BuildingBlocks (abstraction kỹ thuật, không chứa domain)
```

**Giao tiếp giữa module:**
- **Đồng bộ**: gọi interface trong `*.Contracts` (in-process).
- **Bất đồng bộ**: integration event qua in-memory bus hoặc outbox → dễ chuyển sang broker thật khi tách service.

**Enforce ranh giới:**
- `internal` + `InternalsVisibleTo` hạn chế.
- **Architecture tests** (NetArchTest) fail build nếu module tham chiếu nội bộ module khác.
- Database schema/user riêng cho từng module.

**Lưu ý / bẫy thường gặp:** "Shared" project phình thành nơi chứa domain chung → coupling ngầm. Transaction xuyên module nên tránh; chấp nhận eventual consistency ngay từ trong monolith để việc tách sau này dễ.

## Database per service là gì? Những thách thức đi kèm? [senior]
**Database per service**: mỗi microservice sở hữu dữ liệu riêng, service khác **không truy cập trực tiếp** DB đó, chỉ qua API hoặc event. Đảm bảo loose coupling, deploy và thay đổi schema độc lập, chọn loại DB phù hợp (polyglot persistence).

**Thách thức và cách xử lý:**
- **Transaction phân tán** → Saga + Outbox, chấp nhận eventual consistency.
- **Query join dữ liệu nhiều service**:
  - **API Composition**: gateway/BFF gọi nhiều service rồi ghép kết quả.
  - **CQRS read model**: service subscribe event, duy trì bản sao denormalized dữ liệu cần thiết.
- **Trùng lặp dữ liệu**: lưu bản sao read-only (ví dụ Payroll lưu `EmployeeName` nhận từ event `EmployeeUpdated`) — cần xác định rõ **source of truth**.
- **Báo cáo tổng hợp**: đổ dữ liệu về data warehouse/lake qua CDC/ETL.
- **Tính toàn vẹn tham chiếu**: không còn foreign key xuyên service → validate qua API hoặc xử lý bất đồng bộ.

**Lưu ý / bẫy thường gặp:** Chia sẻ một DB giữa nhiều service ("shared database") làm mọi thay đổi schema cần phối hợp → distributed monolith. Có thể chung một **server** DB nhưng tách schema và quyền truy cập.

# Microservice Patterns

## API Gateway và BFF (Backend for Frontend) là gì? [mid]
**API Gateway**: điểm vào duy nhất cho client, đứng trước các microservice:
- Routing, request aggregation.
- Cross-cutting: authentication (validate JWT), rate limiting, SSL termination, caching, logging, CORS.
- Ẩn cấu trúc nội bộ khỏi client.

Công cụ: **YARP**, Ocelot, Kong, NGINX, Envoy, Azure API Management, AWS API Gateway.

**BFF (Backend for Frontend)**: mỗi loại client (Web, Mobile, Admin) có một gateway/backend riêng, trả dữ liệu đúng hình dạng client cần.

```text
[Web SPA] --> [Web BFF] ----+
                            +--> [Employee svc] [Leave svc] [Payroll svc]
[Mobile]  --> [Mobile BFF] -+
```

Ưu điểm BFF: tránh over/under-fetching, team frontend sở hữu BFF, bảo mật tốt — **BFF giữ token**, browser chỉ nhận cookie HttpOnly (khuyến nghị cho SPA theo OAuth 2.0 for Browser-Based Apps).

**Lưu ý / bẫy thường gặp:**
- Gateway là **single point of failure** → cần HA, nhiều instance.
- Không đặt business logic vào gateway (thành "god gateway").
- Gateway thêm một hop latency; aggregation nên gọi song song.

## Service discovery là gì? Client-side vs server-side discovery? [mid]
Trong môi trường động (container, autoscale), IP của service thay đổi liên tục. **Service discovery** giúp tìm vị trí instance khỏe mạnh của service theo tên.

- **Service registry**: cơ sở dữ liệu instance (Consul, Eureka, etcd, Kubernetes API). Instance tự đăng ký (self-registration) hoặc do platform đăng ký; có health check để loại instance chết.

**Client-side discovery**: client hỏi registry, tự chọn instance và load balance (Netflix Ribbon, gRPC client LB, .NET `Microsoft.Extensions.ServiceDiscovery`).
- Ưu: ít hop, LB thông minh. Nhược: logic discovery trong mọi client/ngôn ngữ.

**Server-side discovery**: client gọi load balancer/proxy, proxy truy vấn registry và chuyển tiếp (AWS ALB, Kubernetes Service + kube-proxy).
- Ưu: client đơn giản. Nhược: thêm hop, LB phải HA.

```text
Kubernetes: http://leave-service.hr.svc.cluster.local  -> ClusterIP -> Pods
```

**Service mesh** (Istio, Linkerd): sidecar proxy xử lý discovery, mTLS, retry, traffic splitting mà không sửa code.

**Lưu ý:** Trong Kubernetes, DNS + Service đã giải quyết phần lớn nhu cầu; không cần thêm Consul/Eureka trừ khi đa môi trường.

## Circuit breaker, retry, timeout và bulkhead hoạt động thế nào? [mid]
Đây là các **resilience pattern** chống cascading failure khi gọi dependency qua network.

- **Timeout**: luôn đặt giới hạn thời gian chờ; không có timeout thì thread/connection bị giữ vô hạn.
- **Retry**: thử lại lỗi **tạm thời** (5xx, timeout, 429) với **exponential backoff + jitter** để tránh "thundering herd". Chỉ retry thao tác **idempotent**.
- **Circuit breaker**: khi tỷ lệ lỗi vượt ngưỡng → ngắt mạch, fail-fast, cho dependency thời gian hồi phục.
- **Bulkhead**: cô lập tài nguyên (pool connection/thread riêng) để một dependency chậm không kéo sập toàn bộ.
- **Fallback**: trả giá trị mặc định/cache khi lỗi.

```text
 CLOSED --(lỗi vượt ngưỡng)--> OPEN --(hết break duration)--> HALF-OPEN
   ^                                                         |
   +-----------(request thử thành công)----------------------+
                  (thử thất bại -> quay lại OPEN)
```

```csharp
builder.Services.AddHttpClient<ILeaveClient, LeaveClient>()
    .AddResilienceHandler("leave", b => b
        .AddTimeout(TimeSpan.FromSeconds(10))
        .AddRetry(new() { MaxRetryAttempts = 3, BackoffType = DelayBackoffType.Exponential, UseJitter = true })
        .AddCircuitBreaker(new() { FailureRatio = 0.5, MinimumThroughput = 20,
                                   BreakDuration = TimeSpan.FromSeconds(30) })
        .AddTimeout(TimeSpan.FromSeconds(2))); // timeout mỗi lần thử
```

**Lưu ý / bẫy thường gặp:** Retry ở nhiều tầng (client, gateway, service) nhân số request lên theo cấp số nhân (**retry storm**). Đặt tổng timeout > timeout mỗi lần thử × số lần.

## Saga pattern là gì? Orchestration và Choreography khác nhau thế nào? [senior]
**Saga** quản lý transaction nghiệp vụ trải qua nhiều service: chuỗi **local transaction**, mỗi bước có **compensating transaction** để hoàn tác nếu bước sau thất bại (không có rollback ACID toàn cục).

Ví dụ đặt hàng: `CreateOrder → ReserveStock → ChargePayment → ConfirmOrder`. Nếu `ChargePayment` lỗi → `ReleaseStock` → `CancelOrder`.

**Choreography**: không có trung tâm; mỗi service lắng nghe event và phát event tiếp theo.
```text
Order --OrderCreated--> Inventory --StockReserved--> Payment --PaymentFailed--> Inventory (release)
```

**Orchestration**: một **orchestrator** (state machine) ra lệnh cho từng service và xử lý phản hồi.
```text
            +--> ReserveStock --> Inventory
Orchestrator+--> ChargePayment --> Payment
            +--> (lỗi) ReleaseStock / CancelOrder
```

| | Choreography | Orchestration |
|---|---|---|
| Coupling | Lỏng, phân tán | Tập trung vào orchestrator |
| Theo dõi luồng | Khó (logic rải rác) | Dễ, trạng thái rõ |
| Phù hợp | Ít bước (2–4) | Luồng phức tạp, nhiều nhánh |
| Rủi ro | Vòng event, khó debug | Orchestrator thành "god service" |

Công cụ .NET: **MassTransit** state machine, NServiceBus Saga, Temporal, Azure Durable Functions.

**Lưu ý / bẫy thường gặp:** Saga thiếu **isolation** — trạng thái trung gian nhìn thấy được → dùng semantic lock (trạng thái `Pending`), mỗi bước phải idempotent, compensating action phải luôn thành công được (retry).

## Outbox pattern giải quyết vấn đề gì? Implement thế nào? [senior]
**Vấn đề dual-write**: service cần vừa cập nhật DB vừa publish message lên broker. Hai hệ thống không chung transaction:
- DB commit thành công, publish lỗi → mất event.
- Publish trước, DB rollback → event "ma".

**Transactional Outbox**: ghi message vào bảng `Outbox` **trong cùng transaction** với dữ liệu nghiệp vụ. Một tiến trình riêng (relay) đọc outbox và publish lên broker, đánh dấu đã gửi.

```text
BEGIN TX
  UPDATE LeaveRequests SET Status='Approved' ...
  INSERT INTO Outbox (Id, Type, Payload, OccurredAt) ...
COMMIT
        |
[Outbox Relay / CDC] --publish--> [RabbitMQ/Kafka] --> consumers
        |
  UPDATE Outbox SET ProcessedAt = now()
```

Cách relay:
- **Polling publisher**: BackgroundService quét bảng định kỳ (`FOR UPDATE SKIP LOCKED` khi nhiều instance).
- **Transaction log tailing (CDC)**: Debezium đọc WAL/binlog — độ trễ thấp, không tải polling.

Thư viện: **MassTransit** (EF Core outbox), NServiceBus, Wolverine, CAP.

**Lưu ý / bẫy thường gặp:**
- Outbox đảm bảo **at-least-once** → message có thể bị gửi trùng → consumer phải idempotent (thường dùng thêm **Inbox pattern**: lưu `MessageId` đã xử lý).
- Dọn bảng outbox định kỳ; giám sát backlog.

## Idempotency là gì? Thiết kế API và consumer idempotent thế nào? [senior]
Một thao tác **idempotent** khi thực hiện nhiều lần cho cùng kết quả như một lần. Cực kỳ quan trọng vì trong distributed system, retry và giao message trùng là **bình thường** (timeout không có nghĩa là thất bại).

HTTP: `GET`, `PUT`, `DELETE` vốn idempotent theo ngữ nghĩa; `POST`, `PATCH` thì không.

**API idempotent với Idempotency-Key:**
```text
POST /payments
Idempotency-Key: 7f3c...e1
```
1. Server kiểm tra key trong store (Redis/DB, có unique constraint).
2. Chưa có → xử lý, lưu key + response (TTL ví dụ 24h).
3. Đã có → trả lại **response đã lưu**, không xử lý lại.
4. Đang xử lý → trả 409 hoặc chờ.

**Consumer idempotent:**
- **Inbox/processed messages table**: `INSERT MessageId` cùng transaction với thay đổi nghiệp vụ; trùng khóa → bỏ qua.
- Thiết kế thao tác tự nhiên idempotent: `SET status = 'Paid'` thay vì `balance = balance - x`; upsert theo business key.
- Dùng version/sequence để bỏ qua event cũ.

```sql
INSERT INTO ProcessedMessages (MessageId, ProcessedAt) VALUES (@id, now())
ON CONFLICT (MessageId) DO NOTHING;
```

**Lưu ý / bẫy thường gặp:** Kiểm tra "đã tồn tại chưa" rồi mới insert (check-then-act) không an toàn khi đồng thời — phải dựa vào **unique constraint** hoặc lock nguyên tử.

# Messaging & API Communication

## RabbitMQ và Kafka khác nhau thế nào? Khi nào dùng cái nào? [mid]
**RabbitMQ**: **message broker** truyền thống (AMQP). Exchange (direct, topic, fanout, headers) route message vào queue; consumer nhận và **ack**, message bị xóa khỏi queue sau khi ack. Mô hình "smart broker, dumb consumer".

**Kafka**: **distributed commit log**. Message được append vào **topic** chia thành **partition**, lưu theo thời gian retention (có thể vĩnh viễn); consumer tự quản lý **offset**, nhiều consumer group đọc độc lập, có thể **replay**. Mô hình "dumb broker, smart consumer".

| Tiêu chí | RabbitMQ | Kafka |
|---|---|---|
| Mô hình | Queue, push | Log, pull |
| Lưu message | Xóa sau ack | Giữ theo retention, replay được |
| Throughput | Cao (chục nghìn msg/s) | Rất cao (hàng triệu msg/s) |
| Ordering | Trong một queue (1 consumer) | Trong một partition |
| Routing | Linh hoạt (exchange, binding) | Theo topic/partition key |
| Use case | Task queue, command, RPC, routing phức tạp | Event streaming, event sourcing, log, analytics, CDC |

**Chọn RabbitMQ:** phân phối công việc cho worker, routing phức tạp, độ trễ thấp, priority/TTL/dead-letter dễ.
**Chọn Kafka:** khối lượng event lớn, cần replay, nhiều hệ thống cùng tiêu thụ một luồng event, stream processing.

**Lưu ý:** RabbitMQ Streams và Kafka đang thu hẹp khoảng cách; trên cloud có Azure Service Bus, AWS SQS/SNS tương đương.

## At-most-once, at-least-once, exactly-once delivery là gì? [mid]
- **At-most-once**: message gửi tối đa một lần, có thể **mất**. Ack trước khi xử lý (hoặc không ack). Dùng cho metric, log không quan trọng.
- **At-least-once**: message chắc chắn được giao, nhưng có thể **trùng**. Ack sau khi xử lý xong; nếu consumer crash trước ack → giao lại. Đây là **mặc định thực tế** của hầu hết hệ thống.
- **Exactly-once**: mỗi message được xử lý đúng một lần — **rất khó/không thể** đạt ở mức end-to-end qua network nói chung.

```text
Consumer: nhận msg -> xử lý -> ghi DB -> [crash ở đây] -> ack
=> broker giao lại -> xử lý lại -> cần idempotency
```

**Exactly-once trong thực tế** = **at-least-once delivery + idempotent processing** ("effectively once"). Kafka có exactly-once semantics (idempotent producer + transactions) nhưng chỉ trong phạm vi Kafka → Kafka (read-process-write), không bao gồm side effect ra hệ thống ngoài.

**Kỹ thuật kèm theo:**
- **Dead Letter Queue (DLQ)** cho message lỗi liên tục (poison message) sau N lần retry.
- Retry có delay, giới hạn số lần.
- Outbox phía producer, Inbox/idempotency phía consumer.

**Lưu ý / bẫy thường gặp:** Nói "hệ thống của tôi exactly-once" mà không giải thích cơ chế idempotency là dấu hiệu hiểu chưa sâu.

## Làm sao đảm bảo thứ tự message (ordering) trong hệ thống messaging? [senior]
Thứ tự **toàn cục** rất đắt (chỉ một partition/consumer → không scale). Thực tế chỉ cần thứ tự **theo từng thực thể** (per-key ordering), ví dụ mọi event của cùng một `OrderId`.

**Kafka:**
- Message có cùng **partition key** (ví dụ `employeeId`) luôn vào cùng partition → giữ thứ tự trong partition.
- Mỗi partition chỉ được một consumer trong group xử lý.
- Producer: bật `enable.idempotence=true` để retry không làm đảo thứ tự.

**RabbitMQ:**
- Thứ tự giữ trong một queue với **một consumer** và prefetch = 1; nhiều consumer song song sẽ phá thứ tự.
- Dùng **consistent hash exchange** hoặc **single active consumer** để chia theo key.

**Ở phía consumer (phòng thủ):**
- Gắn **sequence number/version** vào event; bỏ qua hoặc buffer event có version cũ hơn trạng thái hiện tại.
- Thiết kế event mang trạng thái đầy đủ (event-carried state transfer) để event mới hơn luôn thắng.

**Các nguyên nhân phá thứ tự:** retry đẩy message lỗi ra sau, DLQ, xử lý song song trong consumer, rebalancing partition.

**Lưu ý:** trước khi đòi hỏi ordering, hỏi lại nghiệp vụ có thực sự cần không — thiết kế consumer chịu được message không theo thứ tự thường đơn giản và bền vững hơn.

## REST, gRPC và GraphQL khác nhau thế nào? Khi nào chọn cái nào? [mid]
| Tiêu chí | REST | gRPC | GraphQL |
|---|---|---|---|
| Transport | HTTP/1.1, HTTP/2 | HTTP/2 | HTTP (thường POST một endpoint) |
| Định dạng | JSON (text) | Protobuf (binary) | JSON |
| Contract | OpenAPI (tùy chọn) | `.proto` bắt buộc, strongly-typed | Schema (SDL) bắt buộc |
| Fetching | Cố định theo endpoint, dễ over/under-fetch | Cố định theo method | Client chọn field cần |
| Streaming | Hạn chế (SSE) | 4 kiểu streaming | Subscriptions |
| HTTP caching | Tốt (GET, ETag, CDN) | Không | Khó (POST) |
| Browser | Native | Cần gRPC-Web | Native |

**Chọn REST:** API public, CRUD theo tài nguyên, cần caching/CDN, tương thích rộng.
**Chọn gRPC:** giao tiếp nội bộ service-to-service, latency thấp, streaming, đa ngôn ngữ.
**Chọn GraphQL:** nhiều client với nhu cầu dữ liệu khác nhau (web/mobile), aggregate nhiều nguồn, UI thay đổi nhanh.

**Bẫy thường gặp:**
- GraphQL: **N+1** ở resolver (dùng DataLoader), query quá sâu/đắt (cần giới hạn depth, cost analysis), authorization theo từng field.
- gRPC: breaking change khi đổi số field proto.
- REST: thiết kế RPC trá hình (`/getUserById`) thay vì resource; dùng sai status code.

## Các chiến lược versioning API và đảm bảo backward compatibility? [mid]
**Các cách versioning:**
- **URL path**: `/api/v1/employees` — rõ ràng, dễ cache, dễ route ở gateway. Phổ biến nhất.
- **Query string**: `/api/employees?api-version=2.0`.
- **Header**: `X-Api-Version: 2` hoặc media type `Accept: application/vnd.hrm.v2+json` — URL sạch nhưng khó test/cache hơn.

```csharp
builder.Services.AddApiVersioning(o =>
{
    o.DefaultApiVersion = new ApiVersion(1, 0);
    o.AssumeDefaultVersionWhenUnspecified = true;
    o.ReportApiVersions = true; // header api-supported-versions
    o.ApiVersionReader = new UrlSegmentApiVersionReader();
});
```

**Backward compatibility — ưu tiên tránh phải tăng version:**
- Thay đổi **an toàn (non-breaking)**: thêm field mới optional, thêm endpoint mới, thêm giá trị enum (nếu client xử lý unknown).
- Thay đổi **breaking**: xóa/đổi tên field, đổi kiểu dữ liệu, đổi ngữ nghĩa, thêm field bắt buộc ở request.
- Client tuân theo **tolerant reader**: bỏ qua field không biết.

**Quy trình deprecation:** công bố lịch, header `Deprecation`/`Sunset`, theo dõi traffic version cũ, hỗ trợ song song ít nhất một chu kỳ.

**Lưu ý / bẫy thường gặp:** Event/message cũng cần versioning (schema registry, Avro/Protobuf compatibility rules) — thường bị quên. Consumer-driven contract test (Pact) giúp phát hiện breaking change sớm.

# Distributed Systems & Scalability

## Định lý CAP là gì? PACELC bổ sung điều gì? [mid]
**CAP theorem**: trong hệ thống phân tán, khi có **network Partition**, hệ thống chỉ có thể đảm bảo một trong hai:
- **Consistency (C)**: mọi lần đọc nhận được bản ghi mới nhất (linearizability) hoặc lỗi.
- **Availability (A)**: mọi request đến node không lỗi đều nhận được response (có thể không mới nhất).

Vì partition là điều **không tránh được** trong mạng thực tế, lựa chọn thực chất là **CP hoặc AP** khi có partition:
- **CP**: từ chối phục vụ để giữ nhất quán — ví dụ ZooKeeper, etcd, HBase, hệ thống ngân hàng.
- **AP**: vẫn phục vụ, chấp nhận dữ liệu cũ, đồng bộ sau — ví dụ Cassandra, DynamoDB (mặc định), DNS, giỏ hàng.

**PACELC** mở rộng: *If Partition → chọn A hoặc C; Else (bình thường) → chọn Latency hoặc Consistency*. Ngay cả khi không có sự cố, replication đồng bộ (C) làm tăng latency.

```text
DynamoDB/Cassandra: PA/EL      Spanner, các DB quan hệ phân tán: PC/EC
```

**Lưu ý / bẫy thường gặp:** "CA system" không có ý nghĩa trong hệ phân tán. Chữ C trong CAP **khác** chữ C trong ACID (ràng buộc toàn vẹn). Nhiều hệ thống cho phép điều chỉnh theo từng thao tác (tunable consistency, quorum `R + W > N`).

## Các mô hình consistency: strong, eventual, causal, read-your-writes? [senior]
Từ mạnh đến yếu:
- **Linearizability (strong)**: mọi thao tác như xảy ra tức thời trên một bản sao duy nhất; đọc luôn thấy ghi mới nhất. Đắt (cần consensus: Raft/Paxos).
- **Sequential consistency**: mọi node thấy cùng một thứ tự thao tác, nhưng không nhất thiết theo thời gian thực.
- **Causal consistency**: các thao tác có quan hệ nhân quả được mọi node thấy đúng thứ tự (comment trả lời luôn xuất hiện sau bài gốc); thao tác độc lập có thể khác thứ tự.
- **Eventual consistency**: nếu không có ghi mới, mọi bản sao **cuối cùng** sẽ hội tụ. Không đảm bảo khi nào.

**Session guarantees** (thực dụng cho UX):
- **Read-your-writes**: user luôn thấy dữ liệu mình vừa ghi (đọc từ primary sau khi ghi, sticky session).
- **Monotonic reads**: không thấy dữ liệu "lùi về quá khứ" khi đọc liên tiếp.
- **Monotonic writes**, **writes-follow-reads**.

```text
User cập nhật hồ sơ -> ghi Primary -> replica lag 500ms
User reload -> đọc Replica -> thấy dữ liệu cũ (vi phạm read-your-writes)
Giải pháp: đọc từ primary trong N giây sau khi ghi / theo version token
```

**Giải quyết xung đột** trong hệ eventual: last-write-wins (mất dữ liệu), vector clocks, **CRDT**.

**Lưu ý:** chọn consistency theo **từng use case nghiệp vụ** — số dư tài khoản cần strong, số lượt xem bài viết chấp nhận eventual.

## Horizontal scaling và vertical scaling khác nhau thế nào? Điều kiện để scale out? [junior]
- **Vertical scaling (scale up)**: tăng tài nguyên một máy (CPU, RAM, SSD nhanh hơn).
  - Ưu: đơn giản, không đổi code, không có vấn đề phân tán.
  - Nhược: có giới hạn phần cứng, chi phí tăng phi tuyến, vẫn là single point of failure, thường cần downtime.
- **Horizontal scaling (scale out)**: thêm nhiều máy/instance chạy song song sau load balancer.
  - Ưu: gần như không giới hạn, tăng khả dụng (HA), autoscale theo tải, dùng máy rẻ.
  - Nhược: phức tạp hơn (phân phối dữ liệu, consistency, network).

**Điều kiện để ứng dụng scale out được:**
- **Stateless**: không lưu session/state trong memory instance → chuyển session vào Redis hoặc dùng JWT.
- File upload lưu vào object storage (S3, Blob), không lưu disk local.
- Cache dùng chung (distributed cache) hoặc chấp nhận cache cục bộ không nhất quán.
- Background job có cơ chế tránh chạy trùng (distributed lock, leader election).
- Chia sẻ Data Protection keys (ASP.NET Core).

```text
                 +--> [API instance 1] --+
[Client] -> [LB] +--> [API instance 2] --+--> [Redis] [DB primary + replicas]
                 +--> [API instance 3] --+
```

**Lưu ý / bẫy thường gặp:** Database thường là bottleneck cuối cùng — app scale out dễ nhưng DB cần read replica, caching, sharding.

## Load balancing: thuật toán và L4 vs L7? [mid]
**Load balancer** phân phối request tới nhiều instance, thực hiện health check để loại instance lỗi.

**L4 (transport layer)**: dựa trên IP/port TCP/UDP, không đọc nội dung HTTP. Rất nhanh, ít tài nguyên. Ví dụ: AWS NLB, LVS.
**L7 (application layer)**: hiểu HTTP — route theo path, header, cookie; TLS termination, sticky session, rewrite, WAF. Ví dụ: NGINX, HAProxy, Envoy, AWS ALB, YARP.

**Thuật toán phổ biến:**
- **Round robin** / **weighted round robin**: đơn giản, phù hợp request đồng đều.
- **Least connections** / **least response time**: tốt khi thời gian xử lý chênh lệch.
- **IP hash / consistent hashing**: cùng client/key về cùng server (cache locality, sticky).
- **Power of two random choices**: chọn ngẫu nhiên 2, lấy cái ít tải hơn — hiệu quả, dùng trong Envoy/YARP.

**Sticky session**: giữ client gắn với một server — tiện cho app stateful (SignalR long polling) nhưng phân phối tải kém, mất session khi server chết.

**Lưu ý / bẫy thường gặp:** HTTP/2 và gRPC dùng connection dài → L4 LB chỉ cân bằng theo connection, dễ lệch tải; cần L7 hoặc client-side LB. Bản thân LB cũng cần HA (active-passive, DNS nhiều IP).

## Các chiến lược caching: cache-aside, write-through, write-behind? Và CDN? [mid]
- **Cache-aside (lazy loading)**: app đọc cache, miss → đọc DB → ghi cache. Khi ghi: update DB rồi **xóa** cache. Phổ biến nhất; cache chỉ chứa dữ liệu được dùng.
- **Read-through**: cache tự load từ DB khi miss (logic nằm trong cache provider).
- **Write-through**: ghi vào cache và DB đồng bộ → cache luôn mới, ghi chậm hơn.
- **Write-behind (write-back)**: ghi cache trước, DB được ghi bất đồng bộ sau → ghi rất nhanh, rủi ro mất dữ liệu.
- **Refresh-ahead**: làm mới trước khi hết hạn cho key nóng.

```text
Read:  App -> Cache? --hit--> trả về
                    --miss--> DB -> set Cache(TTL) -> trả về
Write: App -> DB -> delete Cache key
```

**Vấn đề thường gặp:**
- **Cache stampede / thundering herd**: key nóng hết hạn, nghìn request cùng đánh DB → lock/single-flight, TTL có jitter, refresh-ahead.
- **Cache penetration**: query key không tồn tại liên tục → cache giá trị null ngắn hạn, Bloom filter.
- **Inconsistency**: race giữa update và set cache → TTL ngắn, xóa thay vì update, delayed double delete.

**CDN**: cache nội dung (static asset, ảnh, video, thậm chí API response công khai) tại **edge server** gần người dùng → giảm latency và tải origin. Điều khiển bằng `Cache-Control`, `ETag`; invalidation bằng purge hoặc **versioned URL** (`app.3f9a.js`).

## Sharding và partitioning dữ liệu là gì? Các chiến lược và thách thức? [senior]
**Partitioning** chia dữ liệu thành phần nhỏ hơn:
- **Vertical partitioning**: tách cột/bảng ra DB khác (ví dụ bảng log, blob tách riêng).
- **Horizontal partitioning (sharding)**: chia **hàng** theo **shard key** sang nhiều DB node, mỗi node chứa một tập con dữ liệu.

**Chiến lược sharding:**
- **Range-based**: theo khoảng (`EmployeeId 1–1M` → shard 1). Query theo range tốt, dễ bị **hotspot** (dữ liệu mới dồn vào shard cuối).
- **Hash-based**: `hash(key) % N`. Phân phối đều, nhưng range query khó và **resharding** phải di chuyển nhiều dữ liệu → dùng **consistent hashing** / virtual nodes.
- **Directory/lookup-based**: bảng tra cứu key → shard. Linh hoạt, lookup service là điểm phụ thuộc.
- **Geo/tenant-based**: theo vùng hoặc tenant (phổ biến trong SaaS multi-tenant).

```text
tenant_id hash -> [Shard A: tenant 1..] [Shard B] [Shard C]
```

**Thách thức:**
- Chọn shard key sai → hotspot, không thể đổi dễ dàng.
- **Cross-shard query/join** và **cross-shard transaction** rất đắt.
- Resharding/rebalancing khi thêm node.
- Unique ID toàn cục (Snowflake ID, UUIDv7).
- Vận hành: backup, schema migration trên nhiều shard.

**Lưu ý:** sharding là bước cuối — trước đó hãy tối ưu index, query, caching, read replica, partitioning bảng trong một DB (PostgreSQL declarative partitioning), hoặc dùng DB phân tán sẵn (Citus, CockroachDB, Vitess).

# Observability & Security Architecture

## Observability là gì? Ba trụ cột logs, metrics, traces và OpenTelemetry? [mid]
**Observability** là khả năng hiểu trạng thái bên trong hệ thống qua dữ liệu nó phát ra — trả lời được cả những câu hỏi chưa biết trước. Monitoring là "biết khi nào có lỗi", observability là "hiểu vì sao".

**Ba trụ cột:**
- **Logs**: sự kiện rời rạc, chi tiết (structured JSON). Dùng để điều tra cụ thể. Công cụ: Seq, ELK, Loki.
- **Metrics**: số liệu tổng hợp theo thời gian (request rate, error rate, latency p95/p99, CPU). Rẻ, dùng cho dashboard và alert. Công cụ: Prometheus + Grafana.
- **Distributed traces**: theo dõi một request đi qua nhiều service; mỗi bước là một **span**, cùng chung **trace id** truyền qua header W3C `traceparent`. Công cụ: Jaeger, Tempo, Zipkin.

```text
Trace 4bf9...: [Gateway 120ms]
                 +-[Leave API 95ms]
                     +-[Postgres query 60ms]   <- bottleneck
                     +-[Publish RabbitMQ 5ms]
```

**OpenTelemetry (OTel)**: chuẩn mở, vendor-neutral cho thu thập traces/metrics/logs — SDK cho nhiều ngôn ngữ, giao thức **OTLP**, **Collector** để xử lý và xuất sang backend bất kỳ.

```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation()
                       .AddEntityFrameworkCoreInstrumentation().AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddRuntimeInstrumentation().AddOtlpExporter());
```

**Phương pháp:** RED (Rate, Errors, Duration) cho service, USE (Utilization, Saturation, Errors) cho tài nguyên; alert dựa trên **SLO** thay vì mọi ngưỡng CPU.

**Lưu ý:** liên kết log với trace (ghi `TraceId` vào log) để nhảy từ trace sang log; dùng sampling để kiểm soát chi phí.

## OAuth 2.0 và OpenID Connect khác nhau thế nào? Các flow chính? [senior]
- **OAuth 2.0**: framework **ủy quyền (authorization)** — cho phép client truy cập tài nguyên thay mặt user qua **access token**, không cần biết mật khẩu.
- **OpenID Connect (OIDC)**: lớp **xác thực (authentication)** trên OAuth 2.0 — bổ sung **ID token** (JWT chứa thông tin user), endpoint `userinfo`, discovery (`/.well-known/openid-configuration`).

Vai trò: **Resource Owner** (user), **Client** (app), **Authorization Server** (Keycloak, Entra ID, Duende IdentityServer, Auth0), **Resource Server** (API).

**Các flow chính:**
- **Authorization Code + PKCE**: chuẩn cho web app, SPA, mobile. Client nhận `code` qua redirect rồi đổi lấy token; PKCE (`code_verifier`/`code_challenge`) chống đánh cắp code.
- **Client Credentials**: service-to-service, không có user.
- **Device Code**: thiết bị không có trình duyệt (TV, CLI).
- **Refresh Token**: lấy access token mới, nên có rotation.
- **Deprecated**: Implicit flow và Resource Owner Password Credentials — không nên dùng.

```text
User -> SPA/BFF --redirect--> Auth Server (login, consent)
     <--redirect ?code=xyz--
BFF --POST /token (code + code_verifier)--> Auth Server
    <-- access_token, id_token, refresh_token
BFF --Bearer access_token--> API (validate signature, iss, aud, exp, scope)
```

**Lưu ý / bẫy thường gặp:** Dùng **ID token** để gọi API là sai — API chỉ nhận access token. Scope (quyền của client) khác role/permission của user. Với SPA, xu hướng hiện nay là **BFF pattern** giữ token ở server.

## Thiết kế bảo mật cho hệ thống microservices như thế nào? [senior]
**Nguyên tắc: Defense in depth + Zero Trust** — không tin mạng nội bộ, xác thực mọi request.

**Edge:**
- API Gateway/WAF: TLS, rate limiting, chặn bot, validate JWT sớm.
- BFF cho browser: cookie HttpOnly/SameSite, CSRF protection.

**Identity:**
- Identity Provider tập trung (OIDC); access token ngắn hạn, audience riêng cho từng API.
- **Token exchange** / truyền token user xuống service (để giữ ngữ cảnh user) hoặc client credentials cho service-to-service.
- Authorization **ở từng service** (không chỉ ở gateway), theo nguyên tắc **least privilege**.

**Service-to-service:**
- **mTLS** (thường qua service mesh) để xác thực danh tính service và mã hóa traffic nội bộ.
- Network policy giới hạn service nào được gọi service nào.

**Dữ liệu & secrets:**
- Mã hóa at-rest và in-transit; secrets trong Vault/Key Vault, rotation định kỳ, không hard-code.
- Mask PII trong log; audit log cho thao tác nhạy cảm.

**Supply chain & vận hành:**
- Scan dependency (Dependabot, `dotnet list package --vulnerable`), scan container image, SBOM.
- Threat modeling (STRIDE) cho luồng quan trọng; tuân thủ OWASP Top 10 / OWASP API Security Top 10 (BOLA/IDOR là lỗi phổ biến nhất).

**Lưu ý / bẫy thường gặp:** chỉ kiểm tra quyền ở gateway rồi tin tưởng mọi request nội bộ — một service bị xâm nhập sẽ truy cập được toàn hệ thống.

# System Design Interview

## Cách tiếp cận một câu hỏi system design trong phỏng vấn? [mid]
Khung trả lời 45–60 phút, ưu tiên **giao tiếp và lý giải trade-off** hơn là đáp án "đúng":

1. **Làm rõ yêu cầu (5–10')**
   - Functional: tính năng cốt lõi (giới hạn phạm vi).
   - Non-functional: số user, QPS, read/write ratio, latency, availability, consistency, data retention.
2. **Ước lượng (back-of-the-envelope)**: QPS trung bình/đỉnh, dung lượng lưu trữ, băng thông, kích thước cache.
3. **Thiết kế API & data model**: endpoint chính, schema, chọn SQL/NoSQL kèm lý do.
4. **High-level design**: vẽ các thành phần (client, LB, service, cache, DB, queue, CDN) và luồng dữ liệu chính.
5. **Deep dive**: đi sâu 1–2 phần quan trọng hoặc theo gợi ý interviewer — scaling DB, caching, consistency, hot key.
6. **Bottleneck & trade-off**: single point of failure, failure mode, monitoring, bảo mật, chi phí.

```text
Ước lượng nhanh: 100M request/ngày ~ 100M / 86,400 ~ 1,200 QPS trung bình, đỉnh x2-x5
```

**Bẫy thường gặp:**
- Nhảy vào vẽ ngay khi chưa hỏi yêu cầu.
- Nhồi buzzword (Kafka, Kubernetes, microservices) không giải thích vì sao.
- Không nói về trade-off và không lắng nghe gợi ý của interviewer.
- Thiết kế cho quy mô Google khi yêu cầu chỉ là vài nghìn user.

## Thiết kế một dịch vụ URL shortener (như bit.ly) ngắn gọn? [senior]
**Yêu cầu:** tạo short URL từ long URL, redirect nhanh, (tùy chọn) custom alias, hết hạn, thống kê click. Non-functional: read-heavy (~100:1), latency redirect thấp, HA, short code không đoán được dễ.

**Ước lượng:** 100M URL mới/tháng → ~40 write/s, ~4,000 read/s; 5 năm ~6 tỷ URL × ~500 bytes ~ 3TB. Code base62 dài 7 ký tự → 62^7 ~ 3.5 nghìn tỷ tổ hợp, đủ dùng.

**API:**
```text
POST /api/urls   { longUrl, customAlias?, expiresAt? } -> { shortUrl }
GET  /{code}     -> 301/302 Location: longUrl
```

**Sinh short code:**
- **Counter + base62**: ID duy nhất (Snowflake, hoặc mỗi server lấy dải ID từ ZooKeeper/DB) → encode base62. Không trùng, nhưng tuần tự dễ đoán (có thể xáo trộn bit).
- **Hash (MD5/SHA) lấy 7 ký tự**: có thể collision → kiểm tra và thử lại.
- Pre-generate key pool (Key Generation Service).

**Kiến trúc:**
```text
Client -> CDN/LB -> Redirect Service --(cache-aside)--> Redis (code -> longUrl)
                         |                                  | miss
                         v                                  v
                   Kafka (click events)           KV store (DynamoDB/Cassandra)
                         v
                  Analytics workers -> OLAP (ClickHouse)
```

**Điểm thảo luận:**
- **301** (permanent, browser cache → giảm tải nhưng mất thống kê) vs **302** (đếm được mọi click).
- DB: key-value NoSQL dễ scale theo `code`; quan hệ cũng đủ nếu quy mô vừa.
- Cache key nóng, TTL; ghi analytics **bất đồng bộ** để không làm chậm redirect.
- Chống lạm dụng: rate limit tạo URL, kiểm tra URL độc hại.
