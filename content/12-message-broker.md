---
id: message-broker
title: Message Broker
icon: 📨
order: 12
description: Message broker chuyên sâu - RabbitMQ, Kafka, Azure Service Bus, SQS/SNS, reliability patterns, tích hợp .NET/Node, vận hành và tình huống senior
---

# Nền tảng Messaging

## Vì sao cần message broker? Giao tiếp sync và async khác nhau thế nào? [junior]
**Message broker** là thành phần trung gian nhận message từ producer, lưu trữ (tạm thời hoặc lâu dài) và chuyển tới consumer. Nó tách rời (decouple) hai bên theo ba chiều:

- **Thời gian (temporal):** consumer không cần online khi producer gửi.
- **Không gian (spatial):** producer không cần biết địa chỉ, số lượng consumer.
- **Tốc độ (rate):** broker là bộ đệm hấp thụ peak traffic (load leveling).

| Tiêu chí | Sync (HTTP/gRPC) | Async (qua broker) |
| --- | --- | --- |
| Coupling | Caller phụ thuộc availability của callee | Lỏng, callee down vẫn nhận message sau |
| Latency phản hồi | Có kết quả ngay | Chỉ biết "đã nhận", kết quả đến sau |
| Failure | Lỗi lan truyền (cascading failure) | Cô lập, retry được |
| Độ phức tạp | Thấp, dễ debug | Cao: eventual consistency, duplicate, ordering |
| Phù hợp | Query, cần kết quả ngay | Command dài, notification, integration giữa service |

Use case điển hình: gửi email/SMS, xử lý ảnh/video, đồng bộ dữ liệu giữa microservice, event-driven integration, log/metrics pipeline, buffer cho hệ thống ghi nặng.

**Lưu ý / bẫy thường gặp:** async không miễn phí. Bạn đổi lấy decoupling bằng cách phải xử lý duplicate message, out-of-order, poison message, monitoring queue depth và eventual consistency trên UI. Đừng đưa broker vào chỉ để "trông giống microservice" khi một HTTP call đơn giản là đủ. Và "fire-and-forget" qua broker vẫn cần chiến lược khi broker không nhận được message (publisher confirms, outbox).

## Queue (point-to-point) và Topic (pub/sub) khác nhau thế nào? Push và pull model? [junior]
**Point-to-point (queue):** mỗi message được giao cho **đúng một** consumer trong nhóm consumer cùng đọc queue đó (competing consumers). Dùng để phân phối công việc (work queue).

**Publish/Subscribe (topic):** mỗi message được giao cho **tất cả** subscriber. Dùng để broadcast event cho nhiều hệ thống quan tâm.

Mỗi broker hiện thực khác nhau:

- **RabbitMQ:** pub/sub = fanout/topic exchange bind tới nhiều queue; mỗi queue là point-to-point.
- **Kafka:** topic + **consumer group**. Trong một group, mỗi partition chỉ có một consumer (giống queue); nhiều group khác nhau đều đọc toàn bộ topic (giống pub/sub).
- **Azure Service Bus:** Queue và Topic/Subscription; **AWS:** SQS (queue) + SNS (topic).

**Push vs Pull:**

| | Push | Pull |
| --- | --- | --- |
| Ví dụ | RabbitMQ `basic.consume`, SNS, Azure Service Bus processor | Kafka `poll()`, SQS `ReceiveMessage` |
| Ưu | Latency thấp, consumer đơn giản | Consumer tự kiểm soát tốc độ, batch tốt, dễ replay |
| Nhược | Có thể đè chết consumer nếu không giới hạn | Phải poll, tốn request rỗng (khắc phục bằng long polling) |

RabbitMQ push nhưng có **prefetch** để giới hạn số message chưa ack; Kafka pull nên back-pressure tự nhiên: consumer chậm thì chỉ bị lag.

**Lưu ý / bẫy thường gặp:** đừng nói "Kafka là queue". Kafka là **distributed commit log**: message không bị xóa khi đọc, consumer chỉ dịch offset. Điều này cho phép replay nhưng không có ack từng message hay DLQ native như RabbitMQ.

## Message, Event và Command khác nhau thế nào? [junior]
Cả ba đều là "message" về mặt vận chuyển, khác nhau ở **ý nghĩa (intent)** và **ownership**:

| | Command | Event | Query/Document message |
| --- | --- | --- | --- |
| Ý nghĩa | Yêu cầu làm gì đó | Thông báo điều **đã xảy ra** | Chuyển dữ liệu |
| Tên | Động từ mệnh lệnh: `CreateInvoice`, `ChargePayment` | Quá khứ: `OrderPlaced`, `PaymentFailed` | `CustomerSnapshot` |
| Số người nhận | Đúng **một** handler | **0..N** subscriber | Tùy |
| Có thể từ chối? | Có (validation fail) | Không, nó là sự thật đã xảy ra | - |
| Ownership schema | Thuộc service **nhận** (consumer định nghĩa contract) | Thuộc service **phát** | - |
| Transport | Queue (point-to-point) | Topic / exchange fanout | - |

Ví dụ luồng: `Order API` gửi command `PlaceOrder` → `Order Service` xử lý → publish event `OrderPlaced` → `Inventory`, `Email`, `Analytics` cùng subscribe.

**Lưu ý / bẫy thường gặp:**
- Đặt tên event kiểu command trá hình (`SendEmailEvent`) là dấu hiệu coupling: producer đang "ra lệnh" cho consumer cụ thể.
- Event nên bất biến (immutable) và có `eventId`, `occurredAt`, `version`.
- Phân biệt **domain event** (trong bounded context, thường in-process) và **integration event** (qua broker, schema ổn định, đã versioning).

## Broker-based và brokerless messaging (ZeroMQ) khác nhau thế nào? [mid]
**Broker-based** (RabbitMQ, Kafka, ActiveMQ): có server trung gian lưu message, quản lý routing, persistence, ack, retry.

**Brokerless** (ZeroMQ, nanomsg, NNG): là **thư viện socket** nhúng trong ứng dụng, cung cấp pattern REQ/REP, PUB/SUB, PUSH/PULL, ROUTER/DEALER. Các node nói chuyện trực tiếp với nhau.

| | Broker | Brokerless |
| --- | --- | --- |
| Latency | Thêm 1 hop, ms | Rất thấp, micro giây |
| Persistence | Có (durable queue, log) | Không có sẵn, message mất khi process chết |
| Decoupling thời gian | Có | Không, bên nhận phải online |
| Vận hành | Phải chạy cluster, monitor | Không có server, nhưng logic phân tán vào app |
| Single point of failure | Broker (giải quyết bằng cluster) | Không có SPOF trung tâm |
| Use case | Integration giữa service, durable workflow | HFT, IPC nội bộ, telemetry tốc độ cao, game server |

Ngoài ra còn mô hình "lai": **NATS Core** là broker nhưng fire-and-forget, không lưu (at-most-once), latency gần brokerless; khi cần persistence thì bật **JetStream**.

**Lưu ý / bẫy thường gặp:** brokerless không có nghĩa là "không cần infra". Bạn phải tự giải quyết service discovery, reconnect, buffer khi peer chậm (ZeroMQ có high-water mark, vượt ngưỡng sẽ drop hoặc block tùy socket type). Trong phỏng vấn, nêu rõ: chọn brokerless khi cần latency cực thấp và chấp nhận mất message.

## So sánh các broker phổ biến: RabbitMQ, Kafka, ActiveMQ, Azure Service Bus, SQS/SNS, Redis Streams, NATS, Pulsar? [mid]
| Broker | Mô hình | Điểm mạnh | Hạn chế | Use case |
| --- | --- | --- | --- | --- |
| **RabbitMQ** | Smart broker, AMQP 0-9-1, queue | Routing linh hoạt (exchange), ack từng message, DLX, priority, nhiều protocol (MQTT, STOMP, AMQP 1.0) | Throughput thấp hơn Kafka, queue không thiết kế để giữ lâu | Task queue, RPC, workflow nghiệp vụ |
| **Kafka** | Distributed commit log, partition | Throughput rất cao, retention + replay, ecosystem (Connect, Streams) | Không có per-message ack/DLQ native, ordering chỉ theo partition, vận hành nặng hơn | Event streaming, CDC, analytics, event backbone |
| **ActiveMQ (Classic/Artemis)** | JMS broker | Chuẩn JMS, XA, phổ biến trong Java enterprise | Ecosystem ngoài Java hẹp hơn | Hệ thống Java legacy |
| **Azure Service Bus** | Managed queue + topic | Sessions (FIFO), DLQ, duplicate detection, scheduled message, transactions | Throughput/giá theo tier, chỉ Azure | Enterprise integration trên Azure |
| **AWS SQS + SNS** | Managed queue + push fan-out | Serverless, gần như vô hạn scale, rẻ | Standard không đảm bảo thứ tự, FIFO giới hạn throughput | Decouple trên AWS, Lambda trigger |
| **Redis Streams** | Log trong Redis | Đơn giản, latency thấp, consumer group | Bị giới hạn RAM, durability phụ thuộc AOF/RDB | Hàng đợi nhẹ khi đã có Redis |
| **NATS / JetStream** | Subject-based pub/sub | Rất nhẹ, latency thấp, request-reply native | Ecosystem nhỏ hơn Kafka | Edge/IoT, control plane, microservice nội bộ |
| **Apache Pulsar** | Broker stateless + BookKeeper storage | Tách compute/storage, multi-tenant, geo-replication, tiered storage, hỗ trợ cả queue và stream | Nhiều thành phần, cộng đồng nhỏ hơn Kafka | Multi-tenant platform quy mô lớn |

**Lưu ý / bẫy thường gặp:** câu trả lời tốt luôn xuất phát từ yêu cầu: cần replay? cần routing phức tạp? cần ordering? đội ngũ có vận hành nổi cluster không? Trên cloud, managed service (Service Bus, SQS, Confluent Cloud, Amazon MSK) thường rẻ hơn tổng chi phí tự vận hành.

# RabbitMQ chuyên sâu

## Mô hình AMQP 0-9-1 gồm những thành phần nào? Connection và Channel khác gì nhau? [junior]
Luồng cơ bản:

```text
Producer --publish(routingKey)--> [Exchange] --binding(bindingKey)--> [Queue] --deliver--> Consumer
```

- **Producer:** gửi message tới **exchange** (không bao giờ gửi thẳng tới queue; "gửi thẳng" thực chất là qua *default exchange* `""` với routing key = tên queue).
- **Exchange:** nhận message, dựa vào type + routing key + binding để quyết định copy message sang queue nào.
- **Binding:** quy tắc nối exchange với queue (hoặc exchange với exchange).
- **Routing key:** thuộc tính của message, exchange dùng để so khớp.
- **Queue:** nơi lưu message cho tới khi consumer ack.
- **Consumer:** đăng ký (`basic.consume`) nhận message từ queue.
- **Virtual host (vhost):** namespace logic tách exchange/queue/permission giữa các tenant/môi trường.

**Connection vs Channel:**

| Connection | Channel |
| --- | --- |
| Một TCP connection (có TLS, heartbeat, auth) | Kết nối logic **multiplex** bên trong connection |
| Đắt: handshake, mỗi connection tốn RAM/file descriptor ở broker | Rẻ, mở/đóng nhanh |
| Nên **long-lived**, ít (1-2 connection/process: một cho publish, một cho consume) | Thường mỗi thread/consumer một channel |

**Lưu ý / bẫy thường gặp:**
- Anti-pattern kinh điển: mở connection mới cho mỗi message → broker cạn file descriptor, CPU tăng vọt, "connection churn".
- Channel **không thread-safe** cho việc publish đồng thời trong hầu hết client; đừng share một channel giữa nhiều thread publish.
- Lỗi ở mức channel (ví dụ declare queue với tham số khác) sẽ **đóng channel**, cần code xử lý tạo lại.
- Tách connection publish và consume: khi broker kích hoạt flow control (memory alarm) nó block connection publish, nếu dùng chung thì consumer cũng bị chặn, không ai giải phóng queue được.

## Các loại exchange: direct, fanout, topic, headers? Cho ví dụ. [junior]
| Type | Cách routing | Ví dụ |
| --- | --- | --- |
| **direct** | routing key == binding key | Exchange `email`, queue `email.high` bind key `high`, queue `email.low` bind key `low` |
| **fanout** | Bỏ qua routing key, copy tới **mọi** queue đã bind | `order.events` fanout tới queue của inventory, billing, analytics |
| **topic** | So khớp pattern theo từ phân tách bằng dấu chấm: `*` = đúng 1 từ, `#` = 0 hoặc nhiều từ | Key `order.vn.created`; binding `order.*.created` (mọi quốc gia), `order.vn.#` (mọi event ở VN), `#` (tất cả) |
| **headers** | So khớp header của message, `x-match = all` hoặc `any` | `format=pdf AND type=report` |

Ngoài ra **default exchange** (`""`) là direct exchange mà mọi queue tự động bind với tên của nó.

```text
routing key: order.vn.created
  binding "order.*.created"  -> khớp
  binding "order.#"          -> khớp
  binding "*.created"        -> KHÔNG khớp (* chỉ đúng 1 từ)
  binding "order.vn"         -> KHÔNG khớp
```

Còn có **exchange-to-exchange binding** để xây cây routing, và **alternate exchange** (`alternate-exchange` argument) nhận message không khớp queue nào thay vì bị drop.

**Lưu ý / bẫy thường gặp:**
- Message publish tới exchange mà không có queue nào khớp sẽ **bị drop im lặng** trừ khi set `mandatory=true` (broker trả `basic.return`) hoặc dùng alternate exchange.
- Headers exchange chậm hơn, ít dùng; đa số bài toán giải được bằng topic.
- Topic exchange với `#` hành xử như fanout, với key không có wildcard hành xử như direct.

## Ack, nack, reject và requeue hoạt động thế nào? Prefetch (QoS) là gì? [mid]
Khi consumer dùng **manual ack** (`autoAck=false`), message được giao ở trạng thái **unacked** và chỉ bị xóa khỏi queue khi broker nhận được:

- `basic.ack(deliveryTag, multiple)`: xử lý xong, xóa message. `multiple=true` ack mọi tag ≤ deliveryTag.
- `basic.nack(deliveryTag, multiple, requeue)`: extension của RabbitMQ, từ chối một hoặc nhiều message.
- `basic.reject(deliveryTag, requeue)`: chuẩn AMQP, chỉ từng message.
- `requeue=true`: đưa lại queue (thường về gần đầu queue); `requeue=false`: drop hoặc chuyển sang **DLX** nếu có cấu hình.

Nếu channel/connection đóng khi message còn unacked, broker tự động requeue và set cờ `redelivered=true`.

**Auto ack** (`autoAck=true`): message coi như xong ngay khi gửi ra socket → at-most-once, crash là mất.

**Prefetch** (`basic.qos(prefetchCount)`): giới hạn số message unacked tối đa trên một consumer (hoặc channel). Mặc định là **0 = không giới hạn**: broker đẩy hết queue vào RAM của consumer.

- Prefetch thấp (1-10): phân phối công bằng, phù hợp task nặng, thời gian không đều.
- Prefetch cao (100-300): throughput tốt cho task nhanh, nhưng một consumer có thể "ôm" nhiều message trong khi consumer khác rảnh.
- Công thức ước lượng: prefetch ≈ round-trip time / thời gian xử lý mỗi message, sau đó đo đạc thực tế.

**Lưu ý / bẫy thường gặp:**
- `nack(requeue=true)` với lỗi vĩnh viễn → **vòng lặp vô hạn** (poison message) đốt CPU. Quorum queue có `delivery-limit` (mặc định 20 từ RabbitMQ 4.0) để chặn.
- Quên ack → message kẹt unacked mãi đến khi consumer ngắt kết nối; quorum/classic queue có `consumer_timeout` (mặc định 30 phút) để đóng channel vi phạm.
- Ack phải được gửi trên **cùng channel** đã nhận message.

## Làm sao đảm bảo không mất message ở phía RabbitMQ: durable, persistent, publisher confirms, mandatory? [mid]
Mất message có thể xảy ra ở 3 chặng; mỗi chặng cần một cơ chế:

**1. Producer → Broker: Publisher confirms**
- Bật `confirm.select` trên channel; broker gửi `basic.ack` khi message đã được ghi an toàn (với persistent message trên quorum queue: khi đa số replica đã ghi), `basic.nack` khi lỗi nội bộ.
- Producer phải xử lý confirm (async, theo batch) và **retry** nếu nack/timeout. Đây là at-least-once nên có thể duplicate.
- **Transactions AMQP** (`tx.select`) cũng làm được nhưng chậm hơn rất nhiều; không khuyến nghị.

**2. Trong broker: durable + persistent + replication**
- Queue/exchange `durable=true`: định nghĩa còn sau restart.
- Message `deliveryMode=2` (persistent): nội dung được ghi đĩa. Queue durable mà message transient thì vẫn mất message khi restart (quorum queue luôn lưu message xuống đĩa).
- Dùng **quorum queue** để có replication qua Raft, chịu được mất node.

**3. Broker → Consumer: manual ack** sau khi xử lý xong và commit DB.

**mandatory flag:** nếu message không route được tới queue nào, broker trả về producer qua `basic.return` thay vì drop im lặng. Kết hợp với confirm: message unroutable vẫn được confirm ack (sau khi return), nên phải lắng nghe event return.

```text
Producer --(publish, mandatory, persistent)--> Exchange --> Quorum queue (3 replicas)
   ^                                                               |
   +------------- basic.ack (confirm) <----- majority fsync -------+
Consumer <-- deliver -- process + commit DB -- basic.ack --> broker xóa message
```

**Lưu ý / bẫy thường gặp:** confirms chỉ đảm bảo broker nhận được, không giải quyết việc app crash **giữa** lúc commit DB và publish. Bài toán "DB + publish atomic" phải dùng **transactional outbox**.

## Dead Letter Exchange, TTL, delayed retry và priority queue trong RabbitMQ? [mid]
**Dead Letter Exchange (DLX):** queue có argument `x-dead-letter-exchange` (và tùy chọn `x-dead-letter-routing-key`). Message bị "dead-letter" khi:
1. Bị `reject`/`nack` với `requeue=false`.
2. Hết hạn TTL.
3. Queue vượt `x-max-length`/`x-max-length-bytes` (với `overflow=drop-head`).
4. Quorum queue: vượt `delivery-limit`.

Header `x-death` ghi lại lý do, queue gốc, số lần.

**TTL:** per-queue `x-message-ttl` hoặc per-message `expiration`. Queue cũng có `x-expires` để tự xóa queue không dùng.

**Delayed retry bằng TTL + DLX (retry queue pattern):**

```text
work.queue --nack(requeue=false)--> DLX "retry" --> retry.5s (TTL=5000, DLX=work)
     ^                                                        |
     +--------------------- hết TTL, quay lại ----------------+
Sau N lần (đếm qua x-death / header) --> parking-lot queue
```

Dùng nhiều queue retry (5s, 30s, 5m) để có exponential backoff. Hoặc dùng plugin **`rabbitmq_delayed_message_exchange`** (header `x-delay`), nhưng plugin này lưu message trên một node, không replicate, không phù hợp lượng lớn delayed message.

**Priority queue:** classic queue khai báo `x-max-priority` (1-255, khuyến nghị ≤ 10 vì mỗi level tốn tài nguyên), message set `priority`. Quorum queue (từ 4.0) chỉ hỗ trợ 2 mức: normal và high.

**Lưu ý / bẫy thường gặp:**
- Per-message TTL chỉ được kiểm tra **ở đầu queue**: message TTL 1s nằm sau message TTL 60s sẽ phải chờ. Vì vậy retry queue nên dùng **per-queue TTL** cố định.
- Priority chỉ có ý nghĩa khi có backlog và prefetch thấp; prefetch cao thì message đã nằm ở consumer, không "chen" được.

## Classic queue, quorum queue và stream khác nhau thế nào? Clustering, mirrored queue và lazy queue? [senior]
**Clustering:** các node RabbitMQ chia sẻ metadata (user, vhost, exchange, binding) nhưng **nội dung queue** mặc định chỉ nằm trên một node (leader). Muốn chịu lỗi phải replicate queue.

| | Classic queue | Quorum queue | Stream |
| --- | --- | --- | --- |
| Replication | Không (mirroring cũ đã bị loại bỏ) | Raft, đa số replica (thường 3 hoặc 5) | Replicated log |
| Đọc | Destructive (ack là xóa) | Destructive | **Non-destructive**, đọc lại từ offset như Kafka |
| Tính năng | Đầy đủ: priority nhiều mức, exclusive, transient | Poison message handling (delivery-limit), không hỗ trợ transient/exclusive | Retention theo size/time, fan-out lớn, throughput rất cao |
| Use case | Dữ liệu tạm, queue exclusive/auto-delete, reply queue | **Mặc định cho dữ liệu quan trọng** | Replay, nhiều consumer đọc cùng dữ liệu, log lớn |

**Classic mirrored queues** (HA policy `ha-mode`) đã deprecated từ 3.9 và **bị loại bỏ trong RabbitMQ 4.0**. Chúng có vấn đề: đồng bộ mirror chặn queue, split-brain, mất message khi promote mirror chưa sync. Quorum queue dùng Raft nên đảm bảo nhất quán: message chỉ được confirm khi đa số replica ghi xong; cluster 3 node chịu được mất 1 node.

**Lazy queue:** mode cũ (`x-queue-mode=lazy`) đẩy message xuống đĩa sớm để tiết kiệm RAM với backlog lớn. Từ 3.12, classic queue (CQv2) mặc định đã hành xử gần như lazy, nên argument này bị bỏ qua.

**Streams** (từ 3.9) có thêm Super Streams (partitioned stream) và giao thức stream riêng cho throughput cao.

**Lưu ý / bẫy thường gặp:**
- Quorum queue tốn đĩa và RAM hơn, không hợp với hàng nghìn queue nhỏ tạm thời.
- Số node cluster nên lẻ (3, 5) để Raft có quorum; cluster 2 node mất 1 là quorum queue không còn leader.
- RabbitMQ cluster không chịu được network partition tốt; triển khai trong cùng region/LAN, liên region thì dùng Shovel/Federation.

## Các pitfall phổ biến khi vận hành RabbitMQ và cách monitor? [mid]
**Pitfall thường gặp:**

1. **Unbounded queue:** consumer chết, queue phình hàng triệu message → memory alarm (`vm_memory_high_watermark`, mặc định 0.6 RAM) hoặc disk alarm → broker **block toàn bộ publisher**. Phòng ngừa: `x-max-length` + `overflow` (`drop-head`, `reject-publish`, `reject-publish-dlx`), TTL, alert queue depth.
2. **Connection/channel per message:** connection churn.
3. **Prefetch = 0 (unlimited)** với consumer chậm → consumer OOM.
4. **Quá nhiều queue/binding** (hàng trăm nghìn) → metadata nặng, khởi động chậm.
5. **Nack requeue vô hạn** với poison message.
6. **Queue dài thì chậm:** RabbitMQ nhanh nhất khi queue gần rỗng; queue dài nghĩa là kiến trúc đang có vấn đề, không phải "lưu trữ".
7. Dùng chung connection cho publish và consume (bị flow control block cả hai).
8. Không bật publisher confirms, không set persistent.

**Monitoring:**
- **Management plugin** (UI port 15672, HTTP API) cho dev/troubleshoot.
- Production: plugin **`rabbitmq_prometheus`** (port 15692) + Grafana dashboard chính thức.
- Metric quan trọng: `messages_ready` (queue depth), `messages_unacknowledged`, publish/deliver/ack rate, consumer count = 0, redelivery rate, memory/disk alarm, file descriptors, connection churn rate, Raft log/leader của quorum queue.
- CLI: `rabbitmq-diagnostics status`, `rabbitmq-diagnostics check_port_connectivity`, `rabbitmqctl list_queues name messages_ready messages_unacknowledged consumers`.

**Lưu ý / bẫy thường gặp:** đừng scrape HTTP API của management plugin với tần suất cao ở cluster lớn, nó tốn tài nguyên; dùng Prometheus endpoint.

# Kafka chuyên sâu

## Giải thích topic, partition, offset, segment, retention và log compaction trong Kafka? [junior]
- **Topic:** luồng record logic, ví dụ `orders`.
- **Partition:** topic chia thành N partition, mỗi partition là một **append-only log có thứ tự**. Partition là đơn vị song song (parallelism), replication và ordering.
- **Offset:** số thứ tự tăng dần của record trong một partition. Consumer tự quản lý vị trí đọc bằng offset; record không bị xóa khi đọc.
- **Broker:** server Kafka chứa các partition replica.
- **Segment:** mỗi partition được lưu thành nhiều file segment (`.log` kèm `.index`, `.timeindex`). Chỉ **active segment** được ghi. Retention xóa theo segment đã đóng (`segment.bytes` mặc định 1GB, `segment.ms` 7 ngày).

```text
Topic orders
 Partition 0: [0][1][2][3][4][5] <- append
 Partition 1: [0][1][2][3]
 Partition 2: [0][1][2][3][4]
                       ^ consumer group A offset = 3
```

**Retention (`cleanup.policy=delete`):** xóa theo thời gian (`retention.ms`, mặc định 7 ngày) hoặc dung lượng (`retention.bytes`, mặc định không giới hạn).

**Log compaction (`cleanup.policy=compact`):** giữ lại **record mới nhất cho mỗi key**, xóa bản cũ. Record với value `null` là **tombstone** để xóa key (tombstone tự bị xóa sau `delete.retention.ms`). Dùng cho changelog/state: bảng tỷ giá, profile user, `__consumer_offsets`, CDC snapshot. Có thể kết hợp `compact,delete`.

**Lưu ý / bẫy thường gặp:**
- Ordering chỉ đảm bảo **trong một partition**, không phải toàn topic.
- Compaction không chạy trên active segment, nên trong một khoảng thời gian vẫn đọc thấy nhiều version của một key; consumer phải chịu được điều đó.
- Không giảm được số partition của topic; tăng partition làm thay đổi mapping key → partition.

## Replication trong Kafka hoạt động thế nào: leader/follower, ISR, acks, min.insync.replicas, unclean leader election? [mid]
Mỗi partition có `replication.factor` replica (thường 3) đặt trên các broker khác nhau (rack-aware). Một replica là **leader** nhận mọi ghi (và mặc định mọi đọc); các **follower** fetch từ leader.

**ISR (In-Sync Replicas):** tập replica đang theo kịp leader (không tụt quá `replica.lag.time.max.ms`, mặc định 30s). **High watermark** là offset mà mọi ISR đã có; consumer chỉ đọc được tới high watermark.

**`acks` của producer:**

| acks | Ý nghĩa | Rủi ro |
| --- | --- | --- |
| `0` | Không chờ phản hồi | Mất message dễ dàng, throughput cao nhất |
| `1` | Leader ghi xong là ack | Leader chết trước khi follower copy → mất |
| `all` (`-1`) | Chờ toàn bộ ISR hiện tại | An toàn nhất; mặc định từ Kafka 3.0 |

**`min.insync.replicas`** (mặc định 1): số ISR tối thiểu để chấp nhận ghi với `acks=all`. Nếu ISR nhỏ hơn, producer nhận `NotEnoughReplicasException`. Cấu hình chuẩn cho độ bền: **RF=3, min.insync.replicas=2, acks=all** → chịu mất 1 broker mà không mất dữ liệu và vẫn ghi được.

**Unclean leader election** (`unclean.leader.election.enable`, mặc định `false`): nếu mọi ISR đều chết, có cho phép replica ngoài ISR (thiếu dữ liệu) làm leader không. `true` = ưu tiên availability, **mất dữ liệu**; `false` = partition offline cho tới khi ISR quay lại.

**Lưu ý / bẫy thường gặp:**
- `acks=all` với `min.insync.replicas=1` gần như không khác `acks=1` khi ISR co lại còn mỗi leader.
- RF=3 nhưng `min.insync.replicas=3` thì mất 1 broker là không ghi được.
- Kafka ack khi đã ghi vào **page cache** của các replica, không fsync từng message; độ bền đến từ replication chứ không phải fsync.

## Producer Kafka hoạt động thế nào: batching, linger.ms, compression, partitioner và key? [mid]
Luồng: `send()` → serializer → **partitioner** chọn partition → đưa vào **RecordAccumulator** (buffer theo partition) → **Sender thread** gửi batch tới leader.

**Batching:**
- `batch.size` (mặc định 16KB): kích thước tối đa một batch mỗi partition.
- `linger.ms`: thời gian chờ để gom thêm record. Trước Kafka 4.0 mặc định 0, từ 4.0 là 5ms. Tăng lên 5-50ms giúp batch lớn hơn, throughput cao hơn, đổi lại latency.
- `buffer.memory` (32MB): đầy thì `send()` block tối đa `max.block.ms`.

**Compression** (`compression.type`: `gzip`, `snappy`, `lz4`, `zstd`): nén **theo batch**, batch càng lớn tỷ lệ nén càng tốt. `lz4`/`zstd` là lựa chọn phổ biến. Broker giữ nguyên batch nén (nếu topic không ép codec khác), consumer giải nén.

**Partitioner:**
- Có **key**: `murmur2(key) % numPartitions` → cùng key luôn vào cùng partition → **ordering theo key** (ví dụ key = `orderId`).
- Không key: **sticky partitioner** (KIP-480): dồn record vào một partition cho tới khi batch đầy/gửi rồi chuyển partition, giúp batch to hơn so với round-robin.
- Có thể viết custom partitioner.

**Retry & ordering:** `retries` mặc định rất lớn, giới hạn bởi `delivery.timeout.ms` (2 phút). Với `enable.idempotence=true` (mặc định từ 3.0), `max.in.flight.requests.per.connection` ≤ 5 vẫn giữ đúng thứ tự.

**Lưu ý / bẫy thường gặp:**
- `send()` là async; không gọi `.get()`/`flush()` từng message (giết throughput) nhưng phải xử lý callback lỗi.
- Tăng số partition làm `hash % N` đổi → key cũ chuyển partition, phá ordering trong giai đoạn chuyển tiếp.
- Key phân bố lệch (một tenant lớn) gây **hot partition**.

## Idempotent producer và transactions trong Kafka giúp đạt exactly-once như thế nào? [senior]
**Idempotent producer** (`enable.idempotence=true`, mặc định từ Kafka 3.0 khi config tương thích):
- Broker cấp **Producer ID (PID)**; mỗi batch có **sequence number** theo partition.
- Khi producer retry do mất ack, broker thấy sequence trùng và bỏ qua → **không duplicate, không lệch thứ tự** trong một partition, trong vòng đời một PID.
- Yêu cầu `acks=all`, `max.in.flight.requests.per.connection ≤ 5`.

Idempotence không chống được duplicate khi **app** gửi lại (ví dụ app restart và gửi lại cùng business event) vì PID mới.

**Transactions** (`transactional.id`):
- Ghi atomic **nhiều partition/topic** + commit offset của consumer trong cùng transaction. Đây là nền tảng của mô hình **consume-transform-produce** exactly-once.
- `transactional.id` cố định giúp **fencing**: instance zombie cũ bị chặn nhờ epoch.
- Consumer phía sau phải đặt `isolation.level=read_committed` để không đọc message của transaction bị abort.

```text
initTransactions()
loop:
  records = consumer.poll()
  beginTransaction()
  for r in records: producer.send(transform(r))
  sendOffsetsToTransaction(offsets, consumerGroupMetadata)
  commitTransaction()     // lỗi -> abortTransaction()
```

Kafka Streams bật bằng `processing.guarantee=exactly_once_v2`.

**Lưu ý / bẫy thường gặp:**
- Exactly-once của Kafka chỉ đúng **trong phạm vi Kafka → Kafka**. Khi consumer ghi vào DB ngoài, gọi API, gửi email, bạn quay về at-least-once và cần **idempotent consumer** hoặc lưu offset cùng transaction với DB.
- Transactions thêm latency (commit marker, coordinator) và giảm throughput; dùng khi thật sự cần.
- `read_committed` consumer bị chặn ở **Last Stable Offset** nếu có transaction treo lâu (`transaction.timeout.ms`).

## Consumer group và rebalancing hoạt động thế nào? Eager vs cooperative sticky, static membership? [mid]
**Consumer group:** các consumer cùng `group.id` chia nhau partition; mỗi partition được gán cho **đúng một** consumer trong group. Số consumer hữu ích tối đa = số partition; consumer dư sẽ idle. **Group coordinator** (một broker) quản lý membership và offset.

**Rebalance** xảy ra khi: consumer join/leave, consumer bị coi là chết (không heartbeat trong `session.timeout.ms`, mặc định 45s), consumer không gọi `poll()` trong `max.poll.interval.ms` (mặc định 5 phút), hoặc số partition/subscription thay đổi.

| Chiến lược | Cách làm | Ảnh hưởng |
| --- | --- | --- |
| **Eager** (Range, RoundRobin, Sticky cũ) | Mọi consumer thu hồi **toàn bộ** partition rồi chia lại | "Stop-the-world": cả group dừng tiêu thụ |
| **Cooperative sticky** (`CooperativeStickyAssignor`) | Chỉ di chuyển partition cần thiết, qua nhiều vòng rebalance | Consumer khác tiếp tục xử lý, ít gián đoạn |

**Static membership** (`group.instance.id`): consumer có định danh cố định; khi restart (rolling deploy) trong khoảng `session.timeout.ms` thì **không gây rebalance**, nhận lại đúng partition cũ. Rất hữu ích trên Kubernetes StatefulSet.

**Giao thức rebalance mới (KIP-848):** từ Kafka 4.0, `group.protocol=consumer` đưa logic assignment về phía broker, rebalance incremental, không còn barrier đồng bộ toàn group.

**Lưu ý / bẫy thường gặp:**
- Xử lý mỗi batch quá lâu (gọi API chậm) vượt `max.poll.interval.ms` → consumer bị kick → rebalance → batch bị xử lý lại bởi consumer khác → **duplicate + rebalance storm**. Giảm `max.poll.records` hoặc tách xử lý ra thread pool có quản lý offset.
- Commit offset trong callback `onPartitionsRevoked` để tránh xử lý lại khi mất partition.

## Commit offset: auto vs manual, at-least-once vs at-most-once? [mid]
Offset được lưu trong internal topic `__consumer_offsets` (compacted). Offset commit là "offset của record **tiếp theo** sẽ đọc".

**Auto commit** (`enable.auto.commit=true`, `auto.commit.interval.ms=5000`): commit định kỳ trong `poll()` các offset đã trả về ở lần poll trước.
- Nếu xử lý đồng bộ trong vòng poll: thường là at-least-once, crash sẽ xử lý lại tối đa ~5s dữ liệu.
- Nếu xử lý async (đẩy sang thread khác) thì offset có thể được commit trước khi xử lý xong → **mất message**.

**Manual commit:**

| Thứ tự | Ngữ nghĩa |
| --- | --- |
| Xử lý → commit | **At-least-once**: crash giữa hai bước → xử lý lại → cần idempotent |
| Commit → xử lý | **At-most-once**: crash sau commit → mất message |
| Lưu offset cùng transaction DB với kết quả | Effectively-once (consumer tự `seek` theo offset trong DB khi assign partition) |

- `commitSync()`: chắc chắn, chậm hơn, retry tự động.
- `commitAsync()`: nhanh, không retry (có thể commit cũ đè commit mới); pattern phổ biến là `commitAsync` trong vòng lặp và `commitSync` khi shutdown/revoke.

**`auto.offset.reset`** (`latest` mặc định, `earliest`, `none`): áp dụng khi group chưa có offset hoặc offset đã bị retention xóa.

**Lưu ý / bẫy thường gặp:**
- Commit theo partition, không phải từng message: nếu xử lý song song trong partition, chỉ được commit offset liên tục đã xong (offset 5 xong nhưng 4 chưa xong thì chưa commit 6).
- Group không hoạt động quá `offsets.retention.minutes` (7 ngày) sẽ mất offset → `auto.offset.reset` kích hoạt, có thể đọc lại hoặc bỏ qua dữ liệu.
- **Consumer lag** = log end offset − committed offset; là metric quan trọng nhất của consumer Kafka.

## ZooKeeper và KRaft khác nhau thế nào? Kafka Connect và Kafka Streams/ksqlDB là gì? [mid]
**ZooKeeper → KRaft:**
- Trước đây Kafka dùng ZooKeeper lưu metadata (broker, topic, ACL, controller election). Hạn chế: hai hệ thống phải vận hành, controller failover chậm do phải load toàn bộ metadata, giới hạn số partition (khoảng vài trăm nghìn).
- **KRaft** (KIP-500): metadata lưu trong internal log `__cluster_metadata`, nhóm **controller** chạy Raft. Failover gần như tức thì (standby controller đã có metadata), hỗ trợ hàng triệu partition, một hệ thống duy nhất.
- KRaft production-ready từ 3.3; **Kafka 4.0 đã loại bỏ hoàn toàn ZooKeeper**. Migration đi qua các bản 3.x (bridge release) trước khi lên 4.x.

**Kafka Connect:** framework chạy **connector** để đưa dữ liệu vào/ra Kafka mà không viết code.
- **Source connector:** DB (Debezium CDC cho PostgreSQL, MySQL, SQL Server), file, MQTT → Kafka.
- **Sink connector:** Kafka → Elasticsearch, S3, JDBC, Snowflake.
- Chạy distributed mode, lưu config/offset/status trong topic Kafka; có **SMT** (Single Message Transform), converter (JSON/Avro/Protobuf), DLQ cho sink (`errors.tolerance=all`, `errors.deadletterqueue.topic.name`).

**Kafka Streams:** thư viện Java (không phải cluster riêng) xử lý stream: `KStream` (luồng event), `KTable` (changelog/state), join, aggregation, windowing; state store local (RocksDB) được backup bằng changelog topic; exactly-once v2.

**ksqlDB:** lớp SQL trên Kafka Streams: `CREATE STREAM`, `CREATE TABLE AS SELECT ... WINDOW TUMBLING`.

Trong .NET không có Kafka Streams chính thức; các lựa chọn: Streamiz.Kafka.Net (cộng đồng), hoặc dùng Flink/ksqlDB tách biệt.

**Lưu ý / bẫy thường gặp:** Connect worker là thành phần stateful cần monitor (task failed không tự restart nếu không cấu hình); Debezium cần replication slot trên PostgreSQL, slot bị bỏ quên làm WAL phình đầy đĩa.

## Vì sao Kafka nhanh? [mid]
Kafka đạt hàng triệu message/giây trên phần cứng phổ thông nhờ một loạt quyết định thiết kế:

1. **Sequential I/O:** log append-only, đọc/ghi tuần tự. Disk tuần tự (kể cả HDD) nhanh hơn random I/O nhiều bậc, gần với tốc độ RAM random.
2. **Page cache của OS:** Kafka không tự cache trong JVM heap mà dựa vào page cache. Consumer đọc gần đuôi log được phục vụ thẳng từ RAM; tránh GC lớn; khi restart broker cache vẫn còn "ấm".
3. **Zero-copy:** dùng `sendfile()` (`FileChannel.transferTo`) chuyển dữ liệu từ page cache sang socket mà không copy qua user space. Lưu ý: **không áp dụng khi bật TLS** vì dữ liệu phải được mã hóa ở user space.
4. **Batching end-to-end:** producer gom batch, broker lưu nguyên batch, consumer fetch theo batch → ít request, ít syscall, ít overhead header.
5. **Compression theo batch:** giảm network và disk.
6. **Định dạng nhị phân thống nhất:** cùng format từ producer → disk → consumer, broker không cần parse/chuyển đổi.
7. **Partition = parallelism:** scale ngang theo số partition và broker.
8. **Broker "dumb", consumer "smart":** broker không theo dõi trạng thái từng message (không ack per message), chỉ lưu offset theo group.

```text
Không zero-copy: disk -> page cache -> app buffer -> socket buffer -> NIC (4 lần copy, 4 context switch)
Zero-copy:       disk -> page cache ---------------------------> NIC (DMA, 2 context switch)
```

**Lưu ý / bẫy thường gặp:** consumer đọc dữ liệu cũ (replay xa) sẽ miss page cache, đọc đĩa và có thể đẩy dữ liệu "nóng" ra khỏi cache, ảnh hưởng consumer realtime. Tiered storage (KIP-405, GA từ 3.9) giúp đưa dữ liệu cũ sang object storage.

## Chọn số partition thế nào? Xử lý hot partition ra sao? [senior]
**Công thức kinh nghiệm:**

```text
partitions >= max( target_throughput / producer_throughput_per_partition,
                   target_throughput / consumer_throughput_per_partition )
```

Ví dụ: cần 200 MB/s, một consumer xử lý được 10 MB/s mỗi partition → tối thiểu 20 partition. Cộng thêm headroom cho tăng trưởng 1-2 năm (vì tăng partition sau này phá ordering theo key), ví dụ chọn 30-48.

**Trade-off khi nhiều partition:**
- Nhiều file handle, nhiều replication traffic, leader election lâu hơn khi broker chết (ít nghiêm trọng hơn với KRaft).
- Producer buffer chia mỏng theo partition → batch nhỏ, latency end-to-end tăng.
- Rebalance consumer nặng hơn.
- Tăng partition được nhưng **không giảm được**.

**Hot partition** xảy ra khi phân bố key lệch (một tenant/merchant chiếm 40% traffic, key = `null` sai cách, key có cardinality thấp như `country`).

Cách xử lý:
1. **Chọn key tốt hơn:** key có cardinality cao và đủ cho ordering yêu cầu (`orderId` thay vì `customerId` nếu chỉ cần thứ tự theo order).
2. **Key salting:** `tenantId + "-" + (hash(orderId) % 8)` cho tenant lớn, chấp nhận ordering chỉ trong sub-key; consumer phải hiểu điều đó.
3. **Tách topic** riêng cho tenant lớn.
4. **Custom partitioner** gán tenant lớn vào tập partition riêng.
5. Phía consumer: xử lý song song **theo key bên trong partition** (Confluent Parallel Consumer) để tăng throughput mà vẫn giữ ordering theo key.

**Lưu ý / bẫy thường gặp:** đừng tạo topic 1000 partition "cho chắc". Đo throughput thực tế bằng `kafka-producer-perf-test` và `kafka-consumer-perf-test`, theo dõi bytes-in per partition để phát hiện skew.

# Cloud & các broker khác

## Azure Service Bus: queue, topic/subscription, sessions, dead-letter, lock duration? [mid]
**Thực thể:**
- **Queue:** point-to-point.
- **Topic + Subscription:** pub/sub; mỗi subscription như một queue riêng, có **filter** (SQL filter, correlation filter) và action.

**Receive mode:**
- **Peek-lock** (mặc định): message bị khóa trong **lock duration** (mặc định 60s, tối đa 5 phút). Consumer gọi `Complete` (xóa), `Abandon` (trả lại, tăng delivery count), `DeadLetter`, hoặc `Defer`. Hết lock mà chưa complete → message hiện lại. Có thể **renew lock** (SDK tự renew với `MaxAutoLockRenewalDuration`).
- **Receive-and-delete:** xóa ngay khi nhận, at-most-once.

**Dead-letter queue:** sub-queue `$DeadLetterQueue` có sẵn cho mỗi queue/subscription. Message vào DLQ khi vượt **MaxDeliveryCount** (mặc định 10), hết TTL (nếu bật dead-lettering on expiration), lỗi filter, hoặc app chủ động dead-letter kèm `DeadLetterReason`.

**Sessions:** set `SessionId` cho message, bật `RequiresSession` trên queue → message cùng session được xử lý **FIFO bởi một receiver tại một thời điểm**, có session state. Đây là cách đạt ordering theo key (giống partition key của Kafka).

**Tính năng khác:** duplicate detection theo `MessageId` trong cửa sổ thời gian; scheduled messages (`ScheduledEnqueueTime`); transactions trong một namespace; auto-forwarding; tier Premium có tài nguyên riêng, message lớn hơn (Standard 256KB, Premium tới 100MB) và hỗ trợ JMS 2.0.

```csharp
await using var client = new ServiceBusClient(connStr);
var processor = client.CreateProcessor("orders", new ServiceBusProcessorOptions
{
    AutoCompleteMessages = false,
    MaxConcurrentCalls = 8,
    MaxAutoLockRenewalDuration = TimeSpan.FromMinutes(10)
});
processor.ProcessMessageAsync += async args =>
{
    await HandleAsync(args.Message.Body.ToString());
    await args.CompleteMessageAsync(args.Message);
};
processor.ProcessErrorAsync += args => { Log(args.Exception); return Task.CompletedTask; };
await processor.StartProcessingAsync();
```

**Lưu ý / bẫy thường gặp:** xử lý lâu hơn lock duration mà không renew → message được giao lại cho consumer khác → duplicate; complete sau đó báo `MessageLockLost`.

## AWS SQS (Standard vs FIFO, visibility timeout, long polling, DLQ redrive) và SNS fan-out? [mid]
**SQS Standard vs FIFO:**

| | Standard | FIFO |
| --- | --- | --- |
| Throughput | Gần như không giới hạn | 300 msg/s mỗi API action (3.000 với batch); high-throughput mode cao hơn nhiều |
| Ordering | Best-effort | Đúng thứ tự trong cùng **MessageGroupId** |
| Delivery | At-least-once, có thể duplicate | Exactly-once processing: dedup theo **MessageDeduplicationId** trong 5 phút |
| Tên | Tùy ý | Phải kết thúc `.fifo` |

**Visibility timeout** (mặc định 30s, tối đa 12 giờ): sau khi `ReceiveMessage`, message bị ẩn trong khoảng này. Consumer phải `DeleteMessage` sau khi xử lý xong; nếu không, message xuất hiện lại. Xử lý lâu thì gọi `ChangeMessageVisibility` để gia hạn.

**Long polling:** `WaitTimeSeconds` 1-20s, giảm empty response và chi phí so với short polling.

**DLQ:** cấu hình **redrive policy** với `maxReceiveCount`; vượt quá thì chuyển sang DLQ. **DLQ redrive** cho phép đưa message từ DLQ về queue gốc (console/API) sau khi fix bug. DLQ của FIFO queue cũng phải là FIFO.

Giới hạn khác: retention mặc định 4 ngày (tối đa 14 ngày), delay queue tới 15 phút, payload lớn dùng S3 (Extended Client Library, đúng claim check pattern).

**SNS fan-out:** SNS là pub/sub push. Pattern chuẩn **SNS → nhiều SQS queue**: mỗi service có queue riêng subscribe topic, có buffer và retry độc lập. SNS hỗ trợ **subscription filter policy** theo message attributes/body, và SNS FIFO topic kết hợp SQS FIFO. **EventBridge** là lựa chọn thay thế khi cần routing theo rule phức tạp, schema registry, integration SaaS.

**Lưu ý / bẫy thường gặp:** visibility timeout nhỏ hơn thời gian xử lý (hoặc nhỏ hơn timeout của Lambda) là nguyên nhân số một gây duplicate trên SQS. Với Lambda, AWS khuyến nghị visibility timeout ít nhất gấp 6 lần function timeout.

## Redis Pub/Sub vs Redis Streams, NATS/JetStream và Pulsar khác nhau thế nào? [junior]
**Redis Pub/Sub:** fire-and-forget. Subscriber không online thì **mất message**, không lưu, không ack. Phù hợp: invalidate cache local, signal realtime giữa instance (SignalR backplane).

**Redis Streams** (`XADD`, `XREADGROUP`, `XACK`): log append-only có ID, **consumer group**, **Pending Entries List (PEL)** chứa message đã giao chưa ack; claim message của consumer chết bằng `XAUTOCLAIM`/`XCLAIM`; giới hạn độ dài bằng `MAXLEN ~`.

```bash
XADD orders MAXLEN ~ 100000 * orderId 42 status created
XGROUP CREATE orders billing $ MKSTREAM
XREADGROUP GROUP billing worker-1 COUNT 10 BLOCK 5000 STREAMS orders >
XACK orders billing 1700000000000-0
XAUTOCLAIM orders billing worker-2 60000 0-0 COUNT 10
```

Hạn chế: dữ liệu trong RAM, durability phụ thuộc AOF/RDB và replication async (failover có thể mất dữ liệu). Chi tiết hơn xem topic Redis.

**NATS:**
- **Core NATS:** subject-based (`orders.vn.created`, wildcard `*` và `>`), at-most-once, latency cực thấp, request-reply native, queue group cho load balancing.
- **JetStream:** lớp persistence: stream lưu message, consumer (push/pull, durable), ack, replay, at-least-once; dedup theo header `Nats-Msg-Id` + double ack cho exactly-once; có Key-Value và Object Store.

**Apache Pulsar:** broker stateless, dữ liệu lưu ở **BookKeeper** (segment phân tán) → scale compute và storage độc lập, không cần rebalance dữ liệu khi thêm broker. Hỗ trợ subscription type Exclusive, Failover, Shared (giống queue), Key_Shared (song song mà vẫn giữ thứ tự theo key); multi-tenant (tenant/namespace), geo-replication và tiered storage native.

**Lưu ý / bẫy thường gặp:** đừng dùng Redis Pub/Sub cho nghiệp vụ cần đảm bảo giao nhận. Và Redis Streams không thay thế được Kafka khi dữ liệu lớn hơn RAM hoặc cần retention dài.

# Reliability Patterns

## Delivery guarantees thực tế end-to-end: tại sao "at-least-once + idempotent" là chuẩn công nghiệp? [mid]
Guarantee phải xét **cả chuỗi**: producer → broker → consumer → side effect (DB, API). Mỗi mắt xích có thể làm mất hoặc nhân đôi.

| Điểm lỗi | Gây mất | Gây duplicate |
| --- | --- | --- |
| Producer gửi | Không chờ ack/confirm, không retry | Retry khi ack bị mất |
| Broker | acks=1, message transient, unclean election | Hiếm |
| Consumer | Ack/commit trước khi xử lý | Xử lý xong nhưng crash trước ack/commit; rebalance; lock/visibility timeout hết hạn |
| Side effect | - | Gọi API bên thứ ba hai lần |

Kết luận:
- **At-most-once:** chấp nhận mất, không duplicate (metrics, log không quan trọng).
- **At-least-once:** không mất nhưng có duplicate. Là mặc định thực tế của hầu hết hệ thống.
- **Exactly-once delivery** qua mạng không đảm bảo được trong trường hợp tổng quát (bài toán Two Generals). Cái đạt được là **exactly-once processing / effectively-once**: at-least-once delivery + **idempotent processing**.

Cấu hình at-least-once chuẩn:
- RabbitMQ: publisher confirms + persistent + quorum queue + manual ack sau khi commit.
- Kafka: `acks=all`, idempotence, RF=3, `min.insync.replicas=2`, manual commit sau xử lý.
- SQS/Service Bus: delete/complete sau khi xử lý, timeout phù hợp.

**Lưu ý / bẫy thường gặp:** khi interviewer hỏi "làm sao exactly-once", câu trả lời mạnh là phân biệt delivery và processing, rồi chỉ ra nơi đặt idempotency (dedup key, upsert, unique constraint) thay vì hứa hẹn cấu hình broker "exactly-once" giải quyết mọi thứ.

## Thiết kế idempotent consumer thế nào? Inbox pattern / dedup table? [mid]
Mục tiêu: xử lý cùng một message N lần cho kết quả giống 1 lần.

**Cách 1: Inbox / processed-messages table** (cùng DB với dữ liệu nghiệp vụ, cùng transaction):

```sql
CREATE TABLE inbox_messages (
  message_id   UUID        NOT NULL,
  consumer     VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, consumer)
);
```

```csharp
await using var tx = await db.Database.BeginTransactionAsync(ct);
var inserted = await db.Database.ExecuteSqlInterpolatedAsync(
    $"INSERT INTO inbox_messages(message_id, consumer) VALUES ({msg.MessageId}, 'billing') ON CONFLICT DO NOTHING", ct);
if (inserted == 0) { await tx.RollbackAsync(ct); return; } // đã xử lý rồi -> chỉ ack
await ApplyBusinessLogicAsync(msg, ct);
await db.SaveChangesAsync(ct);
await tx.CommitAsync(ct);
// sau khi commit mới ack/commit offset
```

**Cách 2: Natural idempotency:** thiết kế thao tác vốn idempotent: `UPSERT`, `SET status = 'PAID' WHERE status = 'PENDING'`, unique constraint trên business key (`payment_reference`).

**Cách 3: Version/sequence check:** chỉ áp dụng event nếu `event.version > entity.version` → vừa dedup vừa chống out-of-order.

**Cách 4: Idempotency key gửi sang API bên thứ ba** (Stripe `Idempotency-Key`) cho side effect ngoài DB.

**Lưu ý / bẫy thường gặp:**
- Message ID phải được sinh **ở producer** (trong outbox) và ổn định qua retry; không dùng ID do broker sinh nếu broker có thể gán ID mới khi producer gửi lại.
- Check-then-act không transaction (`SELECT` rồi `INSERT`) bị race khi hai consumer nhận cùng message.
- Dedup bằng Redis `SET NX` nhanh nhưng không atomic với DB nghiệp vụ; chấp nhận được khi side effect tự idempotent.
- Dọn bảng inbox định kỳ, giữ lâu hơn khoảng thời gian redelivery tối đa.

## Transactional outbox: polling publisher và transaction log tailing (CDC) khác nhau thế nào? [senior]
Vấn đề **dual write**: `db.Commit()` rồi `broker.Publish()`. Crash ở giữa → DB có dữ liệu nhưng không có event (hoặc ngược lại nếu publish trước). Outbox ghi event vào bảng `outbox` **trong cùng transaction** với dữ liệu nghiệp vụ, sau đó một relay chuyển ra broker.

**Polling publisher:**

```sql
SELECT id, type, payload FROM outbox
WHERE published_at IS NULL
ORDER BY id
LIMIT 100
FOR UPDATE SKIP LOCKED;
-- publish, chờ confirm, rồi UPDATE outbox SET published_at = now() WHERE id IN (...)
```

**Transaction log tailing (CDC):** Debezium đọc WAL (PostgreSQL logical replication), binlog (MySQL), CDC (SQL Server) và đẩy record của bảng outbox vào Kafka. Debezium có **Outbox Event Router** SMT định tuyến theo cột `aggregatetype`, dùng `aggregateid` làm key.

| | Polling | Log tailing (CDC) |
| --- | --- | --- |
| Latency | Phụ thuộc chu kỳ poll (100ms-vài giây) | Gần realtime |
| Tải DB | Query liên tục, index, update `published_at` | Đọc log, gần như không ảnh hưởng query |
| Ordering | Giữ được nếu một relay/partition theo aggregate | Theo thứ tự commit trong log |
| Hạ tầng | Chỉ cần code (MassTransit, CAP, Wolverine có sẵn) | Kafka Connect + Debezium, quản lý replication slot |
| Vận hành | Đơn giản | Phức tạp hơn, mạnh khi scale lớn |

Cả hai đều **at-least-once**: relay crash sau khi publish nhưng trước khi đánh dấu → publish lại → consumer phải idempotent.

**Lưu ý / bẫy thường gặp:**
- Nhiều instance polling cùng lúc mà không `SKIP LOCKED`/leader election → duplicate và lệch thứ tự.
- Dọn bảng outbox (xóa bản đã publish) để không phình; với CDC có thể insert rồi delete ngay trong cùng transaction, log vẫn chứa insert.
- Replication slot của Debezium không được tiêu thụ (connector chết) → WAL giữ lại, **đầy đĩa DB**. Phải alert `pg_replication_slots` lag.
- Phía nhận dùng **inbox** để hoàn thiện chuỗi effectively-once.

## Chiến lược retry: immediate, exponential backoff, retry topic trong Kafka, DLQ và poison message? [senior]
**Phân loại lỗi trước khi retry:**
- **Transient** (timeout, 503, deadlock, broker tạm unavailable): retry có ý nghĩa.
- **Permanent** (validation fail, deserialization error, bug logic): retry vô ích → DLQ ngay.

**Các tầng retry:**
1. **Immediate retry in-process** (2-3 lần, vài trăm ms) bằng Polly cho lỗi chớp nhoáng.
2. **Delayed retry** với exponential backoff + jitter: `delay = min(cap, base * 2^attempt) * random(0.5..1)`.
3. **DLQ / parking lot** sau N lần, kèm metadata: lỗi, stack trace, số lần, topic/partition/offset gốc.
4. **Redrive** sau khi fix: replay từ DLQ về queue chính (công cụ hoặc script).

**Kafka không có delay/DLQ native**, và consumer không thể "để message lại sau" mà không chặn partition. Pattern **retry topics** (non-blocking retry, Uber đã mô tả):

```text
orders --fail--> orders.retry.1m --fail--> orders.retry.10m --fail--> orders.dlt
  ^ consumer chính      ^ consumer chỉ xử lý khi now >= timestamp + delay (pause/resume partition)
```

Spring Kafka có `@RetryableTopic`; trong .NET thường tự xây hoặc dùng MassTransit Riders/KafkaFlow.

**Trade-off ordering:** non-blocking retry **phá ordering theo key** (message sau đi trước message đang retry). Nếu cần ordering: **blocking retry** (dừng partition, retry tại chỗ) hoặc lưu "key đang có message lỗi" và chuyển các message sau cùng key vào retry theo.

**Poison message:** message luôn làm crash consumer (deserialize lỗi, payload quá lớn). Bảo vệ: bắt exception quanh deserialize, `delivery-limit` (RabbitMQ quorum), `MaxDeliveryCount` (Service Bus), `maxReceiveCount` (SQS), DLQ handler của Confluent/Connect.

**Lưu ý / bẫy thường gặp:** retry đồng loạt không jitter gây **retry storm** làm sập downstream vừa hồi phục; kết hợp circuit breaker: khi downstream chết, pause consumer thay vì đẩy hết message vào DLQ.

## Đảm bảo ordering khi vẫn muốn xử lý song song như thế nào? [senior]
**Ordering mặc định của từng broker:**

| Broker | Đảm bảo |
| --- | --- |
| Kafka | Trong một partition |
| RabbitMQ | Trong một queue với **một consumer**; nhiều consumer hoặc requeue là mất thứ tự |
| Service Bus | Trong một session |
| SQS FIFO | Trong một MessageGroupId |
| SQS Standard | Không đảm bảo |

**Nguyên tắc:** hầu như không cần ordering toàn cục, chỉ cần ordering **theo entity** (theo `orderId`, `accountId`). Vậy ta partition theo key và song song hóa giữa các key.

**Kỹ thuật:**
1. **Partition by key:** Kafka key, Service Bus SessionId, SQS MessageGroupId, RabbitMQ **consistent hash exchange** (plugin) hoặc Single Active Consumer cho từng queue shard.
2. **Song song trong partition theo key:** consumer đọc một partition, dispatch vào N worker theo `hash(key) % N`; mỗi worker tuần tự. Commit offset phải là offset nhỏ nhất chưa xong (Confluent Parallel Consumer làm sẵn).
3. **Tolerate out-of-order ở consumer:** dùng `version`/`sequence` trên entity, bỏ qua event cũ hơn version hiện tại; hoặc state machine từ chối chuyển trạng thái không hợp lệ và để retry.
4. **Event mang full state** (event-carried state transfer) + last-write-wins theo version → thứ tự ít quan trọng hơn.

```text
Partition 3 --> dispatcher --hash(orderId)%4--> worker0 (tuần tự)
                                            --> worker1
                                            --> worker2
                                            --> worker3
Offset commit = min(offset chưa hoàn thành) - đảm bảo không mất khi crash
```

**Lưu ý / bẫy thường gặp:**
- Producer cũng phải giữ thứ tự: idempotent producer với Kafka; publish tuần tự từ outbox theo aggregate.
- Retry/DLQ phá ordering; ghi rõ trade-off.
- RabbitMQ `nack(requeue=true)` đưa message về queue, consumer khác có thể lấy message sau trước.

## "Exactly-once" có thật không? Deduplication message ở các tầng? [senior]
**Những "exactly-once" có điều kiện:**
- **Kafka EOS:** idempotent producer + transactions + `read_committed`, đúng trong vòng Kafka → Kafka (consume-transform-produce). Không bao gồm side effect ra ngoài.
- **SQS FIFO:** "exactly-once processing" nghĩa là dedup trong **cửa sổ 5 phút** theo deduplication ID; ngoài cửa sổ hoặc khi visibility timeout hết hạn thì vẫn có thể xử lý lại.
- **Azure Service Bus duplicate detection:** dedup theo `MessageId` trong cửa sổ cấu hình (từ 20 giây tới 7 ngày).
- **NATS JetStream:** dedup theo `Nats-Msg-Id` trong duplicate window + double ack.
- **Flink/Kafka Streams:** exactly-once **state** nhờ checkpoint/transactions, nhưng sink ngoài phải transactional hoặc idempotent.

**Myth thường gặp:**
1. "Bật `enable.idempotence` là hết duplicate": chỉ chống duplicate do retry của producer trong một session.
2. "Broker exactly-once thì consumer không cần idempotent": consumer crash sau khi ghi DB nhưng trước khi commit vẫn xử lý lại.
3. "Dedup window đủ lâu": một bản replay từ DLQ sau 2 ngày vượt mọi window.

**Dedup nhiều tầng (defense in depth):**

| Tầng | Kỹ thuật |
| --- | --- |
| Producer | Message ID ổn định sinh trong outbox, idempotent producer |
| Broker | Duplicate detection window (Service Bus, SQS FIFO, JetStream) |
| Consumer | Inbox table, unique constraint, upsert, version check |
| Side effect ngoài | Idempotency key gửi tới API đối tác |

**Lưu ý / bẫy thường gặp:** chọn dedup key đúng nghĩa nghiệp vụ. Hai message khác ID nhưng cùng nghiệp vụ (user bấm "Thanh toán" hai lần) không bị dedup bởi message ID; cần business idempotency key (`orderId + action`).

# Design & Patterns

## Competing consumers và pub/sub fan-out: khi nào dùng cái nào, kết hợp ra sao? [junior]
**Competing consumers:** nhiều instance cùng đọc **một queue** (hoặc cùng consumer group), mỗi message được một instance xử lý. Mục đích: **scale throughput** và **high availability** cho một loại công việc.

**Pub/sub fan-out:** một event được copy cho **nhiều subscriber khác nhau**, mỗi subscriber là một mục đích nghiệp vụ khác (gửi email, cập nhật kho, analytics).

Hệ thống thực tế kết hợp cả hai:

```text
                         +--> queue: inventory.order-placed --> [inv-1][inv-2][inv-3]  (competing)
OrderPlaced --> exchange |
   (fanout/topic)        +--> queue: email.order-placed     --> [email-1][email-2]     (competing)
                         +--> queue: analytics.order-placed --> [analytics-1]
```

- RabbitMQ: một exchange, **mỗi service một queue riêng**, nhiều instance của service cùng consume queue đó.
- Kafka: một topic, **mỗi service một consumer group**, nhiều instance trong group chia partition.
- AWS: SNS topic → mỗi service một SQS queue.
- Azure: Topic → mỗi service một subscription.

**Lưu ý / bẫy thường gặp:**
- Sai lầm phổ biến: các service khác nhau đọc **chung một queue** → mỗi message chỉ tới một service, các service khác "mất" event.
- Ngược lại: nhiều instance của cùng service mỗi cái tạo queue riêng (ví dụ tên queue chứa hostname) → mỗi instance đều xử lý → duplicate side effect (gửi email N lần). Chỉ dùng queue riêng per-instance khi cố ý broadcast (invalidate cache local).
- Competing consumers làm mất ordering; xem các kỹ thuật partition by key.

## Request-reply qua messaging hoạt động thế nào (correlation id, reply-to)? [mid]
Đôi khi cần mô hình hỏi-đáp nhưng vẫn muốn lợi ích của broker (load balancing, buffer, không cần service discovery).

**Cơ chế:**
1. Requester tạo hoặc dùng **reply queue** (thường exclusive, auto-delete, một queue cho mỗi instance requester).
2. Gửi request kèm header **`reply-to`** = tên reply queue và **`correlation-id`** = ID duy nhất.
3. Responder xử lý, gửi response tới queue trong `reply-to`, copy `correlation-id`.
4. Requester giữ dictionary `correlationId → TaskCompletionSource`, khớp response, có **timeout**.

```text
Client --(request, reply-to=amq.gen-xyz, correlation-id=c1)--> rpc.queue --> Server
Client <--(response, correlation-id=c1)-- amq.gen-xyz <----------------------+
```

RabbitMQ có **Direct Reply-to** (`amq.rabbitmq.reply-to`) không cần khai báo reply queue, latency thấp. NATS có request-reply native qua inbox subject. MassTransit có `IRequestClient<T>`.

```csharp
var client = bus.CreateRequestClient<CheckStock>(timeout: RequestTimeout.After(s: 5));
var response = await client.GetResponse<StockResult>(new CheckStock(productId, qty));
```

**Khi nào dùng:** gọi service nằm sau firewall/khác mạng, worker xử lý nặng cần load leveling, hệ thống đã dùng broker làm backbone.

**Lưu ý / bẫy thường gặp:**
- Không biến mọi thứ thành RPC qua broker: bạn có lại temporal coupling của sync call mà thêm latency và độ phức tạp.
- Bắt buộc timeout; response đến trễ sau timeout phải được bỏ qua an toàn.
- Requester restart thì reply queue exclusive biến mất, response in-flight bị mất; request phải idempotent để client retry.

## Claim check pattern là gì? Thiết kế message envelope và headers thế nào? [mid]
**Claim check:** broker không phù hợp với payload lớn (Kafka mặc định `message.max.bytes` khoảng 1MB, Service Bus Standard 256KB, RabbitMQ khuyến nghị message nhỏ). Thay vì gửi file, producer:
1. Upload payload lên object storage (S3, Azure Blob) với key duy nhất.
2. Gửi message nhỏ chứa **reference** (URL/key, checksum, size, content type).
3. Consumer tải payload theo reference.

```json
{ "type": "InvoicePdfGenerated", "blobUri": "s3://invoices/2026/10/inv-123.pdf", "sha256": "ab12...", "sizeBytes": 4823311 }
```

Lưu ý lifecycle: xóa blob khi nào (lifecycle policy theo TTL lớn hơn retention của message), quyền truy cập (pre-signed URL ngắn hạn hoặc consumer có IAM role). AWS SQS Extended Client và Azure Service Bus đều có hướng dẫn chính thức cho pattern này.

**Message envelope:** tách metadata khỏi business payload, theo chuẩn **CloudEvents** càng tốt:

```json
{
  "specversion": "1.0",
  "id": "8f2c6c1e-...",
  "source": "/hrm/payroll",
  "type": "hrm.payroll.salary-calculated.v1",
  "time": "2026-10-15T08:00:00Z",
  "datacontenttype": "application/json",
  "subject": "employee/1024",
  "data": { "employeeId": 1024, "period": "2026-09", "net": 25000000 }
}
```

**Headers nên có:** message ID, correlation ID, causation ID (message nào gây ra message này), `traceparent` (W3C), tenant ID, schema version, content type, timestamp, source.

**Lưu ý / bẫy thường gặp:** không đặt dữ liệu nhạy cảm (PII, token) vào header vì header thường được log và hiển thị trên UI quản trị; mã hóa hoặc chỉ gửi reference.

## Event schema versioning và evolution: Schema Registry, Avro/Protobuf, compatibility modes? [senior]
Producer và consumer deploy độc lập, nên schema phải tiến hóa mà không làm vỡ bên kia.

**Quy tắc tiến hóa an toàn (additive changes):**
- Thêm field **optional/có default**: an toàn.
- Xóa field: chỉ an toàn nếu field đó optional và consumer không bắt buộc.
- Đổi tên, đổi kiểu, đổi ngữ nghĩa: **breaking** → tạo event mới (`OrderPlacedV2`) hoặc topic mới, chạy song song trong giai đoạn chuyển tiếp.
- Protobuf: không tái sử dụng field number, dùng `reserved`.

**Schema Registry** (Confluent, Apicurio, AWS Glue, Azure Schema Registry): lưu schema theo **subject** (mặc định `<topic>-value`), mỗi message chỉ mang **schema ID** (magic byte + 4 byte ID) thay vì cả schema; registry kiểm tra compatibility khi đăng ký version mới.

| Mode | Ý nghĩa | Thứ tự nâng cấp |
| --- | --- | --- |
| `BACKWARD` (mặc định Confluent) | Schema mới đọc được dữ liệu cũ | Nâng consumer trước |
| `FORWARD` | Schema cũ đọc được dữ liệu mới | Nâng producer trước |
| `FULL` | Cả hai chiều | Thứ tự bất kỳ |
| `*_TRANSITIVE` | Kiểm tra với **mọi** version trước, không chỉ version liền kề | Cần khi consumer có thể replay dữ liệu rất cũ |
| `NONE` | Không kiểm tra | Tránh dùng |

**So sánh format:** JSON (dễ đọc, không ép schema, lớn), **Avro** (nhỏ gọn, cần schema để đọc, mạnh về evolution, phổ biến trong Kafka), **Protobuf** (nhỏ gọn, codegen tốt cho .NET/Go, field number), JSON Schema (validate JSON).

**Lưu ý / bẫy thường gặp:**
- Với topic retention dài hoặc compacted, consumer mới đọc từ đầu sẽ gặp mọi version cũ → dùng `BACKWARD_TRANSITIVE`.
- Đưa kiểm tra compatibility vào CI (Maven/Gradle plugin hoặc REST API của registry) thay vì phát hiện khi deploy.
- Consumer nên **tolerant reader**: bỏ qua field lạ, không fail với enum value mới.

## Event notification vs event-carried state transfer? Event sourcing vs event streaming? [senior]
**Event notification (thin event):** chỉ báo "có gì đó xảy ra" kèm ID.

```json
{ "type": "EmployeeUpdated", "employeeId": 1024, "version": 7 }
```

Consumer cần dữ liệu thì **gọi lại API** của producer. Ưu: payload nhỏ, luôn lấy dữ liệu mới nhất, không lộ dữ liệu. Nhược: coupling runtime (producer down thì consumer kẹt), tăng tải producer (thundering herd khi nhiều consumer cùng gọi).

**Event-carried state transfer (fat event):** event mang đủ dữ liệu để consumer cập nhật bản sao local.

```json
{ "type": "EmployeeUpdated", "employeeId": 1024, "version": 7,
  "data": { "name": "Nguyen Van A", "departmentId": 12, "title": "Senior Dev" } }
```

Ưu: consumer tự chủ, không gọi ngược, availability cao. Nhược: payload lớn, dữ liệu trùng lặp (eventual consistency), schema coupling chặt hơn, phải xử lý ordering bằng version. Kết hợp với Kafka **compacted topic** để consumer mới bootstrap toàn bộ state.

**Event sourcing vs event streaming:**

| | Event sourcing | Event streaming |
| --- | --- | --- |
| Bản chất | Pattern **lưu trữ**: state của aggregate = fold chuỗi event | Pattern **tích hợp/truyền tải**: event chảy giữa hệ thống |
| Phạm vi | Bên trong một service/bounded context | Giữa các service |
| Event | Domain event chi tiết, private | Integration event, public contract |
| Store | Event store (EventStoreDB, Marten, bảng append-only) với optimistic concurrency theo stream | Kafka, Pulsar, Kinesis |

**Lưu ý / bẫy thường gặp:** dùng Kafka làm event store cho event sourcing là bẫy phổ biến: Kafka không hỗ trợ đọc hiệu quả "mọi event của aggregate X" (phải quét partition) và không có optimistic concurrency theo stream. Cũng không nên publish thẳng domain event nội bộ ra ngoài; ánh xạ sang integration event để giữ tự do thay đổi.

## Triển khai saga trên message broker thế nào? Xử lý timeout và delay? [senior]
Phần khái niệm orchestration/choreography đã có ở topic Architecture; ở đây tập trung vào **chi tiết hiện thực trên broker**.

**Orchestration với state machine bền vững:**
- Orchestrator (ví dụ MassTransit `MassTransitStateMachine`, NServiceBus Saga, Wolverine saga) lưu **saga state** trong DB (correlation ID = orderId, current state, version).
- Nhận event → chuyển trạng thái → gửi command tiếp theo. Mỗi bước: cập nhật saga state + gửi command qua **outbox** trong cùng transaction.
- **Optimistic concurrency** trên saga state (row version) vì hai event của cùng saga có thể đến đồng thời trên hai consumer.

```text
OrderSubmitted -> [Pending] --send ReserveStock--> Inventory
StockReserved  -> [StockReserved] --send ChargePayment--> Payment
PaymentFailed  -> [Compensating] --send ReleaseStock--> Inventory -> [Cancelled]
PaymentTimeout -> [Compensating] (scheduled message)
```

**Timeout:** saga phải tự đánh thức nếu không nhận được phản hồi. Dùng **scheduled/delayed message**: Service Bus `ScheduleMessageAsync`, SQS delay (tối đa 15 phút), RabbitMQ delayed exchange hoặc TTL+DLX, hoặc scheduler (Quartz/Hangfire) thông qua MassTransit message scheduler. Khi timeout đến mà saga đã sang trạng thái khác thì bỏ qua.

**Yêu cầu bắt buộc:**
- Mọi command và compensation phải **idempotent** (sẽ được giao lại).
- Compensation là hành động nghiệp vụ ngược (hoàn tiền, nhả kho), không phải rollback DB; có thể thất bại và cần retry/alert người.
- Thiết kế "semantic lock" (trạng thái `PENDING`) để các request khác biết dữ liệu đang trong saga.

**Lưu ý / bẫy thường gặp:** choreography với hơn 4-5 bước rất khó trace và debug ("event spaghetti"); khi cần nhìn thấy trạng thái tổng thể và timeout, chọn orchestration. Cân nhắc workflow engine (Temporal, Azure Durable Functions) khi luồng dài và phức tạp.

# Tích hợp .NET & Node.js

## So sánh MassTransit, NServiceBus, CAP và Wolverine? Khi nào dùng thư viện trừu tượng thay vì client trực tiếp? [mid]
| | MassTransit | NServiceBus | CAP (DotNetCore.CAP) | Wolverine |
| --- | --- | --- | --- | --- |
| Giấy phép | v8 Apache 2.0; từ v9 chuyển sang mô hình commercial | Commercial (Particular) | MIT | MIT (JasperFx) |
| Transport | RabbitMQ, Azure Service Bus, SQS, Kafka/Event Hubs (Riders), in-memory | Rất nhiều, kể cả SQL Server transport | RabbitMQ, Kafka, Azure SB, SQS, Redis Streams, NATS... | RabbitMQ, Azure SB, SQS, Kafka, in-memory |
| Outbox | Có (EF Core, MongoDB) | Có, rất trưởng thành | **Cốt lõi của thư viện**: outbox + inbox theo DB | Có, tích hợp Marten/EF Core |
| Saga | State machine mạnh | Saga + ServicePulse/ServiceInsight monitoring | Không có saga đầy đủ | Có |
| Điểm mạnh | Cộng đồng lớn, retry/redelivery, request client, test harness | Hỗ trợ thương mại, tooling vận hành | Đơn giản, eventual consistency với outbox | Mediator + messaging hợp nhất, codegen hiệu năng cao |

**Lợi ích của thư viện trừu tượng:** topology tự động (exchange/queue/subscription), serialization, retry + redelivery + DLQ (`_error` queue), outbox/inbox, saga, scheduling, OpenTelemetry, test harness, đổi transport ít sửa code.

**Khi dùng client trực tiếp** (`RabbitMQ.Client`, `Confluent.Kafka`, `Azure.Messaging.ServiceBus`):
- Kafka streaming throughput cao, cần kiểm soát partition/offset chi tiết (abstraction kiểu "bus" không phù hợp mô hình log).
- Dịch vụ nhỏ, chỉ một loại message, không muốn phụ thuộc framework.
- Cần tính năng đặc thù broker mà abstraction che mất.

**Lưu ý / bẫy thường gặp:** kiểm tra giấy phép trước khi chọn (MassTransit v9, NServiceBus đều có chi phí; nhiều team giữ MassTransit v8 hoặc chuyển sang Wolverine/CAP). Đừng để abstraction che mất hiểu biết về broker: bạn vẫn phải hiểu prefetch, ack, partition để debug production.

## Viết producer/consumer RabbitMQ bằng RabbitMQ.Client với publisher confirms và manual ack? [mid]
Ví dụ dùng **RabbitMQ.Client 7.x** (API async hoàn toàn).

```csharp
var factory = new ConnectionFactory { HostName = "localhost", ClientProvidedName = "order-service" };
await using var conn = await factory.CreateConnectionAsync();

// Producer: bật publisher confirms, BasicPublishAsync sẽ chờ confirm và throw nếu bị nack
var pubOpts = new CreateChannelOptions(publisherConfirmationsEnabled: true,
                                       publisherConfirmationTrackingEnabled: true);
await using var pubCh = await conn.CreateChannelAsync(pubOpts);

await pubCh.ExchangeDeclareAsync("orders", ExchangeType.Topic, durable: true);
await pubCh.QueueDeclareAsync("billing.orders", durable: true, exclusive: false, autoDelete: false,
    arguments: new Dictionary<string, object?> {
        ["x-queue-type"] = "quorum",
        ["x-dead-letter-exchange"] = "orders.dlx"
    });
await pubCh.QueueBindAsync("billing.orders", "orders", "order.*.created");

var props = new BasicProperties { Persistent = true, MessageId = Guid.NewGuid().ToString(),
                                  ContentType = "application/json" };
var body = JsonSerializer.SerializeToUtf8Bytes(new { OrderId = 42 });
await pubCh.BasicPublishAsync("orders", "order.vn.created", mandatory: true, basicProperties: props, body: body);

// Consumer: channel riêng, prefetch, manual ack
await using var conCh = await conn.CreateChannelAsync();
await conCh.BasicQosAsync(prefetchSize: 0, prefetchCount: 20, global: false);
var consumer = new AsyncEventingBasicConsumer(conCh);
consumer.ReceivedAsync += async (_, ea) =>
{
    try
    {
        var msg = JsonSerializer.Deserialize<OrderCreated>(ea.Body.Span);
        await handler.HandleAsync(msg!);              // idempotent + commit DB
        await conCh.BasicAckAsync(ea.DeliveryTag, multiple: false);
    }
    catch (JsonException)
    {
        await conCh.BasicNackAsync(ea.DeliveryTag, false, requeue: false); // poison -> DLX
    }
    catch (Exception)
    {
        await conCh.BasicNackAsync(ea.DeliveryTag, false, requeue: false); // để retry queue (TTL+DLX) xử lý
    }
};
await conCh.BasicConsumeAsync("billing.orders", autoAck: false, consumer: consumer);
```

Node.js tương đương với `amqplib`: `createConfirmChannel()`, `ch.prefetch(20)`, `ch.consume(q, handler, { noAck: false })`, `ch.ack(msg)` / `ch.nack(msg, false, false)`.

**Lưu ý / bẫy thường gặp:**
- Connection long-lived (singleton trong DI), bật `AutomaticRecoveryEnabled` (mặc định true) nhưng vẫn phải xử lý message in-flight khi reconnect.
- Ở bản 6.x API là sync (`IModel`, `BasicPublish`, `ConfirmSelect` + `WaitForConfirmsOrDie`); nhiều code mẫu trên mạng vẫn là bản cũ.
- Publish đồng thời trên một channel từ nhiều thread không an toàn; dùng pool channel hoặc lock.

## Viết Kafka consumer bằng Confluent.Kafka trong BackgroundService với manual commit và graceful shutdown? [mid]
```csharp
public sealed class OrderConsumer(IServiceScopeFactory scopes, ILogger<OrderConsumer> log) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken) =>
        Task.Factory.StartNew(() => Run(stoppingToken), stoppingToken,
            TaskCreationOptions.LongRunning, TaskScheduler.Default); // Consume() là blocking

    private void Run(CancellationToken ct)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = "kafka:9092",
            GroupId = "billing",
            EnableAutoCommit = false,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            PartitionAssignmentStrategy = PartitionAssignmentStrategy.CooperativeSticky,
            GroupInstanceId = Environment.GetEnvironmentVariable("POD_NAME"), // static membership
            MaxPollIntervalMs = 300_000
        };
        using var consumer = new ConsumerBuilder<string, string>(config)
            .SetPartitionsRevokedHandler((c, parts) => log.LogInformation("Revoked {P}", parts))
            .Build();
        consumer.Subscribe("orders");
        try
        {
            while (!ct.IsCancellationRequested)
            {
                var cr = consumer.Consume(ct);           // throw OperationCanceledException khi shutdown
                using var scope = scopes.CreateScope();
                var handler = scope.ServiceProvider.GetRequiredService<IOrderHandler>();
                handler.HandleAsync(cr.Message.Key, cr.Message.Value, ct).GetAwaiter().GetResult();
                consumer.Commit(cr);                      // at-least-once: commit sau khi xử lý
            }
        }
        catch (OperationCanceledException) { }
        finally
        {
            consumer.Close(); // commit/leave group sạch sẽ -> rebalance nhanh, không chờ session timeout
        }
    }
}
```

Producer: `new ProducerBuilder<string,string>(new ProducerConfig { BootstrapServers = ..., Acks = Acks.All, EnableIdempotence = true, LingerMs = 10, CompressionType = CompressionType.Lz4 })`, gọi `ProduceAsync` (hoặc `Produce` + delivery handler cho throughput cao), `Flush` khi dispose. Producer là thread-safe, đăng ký **singleton**.

**Graceful shutdown:**
- `HostOptions.ShutdownTimeout` (mặc định 30s) phải đủ cho message đang xử lý.
- Gọi `Close()` để rời group ngay, tránh partition "treo" tới hết `session.timeout.ms`.
- Kubernetes: `terminationGracePeriodSeconds` lớn hơn shutdown timeout.

**Lưu ý / bẫy thường gặp:**
- `Commit()` sync từng message chậm; tối ưu bằng commit theo batch/khoảng thời gian, hoặc pattern khuyến nghị của Confluent: `EnableAutoCommit=true` + `EnableAutoOffsetStore=false` + `StoreOffset(cr)` sau khi xử lý (commit nền chỉ những offset đã store).
- Không chạy vòng `Consume()` blocking trên thread pool mặc định của `ExecuteAsync` mà không `LongRunning`/`Task.Run`, sẽ chặn startup của host.
- Node.js: `kafkajs` gần như không còn được bảo trì tích cực; Confluent khuyến nghị `@confluentinc/kafka-javascript` (dựa trên librdkafka).

## Propagate distributed trace qua message bằng OpenTelemetry thế nào? [senior]
Trong HTTP, context truyền qua header `traceparent`. Với messaging, producer phải **inject** context vào **message headers**, consumer **extract** để nối trace.

```csharp
private static readonly ActivitySource Source = new("Hrm.Messaging");
private static readonly TextMapPropagator Propagator = Propagators.DefaultTextMapPropagator;

// Producer
using var activity = Source.StartActivity("orders publish", ActivityKind.Producer);
activity?.SetTag("messaging.system", "kafka");
activity?.SetTag("messaging.destination.name", "orders");
var headers = new Headers();
Propagator.Inject(new PropagationContext(activity?.Context ?? default, Baggage.Current), headers,
    (h, key, value) => h.Add(key, Encoding.UTF8.GetBytes(value)));
await producer.ProduceAsync("orders", new Message<string, string> { Key = id, Value = json, Headers = headers });

// Consumer
var parent = Propagator.Extract(default, cr.Message.Headers,
    (h, key) => h.TryGetLastBytes(key, out var b) ? new[] { Encoding.UTF8.GetString(b) } : Array.Empty<string>());
Baggage.Current = parent.Baggage;
using var span = Source.StartActivity("orders process", ActivityKind.Consumer, parent.ActivityContext);
```

**Điểm cần biết:**
- Span kind: `Producer` (gửi), `Consumer` (nhận/xử lý), theo **OpenTelemetry semantic conventions for messaging** (`messaging.system`, `messaging.operation.type`, `messaging.destination.name`, `messaging.kafka.consumer.group`...).
- **Batch processing:** một span xử lý batch nhiều message từ nhiều trace khác nhau → dùng **span links** thay vì một parent duy nhất.
- Thời gian nằm trong queue = khoảng cách giữa producer span và consumer span; rất hữu ích để phát hiện lag.
- MassTransit, NServiceBus, Wolverine, Azure SDK có instrumentation sẵn (đăng ký `AddSource("MassTransit")`); `RabbitMQ.Client` 7.x có `RabbitMQ.Client.OpenTelemetry`. Confluent.Kafka chưa có instrumentation chính thức nên thường tự inject như trên.
- Với **outbox**, phải lưu `traceparent` vào bảng outbox lúc ghi, relay đọc ra và đặt vào header; nếu không trace sẽ đứt tại relay.

**Lưu ý / bẫy thường gặp:** đừng nhét correlation ID nghiệp vụ thay cho trace context, hai thứ khác nhau và nên có cả hai. Trace rất dài (event kích hoạt chuỗi event kéo dài nhiều giờ) nên cân nhắc tạo trace mới và link về trace gốc.

## Kiểm thử code messaging thế nào? Testcontainers, test harness, contract test? [mid]
**Các tầng kiểm thử:**

1. **Unit test handler:** tách logic khỏi transport; handler nhận object message, test như hàm bình thường (kiểm tra idempotency: gọi hai lần, kết quả như một).
2. **In-memory test harness:** MassTransit `AddMassTransitTestHarness()`, kiểm tra `harness.Published.Any<OrderPlaced>()`, `consumerHarness.Consumed.Any<...>()`; Wolverine có tracked sessions. Nhanh, nhưng không phát hiện lỗi topology/serialization thực.
3. **Integration test với broker thật bằng Testcontainers:**

```csharp
public sealed class KafkaFixture : IAsyncLifetime
{
    public KafkaContainer Kafka { get; } = new KafkaBuilder().WithImage("confluentinc/cp-kafka:7.6.1").Build();
    public RabbitMqContainer Rabbit { get; } = new RabbitMqBuilder().WithImage("rabbitmq:4-management").Build();
    public Task InitializeAsync() => Task.WhenAll(Kafka.StartAsync(), Rabbit.StartAsync());
    public Task DisposeAsync() => Task.WhenAll(Kafka.DisposeAsync().AsTask(), Rabbit.DisposeAsync().AsTask());
}
// Trong test: dùng Kafka.GetBootstrapAddress(), Rabbit.GetConnectionString()
```

Package: `Testcontainers.Kafka`, `Testcontainers.RabbitMq`, `Testcontainers.PostgreSql` (cho outbox). Dùng polling assertion có timeout thay vì `Thread.Sleep`.

4. **Contract test:** Pact hỗ trợ **message pact** (consumer định nghĩa message mong đợi, provider verify), hoặc kiểm tra compatibility qua Schema Registry trong CI.
5. **Kịch bản lỗi (fault injection):** kill consumer giữa chừng, gửi duplicate, gửi out-of-order, poison message, broker restart (Toxiproxy để giả lập network chậm/đứt).

**Lưu ý / bẫy thường gặp:**
- Test async hay flaky: luôn chờ theo điều kiện (`await Eventually(() => ...)`) và cô lập dữ liệu mỗi test (tên topic/queue/group ngẫu nhiên).
- Đừng chỉ test happy path; giá trị lớn nhất của integration test messaging là kiểm tra retry, DLQ, idempotency và outbox khi crash.

# Vận hành & Performance

## Cần monitor những metric nào cho hệ thống messaging? [mid]
**Nhóm metric cốt lõi:**

| Metric | RabbitMQ | Kafka | SQS / Service Bus |
| --- | --- | --- | --- |
| Backlog | `messages_ready` (queue depth) | **Consumer lag** theo group/partition | `ApproximateNumberOfMessagesVisible` / `ActiveMessageCount` |
| Đang xử lý | `messages_unacknowledged` | - | `ApproximateNumberOfMessagesNotVisible` / locked |
| Tuổi message cũ nhất | Qua plugin/consumer | Lag theo thời gian (Burrow, kafka-lag-exporter) | `ApproximateAgeOfOldestMessage` |
| Throughput | publish/deliver/ack rate | bytes in/out, records/s | NumberOfMessagesSent/Received |
| Lỗi | redelivered rate, DLQ depth | DLT size, consumer errors, producer `record-error-rate` | DLQ depth, `DeadLetterMessageCount` |
| Sức khỏe broker | memory/disk alarm, fd, Erlang processes, quorum leader | **UnderReplicatedPartitions**, **OfflinePartitionsCount**, ActiveControllerCount (=1), ISR shrink/expand, request latency, disk usage | Throttled requests (Service Bus) |
| Consumer | consumer count, consumer utilisation | rebalance rate, commit latency, poll interval | - |

**Golden signals cho pipeline:** độ trễ end-to-end (thời điểm produce đến khi xử lý xong, đo bằng timestamp trong header), tỷ lệ lỗi, throughput, saturation (queue depth/lag).

**Alert nên có:**
- Lag/queue depth **tăng liên tục** trong X phút (không alert theo ngưỡng tuyệt đối đơn thuần: lag 10k có thể bình thường ở giờ cao điểm).
- Tuổi message cũ nhất vượt SLA.
- DLQ có message mới (> 0).
- Consumer count = 0.
- Kafka: UnderReplicatedPartitions > 0, OfflinePartitions > 0, disk > 80%.
- RabbitMQ: memory/disk alarm, unacked tăng mà ack rate bằng 0.

**Công cụ:** Prometheus + Grafana (rabbitmq_prometheus, JMX exporter / KRaft metrics, kafka-lag-exporter), Kafka UI/AKHQ/Conduktor, Azure Monitor, CloudWatch.

**Lưu ý / bẫy thường gặp:** lag theo **số message** dễ gây hiểu nhầm giữa các topic có tốc độ khác nhau; lag theo **thời gian** (giây) mới phản ánh trải nghiệm người dùng.

## Scale consumer và capacity planning cho message broker thế nào? [senior]
**Scale consumer:**
- **RabbitMQ/SQS/Service Bus:** thêm instance (competing consumers) gần như tuyến tính tới khi downstream (DB, API) bão hòa. Tăng concurrency trong instance (prefetch, `MaxConcurrentCalls`).
- **Kafka:** song song tối đa = số partition của topic cho một group. Muốn hơn: tăng partition (cân nhắc ordering) hoặc xử lý song song trong partition theo key.
- **Autoscale theo backlog:** **KEDA** trên Kubernetes có scaler cho Kafka lag, RabbitMQ queue length, SQS, Azure Service Bus. Đặt min/max replica, cooldown để tránh dao động; với Kafka, mỗi lần scale gây rebalance → dùng cooperative sticky/static membership.

**Bottleneck thường không phải broker** mà là downstream: scale consumer từ 10 lên 50 có thể làm DB sập. Giới hạn concurrency theo khả năng downstream (bulkhead, rate limiter), batch ghi DB.

**Capacity planning (ví dụ Kafka):**

```text
Đầu vào: 50.000 msg/s * 1 KB = 50 MB/s ingress
Replication factor 3 -> ghi đĩa toàn cluster = 150 MB/s
Retention 7 ngày: 50 MB/s * 86.400 * 7 ~ 30 TB * 3 replica ~ 90 TB (+ 30-40% headroom)
Egress: 3 consumer group đọc hết = 150 MB/s + replication 100 MB/s
Partition: consumer xử lý 2.000 msg/s/partition -> >= 25 partition, chọn 48
Broker: mỗi broker ~ 30-50 MB/s ingress an toàn -> 6 broker, đĩa ~ 18 TB/broker
```

Với RabbitMQ: ước lượng theo message rate (nghìn tới vài chục nghìn msg/s mỗi queue), kích thước backlog tối đa có thể chấp nhận khi consumer chết (RAM/đĩa), số connection/channel.

**Lưu ý / bẫy thường gặp:**
- Thiết kế cho kịch bản **consumer downtime**: backlog tích lũy trong 2 giờ sự cố có fit đĩa không, và mất bao lâu để xả (drain rate phải cao hơn hẳn incoming rate).
- Load test với kích thước message, số partition, acks thực tế; benchmark mặc định thường đẹp hơn production nhiều.
- Một queue RabbitMQ là đơn vị đơn luồng ở một node; throughput cao cần nhiều queue (sharding, consistent hash exchange) hoặc dùng stream.

## Bảo mật và multi-region cho message broker: TLS, SASL, ACL, vhost, MirrorMaker 2, Shovel/Federation? [senior]
**Bảo mật:**

| Lớp | RabbitMQ | Kafka |
| --- | --- | --- |
| Mã hóa đường truyền | TLS (port 5671), cả inter-node | TLS listener, inter-broker TLS |
| Xác thực | User/password, x509 client cert, OAuth 2.0 (JWT) plugin, LDAP | **SASL**: PLAIN (chỉ dùng kèm TLS), SCRAM-SHA-256/512, GSSAPI (Kerberos), OAUTHBEARER; mTLS |
| Phân quyền | Permission configure/write/read theo regex trên **vhost**, topic permission | **ACL** theo principal: topic, group, cluster, transactionalId; prefix ACL |
| Cô lập | vhost cho mỗi môi trường/tenant | Quy ước tên topic + ACL prefix, quota per client |

Nguyên tắc: least privilege (service chỉ được write topic của mình, read topic đăng ký), không dùng user `guest` (RabbitMQ chặn guest từ xa mặc định), rotate credential, **quota** chống noisy neighbor (Kafka `producer_byte_rate`, `consumer_byte_rate`), mã hóa payload nhạy cảm ở mức ứng dụng nếu cần (broker admin vẫn đọc được message), audit log.

**Multi-region / multi-cluster:**
- **Kafka MirrorMaker 2** (dựa trên Kafka Connect): replicate topic giữa cluster, đồng bộ consumer group offset (checkpoint, offset translation), topic được đặt tên kèm alias cluster nguồn (`us-east.orders`) để tránh vòng lặp trong active-active. Lựa chọn khác: Confluent Cluster Linking, Replicator.
- **RabbitMQ Shovel:** di chuyển message từ queue/exchange nguồn tới đích (cùng hoặc khác cluster), phù hợp chuyển tiếp, migration.
- **RabbitMQ Federation:** federated exchange/queue nối các broker qua WAN lỏng lẻo, chịu được mạng chập chờn; dùng thay vì cluster trải qua nhiều region.
- Managed: Azure Service Bus Geo-Replication/Geo-DR (Premium), SQS là regional (phải tự replicate qua SNS/EventBridge cross-region).

**Lưu ý / bẫy thường gặp:** replication liên region là **async** → failover có thể mất các message cuối (RPO > 0) và offset dịch không chính xác tuyệt đối → consumer phải idempotent khi chuyển region. Active-active cần xử lý xung đột và vòng lặp replicate.

## Troubleshooting: consumer lag tăng, message kẹt unacked, rebalancing storm, duplicate processing, mất message? [senior]
**1. Consumer lag tăng liên tục**
- Kiểm tra: incoming rate tăng đột biến hay processing rate giảm? Lag dồn ở một vài partition (hot partition/consumer chậm) hay tất cả?
- Nguyên nhân: downstream chậm (DB lock, API timeout), GC pause, một message lỗi bị retry chặn partition, số consumer < số partition, rebalance liên tục.
- Xử lý: scale consumer (tới số partition), tối ưu batch ghi DB, chuyển retry sang non-blocking, tạm pause consumer phụ, xử lý song song theo key.

**2. Message kẹt unacked (RabbitMQ)**
- Consumer quên ack trong một nhánh code (exception bị nuốt), deadlock, prefetch lớn + consumer treo.
- Kiểm tra `messages_unacknowledged` theo consumer/channel trên management UI; `consumer_timeout` sẽ đóng channel sau 30 phút. Fix: đảm bảo mọi nhánh đều ack/nack (try/finally), timeout cho thao tác bên trong.

**3. Rebalancing storm (Kafka)**
- Triệu chứng: log liên tục `Revoked/Assigned`, lag tăng, duplicate.
- Nguyên nhân: xử lý vượt `max.poll.interval.ms`, `session.timeout.ms` quá thấp, pod restart/autoscale liên tục, GC dài.
- Xử lý: giảm `max.poll.records`, tăng `max.poll.interval.ms`, cooperative sticky, static membership, giảm dao động autoscale.

**4. Duplicate processing**
- Nguồn: retry producer không idempotent, rebalance trước commit, visibility/lock timeout hết hạn, relay outbox gửi lại.
- Xử lý: idempotent consumer (inbox), timeout > thời gian xử lý p99, commit trong `onPartitionsRevoked`.

**5. Mất message**
- Truy vết theo chặng: producer có nhận ack/confirm không (log lỗi callback)? Message có bị drop do unroutable (thiếu `mandatory`), TTL, `x-max-length drop-head`, retention Kafka xóa trước khi đọc, `auto.offset.reset=latest` khi group mất offset? Consumer auto-ack/commit trước khi xử lý?
- Công cụ: message ID + trace xuyên suốt, đếm số lượng ở mỗi chặng (reconciliation), log offset đã xử lý.

**Lưu ý / bẫy thường gặp:** trước khi "thêm consumer", xác nhận bottleneck nằm ở đâu bằng metric; thêm consumer khi downstream là bottleneck chỉ làm tình hình tệ hơn.

# Tình huống Senior

## Cho một bộ yêu cầu, bạn chọn broker nào? Trình bày cách ra quyết định. [senior]
Tôi đặt câu hỏi theo các trục quyết định, sau đó mới chọn:

| Câu hỏi | Nghiêng về |
| --- | --- |
| Cần **replay**/retention dài, nhiều consumer đọc lại cùng dữ liệu? | Kafka, Pulsar, RabbitMQ Streams |
| Throughput > 100k msg/s, event streaming, CDC, analytics? | Kafka (hoặc managed: MSK, Confluent Cloud, Event Hubs Kafka endpoint) |
| Routing phức tạp, task queue, priority, per-message ack, delay, RPC? | RabbitMQ |
| Đang trên Azure/AWS, muốn serverless, ít vận hành? | Azure Service Bus / SQS+SNS / EventBridge |
| Ordering theo entity + DLQ native + transactions? | Service Bus sessions, SQS FIFO, Kafka key |
| Latency micro giây, IoT/edge, chấp nhận mất? | NATS Core, MQTT, ZeroMQ |
| Multi-tenant, geo-replication native, tách storage? | Pulsar |
| Đội nhỏ, đã có Redis, khối lượng nhỏ? | Redis Streams, hoặc bảng DB làm queue (PostgreSQL `SKIP LOCKED`) |

**Ví dụ cụ thể:** hệ thống HRM SaaS trên Azure, 5.000 msg/s lúc chạy bảng lương, cần đảm bảo tính lương mỗi nhân viên theo thứ tự, workflow phê duyệt có timeout, đội 6 dev không có SRE riêng.
→ Chọn **Azure Service Bus Premium**: sessions theo `employeeId` cho ordering, scheduled message cho timeout phê duyệt, DLQ native, managed. Dùng MassTransit/Wolverine + outbox. Nếu sau này cần đẩy dữ liệu cho analytics/data lake với replay → thêm Event Hubs (Kafka API) cho luồng streaming, không ép một broker làm mọi việc.

**Các yếu tố phi chức năng:** năng lực vận hành của đội, chi phí (managed vs tự chạy), compliance/data residency, ecosystem connector, vendor lock-in, client library cho ngôn ngữ đang dùng.

**Lưu ý / bẫy thường gặp:** câu trả lời "Kafka vì nó nhanh" là tín hiệu yếu. Câu trả lời mạnh nêu rõ trade-off và điều kiện khiến lựa chọn thay đổi ("nếu cần replay 30 ngày tôi sẽ chuyển sang...").

## Thiết kế pipeline xử lý đơn hàng (order processing) dựa trên message broker? [senior]
**Yêu cầu giả định:** đặt hàng → giữ kho → thanh toán → tạo vận đơn → thông báo; không mất đơn, không trừ tiền hai lần, peak 3.000 đơn/s (flash sale), trạng thái đơn hiển thị cho user.

```text
Client -> Order API --(DB tx: orders + outbox)--> PostgreSQL
                                   | CDC/outbox relay
                                   v
              Kafka topic order-events (key = orderId, 24 partitions)
                 |                  |                  |
       Order Saga Orchestrator   Notification     Analytics/Search
       (state trong DB + outbox)  (consumer group)  (sink connector)
          | commands (queue)
          +--> inventory-commands --> Inventory svc --> event StockReserved/Failed
          +--> payment-commands   --> Payment svc (idempotency key = orderId) --> PaymentSucceeded/Failed
          +--> shipping-commands  --> Shipping svc
Mỗi consumer: inbox dedup, retry 1m/10m, DLT + alert, OpenTelemetry trace qua header
```

**Quyết định chính:**
1. **Order API** ghi đơn trạng thái `PENDING` + `OrderPlaced` vào outbox trong một transaction, trả `202 Accepted` + orderId; UI theo dõi trạng thái qua polling/WebSocket.
2. **Key = orderId** đảm bảo mọi event của một đơn có thứ tự.
3. **Saga orchestrator** quản lý bước và **compensation** (thanh toán fail → nhả kho), timeout (thanh toán quá 15 phút → hủy) bằng scheduled message.
4. **Idempotency:** Payment dùng orderId làm idempotency key với payment gateway; mọi consumer có inbox table.
5. **Back-pressure flash sale:** Order API chỉ ghi DB và outbox (nhanh), phần nặng đi qua queue; giới hạn concurrency consumer theo năng lực Inventory DB; kho hàng hot dùng Redis reserve trước (xem topic System Design flash sale).
6. **Error handling:** lỗi transient retry topic; lỗi nghiệp vụ (hết hàng) là **event**, không phải exception; poison → DLT + dashboard để redrive.
7. **Observability:** trace từ HTTP request tới từng consumer, metric lag và thời gian từ `OrderPlaced` tới `OrderCompleted`.

**Lưu ý / bẫy thường gặp:** đừng để Notification hay Analytics nằm trong luồng saga; chúng chỉ subscribe event, lỗi của chúng không được ảnh hưởng tới việc hoàn tất đơn hàng.

## Migrate từ RabbitMQ sang Kafka thế nào mà không downtime? [senior]
**Bước 0: Xác định lý do và phạm vi.** Kafka không phải bản nâng cấp của RabbitMQ. Chỉ migrate luồng cần replay/throughput/streaming; task queue, RPC, delay có thể ở lại RabbitMQ (chạy song song lâu dài là hợp lý).

**Khác biệt phải thiết kế lại:**
- Routing exchange/binding → topic + key + consumer group (routing phức tạp chuyển thành filter phía consumer hoặc nhiều topic).
- Ack từng message → commit offset theo partition; message lỗi không thể "nack" → cần retry topic + DLT.
- Prefetch/competing consumers không giới hạn → song song bị giới hạn bởi số partition.
- Priority, TTL, delay → không có native, phải tự thiết kế.
- Ordering trước dựa vào một consumer/queue → giờ dựa vào partition key.

**Chiến lược chuyển đổi (strangler):**
1. **Abstraction:** đưa publish/consume qua một lớp (MassTransit hoặc interface riêng) để đổi transport theo cấu hình.
2. **Bridge:** dùng Kafka Connect RabbitMQ source connector (hoặc service bridge tự viết) đẩy message từ RabbitMQ sang Kafka, consumer mới đọc Kafka trong khi producer cũ chưa đổi.
3. **Dual publish qua outbox:** producer ghi một outbox, relay publish tới cả hai broker. Tránh dual write trực tiếp trong code.
4. **Chuyển consumer từng service:** consumer mới chạy song song ở chế độ shadow (xử lý nhưng không side effect, so sánh kết quả), rồi bật thật và tắt consumer cũ. Idempotency bắt buộc vì giai đoạn chuyển có thể xử lý trùng.
5. **Chuyển producer**, giữ bridge ngược (Kafka → RabbitMQ) cho consumer chưa kịp chuyển.
6. Theo dõi đối soát (số lượng message mỗi luồng ở hai phía), có kế hoạch rollback bằng cấu hình.
7. Gỡ bridge và tài nguyên RabbitMQ sau khi ổn định.

**Lưu ý / bẫy thường gặp:** đánh giá trước năng lực vận hành Kafka (hoặc chọn managed), schema registry và chuẩn tên topic; nhiều dự án migrate thất bại vì mang nguyên tư duy "queue" sang Kafka (một topic cho mỗi loại command, hàng nghìn topic, lạm dụng partition = 1).

## Thiết kế hệ thống xử lý 1 triệu message/giây? [senior]
**Ước lượng trước:**

```text
1.000.000 msg/s * 1 KB = ~1 GB/s ingress (sau nén lz4/zstd có thể còn 300-500 MB/s)
RF = 3 -> ghi đĩa ~ 1-3 GB/s toàn cluster; mạng inter-broker tương ứng
Retention 3 ngày ~ 260 TB raw * 3 replica (trước nén) -> cân nhắc tiered storage
Consumer: nếu 1 partition xử lý 10k msg/s -> >= 100 partition, chọn 200-300
```

**Lựa chọn:** Kafka (hoặc Pulsar/Redpanda/managed Confluent Cloud). RabbitMQ không phải lựa chọn tự nhiên ở mức này (trừ Streams với nhiều stream shard).

**Producer:**
- Batch lớn: `linger.ms` 10-50, `batch.size` 256KB-1MB, nén `zstd`/`lz4`, `acks=all` + idempotence (độ bền) hoặc `acks=1` nếu chấp nhận rủi ro để giảm latency.
- Key phân bố đều, tránh hot partition; client async không chờ từng message.
- Gom message nhỏ ở edge (nhiều event nhỏ thành một record) nếu nghiệp vụ cho phép.

**Broker:**
- 12-30 broker tùy phần cứng, NVMe, mạng 25 Gbps, rack/AZ-aware, KRaft controller riêng.
- Tiered storage cho dữ liệu cũ, quota theo client, theo dõi page cache hit.

**Consumer:**
- Consumer group scale tới số partition, xử lý theo batch (bulk insert vào ClickHouse/Elasticsearch/S3), commit theo batch.
- Stream processing (Flink, Kafka Streams) cho aggregation thay vì ghi từng event vào OLTP DB.
- Downstream phải chịu được: DB OLTP không thể nhận 1M write/s; dùng columnar store, data lake, pre-aggregation.

**Vận hành:** load test thực tế (`kafka-producer-perf-test`), capacity headroom 30-50%, kịch bản mất một AZ, rebalance partition khi thêm broker (Cruise Control).

**Lưu ý / bẫy thường gặp:** bottleneck thường không ở Kafka mà ở serialization, consumer xử lý từng record, và hệ thống đích. Hỏi lại interviewer: 1M msg/s là peak hay trung bình, latency yêu cầu bao nhiêu, có cần ordering không, chấp nhận mất bao nhiêu.

## Làm sao đảm bảo không mất message end-to-end? [senior]
Trả lời theo từng chặng, mỗi chặng một cơ chế và cách kiểm chứng:

**1. Nguồn → Producer (dual write):** dùng **transactional outbox** (hoặc CDC) để nghiệp vụ và event commit atomic. Không publish trực tiếp sau `SaveChanges`.

**2. Producer → Broker:**
- RabbitMQ: publisher confirms + `mandatory` (hoặc alternate exchange) + retry; chỉ đánh dấu outbox đã gửi khi nhận confirm.
- Kafka: `acks=all`, `enable.idempotence=true`, `delivery.timeout.ms` đủ lớn, xử lý callback lỗi.
- Producer local buffer bị mất khi process crash → outbox giải quyết.

**3. Trong broker:**
- RabbitMQ: quorum queue (3 node), message persistent, giới hạn độ dài theo `reject-publish` thay vì `drop-head`, DLX cho mọi queue.
- Kafka: RF=3, `min.insync.replicas=2`, `unclean.leader.election.enable=false`, rack-aware, retention đủ dài so với downtime tối đa của consumer.
- Managed: DLQ bật, retention tối đa phù hợp.

**4. Broker → Consumer:**
- Manual ack/commit **sau** khi side effect commit; không auto-ack.
- Idempotent consumer (inbox) để retry an toàn.
- Lỗi không bao giờ "nuốt": retry → DLQ; DLQ có alert và quy trình redrive.

**5. Hạ tầng & vận hành:**
- Alert DLQ > 0, consumer count = 0, lag theo thời gian vượt retention một nửa.
- Backup/geo-replication cho DR, chấp nhận RPO rõ ràng.
- **Reconciliation:** job đối soát định kỳ (số đơn trong DB so với số đơn đã xử lý ở downstream), phát hiện "khoảng trống" bằng sequence number theo aggregate.

```text
[DB tx + outbox] -> [relay + confirm/acks=all] -> [replicated, durable broker] -> [consumer: process + inbox + ack sau commit] -> [DLQ + alert + redrive]
                                                     ^ reconciliation & tracing xuyên suốt ^
```

**Lưu ý / bẫy thường gặp:** "không mất" luôn đi kèm "có thể trùng"; nói rõ trade-off này và chỉ ra nơi đặt idempotency. Và không có hệ thống RPO = 0 tuyệt đối khi có replication liên region async; hãy nêu con số RPO/RTO cam kết thay vì hứa tuyệt đối.
