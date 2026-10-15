---
id: system-design
title: System Design
icon: 🧭
order: 11
description: Phỏng vấn system design thực chiến - phương pháp, ước lượng, building blocks, data layer, reliability và 14 case study kinh điển
---

# Phương pháp phỏng vấn System Design

## Framework 4 bước để trả lời một câu hỏi system design trong 45 phút là gì? Nên hỏi những clarifying questions nào? [junior]
Một framework phổ biến (theo Alex Xu, mở rộng thêm bước estimation) giúp bạn không bị "lạc" và để interviewer thấy tư duy có cấu trúc:

| Bước | Thời lượng (45') | Output cần có |
|---|---|---|
| 1. Requirements & scope | 5–8' | Danh sách functional (3–5 tính năng cốt lõi), non-functional (scale, latency, availability, consistency) |
| 2. Estimation | 3–5' | QPS trung bình/đỉnh, storage, bandwidth, read/write ratio |
| 3. High-level design | 10–15' | API, data model, sơ đồ khối end-to-end chạy được cho happy path |
| 4. Deep dive | 10–15' | 1–2 thành phần khó nhất: scaling DB, consistency, hot key, failure |
| 5. Wrap-up / bottlenecks | 3–5' | SPOF, monitoring, mở rộng tương lai, trade-off đã chọn |

**Nguyên tắc vận hành:**
- **Đi rộng trước, sâu sau**: có một thiết kế đơn giản hoạt động end-to-end trước khi tối ưu.
- **Nói to suy nghĩ** (think out loud) — interviewer chấm quá trình, không chấm đáp án.
- **Ghi lại giả định** lên bảng ("giả sử 10M DAU, read:write = 100:1") để mọi phép tính sau đều có gốc.
- **Hỏi interviewer muốn đi sâu phần nào** ở bước 4 — nhiều khi họ có sẵn trọng tâm (ví dụ: "hãy nói về fan-out").
- Senior được kỳ vọng tự **dẫn dắt** cuộc thảo luận, chủ động nêu failure mode và trade-off mà không cần gợi ý.

### Clarifying questions nên hỏi
Mục tiêu: thu hẹp phạm vi và biến đề bài mơ hồ thành con số cụ thể.

**Functional:**
- Tính năng cốt lõi nào bắt buộc? Cái gì nằm ngoài phạm vi (out of scope)?
- Ai là user (end user, internal, B2B)? Client là mobile, web hay cả hai?
- Có cần realtime không? Có search, notification, analytics không?

**Scale & traffic:**
- Bao nhiêu DAU/MAU? Tăng trưởng dự kiến trong 3–5 năm?
- Read-heavy hay write-heavy? Có traffic spike (flash sale, giờ cao điểm) không?
- Kích thước dữ liệu trung bình của một object (tin nhắn 100B hay video 500MB)?

**Non-functional:**
- Latency mục tiêu (p99 < 200ms?), availability (99.9% hay 99.99%)?
- Consistency: chấp nhận eventual hay bắt buộc strong (tiền, tồn kho)?
- Data retention bao lâu? Có yêu cầu compliance (GDPR, PCI-DSS, dữ liệu lưu tại VN)?
- Single region hay global?

**Ràng buộc:** dùng cloud nào, team bao nhiêu người, có hệ thống sẵn có cần tích hợp không.

Mẹo: sau khi hỏi, **tóm tắt lại** yêu cầu thành 1 danh sách ngắn và xác nhận với interviewer trước khi đi tiếp.

## Những sai lầm phổ biến khiến ứng viên trượt vòng system design? [mid]
1. **Nhảy vào giải pháp ngay** — vẽ Kafka, Redis trước khi biết bài toán cần gì.
2. **Over-engineering**: thiết kế microservices, multi-region cho hệ thống 1,000 user. Ngược lại, under-engineering cho đề "1 tỷ user".
3. **Buzzword không có lý do**: nói "dùng Cassandra" nhưng không giải thích được vì sao (write-heavy, partition key, tunable consistency).
4. **Bỏ qua non-functional requirements** — không nói availability, latency, consistency thì thiết kế không có tiêu chí để đánh giá.
5. **Không ước lượng** hoặc ước lượng xong không dùng con số để ra quyết định (ví dụ: 3TB thì 1 node Postgres vẫn chứa được, không cần shard ngay).
6. **Chỉ vẽ happy path**: không nói chuyện gì xảy ra khi node chết, message trùng, network partition.
7. **Đi quá sâu một chi tiết** (ví dụ thuật toán hash) mà bỏ trống phần lớn hệ thống khi hết giờ.
8. **Không lắng nghe gợi ý**: interviewer hỏi "nếu một user có 100M follower thì sao?" là đang dẫn bạn tới celebrity problem.
9. **Không biết data model** — thiết kế không có schema, không có partition key là thiết kế "trên mây".
10. **Im lặng quá lâu** — interviewer không chấm được điều bạn không nói ra.

## Làm thế nào để thảo luận trade-off một cách thuyết phục? [mid]
Trade-off là phần phân biệt senior và junior. Công thức: **"Option A vs B → tiêu chí → chọn gì trong bối cảnh này → chấp nhận nhược điểm gì → khi nào đổi quyết định"**.

Ví dụ:
> "Với feed, tôi chọn fan-out on write vì read:write ~ 100:1 và latency đọc cần < 200ms. Đổi lại tốn storage và write amplification. Với user > 1M follower, tôi chuyển sang fan-out on read để tránh ghi 1M bản ghi mỗi post. Nếu sau này tỉ lệ user inactive cao, có thể chỉ fan-out cho user active trong 7 ngày."

**Các trục trade-off kinh điển:**

| Trục | Ví dụ |
|---|---|
| Consistency vs Availability | Số dư ví (CP) vs số like (AP) |
| Latency vs Throughput | Batching tăng throughput nhưng tăng latency |
| Read vs Write optimization | Denormalize/index nhanh đọc, chậm ghi |
| Cost vs Performance | Cache nhiều RAM vs đọc DB |
| Simplicity vs Flexibility | Monolith vs microservices |
| Freshness vs Load | TTL cache ngắn vs dài |
| Build vs Buy | Tự vận hành Kafka vs dùng managed (MSK, Confluent) |

**Mẹo:** gắn trade-off với **con số** đã ước lượng và với **yêu cầu business**, luôn nói "nhược điểm của lựa chọn này là..." trước khi interviewer hỏi.

# Back-of-the-envelope Estimation

## Latency numbers every programmer should know và powers of 2 cần nhớ? [junior]
Bảng gốc của Jeff Dean (số liệu xấp xỉ, mục đích là **cảm nhận bậc độ lớn**):

| Thao tác | Thời gian |
|---|---|
| L1 cache reference | 0.5 ns |
| Branch mispredict | 5 ns |
| L2 cache reference | 7 ns |
| Mutex lock/unlock | 25 ns |
| Main memory reference | 100 ns |
| Compress 1KB (Snappy) | ~3 µs |
| Send 1KB qua mạng 1 Gbps | 10 µs |
| Random read 4KB từ SSD | ~150 µs |
| Đọc tuần tự 1MB từ RAM | 250 µs |
| Round trip trong cùng datacenter | 500 µs |
| Đọc tuần tự 1MB từ SSD | ~1 ms |
| Disk seek (HDD) | 10 ms |
| Đọc tuần tự 1MB từ HDD | ~20 ms |
| Gói tin CA → Hà Lan → CA | 150 ms |

**Kết luận rút ra:** RAM nhanh hơn disk hàng nghìn lần; tránh disk seek; nén dữ liệu trước khi gửi qua mạng; round trip liên lục địa rất đắt → cần CDN/multi-region; mỗi network hop trong DC ~0.5ms nên chuỗi 10 service gọi tuần tự đã tốn 5ms chỉ riêng mạng.

**Powers of 2:**

| Lũy thừa | Giá trị xấp xỉ | Tên |
|---|---|---|
| 2^10 | 1 nghìn | 1 KB |
| 2^20 | 1 triệu | 1 MB |
| 2^30 | 1 tỷ | 1 GB |
| 2^40 | 1 nghìn tỷ | 1 TB |
| 2^50 | 10^15 | 1 PB |

Các hằng số tiện dụng: 1 ngày = 86,400s ≈ **10^5 s**; 1 tháng ≈ 2.5 × 10^6 s; 1 năm ≈ 3 × 10^7 s; ký tự ASCII 1 byte, UUID 16 bytes (36 ký tự dạng text), timestamp 8 bytes.

## Availability "số nines" nghĩa là gì? Tính downtime cho phép thế nào? [junior]
Availability = uptime / tổng thời gian. Downtime cho phép:

| Availability | Downtime/năm | Downtime/tháng | Downtime/ngày |
|---|---|---|---|
| 99% | 3.65 ngày | ~7.3 giờ | 14.4 phút |
| 99.9% | **~8.76 giờ** | ~43.8 phút | 1.44 phút |
| 99.95% | ~4.38 giờ | ~21.9 phút | 43 giây |
| 99.99% | ~52.6 phút | ~4.38 phút | 8.6 giây |
| 99.999% | ~5.26 phút | ~26 giây | 0.86 giây |

**Ghép nối thành phần:**
- **Nối tiếp** (request phải đi qua A rồi B): `A_total = A1 × A2`. Ba service 99.9% nối tiếp → 99.9%³ ≈ **99.7%**. Càng nhiều dependency đồng bộ, availability càng giảm.
- **Song song / redundant** (chỉ cần 1 trong N sống): `A_total = 1 − (1 − A)^N`. Hai instance 99% độc lập → 1 − 0.01² = **99.99%**.

**Ý nghĩa thực tế:** 99.99% (52 phút/năm) gần như không thể đạt nếu deploy thủ công hoặc failover cần người can thiệp — phải có automated failover, health check, rolling deploy. Mỗi "nine" thêm vào thường tăng chi phí đáng kể; chọn SLO theo nhu cầu business chứ không phải "càng cao càng tốt".

## Công thức ước lượng QPS, storage, bandwidth, cache size và ví dụ hoàn chỉnh cho mạng xã hội kiểu Twitter? [mid]
**QPS:**
```text
Average QPS = DAU × số request/user/ngày / 86,400
Peak QPS    = Average QPS × (2 ~ 10)   (tùy độ "nhọn" của traffic)
Write QPS và Read QPS tính riêng theo read:write ratio
```

**Storage:**
```text
Storage/ngày = số object mới/ngày × kích thước trung bình
Storage tổng = Storage/ngày × 365 × số năm × replication factor (thường 3)
Cộng thêm index/metadata overhead (~20-30%)
```

**Bandwidth:**
```text
Ingress = write QPS × kích thước request
Egress  = read QPS × kích thước response
```

**Cache (quy tắc 80/20):** 20% dữ liệu nóng phục vụ 80% request → cache ≈ 20% × lượng dữ liệu đọc mỗi ngày.

**Server count (thô):** một server web stateless xử lý ~1,000–10,000 QPS tùy workload; một Postgres instance tốt chịu vài nghìn đến ~10k+ QPS đơn giản; Redis một node ~100k+ ops/s.

**Mẹo khi tính:**
- Làm tròn mạnh tay (86,400 → 100,000), nói rõ đang làm tròn.
- Dùng ký hiệu khoa học, ghi đơn vị.
- Mục tiêu là **ra quyết định**: con số cho biết có cần shard không, cache có vừa RAM không, có cần CDN không.

### Ví dụ hoàn chỉnh: mạng xã hội kiểu Twitter
**Giả định:** 300M MAU, 50% là DAU → 150M DAU. Mỗi user đăng 2 tweet/ngày, xem timeline 10 lần/ngày, mỗi lần 20 tweet. 10% tweet có ảnh (~500KB), 1% có video (~5MB). Lưu trữ 5 năm.

**QPS:**
```text
Write tweet: 150M × 2 / 10^5      ≈ 3,000 QPS   (peak ~6,000-10,000)
Read timeline: 150M × 10 / 10^5   ≈ 15,000 QPS  (peak ~30,000-50,000)
Tweet đọc ra: 15,000 × 20         = 300,000 tweet/s cần hydrate
```

**Storage text:** tweet_id 8B + user_id 8B + text 280 ký tự (~300B UTF-8, có thể hơn với tiếng Việt) + metadata → ~**1KB/tweet** cho dễ tính.
```text
300M tweet/ngày × 1KB       = 300 GB/ngày
5 năm: 300GB × 365 × 5      ≈ 550 TB  (× 3 replica ≈ 1.6 PB)
```

**Media:**
```text
Ảnh: 30M/ngày × 500KB  = 15 TB/ngày
Video: 3M/ngày × 5MB   = 15 TB/ngày
→ ~30 TB/ngày, 5 năm ≈ 55 PB → bắt buộc object storage (S3) + CDN
```

**Egress:** nếu 15,000 timeline/s và 20% tweet có media hiển thị thumbnail ~50KB → hàng chục GB/s → phần lớn phải do CDN phục vụ.

**Cache timeline:** 150M DAU × 800 tweet_id × 8B ≈ 1 TB → Redis cluster vài chục node (chỉ lưu ID, hydrate nội dung từ tweet cache).

**Quyết định rút ra:** text DB phải shard (550TB), media tách sang S3 + CDN, timeline cần precompute vì 300k tweet/s đọc không thể query DB trực tiếp.

# Building Blocks Deep Dive

## DNS và CDN hoạt động thế nào? Push CDN khác Pull CDN ra sao? [junior]
**DNS:** phân giải tên miền → IP theo chuỗi: browser cache → OS cache → recursive resolver (ISP/8.8.8.8) → root server → TLD server (.com) → authoritative server. Kết quả cache theo **TTL**. Trong system design, DNS còn dùng cho:
- **GeoDNS / latency-based routing** (Route 53, Cloudflare): trả IP của region gần user nhất.
- **Failover DNS**: health check, region chết thì trả IP region khác (bị giới hạn bởi TTL và client cache TTL không tôn trọng).
- Weighted routing cho canary/blue-green.

**CDN:** mạng edge server (PoP) gần user, cache static content (ảnh, JS, CSS, video segment), giảm latency và giảm tải origin.

| | Pull CDN | Push CDN |
|---|---|---|
| Cơ chế | Edge chưa có → fetch từ origin khi có request đầu tiên, cache theo TTL | Bạn chủ động upload nội dung lên CDN |
| Ưu | Đơn giản, tự động, chỉ cache thứ được dùng | Kiểm soát hoàn toàn, không có cache miss đầu tiên |
| Nhược | Request đầu chậm (cold), có thể stale tới khi hết TTL | Tốn công quản lý, tốn storage cho nội dung ít xem |
| Phù hợp | Website traffic lớn, nội dung thay đổi | Nội dung lớn, ít thay đổi, biết trước (video phát hành, bản cài đặt) |

**Thực tế:** cache invalidation bằng **versioned URL** (`app.3f9a1c.js`) thay vì purge; dùng signed URL cho nội dung private; origin shield để giảm số request về origin.

## Reverse proxy, Load balancer và API gateway khác nhau thế nào? Health check, sticky session, global LB? [mid]
| | Reverse proxy | Load balancer | API gateway |
|---|---|---|---|
| Vai trò chính | Đứng trước server: TLS termination, nén, cache, ẩn backend | Phân phối traffic tới nhiều instance | Cổng vào cho API: auth, rate limit, routing, transform, quota |
| Ví dụ | Nginx, Envoy | AWS ALB/NLB, HAProxy | Kong, AWS API Gateway, YARP |

Trên thực tế các vai trò chồng lấn (Nginx làm cả ba), điểm khác là **mức độ hiểu nghiệp vụ API**.

**Health check:**
- **Active**: LB gọi `/health` định kỳ (ví dụ mỗi 5s, 3 lần fail liên tiếp → loại khỏi pool).
- **Passive**: theo dõi lỗi trên traffic thật (outlier detection của Envoy).
- Tách **liveness** (process còn sống) và **readiness** (sẵn sàng nhận traffic: DB connect được, warm-up xong). Đừng để readiness phụ thuộc dependency phụ, nếu không một DB chậm sẽ làm toàn bộ fleet bị rút khỏi LB.

**Sticky session (session affinity):** LB gắn client với một instance (cookie/IP hash). Dùng khi server giữ state (WebSocket, session in-memory). Nhược: phân tải lệch, instance chết thì mất session, khó autoscale. Cách tốt hơn: externalize session (Redis/JWT) để service stateless.

**Global load balancing (GSLB):** phân phối giữa các region qua GeoDNS hoặc **Anycast** (cùng IP quảng bá từ nhiều nơi, BGP định tuyến tới PoP gần nhất — Cloudflare, Google Cloud LB). Kết hợp health check theo region để failover.

```text
User → GeoDNS/Anycast → Regional L4 LB → L7 LB / API Gateway → Services
```

## So sánh các thuật toán rate limiting và cách implement distributed bằng Redis? [mid]
| Thuật toán | Cơ chế | Ưu | Nhược |
|---|---|---|---|
| **Token bucket** | Bucket dung lượng B, nạp r token/s; mỗi request lấy 1 token | Cho phép burst tới B, bộ nhớ nhỏ (2 số) | Phải chọn đúng B và r |
| **Leaky bucket** | Request vào queue, xử lý ra với tốc độ cố định | Output đều, bảo vệ downstream | Burst bị trễ/drop, request cũ có thể chặn request mới |
| **Fixed window counter** | Đếm theo cửa sổ cố định (phút 10:00–10:01) | Đơn giản nhất (INCR + EXPIRE) | Burst ở biên: 2× limit trong 2 giây quanh ranh giới |
| **Sliding window log** | Lưu timestamp từng request, đếm trong [now−W, now] | Chính xác tuyệt đối | Tốn bộ nhớ O(số request) |
| **Sliding window counter** | Ước lượng: `count_prev × overlap% + count_curr` | Bộ nhớ nhỏ, gần chính xác (Cloudflare báo sai số rất nhỏ) | Xấp xỉ |

**Fixed window với Redis:**
```text
key = rl:{user}:{epoch_minute}
INCR key → nếu = 1 thì EXPIRE key 60 → nếu > limit thì reject 429
```

**Token bucket bằng Lua (atomic, tránh race giữa GET và SET):**
```lua
-- KEYS[1]=bucket key, ARGV: capacity, refill_rate/s, now_ms, cost
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local cap, rate, now, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4])
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)
local allowed = tokens >= cost
if allowed then tokens = tokens - cost end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000))
return allowed and 1 or 0
```

**Sliding window log:** `ZADD key now now` → `ZREMRANGEBYSCORE key 0 now-W` → `ZCARD key` (gói trong Lua/MULTI).

**Lưu ý distributed:** dùng script Lua để atomic; nên dùng thời gian của Redis (`TIME`) hoặc chấp nhận clock skew nhỏ; Redis Cluster cần key của một user nằm cùng slot (hash tag `{user}`); khi Redis chết chọn **fail-open** (cho qua) hay **fail-closed** tùy rủi ro.

## Consistent hashing là gì? Vì sao cần virtual nodes? [mid]
**Vấn đề:** `server = hash(key) % N`. Khi N đổi (thêm/bớt node), gần như **mọi key bị remap** → cache miss hàng loạt, phải di chuyển gần hết dữ liệu.

**Consistent hashing:** đặt cả node và key lên một **vòng hash** (ví dụ 0 → 2^32−1). Key thuộc node đầu tiên gặp được khi đi theo chiều kim đồng hồ.

```text
            0
       N1 ●───── k1
     /           \
  k3               ● N2
    \             /
     ● N3 ─── k2
Thêm N4 giữa N3 và N1 → chỉ các key trong đoạn đó chuyển từ N1 sang N4
```

Thêm/bớt một node chỉ ảnh hưởng **~K/N key** (K = tổng số key).

**Vấn đề của bản cơ bản:**
- Phân bố không đều: vài node ngẫu nhiên trên vòng → đoạn dài ngắn khác nhau.
- Node chết dồn toàn bộ tải sang **một** node kế tiếp.

**Virtual nodes:** mỗi node vật lý được ánh xạ thành 100–200 điểm trên vòng (`hash("N1#0")`, `hash("N1#1")`...). Kết quả:
- Phân bố đều hơn (độ lệch giảm khi số vnode tăng).
- Node chết → tải chia đều cho nhiều node còn lại.
- Node mạnh có thể có nhiều vnode hơn (weighted).

**Ứng dụng:** DynamoDB, Cassandra (token ring + vnodes), Riak, client-side sharding của Memcached (ketama), Discord, load balancer có affinity (Maglev của Google là một biến thể). Lưu ý Redis Cluster **không** dùng vòng hash mà dùng 16,384 hash slot cố định — cũng là một cách giải quyết bài toán remap.

## Các cách sinh unique ID trong hệ thống phân tán: UUID, Snowflake, ticket server, ULID? [mid]
| Cách | Cấu trúc | Ưu | Nhược |
|---|---|---|---|
| **Auto-increment DB** | 1 sequence | Đơn giản, ngắn, có thứ tự | SPOF, nút thắt khi scale, lộ số lượng |
| **Ticket server** (Flickr) | 2 DB: một sinh số lẻ, một sinh số chẵn (`auto_increment_increment=2`) | Số 64-bit có thứ tự gần đúng | Vẫn phụ thuộc DB, cần HA |
| **Range allocation** | Service cấp dải 1000 ID cho mỗi app server | Gần như không gọi DB | Mất dải khi crash, thứ tự không toàn cục |
| **UUID v4** | 122 bit ngẫu nhiên | Sinh tại client, không cần phối hợp | 128-bit, không có thứ tự → B-tree index phân mảnh, insert chậm |
| **UUID v7** | 48-bit Unix ms + random | Có thứ tự theo thời gian, chuẩn RFC 9562 | Vẫn 128-bit |
| **ULID** | 48-bit timestamp ms + 80-bit random, 26 ký tự Crockford base32 | Sắp xếp theo chuỗi được, URL-safe | 128-bit |
| **Snowflake** (Twitter) | 64-bit | Có thứ tự, gọn, không cần phối hợp | Phụ thuộc đồng hồ, cần cấp worker id |

**Snowflake layout:**
```text
| 1 bit sign | 41 bit timestamp (ms từ custom epoch) | 5 bit datacenter | 5 bit worker | 12 bit sequence |
41 bit ms ≈ 69 năm; 12 bit → 4,096 ID/ms/worker; 1,024 worker
```

**Vấn đề cần nói khi phỏng vấn:**
- **Clock goes backwards** (NTP chỉnh): từ chối sinh hoặc chờ tới khi đồng hồ vượt timestamp cuối.
- Cấp worker id: ZooKeeper/etcd, hoặc từ config/pod ordinal.
- ID có thứ tự thời gian rất có lợi cho index và cho pagination (`WHERE id < cursor`).
- Không dùng ID tuần tự lộ ra ngoài nếu sợ bị enumerate → dùng thêm public ID ngẫu nhiên.

## Bloom filter là gì? Dùng trong system design ở đâu? [mid]
**Bloom filter** là cấu trúc dữ liệu xác suất kiểm tra "phần tử **có thể** thuộc tập hợp" với bộ nhớ rất nhỏ.

- Mảng m bit, k hàm hash. **Add**: bật k bit. **Check**: nếu có bit nào = 0 → **chắc chắn không có**; nếu tất cả = 1 → **có thể có**.
- **Không có false negative, có false positive**. Không xóa được (cần Counting Bloom filter hoặc Cuckoo filter).
- Công thức: `m = −n·ln(p) / (ln 2)²`, `k = (m/n)·ln 2`. Với p = 1% cần ~**9.6 bit/phần tử**, k ≈ 7. 1 tỷ phần tử ≈ 1.2 GB — nhỏ hơn rất nhiều so với lưu chính phần tử.

```text
add("abc"): h1=2, h2=5, h3=9  → bit[2,5,9] = 1
check("xyz"): h1=2, h2=4, h3=9 → bit[4] = 0 → chắc chắn không có
```

**Ứng dụng:**
- **Chống cache penetration**: request key không tồn tại → bloom filter nói "không có" → trả về ngay, không đụng DB.
- **LSM-tree** (Cassandra, RocksDB, HBase): mỗi SSTable có bloom filter để bỏ qua file chắc chắn không chứa key → giảm disk read.
- **Web crawler**: kiểm tra URL đã crawl chưa với hàng tỷ URL.
- Kiểm tra username đã tồn tại, gợi ý bài viết chưa xem (Medium), lọc URL độc hại (Chrome Safe Browsing từng dùng).
- Redis có module **RedisBloom** (`BF.ADD`, `BF.EXISTS`).

Khi false positive xảy ra, hệ thống chỉ cần fallback sang kiểm tra thật (DB) — chi phí chấp nhận được.

## Heartbeat, gossip protocol, leader election và quorum (N/R/W) hoạt động thế nào? [senior]
**Heartbeat:** node gửi tín hiệu "tôi còn sống" định kỳ; quá timeout thì coi là chết. Khó khăn: không phân biệt được node chết và mạng chậm → dùng **phi accrual failure detector** (Cassandra, Akka) cho ra mức nghi ngờ thay vì nhị phân.

**Gossip protocol:** mỗi chu kỳ (ví dụ 1s) node chọn ngẫu nhiên vài node khác và trao đổi bảng membership/heartbeat counter. Thông tin lan khắp cluster trong O(log N) vòng, không cần node trung tâm. Dùng trong Cassandra, DynamoDB, Consul (SWIM/Serf), Redis Cluster bus.

**Leader election:** chọn một node duy nhất làm coordinator (ghi, phân công việc, chạy cron). Cách làm:
- Thuật toán đồng thuận **Raft/Paxos/ZAB** (etcd, ZooKeeper, Consul) — leader cần đa số phiếu, có **term/epoch** tăng dần.
- Dùng lease trong etcd/ZooKeeper (ephemeral node) hoặc Kubernetes Lease.
- Rủi ro: **split brain** — hai node cùng nghĩ mình là leader → cần quorum (đa số) và fencing token.

**Quorum (Dynamo-style):** N = số replica, W = số replica phải ack khi ghi, R = số replica phải trả lời khi đọc.
```text
W + R > N  → tập đọc và tập ghi giao nhau → đọc thấy bản ghi mới nhất (trong điều kiện bình thường)
N=3, W=2, R=2: cân bằng, chịu được 1 node chết
N=3, W=1, R=3: ghi nhanh, đọc chậm
N=3, W=3, R=1: đọc nhanh, ghi kém available
```
Bổ sung: **sloppy quorum + hinted handoff** (ghi tạm vào node khác khi replica chết), **read repair** và **anti-entropy với Merkle tree** để đồng bộ replica. Lưu ý W+R>N vẫn không đảm bảo linearizability tuyệt đối khi có ghi đồng thời và sloppy quorum.

## Distributed lock bằng Redis có vấn đề gì? Redlock và fencing token? [senior]
**Lock đơn giản trên một Redis:**
```text
SET lock:order:42 <random_token> NX PX 30000   -- lấy lock, tự hết hạn 30s
-- unlock bằng Lua: chỉ xóa nếu value = token của mình
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
```
Phải có **TTL** (tránh deadlock khi client chết) và **token ngẫu nhiên** (tránh xóa nhầm lock của người khác).

**Vấn đề:** Redis master chết trước khi replicate key lock → replica được promote không có lock → hai client cùng giữ lock.

**Redlock:** lấy lock trên ≥ N/2+1 trong N (thường 5) Redis master độc lập, tổng thời gian lấy phải nhỏ hơn TTL.

**Phê bình của Martin Kleppmann (2016):**
- **Process pause** (GC stop-the-world, swap): client A lấy lock, bị pause 40s, lock hết hạn, client B lấy lock, A tỉnh dậy và vẫn ghi → hỏng dữ liệu. Không thuật toán lock nào dựa trên TTL tránh được điều này.
- Redlock dựa vào giả định **đồng hồ** các node chạy gần đúng; clock jump làm lock hết hạn sớm.

**Fencing token:** lock service trả về số tăng dần mỗi lần cấp lock. Storage chỉ chấp nhận ghi có token ≥ token lớn nhất đã thấy.
```text
A lấy lock, token=33 → pause
B lấy lock, token=34 → ghi (storage lưu max=34)
A tỉnh dậy ghi với token=33 → storage từ chối
```
Redis không sinh fencing token an toàn; ZooKeeper (zxid/version) và etcd (revision) thì có.

**Khuyến nghị:**
- Lock cho **hiệu năng** (tránh làm việc trùng, chấp nhận hiếm khi trùng) → Redis single instance là đủ.
- Lock cho **correctness** → etcd/ZooKeeper + fencing token, hoặc tốt hơn: dùng ràng buộc của DB (unique constraint, optimistic locking `version`, `SELECT ... FOR UPDATE`).

# Data Layer Design

## Chọn SQL hay NoSQL theo từng use case cụ thể như thế nào? [mid]
Đừng trả lời "NoSQL scale tốt hơn". Hãy chọn theo **access pattern, consistency và hình dạng dữ liệu**:

| Use case | Lựa chọn hợp lý | Lý do |
|---|---|---|
| Đơn hàng, thanh toán, tồn kho, HRM/payroll | **PostgreSQL/MySQL/SQL Server** | ACID, transaction nhiều bảng, ràng buộc, report SQL |
| Session, cache, rate limit, leaderboard | **Redis** | In-memory, cấu trúc dữ liệu giàu (sorted set, hash), TTL |
| Tin nhắn chat, activity log, IoT write-heavy | **Cassandra/ScyllaDB/DynamoDB** | Ghi cực nhanh (LSM), scale ngang tuyến tính, query theo partition key |
| Catalog sản phẩm thuộc tính đa dạng, CMS | **MongoDB** (hoặc Postgres JSONB) | Schema linh hoạt, document lồng nhau |
| Full-text search, filter/facet | **Elasticsearch/OpenSearch** | Inverted index, relevance scoring |
| Social graph, recommendation, fraud | **Neo4j** (hoặc adjacency list trong SQL) | Traverse quan hệ nhiều bậc |
| Metrics, giá cổ phiếu, sensor | **TimescaleDB/InfluxDB/Prometheus** | Nén theo thời gian, downsampling, retention |
| Ảnh, video, file, backup | **S3/Blob Storage** | Rẻ, bền (11 nines durability của S3), không giới hạn |
| Analytics OLAP | **ClickHouse/BigQuery/Snowflake** | Columnar, aggregate tỷ dòng |

**Câu hỏi quyết định:**
1. Cần transaction trên nhiều entity không? → SQL.
2. Query có biết trước và luôn theo một key không? → Key-value/wide-column.
3. Write throughput > ~50k/s và dữ liệu hàng chục TB? → cân nhắc NoSQL phân tán (hoặc SQL đã shard như Vitess, Citus, CockroachDB).
4. Team quen gì? Chi phí vận hành?

**Polyglot persistence** là bình thường: Postgres làm source of truth, sync sang Elasticsearch để search, Redis để cache. Mặc định hợp lý cho hầu hết hệ thống mới: **bắt đầu bằng Postgres** cho tới khi có con số chứng minh cần thứ khác.

## So sánh các topology replication (single-leader, multi-leader, leaderless)? Replication lag gây ra vấn đề gì với read replicas? [mid]
| | Single-leader (leader-follower) | Multi-leader | Leaderless |
|---|---|---|---|
| Ghi | Chỉ leader nhận ghi | Nhiều leader (thường mỗi region một) | Bất kỳ replica nào (quorum) |
| Ví dụ | Postgres, MySQL, SQL Server AG, MongoDB replica set | MySQL Group Replication multi-primary, CouchDB, Active-active geo | Cassandra, DynamoDB, Riak |
| Ưu | Đơn giản, không có conflict ghi | Ghi latency thấp ở mọi region, chịu region chết | Availability cao, không có failover |
| Nhược | Leader là nút thắt ghi, failover phức tạp | **Conflict ghi** phải giải quyết | Consistency yếu hơn, read repair, khó transaction |

**Đồng bộ vs bất đồng bộ:**
- **Synchronous**: leader chờ follower ack → không mất dữ liệu nhưng follower chậm làm chậm ghi.
- **Asynchronous**: nhanh nhưng leader chết có thể mất các ghi chưa replicate.
- **Semi-synchronous**: chờ ít nhất 1 follower ack (MySQL semi-sync, Postgres `synchronous_standby_names`) — thỏa hiệp phổ biến.

**Giải quyết conflict (multi-leader/leaderless):**
- **Last-write-wins** theo timestamp — đơn giản nhưng mất dữ liệu âm thầm, phụ thuộc đồng hồ.
- **Version vector** để phát hiện ghi đồng thời, trả cả hai version cho ứng dụng merge.
- **CRDT** (counter, set, text) — merge tự động, hội tụ (Riak, Redis Enterprise active-active, Figma/Google Docs dùng ý tưởng tương tự).
- Tránh conflict bằng thiết kế: mỗi user "thuộc về" một home region.

**Failover pitfalls (single-leader):** split brain, follower được promote thiếu dữ liệu (mất ghi), auto-increment bị trùng với dữ liệu leader cũ — GitHub từng gặp sự cố kiểu này năm 2012.

### Replication lag và read replicas
Read replica giúp scale đọc, nhưng replication bất đồng bộ tạo ra **lag** (ms đến vài phút khi tải nặng) → các anomaly:

1. **Read-your-writes vi phạm**: user cập nhật hồ sơ, refresh trang (đọc từ replica) → thấy dữ liệu cũ, tưởng lỗi.
2. **Monotonic reads vi phạm**: hai lần đọc rơi vào hai replica có lag khác nhau → dữ liệu "đi lùi thời gian".
3. **Consistent prefix vi phạm**: thấy câu trả lời trước câu hỏi (ở hệ phân tán nhiều partition).

**Giải pháp:**
- **Đọc từ leader sau khi ghi**: trong khoảng N giây sau khi user ghi (lưu `last_write_at` trong session/cookie), route đọc của user đó về leader.
- **Đọc dữ liệu "của mình" từ leader**: trang profile của chính user đọc leader, profile người khác đọc replica.
- **LSN/GTID tracking**: sau khi ghi, client giữ vị trí log (Postgres LSN, MySQL GTID); khi đọc replica, chỉ dùng replica đã replay tới vị trí đó (hoặc chờ `WAIT_FOR_EXECUTED_GTID_SET`).
- **Sticky replica**: một user luôn đọc cùng một replica (hash user_id) → đảm bảo monotonic reads.
- Optimistic UI: client hiển thị dữ liệu vừa ghi ngay mà không chờ đọc lại.
- **Monitor lag** (`pg_stat_replication`, `Seconds_Behind_Source`) và tự loại replica lag quá ngưỡng khỏi pool đọc.

Lưu ý những luồng cần dữ liệu chính xác (kiểm tra số dư, tồn kho trước khi trừ) **luôn** đọc từ leader trong transaction.

## Cache stampede, penetration, avalanche, hot key là gì? Chiến lược cache invalidation giữ cache nhất quán với DB? [senior]
| Vấn đề | Hiện tượng | Giải pháp |
|---|---|---|
| **Cache stampede / thundering herd** (breakdown) | Một key **nóng** hết hạn → hàng nghìn request cùng miss, cùng query DB | Mutex/single-flight, refresh sớm, stale-while-revalidate |
| **Cache penetration** | Request key **không tồn tại** (cả cache lẫn DB) → luôn xuống DB; thường do tấn công | Cache giá trị rỗng (TTL ngắn), Bloom filter, validate input |
| **Cache avalanche** | **Nhiều key** hết hạn cùng lúc hoặc Redis sập → DB bị dội | TTL + jitter ngẫu nhiên, cache nhiều tầng, HA Redis, circuit breaker/rate limit về DB |
| **Hot key** | Một key nhận lượng request vượt khả năng 1 shard (ví dụ trận chung kết, sản phẩm flash sale) | Local cache (in-process) TTL ngắn, nhân bản key (`key#1..key#N`), read từ replica |

**Single-flight với Redis lock:**
```text
v = GET product:42
if v is null:
    if SET lock:product:42 1 NX PX 3000:
        v = DB.query(); SET product:42 v EX 300 + rand(0,60); DEL lock
    else:
        sleep 50ms; retry GET (hoặc trả stale value)
```

**Probabilistic early expiration (XFetch):** request đọc key gần hết hạn sẽ tự refresh với xác suất tăng dần khi thời gian còn lại giảm → tránh mọi request cùng miss một lúc.

**Hot key:**
- Phát hiện: Redis `--hotkeys` (với LFU policy), monitor ở client/proxy.
- Nhân bản: ghi `item:42#0..#9`, đọc random một bản → tải chia 10 shard.
- **Local cache** (Caffeine, MemoryCache) 1–5s ở app server: giảm 99% request tới Redis; chấp nhận stale vài giây.

**Big key** (một hash/list hàng triệu phần tử) cũng nguy hiểm: thao tác O(N) chặn Redis single-threaded → chia nhỏ key.

### Cache invalidation và nhất quán với DB
"There are only two hard things in Computer Science: cache invalidation and naming things." Các chiến lược:

1. **TTL thuần**: chấp nhận stale tối đa TTL. Đơn giản, phù hợp dữ liệu ít quan trọng.
2. **Cache-aside + delete on write**: ghi DB rồi **xóa** key (không set lại). Xóa tốt hơn update vì tránh race hai writer set giá trị theo thứ tự sai.
3. **Race kinh điển** của cache-aside:
```text
T1: đọc miss → đọc DB (giá trị cũ v1)
T2: ghi DB v2 → DEL cache
T1: SET cache = v1   ← cache chứa giá trị cũ tới hết TTL
```
   Giảm thiểu: **delayed double delete** (DEL, ghi DB, sleep vài trăm ms, DEL lần nữa), TTL làm lưới an toàn, hoặc set có version (`SET` chỉ khi version mới hơn, dùng Lua).
4. **CDC-driven invalidation**: Debezium đọc binlog/WAL → publish event → consumer xóa/cập nhật cache. Ưu: không phụ thuộc mọi code path ghi đều nhớ xóa cache, có retry. Facebook dùng cách tương tự (McSqueal đọc MySQL log để invalidate memcache).
5. **Write-through với version**: cache lưu `{value, version}`; chỉ chấp nhận ghi version lớn hơn.
6. **Event/pub-sub invalidation cho local cache**: Redis pub/sub hoặc Redis client-side caching (tracking) để báo các instance xóa local cache.

**Nguyên tắc:**
- Xác định dữ liệu nào **được phép stale** và bao lâu — đây là câu hỏi business.
- Không bao giờ dùng cache làm source of truth cho dữ liệu quan trọng (số dư).
- Mọi key đều nên có TTL, kể cả khi có invalidation chủ động.
- Thất bại khi xóa cache (Redis timeout) → retry qua queue, nếu không cache sẽ stale vĩnh viễn.

## Elasticsearch hoạt động thế nào (inverted index)? Đồng bộ dữ liệu từ DB sang ES ra sao? [mid]
**Inverted index:** thay vì `document → các từ`, lưu `từ → danh sách document chứa từ đó` (posting list kèm vị trí, tần suất).

```text
Doc1: "áo khoác nam"     Doc2: "áo sơ mi nam"     Doc3: "giày nam"
Analyzer: lowercase, tokenize, (bỏ dấu với asciifolding)
ao     → [1, 2]
khoac  → [1]
nam    → [1, 2, 3]
so, mi → [2]
giay   → [3]
Query "ao nam" → giao/hợp posting list → rank bằng BM25
```

**Kiến trúc:** index chia thành **primary shard** (cố định khi tạo index) + replica shard; mỗi shard là một Lucene index gồm các **segment** bất biến. Ghi vào buffer → `refresh` (mặc định 1s) tạo segment mới → mới search được → **near real-time**, không phải real-time. Segment được merge định kỳ.

**Lưu ý thiết kế:**
- Không dùng ES làm source of truth (không có transaction, có thể mất dữ liệu khi sự cố hiếm) — DB là chính, ES là bản sao để tìm kiếm.
- Chọn số shard hợp lý (khuyến nghị mỗi shard ~10–50GB); quá nhiều shard nhỏ làm tốn heap.
- Deep pagination (`from + size` lớn) đắt → dùng `search_after`.
- Tiếng Việt: dùng analyzer phù hợp (ICU, asciifolding, plugin tách từ tiếng Việt).

**Đồng bộ DB → ES:**
| Cách | Nhược |
|---|---|
| Dual write trong code (ghi DB rồi ghi ES) | Không atomic, lệch dữ liệu khi một bên lỗi |
| Outbox + worker | Tin cậy, cần thêm bảng outbox |
| **CDC (Debezium → Kafka → ES sink)** | Tin cậy, không đụng code app; cần hạ tầng Kafka |
| Batch reindex định kỳ | Trễ, nhưng tốt để sửa drift |

Thường dùng **zero-downtime reindex** qua alias: tạo index mới, reindex, chuyển alias.

## Khi nào dùng object storage và time-series database? Thiết kế upload file lớn thế nào? [mid]
**Object storage (S3, Azure Blob, GCS, MinIO):**
- Lưu object bất biến theo key phẳng (`tenant/2026/10/file.pdf`), metadata đi kèm; truy cập qua HTTP.
- Độ bền rất cao (S3 thiết kế 99.999999999%), rẻ, không giới hạn dung lượng, có storage class (Standard → Infrequent Access → Glacier) và **lifecycle policy**.
- Không phù hợp cập nhật một phần file hay query nội dung.
- DB chỉ lưu **metadata + object key**, không lưu blob trong DB.

**Upload trực tiếp bằng presigned URL** (giảm tải app server):
```text
Client → API: xin upload (tên, size, type)
API → kiểm tra quyền, sinh presigned PUT URL (hết hạn 15')
Client → S3: PUT file trực tiếp (multipart nếu > 100MB, mỗi part 5MB–5GB, upload song song, resume được)
S3 → event (S3 Event/EventBridge) → worker: quét virus, tạo thumbnail, cập nhật metadata status=READY
```
Download private file: presigned GET URL hoặc CDN signed URL/cookie.

**Time-series database (InfluxDB, TimescaleDB, Prometheus, QuestDB):**
- Dữ liệu dạng `(metric, tags, timestamp, value)`, ghi append-only liên tục, đọc theo khoảng thời gian, hầu như không update.
- Tối ưu: nén theo cột (delta-of-delta cho timestamp, Gorilla/XOR cho float — Facebook Gorilla nén còn ~1.37 byte/điểm), partition theo thời gian (chunk/hypertable), **retention** (xóa cả partition cũ rẻ hơn DELETE từng dòng), **downsampling** (giữ dữ liệu 1s trong 7 ngày, rollup 1 phút trong 1 năm), continuous aggregates.
- Cẩn thận **high cardinality**: tag như `user_id` làm bùng nổ số series.
- Use case: monitoring, IoT, giá chứng khoán theo tick, metrics business.

## Thiết kế data model cho scale: denormalization, fan-out và hot partition? [senior]
Ở quy mô lớn, data model được thiết kế **theo query**, không theo entity.

**Denormalization:**
- Nhân bản dữ liệu để tránh join: lưu `author_name` trong bảng post, lưu `comment_count` trong post thay vì `COUNT(*)`.
- Trade-off: đọc nhanh, nhưng ghi phải cập nhật nhiều nơi (đổi tên tác giả → cập nhật triệu post, thường làm async), nguy cơ lệch dữ liệu.
- Với Cassandra/DynamoDB: **một bảng cho mỗi query** (`messages_by_conversation`, `messages_by_user`).

**Fan-out:**
- **Fan-out on write**: khi có event, ghi sẵn vào "hộp thư" của từng người nhận (feed, inbox) → đọc O(1), ghi O(số follower).
- **Fan-out on read**: lưu một lần, khi đọc thì gom từ nhiều nguồn → ghi rẻ, đọc đắt.

**Hot partition** — partition key kém làm một partition nhận phần lớn traffic:
| Partition key tệ | Vấn đề | Cách sửa |
|---|---|---|
| `date` cho event log | Mọi ghi hôm nay vào 1 partition | `(date, bucket = hash(id) % 16)` |
| `celebrity_user_id` | Một user cực nóng | Tách xử lý riêng, cache, salting |
| `tenant_id` khi có tenant khổng lồ | Một tenant chiếm 1 shard | Shard theo `(tenant_id, sub_key)`, tenant lớn có shard riêng |
| ID tăng dần trong hệ range-based (HBase, Bigtable) | Ghi luôn vào region cuối | Hash prefix, reverse key |

**Wide partition** (Cassandra): partition chat với hàng trăm triệu message vượt khuyến nghị (~100MB/partition) → thêm bucket thời gian vào key: `PRIMARY KEY ((conversation_id, month), message_id)`.

```sql
-- Cassandra: tin nhắn theo hội thoại, chia bucket theo tháng, sắp xếp mới nhất trước
CREATE TABLE messages (
  conversation_id uuid,
  bucket text,          -- '2026-10'
  message_id timeuuid,
  sender_id uuid,
  body text,
  PRIMARY KEY ((conversation_id, bucket), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
```

# Async & Event-driven

## Message queue được dùng theo những pattern nào? Event-driven khác request-driven thế nào? [mid]
1. **Async processing / work queue**: request chỉ ghi job vào queue và trả `202 Accepted`; worker xử lý nặng (gửi email, render PDF, transcode). Giảm latency phản hồi.
2. **Load leveling (buffering)**: traffic spike 10k/s được queue hấp thụ, consumer xử lý đều 2k/s → DB không sập.
3. **Decoupling**: producer không cần biết consumer là ai, consumer chết không làm producer lỗi.
4. **Pub/Sub fan-out**: một event `OrderPlaced` → nhiều subscriber (email, inventory, analytics) xử lý độc lập.
5. **Competing consumers**: nhiều worker cùng consume một queue để scale ngang.
6. **Priority queue**: tách queue `high`/`low` (OTP vs newsletter).
7. **Delayed/scheduled message**: nhắc lịch, hết hạn giữ chỗ (RabbitMQ delayed exchange, SQS delay, Kafka cần tự làm).
8. **Event log / replay** (Kafka): lưu event lâu dài, consumer mới đọc lại từ đầu, rebuild read model.
9. **Request-reply async**: correlation id + reply queue.

```text
API ──enqueue──▶ [ Queue ] ──▶ Worker 1
  │ 202 + jobId              ├─▶ Worker 2
  ▼                          └─▶ Worker N ──▶ cập nhật job status
Client poll /jobs/{id} hoặc nhận webhook/WebSocket khi xong
```

**Cái giá phải trả:** eventual consistency, debug khó hơn (cần tracing qua queue), phải xử lý message trùng (idempotency), ordering, poison message và giám sát **consumer lag**.

## Back-pressure là gì? Làm sao để hệ thống không bị quá tải khi producer nhanh hơn consumer? [mid]
**Back-pressure** là cơ chế để phía chậm (consumer) **báo ngược** cho phía nhanh (producer) giảm tốc, thay vì để buffer tăng vô hạn rồi hết bộ nhớ hoặc latency tăng vọt.

**Các chiến lược khi quá tải** (chọn 1 hoặc kết hợp):
| Chiến lược | Mô tả | Ví dụ |
|---|---|---|
| **Block / slow down** | Producer bị chặn khi buffer đầy | Bounded channel, TCP flow control, `BlockingQueue.put` |
| **Buffer có giới hạn** | Queue có max length | RabbitMQ `x-max-length`, Kafka retention |
| **Drop** | Bỏ message mới/cũ | Metrics, telemetry, video frame |
| **Reject / load shed** | Trả lỗi 429/503 cho client | API gateway |
| **Scale consumer** | Tăng số consumer theo lag | KEDA autoscale theo queue length |
| **Pull-based consumption** | Consumer tự kéo theo khả năng | Kafka poll, Reactive Streams `request(n)` |

**Ví dụ thực tế:**
- **Kafka** là pull-based nên tự nhiên có back-pressure: consumer chậm chỉ làm **lag** tăng, broker không bị đè. Giám sát lag và autoscale (tối đa = số partition).
- **RabbitMQ**: `prefetch_count` (QoS) giới hạn số message chưa ack mỗi consumer; khi memory/disk alarm, broker chặn publisher.
- **.NET**: `System.Threading.Channels.Channel.CreateBounded(capacity)` với `BoundedChannelFullMode.Wait/DropOldest`.
- **gRPC/HTTP2** có flow control window.

**Nguyên tắc:** mọi queue/buffer trong hệ thống phải **có giới hạn**; queue không giới hạn chỉ là cách trì hoãn sự cố và biến lỗi quá tải thành lỗi hết RAM.

## Thiết kế retry với exponential backoff + jitter và dead letter queue thế nào? [mid]
**Phân loại lỗi trước khi retry:**
- **Transient** (timeout, 503, 429, deadlock, mất kết nối) → retry.
- **Permanent** (400 validation, 404, lỗi parse) → **không retry**, đưa thẳng vào DLQ.

**Exponential backoff + jitter:**
```text
delay = min(cap, base × 2^attempt)
Full jitter (AWS khuyến nghị): sleep = random(0, delay)
attempt: 0 → 0-100ms, 1 → 0-200ms, 2 → 0-400ms ... cap 30s, tối đa 5-8 lần
```
Không có jitter, hàng nghìn client lỗi cùng lúc sẽ retry **cùng lúc** → retry storm, đánh sập service vừa hồi phục. Tôn trọng header `Retry-After` nếu có.

**Retry budget:** giới hạn tỉ lệ retry (ví dụ retry ≤ 10% tổng request) và chỉ retry ở **một tầng** — nếu 3 tầng mỗi tầng retry 3 lần, một lỗi ở đáy có thể nhân thành 27 request.

**Dead letter queue (DLQ):** message thất bại sau N lần (hoặc lỗi permanent) được chuyển sang DLQ thay vì block queue chính hay bị mất.
```text
main-queue ──fail──▶ retry-queue-10s ──▶ retry-queue-1m ──▶ retry-queue-10m ──▶ DLQ
                    (TTL + dead-letter-exchange quay lại main)
```
- RabbitMQ: `x-dead-letter-exchange` + TTL để làm delayed retry; SQS: `maxReceiveCount` + redrive policy; Kafka: tự tạo topic `orders.retry.1m`, `orders.dlq` (không block partition).
- Message trong DLQ kèm metadata: lỗi, stack trace, số lần thử, timestamp.
- Phải có **alert** khi DLQ có message và tooling để xem, sửa, **redrive** về queue chính.

**Điều kiện tiên quyết:** consumer phải **idempotent**, vì retry đồng nghĩa với xử lý lại.

### Event-driven vs request-driven
| | Request-driven (sync, command) | Event-driven (async) |
|---|---|---|
| Giao tiếp | A gọi B và chờ kết quả (REST/gRPC) | A phát event "điều đã xảy ra", ai quan tâm thì nghe |
| Coupling | A biết B, phụ thuộc B sống | A không biết consumer |
| Consistency | Dễ có kết quả ngay, strong | Eventual |
| Availability | Chuỗi gọi: availability nhân nhau | B chết, event chờ trong broker |
| Latency từ góc user | Tổng latency chuỗi gọi | Phản hồi nhanh, xử lý sau |
| Debug | Dễ theo stack trace | Khó, cần distributed tracing, correlation id |
| Thêm tính năng | Phải sửa A để gọi thêm C | Thêm consumer mới, không đụng A |

**Chọn request-driven khi:**
- User cần kết quả ngay để đi tiếp (đăng nhập, kiểm tra giá, validate).
- Query dữ liệu (đọc).
- Luồng đơn giản, ít service.

**Chọn event-driven khi:**
- Side effect không cần cho phản hồi (gửi email, cập nhật search index, analytics).
- Nhiều hệ thống cần phản ứng với cùng một sự kiện.
- Cần hấp thụ spike, chịu lỗi tạm thời của downstream.
- Cần audit/replay lịch sử.

**Ba kiểu event (Martin Fowler):**
- **Event notification**: event mỏng (`OrderPlaced{orderId}`), consumer gọi lại để lấy chi tiết.
- **Event-carried state transfer**: event chứa đủ dữ liệu, consumer giữ bản sao cục bộ → không cần gọi lại.
- **Event sourcing**: event là source of truth.

Thực tế dùng **hybrid**: command đồng bộ cho phần lõi giao dịch, event bất đồng bộ cho mọi thứ còn lại.

## CDC (Change Data Capture) với Debezium là gì? Dùng để giải quyết bài toán gì? [senior]
**CDC** bắt mọi thay đổi (INSERT/UPDATE/DELETE) trong DB và phát thành stream event. **Log-based CDC** đọc trực tiếp transaction log thay vì polling bảng:
- PostgreSQL: WAL qua **logical replication slot** (`pgoutput`).
- MySQL: **binlog** (`binlog_format=ROW`).
- SQL Server: bảng CDC/CT, MongoDB: change streams/oplog.

**Debezium** là bộ connector chạy trên Kafka Connect (hoặc Debezium Server, embedded) — đọc log, tạo event có `before`, `after`, `op`, `source` (LSN, txId) và publish lên Kafka topic theo bảng.

```text
App ──write──▶ PostgreSQL ──WAL──▶ Debezium (Kafka Connect) ──▶ Kafka topic db.public.orders
                                                                 ├─▶ ES sink (search)
                                                                 ├─▶ Cache invalidator
                                                                 ├─▶ Data warehouse
                                                                 └─▶ Service khác
```

**Use case:**
- **Outbox pattern không cần poller**: Debezium Outbox Event Router đọc bảng outbox.
- Đồng bộ sang Elasticsearch, cache invalidation, data lake (thay ETL batch bằng streaming).
- **Migration** từ monolith sang microservice (strangler fig): stream dữ liệu bảng cũ sang DB mới.
- Audit log.

**Ưu:** không sửa code ứng dụng, không bỏ sót thay đổi (kể cả ghi từ script/tool khác), độ trễ thấp (ms–giây), thứ tự theo commit, tải lên DB thấp hơn polling.

**Lưu ý vận hành:**
- Replication slot của Postgres giữ WAL tới khi được đọc → Debezium chết lâu thì **disk đầy**. Phải monitor.
- Thay đổi schema (schema evolution) — dùng Schema Registry (Avro/Protobuf).
- Event phản ánh **cấu trúc bảng** (lộ chi tiết nội bộ) → với integration giữa team, nên dùng outbox để phát event có hợp đồng rõ ràng.
- Initial snapshot cho bảng lớn mất thời gian; at-least-once nên consumer phải idempotent.

## Stream processing cơ bản: windowing, stateful processing, event time vs processing time? [senior]
**Stream processing** xử lý dữ liệu liên tục khi nó tới (thay vì batch theo giờ/ngày). Công cụ: **Kafka Streams**, **Apache Flink**, Spark Structured Streaming, ksqlDB, AWS Kinesis Data Analytics.

**Khái niệm cốt lõi:**
- **Stateless**: filter, map, enrich từng event.
- **Stateful**: aggregate, join, dedupe — cần lưu state (RocksDB local + changelog/checkpoint để khôi phục).
- **Event time vs processing time**: event time = thời điểm sự kiện xảy ra (ghi trong event); processing time = lúc hệ thống xử lý. Mobile offline có thể gửi event trễ hàng giờ → phải aggregate theo event time.
- **Watermark**: ước lượng "đã nhận hết event tới thời điểm T" → cho phép đóng window; event tới sau watermark là **late event** (bỏ, hoặc cập nhật kết quả trong `allowed lateness`).

**Windowing:**
| Window | Mô tả | Ví dụ |
|---|---|---|
| Tumbling | Cố định, không chồng lấn | Doanh thu mỗi 1 phút |
| Hopping/Sliding | Cố định, chồng lấn (size 5', bước 1') | Trung bình động 5 phút |
| Session | Theo khoảng không hoạt động | Phiên xem của user (đóng sau 30' idle) |

**Exactly-once:** Flink checkpoint (Chandy–Lamport) + sink transactional; Kafka Streams `processing.guarantee=exactly_once_v2` (transaction đọc-xử lý-ghi trong Kafka). Ra ngoài Kafka (DB, API) vẫn cần idempotent sink.

**Use case trong system design:** đếm view/like realtime, top-K trending, fraud detection (5 giao dịch trong 1 phút từ 3 quốc gia), tính surge price theo khu vực, alert từ metrics, materialized view.

**Lambda vs Kappa architecture:** Lambda chạy song song batch layer (chính xác) + speed layer (nhanh); Kappa chỉ dùng stream, reprocess bằng cách replay log — đơn giản hơn, phổ biến hơn nhờ Kafka + Flink.

# Reliability & Performance

## SLA, SLO, SLI và error budget khác nhau thế nào? [junior]
- **SLI (Service Level Indicator)**: chỉ số đo được. Ví dụ: tỉ lệ request thành công (non-5xx), tỉ lệ request có latency < 300ms, độ tươi dữ liệu.
- **SLO (Service Level Objective)**: mục tiêu nội bộ cho SLI trong một khoảng thời gian. Ví dụ: "99.9% request thành công trong 30 ngày", "p99 latency < 300ms".
- **SLA (Service Level Agreement)**: **cam kết hợp đồng** với khách hàng, có hậu quả (hoàn tiền, service credit). SLA thường **lỏng hơn** SLO (SLO 99.95%, SLA 99.9%) để có vùng đệm.

**Error budget** = 100% − SLO. SLO 99.9%/30 ngày → được phép ~43 phút downtime (hoặc 0.1% request lỗi).
- Còn budget → team được deploy nhanh, thử nghiệm.
- Hết budget → đóng băng tính năng, ưu tiên reliability (theo Google SRE).
- Biến cuộc tranh luận "dev muốn nhanh, ops muốn ổn định" thành con số khách quan.

**Chọn SLI tốt:**
- Đo từ góc nhìn **user** (ở load balancer hoặc client), không phải CPU server.
- Dùng **percentile** (p50, p95, p99), không dùng average — average che giấu tail.
- Mỗi user journey quan trọng (login, checkout) một SLO riêng.

**Alert theo burn rate**: cảnh báo khi tốc độ tiêu error budget cao bất thường (ví dụ đốt 2% budget trong 1 giờ → page ngay), thay vì alert mỗi khi CPU > 80%.

## Active-active và active-passive failover khác nhau thế nào? Thiết kế multi-region? [senior]
| | Active-passive | Active-active |
|---|---|---|
| Traffic | Chỉ primary phục vụ, standby chờ | Tất cả site cùng phục vụ |
| Standby | Hot (đồng bộ liên tục), warm (chạy tối thiểu), cold (dựng khi cần) | Không có standby, mỗi site dư capacity |
| Failover | Phát hiện lỗi → promote standby → chuyển DNS/traffic (giây đến phút) | Chuyển traffic sang site còn lại, gần như tức thì |
| Dữ liệu | Single-leader, replicate sang standby | Multi-leader hoặc partition dữ liệu theo region → phải xử lý conflict |
| Chi phí | Standby lãng phí nhưng đơn giản | Tận dụng tài nguyên nhưng phức tạp |
| Rủi ro | Standby "chưa bao giờ test" → failover hỏng đúng lúc cần | Mỗi site phải chịu được tải của site khác (giữ < 50% capacity nếu 2 site) |

**Multi-region — các mô hình:**
1. **Active-passive theo region**: DB primary ở region A, replica async ở B. Region A chết → promote B (mất vài giây dữ liệu = RPO).
2. **Read local, write global**: mọi region đọc replica local, ghi về region primary → latency ghi cao cho user xa.
3. **Partition theo user (home region)**: user VN thuộc Singapore, user EU thuộc Frankfurt; mỗi bản ghi chỉ có một chủ ghi → không conflict, còn tuân thủ data residency.
4. **Global database** đồng thuận (Spanner, CockroachDB, Aurora Global, Cosmos DB) — strong consistency đổi bằng latency ghi liên region (hàng chục–trăm ms).

**Lưu ý thực tế:**
- Mọi thứ phải multi-region: DNS, secrets, CI/CD, queue, không chỉ app + DB.
- Tránh **split brain** khi mạng giữa region đứt: dùng witness/quorum ở region thứ ba.
- **Diễn tập failover định kỳ** (game day, chaos engineering) — failover chưa test coi như không có.

## RPO và RTO là gì? Các chiến lược disaster recovery? [mid]
- **RPO (Recovery Point Objective)**: lượng dữ liệu tối đa được phép mất, tính bằng thời gian. RPO = 1h → backup/replication tối thiểu mỗi giờ.
- **RTO (Recovery Time Objective)**: thời gian tối đa để khôi phục dịch vụ sau sự cố.

```text
     RPO                     RTO
◀────────────▶│◀──────────────────────▶
last backup  sự cố                   dịch vụ hoạt động lại
```

**Chiến lược DR (theo AWS), từ rẻ đến đắt:**
| Chiến lược | Mô tả | RPO | RTO |
|---|---|---|---|
| **Backup & restore** | Backup định kỳ sang region khác, dựng lại khi cần | Giờ | Giờ–ngày |
| **Pilot light** | DB replicate liên tục, app tắt/tối thiểu, IaC sẵn | Phút | Hàng chục phút |
| **Warm standby** | Bản thu nhỏ chạy đầy đủ, scale lên khi failover | Giây–phút | Phút |
| **Multi-site active-active** | Chạy đầy đủ ở nhiều region | ~0 | ~0 (giây) |

**Những điểm hay bị bỏ qua:**
- **Backup không được test restore = không có backup.** Lên lịch restore định kỳ, đo thời gian thật.
- Replication không thay được backup: lệnh `DELETE` nhầm hoặc ransomware cũng được replicate ngay → cần **point-in-time recovery** (WAL archiving, PITR) và backup bất biến (immutable/object lock).
- Quy tắc **3-2-1**: 3 bản, 2 loại phương tiện, 1 bản off-site.
- Runbook DR được viết sẵn, IaC (Terraform) để dựng lại hạ tầng.
- RPO/RTO là quyết định **business** (mất 1h đơn hàng tốn bao nhiêu tiền?), từ đó chọn chi phí hợp lý.

## Graceful degradation và load shedding là gì? Thiết kế thế nào? [senior]
**Graceful degradation**: khi một phần hệ thống lỗi hoặc quá tải, vẫn phục vụ chức năng cốt lõi với chất lượng giảm, thay vì sập toàn bộ.

Ví dụ:
- Service recommendation chết → trang sản phẩm hiển thị "sản phẩm bán chạy" từ cache tĩnh.
- Search chậm → tắt tính năng autocomplete, giữ search chính.
- Netflix: service cá nhân hóa lỗi → trả danh sách phim phổ biến chung.
- Giảm chất lượng: ảnh độ phân giải thấp, ít item hơn, tắt realtime update (chuyển polling chậm).

**Kỹ thuật:** circuit breaker + **fallback**, **feature flag / kill switch** tắt tính năng nặng khi có sự cố, phân loại dependency **critical vs non-critical** (non-critical lỗi không được làm request lỗi), timeout ngắn cho dependency phụ.

**Load shedding**: chủ động **từ chối** một phần request khi quá tải để giữ phần còn lại được phục vụ nhanh — tốt hơn để mọi request cùng chậm rồi timeout (khi đó throughput hữu ích về 0).

- **Ưu tiên theo mức độ quan trọng**: checkout > xem sản phẩm > analytics beacon. Gắn priority header, shed từ thấp lên.
- **Tín hiệu quá tải**: concurrency đang xử lý, độ dài queue, thời gian request đã chờ trong queue, CPU.
- **Drop request đã quá hạn**: nếu client timeout 2s mà request đã chờ trong queue 2.5s → bỏ luôn, xử lý cũng vô ích.
- **Adaptive concurrency limit** (Netflix `concurrency-limits`, Envoy adaptive concurrency): tự điều chỉnh giới hạn theo latency đo được (dựa trên Little's Law, TCP Vegas).
- Trả **503 + Retry-After** hoặc 429, client backoff.
- ASP.NET Core: `RateLimiter` middleware với `ConcurrencyLimiter` và queue limit.

## Vì sao tail latency (p99) quan trọng? Thiết lập timeout và tối ưu tail latency thế nào? [senior]
**Tail amplification** (Jeff Dean, "The Tail at Scale"): nếu một request của user fan-out tới 100 server, và mỗi server có 1% request chậm (p99 = 1s), thì xác suất request của user chậm = 1 − 0.99^100 ≈ **63%**. Ở hệ phân tán, p99 của thành phần trở thành p50 của trải nghiệm user.

**Nguyên nhân tail latency:** GC pause, noisy neighbor, queueing khi tải cao, cache miss, lock contention, compaction/background job, retry, cold start, network packet loss (TCP retransmit 200ms+).

**Thiết lập timeout:**
- **Mọi network call phải có timeout** — mặc định thường là vô hạn hoặc rất lớn (`HttpClient` .NET mặc định 100s).
- Đặt timeout theo p99/p99.9 đo được của dependency + biên, không đoán.
- **Deadline propagation**: gửi thời hạn còn lại xuống downstream (gRPC deadline); tầng dưới không làm việc khi tầng trên đã bỏ cuộc.
- Timeout tầng ngoài > tổng timeout tầng trong (kể cả retry), nếu không retry tầng trong vô nghĩa.
- Phân biệt connect timeout (ngắn, ~1s) và read timeout.

**Kỹ thuật giảm tail:**
- **Hedged request**: gửi request, nếu sau p95 chưa có kết quả thì gửi bản sao tới replica khác, lấy kết quả về trước (chỉ tốn thêm ~5% tải). Chỉ dùng cho thao tác idempotent (đọc).
- **Tied request**: gửi tới 2 server, server nào bắt đầu xử lý thì báo hủy ở server kia.
- Giảm fan-out, gom batch, cache.
- Tách pool tài nguyên (bulkhead) cho request nặng và nhẹ.
- Tuning GC (Server GC, giảm allocation), giữ CPU utilization ở mức có headroom (queueing tăng phi tuyến khi utilization > ~70–80%).
- Đo bằng histogram (HdrHistogram, Prometheus histogram), không dùng average.

## Connection pooling, stateless service và autoscaling cần lưu ý gì khi scale ngang? [mid]
**Stateless service** là điều kiện để scale ngang: mọi instance giống nhau, request nào vào instance nào cũng được.
- Đưa state ra ngoài: session → Redis/JWT, file upload → S3, cache dùng chung → Redis, job đang chạy → queue.
- Không ghi file local, không giữ dữ liệu user trong biến static.
- Cấu hình qua environment/config service, không sửa trên máy (12-factor).

**Connection pooling:**
- Mở kết nối DB tốn kém (TCP + TLS + auth, Postgres còn fork một process ~ vài MB RAM mỗi connection) → tái sử dụng qua pool (ADO.NET pool mặc định Max Pool Size = 100, HikariCP).
- **Bẫy khi scale ngang**: 50 pod × pool 100 = 5,000 connection → vượt `max_connections` của Postgres (mặc định 100). Giải pháp: **PgBouncer** (transaction pooling), RDS Proxy, giảm pool size mỗi pod.
- Pool size tối ưu thường nhỏ hơn nhiều so với tưởng tượng: công thức tham khảo của HikariCP `connections ≈ (core_count × 2) + effective_spindle_count`.
- HTTP client: tái sử dụng `HttpClient` qua `IHttpClientFactory` để tránh **socket exhaustion** và vẫn xoay vòng DNS.

**Autoscaling:**
- **Metric**: CPU (phổ biến), request/s, latency, **queue length/consumer lag** (KEDA) cho worker.
- **Horizontal Pod Autoscaler** (K8s) + **Cluster Autoscaler/Karpenter** cho node.
- **Cold start**: instance mới cần thời gian khởi động, warm-up cache, JIT → scale trước (predictive/scheduled scaling cho giờ cao điểm, flash sale), giữ `minReplicas` đủ.
- **Cooldown/stabilization window** để tránh flapping (scale lên xuống liên tục).
- Autoscale app tầng trên có thể **dồn tải xuống DB** — DB thường là thứ không autoscale được nhanh. Scale phải tính cả dependency.
- Graceful shutdown: drain connection, xử lý xong request đang chạy trước khi pod bị tắt (preStop hook, `terminationGracePeriodSeconds`).

# Case Study: Realtime & Social

## Thiết kế hệ thống chat như WhatsApp/Messenger? [senior]
**Requirements:**
- Functional: chat 1-1 và group (≤ 500 người), trạng thái online/last seen, delivery receipt (sent/delivered/read), lịch sử tin nhắn, đa thiết bị, push notification khi offline.
- Non-functional: latency gửi nhận < 200ms, không mất tin, thứ tự đúng trong một hội thoại, HA.

**Estimation:** 500M DAU × 40 tin/ngày = 20 tỷ tin/ngày ≈ **230k msg/s** (peak ~500k). 100 byte/tin → 2 TB/ngày. Kết nối đồng thời ~100M+ → mỗi gateway server giữ ~100k–1M WebSocket (WhatsApp nổi tiếng với ~2M connection/server Erlang) → hàng trăm gateway.

**API:**
```text
WebSocket wss://chat.example.com/ws   (sau khi auth bằng token)
→ {type:"send", clientMsgId, conversationId, body}
← {type:"ack", clientMsgId, messageId, seq}
← {type:"message", conversationId, messageId, seq, senderId, body}
→ {type:"receipt", messageId, status:"delivered|read"}
GET /conversations/{id}/messages?before_seq=...&limit=50   (sync lịch sử, REST)
```

**Data model (Cassandra/ScyllaDB — Discord dùng ScyllaDB):**
```sql
messages(conversation_id, bucket, seq, message_id, sender_id, body, created_at)
  PRIMARY KEY ((conversation_id, bucket), seq)
conversation_members(conversation_id, user_id, last_read_seq)
user_inbox(user_id, conversation_id, last_msg_seq, updated_at)   -- danh sách hội thoại
```

**High-level:**
```text
 Client ══WebSocket══▶ Chat Gateway (stateful, giữ connection)
                          │  publish
                          ▼
                    Message Service ──▶ Sequencer (seq theo conversation)
                          │ ghi             │
                          ▼                 ▼
                    Cassandra (messages)   Kafka (partition by conversation_id)
                                                │
                     ┌──────────────────────────┼───────────────────┐
                     ▼                          ▼                   ▼
              Session Registry (Redis:    Fan-out worker       Push Service
              user_id → gateway_id)      tìm gateway người    (APNs/FCM khi
                                         nhận → gửi qua WS    người nhận offline)
 Presence Service (Redis, heartbeat TTL)
```

**Deep dive:**
- **Gửi tin**: client gửi kèm `clientMsgId` (idempotency, retry không tạo bản trùng). Server lưu DB thành công mới trả `ack` (status "sent", 1 tick).
- **Ordering**: không dựa vào timestamp client. Mỗi conversation có **sequence tăng dần** (Redis `INCR conv:{id}:seq` hoặc Snowflake trong partition). Kafka partition theo `conversation_id` giữ thứ tự xử lý. Client sắp xếp theo `seq` và phát hiện gap → gọi API sync bù.
- **Routing**: Session Registry lưu `user_id → gateway` (một user nhiều device → nhiều entry). Fan-out worker tra registry và gửi qua internal RPC/pub-sub tới gateway đúng.
- **Delivery receipt**: thiết bị nhận gửi `delivered`; mở hội thoại gửi `read` với `last_read_seq` (gộp, không gửi receipt từng tin). Group lớn: chỉ hiển thị số người đã đọc, tính lười.
- **Offline**: tin vẫn nằm trong DB; khi reconnect, client gửi `last_seq` của từng hội thoại → server trả tin còn thiếu. Push notification qua APNs/FCM.
- **Presence**: client heartbeat mỗi 30s → `SET presence:{user} online EX 60`. Không broadcast presence cho mọi bạn bè (quá đắt) — chỉ gửi cho người đang mở cuộc chat hoặc subscribe theo nhu cầu.
- **Group**: fan-out on write tới từng member (giới hạn kích thước group giúp chi phí bị chặn).

**Trade-offs/bottlenecks:** gateway là stateful → khi deploy phải drain và client reconnect với backoff + jitter; E2E encryption (Signal protocol) khiến server không đọc được nội dung, không search phía server; hot conversation (group 500 người rất sôi động) → batching; lưu trữ dài hạn chuyển tin cũ sang storage rẻ.

## Thiết kế News Feed như Facebook/Twitter? Fan-out on write vs on read và celebrity problem? [senior]
**Requirements:** đăng post (text/ảnh), follow, xem home timeline sắp theo thời gian (hoặc ranking), phân trang vô hạn. Non-functional: đọc feed p99 < 300ms, read-heavy (~100:1), eventual consistency chấp nhận được (post xuất hiện sau vài giây là ổn).

**Estimation:** 200M DAU, 1 post/ngày → ~2,300 write/s; 10 lần xem feed/ngày → ~23k read/s (peak ~60k). Trung bình 200 follower/user.

**API:**
```text
POST /v1/posts            {content, mediaIds[]}          → {postId}
GET  /v1/feed?cursor=...&limit=20                         → {items[], nextCursor}
POST /v1/users/{id}/follow
```

**Data model:**
```sql
posts(post_id BIGINT PK /*Snowflake*/, author_id, content, media_urls, created_at)
follows(follower_id, followee_id, created_at)  -- index cả hai chiều
-- Feed cache (Redis): feed:{user_id} = ZSET (score = post_id/time, member = post_id), giữ ~800 mục
```

**Fan-out on write vs on read:**
| | Fan-out on write (push) | Fan-out on read (pull) |
|---|---|---|
| Khi đăng | Ghi post_id vào feed cache của mọi follower | Chỉ ghi post |
| Khi đọc | Đọc 1 ZSET → nhanh | Query post của N followee, merge → chậm |
| Nhược | User 100M follower = 100M ghi; lãng phí cho user inactive | Đọc đắt, latency cao |

**Celebrity problem → Hybrid:**
- User thường (< ~10k follower): **push** vào feed của follower.
- Celebrity: **không push**. Khi user đọc feed: lấy feed đã precompute + **pull** post mới của các celebrity mình follow (số lượng ít, post của celebrity được cache rất nóng) → merge.
- Chỉ push cho follower **active** (đăng nhập trong 30 ngày); user quay lại sau thời gian dài → rebuild feed bằng pull.

**High-level:**
```text
Client ─▶ LB ─▶ Post Service ──▶ Posts DB (sharded by post_id) + Post cache
                     │ event PostCreated
                     ▼
                  Kafka ─▶ Fan-out Workers ──▶ Graph Service (follower list)
                                  │
                                  ▼ ZADD feed:{follower} (trim 800)
                            Feed Cache (Redis Cluster)
Client ─▶ Feed Service ─▶ đọc feed:{me} + pull celebrity posts ─▶ hydrate
                          (post cache, user cache, like counts) ─▶ ranking ─▶ response
Media ─▶ S3 + CDN
```

**Deep dive:**
- **Hydration**: feed cache chỉ lưu ID; nội dung lấy từ post cache (multi-get), user cache, counter service. Feed 20 item → 1 ZRANGE + vài MGET.
- **Pagination bằng cursor** (`post_id < cursor`), không dùng offset (feed thay đổi liên tục gây trùng/sót).
- **Ranking** (Facebook EdgeRank/ML): lấy ~500 candidate rồi chấm điểm theo affinity, loại nội dung, độ tươi.
- **Xóa post/unfollow**: lọc lúc đọc (kiểm tra post còn tồn tại, còn follow) thay vì xóa khỏi hàng triệu feed ngay.
- **Counter like/comment**: ghi vào Redis `INCR` + flush định kỳ về DB, hoặc sharded counter cho post viral.

**Bottlenecks:** fan-out worker lag khi có spike → autoscale theo Kafka lag; Redis memory (chỉ giữ 800 ID/user, chỉ user active); post viral tạo hot key → local cache; thứ tự "gần đúng" theo thời gian là chấp nhận được.

## Thiết kế hệ thống notification đa kênh (push, SMS, email)? [senior]
**Requirements:** gửi notification qua iOS push (APNs), Android (FCM), SMS, email, in-app; transactional (OTP, đơn hàng) và marketing (bulk campaign); user preference/opt-out; lên lịch; tracking delivered/opened. Non-functional: OTP < vài giây, **không gửi trùng**, không mất, chịu được provider lỗi, at-least-once + dedupe.

**Estimation:** 10M push + 1M SMS + 5M email/ngày ≈ 200 msg/s trung bình, campaign có thể dồn 10M trong 1 giờ ≈ 3k/s.

**API:**
```json
POST /v1/notifications
{
  "idempotencyKey": "order-123-shipped",
  "userId": "u_42",
  "template": "order_shipped",
  "params": { "orderId": "123" },
  "channels": ["push", "email"],
  "priority": "high",
  "scheduleAt": null
}
```

**Data model:**
```sql
notification(id, idempotency_key UNIQUE, user_id, template, payload, priority, status, created_at)
delivery(id, notification_id, channel, provider, status /*QUEUED|SENT|DELIVERED|FAILED*/, attempts, provider_msg_id, updated_at)
user_preference(user_id, channel, category, enabled, quiet_hours)
device_token(user_id, platform, token, last_seen_at)
template(name, channel, locale, version, body)
```

**High-level:**
```text
Services ─▶ Notification API ─▶ Validate + Idempotency check + Preference/Rate limit
                                        │
                                        ▼ render template, ghi DB
                       Kafka/SQS: topic theo channel × priority
           ┌────────────┬────────────┬────────────┬────────────┐
           ▼            ▼            ▼            ▼
      Push workers  SMS workers  Email workers  In-app (WebSocket + inbox DB)
           │            │            │
           ▼            ▼            ▼
      APNs / FCM   Twilio / nhà mạng  SES / SendGrid
           │            │            │
           └──── callback/webhook trạng thái ─▶ Status tracker ─▶ Analytics
 Retry queue (backoff) ─▶ DLQ      Scheduler (cron/delayed queue) cho scheduleAt
```

**Deep dive:**
- **Dedupe**: `idempotencyKey` unique ở API; worker ghi `delivery` với khóa `(notification_id, channel)` và kiểm tra status trước khi gửi; Redis `SET sent:{key} NX EX 86400` như lớp nhanh. Provider vẫn có thể gửi trùng khi timeout không rõ kết quả — chấp nhận ở mức hiếm với push/email, với SMS OTP thì OTP có hạn nên trùng ít hại.
- **Priority**: tách queue cho OTP/transactional và marketing → campaign 10M không làm OTP bị trễ.
- **Retry**: lỗi 5xx/timeout → exponential backoff + jitter, tối đa N lần → DLQ. Lỗi permanent (token không hợp lệ: APNs `410 Unregistered`) → xóa device token, không retry.
- **Failover provider**: SMS provider A lỗi (circuit breaker mở) → chuyển sang provider B.
- **Rate limit**: theo user (không spam quá 3 marketing push/ngày), theo provider (quota của APNs/SES), quiet hours theo timezone.
- **Template + i18n** render trước khi enqueue (hoặc ở worker) để payload ổn định khi retry.
- **Tracking**: email open pixel, link click redirect, provider delivery webhook.

**Trade-offs:** at-least-once + dedupe thay vì exactly-once (không thể với provider bên ngoài); campaign lớn nên được tách thành job chia batch theo segment user, đọc từ data warehouse chứ không query DB chính.

## Thiết kế search autocomplete (typeahead)? [senior]
**Requirements:** gõ prefix → trả top 5–10 gợi ý phổ biến nhất, latency < 100ms (lý tưởng < 50ms để không trễ khi gõ), cập nhật xu hướng theo giờ/ngày, hỗ trợ tiếng Việt có/không dấu. Không yêu cầu cá nhân hóa trong phạm vi cơ bản.

**Estimation:** 10M DAU × 10 search × trung bình 10 ký tự gõ → 1 tỷ request/ngày ≈ **12k QPS**, peak ~25k. Mỗi lần gõ một ký tự là một request (có debounce ~100–200ms ở client giảm đáng kể).

**API:**
```text
GET /v1/suggest?q=dien+tho&limit=8&lang=vi
→ ["điện thoại samsung", "điện thoại iphone 16", ...]
```

**Cấu trúc dữ liệu — Trie với top-k cache tại mỗi node:**
```text
root
 └─ d ─ i ─ e ─ n (top: "điện thoại", "điện máy", "điện thoại iphone")
              └─ ' ' ─ t ─ h ─ o (top: "điện thoại", "điện thoại samsung", ...)
```
- Trie thuần phải duyệt toàn bộ subtree để tìm top-k → chậm. Giải pháp: **lưu sẵn top-k ở mỗi node** → lookup = O(độ dài prefix). Đổi lại tốn bộ nhớ và cập nhật đắt hơn.
- Giới hạn độ dài prefix tối đa (~20–50 ký tự).
- Thay thế thực tế: key-value `prefix → top-k list` trong Redis, hoặc Elasticsearch completion suggester / edge n-gram.

**High-level — tách đường đọc và đường cập nhật:**
```text
Đường đọc:
Client (debounce, cache local) ─▶ CDN/edge cache (prefix ngắn rất nóng)
   ─▶ Suggest Service ─▶ Trie in-memory (replica, sharded theo prefix) / Redis prefix→top-k

Đường cập nhật (offline/near-realtime):
Search logs ─▶ Kafka ─▶ Aggregator (Flink/Spark: đếm query theo window, trọng số decay)
   ─▶ Frequency table (query, count, updated) ─▶ Trie Builder (mỗi giờ/ngày)
   ─▶ snapshot trie lên S3 ─▶ Suggest servers load bản mới (blue-green swap)
```

**Deep dive:**
- **Ranking**: tần suất có **time decay** (query hôm nay nặng hơn tuần trước) để bắt trend.
- **Sharding**: theo ký tự đầu (lệch: chữ "t", "n" nhiều hơn "x") → shard theo phân bố thực tế hoặc theo hash prefix 2 ký tự.
- **Caching**: client cache kết quả (gõ backspace không cần gọi lại), HTTP cache header ngắn, CDN cho prefix 1–3 ký tự.
- **Tiếng Việt**: index cả bản có dấu và bỏ dấu (`dien thoai` → map về "điện thoại"); hỗ trợ telex chưa hoàn chỉnh.
- **Lọc nội dung**: blacklist từ nhạy cảm trước khi build.
- **Trending realtime**: thêm lớp nhỏ cập nhật mỗi vài phút cho query đột biến, merge với trie chính.

**Trade-offs:** dữ liệu gợi ý trễ vài giờ đổi lấy đọc cực nhanh và đơn giản; precompute top-k tốn RAM nhưng đảm bảo latency.

## Thiết kế leaderboard / Top-K realtime (game, trending)? [mid]
**Requirements:** cập nhật điểm người chơi, xem top 100, xem hạng và điểm của chính mình và những người xung quanh; leaderboard theo ngày/tuần/mùa. Non-functional: cập nhật gần realtime, 10M người chơi.

**Giải pháp cốt lõi — Redis Sorted Set** (skip list + hash, các thao tác O(log N)):
```text
ZINCRBY lb:season:12 50 user:42          -- cộng 50 điểm
ZREVRANGE lb:season:12 0 99 WITHSCORES   -- top 100
ZREVRANK lb:season:12 user:42            -- hạng của tôi (0-based)
ZSCORE lb:season:12 user:42
ZREVRANGE lb:season:12 (rank-5) (rank+5) -- người xung quanh tôi
```
10M member × ~100 byte ≈ 1 GB RAM → vừa một Redis node (có replica).

**Data model bền vững:** `score_event(user_id, delta, match_id, created_at)` trong DB làm source of truth (Redis có thể rebuild từ đây) và idempotent theo `match_id`.

**High-level:**
```text
Game server ─▶ Score API ─▶ ghi score_event (DB) ─▶ ZINCRBY Redis
                                  └─ Kafka ─▶ analytics / anti-cheat
Client ─▶ Leaderboard API ─▶ Redis (top 100 cache thêm 1-5s cho cực nóng)
                           ─▶ hydrate tên/avatar từ user cache
```

**Deep dive:**
- **Leaderboard theo thời gian**: key riêng mỗi kỳ `lb:daily:2026-10-15`, đặt `EXPIRE`; tổng hợp tuần bằng `ZUNIONSTORE`.
- **Tie-breaking**: ai đạt điểm trước xếp trên → encode score = `points × 10^10 + (MAX_TS − timestamp)` (lưu ý độ chính xác double ~2^53).
- **Scale vượt một node** (hàng trăm triệu người): shard theo dải điểm (mỗi shard một khoảng điểm, rank = tổng số người ở shard cao hơn + rank trong shard), hoặc chỉ tính chính xác top-N và **hạng xấp xỉ** cho phần còn lại (percentile "top 5%") bằng histogram điểm.

**Top-K cho trending (hashtag, sản phẩm xem nhiều) ở quy mô stream lớn:**
- Đếm chính xác mọi key tốn bộ nhớ → dùng **Count-Min Sketch** (đếm xấp xỉ, chỉ đếm dư) + **min-heap** kích thước K; hoặc thuật toán Space-Saving / Misra-Gries.
- Kiến trúc: Kafka → Flink đếm theo tumbling window 1 phút trên từng partition (local top-K) → merge global top-K → lưu Redis. Window 1h = gộp 60 window 1 phút.
- Redis module **RedisBloom** có `TOPK.ADD` / `CMS.INCRBY`.

**Trade-offs:** Redis cho kết quả chính xác và đơn giản tới ~vài chục triệu member; quy mô lớn hơn chấp nhận xấp xỉ.

# Case Study: Media, Storage & Infrastructure

## Thiết kế nền tảng video streaming như YouTube/Netflix? [senior]
**Requirements:** upload video, xem video mượt trên nhiều thiết bị và băng thông khác nhau, tìm kiếm, view count, comment. Non-functional: phát nhanh (time-to-first-frame < 2s), ít buffering, HA, chi phí băng thông tối ưu. Upload chấp nhận xử lý vài phút.

**Estimation:** 5M DAU xem 5 video/ngày; 500k video upload/ngày × trung bình 300MB gốc = 150 TB/ngày gốc; sau transcode ra nhiều độ phân giải ×(1.5–3) dung lượng. Egress: 1M người xem đồng thời × 5 Mbps = **5 Tbps** → bắt buộc CDN (Netflix tự xây Open Connect đặt server trong ISP).

**API:**
```text
POST /v1/videos                       → {videoId, uploadUrls[] (presigned multipart)}
POST /v1/videos/{id}/complete         → bắt đầu pipeline
GET  /v1/videos/{id}                  → metadata + manifestUrl (HLS .m3u8 / DASH .mpd)
GET  cdn.example.com/v/{id}/720p/seg_00042.ts   (do player tự gọi)
```

**Data model:**
```sql
video(id, owner_id, title, description, status /*UPLOADING|PROCESSING|READY|FAILED*/, duration, created_at)
video_rendition(video_id, resolution, bitrate, codec, manifest_path)
-- view count: counter service (Redis + flush), không UPDATE trực tiếp DB mỗi view
```

**High-level:**
```text
UPLOAD PIPELINE
Client ─multipart─▶ S3 (raw bucket) ─event─▶ Orchestrator (DAG workflow)
                                               │ chia video thành chunk theo GOP
              ┌────────────────────────────────┼─────────────────────────────┐
              ▼                                ▼                             ▼
     Transcode workers (song song)     Thumbnail/preview         Kiểm duyệt nội dung,
     H.264/H.265/VP9/AV1 × 240p..4K    extraction                trích phụ đề, DRM
              └──────────────▶ segment 2-6s + manifest ──▶ S3 (processed) ──▶ status READY
                                                                       │
PLAYBACK                                                               ▼
Player ─▶ API (metadata, manifest URL đã ký) ─▶ CDN edge ─miss─▶ Origin shield ─▶ S3
```

**Deep dive:**
- **Transcoding song song**: tách video theo đoạn (theo keyframe/GOP), mỗi worker encode một đoạn ở một rendition → video 1 giờ xử lý trong vài phút thay vì hàng giờ. Orchestrator dạng DAG (Netflix dùng hệ thống riêng, AWS có Step Functions + MediaConvert). Retry từng task, idempotent theo `(videoId, chunk, rendition)`.
- **Adaptive Bitrate Streaming (ABR)** qua **HLS** (Apple) hoặc **MPEG-DASH**: video chia thành segment vài giây ở nhiều bitrate; manifest liệt kê các rendition. Player đo băng thông + buffer và chọn rendition cho segment tiếp theo → mạng yếu tự hạ xuống 360p thay vì buffering.
- **Per-title encoding** (Netflix): bitrate ladder riêng cho từng video (phim hoạt hình cần bitrate thấp hơn phim hành động).
- **CDN**: video phổ biến được **push/prefetch** tới edge trước giờ cao điểm (Netflix fill Open Connect ban đêm); long-tail để pull. Origin shield giảm request về S3.
- **Bảo mật**: signed URL/cookie có thời hạn, DRM (Widevine, FairPlay, PlayReady) cho nội dung trả phí.
- **View count**: client gửi event → Kafka → stream aggregate → cập nhật số định kỳ; chống gian lận lọc bot.
- **Resumable upload**: multipart cho phép upload lại part lỗi.

**Trade-offs:** lưu nhiều rendition tốn storage nhưng giảm egress và tăng trải nghiệm; với video ít xem có thể transcode on-demand hoặc chỉ giữ vài rendition; codec mới (AV1) tiết kiệm băng thông ~30% nhưng encode đắt và cần thiết bị hỗ trợ.

## Thiết kế dịch vụ lưu trữ và đồng bộ file như Dropbox/Google Drive? [senior]
**Requirements:** upload/download file, đồng bộ tự động giữa nhiều thiết bị, chia sẻ, lịch sử phiên bản, làm việc offline. Non-functional: không mất dữ liệu (durability là số 1), đồng bộ nhanh, tiết kiệm băng thông, file tới vài chục GB.

**Estimation:** 50M user, 10M DAU, mỗi user 10GB trung bình → 500 PB logic (dedupe giảm đáng kể). 2 file thay đổi/user/ngày → 20M thay đổi/ngày ≈ 230 req/s metadata (peak gấp vài lần).

**Ý tưởng cốt lõi — chunking:** chia file thành block (Dropbox dùng block 4MB), định danh bằng **hash nội dung** (SHA-256).
- Sửa một phần file → chỉ upload block thay đổi (**delta sync**). Có thể dùng content-defined chunking (rolling hash Rabin) để chèn dữ liệu đầu file không làm lệch mọi block sau.
- **Dedupe**: block có hash đã tồn tại → không upload lại (trong cùng user, hoặc toàn hệ thống — lưu ý rủi ro privacy khi dedupe cross-user).
- Nén block trước khi gửi, mã hóa khi lưu.

**API:**
```text
POST /v1/files/commit {path, blockHashes[], baseRevision}
     → 200 {revision} | 409 {missingBlocks[]} | 409 conflict
PUT  /v1/blocks/{hash}        (hoặc presigned URL tới S3)
GET  /v1/changes?cursor=...   (long-poll / nhận notification để kéo thay đổi)
GET  /v1/blocks/{hash}
```

**Data model (metadata DB — MySQL/Postgres sharded theo namespace/user; Dropbox dùng Edgestore trên MySQL):**
```sql
file(file_id, namespace_id, path, latest_revision, is_deleted)
file_revision(file_id, revision, block_list /*ordered hashes*/, size, modified_by, device_id, created_at)
block(hash PK, storage_key, size, ref_count)
journal(namespace_id, seq, file_id, revision, op)   -- change log để sync theo cursor
```

**High-level:**
```text
Desktop client: Watcher ─▶ Chunker ─▶ Indexer (local SQLite) ─▶ Sync engine
        │ 1. commit(block hashes)            ▲ 4. notification "có thay đổi"
        ▼                                    │
  Metadata Service ─▶ Metadata DB (sharded) ─┤
        │ 2. trả missingBlocks               │
        ▼                                    │
  Client ─3. upload block─▶ Block Service ─▶ S3/Object store (block theo hash)
                                             │
  Notification Service (long-poll/WebSocket) ┘ ─▶ thiết bị khác GET /changes ─▶ tải block thiếu
```

**Deep dive:**
- **Luồng commit hai pha**: client gửi danh sách hash → server trả block còn thiếu → client upload → commit lại → server tạo revision mới, ghi journal, tăng seq → notify thiết bị khác. Metadata chỉ trỏ tới block đã lưu thành công → không có file "hỏng nửa vời".
- **Sync conflict**: commit kèm `baseRevision`. Nếu revision hiện tại ≠ base (thiết bị khác đã sửa) → không ghi đè; tạo **conflicted copy** ("report (Truong's conflicted copy 2026-10-15).docx") để user tự quyết. Google Docs dùng OT/CRDT cho realtime collaboration, nhưng file nhị phân thì không merge được.
- **Offline**: client giữ hàng đợi thay đổi local, đồng bộ khi online lại theo cursor journal.
- **Durability**: object storage replicate nhiều AZ (Dropbox Magic Pocket dùng erasure coding); garbage collect block có `ref_count = 0` sau thời gian giữ version.
- **Large file**: upload block song song, resumable.
- **Notification**: hàng triệu client giữ long-poll → service nhẹ, chỉ báo "có thay đổi", client tự kéo.

**Trade-offs:** chunk lớn → ít metadata nhưng delta sync kém; chunk nhỏ → ngược lại. Dedupe cross-user tiết kiệm nhiều nhưng có thể lộ thông tin "file này đã tồn tại".

## Thiết kế web crawler quy mô lớn? [senior]
**Requirements:** crawl 1 tỷ trang/tháng phục vụ search engine; tôn trọng `robots.txt` và politeness (không dội một domain); tránh crawl trùng; ưu tiên trang quan trọng; re-crawl trang thay đổi. Non-functional: scale ngang, chịu lỗi, xử lý được trang lỗi/độc hại/spider trap.

**Estimation:** 1 tỷ / 30 ngày / 86,400 ≈ **400 trang/s** (peak ~800). Trung bình 500KB HTML → 500 TB/tháng thô (nén còn ~1/5). Lưu 5 năm → vài PB.

**High-level:**
```text
 Seed URLs ─▶ URL Frontier ───────────────────────────────────────────┐
             (prioritizer: queue theo độ ưu tiên                       │
              politeness: mỗi host một queue, 1 worker/host)           │
                    │                                                  │
                    ▼                                                  │
              Fetcher workers ─▶ DNS resolver (cache) ─▶ Internet      │
                    │  (kiểm tra robots.txt cache, timeout, size limit) │
                    ▼                                                  │
              Content parser ─▶ Content dedupe (hash/SimHash) ─▶ Storage (S3/HDFS, WARC)
                    │                                                  │
                    ▼                                                  │
              Link extractor ─▶ URL normalizer/filter ─▶ URL Seen? ────┘
                                                       (Bloom filter + DB)
```

**Deep dive:**
- **URL Frontier** (thiết kế Mercator): hai tầng queue.
  - **Front queues** theo priority (PageRank, độ tươi, domain quan trọng).
  - **Back queues** mỗi queue một host; một bảng `host → next_allowed_time` (min-heap) đảm bảo mỗi host chỉ bị fetch mỗi vài giây (hoặc theo `Crawl-delay`). Worker lấy host có thời gian cho phép sớm nhất.
  - Frontier quá lớn cho RAM → lưu disk, buffer phần đầu trong bộ nhớ.
- **Dedupe URL**: chuẩn hóa (lowercase host, bỏ fragment `#`, sắp xếp query param, bỏ tracking param) rồi kiểm tra bằng **Bloom filter** (tỷ URL vài GB RAM); false positive làm sót một ít URL — chấp nhận được.
- **Dedupe nội dung**: hash nội dung để bắt bản sao chính xác; **SimHash/MinHash** cho near-duplicate (trang chỉ khác quảng cáo/timestamp).
- **Phân tán**: partition URL theo **hash(hostname)** → mọi URL của một host về cùng một crawler node → politeness và cache robots.txt/DNS cục bộ dễ dàng.
- **DNS** là nút thắt phổ biến (resolver đồng bộ chậm) → cache DNS riêng, resolver async.
- **Spider trap**: lịch vô hạn, URL sinh động vô tận → giới hạn độ sâu, độ dài URL, số trang mỗi domain.
- **Re-crawl**: ước lượng tần suất thay đổi của từng trang (trang báo mỗi giờ, trang tĩnh mỗi tháng); dùng `If-Modified-Since`/ETag.
- **Robustness**: checkpoint frontier, worker stateless, timeout và giới hạn kích thước response; render JavaScript (headless Chrome) chỉ cho một phần trang vì rất đắt.

**Trade-offs:** BFS ưu tiên độ phủ, priority ưu tiên chất lượng; politeness giảm throughput mỗi host nhưng bắt buộc về đạo đức và để không bị chặn.

## Thiết kế distributed key-value store / distributed cache (như DynamoDB, Cassandra, Redis Cluster)? [senior]
**Requirements:** `put(key, value)`, `get(key)`, value nhỏ (< 10KB), dữ liệu lớn vượt một máy, HA (luôn ghi được), latency thấp (ms), scale ngang, tunable consistency.

**Các quyết định thiết kế (theo paper Dynamo):**

| Vấn đề | Kỹ thuật |
|---|---|
| Phân tán dữ liệu | **Consistent hashing + virtual nodes** |
| Nhân bản | Mỗi key lưu trên N node kế tiếp trên vòng (preference list, khác rack/AZ) |
| Consistency | **Quorum** N/R/W tunable (N=3, R=2, W=2) |
| Ghi đồng thời | Vector clock / LWW timestamp |
| Node tạm chết | **Sloppy quorum + hinted handoff** |
| Replica lệch lâu dài | **Anti-entropy bằng Merkle tree** |
| Đọc thấy bản cũ | **Read repair** |
| Membership & failure detection | **Gossip** protocol |
| Engine lưu trữ | **LSM-tree**: commit log + memtable + SSTable + bloom filter + compaction |

**High-level:**
```text
Client ─▶ (client lib biết ring hoặc qua bất kỳ node) Coordinator node
                      │ hash(key) → preference list [A, B, C]
            ┌─────────┼─────────┐
            ▼         ▼         ▼
          Node A    Node B    Node C      W=2: trả OK khi 2/3 ack
            │
   Write path: commit log (append, fsync) → memtable (RAM) → flush SSTable (bất biến)
   Read path:  memtable → bloom filter mỗi SSTable → SSTable (mới → cũ) → merge theo timestamp
   Background: compaction (size-tiered / leveled), Merkle tree sync, gossip mỗi 1s
```

**Deep dive:**
- **Write path nhanh** vì chỉ append tuần tự vào commit log + ghi RAM; delete là ghi **tombstone**, dữ liệu bị xóa thật khi compaction (sau `gc_grace_seconds`, nếu không dữ liệu "sống lại" từ replica chưa nhận tombstone).
- **Conflict**: Dynamo trả nhiều version cho client merge (giỏ hàng: union); Cassandra dùng LWW theo timestamp (cần đồng hồ đồng bộ NTP).
- **Thêm node**: node mới nhận một số vnode, stream dữ liệu tương ứng từ node cũ; chỉ ~1/N dữ liệu di chuyển.

**Nếu đề là distributed cache (Redis Cluster/Memcached):**
- Ưu tiên tốc độ hơn độ bền: dữ liệu trong RAM, eviction policy (**LRU/LFU**, `allkeys-lru`), TTL.
- **Redis Cluster**: 16,384 hash slot chia cho các master, mỗi master có replica; client nhận `MOVED/ASK` để định tuyến lại; failover qua gossip + bầu chọn của master khác; replication async → có thể mất ghi khi failover.
- Persistence tùy chọn: RDB snapshot, AOF (`appendfsync everysec`).
- Vấn đề cần nói: hot key, big key, cache stampede, multi-key operation chỉ được trong cùng slot (hash tag `{user:1}`).

**Trade-offs:** AP (luôn ghi được, eventual) vs CP (etcd/ZooKeeper dùng Raft cho metadata nhỏ, cần đa số); LSM ghi nhanh nhưng đọc và compaction tốn kém (write/read/space amplification) so với B-tree.

## Thiết kế một rate limiter service dùng chung cho toàn công ty? [senior]
**Requirements:** giới hạn request theo nhiều chiều (user, API key, IP, endpoint, tenant); rule cấu hình động; trả `429` kèm header; dùng cho nhiều service (ở gateway và trong service). Non-functional: overhead < 1–2ms, HA (rate limiter lỗi không được làm sập hệ thống), chính xác "đủ tốt" trong môi trường phân tán.

**Estimation:** 500k request/s toàn hệ thống, mỗi request 1–3 lần kiểm tra → ~1M ops/s → Redis Cluster ~10–20 shard. Mỗi counter ~100 byte × 50M key active ≈ 5GB.

**Rule config:**
```json
{
  "id": "public-api-free-tier",
  "match": { "path": "/v1/*", "plan": "free" },
  "key": "api_key",
  "algorithm": "token_bucket",
  "capacity": 100,
  "refillPerSecond": 10,
  "mode": "enforce"
}
```

**Response:**
```text
HTTP 429 Too Many Requests
Retry-After: 3
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 3
```

**High-level:**
```text
Client ─▶ API Gateway / Envoy ── gRPC ShouldRateLimit(descriptors) ─▶ Rate Limit Service (stateless)
                │                                                        │ Lua script atomic
                │ allowed → forward                                      ▼
                ▼                                                 Redis Cluster (counters)
            Backend services                                           ▲
                                        Rule store (DB/etcd) ─▶ push config, cache local
 Metrics/log: số request bị chặn theo rule ─▶ dashboard/alert
```
Envoy có sẵn mô hình này (global rate limit filter gọi Lyft `ratelimit` service backed by Redis).

**Deep dive:**
- **Thuật toán**: token bucket cho API public (cho burst), sliding window counter cho chống abuse đăng nhập; tất cả bằng **Lua script** để atomic (xem phần building blocks).
- **Độ trễ**: Redis cùng AZ, pipeline, kết nối persistent. Với limit rất cao có thể dùng **local token bucket + đồng bộ định kỳ** (mỗi instance được cấp một phần quota, sync mỗi 100ms) → gần như không thêm latency, đổi lại chính xác thấp hơn.
- **Hai tầng**: local limiter trong mỗi instance chặn spike thô (bảo vệ chính instance) + global limiter cho quota theo khách hàng.
- **Failure mode**: Redis timeout (đặt 5–10ms) → **fail-open** cho hầu hết API (ưu tiên availability), **fail-closed** cho endpoint nhạy cảm (OTP, login, chuyển tiền).
- **Race & clock**: dùng thời gian Redis hoặc timestamp từ gateway; chấp nhận sai lệch nhỏ.
- **Multi-region**: counter theo region (mỗi region quota riêng) đơn giản hơn đồng bộ global; nếu cần global thì sync async và chấp nhận vượt nhẹ.
- **Shadow mode** (`mode: "log"`) để thử rule mới mà không chặn thật.
- **Hot key**: một API key bị DDoS → chặn sớm ở edge (WAF/CDN theo IP) trước khi tới Redis.

**Trade-offs:** chính xác tuyệt đối (centralized, đồng bộ) vs latency và availability (local, xấp xỉ). Đa số hệ thống chọn xấp xỉ.

# Case Study: Giao dịch & Location-based

## Thiết kế hệ thống gọi xe như Uber/Grab? [senior]
**Requirements:** tài xế gửi vị trí liên tục; hành khách đặt xe, thấy tài xế gần đó; ghép chuyến (matching); theo dõi chuyến realtime; tính giá (có surge); thanh toán. Non-functional: matching trong vài giây, vị trí cập nhật gần realtime, một tài xế không được nhận hai chuyến cùng lúc, HA (mất dịch vụ = mất tiền ngay).

**Estimation:** 1M tài xế online, gửi vị trí mỗi 4s → **250k location update/s**. 10M chuyến/ngày ≈ 120 ride request/s (peak ×5). Vị trí chỉ cần giữ bản mới nhất trong RAM (1M × ~100B = 100MB), lịch sử chuyến ghi vào storage rẻ.

**API:**
```text
WS  /driver/stream     → {lat, lng, heading, speed, ts} mỗi 4s
POST /v1/rides         {pickup, dropoff, vehicleType} → {rideId, fareEstimate}
WS  /rider/rides/{id}  ← trạng thái: MATCHING → DRIVER_ASSIGNED → ARRIVING → IN_PROGRESS → COMPLETED
POST /v1/rides/{id}/accept   (driver)
```

**Geospatial index — tìm tài xế gần:**
| Cách | Mô tả |
|---|---|
| **Geohash** | Mã hóa (lat,lng) thành chuỗi; prefix chung ≈ gần nhau. Precision 6 ≈ ô 1.2km × 0.6km. Tìm ô hiện tại + 8 ô lân cận (vì điểm sát biên ô) |
| **Quadtree** | Chia đệ quy ô có quá nhiều điểm thành 4 → thích ứng mật độ (trung tâm dày, ngoại ô thưa); cập nhật vị trí liên tục làm rebuild đắt |
| **Google S2 / Uber H3** | Ô hình cầu/lục giác phân cấp; H3 lục giác có khoảng cách tới mọi ô lân cận đều nhau — Uber dùng cho matching và surge |
| **Redis GEO** | `GEOADD`, `GEOSEARCH ... BYRADIUS 2 km` (bên trong là sorted set với geohash 52-bit) |

**High-level:**
```text
Driver app ══WS══▶ Location Gateway ─▶ Kafka (partition theo city/cell)
                                          ├─▶ Location Service ─▶ Redis GEO / in-memory index theo cell
                                          ├─▶ Trip tracking (gửi vị trí cho rider đang đi chuyến)
                                          └─▶ Cold storage (lịch sử, ETA model training)
Rider app ─▶ API GW ─▶ Ride Service ─▶ Pricing (surge theo cell: cung/cầu)
                           │
                           ▼
                    Matching Service ─▶ query tài xế gần (k-nearest theo ETA, không theo đường chim bay)
                           │ gửi offer tuần tự/song song có timeout 15s
                           ▼
                    Driver state (Redis: AVAILABLE/OFFERED/ON_TRIP) ─ atomic CAS
                           │
                    Trip DB (Postgres/Cassandra sharded theo city) ─▶ Payment Service
```

**Deep dive:**
- **Location update** cực nhiều ghi nhưng chỉ cần bản mới nhất → giữ trong RAM (Redis/in-memory sharded theo **cell/city**), không ghi DB quan hệ mỗi update. Gửi qua WebSocket/UDP-like, batch, client chỉ gửi khi di chuyển đáng kể.
- **Matching**: lấy tài xế trong các cell lân cận → xếp hạng theo **ETA thực** (routing engine), rating, loại xe → gửi offer. Chống double-assign bằng chuyển trạng thái nguyên tử: `AVAILABLE → OFFERED(rideId)` qua Lua/`SET NX` hoặc `UPDATE drivers SET state='OFFERED' WHERE id=? AND state='AVAILABLE'`. Tài xế từ chối/timeout → trả về AVAILABLE, offer người tiếp theo.
- **Batch matching**: gom request trong 1–2s và giải bài toán gán tối ưu toàn cục (Hungarian/min-cost) cho kết quả tốt hơn greedy.
- **Sharding theo địa lý**: mỗi thành phố gần như độc lập → shard/cell theo city; Uber dùng Ringpop (consistent hashing + gossip) để phân chia cell cho node.
- **Surge pricing**: stream processing đếm cung (tài xế rảnh) và cầu (request) mỗi cell theo window 1–2 phút.
- **Trip state machine** lưu bền trong DB, mọi chuyển trạng thái idempotent; thanh toán sau chuyến dùng idempotency key theo `rideId`.

**Trade-offs:** vị trí trễ vài giây là chấp nhận được (AP), còn gán tài xế và thanh toán cần consistency mạnh (CP); geohash đơn giản nhưng ô không đều theo vĩ độ và vấn đề biên, H3 tốt hơn nhưng phức tạp hơn.

## Thiết kế hệ thống đặt vé / flash sale như Ticketmaster? Chống overselling thế nào? [senior]
**Requirements:** xem sự kiện và sơ đồ ghế, **giữ ghế** (hold) trong 10 phút để thanh toán, thanh toán, xác nhận vé. Flash sale: 1M người tranh 50k vé lúc mở bán. Non-functional: **không bán trùng ghế/không oversell** (strong consistency), công bằng, hệ thống không sập khi spike.

**Estimation:** đỉnh 1M user trong vài phút → hàng trăm nghìn request/s vào trang sự kiện, nhưng chỉ 50k giao dịch thành công. Đọc (xem ghế) chiếm đa số → cache; ghi tồn kho là điểm nóng.

**API:**
```text
GET  /v1/events/{id}/seats            → sơ đồ ghế + trạng thái (cache vài giây)
POST /v1/events/{id}/holds  {seatIds[]} + Idempotency-Key → {holdId, expiresAt} | 409
POST /v1/holds/{holdId}/checkout {paymentToken} → {orderId, status}
```

**Data model:**
```sql
seat(event_id, seat_id, status /*AVAILABLE|HELD|SOLD*/, hold_id, hold_expires_at, version,
     PRIMARY KEY (event_id, seat_id))
hold(hold_id, user_id, event_id, expires_at, status)
ticket_order(order_id, hold_id UNIQUE, user_id, amount, status, idempotency_key UNIQUE)
```

**Giữ ghế nguyên tử (ghế đánh số):**
```sql
UPDATE seat
SET status = 'HELD', hold_id = :hold, hold_expires_at = now() + interval '10 minutes'
WHERE event_id = :e AND seat_id = ANY(:seats)
  AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_expires_at < now()));
-- số dòng cập nhật != số ghế yêu cầu → ROLLBACK, trả 409
```
Điều kiện trong `WHERE` chính là optimistic concurrency → hai người không thể cùng giữ một ghế. Cũng có thể dùng `SELECT ... FOR UPDATE SKIP LOCKED` cho vé không đánh số (lấy N vé bất kỳ còn trống).

**High-level:**
```text
Users ─▶ CDN (trang tĩnh, sơ đồ ghế) ─▶ Virtual Waiting Room (token, cho vào theo tốc độ)
                                              │ chỉ user có token hợp lệ
                                              ▼
                                API GW (rate limit theo user) ─▶ Booking Service
                                              │                       │
                       Redis: tồn kho đếm nhanh (DECR) ◀──────────────┤ (lọc sớm)
                                              │                       ▼
                                              │               Inventory DB (Postgres, source of truth)
                                              ▼                       │
                                   Payment Service (idempotent) ──────┘
                   Hold expiry worker (delayed queue/cron) trả ghế quá hạn về AVAILABLE
```

**Deep dive:**
- **Waiting room/queue ảo**: thay vì để 1M request dội vào DB, đưa user vào hàng đợi (vị trí theo thời điểm vào hoặc random cho công bằng), phát token cho vào theo nhịp mà backend chịu được. Đây là load shedding có trải nghiệm tốt.
- **Redis làm bộ lọc** cho vé không đánh số: `DECR stock:{event}` (Lua kiểm tra ≥ 0) → chỉ request "có hy vọng" mới xuống DB. DB vẫn là nơi quyết định cuối cùng với constraint/điều kiện; định kỳ reconcile Redis với DB.
- **Hold có TTL**: không trừ vé vĩnh viễn trước khi thanh toán; hết hạn thì worker trả về (và câu `WHERE` ở trên cũng tự coi hold quá hạn là trống → không phụ thuộc hoàn toàn vào worker).
- **Thanh toán**: idempotency key; nếu thanh toán thành công nhưng hold đã hết hạn và ghế đã bán cho người khác → hoàn tiền tự động (cần quy trình bù trừ).
- **Hot row**: một sự kiện cực nóng → nhiều dòng ghế (không chung một counter) giúp phân tán lock; vé không đánh số có thể chia tồn kho thành N "bucket" counter.
- **Chống bot**: CAPTCHA, giới hạn số vé/user, verified fan.

**Trade-offs:** consistency mạnh ở tồn kho đổi bằng throughput ghi thấp hơn — được bù bằng waiting room và lọc sớm; xem sơ đồ ghế có thể stale vài giây (người dùng có thể bấm ghế vừa bị giữ và nhận 409).

## Thiết kế hệ thống thanh toán (payment system): idempotency, double-entry ledger, reconciliation? [senior]
**Requirements:** nhận thanh toán đơn hàng qua PSP (Stripe, VNPay, MoMo, cổng thẻ), lưu số dư ví/ledger, hoàn tiền, payout cho merchant. Non-functional: **không trừ tiền hai lần, không mất giao dịch**, đúng tuyệt đối (correctness > latency), audit đầy đủ, tuân thủ PCI-DSS (không lưu số thẻ — dùng tokenization của PSP).

**Estimation:** 1M giao dịch/ngày ≈ 12 TPS (peak 100+) — **throughput không phải vấn đề**, đúng đắn mới là vấn đề.

**API:**
```json
POST /v1/payments
Idempotency-Key: 7c1e-...-order-981
{ "orderId": "981", "amount": 250000, "currency": "VND", "paymentMethodToken": "tok_xxx" }
→ 200 { "paymentId": "pay_123", "status": "PROCESSING" }
```

**Data model:**
```sql
payment(payment_id, order_id, idempotency_key UNIQUE, amount, currency,
        status /*CREATED|PROCESSING|SUCCEEDED|FAILED|REFUNDED*/, psp, psp_reference, created_at, updated_at)
ledger_entry(entry_id, transaction_id, account_id, direction /*DEBIT|CREDIT*/, amount, currency, created_at)
-- ràng buộc: với mỗi transaction_id, tổng DEBIT = tổng CREDIT; ledger append-only, không UPDATE/DELETE
account(account_id, type /*customer_wallet|merchant_payable|psp_clearing|fee_revenue*/, currency)
```

**Double-entry bookkeeping:** mỗi giao dịch ghi ít nhất hai bút toán cân nhau.
```text
Khách trả 250,000đ cho đơn hàng, phí nền tảng 5,000đ:
DEBIT  psp_clearing        250,000
CREDIT merchant_payable    245,000
CREDIT fee_revenue           5,000
```
Số dư = tổng hợp từ ledger (có thể lưu snapshot balance có version). Sửa sai bằng **bút toán đảo** (reversal), không bao giờ sửa dòng cũ → audit trail hoàn chỉnh.

**High-level:**
```text
Checkout ─▶ Payment Service ──(1) ghi payment CREATED (idempotency key unique)
                 │ (2) gọi PSP với idempotency key của mình
                 ▼
           PSP Adapter ─▶ Stripe / VNPay / MoMo
                 ▲            │ (3) webhook kết quả (ký HMAC, có thể trùng/đến trễ)
                 │            ▼
           Webhook handler ─▶ cập nhật status (state machine) + ghi ledger trong 1 transaction
                 │                         └─ outbox ─▶ Kafka ─▶ Order service, notification
           Reconciliation job (hằng ngày): đối chiếu settlement file của PSP ↔ payment ↔ ledger
```

**Deep dive:**
- **Idempotency end-to-end**: client → Payment Service (unique key, lưu response để trả lại cho request lặp); Payment Service → PSP (gửi idempotency key, Stripe hỗ trợ header `Idempotency-Key`); webhook có thể đến nhiều lần → xử lý idempotent theo `psp_event_id`.
- **Trạng thái không rõ (timeout khi gọi PSP)**: không được coi là thất bại và retry tạo giao dịch mới. Giữ `PROCESSING`, hỏi lại PSP (query status API) hoặc chờ webhook; retry chỉ với cùng idempotency key.
- **State machine** nghiêm ngặt: chỉ chuyển trạng thái hợp lệ (`PROCESSING → SUCCEEDED`), update có điều kiện `WHERE status = 'PROCESSING'` để tránh webhook trễ ghi đè.
- **Không distributed transaction** giữa DB và PSP → dùng outbox + saga (trừ tiền thất bại thì hủy đơn, thành công mà tạo đơn lỗi thì refund).
- **Reconciliation**: so sánh file settlement của PSP/ngân hàng với bản ghi nội bộ; chênh lệch (PSP có, mình không; số tiền lệch) → hàng đợi xử lý thủ công/tự động. Đây là lưới an toàn cuối cùng cho mọi bug.
- **Tiền**: dùng kiểu số nguyên đơn vị nhỏ nhất hoặc `DECIMAL`, không dùng float; lưu currency.
- **DB**: SQL với ACID (Postgres), strong consistency, replication sync/semi-sync, backup PITR.

**Trade-offs:** latency cao hơn và luồng async phức tạp hơn để đổi lấy correctness; ledger append-only tốn storage nhưng là yêu cầu audit.

# Senior Topics: Multi-tenancy, Migration & Evolution

## Thiết kế HRM/ERP SaaS multi-tenant: chọn chiến lược tenant isolation nào? [senior]
**Requirements:** nhiều doanh nghiệp (tenant) dùng chung hệ thống HRM: nhân sự, chấm công, tính lương, phân quyền; tenant từ 20 tới 50,000 nhân viên; dữ liệu lương nhạy cảm, **tuyệt đối không lộ chéo tenant**; một số khách enterprise yêu cầu DB riêng/on-premise; tùy biến field và quy trình theo tenant.

**Estimation:** 2,000 tenant, tổng 2M nhân viên; chấm công 2M × 4 lần quẹt/ngày = 8M bản ghi/ngày, dồn vào 7–9h sáng (peak vài nghìn/s); tính lương cuối tháng là batch nặng dồn vào vài ngày.

**Ba chiến lược isolation:**
| | Shared DB, shared schema (`tenant_id`) | Schema per tenant | Database per tenant |
|---|---|---|---|
| Isolation | Logic (dễ lỗi nếu quên filter) | Tốt hơn | Mạnh nhất |
| Chi phí/tenant | Thấp nhất | Trung bình | Cao |
| Onboard tenant | Insert một dòng | Tạo schema + migrate | Provision DB |
| Migration schema | Một lần | N lần (2,000 schema) | N lần, cần orchestration |
| Noisy neighbor | Rủi ro cao | Trung bình | Thấp (nếu khác server) |
| Backup/restore 1 tenant | Khó (phải lọc theo tenant_id) | Dễ hơn | Dễ |
| Báo cáo cross-tenant | Dễ | Khó hơn | Khó (cần data warehouse) |
| Phù hợp | SMB số lượng lớn | Vài trăm tenant vừa | Enterprise, yêu cầu compliance |

**Khuyến nghị: mô hình hybrid (tiered)** — tenant nhỏ ở pool shared DB (sharded theo `tenant_id`), tenant enterprise có DB riêng ("silo"). Một **tenant catalog** ánh xạ `tenant → connection/shard`.

**High-level:**
```text
User ─▶ tenant.hrm.vn ─▶ API Gateway (resolve tenant từ subdomain/JWT claim tenant_id)
                               │
                               ▼
                  App services (stateless, tenant context trong mỗi request)
                     │ tra Tenant Catalog (cache) → connection string/shard
          ┌──────────┼──────────────────┬─────────────────────┐
          ▼          ▼                  ▼                     ▼
     Pool shard 1  Pool shard 2   Enterprise DB (A)     Enterprise DB (B)
     (tenant_id    (tenant_id     riêng, có thể         ...
      + RLS)        + RLS)        region riêng
 Payroll batch workers ─▶ queue theo tenant (fair scheduling)  │ Blob: s3://hrm/{tenant_id}/...
```

**Deep dive:**
- **Bảo đảm isolation với shared schema**: tenant context lấy từ token (không lấy từ tham số client gửi); EF Core **global query filter** `HasQueryFilter(e => e.TenantId == _tenant.Id)`; tầng DB thêm **PostgreSQL Row-Level Security** (`CREATE POLICY ... USING (tenant_id = current_setting('app.tenant_id')::uuid)`) làm lớp phòng thủ thứ hai; mọi unique index và khóa gồm `tenant_id` (`UNIQUE(tenant_id, employee_code)`); test tự động kiểm tra truy cập chéo tenant.
- **Cache key và file** đều có tiền tố tenant (`t:{tenant}:employee:{id}`), log/trace gắn `tenant_id`.
- **Noisy neighbor**: rate limit và quota theo tenant; tính lương chạy qua queue với **fair scheduling** (mỗi tenant giới hạn số worker đồng thời) để tenant 50k nhân viên không làm chậm tenant khác; tenant lớn có thể được **di chuyển** sang shard/DB riêng (tenant migration: copy dữ liệu → CDC đồng bộ → chuyển catalog → cutover).
- **Tùy biến theo tenant**: custom field bằng cột JSONB (có GIN index nếu cần lọc) hoặc bảng EAV có kiểm soát; workflow/công thức lương dạng cấu hình (rule engine), feature flag theo tenant/gói dịch vụ — tránh fork code theo khách hàng.
- **Migration schema** cho DB-per-tenant: tool chạy migration theo lô, có trạng thái từng tenant, backward-compatible (expand/contract) vì không thể cập nhật 2,000 DB cùng lúc.
- **Bảo mật & compliance**: mã hóa cột lương/CMND, audit log ai xem bảng lương, data residency (Nghị định 13/2023 về bảo vệ dữ liệu cá nhân tại VN), xóa/export dữ liệu khi tenant rời đi.

**Trade-offs:** shared schema tối ưu chi phí và vận hành nhưng rủi ro rò rỉ cao nhất → phải có nhiều lớp phòng thủ; DB-per-tenant an toàn nhưng chi phí và vận hành tăng tuyến tính theo số tenant.

## Migration dữ liệu và schema zero-downtime thực hiện thế nào (expand/contract)? [senior]
Mục tiêu: thay đổi schema/dữ liệu khi hệ thống vẫn chạy, có nhiều version code cùng tồn tại trong rolling deploy, và **luôn rollback được**.

**Pattern expand/contract (parallel change)** — ví dụ đổi cột `full_name` thành `first_name` + `last_name`:
```text
1. EXPAND   : thêm cột mới (nullable, không default nặng) — code cũ vẫn chạy bình thường
2. DUAL WRITE: deploy code ghi cả cột cũ và mới, vẫn đọc cột cũ
3. BACKFILL : job chạy theo batch (vd 5,000 dòng/lần, có sleep, theo khóa chính) điền dữ liệu cũ sang cột mới
4. VERIFY   : so sánh, đối soát; bật đọc cột mới sau feature flag (có thể đọc song song và so sánh)
5. SWITCH READ: đọc cột mới, vẫn ghi cả hai (để rollback được)
6. CONTRACT : ngừng ghi cột cũ, sau một thời gian an toàn thì DROP cột cũ
```
Mỗi bước là một deploy riêng và có thể rollback độc lập.

**Lưu ý kỹ thuật:**
- **Lock khi DDL**: `ALTER TABLE` có thể khóa bảng. Postgres: thêm cột nullable là nhanh (từ PG11 thêm cột có default hằng số cũng nhanh), `CREATE INDEX CONCURRENTLY`, thêm constraint `NOT VALID` rồi `VALIDATE CONSTRAINT`; đặt `lock_timeout` để DDL không chặn hàng đợi query. MySQL: online DDL, `gh-ost`, `pt-online-schema-change`.
- **Không rename/drop trong cùng một bước** với deploy code — code cũ đang chạy sẽ lỗi.
- Backfill phải **idempotent** và resume được, theo dõi replication lag (backfill lớn làm replica tụt).
- **Đổi kiểu dữ liệu, tách bảng** cũng theo cùng pattern (bảng mới + dual write/CDC).

**Migration sang database/hệ thống mới:**
```text
Old DB ──(1) snapshot/bulk copy──▶ New DB
   └──(2) CDC (Debezium) đồng bộ liên tục──▶ New DB
(3) shadow read: đọc cả hai, so sánh kết quả, log khác biệt
(4) chuyển dần traffic đọc (1% → 10% → 100%) bằng feature flag
(5) chuyển ghi (cutover ngắn hoặc dual write), giữ đồng bộ ngược để rollback
(6) tắt hệ thống cũ sau thời gian quan sát
```
Đây cũng là cách áp dụng **strangler fig** khi tách monolith.

**Nguyên tắc:** migration là một dự án có kế hoạch rollback, metric đối soát (số dòng, checksum), và chạy thử trên bản sao production trước.

## Cell-based architecture là gì? Khi nào nên dùng? [senior]
**Cell-based architecture**: chia hệ thống thành nhiều **cell** — mỗi cell là một bản sao **đầy đủ, độc lập** của stack (service + DB + cache + queue) phục vụ một tập con khách hàng. Một **cell router** mỏng đứng trước định tuyến request vào đúng cell theo partition key (tenant, user, region).

```text
                     ┌──────────────── Cell Router (mỏng, ít logic, HA cao) ────────────────┐
                     │      partition key: tenant_id → cell (bảng ánh xạ / consistent hash) │
                     └───────┬─────────────────────┬─────────────────────┬──────────────────┘
                             ▼                     ▼                     ▼
                     ┌──── Cell 1 ────┐    ┌──── Cell 2 ────┐    ┌──── Cell 3 ────┐
                     │ API, services  │    │ API, services  │    │ API, services  │
                     │ DB, cache, MQ  │    │ DB, cache, MQ  │    │ DB, cache, MQ  │
                     └────────────────┘    └────────────────┘    └────────────────┘
                     Control plane: provisioning, deploy theo từng cell (wave), di chuyển tenant giữa cell
```

**Lợi ích:**
- **Giới hạn blast radius**: bug, deploy lỗi, poison message, noisy neighbor chỉ ảnh hưởng một cell (ví dụ 1/20 khách hàng) thay vì toàn bộ.
- **Scale bằng cách thêm cell** với kích thước đã biết và đã load test → tránh các giới hạn phi tuyến khi một cụm phình quá to.
- **Deploy theo wave**: cell canary trước, rồi lan dần.
- Dễ đáp ứng data residency (cell đặt ở region yêu cầu) và khách hàng VIP (cell riêng).

**Thách thức:**
- Cell router và control plane phải cực kỳ đơn giản và tin cậy (nó là thành phần dùng chung).
- **Thao tác cross-cell** (báo cáo toàn hệ thống, user tương tác với user ở cell khác) phức tạp → cần data pipeline tổng hợp riêng.
- **Di chuyển tenant giữa cell** (rebalancing) cần migration tooling.
- Chi phí cao hơn (mỗi cell có overhead cố định), vận hành nhiều bản sao cần tự động hóa mạnh (IaC, observability theo cell).

**Ai dùng:** AWS (nhiều dịch vụ nội bộ), Slack (chuyển sang cell theo AZ sau sự cố), DoorDash, Salesforce (pods/instances), Azure (stamps — "deployment stamps pattern").

**Khi nào dùng:** hệ thống lớn, nhiều khách hàng độc lập (SaaS B2B rất hợp), yêu cầu availability cao và sự cố toàn cục quá đắt. Không cần cho startup hay hệ thống nhỏ — một modular monolith + DB tốt là đủ.

## Kể lại cách tiến hóa kiến trúc từ MVP tới hàng triệu user, và cân nhắc chi phí ở mỗi bước? [senior]
Nguyên tắc: **chỉ giải quyết bottleneck đang có hoặc sắp có (dựa trên số đo)**, mỗi bước thêm độ phức tạp phải được biện minh.

**Giai đoạn 0 — MVP (0–1k user):**
```text
Client ─▶ 1 server (app + DB cùng máy, hoặc PaaS + managed DB)
```
Modular monolith, Postgres managed, backup tự động, CI/CD, logging cơ bản. Chi phí vài chục USD/tháng. Ưu tiên tốc độ ra tính năng.

**Giai đoạn 1 — 10k user:** tách DB ra server riêng (managed: RDS/Azure SQL), app chạy ≥ 2 instance sau **load balancer** (stateless: session ra Redis), static file lên **S3 + CDN**. Có monitoring, alert, health check.

**Giai đoạn 2 — 100k user:**
- **Cache** (Redis) cho dữ liệu đọc nhiều; tối ưu query, index (đây thường là cải thiện rẻ nhất).
- **Read replica** cho report và trang đọc nhiều.
- **Queue + worker** cho việc nặng (email, export, xử lý ảnh).
- Autoscaling app tier; connection pooler (PgBouncer).

**Giai đoạn 3 — 1M user:**
- Search sang Elasticsearch, CDN cho cả API cacheable.
- Tách một vài service có lý do rõ ràng (khác yêu cầu scale, khác team): notification, media processing, search.
- Observability đầy đủ: tracing, SLO, on-call.
- Multi-AZ cho mọi thành phần, DR plan với RPO/RTO cụ thể.

**Giai đoạn 4 — 10M+ user:**
- **Sharding** DB theo key (user_id/tenant_id) hoặc chuyển phần write-heavy sang NoSQL phân tán.
- Event-driven với Kafka, CDC; CQRS cho read model.
- Multi-region (bắt đầu active-passive, sau đó partition theo region), cell-based để giới hạn blast radius.
- Platform team, internal developer platform.

**Cân nhắc chi phí (FinOps) xuyên suốt:**
| Hạng mục | Mẹo tiết kiệm |
|---|---|
| Compute | Right-sizing, autoscale, reserved/savings plan cho tải nền, spot instance cho batch/worker |
| Database | Thường là khoản lớn nhất; tối ưu query trước khi scale lên máy to hơn; replica thay vì nâng primary |
| Egress/băng thông | CDN, nén, cùng AZ (traffic cross-AZ và cross-region đều tính tiền) |
| Storage | Lifecycle policy (S3 IA/Glacier), retention log hợp lý |
| Observability | Log volume có thể đắt ngang hạ tầng → sampling trace, giảm log debug |
| Con người | Microservices và multi-region tốn chi phí vận hành/người — chi phí ẩn lớn nhất |

**Điều interviewer muốn nghe:** bạn biết **vì sao** mỗi bước xảy ra (con số nào chạm ngưỡng: CPU DB 70%, replication lag, latency p99), biết những thứ **chưa nên làm** ở giai đoạn sớm (microservices, sharding, multi-region), và biết đánh đổi chi phí — kiến trúc tốt nhất là kiến trúc đơn giản nhất đáp ứng được yêu cầu hiện tại và có đường nâng cấp rõ ràng.
