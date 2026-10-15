---
topic: architecture
---

## Trong layered (N-tier) architecture truyền thống, chiều phụ thuộc thông thường là gì? [junior]
- [x] Presentation → Business Logic → Data Access
- [ ] Data Access → Business Logic → Presentation
- [ ] Mỗi layer phụ thuộc vào mọi layer khác
- [ ] Business Logic → Presentation → Data Access
> Mỗi layer chỉ gọi layer ngay bên dưới, nên business logic phụ thuộc vào data access. Clean Architecture đảo ngược điểm này để domain không phụ thuộc hạ tầng.

## Đặc điểm nào phân biệt Value Object với Entity trong DDD? [junior]
- [ ] Value Object luôn có primary key trong database
- [ ] Value Object có vòng đời và trạng thái thay đổi theo thời gian
- [x] Value Object không có identity, so sánh bằng giá trị các thuộc tính và nên immutable
- [ ] Value Object chỉ được dùng trong tầng presentation
> Hai `Money(100, "VND")` là bằng nhau dù là hai object khác nhau. Entity như `Customer` được nhận diện bằng Id, kể cả khi mọi thuộc tính khác thay đổi.

## Ưu điểm nào là của monolith so với microservices? [junior]
- [ ] Mỗi module scale độc lập
- [ ] Mỗi team dùng công nghệ khác nhau dễ dàng
- [ ] Lỗi một module không ảnh hưởng module khác
- [x] Triển khai, debug đơn giản; gọi hàm in-process và dùng được ACID transaction xuyên module
> Monolith tránh được network call, distributed transaction và vận hành nhiều service. Scale độc lập và cô lập lỗi là ưu điểm của microservices.

## Theo đặc tả HTTP, phương thức nào KHÔNG idempotent? [junior]
- [ ] PUT
- [ ] DELETE
- [x] POST
- [ ] GET
> Gọi PUT/DELETE/GET nhiều lần cho cùng kết quả trạng thái trên server; POST có thể tạo nhiều resource. Vì vậy retry POST an toàn cần idempotency key.

## Request POST tạo mới resource thành công, REST API nên trả về gì? [junior]
- [ ] 200 OK, body rỗng
- [x] 201 Created, kèm header `Location` trỏ tới resource mới
- [ ] 204 No Content
- [ ] 202 Accepted
> 201 kèm `Location` là cách chuẩn khi resource được tạo xong. 202 dùng khi request được nhận nhưng xử lý bất đồng bộ, chưa hoàn tất.

## Vai trò chính của API Gateway trong hệ thống microservices? [junior]
- [ ] Lưu trữ dữ liệu dùng chung cho các service
- [ ] Thay thế message broker
- [x] Điểm vào duy nhất: routing, authentication, rate limiting, SSL termination cho client
- [ ] Chứa business logic chung của mọi service
> Gateway xử lý cross-cutting concern ở biên hệ thống. Đưa business logic vào gateway biến nó thành điểm nghẽn và tạo coupling.

## Horizontal scaling khác vertical scaling thế nào? [junior]
- [x] Horizontal thêm nhiều máy/instance; vertical tăng CPU/RAM cho một máy
- [ ] Horizontal tăng CPU/RAM; vertical thêm instance
- [ ] Horizontal chỉ áp dụng cho database
- [ ] Vertical scaling không có giới hạn phần cứng
> Vertical scaling đơn giản nhưng có trần phần cứng và là single point of failure. Horizontal scaling cần service stateless và load balancer.

## Mô tả nào đúng với cache-aside (lazy loading) pattern? [junior]
- [ ] Mọi lần ghi đều ghi vào cache trước, cache tự ghi xuống DB sau
- [ ] Cache tự đọc DB khi miss, ứng dụng không biết DB tồn tại
- [ ] Dữ liệu chỉ nằm trong cache, không có DB
- [x] Ứng dụng đọc cache; nếu miss thì đọc DB rồi ghi kết quả vào cache
> Trong cache-aside, ứng dụng tự quản lý cache. Cache tự đọc DB khi miss là read-through; ghi cache trước rồi ghi DB sau là write-behind.

## Lợi ích chính khi đưa message queue vào giữa hai service? [junior]
- [ ] Đảm bảo response tức thì cho client
- [x] Decoupling và xử lý bất đồng bộ: producer không phụ thuộc consumer đang chạy, queue hấp thụ tải đột biến
- [ ] Loại bỏ hoàn toàn nhu cầu xử lý lỗi
- [ ] Đảm bảo strong consistency giữa hai service
> Queue cho phép consumer xử lý theo tốc độ của nó và tạm offline mà không mất message. Đổi lại hệ thống trở nên eventually consistent và cần xử lý retry/duplicate.

## Ba trụ cột (three pillars) của observability là gì? [junior]
- [ ] CPU, RAM, Disk
- [ ] Unit test, integration test, e2e test
- [x] Logs, metrics, traces
- [ ] Alerting, dashboard, on-call
> Logs ghi sự kiện chi tiết, metrics đo số liệu tổng hợp theo thời gian, traces theo dõi một request qua nhiều service. Alerting và dashboard được xây dựng trên ba nguồn dữ liệu này.

## Khác biệt giữa OAuth 2.0 và OpenID Connect (OIDC)? [junior]
- [ ] OAuth 2.0 dùng cho authentication, OIDC dùng cho authorization
- [ ] OIDC là phiên bản cũ của OAuth 2.0
- [ ] Hai giao thức không liên quan nhau
- [x] OAuth 2.0 là framework uỷ quyền (access token); OIDC là lớp identity trên OAuth 2.0, thêm ID token để xác thực người dùng
> Access token của OAuth 2.0 dùng để gọi API, không được thiết kế để chứng minh danh tính. OIDC chuẩn hoá ID token (JWT), `userinfo` endpoint và scope `openid`.

## Vì sao service nên stateless khi chạy nhiều instance sau load balancer? [junior]
- [ ] Để không cần database
- [x] Để bất kỳ instance nào cũng xử lý được mọi request, dễ scale và thay thế instance
- [ ] Vì load balancer không hỗ trợ HTTP session
- [ ] Để giảm số dòng code
> Khi state (session, cache cục bộ) nằm trong instance, phải dùng sticky session và mất dữ liệu khi instance chết. State nên đưa ra store dùng chung như Redis hoặc DB.

## Theo dependency rule của Clean Architecture, interface `IOrderRepository` nên đặt ở đâu? [mid]
- [ ] Trong project Infrastructure, cùng với implementation EF Core
- [x] Trong core (Domain/Application); Infrastructure implement interface đó
- [ ] Trong project Web API
- [ ] Trong một project Shared mà mọi layer đều tham chiếu
> Dependency hướng vào trong: core định nghĩa abstraction, hạ tầng bên ngoài implement (Dependency Inversion). Đặt interface ở Infrastructure khiến core phải tham chiếu ra ngoài.

## Trong Hexagonal Architecture (Ports & Adapters), REST controller nhận request từ client đóng vai trò gì? [mid]
- [ ] Driven (secondary) adapter
- [ ] Port
- [ ] Domain service
- [x] Driving (primary) adapter
> Driving adapter gọi vào ứng dụng qua port inbound (use case). Repository dùng EF Core hay client gửi email là driven adapter, được ứng dụng gọi ra qua port outbound.

## Aggregate `Order` cần biết khách hàng đặt đơn. Cách thiết kế khuyến nghị theo DDD? [mid]
- [ ] Nhúng toàn bộ object `Customer` vào trong aggregate `Order` để sửa cả hai trong một transaction
- [x] `Order` chỉ giữ `CustomerId`, tham chiếu aggregate khác bằng identity
- [ ] Gộp `Customer` và `Order` thành một aggregate lớn
- [ ] Để `Customer` chứa danh sách mọi `Order`
> Tham chiếu bằng Id giữ aggregate nhỏ, mỗi transaction chỉ sửa một aggregate và tránh contention. Aggregate lớn gây lock và load dữ liệu thừa.

## Domain event khác integration event thế nào? [mid]
- [ ] Domain event luôn đi qua Kafka, integration event thì không
- [ ] Không khác nhau, chỉ là tên gọi
- [ ] Integration event chỉ dùng trong cùng một aggregate
- [x] Domain event diễn tả điều xảy ra trong một bounded context, thường xử lý in-process; integration event được publish ra ngoài cho context/service khác qua broker
> Integration event là hợp đồng công khai nên cần versioning và ổn định. Domain event là chi tiết nội bộ, có thể đổi tự do hơn.

## Phát biểu nào đúng về CQRS? [mid]
- [ ] CQRS bắt buộc phải dùng Event Sourcing
- [ ] CQRS bắt buộc hai database riêng cho read và write
- [x] CQRS tách model ghi (command) và model đọc (query); có thể dùng chung một database, và Event Sourcing là tuỳ chọn
- [ ] CQRS giúp hệ thống luôn strong consistency
> CQRS thường đi cùng Event Sourcing và read store riêng nhưng không bắt buộc. Khi read model được đồng bộ bất đồng bộ, hệ thống trở nên eventually consistent.

## Circuit breaker ở trạng thái Half-Open hoạt động thế nào? [mid]
- [ ] Chặn toàn bộ request vô thời hạn
- [ ] Cho mọi request đi qua như bình thường
- [x] Cho một số request thử đi qua; thành công thì về Closed, thất bại thì quay lại Open
- [ ] Tự retry request lỗi cho đến khi thành công
> Closed: request đi qua, đếm lỗi. Open: fail fast trong khoảng thời gian break. Half-Open: thăm dò xem downstream đã hồi phục chưa.

## Client gọi `POST /payments`, bị timeout và retry. Làm sao tránh trừ tiền hai lần? [mid]
- [x] Client gửi `Idempotency-Key`; server lưu key cùng kết quả và trả lại kết quả cũ khi gặp key trùng
- [ ] Đổi sang `GET /payments`
- [ ] Tắt retry ở client
- [ ] Tăng timeout lên 5 phút
> Timeout không cho biết request đầu đã thực hiện hay chưa, nên retry là cần thiết; idempotency key biến POST thành an toàn khi retry. Tăng timeout chỉ giảm xác suất chứ không loại bỏ vấn đề.

## Các event của cùng một đơn hàng phải được consumer Kafka xử lý đúng thứ tự. Cách làm đúng? [mid]
- [ ] Kafka đảm bảo thứ tự trên toàn topic, không cần làm gì
- [x] Dùng `orderId` làm message key để mọi event của đơn hàng vào cùng một partition
- [ ] Mỗi đơn hàng tạo một topic riêng
- [ ] Dùng round-robin partitioner
> Kafka chỉ đảm bảo thứ tự trong một partition; partitioner mặc định hash key để chọn partition. Round-robin rải event ra nhiều partition nên phá vỡ thứ tự.

## Một service mới cần đọc lại toàn bộ event của 7 ngày qua. Lựa chọn broker nào phù hợp hơn? [mid]
- [ ] RabbitMQ classic queue, vì message được giữ mãi sau khi ack
- [ ] Redis Pub/Sub
- [ ] Bất kỳ broker nào cũng replay được
- [x] Kafka, vì message được giữ theo retention trên log và consumer group mới có thể đọc từ offset cũ
> Kafka là commit log có retention; consumer tự quản lý offset nên replay được. RabbitMQ classic queue xoá message sau ack, còn Redis Pub/Sub không lưu message.

## Hạn chế nào của gRPC so với REST/JSON? [mid]
- [ ] Không hỗ trợ streaming
- [ ] Payload lớn hơn JSON
- [x] Browser không gọi trực tiếp được gRPC thuần; cần gRPC-Web hoặc proxy chuyển đổi
- [ ] Không có strongly-typed contract
> gRPC dùng HTTP/2 với trailer mà browser API không cho phép kiểm soát. Ngược lại, gRPC hỗ trợ streaming hai chiều, payload Protobuf nhỏ hơn và contract `.proto` strongly-typed.

## Vì sao nên thêm jitter vào exponential backoff khi retry? [mid]
- [ ] Để retry nhanh hơn
- [x] Tránh nhiều client retry đồng loạt cùng thời điểm (thundering herd) làm downstream quá tải lại
- [ ] Để đảm bảo request luôn thành công
- [ ] Để bỏ qua circuit breaker
> Không có jitter, các client lỗi cùng lúc sẽ retry cùng nhịp và tạo các đợt tải dồn dập. Jitter rải đều thời điểm retry.

## Ứng dụng SPA (React/Angular) cần đăng nhập qua OAuth 2.0/OIDC. Flow khuyến nghị hiện nay? [mid]
- [ ] Implicit flow
- [ ] Resource Owner Password Credentials
- [ ] Client Credentials
- [x] Authorization Code flow kèm PKCE
> OAuth 2.0 Security BCP không khuyến nghị Implicit và ROPC. Client Credentials dành cho machine-to-machine, không có người dùng; PKCE bảo vệ authorization code cho public client không giữ được secret.

## Service lưu `Order` vào DB rồi publish `OrderCreated` lên broker. Thỉnh thoảng đơn đã lưu nhưng event không bao giờ được gửi. Giải pháp phù hợp nhất? [senior]
- [ ] Publish event trước rồi mới lưu DB
- [ ] Bọc cả hai trong `TransactionScope` để có distributed transaction
- [x] Transactional outbox: ghi event vào bảng outbox trong cùng transaction với `Order`, một relay/CDC publish sau đó
- [ ] Retry publish 3 lần trong cùng request
> Đây là dual-write problem: process có thể crash giữa hai bước. Đảo thứ tự chỉ đổi lỗi thành event có mà dữ liệu không có; retry trong request vẫn mất event nếu process chết.

## Sau khi áp dụng outbox, hệ thống thỉnh thoảng gửi email xác nhận hai lần. Nguyên nhân và cách xử lý? [senior]
- [ ] Outbox bị lỗi cấu hình, nó phải đảm bảo exactly-once
- [x] Outbox cho at-least-once delivery; consumer phải idempotent, vd. lưu message ID đã xử lý (inbox/dedup table) trong cùng transaction với side effect
- [ ] Do broker có nhiều partition, giảm về 1 partition
- [ ] Tắt retry của relay
> Relay có thể publish xong nhưng crash trước khi đánh dấu đã gửi, nên message bị gửi lại. Tắt retry đổi duplicate thành mất message, thường còn tệ hơn.

## Saga đặt hàng: Order → Payment → Inventory. Bước Inventory thất bại vì hết hàng. Phát biểu nào đúng? [senior]
- [ ] Database tự rollback mọi bước như transaction ACID
- [ ] Saga đảm bảo isolation nên không ai thấy trạng thái trung gian
- [ ] Cần two-phase commit giữa ba service
- [x] Chạy compensating transaction (hoàn tiền, huỷ đơn); saga không có isolation nên phải xử lý trạng thái trung gian (vd. trạng thái `PENDING`, semantic lock)
> Mỗi bước của saga commit cục bộ nên rollback phải là hành động nghiệp vụ ngược lại. Thiếu isolation có thể gây dirty read hoặc lost update, nên cần countermeasure.

## Phát biểu nào phản ánh đúng định lý CAP? [senior]
- [ ] Hệ thống luôn chỉ chọn được 2 trong 3 tính chất C, A, P ở mọi thời điểm
- [x] Khi xảy ra network partition, hệ thống phân tán phải chọn giữa consistency và availability
- [ ] Database quan hệ là CA nên không bị ảnh hưởng bởi partition
- [ ] Consistency trong CAP giống Consistency trong ACID
> Partition là không thể tránh trong hệ phân tán, nên lựa chọn thực tế là CP hoặc AP khi có partition; PACELC bổ sung rằng khi không partition thì phải đánh đổi latency và consistency. C trong CAP là linearizability, khác C (ràng buộc toàn vẹn) trong ACID.

## Bảng `orders` được shard theo `created_date` (mỗi tháng một shard). Hệ thống bị nghẽn ghi. Nguyên nhân và hướng xử lý? [senior]
- [ ] Số shard quá ít, tăng lên mỗi ngày một shard
- [ ] Do thiếu index trên `created_date`
- [x] Mọi lệnh ghi mới dồn vào shard tháng hiện tại (hot shard); chọn shard key phân bố đều như hash của `customer_id`
- [ ] Do dùng UUID làm primary key
> Range sharding theo thời gian luôn có hot spot ở khoảng mới nhất. Shard theo ngày vẫn dồn mọi lệnh ghi vào một shard; hash key phân tán tải nhưng làm range query theo thời gian phải scatter-gather.

## Team có 8 microservice dùng chung một database, mỗi tính năng đều phải deploy đồng thời 4–5 service, và các service gọi nhau đồng bộ thành chuỗi dài. Đánh giá phù hợp nhất? [senior]
- [ ] Cần tách thêm nhiều service nhỏ hơn
- [ ] Chỉ cần thêm service mesh để giải quyết
- [ ] Chuyển toàn bộ giao tiếp sang gRPC
- [x] Đây là distributed monolith; nên vẽ lại ranh giới theo bounded context, có thể gộp lại thành modular monolith
> Shared database và deploy đồng thời cho thấy service coupling chặt; hệ thống chịu chi phí phân tán mà không có lợi ích deploy độc lập. Tách nhỏ hơn hay đổi giao thức không sửa được ranh giới sai.

## Hệ thống Event Sourcing có aggregate với hàng trăm nghìn event, mỗi lần load aggregate rất chậm. Giải pháp phù hợp nhất? [senior]
- [ ] Xoá các event cũ đã xử lý
- [x] Dùng snapshot định kỳ: load snapshot gần nhất rồi replay các event sau đó
- [ ] Sửa trực tiếp event cũ để gộp chúng lại
- [ ] Chuyển sang lưu event trong cache
> Event store là append-only và là nguồn sự thật; xoá hoặc sửa event làm mất audit trail và khả năng rebuild projection. Snapshot chỉ là tối ưu, có thể tạo lại từ event.

## Hệ thống CQRS cập nhật read model bất đồng bộ. Người dùng tạo đơn xong, chuyển sang trang danh sách thì không thấy đơn vừa tạo. Cách xử lý hợp lý? [senior]
- [ ] Bỏ CQRS vì không dùng được với UI
- [ ] Bắt client F5 nhiều lần
- [ ] Khoá toàn bộ read database cho đến khi đồng bộ xong
- [x] Đảm bảo read-your-writes: trả version/ID sau command, UI hiển thị optimistic hoặc chờ đến khi read model đạt version đó
> Eventual consistency là đánh đổi có chủ đích của CQRS, nên xử lý ở UX hoặc bằng version tracking. Khoá read DB triệt tiêu lợi ích scale đọc.

## Với cache-aside, khi cập nhật dữ liệu, cách nào ít rủi ro stale data nhất trong thực tế? [senior]
- [x] Cập nhật DB trước, sau đó xoá (invalidate) key trong cache
- [ ] Cập nhật cache trước, sau đó cập nhật DB
- [ ] Cập nhật DB rồi ghi đè giá trị mới vào cache
- [ ] Xoá cache trước rồi mới cập nhật DB
> Ghi đè cache có thể bị race giữa hai lệnh ghi đồng thời làm cache giữ giá trị cũ. Xoá cache trước khi ghi DB cho phép một request đọc nạp lại giá trị cũ vào cache ngay trước khi DB cập nhật. Vẫn còn cửa sổ race nhỏ, nên đặt TTL làm lưới an toàn.

## Request đi qua 6 service, khi lỗi team không thể nối log giữa các service để biết request chết ở đâu. Giải pháp phù hợp nhất? [senior]
- [ ] Tăng log level lên Debug ở mọi service
- [x] Distributed tracing (vd. OpenTelemetry): propagate trace context qua header W3C `traceparent` và ghi trace ID vào mọi log
- [ ] Gộp log tất cả service vào một file
- [ ] Mỗi service tự sinh correlation ID mới
> Trace context được truyền qua mọi hop giúp tạo trace end-to-end và liên kết log với span. Mỗi service tự sinh ID mới thì vẫn không nối được; log Debug chỉ làm tăng nhiễu.

## Topic Kafka có 6 partition, consumer group có 10 consumer, lag vẫn tăng. Phân tích đúng? [senior]
- [ ] Kafka tự chia một partition cho nhiều consumer cùng group, nên cần thêm consumer nữa
- [ ] Cần tạo consumer group thứ hai để chia tải
- [x] Mỗi partition chỉ được gán cho tối đa một consumer trong group, nên 4 consumer đang rảnh; cần tăng số partition (lưu ý mapping key → partition thay đổi) hoặc tối ưu xử lý
- [ ] Do replication factor quá thấp
> Số partition là giới hạn song song của một consumer group. Group thứ hai sẽ đọc lại toàn bộ message chứ không chia tải; tăng partition làm đổi phân bổ key nên ảnh hưởng ordering trong giai đoạn chuyển tiếp.

## Downstream service không lỗi nhưng phản hồi rất chậm (30s), khiến service gọi cạn thread/connection và sập dây chuyền. Kết hợp pattern nào phù hợp nhất? [senior]
- [ ] Chỉ thêm retry với exponential backoff
- [ ] Tăng thread pool và connection pool lên gấp đôi
- [ ] Chuyển sang gọi đồng bộ để dễ kiểm soát
- [x] Timeout ngắn + bulkhead (giới hạn tài nguyên cho từng dependency) + circuit breaker để fail fast
> Không có timeout, request chậm không bao giờ bị tính là lỗi nên circuit breaker không mở. Chỉ retry làm tải lên downstream đang chậm tăng thêm; tăng pool chỉ trì hoãn thời điểm cạn tài nguyên.
