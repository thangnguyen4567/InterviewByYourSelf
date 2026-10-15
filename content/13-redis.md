---
id: redis
title: Redis
icon: 🟥
order: 13
description: Redis chuyên sâu cho phỏng vấn backend - kiến trúc, data type và encoding, caching pattern, persistence, memory, HA/Cluster, Lua/lock/rate limit, Streams, vận hành production và các bài toán senior
---

# Redis Fundamentals

## Redis là gì và tại sao Redis nhanh dù chỉ "single-threaded"? [junior]
**Redis** (REmote DIctionary Server) là **in-memory data structure store**: lưu dữ liệu trên RAM, truy cập qua giao thức RESP trên TCP, dùng làm cache, database, message broker, counter, lock...

**Vì sao nhanh (thường 100k+ ops/s trên một node, latency dưới 1ms):**
1. **In-memory**: truy cập RAM ~100ns so với SSD ~100µs; không có buffer pool, không parse SQL, không query planner.
2. **Single-threaded event loop** cho phần thực thi lệnh: không có lock, không context switch, không race condition — mỗi lệnh là **atomic** một cách tự nhiên.
3. **I/O multiplexing** (`epoll` trên Linux, `kqueue` trên BSD/macOS): một thread theo dõi hàng chục nghìn socket, chỉ xử lý socket nào sẵn sàng.
4. **Cấu trúc dữ liệu được tối ưu**: SDS (simple dynamic string), listpack, intset, skiplist, hashtable với **incremental rehashing** (rehash dần từng bước để không chặn).
5. **Giao thức RESP đơn giản**, parse rất rẻ; hỗ trợ **pipelining** để gom nhiều lệnh vào một round-trip.

Nút thắt cổ chai của Redis thường là **network và memory**, không phải CPU.

**Lưu ý / bẫy thường gặp:** "single-threaded" nghĩa là **một lệnh chậm chặn toàn bộ server** — `KEYS *`, `HGETALL` trên hash hàng triệu field, `DEL` big key, Lua script chạy lâu đều làm mọi client khác bị timeout.

## "Redis single-threaded" chính xác đến mức nào? IO threads ở Redis 6+ hoạt động ra sao? [mid]
Câu chính xác là: **việc thực thi lệnh (command execution) chạy trên một main thread**, còn Redis có nhiều thread phụ khác.

**Background threads (từ Redis 4.0 – bio):**
- `lazyfree`: giải phóng bộ nhớ bất đồng bộ cho `UNLINK`, `FLUSHALL ASYNC`, eviction/expire khi bật `lazyfree-lazy-*`.
- Đóng file và `fsync` AOF ở background.

**Child process (fork):** `BGSAVE` và `BGREWRITEAOF` chạy ở process con, không phải thread.

**Threaded I/O (Redis 6.0):** `io-threads 4` cho phép nhiều thread **đọc socket, parse request và ghi response** song song; main thread vẫn thực thi lệnh tuần tự. Mặc định chỉ dùng cho write, cần `io-threads-do-reads yes` để dùng cho read. Có ích khi một node phải phục vụ rất nhiều client và network/syscall là bottleneck (thường >8 core). **Valkey 8** viết lại cơ chế này (async I/O threads) đạt throughput cao hơn đáng kể.

```text
client sockets ──► [IO thread 1..N: read + parse] ──► main thread (execute, tuần tự) ──► [IO threads: write reply]
```

**Hệ quả quan trọng:** atomicity của từng lệnh và của MULTI/Lua vẫn giữ nguyên vì execution vẫn tuần tự.

**Lưu ý / bẫy thường gặp:** bật `io-threads` không làm một lệnh O(N) chậm chạy nhanh hơn. Muốn tận dụng nhiều core cho execution thì scale ngang (Cluster) hoặc chạy nhiều instance trên một máy.

## Redis khác Memcached thế nào? Khi nào chọn Memcached? [junior]
| Tiêu chí | Redis | Memcached |
|---|---|---|
| Data type | String, List, Hash, Set, ZSet, Stream, Bitmap, HLL, Geo, JSON... | Chỉ string/blob |
| Threading | Execution single-thread (+ IO threads) | Multi-threaded thật sự |
| Persistence | RDB, AOF | Không |
| Replication / HA | Replica, Sentinel, Cluster | Không có sẵn (client-side sharding) |
| Atomic phức tạp | Lua, Functions, MULTI | Chỉ CAS, incr/decr |
| Pub/Sub, Streams | Có | Không |
| Giới hạn value | 512MB | Mặc định 1MB |
| Memory | jemalloc, overhead per-key cao hơn chút | Slab allocator, rất ổn định |

**Chọn Memcached khi:** chỉ cần cache key-value đơn giản, object lớn, cần tận dụng nhiều core trên một máy lớn, không cần persistence — ví dụ cache HTML fragment ở quy mô cực lớn (Facebook từng dùng Memcached làm lõi cache).

**Chọn Redis khi:** cần data structure (leaderboard, queue, counter, set operations), TTL linh hoạt, HA tự động, atomic logic phía server — tức là gần như mọi trường hợp hiện nay.

**Lưu ý / bẫy thường gặp:** đừng nói "Memcached lỗi thời". Với workload GET/SET thuần trên máy nhiều core, Memcached có thể cho throughput/node cao hơn và memory dễ dự đoán hơn.

## Quy ước đặt tên key, TTL, EXPIRE/PERSIST và cách Redis xóa key hết hạn? [mid]
**Key naming:** dùng dấu `:` phân cấp, có prefix theo service/version: `app:v2:user:1001:profile`, `rate:login:ip:1.2.3.4`. Key ngắn gọn nhưng đọc được (mỗi key tốn bộ nhớ); có **version** để invalidate hàng loạt khi đổi schema serialize.

**Lệnh TTL:**
```bash
SET session:abc "..." EX 1800      # set + TTL atomic
EXPIRE user:1:profile 600 NX       # Redis 7: NX/XX/GT/LT options
TTL user:1:profile                 # -1: không có TTL, -2: key không tồn tại
PERSIST user:1:profile             # bỏ TTL
EXPIREAT key 1767225600            # theo unix timestamp
```

**Redis xóa key hết hạn bằng 2 cơ chế:**
1. **Lazy (passive) expiration**: khi client truy cập key, Redis kiểm tra TTL, hết hạn thì xóa và trả về nil.
2. **Active expiration**: chu kỳ nền (theo `hz`, mặc định 10 lần/giây) **lấy mẫu ngẫu nhiên** khoảng 20 key trong tập key có TTL, xóa key hết hạn; nếu >25% mẫu đã hết hạn thì lặp tiếp, có giới hạn thời gian CPU (`active-expire-effort` để tinh chỉnh).

Vì vậy key hết hạn **có thể vẫn chiếm RAM một thời gian**. Replica không tự xóa key hết hạn — nó chờ master gửi `DEL` (nhưng trả về nil cho key logic đã hết hạn).

**Lưu ý / bẫy thường gặp:** `SET key value` (không có EX) **xóa TTL cũ**; `INCR`, `HSET`, `LPUSH` thì giữ TTL. Redis 7.4 có **hash field expiration** (`HEXPIRE`) — trước đó TTL chỉ đặt được cho cả key.

## Tại sao không được dùng KEYS trong production? SCAN hoạt động thế nào? [mid]
`KEYS pattern` duyệt **toàn bộ keyspace** O(N) trong một lần, chặn main thread. Với 50 triệu key, lệnh có thể chặn vài giây → mọi client timeout, Sentinel có thể tưởng master chết và failover.

**SCAN** là iterator dựa trên **cursor**, mỗi lần trả về một phần:
```bash
SCAN 0 MATCH user:*:session COUNT 1000
# 1) "17592"     <- cursor tiếp theo
# 2) [...keys]
SCAN 17592 MATCH user:*:session COUNT 1000
# ... lặp đến khi cursor trả về "0"
```
Biến thể cho từng cấu trúc: `HSCAN`, `SSCAN`, `ZSCAN`. Redis 6 thêm `SCAN ... TYPE hash`.

**Đặc điểm của SCAN:**
- Dùng **reverse binary iteration** trên hashtable nên vẫn đảm bảo duyệt đủ key tồn tại suốt quá trình kể cả khi rehash.
- **Có thể trả trùng key** → client phải dedupe.
- `COUNT` chỉ là gợi ý; `MATCH` lọc **sau khi** lấy mẫu, nên có thể nhận về trang rỗng mà cursor chưa bằng 0.
- Key thêm/xóa trong lúc scan có thể có hoặc không xuất hiện.

Trong Cluster phải SCAN **từng master node** riêng.

**Lưu ý / bẫy thường gặp:** nếu thường xuyên phải "tìm key theo pattern", đó là dấu hiệu thiết kế sai — hãy duy trì một **index** (Set/ZSet chứa danh sách key) hoặc dùng RediSearch. Nên dùng ACL hoặc `rename-command` để chặn `KEYS`, `FLUSHALL` ở production.

# Data Types và Internal Encoding

## String trong Redis dùng được cho những gì ngoài cache? [junior]
String là **binary-safe** (tối đa 512MB), lưu text, số, JSON, protobuf, ảnh nhỏ...

**Các use case ngoài cache:**
- **Counter atomic**: `INCR page:views:123`, `INCRBY`, `INCRBYFLOAT`, `DECR` — không cần read-modify-write ở client nên không có race condition.
- **Lock / idempotency key**: `SET lock:order:1 token NX PX 30000`, `SET idem:req-uuid 1 NX EX 86400` để chống xử lý trùng request.
- **ID generator**: `INCR seq:order` sinh ID tăng dần.
- **Bitmap** (string được thao tác theo bit): `SETBIT online:2026-10-15 1001 1`, `BITCOUNT`, `BITOP AND` để tính user active liên tục.
- **Rate limit fixed window**: `INCR` + `EXPIRE`.

```bash
SET user:1:name "An" EX 3600 NX   # SETNX + TTL trong 1 lệnh atomic
GETEX user:1:name EX 3600         # Redis 6.2: đọc và gia hạn TTL (sliding expiration)
GETDEL otp:1001                   # Redis 6.2: đọc rồi xóa (OTP dùng 1 lần)
MGET user:1:name user:2:name      # batch
```

**Encoding nội bộ:** `int` (số nguyên 64-bit, shared integer 0-9999), `embstr` (≤44 byte, cấp phát 1 lần cùng redisObject), `raw` (dài hơn). Kiểm tra bằng `OBJECT ENCODING key`.

**Lưu ý / bẫy thường gặp:** `SETNX` + `EXPIRE` là **2 lệnh không atomic** — process chết giữa chừng thì key không bao giờ hết hạn. Luôn dùng `SET key val NX EX ttl`. Lưu JSON lớn trong String rồi sửa một field là anti-pattern (đọc/ghi cả blob) — cân nhắc Hash hoặc RedisJSON.

## List, Hash, Set dùng khi nào? Cho ví dụ lệnh. [junior]
**List** — danh sách có thứ tự chèn, thao tác đầu/cuối O(1):
```bash
LPUSH timeline:u1 post:99          # thêm đầu
LTRIM timeline:u1 0 99             # giữ 100 phần tử mới nhất (capped list)
LRANGE timeline:u1 0 19            # trang đầu
BRPOP queue:email 5                # pop blocking, chờ tối đa 5s -> hàng đợi đơn giản
```
Dùng cho: queue đơn giản, recent items, activity feed ngắn. `LINDEX`/`LINSERT` giữa list dài là O(N).

**Hash** — object với nhiều field:
```bash
HSET user:1 name "An" age 30 plan "pro"
HINCRBY user:1 login_count 1
HMGET user:1 name plan
```
Dùng cho: profile, giỏ hàng (`cart:u1` field=sku value=qty), cấu hình. Ưu điểm so với JSON-in-String: đọc/ghi từng field, tiết kiệm bộ nhớ khi nhỏ (listpack).

**Set** — tập hợp không trùng, không thứ tự:
```bash
SADD post:99:likes u1 u2
SISMEMBER post:99:likes u1         # O(1)
SINTER user:1:friends user:2:friends   # bạn chung
SRANDMEMBER lottery 3 / SPOP lottery   # bốc thăm
```
Dùng cho: tag, like, unique visitor (quy mô vừa), quan hệ bạn bè, set operations.

**Lưu ý / bẫy thường gặp:** `HGETALL`, `SMEMBERS`, `LRANGE 0 -1` trên collection lớn là O(N) và trả payload khổng lồ — dùng `HSCAN`/`SSCAN` hoặc phân trang. `SINTER`/`SUNION` trên set triệu phần tử có thể chặn server hàng trăm ms.

## Sorted Set hoạt động thế nào bên trong? Vì sao dùng skiplist thay vì cây cân bằng? [mid]
**Sorted Set (ZSet)**: mỗi member duy nhất có một **score** (double); phần tử được sắp xếp theo score, cùng score thì theo thứ tự từ điển của member.

```bash
ZADD lb:season1 1500 "u1" 2300 "u2"
ZINCRBY lb:season1 50 "u1"
ZREVRANGE lb:season1 0 9 WITHSCORES       # top 10 (Redis 6.2: ZRANGE ... REV)
ZREVRANK lb:season1 "u1"                  # thứ hạng O(log N)
ZRANGEBYSCORE delayed:jobs -inf 1767225600 LIMIT 0 100   # job đến hạn
ZREMRANGEBYSCORE window:u1 0 1767225000   # xóa phần tử cũ (sliding window)
```

**Encoding nội bộ:**
- Nhỏ (≤ `zset-max-listpack-entries` 128 phần tử và mỗi member ≤ 64 byte): **listpack** — mảng liên tục, quét tuyến tính, cực tiết kiệm RAM.
- Lớn: **skiplist + hashtable** song song. Hashtable cho `ZSCORE` O(1) (member → score); skiplist cho range/rank O(log N). Mỗi node skiplist lưu thêm **span** để tính rank nhanh.

**Vì sao skiplist (theo antirez):**
- Code đơn giản hơn nhiều so với red-black/AVL tree, dễ debug.
- Range query tự nhiên: tìm điểm đầu O(log N) rồi đi tuần tự trên level 0.
- Tốn bộ nhớ có thể điều chỉnh qua xác suất (Redis dùng p=0.25, tối đa 32 level).
- Hiệu năng tương đương cây cân bằng trong thực tế.

**Use case:** leaderboard, delayed queue (score = timestamp), sliding window rate limit, priority queue, secondary index theo thời gian/giá.

**Lưu ý / bẫy thường gặp:** score là double 64-bit → số nguyên chỉ chính xác đến 2^53. Muốn tie-break theo thời gian (ai đạt điểm trước xếp trên) phải encode vào score, ví dụ `score = points * 1e10 + (MAX_TS - ts)`, cẩn thận vượt 2^53.

## Bitmap, HyperLogLog, Geo dùng cho bài toán gì? [mid]
**Bitmap** — mảng bit trên String, 1 bit/user:
```bash
SETBIT active:2026-10-15 1001 1
BITCOUNT active:2026-10-15                    # DAU
BITOP AND active:3days active:2026-10-13 active:2026-10-14 active:2026-10-15
```
100 triệu user ≈ 12.5MB/ngày. Hợp khi user ID là số nguyên **dày đặc**; ID thưa (ví dụ 1 và 4 tỷ) sẽ tốn ~512MB vì cấp phát tới bit cao nhất. `BITFIELD` cho phép lưu nhiều counter nhỏ (u4, i16...) trong một string.

**HyperLogLog** — đếm **cardinality xấp xỉ** (unique count):
```bash
PFADD uv:2026-10-15 user123 user456
PFCOUNT uv:2026-10-15
PFMERGE uv:week uv:2026-10-13 uv:2026-10-14
```
Tối đa **12KB/key** bất kể số phần tử, sai số chuẩn **~0.81%**. Không lấy lại được danh sách phần tử, không xóa được phần tử. Dùng cho UV, số search query unique.

**Geo** — thực chất là Sorted Set với score là **geohash 52-bit**:
```bash
GEOADD drivers 106.70 10.77 "d1"
GEOSEARCH drivers FROMLONLAT 106.69 10.78 BYRADIUS 3 km ASC COUNT 10 WITHDIST
```
Dùng cho "tìm tài xế/cửa hàng gần nhất". Vì là ZSet nên dùng `ZREM` để xóa.

**Lưu ý / bẫy thường gặp:** Geo của Redis tốt cho bán kính đơn giản; vị trí cập nhật liên tục với hàng triệu tài xế nên shard theo khu vực (`drivers:{hcm}`) để tránh một key quá lớn/quá nóng.

## Redis Streams, RedisJSON, RediSearch và Redis Stack/Redis 8 là gì? [mid]
**Streams (Redis 5.0)** — append-only log với ID `ms-seq`, consumer group, ack, lưu bền theo persistence. Là cấu trúc phù hợp cho event log/queue đáng tin cậy (xem phần Messaging).

**Modules / Redis Stack:**
- **RedisJSON**: lưu document JSON, đọc/sửa theo JSONPath: `JSON.SET product:1 $ '{"name":"A","price":10}'`, `JSON.NUMINCRBY product:1 $.price 5`.
- **RediSearch (Query Engine)**: secondary index, full-text search, filter numeric/tag, aggregation, **vector similarity search** (dùng cho RAG/semantic cache).
- **RedisTimeSeries**: chuỗi thời gian với downsampling, retention.
- **RedisBloom**: Bloom/Cuckoo filter, Count-Min Sketch, Top-K.

```bash
FT.CREATE idx:product ON JSON PREFIX 1 product: SCHEMA $.name AS name TEXT $.price AS price NUMERIC
FT.SEARCH idx:product "@name:laptop @price:[500 1500]" LIMIT 0 10
```

**Phiên bản:** trước đây module phải cài riêng hoặc dùng bản đóng gói **Redis Stack**. Từ **Redis 8 (2025)**, JSON, Query Engine, TimeSeries, probabilistic được tích hợp vào bản Redis Open Source, kèm kiểu mới **Vector Set**.

**Lưu ý / bẫy thường gặp:** dịch vụ managed và fork không phải lúc nào cũng có module: ElastiCache/Valkey có lộ trình riêng (Valkey có module JSON/Bloom/Search riêng), Azure Cache chỉ có RediSearch ở tier Enterprise/Azure Managed Redis. Kiểm tra trước khi thiết kế phụ thuộc vào module.

## Internal encoding (listpack, intset, quicklist, hashtable) ảnh hưởng tới memory như thế nào? Làm sao chọn đúng data type? [senior]
Redis tự động chọn **encoding compact** cho collection nhỏ và chuyển sang encoding "thật" khi vượt ngưỡng (chuyển một chiều, không tự quay lại):

| Type | Encoding nhỏ | Ngưỡng (mặc định) | Encoding lớn |
|---|---|---|---|
| Hash | listpack | `hash-max-listpack-entries 128`, value ≤ 64B | hashtable |
| Set | intset (toàn số nguyên) / listpack (7.2+) | 512 số / 128 phần tử | hashtable |
| ZSet | listpack | 128 phần tử, member ≤ 64B | skiplist + hashtable |
| List | listpack | nhỏ | quicklist (linked list các listpack) |

**Listpack** (thay ziplist hoàn toàn từ Redis 7.0, sửa lỗi cascading update) là mảng byte liên tục: không có pointer, không dictEntry → có thể **tiết kiệm 5-10 lần** bộ nhớ so với hashtable. Đổi lại thao tác là O(N) trên mảng nhỏ — vẫn rất nhanh vì N ≤ 128 và cache-friendly.

**Kỹ thuật kinh điển (Instagram):** thay vì 300 triệu String key `media:{id} → user_id`, gom thành hash bucket `media:{id/1000}` với field = id, mỗi hash ≤1000 field (tăng `hash-max-listpack-entries`). Bộ nhớ giảm từ ~70MB xuống ~16MB cho mỗi triệu key.

**Chọn data type theo use case:**
| Bài toán | Type |
|---|---|
| Object có field cập nhật riêng | Hash |
| Ranking, range theo score/time | Sorted Set |
| Unique count chính xác, nhỏ | Set; lớn và chấp nhận sai số: HyperLogLog |
| Cờ boolean theo user ID số | Bitmap |
| Queue đơn giản | List; cần ack/replay: Stream |
| Document query phức tạp | JSON + Query Engine |

**Lưu ý / bẫy thường gặp:** nâng ngưỡng listpack quá cao (ví dụ 10.000) làm mỗi thao tác chậm và tốn CPU. Đo bằng `MEMORY USAGE key` và `OBJECT ENCODING key` trước/sau khi chỉnh.

# Caching Patterns và Cache Problems

## So sánh các caching pattern: cache-aside, read-through, write-through, write-behind, refresh-ahead? [mid]
| Pattern | Đọc | Ghi | Ưu | Nhược |
|---|---|---|---|---|
| **Cache-aside (lazy loading)** | App đọc cache, miss thì đọc DB rồi set cache | App ghi DB rồi **xóa** cache | Đơn giản, chỉ cache dữ liệu được dùng, cache chết app vẫn chạy | Miss đầu tiên chậm, logic nằm ở app, có cửa sổ inconsistent |
| **Read-through** | Cache provider tự load từ DB khi miss | — | App code gọn | Cần thư viện/provider hỗ trợ (HybridCache GetOrCreate, NCache) |
| **Write-through** | — | Ghi cache và DB đồng bộ trong một thao tác | Cache luôn mới | Latency ghi cao, cache dữ liệu có thể không ai đọc |
| **Write-behind (write-back)** | — | Ghi cache trước, flush DB bất đồng bộ theo batch | Ghi cực nhanh, gom write | **Mất dữ liệu** nếu cache chết trước khi flush, phức tạp |
| **Refresh-ahead** | Làm mới key "nóng" trước khi hết hạn | — | Không có miss cho hot key | Tốn tài nguyên nếu đoán sai key nóng |

**Cache-aside chuẩn:**
```csharp
public async Task<Product?> GetProductAsync(int id)
{
    var key = $"app:v1:product:{id}";
    var cached = await _db.StringGetAsync(key);
    if (cached.HasValue) return JsonSerializer.Deserialize<Product>(cached!);

    var product = await _repo.GetAsync(id);
    var ttl = TimeSpan.FromMinutes(10) + TimeSpan.FromSeconds(Random.Shared.Next(0, 120)); // jitter
    await _db.StringSetAsync(key, JsonSerializer.Serialize(product), ttl);
    return product;
}
```

**Write-behind thực tế** dùng cho counter (view count, like): `INCR` trên Redis, job định kỳ flush tổng vào DB.

**Lưu ý / bẫy thường gặp:** write-behind không phù hợp dữ liệu tài chính/đơn hàng. Ở phỏng vấn, mặc định chọn cache-aside + delete-on-write, rồi giải thích các cửa sổ inconsistent.

## Chiến lược TTL và invalidation: đặt TTL bao lâu, khi nào dùng event-based invalidation? [mid]
**Nguyên tắc TTL:**
- TTL = mức **stale tối đa nghiệp vụ chấp nhận được**, không phải con số tùy tiện. Giá sản phẩm: 1-5 phút; danh mục/config: 1 giờ; profile: 10-30 phút kèm invalidate khi sửa.
- **Luôn có TTL** kể cả khi đã invalidate chủ động — TTL là lưới an toàn khi một lần invalidate bị lỗi.
- **Jitter**: `ttl = base + random(0, base*10%)` để tránh nhiều key hết hạn đồng loạt (avalanche).
- **Sliding expiration** (session): gia hạn mỗi lần truy cập bằng `GETEX key EX 1800` hoặc `EXPIRE`.
- Negative cache (kết quả "không tồn tại") dùng TTL ngắn hơn (30-60s).

**Các chiến lược invalidation:**
1. **TTL-only**: đơn giản, chấp nhận stale ≤ TTL.
2. **Delete-on-write**: app xóa key sau khi commit DB.
3. **Event-based**: service phát event `ProductUpdated` (outbox → Kafka/RabbitMQ), consumer xóa cache — tách khỏi đường ghi.
4. **CDC-based**: Debezium đọc binlog/WAL → xóa cache; bắt được cả thay đổi ngoài app (script, admin SQL).
5. **Versioned key / namespace**: `catalog:v{N}:...`, tăng N để vô hiệu hóa cả nhóm mà không cần xóa từng key (key cũ tự hết hạn).
6. **Tag-based**: Set `tag:category:5` chứa danh sách key liên quan; HybridCache (.NET) hỗ trợ `RemoveByTagAsync`.

**Lưu ý / bẫy thường gặp:** không dùng `KEYS`/`SCAN` + `DEL` theo pattern làm cơ chế invalidation thường xuyên. Với local cache (L1) trên nhiều instance phải có kênh broadcast (Pub/Sub hoặc client-side caching tracking) — nếu không mỗi instance stale khác nhau.

## Cache stampede (thundering herd) là gì? So sánh mutex lock, probabilistic early expiration và singleflight. [senior]
**Cache stampede**: một key **nóng** hết hạn, hàng nghìn request đồng thời cùng miss và cùng query DB/tính toán nặng → DB quá tải, latency tăng vọt, có thể dây chuyền.

**1. Singleflight (in-process request coalescing):** trong một process, chỉ một request đi load, các request khác `await` cùng Task. Rẻ, không cần network; nhưng với 50 instance thì vẫn có 50 query.
```csharp
private static readonly ConcurrentDictionary<string, Lazy<Task<string>>> _inflight = new();
Task<string> LoadOnce(string key, Func<Task<string>> loader) =>
    _inflight.GetOrAdd(key, _ => new Lazy<Task<string>>(async () =>
    { try { return await loader(); } finally { _inflight.TryRemove(key, out _); } })).Value;
```
HybridCache của .NET 9 có sẵn cơ chế này.

**2. Distributed mutex:** request miss thử `SET lock:key token NX PX 5000`; ai lấy được thì rebuild, người khác chờ ngắn rồi đọc lại cache (hoặc trả **stale value** nếu có). Giảm xuống 1 query toàn cluster, nhưng thêm latency chờ và phải xử lý lock holder chết.

**3. Probabilistic early expiration (XFetch):** mỗi request tự quyết định refresh **sớm** với xác suất tăng dần khi gần hết hạn:
```text
recompute nếu:  now - delta * beta * ln(random()) >= expiry
delta = thời gian tính toán lần trước, beta ≈ 1 (lớn hơn = refresh sớm hơn)
```
Không cần lock, refresh trải đều, chỉ cần lưu thêm `delta` và `expiry` cùng value.

**4. Stale-while-revalidate / logical expiration:** lưu `expireAt` logic trong value, TTL vật lý dài hơn. Hết hạn logic thì trả dữ liệu cũ ngay và refresh nền (kèm lock). Phổ biến nhất cho hot key.

**Lưu ý / bẫy thường gặp:** stampede còn xảy ra khi **Redis restart/flush** (cold cache) — cần warm-up và rate limit về DB. Kết hợp: singleflight trong process + lock phân tán + stale value là combo an toàn.

## Cache penetration và cache avalanche xử lý thế nào? Bloom filter đặt ở đâu? [mid]
**Cache penetration**: request truy vấn key **không tồn tại cả trong cache lẫn DB** (ID âm, ID ngẫu nhiên do tấn công) → luôn miss, luôn chạm DB.

Giải pháp:
1. **Validate input** ở API (ID hợp lệ, format, auth) — rẻ nhất.
2. **Cache null/empty**: lưu sentinel `"__NULL__"` với TTL ngắn (30-60s). Nhược: tấn công bằng nhiều ID ngẫu nhiên sẽ làm đầy cache bằng null → cần TTL ngắn và giới hạn.
3. **Bloom filter**: tập chứa mọi ID hợp lệ; `BF.EXISTS` trả "không" thì chắc chắn không tồn tại → trả 404 ngay. Có false positive (vài %) nhưng không có false negative.
```bash
BF.RESERVE bf:product 0.01 10000000      # error rate 1%, 10 triệu phần tử (~12MB)
BF.ADD bf:product 12345
BF.EXISTS bf:product 99999999
```
Bloom filter không xóa được phần tử → dùng Cuckoo filter (`CF.*`) nếu cần xóa, hoặc rebuild định kỳ. Đặt filter ở Redis (dùng chung) hoặc trong memory app (nhanh hơn, cần sync).

**Cache avalanche**: **nhiều key hết hạn cùng lúc** (cùng được warm lúc deploy với cùng TTL) hoặc **cả cụm Redis sập** → DB bị dội.

Giải pháp:
- TTL + **jitter**; warm-up rải dần.
- **HA cho Redis** (replica + Sentinel/Cluster) và đa tầng cache (L1 local + L2 Redis).
- **Circuit breaker / bulkhead / rate limit** đường về DB; degrade (trả dữ liệu mặc định).
- Hot data không đặt TTL vật lý, dùng logical expiration + refresh nền.

**Lưu ý / bẫy thường gặp:** phân biệt rõ 3 khái niệm: **penetration** = key không tồn tại; **breakdown/stampede** = một hot key hết hạn; **avalanche** = hàng loạt key hoặc cả cache down.

## Hot key và big key: phát hiện và xử lý ra sao? [senior]
**Hot key**: một key nhận lượng request cực lớn (flash sale, tin nóng, config dùng chung). Trong Cluster, key nằm trên **một slot → một node**, node đó nghẽn CPU/network trong khi node khác rảnh. Thêm node không giải quyết được.

**Phát hiện:** `redis-cli --hotkeys` (cần `maxmemory-policy` dạng LFU), `OBJECT FREQ key`, thống kê ở client/proxy, `MONITOR` (chỉ chạy vài giây — rất tốn), metric network per-node lệch.

**Xử lý hot key:**
1. **Local cache L1** (MemoryCache/Caffeine, TTL 1-5s) trước Redis — giảm >90% traffic. Redis 6 **client-side caching** (`CLIENT TRACKING`) cho phép server gửi invalidation tới client.
2. **Key splitting / replication**: lưu N bản sao `hot:item:1:{0..N-1}`, client đọc ngẫu nhiên một bản (các bản nằm ở slot khác nhau); ghi phải ghi đủ N bản.
3. **Đọc từ replica** (`READONLY` trong Cluster) — chấp nhận replication lag.
4. Counter nóng: chia thành nhiều sub-counter rồi cộng lại.

**Big key**: String > ~10MB, collection hàng trăm nghìn/triệu phần tử.
Tác hại: lệnh O(N) chặn server, `DEL` chặn lâu (giải phóng từng phần tử), migrate slot chậm/timeout, mất cân bằng memory giữa node, network bị nghẽn khi đọc.

**Phát hiện:**
```bash
redis-cli --bigkeys          # lấy mẫu bằng SCAN, báo key lớn nhất theo số phần tử
redis-cli --memkeys          # Redis 6+: theo bytes
MEMORY USAGE big:hash SAMPLES 0
```
Hoặc phân tích file RDB offline (redis-rdb-tools, rdb-cli) để không ảnh hưởng production.

**Xử lý:** chia nhỏ (`hash:{id}:{bucket}`), xóa bằng `UNLINK` (giải phóng ở background thread) hoặc xóa dần bằng `HSCAN` + `HDEL`, bật `lazyfree-lazy-user-del yes`, đổi thiết kế (lưu blob lớn ở S3, Redis chỉ giữ metadata).

**Lưu ý / bẫy thường gặp:** big key thường là "hot key tương lai" — một list feed không có `LTRIM`, một set follower không giới hạn. Đặt giới hạn kích thước ngay khi thiết kế.

## Làm sao giữ consistency giữa DB và cache? Vì sao "delete cache" tốt hơn "update cache"? Delayed double delete? [senior]
**Update DB rồi update cache** có race giữa 2 writer:
```text
W1: update DB = 1           W2: update DB = 2
                            W2: set cache = 2
W1: set cache = 1   -> DB=2, cache=1 (sai đến khi hết TTL)
```
Ngoài ra update cache lãng phí nếu dữ liệu ít được đọc và khó khi giá trị cache là kết quả tổng hợp nhiều bảng. → **Ưu tiên xóa cache** (để lần đọc sau load lại).

**Delete cache trước rồi update DB** cũng sai: reader chen vào giữa đọc DB cũ và set lại cache cũ.

**Update DB rồi delete cache** (khuyến nghị, Facebook "Scaling Memcache") vẫn có race hiếm:
```text
R: cache miss, đọc DB = old
W: update DB = new, delete cache
R: set cache = old   -> stale
```
Xảy ra khi đọc DB chậm hơn cả một lần ghi + xóa — hiếm nhưng có thật, đặc biệt khi **đọc từ read replica bị lag**.

**Các biện pháp tăng cường:**
1. **Delayed double delete**: xóa cache, update DB, sau ~500ms-1s (lớn hơn replica lag + thời gian một lần đọc) xóa lần nữa (qua delay queue).
2. **CDC-based invalidation**: Debezium đọc binlog/WAL sau commit → xóa cache, retry đến khi thành công. Đảm bảo không bỏ sót, tách khỏi app.
3. **Versioning / compare-and-set**: lưu version trong value, Lua script chỉ set nếu version mới hơn.
4. **Lease (Facebook)**: miss nhận lease token; delete làm lease mất hiệu lực, set với token cũ bị từ chối.
5. TTL làm giới hạn trên cho stale.

**Lưu ý / bẫy thường gặp:** xóa cache thất bại (Redis timeout) mà không retry → stale vĩnh viễn nếu không có TTL. Cache-DB **không bao giờ strongly consistent** nếu không có distributed transaction; câu trả lời tốt là "eventual consistency với stale window bị chặn trên, đủ cho nghiệp vụ" và các dữ liệu cần chính xác (số dư, tồn kho khi đặt hàng) thì đọc thẳng DB.

# Persistence

## RDB snapshot hoạt động thế nào? fork và copy-on-write ảnh hưởng gì đến production? [mid]
**RDB** là file nhị phân nén chứa snapshot toàn bộ dataset tại một thời điểm.

**Cơ chế BGSAVE:**
1. Main process gọi `fork()` tạo child process.
2. Child có cùng không gian bộ nhớ (chia sẻ page) và ghi dataset ra file tạm, xong thì `rename` atomic thành `dump.rdb`.
3. Parent tiếp tục phục vụ; khi parent sửa một page, kernel **copy-on-write** (COW) page đó → child vẫn thấy snapshot cũ.

```bash
# redis.conf
save 3600 1 300 100 60 10000   # sau 3600s nếu ≥1 thay đổi, 300s nếu ≥100, 60s nếu ≥10000
BGSAVE / LASTSAVE / INFO persistence   # rdb_last_bgsave_status, rdb_last_cow_size
```
`SAVE` (đồng bộ) chặn server — không dùng ở production.

**Ảnh hưởng production:**
- **Latency khi fork**: copy page table tỉ lệ với RAM (~10-20ms/GB trên VM, tệ hơn trên một số hypervisor). Dataset 50GB có thể gây spike hàng trăm ms.
- **Memory tăng khi COW**: workload ghi nhiều có thể làm memory gần **gấp đôi** trong lúc BGSAVE → OOM killer. Vì vậy chừa 30-50% RAM trống, đặt `vm.overcommit_memory=1`.
- **Tắt Transparent Huge Pages**: THP làm mỗi lần COW copy 2MB thay vì 4KB → latency và memory tăng mạnh.

**Ưu điểm RDB:** file gọn, khôi phục nhanh, tiện backup/chuyển sang môi trường khác, dùng cho full sync replica.
**Nhược:** mất dữ liệu từ lần snapshot cuối (có thể vài phút).

**Lưu ý / bẫy thường gặp:** nếu BGSAVE thất bại (hết disk), mặc định `stop-writes-on-bgsave-error yes` làm Redis **từ chối mọi lệnh ghi** — sự cố hay gặp khi disk đầy.

## AOF hoạt động thế nào? So sánh các mức appendfsync và cơ chế rewrite. [mid]
**AOF (Append Only File)** ghi lại mọi lệnh ghi theo định dạng RESP; khi restart Redis replay lại để khôi phục.

**appendfsync — quyết định khi nào gọi `fsync`:**
| Mức | Hành vi | Mất dữ liệu tối đa | Hiệu năng |
|---|---|---|---|
| `always` | fsync sau mỗi lần ghi (theo batch event loop) | ~0 (lệnh đã ack) | Chậm nhất, bị giới hạn bởi disk |
| `everysec` (mặc định) | fsync mỗi giây ở background thread | ~1s (tối đa ~2s nếu fsync chậm) | Gần như RDB |
| `no` | Để OS quyết định (Linux ~30s) | Nhiều giây | Nhanh nhất |

**AOF rewrite (`BGREWRITEAOF`):** file AOF phình to (100 lần `INCR` = 100 dòng). Rewrite fork child để sinh file mới **từ trạng thái hiện tại** (1 lệnh `SET counter 100`). Tự động theo `auto-aof-rewrite-percentage 100` và `auto-aof-rewrite-min-size 64mb`.

**Redis 7.0 Multi-part AOF:** AOF được tách thành thư mục `appendonlydir/` gồm **base file** (RDB hoặc AOF), các **incr file** và **manifest**. Rewrite chỉ tạo base mới + incr mới, không còn cần buffer rewrite trong memory và ghi đôi như trước.

```bash
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes      # base file dạng RDB -> load nhanh
no-appendfsync-on-rewrite no  # yes: bỏ fsync trong lúc rewrite (giảm latency, tăng rủi ro)
```

**Lưu ý / bẫy thường gặp:** với `everysec`, nếu disk chậm và fsync kéo dài >2s, main thread **sẽ bị chặn** ghi để giữ cam kết — log có "Asynchronous AOF fsync is taking too long". AOF hỏng đuôi (mất điện) được xử lý bằng `aof-load-truncated yes` hoặc `redis-check-aof --fix`.

## Nên chọn RDB, AOF hay hybrid? Phân tích cửa sổ mất dữ liệu theo từng use case. [senior]
**Hybrid (RDB preamble + AOF)** — mặc định khi bật AOF từ Redis 5: base dạng RDB (load nhanh) + phần lệnh tăng dần dạng AOF (ít mất dữ liệu). Đây là lựa chọn mặc định khi cần durability.

**Theo use case:**
| Use case | Cấu hình | Lý do |
|---|---|---|
| Pure cache (có thể rebuild từ DB) | Tắt persistence hoặc chỉ RDB thưa | Tiết kiệm IO/fork; nhưng cân nhắc RDB để tránh cold cache stampede khi restart |
| Session, rate limit, lock | RDB + AOF everysec | Mất 1s chấp nhận được |
| Queue/Stream, leaderboard là nguồn dữ liệu chính | AOF everysec + replica + `WAIT`/`WAITAOF` | Giảm mất mát khi failover |
| Dữ liệu tài chính | **Không dùng Redis làm source of truth** | Persistence + async replication vẫn có thể mất lệnh đã ack |

**Các cửa sổ mất dữ liệu phải nêu được:**
1. RDB: từ lần snapshot cuối.
2. AOF everysec: ~1-2s.
3. **Replication bất đồng bộ**: master ack client rồi mới gửi replica; master chết → replica được promote thiếu các lệnh đó, **bất kể** cấu hình AOF.
4. Split-brain: master cũ bị cô lập vẫn nhận ghi, sau đó bị đổi thành replica và **xóa sạch** dữ liệu đó.

`WAIT numreplicas timeout` (chờ N replica xác nhận) và `WAITAOF numlocal numreplicas timeout` (Redis 7.2, chờ fsync AOF) giảm rủi ro nhưng **không biến Redis thành strongly consistent**.

**Lưu ý / bẫy thường gặp:** master **không bật persistence** + bật auto-restart là tình huống nguy hiểm: master restart với dataset rỗng, các replica sync lại từ nó và **xóa sạch dữ liệu của chính mình**. Nếu tắt persistence ở master thì phải tắt auto-restart hoặc để Sentinel failover trước.

## Chiến lược backup và restore Redis ở production? [mid]
**Backup:**
- **RDB là định dạng backup chuẩn**: copy file `dump.rdb` khi nó hoàn chỉnh (Redis ghi file tạm rồi rename atomic nên copy lúc nào cũng an toàn). Với AOF 7.0+ phải copy cả thư mục `appendonlydir/` (tốt nhất tạm dừng rewrite: `CONFIG SET auto-aof-rewrite-percentage 0` khi copy).
- Chạy BGSAVE trên **replica** thay vì master để tránh fork ảnh hưởng latency của master.
- Lịch: snapshot mỗi giờ giữ 48 bản, mỗi ngày giữ 30 bản; đẩy ra object storage (S3/Azure Blob) ở **region khác**, mã hóa.
- Managed: ElastiCache automatic snapshot (retention tối đa 35 ngày), Azure Cache Premium có RDB/AOF persistence ra storage account, export/import RDB.

**Restore:**
1. Dừng Redis, đặt file RDB vào `dir` với tên `dbfilename`.
2. Nếu đang bật AOF: Redis sẽ ưu tiên load AOF → phải tắt `appendonly` khi khởi động lần đầu, sau đó `CONFIG SET appendonly yes` để sinh AOF mới từ dữ liệu đã load.
3. Kiểm tra `INFO keyspace`, `DBSIZE`, so sánh với số liệu trước sự cố.

**Kiểm tra định kỳ:** tự động restore backup vào môi trường staging hằng tuần và chạy `redis-check-rdb` — backup chưa từng restore thử là backup không đáng tin.

**Lưu ý / bẫy thường gặp:** backup không bảo vệ khỏi `FLUSHALL` vô tình nếu chỉ dựa vào replica — lệnh này được replicate ngay. Cần backup point-in-time và ACL chặn lệnh nguy hiểm. Với Cluster phải backup **mọi shard** và lưu kèm slot mapping.

# Memory Management

## maxmemory và các eviction policy hoạt động thế nào? Chọn policy nào cho cache, cho session? [mid]
`maxmemory` giới hạn bộ nhớ dữ liệu; khi vượt, Redis áp dụng `maxmemory-policy` **trước khi thực thi lệnh ghi**.

| Policy | Phạm vi | Cách chọn key xóa |
|---|---|---|
| `noeviction` (mặc định) | — | Không xóa, trả lỗi `OOM command not allowed` cho lệnh ghi |
| `allkeys-lru` | Mọi key | Ít được dùng gần đây nhất |
| `allkeys-lfu` (4.0+) | Mọi key | Ít được dùng thường xuyên nhất |
| `allkeys-random` | Mọi key | Ngẫu nhiên |
| `volatile-lru` / `volatile-lfu` / `volatile-random` | Chỉ key có TTL | Như trên |
| `volatile-ttl` | Chỉ key có TTL | TTL còn lại ngắn nhất |

**Chọn policy:**
- **Redis thuần cache**: `allkeys-lru` (an toàn mặc định) hoặc `allkeys-lfu` khi có tập hot key ổn định và nhiều key "đọc một lần" (LFU chống bị scan làm bẩn cache).
- **Redis vừa cache vừa lưu dữ liệu quan trọng** (session, queue không TTL): `volatile-lru` — chỉ key cache có TTL bị xóa. Tốt hơn hết là **tách instance**.
- **Queue/Stream/lock là dữ liệu chính**: `noeviction` + alert memory, để lỗi rõ ràng thay vì âm thầm mất job.

```bash
CONFIG SET maxmemory 12gb
CONFIG SET maxmemory-policy allkeys-lfu
INFO stats    # evicted_keys, keyspace_hits, keyspace_misses
```

**Lưu ý / bẫy thường gặp:** `volatile-*` mà không key nào có TTL thì hành xử như `noeviction`. Đặt `maxmemory` khoảng **60-75% RAM máy** để chừa chỗ cho fork COW, output buffer, replication backlog và fragmentation. Theo dõi `evicted_keys` tăng đột biến = cache quá nhỏ hoặc có key rác không TTL.

## Redis cài đặt LRU và LFU "xấp xỉ" như thế nào? [senior]
**Vì sao xấp xỉ:** LRU chính xác cần doubly linked list cho mọi key (2 pointer = 16 byte/key) và cập nhật list mỗi lần truy cập — tốn bộ nhớ và CPU. Redis chọn **sampling**.

**Approximated LRU:**
- Mỗi `redisObject` có trường 24-bit lưu **thời điểm truy cập cuối** (độ phân giải giây, theo LRU clock).
- Khi cần evict: lấy mẫu ngẫu nhiên `maxmemory-samples` key (mặc định 5), đưa vào **eviction pool** 16 phần tử (giữ ứng viên tốt nhất qua nhiều lần lấy mẫu), xóa key idle lâu nhất.
- `maxmemory-samples 10` cho kết quả rất gần LRU thật nhưng tốn CPU hơn.

**LFU (Redis 4.0):** cùng 24 bit đó được chia:
```text
[ 16 bit: thời điểm decrement cuối (phút) ][ 8 bit: counter logarithmic (0-255) ]
```
- Counter là **Morris counter** (xác suất): mỗi lần truy cập, tăng với xác suất `1 / ((counter - 5) * lfu-log-factor + 1)`. Với `lfu-log-factor 10`, ~1 triệu lượt truy cập mới đạt 255.
- **Decay**: counter giảm 1 mỗi `lfu-decay-time` phút (mặc định 1) không được truy cập → key từng hot nhưng nay nguội sẽ bị evict dần.
- Key mới có counter khởi tạo = 5 để không bị evict ngay.

```bash
OBJECT IDLETIME key     # khi dùng LRU policy
OBJECT FREQ key         # khi dùng LFU policy
```

**Vì sao LFU tốt hơn cho cache:** một lần full scan (batch job đọc hết catalog) làm LRU đẩy hot key ra ngoài; LFU giữ được key có tần suất cao.

**Lưu ý / bẫy thường gặp:** `--hotkeys` chỉ chạy được khi policy là LFU (vì cần counter). Eviction xảy ra trong main thread khi lệnh ghi đến — nếu phải evict nhiều key lớn liên tục, latency tăng; bật `lazyfree-lazy-eviction yes` để giải phóng ở background.

## Memory fragmentation là gì? activedefrag và các mẹo tối ưu bộ nhớ Redis? [senior]
**Fragmentation:** Redis dùng jemalloc; sau nhiều lần tạo/xóa/sửa key kích thước khác nhau, các page bị "lỗ chỗ", OS không thu hồi được → RSS lớn hơn nhiều so với dữ liệu thực.

```bash
INFO memory
# used_memory: 8.00G         <- dữ liệu Redis cấp phát
# used_memory_rss: 12.50G    <- OS thấy process chiếm
# mem_fragmentation_ratio: 1.56
MEMORY DOCTOR
MEMORY STATS
```
- Ratio ~1.0-1.5: bình thường. > 1.5: fragmentation cao.
- **< 1.0**: nguy hiểm — một phần Redis bị **swap** ra disk, latency tăng hàng trăm lần.

**Active defragmentation (4.0+, cần jemalloc):** Redis chủ động di chuyển giá trị sang vùng nhớ liền mạch, chạy dần trong main thread với giới hạn CPU:
```bash
CONFIG SET activedefrag yes
active-defrag-ignore-bytes 100mb
active-defrag-threshold-lower 10      # bắt đầu khi frag > 10%
active-defrag-cycle-min 1             # % CPU tối thiểu
active-defrag-cycle-max 25
```
Cách thô hơn: failover sang replica (replica load lại từ RDB nên gần như không phân mảnh) rồi restart master cũ.

**Mẹo tối ưu bộ nhớ:**
1. Tận dụng **listpack**: gom key nhỏ vào hash bucket (Instagram pattern).
2. Key name ngắn, bỏ prefix thừa; mỗi key có overhead ~50-70 byte (dictEntry + redisObject + SDS).
3. Serialize gọn: MessagePack/Protobuf thay JSON, nén (LZ4/zstd) cho value > 1KB.
4. **Luôn đặt TTL** cho cache; dọn key không TTL bằng SCAN định kỳ.
5. Dùng cấu trúc xác suất: HyperLogLog thay Set cho UV, Bloom filter thay Set để check tồn tại.
6. Integer nhỏ dùng shared object; Set toàn số dùng intset.
7. Giới hạn **client output buffer** (`client-output-buffer-limit`) — client Pub/Sub chậm có thể tích buffer hàng GB.

**Lưu ý / bẫy thường gặp:** `used_memory` thấp nhưng RSS cao sau khi xóa nhiều key là bình thường — jemalloc giữ lại; `MEMORY PURGE` có thể trả bớt cho OS. Nhớ cộng cả **replication backlog**, **AOF buffer** và **client buffer** khi capacity planning.

# High Availability và Scaling

## Replication trong Redis hoạt động thế nào? PSYNC, replication backlog và full resync? [mid]
Redis replication là **master → replica, bất đồng bộ**, replica mặc định read-only.

**Quá trình đồng bộ:**
1. Replica gửi `PSYNC <replid> <offset>` (replication ID của master + offset đã nhận).
2. **Partial resync** (`+CONTINUE`): nếu replid khớp và offset còn nằm trong **replication backlog** (circular buffer ở master, `repl-backlog-size` mặc định 1MB) → master chỉ gửi phần thiếu.
3. **Full resync** (`+FULLRESYNC`): ngược lại, master BGSAVE tạo RDB, gửi cho replica (hoặc **diskless** — stream thẳng qua socket với `repl-diskless-sync yes`), trong lúc đó buffer các lệnh mới rồi gửi tiếp. Replica xóa dữ liệu cũ và load RDB.
4. Sau đó master stream liên tục mọi lệnh ghi; replica gửi `REPLCONF ACK <offset>` mỗi giây.

**PSYNC2 (Redis 4.0):** sau failover, replica mới được promote giữ **replid2** của master cũ → các replica khác vẫn partial resync với master mới thay vì full sync toàn bộ.

```bash
INFO replication   # role, master_repl_offset, slaveN: offset, lag; master_link_status
REPLICAOF 10.0.0.1 6379
```

**Hạn chế split-brain phía master:**
```bash
min-replicas-to-write 1
min-replicas-max-lag 10     # master từ chối ghi nếu không có ≥1 replica lag ≤10s
```

**Lưu ý / bẫy thường gặp:** backlog 1MB quá nhỏ cho master ghi nhiều — một lần đứt mạng vài giây cũng gây **full resync** (fork + gửi vài chục GB), có thể lặp vô hạn nếu `client-output-buffer-limit replica` cũng nhỏ. Đặt backlog = tốc độ ghi × thời gian đứt mạng dự kiến (ví dụ 256MB-1GB).

## Redis Sentinel hoạt động thế nào? Quorum, failover và cách client kết nối? [mid]
**Sentinel** là hệ thống process riêng giám sát master/replica và tự động failover — dùng khi **dữ liệu vừa một node** nhưng cần HA.

**Cơ chế:**
1. **Monitoring**: mỗi Sentinel PING master/replica/Sentinel khác mỗi giây; tự khám phá replica qua `INFO` và Sentinel khác qua kênh Pub/Sub `__sentinel__:hello`.
2. **SDOWN** (subjectively down): một Sentinel không nhận phản hồi hợp lệ trong `down-after-milliseconds`.
3. **ODOWN** (objectively down): đủ **quorum** Sentinel cùng báo SDOWN.
4. **Leader election**: các Sentinel bầu leader theo kiểu Raft; cần **đa số (majority)** Sentinel đồng ý — quorum chỉ để phát hiện, majority để được phép failover.
5. **Failover**: leader chọn replica tốt nhất (`replica-priority` → offset lớn nhất → run ID nhỏ nhất), gửi `REPLICAOF NO ONE`, cấu hình các replica khác theo master mới, cập nhật config epoch.

```bash
sentinel monitor mymaster 10.0.0.1 6379 2      # quorum = 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
```

**Triển khai:** tối thiểu **3 Sentinel** trên 3 máy/AZ độc lập (2 Sentinel không có majority khi 1 chết).

**Client:** không hardcode IP master mà hỏi Sentinel `SENTINEL get-master-addr-by-name mymaster` và đăng ký kênh `+switch-master` để kết nối lại. StackExchange.Redis: `serviceName=mymaster` trong connection string; ioredis: option `sentinels: [...]`, `name: 'mymaster'`.

**Lưu ý / bẫy thường gặp:** `down-after-milliseconds` quá nhỏ + một lệnh chậm (KEYS, fork lớn) → failover giả, mất dữ liệu async. Sentinel không giải quyết bài toán **scale ghi** hay dữ liệu lớn hơn RAM một node.

## Redis Cluster phân chia dữ liệu như thế nào? Hash slot, hash tag, MOVED và ASK? [senior]
**Hash slot:** keyspace chia cố định thành **16384 slot**; `slot = CRC16(key) mod 16384`; mỗi master giữ một tập slot, mỗi master có replica riêng. Cluster tự failover (không cần Sentinel) — các node trao đổi trạng thái qua **cluster bus** (gossip, port = port + 10000).

**Vì sao 16384:** bitmap slot trong heartbeat chỉ 2KB; Cluster khuyến nghị ≤1000 node nên đủ chi tiết để cân bằng.

**Hash tag:** nếu key chứa `{...}`, chỉ phần trong ngoặc được hash → ép nhiều key vào cùng slot:
```bash
SET {user:1001}:profile ...
SET {user:1001}:cart ...
MULTI / Lua trên 2 key này hợp lệ vì cùng slot
CLUSTER KEYSLOT "{user:1001}:cart"
```

**Redirect:**
- **MOVED 3999 10.0.0.5:6379**: slot đã thuộc node khác **vĩnh viễn** → client cập nhật bảng slot cache rồi gửi lại.
- **ASK 3999 10.0.0.6:6379**: slot **đang migrate**; key có thể đã sang node đích → client gửi `ASKING` rồi lệnh tới node đích **chỉ lần này**, không cập nhật bảng slot.

**Resharding:** `redis-cli --cluster reshard` / `rebalance`; slot được chuyển bằng `CLUSTER SETSLOT ... MIGRATING/IMPORTING` + `MIGRATE` từng batch key. Online nhưng big key có thể làm `MIGRATE` chặn lâu.

**Giới hạn của Cluster:**
- Lệnh multi-key (`MGET`, `SUNION`, `RENAME`), MULTI, Lua chỉ chạy khi **mọi key cùng slot** (lỗi `CROSSSLOT`).
- Chỉ có DB 0 (không `SELECT`).
- Pub/Sub thường broadcast tới mọi node → Redis 7 có **sharded Pub/Sub** (`SSUBSCRIBE`/`SPUBLISH`) gắn kênh vào slot.
- `cluster-require-full-coverage yes`: mất một slot (master + replica đều chết) → toàn cluster ngừng nhận lệnh.

**Lưu ý / bẫy thường gặp:** lạm dụng hash tag (mọi key `{tenant}`) tạo hot slot — mất lợi ích sharding. Cluster vẫn là async replication nên vẫn có thể mất ghi khi failover.

## Client-side sharding, proxy (Twemproxy/Envoy) và Redis Cluster khác nhau thế nào? [mid]
| Cách | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **Client-side sharding** | Client tự hash key (consistent hashing/ketama) tới N instance độc lập | Không thêm hop, đơn giản | Mỗi ngôn ngữ phải cùng thuật toán; thêm/bớt node phải tự migrate; không auto failover |
| **Proxy** (Twemproxy, Envoy Redis filter, Codis, KeyDB proxy) | Client nói chuyện với proxy như một Redis duy nhất; proxy route theo key | Client "ngây thơ" dùng được, ẩn topology, gom kết nối | Thêm hop latency, proxy là điểm cần HA, một số lệnh không hỗ trợ |
| **Redis Cluster** | Server-side sharding, client "cluster-aware" theo MOVED/ASK | Native, auto failover, resharding online | Client phải hỗ trợ cluster, giới hạn multi-key, vận hành phức tạp hơn |

**Twemproxy** (Twitter): nhẹ, nhưng không hỗ trợ resharding động và cluster mode — phần lớn đã lỗi thời. **Envoy** có Redis proxy hỗ trợ cả backend là Redis Cluster, kèm metrics, prefix routing, mirroring — hữu ích trong service mesh. **Managed**: Azure Cache non-cluster-aware mode, ElastiCache Serverless và Azure Managed Redis có proxy ẩn bên trong để client không phải xử lý MOVED.

**Khi nào dùng proxy:** nhiều ngôn ngữ/legacy client không hỗ trợ cluster; cần chuyển đổi topology phía sau mà không đổi client; cần connection pooling (hàng nghìn container kết nối).

**Lưu ý / bẫy thường gặp:** client-side sharding với `hash % N` (không phải consistent hashing) → thêm 1 node làm gần như toàn bộ key đổi chỗ → cold cache + stampede. Cluster dùng slot cố định nên thêm node chỉ di chuyển một phần slot.

## Split-brain và mất dữ liệu khi failover xảy ra như thế nào? Giảm thiểu ra sao? [senior]
**Kịch bản split-brain (Sentinel hoặc Cluster):**
```text
AZ-A: [Master M1] + client C1        |  network partition  |   AZ-B: Replica R1, Sentinel S2, S3
C1 vẫn ghi vào M1 (M1 không biết mình bị cô lập)
S2, S3 đạt majority -> promote R1 thành master mới; client khác ghi vào R1
Partition hết -> M1 bị đổi thành replica của R1 -> full sync -> mọi ghi của C1 vào M1 bị XÓA
```

**Các nguồn mất dữ liệu khi failover:**
1. Lệnh đã ack nhưng chưa kịp replicate (async replication) — luôn tồn tại.
2. Ghi vào master cũ bị cô lập trong thời gian partition (split-brain).
3. Failover lặp do timeout quá nhạy.

**Giảm thiểu:**
- `min-replicas-to-write 1` + `min-replicas-max-lag 10`: master bị cô lập (không thấy replica) **ngừng nhận ghi** sau ~10s → giới hạn cửa sổ mất dữ liệu. Đổi lại: replica chết hết thì master cũng từ chối ghi.
- Trong Cluster: `cluster-node-timeout` — master thiểu số tự ngừng nhận ghi sau khoảng timeout này.
- `WAIT 1 100` cho lệnh quan trọng: chờ ≥1 replica xác nhận (giảm nhưng không loại bỏ rủi ro: replica đã nhận chưa chắc được promote).
- Đặt Sentinel/node ở **3 AZ**, không để majority nằm cùng phía với master.
- Thiết kế app **idempotent** và coi Redis là dữ liệu có thể mất: rebuild cache từ DB, event từ source of truth.

**Lưu ý / bẫy thường gặp:** Redis (OSS) không phải hệ CP như etcd/ZooKeeper; câu trả lời đúng là "Redis ưu tiên availability và latency, đánh đổi bằng khả năng mất một ít ghi gần nhất". Nếu cần linearizable thì dùng etcd/ZooKeeper/DB, hoặc tham khảo các hệ khác (Redis Enterprise với WAIT + strong consistency options, MemoryDB với transaction log đa AZ).

## Managed Redis (ElastiCache, Azure Cache), thay đổi license 2024 và Valkey: cần biết gì? [mid]
**Thay đổi license:**
- Đến Redis 7.2: BSD-3 (mã nguồn mở thực sự).
- **Tháng 3/2024**, từ Redis 7.4: chuyển sang dual license **RSALv2 / SSPLv1** (source-available) — cloud provider không được bán Redis-as-a-service mà không có thỏa thuận.
- **Valkey**: fork từ Redis 7.2.4, do **Linux Foundation** quản lý, được AWS, Google, Oracle, Ericsson... hậu thuẫn, giữ BSD. Valkey 8.0 (2024) cải thiện multi-threaded I/O, tiết kiệm memory per-key; Valkey 8.1/9 tiếp tục tối ưu.
- **Redis 8 (2025)**: bổ sung lựa chọn **AGPLv3** (OSI-approved) bên cạnh RSAL/SSPL, tích hợp module Stack vào core.

**Managed services:**
| Dịch vụ | Ghi chú |
|---|---|
| **AWS ElastiCache** | Redis OSS và Valkey (Valkey rẻ hơn), cluster mode, Serverless, Global Datastore cross-region |
| **AWS MemoryDB** | Durable: ghi vào multi-AZ transaction log trước khi ack → dùng làm primary database |
| **Azure Cache for Redis** | Basic/Standard/Premium/Enterprise; đang được thay thế dần bởi **Azure Managed Redis** (dựa trên Redis Enterprise) |
| **GCP Memorystore** | Redis và Valkey |
| **Redis Cloud** | Redis Enterprise: active-active (CRDT) multi-region, Redis on Flash |

**Khi chọn:** kiểm tra version/tính năng (module, Functions), cluster mode và giới hạn lệnh (managed thường chặn `CONFIG`, `DEBUG`, `MODULE`), giá theo node/GB, cơ chế maintenance/patch (có failover!), hỗ trợ TLS và private endpoint.

**Lưu ý / bẫy thường gặp:** Valkey tương thích protocol nên StackExchange.Redis/ioredis dùng bình thường, nhưng tính năng mới từ Redis 7.4+ (ví dụ hash field expiration ban đầu, vector set, module Redis 8) có thể khác nhau giữa hai nhánh — đừng giả định chúng giống hệt nhau.

# Transactions, Scripting và Atomicity

## MULTI/EXEC/WATCH hoạt động thế nào? Vì sao Redis transaction không có rollback? [mid]
**MULTI/EXEC**: gom lệnh vào hàng đợi, `EXEC` thực thi **tuần tự, liên tục, không bị client khác chen vào** (isolation). `DISCARD` hủy hàng đợi.

```bash
MULTI
DECRBY stock:sku1 1
LPUSH orders:pending "o-123"
EXEC
```

**Không có rollback:**
- Lỗi **lúc queue** (sai cú pháp, sai số tham số) → cả transaction bị hủy khi EXEC (`EXECABORT`).
- Lỗi **lúc chạy** (ví dụ `INCR` trên key là list → `WRONGTYPE`) → chỉ lệnh đó lỗi, **các lệnh khác vẫn được áp dụng**.
- Lý do (theo tài liệu Redis): lỗi runtime thường là lỗi lập trình, không phải lỗi dữ liệu; bỏ rollback giữ Redis đơn giản và nhanh.

**WATCH — optimistic locking (check-and-set):**
```bash
WATCH balance:u1
GET balance:u1            # client đọc = 100, tính toán 100 - 30
MULTI
SET balance:u1 70
EXEC                      # trả nil nếu balance:u1 bị sửa sau WATCH -> client retry
```
Nếu key được WATCH bị thay đổi (kể cả hết hạn) trước EXEC, EXEC trả nil và không thực thi gì.

**Khi nào dùng gì:**
- Cần atomic đơn giản không có điều kiện → MULTI (hoặc chỉ pipeline nếu không cần atomic).
- Có logic điều kiện (đọc rồi quyết định) → **Lua script** gọn và hiệu quả hơn WATCH (không phải retry, ít round-trip).

**Lưu ý / bẫy thường gặp:** StackExchange.Redis **không hỗ trợ WATCH** theo kiểu cổ điển (vì multiplexing); thay vào đó dùng `ITransaction` với `AddCondition(Condition.StringEqual(...))` hoặc Lua. Trong Cluster, mọi key trong MULTI phải cùng slot.

## Lua script (EVAL/EVALSHA) đảm bảo atomicity thế nào? Những lưu ý khi viết script? [mid]
Script Lua chạy **trọn vẹn trên main thread**, không lệnh nào khác chen vào → toàn bộ logic đọc-quyết định-ghi là atomic, chỉ một round-trip.

```lua
-- Giảm tồn kho nếu còn đủ: KEYS[1]=stock key, ARGV[1]=qty
local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
local qty = tonumber(ARGV[1])
if stock < qty then
  return -1
end
return redis.call('DECRBY', KEYS[1], qty)
```
```bash
EVAL "<script>" 1 stock:sku1 2
SCRIPT LOAD "<script>"      # trả SHA1
EVALSHA <sha1> 1 stock:sku1 2   # lỗi NOSCRIPT nếu cache script bị mất (restart/failover) -> fallback EVAL
```

**Lưu ý khi viết script:**
1. **Truyền mọi key qua `KEYS[]`**, không tự build tên key trong script — để Cluster route đúng và kiểm tra cùng slot.
2. Script phải **nhanh**: không vòng lặp trên collection lớn. Quá `busy-reply-threshold` (mặc định 5s, tên cũ `lua-time-limit`) Redis trả `BUSY` cho client khác; chỉ có thể `SCRIPT KILL` nếu script chưa ghi gì, ngược lại phải `SHUTDOWN NOSAVE`.
3. `redis.call` ném lỗi và dừng script; `redis.pcall` trả lỗi dạng table để tự xử lý. Script cũng **không rollback** — những lệnh ghi trước lỗi vẫn giữ nguyên.
4. Từ Redis 5 replicate theo **effects** (lệnh ghi thực tế) nên dùng `TIME`, random trong script là an toàn.
5. Chuyển kiểu: Lua number → integer reply (bị cắt phần thập phân), `false` → nil. Trả số thực thì trả string.
6. Dùng `tonumber()` khi so sánh giá trị đọc từ Redis (luôn là string).

**Lưu ý / bẫy thường gặp:** EVAL với script sinh động (nối chuỗi tham số vào source) làm script cache phình vô hạn và tốn memory — luôn dùng script cố định + tham số.

## Redis Functions (7.0) khác Lua script EVAL như thế nào? [senior]
**Vấn đề của EVAL:** script là "tài sản" của app, không phải của server — script cache không được persist/replicate đáng tin cậy, mất khi restart/failover (client phải xử lý `NOSCRIPT`), mỗi service tự mang bản copy, khó version và chia sẻ.

**Redis Functions (Redis 7.0):** script được nạp thành **library** là một phần dữ liệu của database: được **persist vào RDB/AOF và replicate** tới replica, có tên rõ ràng.

```lua
#!lua name=inventory

local function reserve(keys, args)
  local stock = tonumber(redis.call('GET', keys[1]) or '0')
  local qty = tonumber(args[1])
  if stock < qty then return -1 end
  return redis.call('DECRBY', keys[1], qty)
end

local function get_stock(keys, args)
  return redis.call('GET', keys[1])
end

redis.register_function('reserve', reserve)
redis.register_function{function_name='get_stock', callback=get_stock, flags={'no-writes'}}
```
```bash
cat inventory.lua | redis-cli -x FUNCTION LOAD REPLACE
FCALL reserve 1 stock:sku1 2
FCALL_RO get_stock 1 stock:sku1      # chạy được trên replica nhờ flag no-writes
FUNCTION LIST
FUNCTION DUMP / FUNCTION RESTORE     # di chuyển library giữa môi trường
```

**So sánh:**
| | EVAL/EVALSHA | Functions |
|---|---|---|
| Lưu trữ | Script cache tạm | Persist + replicate |
| Gọi | Bằng source/SHA1 | Bằng tên |
| Chia sẻ code | Không | Function trong cùng library gọi lẫn nhau |
| Read-only trên replica | `EVAL_RO` (7.0) | flag `no-writes` + `FCALL_RO` |
| Atomicity | Như nhau | Như nhau |

**Khi chọn Functions:** logic dùng chung nhiều service (rate limiter chuẩn của công ty, inventory), cần quản lý version như migration.

**Lưu ý / bẫy thường gặp:** Functions giống stored procedure — đưa quá nhiều business logic vào Redis gây khó test và deploy. Trong Cluster phải `FUNCTION LOAD` lên **mọi master** (redis-cli `--cluster call`). Managed service/Valkey: kiểm tra đã hỗ trợ.

## Pipelining khác transaction thế nào? Khi nào dùng pipeline? [junior]
**Pipelining**: client gửi nhiều lệnh liên tiếp **không chờ** reply từng lệnh, sau đó đọc tất cả reply. Mục tiêu là giảm **RTT** (round-trip time) và syscall.

```text
Không pipeline:  [SET]→←[OK] [SET]→←[OK] [SET]→←[OK]     3 RTT
Pipeline:        [SET][SET][SET]→    ←[OK][OK][OK]       1 RTT
```
Với RTT 1ms, 10.000 lệnh tuần tự mất ~10s; pipeline batch 1000 lệnh chỉ ~10-50ms.

| | Pipeline | MULTI/EXEC | Lua |
|---|---|---|---|
| Mục đích | Hiệu năng mạng | Atomic/isolation | Atomic + logic điều kiện |
| Client khác chen vào giữa | Có | Không | Không |
| Dùng kết quả lệnh trước cho lệnh sau | Không | Không | Có |

Có thể kết hợp: gửi MULTI...EXEC trong một pipeline.

```javascript
// ioredis
const pipeline = redis.pipeline();
for (const id of ids) pipeline.hgetall(`user:${id}`);
const results = await pipeline.exec();   // [[err, value], ...]
```
```csharp
// StackExchange.Redis: các lệnh async gửi liên tiếp tự được pipeline trên cùng connection
var tasks = ids.Select(id => db.StringGetAsync($"user:{id}")).ToArray();
var values = await Task.WhenAll(tasks);
// hoặc IBatch: var batch = db.CreateBatch(); ... batch.Execute();
```

**Lưu ý / bẫy thường gặp:** pipeline quá lớn (1 triệu lệnh một lần) làm server phải buffer toàn bộ reply trong memory — chia batch 100-1000 lệnh. Trong Cluster, client phải tách pipeline theo node; ioredis có `enableAutoPipelining` gom lệnh tự động trong cùng event loop tick.

## Viết distributed lock bằng Redis đúng cách: SET NX PX, token, release bằng Lua, gia hạn lock? [senior]
**Acquire:** atomic, có TTL, **giá trị là token duy nhất** của người giữ:
```bash
SET lock:order:123 "c7f1-uuid" NX PX 30000
```

**Release:** chỉ xóa nếu đúng token (tránh xóa lock của client khác khi lock của mình đã hết hạn và người khác đã lấy):
```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
```

**Gia hạn (watchdog):** công việc có thể lâu hơn TTL → background task gia hạn định kỳ (mỗi TTL/3), cũng phải kiểm tra token:
```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
return 0
```
Redisson (Java) có watchdog mặc định 30s; .NET có `RedLock.net`, `Medallion.Threading.Redis`; StackExchange.Redis có sẵn `LockTakeAsync/LockExtendAsync/LockReleaseAsync` cài theo đúng nguyên tắc token.

```csharp
var token = Guid.NewGuid().ToString();
if (await db.LockTakeAsync("lock:order:123", token, TimeSpan.FromSeconds(30)))
{
    try { await ProcessAsync(); }
    finally { await db.LockReleaseAsync("lock:order:123", token); }
}
```

**Các vấn đề còn lại:**
- **Process pause** (GC stop-the-world, VM bị freeze): client tưởng còn giữ lock nhưng đã hết hạn → hai người cùng ghi. Chỉ **fencing token** ở tầng storage mới chặn được.
- **Failover**: lock chưa replicate → mất lock (xem câu Redlock).
- Không có hàng đợi công bằng: client chờ phải retry với backoff + jitter, hoặc dùng Pub/Sub để báo khi lock được nhả.
- Reentrant lock cần Hash `{owner: count}`.

**Lưu ý / bẫy thường gặp:** đặt TTL quá ngắn (nhỏ hơn p99 thời gian xử lý) mà không có watchdog là lỗi phổ biến nhất. Trước khi dùng lock, hỏi lại: có thể dùng **idempotency key**, unique constraint DB hoặc optimistic concurrency (row version) thay thế không?

## Redlock là gì và vì sao Martin Kleppmann phản biện? Fencing token giải quyết gì? [senior]
**Redlock (antirez):** dùng N (thường 5) Redis master **độc lập** (không replication):
1. Ghi lại thời gian bắt đầu, lần lượt `SET key token NX PX ttl` trên từng node với timeout ngắn.
2. Thành công nếu lấy được trên **≥ N/2+1** node và tổng thời gian lấy < TTL; thời gian hiệu lực còn lại = TTL − thời gian đã tốn − clock drift.
3. Thất bại → release trên mọi node.

Ý tưởng: tránh vấn đề một master chết mất lock khi chưa replicate.

**Phản biện của Martin Kleppmann (2016, "How to do distributed locking"):**
1. **Không có fencing**: client bị GC pause/ngắt mạng sau khi lấy lock; lock hết hạn, client B lấy lock và ghi; client A tỉnh dậy vẫn ghi → hỏng dữ liệu. Redlock không sinh số tăng dần để storage từ chối A.
2. **Phụ thuộc giả định timing**: an toàn chỉ khi clock drift, network delay, process pause bị chặn trên — hệ phân tán thực tế là **asynchronous model**, giả định này không đảm bảo. Ví dụ clock jump trên một node làm key hết hạn sớm → hai client cùng có majority.
3. Kết luận: nếu lock vì **hiệu năng** thì một Redis đơn là đủ, Redlock là thừa; nếu lock vì **đúng đắn** thì Redlock không đủ, nên dùng ZooKeeper/etcd + fencing.

antirez phản hồi rằng Redlock dùng thời gian tương đối (monotonic) và có thể kiểm tra lại sau khi hoàn thành; cuộc tranh luận chưa ngã ngũ hoàn toàn, nhưng quan điểm của Kleppmann được giới distributed systems chấp nhận rộng rãi.

**Fencing token:**
```text
Lock service cấp token tăng đơn điệu: A nhận 33, B nhận 34
Storage ghi nhận token lớn nhất đã thấy; A (33) đến sau B (34) -> bị từ chối
```
Hiện thực: etcd revision, ZooKeeper zxid; trong DB: `UPDATE ... WHERE fence_token < @token` hoặc row version.

**Lưu ý / bẫy thường gặp:** có thể dùng `INCR` trên Redis để sinh fencing token, nhưng sau failover counter có thể lùi lại (async replication) → không an toàn tuyệt đối. Câu trả lời senior: phân loại lock theo mục đích (efficiency vs correctness) rồi chọn công cụ.

## Implement rate limiter bằng Redis: fixed window, sliding window log/counter, token bucket? [senior]
**1. Fixed window (INCR + EXPIRE):**
```lua
local c = redis.call('INCR', KEYS[1])          -- KEYS[1] = rl:{u1}:202610151030
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return c
```
Rẻ nhất (1 key/window). Nhược: **burst ở biên** — 100 req cuối window cũ + 100 req đầu window mới = 200 trong 1s. Phải gộp INCR và EXPIRE trong Lua, nếu không có thể tạo key không bao giờ hết hạn.

**2. Sliding window log (Sorted Set):** lưu timestamp từng request, chính xác tuyệt đối:
```lua
-- KEYS[1]=rl:{u1}, ARGV: now_ms, window_ms, limit, request_id
local now, win, limit = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - win)
if redis.call('ZCARD', KEYS[1]) >= limit then
  return 0
end
redis.call('ZADD', KEYS[1], now, ARGV[4])
redis.call('PEXPIRE', KEYS[1], win)
return 1
```
Nhược: bộ nhớ O(limit) mỗi user — limit 10.000 req/giờ × 1 triệu user là quá đắt. `request_id` phải duy nhất (không dùng chính `now` vì trùng ms sẽ ghi đè member).

**3. Sliding window counter (xấp xỉ):** giữ counter window hiện tại và trước:
```text
estimate = prev_count * (1 - elapsed_in_current / window) + curr_count
```
Chỉ 2 key, sai số nhỏ (Cloudflare báo ~0.003% request bị xử lý sai) — lựa chọn cân bằng nhất cho API gateway.

**4. Token bucket:** Hash `{tokens, last_refill}`, Lua tính refill theo thời gian trôi qua, cho phép burst đến capacity và tốc độ trung bình cố định (chi tiết ở phần System Design). **GCRA** (thư viện redis-cell, `CL.THROTTLE`) là biến thể chỉ cần lưu một timestamp.

**Lưu ý / bẫy thường gặp:** dùng `redis.call('TIME')` trong script thay vì thời gian client để tránh clock skew giữa các app server; key theo hash tag `{u1}` nếu có nhiều key/user trong Cluster; trả header `X-RateLimit-Remaining`, `Retry-After`; quyết định **fail-open/fail-closed** khi Redis không phản hồi.

# Messaging với Redis

## Redis Pub/Sub hoạt động thế nào và hạn chế gì? Sharded Pub/Sub ở Redis 7? [mid]
**Pub/Sub** là mô hình **fire-and-forget**: publisher gửi message tới channel, Redis đẩy ngay tới các subscriber **đang kết nối**.

```bash
SUBSCRIBE cache:invalidate
PSUBSCRIBE order:*            # pattern
PUBLISH cache:invalidate "product:123"    # trả số subscriber đã nhận
```

**Hạn chế:**
1. **Không persistence**: không lưu message; subscriber offline/đang reconnect là **mất message vĩnh viễn**.
2. **At-most-once**, không ack, không retry, không consumer group (mọi subscriber đều nhận — broadcast).
3. Subscriber chậm → message tích trong **output buffer** của Redis; vượt `client-output-buffer-limit pubsub 32mb 8mb 60` thì client bị ngắt kết nối.
4. Connection ở chế độ subscribe chỉ dùng được lệnh subscribe/ping (RESP2) → cần connection riêng (StackExchange.Redis tự quản lý).
5. Trong **Cluster** (trước 7.0), `PUBLISH` được broadcast tới **mọi node** qua cluster bus → không scale, tốn băng thông khi cluster lớn.

**Sharded Pub/Sub (Redis 7.0):** `SSUBSCRIBE`/`SPUBLISH` gán channel vào hash slot như key; message chỉ đi trong shard sở hữu slot → scale ngang theo cluster.

**Use case phù hợp:** invalidate local cache (L1) trên mọi instance, broadcast notification realtime tới các WebSocket server (SignalR Redis backplane, Socket.IO redis-adapter), tín hiệu cấu hình thay đổi — tức là những nơi **mất message chấp nhận được** hoặc có cơ chế bù (TTL).

**Lưu ý / bẫy thường gặp:** đừng dùng Pub/Sub làm job queue hoặc truyền event nghiệp vụ (đơn hàng, thanh toán). Keyspace notifications (`notify-keyspace-events Ex` cho sự kiện hết hạn) cũng là Pub/Sub nên **không đảm bảo** nhận được, và sự kiện expired chỉ phát khi key thực sự bị xóa (lazy/active), không đúng thời điểm TTL.

## Redis Streams và consumer group hoạt động thế nào? PEL, XACK, XAUTOCLAIM? [senior]
**Stream** là log append-only; mỗi entry có ID `<ms>-<seq>` tăng dần và một tập field-value.

```bash
XADD orders MAXLEN ~ 1000000 * orderId 123 status created   # * = ID tự sinh; ~ trim xấp xỉ (hiệu quả)
XGROUP CREATE orders billing $ MKSTREAM                       # $ = chỉ nhận message mới; 0 = từ đầu
XREADGROUP GROUP billing worker-1 COUNT 10 BLOCK 5000 STREAMS orders >
XACK orders billing 1767225600000-0
XPENDING orders billing - + 10                                # message đã giao chưa ack
XAUTOCLAIM orders billing worker-2 60000 0-0 COUNT 10         # 6.2: nhận lại message pending > 60s
XINFO GROUPS orders
```

**Consumer group:**
- Mỗi group có `last_delivered_id`; trong group, mỗi message giao cho **một** consumer (load balancing). Nhiều group độc lập cùng đọc toàn bộ stream (fan-out) — giống Kafka consumer group.
- `>` nghĩa là "message chưa giao cho ai trong group". Đọc với ID cụ thể (ví dụ `0`) là đọc lại **PEL của chính consumer đó** — dùng khi consumer restart.

**PEL (Pending Entries List):** message đã giao nhưng chưa `XACK`, lưu consumer nhận, thời điểm giao, **delivery count**. Đây là nền tảng **at-least-once**.

**Xử lý consumer chết:** worker khác định kỳ `XAUTOCLAIM` (hoặc `XPENDING` + `XCLAIM`) các message idle quá ngưỡng. Message có delivery count > N (ví dụ 5) → chuyển sang dead-letter stream rồi `XACK` để không lặp vô hạn.

**Trimming:** `MAXLEN ~ N` hoặc `MINID ~ <id>` (6.2, theo thời gian). Trim có thể xóa message chưa ack (PEL chỉ giữ ID) → cần chọn retention đủ lớn.

**Lưu ý / bẫy thường gặp:** at-least-once nghĩa là consumer **phải idempotent**. Stream nằm trên một key → một node trong Cluster; muốn scale phải tự partition thành nhiều stream (`orders:{0..15}`). Replication async nên ack vẫn có thể mất khi failover.

## Dùng List làm reliable queue như thế nào? BRPOPLPUSH/BLMOVE và delayed queue? [mid]
**Queue đơn giản:** producer `LPUSH`, consumer `BRPOP` — nhưng message bị lấy ra khỏi Redis **ngay khi pop**; consumer crash trong lúc xử lý là **mất job**.

**Reliable queue pattern:** pop và đồng thời chuyển atomic sang list "processing":
```bash
LPUSH queue:email '{"id":"j1",...}'
BLMOVE queue:email queue:email:processing:worker1 RIGHT LEFT 5   # Redis 6.2; thay BRPOPLPUSH (deprecated)
# xử lý xong:
LREM queue:email:processing:worker1 1 '{"id":"j1",...}'
```
Một **reaper** định kỳ kiểm tra list processing của worker đã chết (heartbeat key hết hạn) và đẩy job về queue chính → at-least-once. Có thể dùng `LMOVE` vòng (source = destination) để làm **circular list** cho việc kiểm tra định kỳ.

**Delayed queue bằng Sorted Set:** score = thời điểm chạy:
```lua
-- Lấy job đến hạn và chuyển sang ready queue atomic
local jobs = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, 100)
for _, j in ipairs(jobs) do
  redis.call('ZREM', KEYS[1], j)
  redis.call('LPUSH', KEYS[2], j)
end
return #jobs
```

**Thư viện dựng sẵn:** BullMQ (Node.js, dùng Streams + Lua, có retry/backoff/delay/priority/rate limit), Sidekiq (Ruby), Celery (Python, Redis broker), Hangfire.Redis (.NET), Asynq (Go).

**Lưu ý / bẫy thường gặp:** `LREM` là O(N) — list processing phải nhỏ (mỗi worker một list). Với nhu cầu ack, retry, nhiều consumer group, replay thì **Streams hoặc thư viện như BullMQ** tốt hơn tự viết. Đặt `maxmemory-policy noeviction` cho instance chứa queue.

## So sánh Redis (Pub/Sub, Streams) với Kafka và RabbitMQ. Khi nào nên dùng Redis làm message broker? [senior]
| Tiêu chí | Redis Pub/Sub | Redis Streams | Kafka | RabbitMQ |
|---|---|---|---|---|
| Lưu trữ | Không | RAM (+RDB/AOF) | Disk, retention ngày/tuần/vĩnh viễn | Disk/RAM, xóa sau ack |
| Delivery | At-most-once | At-least-once (PEL, ack) | At-least-once / exactly-once (transactions) | At-least-once, ack, DLX |
| Replay | Không | Có (theo ID) | Có (theo offset) | Hạn chế (Streams của RabbitMQ 3.9+ thì có) |
| Throughput | Rất cao, latency thấp nhất | Cao, giới hạn RAM | Rất cao, scale theo partition | Trung bình-cao |
| Ordering | Theo channel | Theo stream | Theo partition | Theo queue (1 consumer) |
| Routing | Channel/pattern | Không | Topic/partition key | Exchange: direct/topic/fanout/headers |
| Scale | Sharded Pub/Sub (7.0) | Tự partition nhiều stream | Native partition | Quorum queue, sharding plugin |
| Vận hành | Có sẵn nếu đã có Redis | Có sẵn | Nặng (KRaft đỡ hơn ZooKeeper) | Trung bình |

**Chọn Redis khi:**
- Đã có Redis, khối lượng vừa phải, message ngắn hạn (giờ/ngày), cần latency dưới ms.
- Job queue cho background task (BullMQ/Sidekiq), realtime notification, cache invalidation.
- Không muốn thêm hạ tầng mới cho một nhu cầu nhỏ.

**Chọn Kafka khi:** event streaming lớn, retention dài, nhiều consumer độc lập replay lịch sử, event sourcing, CDC, analytics pipeline.

**Chọn RabbitMQ khi:** routing phức tạp, priority queue, per-message TTL, request/reply, tích hợp enterprise (AMQP), cần đảm bảo ack mạnh với khối lượng vừa.

**Lưu ý / bẫy thường gặp:** chi phí RAM là giới hạn thực tế của Streams — 1 tỷ event × 500 byte = 500GB RAM, trong khi Kafka lưu trên disk rẻ. Durability của Redis kém hơn (async replication, fsync everysec); với event nghiệp vụ quan trọng, kết hợp **transactional outbox** ở DB rồi publish sang broker.

# Redis trong .NET/Node.js và vận hành Production

## Dùng StackExchange.Redis đúng cách: ConnectionMultiplexer, async, timeout và thread pool? [mid]
**ConnectionMultiplexer phải là singleton**: nó thread-safe, **multiplex** mọi lệnh của mọi thread trên một (hoặc vài) kết nối TCP, tự reconnect. Tạo mới mỗi request → handshake/TLS tốn kém, cạn socket, rò kết nối.

```csharp
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var options = ConfigurationOptions.Parse(builder.Configuration["Redis:ConnectionString"]!);
    options.AbortOnConnectFail = false;     // khởi động app khi Redis chưa sẵn sàng, tự retry
    options.ConnectTimeout = 5000;
    options.SyncTimeout = 2000;             // mặc định 5000ms
    options.AsyncTimeout = 2000;
    options.ConnectRetry = 3;
    options.ReconnectRetryPolicy = new ExponentialRetry(5000);
    return ConnectionMultiplexer.Connect(options);
});

public class ProductCache(IConnectionMultiplexer mux)
{
    private readonly IDatabase _db = mux.GetDatabase();   // IDatabase rẻ, không cần cache
    public Task<RedisValue> GetAsync(string key) => _db.StringGetAsync(key);
    public Task FireAndForgetAsync(string key) =>
        _db.KeyExpireAsync(key, TimeSpan.FromMinutes(5), flags: CommandFlags.FireAndForget);
}
```

**Đọc lỗi timeout kinh điển:**
```text
Timeout performing GET (2000ms), inst: 0, qu: 0, qs: 120, in: 65536,
IOCP: (Busy=0,Free=1000,Min=8,Max=1000), WORKER: (Busy=250,Free=32517,Min=8,Max=32767)
```
- `WORKER Busy` > `Min` → **thread pool starvation** (thường do sync-over-async `.Result`/`.Wait()`): thread pool chỉ tăng ~1 thread/giây nên reply về không có thread xử lý. Sửa: async toàn bộ, hoặc `ThreadPool.SetMinThreads` như giải pháp tạm.
- `qs` lớn: nhiều lệnh đã gửi chờ reply → server chậm (big key, lệnh O(N)) hoặc network băng thông thấp.
- `in` lớn: dữ liệu đã đến socket nhưng client chưa đọc kịp → CPU client cao hoặc value quá lớn.

**Lưu ý / bẫy thường gặp:** StackExchange.Redis không hỗ trợ lệnh blocking (`BLPOP`, `BRPOP`) trên connection chung vì sẽ chặn mọi lệnh khác. Value lớn (vài MB) trên connection multiplex gây **head-of-line blocking** cho các lệnh nhỏ phía sau. Dùng `CommandFlags.PreferReplica` để đọc từ replica khi chấp nhận lag.

## IDistributedCache, HybridCache (.NET 9) và Output Caching khác nhau thế nào? Dùng Redis làm session store? [mid]
**IDistributedCache** (`Microsoft.Extensions.Caching.StackExchangeRedis`): abstraction tối thiểu với `byte[]` — `Get/Set/Refresh/Remove`. Tự lưu dưới dạng **Hash** (`data`, `absexp`, `sldexp`) để hỗ trợ sliding expiration. Không có stampede protection, không L1, phải tự serialize.

**HybridCache** (`Microsoft.Extensions.Caching.Hybrid`, ra mắt cùng .NET 9, GA đầu 2025, chạy được cả .NET 8):
```csharp
builder.Services.AddStackExchangeRedisCache(o => o.Configuration = redisConn); // L2
builder.Services.AddHybridCache(o =>
{
    o.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(10),          // L2
        LocalCacheExpiration = TimeSpan.FromSeconds(30) // L1
    };
});

public async Task<Product> GetProduct(int id, CancellationToken ct) =>
    await _cache.GetOrCreateAsync($"product:{id}",
        async token => await _repo.GetAsync(id, token),
        tags: ["products"], cancellationToken: ct);

await _cache.RemoveByTagAsync("products");
```
Có sẵn: **L1 (MemoryCache) + L2 (IDistributedCache)**, **stampede protection** (chỉ một caller trong process chạy factory), tag invalidation, serializer cấu hình được (System.Text.Json mặc định, có thể dùng protobuf). Lưu ý: L1 trên các instance khác không tự invalidate ngay — chấp nhận stale theo `LocalCacheExpiration`.

**Output Caching** (.NET 7+, Redis store từ .NET 8 với `AddStackExchangeRedisOutputCache`): cache **toàn bộ HTTP response** theo policy (vary by query/header, tag). Khác Response Caching (dựa vào HTTP cache header). Dùng cho endpoint GET công khai.

**Session store:** `AddStackExchangeRedisCache` + `AddSession` → session ASP.NET Core lưu qua IDistributedCache; mọi instance dùng chung → không cần sticky session. Cũng cần lưu **Data Protection keys** dùng chung (`PersistKeysToStackExchangeRedis`), nếu không cookie/session mã hóa ở instance A không giải mã được ở instance B.

**Lưu ý / bẫy thường gặp:** session ASP.NET Core load **toàn bộ** session mỗi request — giữ session nhỏ. Đặt `InstanceName` làm prefix key để nhiều app dùng chung một Redis không đụng nhau.

## Dùng Redis trong Node.js với ioredis/node-redis: kết nối, cluster, serialization và timeout? [mid]
**Thư viện:** `ioredis` (phổ biến, hỗ trợ Cluster/Sentinel tốt, BullMQ dùng nó) và `node-redis` v4+ (client chính thức được Redis khuyến nghị, promise-based, hỗ trợ RESP3 và module Stack).

```javascript
import Redis from 'ioredis';

// Một instance dùng chung cho cả process (Node đơn luồng, không cần pool cho lệnh thường)
export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,          // mặc định 20 -> request treo lâu khi Redis down
  connectTimeout: 5000,
  commandTimeout: 1000,             // fail nhanh thay vì treo
  enableOfflineQueue: false,        // không xếp hàng lệnh khi mất kết nối
  retryStrategy: times => Math.min(times * 200, 5000),
  enableAutoPipelining: true,       // gom lệnh cùng tick thành pipeline
});

// Cluster
const cluster = new Redis.Cluster([{ host: 'node1', port: 6379 }], {
  scaleReads: 'slave',              // đọc từ replica
  redisOptions: { password: process.env.REDIS_PASSWORD, tls: {} },
});

// Lệnh blocking cần connection riêng
const worker = redis.duplicate();
const job = await worker.brpop('queue:email', 5);
```

**Connection:** một connection xử lý được rất nhiều lệnh nhờ pipeline; chỉ tách connection riêng cho lệnh **blocking** và **subscribe**. Không tạo client mới mỗi request.

**Serialization (cả .NET và Node):**
| Định dạng | Ưu | Nhược |
|---|---|---|
| JSON | Dễ debug bằng redis-cli, đa ngôn ngữ | Lớn, parse chậm, mất kiểu Date/BigInt |
| MessagePack | Nhỏ hơn 30-50%, nhanh | Không đọc trực tiếp được |
| Protobuf | Nhỏ, có schema, versioning tốt | Cần file `.proto` |
| Nén (gzip/LZ4/zstd) | Giảm băng thông cho value > 1KB | Tốn CPU |

**Lưu ý / bẫy thường gặp:** đổi format/schema serialize làm deploy rolling đọc nhầm dữ liệu cũ → đặt **version trong key prefix** (`v2:`). Với ioredis Cluster, multi-key và pipeline phải cùng slot hoặc thư viện tự tách. `JSON.parse` value lớn chặn event loop Node — tránh value cache nhiều MB.

## Kể các sự cố production phổ biến với Redis và cách chẩn đoán (SLOWLOG, LATENCY, INFO). [senior]
**Công cụ chẩn đoán:**
```bash
SLOWLOG GET 20                  # lệnh chạy lâu hơn slowlog-log-slower-than (mặc định 10000µs = 10ms)
CONFIG SET latency-monitor-threshold 100
LATENCY DOCTOR / LATENCY LATEST # sự kiện latency: fork, aof-fsync, expire-cycle, eviction...
INFO commandstats               # calls, usec_per_call theo từng lệnh
INFO clients / CLIENT LIST      # connected_clients, blocked_clients, omem (output buffer)
redis-cli --latency-history -i 5
redis-cli --intrinsic-latency 30   # latency của chính máy/VM (noisy neighbor)
```
Lưu ý SLOWLOG chỉ đo **thời gian thực thi**, không gồm thời gian xếp hàng/network.

**Các sự cố kinh điển:**
| Sự cố | Triệu chứng | Nguyên nhân / xử lý |
|---|---|---|
| `KEYS *`, `FLUSHALL` trong prod | Toàn bộ client timeout vài giây | Chặn bằng ACL; dùng SCAN |
| Big key | Latency spike khi đọc/xóa, migrate lỗi | `--bigkeys`, `UNLINK`, chia nhỏ |
| Fork lớn khi BGSAVE/rewrite | Spike định kỳ, `latest_fork_usec` cao | BGSAVE trên replica, tắt THP, giảm dataset/node |
| Mass expiration | CPU tăng, latency khi nhiều key hết hạn cùng giây | TTL jitter |
| CPU 100% | `instantaneous_ops_per_sec` cao hoặc lệnh O(N), Lua chậm | `INFO commandstats`, hot key → L1 cache, scale ra |
| Memory đầy | `OOM command not allowed` / evicted_keys tăng vọt | Key không TTL, big key, output buffer client |
| Swap | Latency hàng trăm ms, `mem_fragmentation_ratio < 1` | Giảm maxmemory, tắt swap |
| Thundering herd sau restart/failover | DB quá tải, hit rate về 0 | Persistence/warm-up, rate limit DB, singleflight |
| Connection storm | `rejected_connections`, `maxclients` | Client tạo connection mỗi request; dùng singleton/pool |
| Full resync lặp | Replica liên tục sync, network bão hòa | Tăng `repl-backlog-size`, `client-output-buffer-limit replica` |

**Quy trình xử lý:** xác định đúng phía (client: thread pool, GC, network; server: SLOWLOG/LATENCY; hạ tầng: intrinsic latency) → giảm tải nhanh (tắt tính năng, chặn key nóng) → sửa gốc.

**Lưu ý / bẫy thường gặp:** `MONITOR` trong prod có thể giảm throughput hơn 50% — chỉ chạy vài giây. Timeout phía client nhiều khi là lỗi **client** (thread pool starvation, GC pause) chứ không phải Redis chậm.

## Bảo mật và monitoring Redis: ACL, protected-mode, TLS, rename-command, metric cần alert? [mid]
**Bảo mật:**
- **Không bao giờ expose Redis ra Internet** — Redis không có cơ chế chống brute-force; hàng nghìn instance bị chiếm để đào coin hoặc ghi SSH key qua `CONFIG SET dir`. Bind private IP, security group/NSG, private endpoint.
- **protected-mode yes** (3.2+): khi không có password và không bind cụ thể, chỉ nhận kết nối localhost.
- **ACL (Redis 6)**: mỗi service một user với quyền tối thiểu theo lệnh và key pattern; Redis 7 thêm selector và quyền theo kênh Pub/Sub.
```bash
ACL SETUSER orders-api on >S3cret! ~orders:* ~{order}* &orders:* +@read +@write -@dangerous
ACL SETUSER default off              # tắt user mặc định
ACL LOG                              # các lần bị từ chối
```
- **TLS (Redis 6)**: `tls-port 6380`, chứng chỉ; managed thường bật mặc định (Azure port 6380).
- **rename-command** (`rename-command FLUSHALL ""`) là cách cũ để vô hiệu hóa lệnh — đã deprecated, ưu tiên ACL (`-@dangerous`, `-keys`, `-flushall`, `-config`).
- Chạy bằng user không phải root, mã hóa backup, xoay vòng mật khẩu (ACL hỗ trợ nhiều password cho một user).

**Monitoring (redis_exporter + Prometheus/Grafana, hoặc CloudWatch/Azure Monitor):**
| Metric | Alert khi |
|---|---|
| `used_memory` / `maxmemory` | > 80% |
| `evicted_keys` rate | Tăng bất thường (với Redis lưu dữ liệu chính: > 0) |
| Hit rate = hits / (hits + misses) | Giảm mạnh so với baseline |
| `connected_clients`, `rejected_connections` | Tăng đột biến / > 0 |
| `instantaneous_ops_per_sec`, CPU | Gần ngưỡng đã benchmark |
| `master_link_status`, replication lag | `down` / lag tăng |
| `mem_fragmentation_ratio` | > 1.5 hoặc < 1 |
| `rdb_last_bgsave_status`, `aof_last_write_status` | `err` |
| `latest_fork_usec`, slowlog length | Tăng |

**Lưu ý / bẫy thường gặp:** hit rate phải đo **theo loại key/nghiệp vụ** ở phía app, vì `keyspace_hits` gộp mọi thứ (lock, rate limit) nên dễ gây hiểu sai.

# Tình huống Senior và System Design với Redis

## Thiết kế leaderboard cho 10 triệu user với top-N, rank của tôi và leaderboard theo tuần/bạn bè. [senior]
**Ước lượng:** ZSet 10 triệu member, member là user ID (~10 byte) → khoảng **1-1.5GB** (skiplist + hashtable ~100-150 byte/phần tử). Vừa một node, mọi thao tác O(log N) ~ 23 bước.

**Thiết kế cơ bản:**
```bash
ZINCRBY lb:global 50 "u:1001"                 # cộng điểm atomic
ZREVRANGE lb:global 0 99 WITHSCORES           # top 100
ZREVRANK lb:global "u:1001"                   # rank của tôi (0-based)
ZSCORE lb:global "u:1001"
ZREVRANGE lb:global (rank-5) (rank+5) WITHSCORES   # "xung quanh tôi"
```
Hydrate tên/avatar bằng `HMGET`/pipeline từ cache profile, không nhét vào member.

**Leaderboard theo thời gian:** key theo kỳ `lb:week:2026-W42` với TTL vài tuần; ghi song song vào global và weekly bằng pipeline/Lua. Tổng hợp tháng từ tuần bằng `ZUNIONSTORE` (chạy ở replica hoặc job nền vì O(N log N)).

**Tie-break:** ai đạt điểm trước xếp trên → `score = points * 2^21 + (MAX_SEC - sec_since_season_start)`; kiểm tra tổng ≤ 2^53.

**Leaderboard bạn bè:** bạn bè ít (≤ vài trăm) → lấy danh sách bạn, pipeline `ZSCORE` từng người rồi sort ở app; tránh `ZINTERSTORE` với ZSet 10 triệu phần tử cho mỗi request.

**Scale khi lớn hơn (100 triệu+ hoặc write QPS rất cao):**
- Global ZSet là **hot key một node**. Giải pháp: cache top-100 (refresh mỗi 1-5s) cho phần lớn lượt đọc; buffer điểm ở app hoặc Stream rồi `ZINCRBY` batch.
- Rank chính xác cho mọi người không bắt buộc: chia **bucket theo khoảng điểm** (`lb:bucket:{0..N}`) + counter mỗi bucket → rank ≈ tổng count các bucket cao hơn + rank trong bucket. Hoặc hiển thị "top 5%" với user ngoài top 10.000.

**Durability:** ZSet là dữ liệu dẫn xuất; source of truth là bảng score/event trong DB → có thể rebuild. Bật AOF everysec để giảm thời gian rebuild.

**Lưu ý / bẫy thường gặp:** quên rằng rank trả về 0-based; quên dọn user bị ban (`ZREM`); dùng `ZRANGE ... WITHSCORES` lấy toàn bộ để phân trang thay vì `ZREVRANGE start stop`.

## Thiết kế session store cho hệ thống multi-region. [senior]
**Yêu cầu cần làm rõ:** user có di chuyển giữa region không? Cần logout tức thì toàn cầu không? Latency chấp nhận? Mất session khi sự cố region có chấp nhận (user đăng nhập lại)?

**Phương án 1 — Region-local + routing affinity (đơn giản nhất):**
- Mỗi region có Redis riêng; GeoDNS/Global LB gửi user về region "nhà" (cookie chứa region).
- Session `sess:{id}` dạng Hash, TTL sliding 30 phút (`EXPIRE` mỗi request hoặc chỉ khi còn < 50% TTL để giảm ghi).
- Region chết → user bị chuyển sang region khác và phải đăng nhập lại. Thường chấp nhận được.

**Phương án 2 — Stateless token + Redis cho revocation:**
- Access token JWT ngắn hạn (5-15 phút) kiểm tra không cần Redis; refresh token lưu trong DB/Redis.
- Logout/ban: ghi `revoked:{jti}` với TTL = thời gian sống còn lại của token, replicate sang các region (Pub/Sub hoặc event bus). Đọc revocation list local nên latency thấp.

**Phương án 3 — Replicate session đa region:**
- **Active-passive**: ElastiCache Global Datastore / Azure geo-replication — một primary region ghi, region khác read-only (replication lag < 1s), promote khi DR. Ghi từ region phụ phải đi xa → latency.
- **Active-active**: Redis Enterprise / Azure Managed Redis active geo-replication dùng **CRDT** — ghi ở mọi region, conflict được merge (LWW cho string, OR-set cho set). Phù hợp session vì conflict hiếm (một user thường chỉ ở một region tại một thời điểm).

**Chi tiết thiết kế:**
- Giữ session nhỏ (user id, role, CSRF token); dữ liệu lớn tra từ cache khác.
- Session ID ngẫu nhiên ≥128-bit, cookie `HttpOnly; Secure; SameSite`.
- Tách instance session khỏi instance cache (policy `noeviction` hoặc `volatile-lru` riêng).
- Bảo vệ "logout everywhere": Set `user:{id}:sessions` để xóa toàn bộ session của user.

**Lưu ý / bẫy thường gặp:** dùng một Redis trung tâm cho mọi region → mỗi request cộng thêm 100-200ms RTT xuyên lục địa và region đó là SPOF. Ngoài ra nhớ chia sẻ Data Protection/signing key giữa các region.

## Thiết kế cache cho product catalog đạt hit-rate 99% và chịu flash sale. [senior]
**Ước lượng:** 5 triệu sản phẩm × 2KB (nén MessagePack) ≈ 10GB → Redis Cluster 3 shard × 1 replica (mỗi shard ~4-5GB dữ liệu, chừa headroom). Đọc 200k QPS lúc cao điểm.

**Kiến trúc nhiều tầng:**
```text
Client ─► CDN (ảnh, trang listing tĩnh, TTL ngắn) ─► API
API: L1 in-process (HybridCache/Caffeine, TTL 10-30s, chỉ top hot items)
   ─► L2 Redis Cluster (TTL 1h + jitter, logical expiration)
   ─► DB / Search (Elasticsearch cho listing, filter)
DB ─► CDC (Debezium) ─► Kafka ─► Invalidator: DEL Redis + Pub/Sub báo xóa L1
```

**Đạt 99% hit rate:**
1. **Pre-warm**: trước khi deploy/flash sale, job nạp sẵn top sản phẩm (theo analytics) vào Redis.
2. **TTL dài + invalidation chủ động** (CDC) thay vì TTL ngắn: dữ liệu catalog ít đổi, nên cache lâu và xóa khi đổi.
3. **Tách dữ liệu ít đổi và hay đổi**: thông tin mô tả (cache lâu) tách khỏi **giá/tồn kho** (TTL ngắn hoặc đọc riêng từ Redis counter) — tránh một thay đổi tồn kho làm invalid cả object 2KB.
4. **Negative cache** + Bloom filter cho ID không tồn tại (bot crawl).
5. Batch `MGET`/pipeline cho trang listing 50 sản phẩm thay vì 50 round-trip.
6. Đo hit rate **theo endpoint**; phân tích miss: cold, expired, evicted hay invalidated.

**Flash sale:**
- Hot key: L1 cache vài giây cho sản phẩm sale; nhân bản key nóng nếu cần.
- **Tồn kho trừ trên Redis** bằng Lua (atomic, không oversell), đơn hàng đi qua queue để DB ghi bất đồng bộ; đối soát Redis-DB định kỳ.
- Stampede: logical expiration + lock rebuild; rate limit theo user.

**Lưu ý / bẫy thường gặp:** hit rate 99% vô nghĩa nếu dữ liệu sai — nêu rõ SLA stale (ví dụ mô tả ≤ 5 phút, giá ≤ 30s) và tại bước thanh toán **luôn kiểm giá/tồn kho từ nguồn chính**.

## Khi nào chọn Redis Sentinel, khi nào chọn Redis Cluster? [senior]
| Tiêu chí | Sentinel (master + replicas) | Cluster |
|---|---|---|
| Dung lượng | ≤ RAM một node (thường < 25-50GB để fork/resync an toàn) | Scale ngang theo shard, hàng TB |
| Write throughput | Một master (~100k+ ops/s) | Tăng tuyến tính theo số master |
| Multi-key, MULTI, Lua | Tự do trên mọi key | Chỉ khi cùng slot (hash tag) |
| `SELECT` nhiều DB | Có | Chỉ DB 0 |
| Client | Hỏi Sentinel để tìm master | Phải cluster-aware (MOVED/ASK, bảng slot) |
| Vận hành | Đơn giản hơn: 1 master, N replica, 3 Sentinel | Phức tạp: resharding, rebalance, hot slot |
| Failover | Sentinel bầu chọn | Node trong cluster tự bầu |

**Chọn Sentinel khi:** dataset vừa một node, throughput một node đủ (đa số ứng dụng doanh nghiệp), code dùng nhiều Lua/transaction đa key, hoặc thư viện legacy không hỗ trợ cluster.

**Chọn Cluster khi:** dữ liệu vượt RAM một node hoặc vượt ngưỡng an toàn cho fork/full resync; write QPS vượt một node; muốn scale dần không downtime.

**Các yếu tố khác cần nêu:**
- **Scale đọc** không cần Cluster: thêm replica (chấp nhận lag) hoặc L1 cache.
- Có thể chạy **nhiều Sentinel-managed group theo chức năng** (cache, session, queue) thay vì một Cluster — cô lập lỗi và cấu hình eviction riêng.
- Managed service ẩn bớt độ phức tạp: ElastiCache cluster mode, Azure Premium/Enterprise clustering, hoặc proxy (ElastiCache Serverless) giúp client không cần cluster-aware.
- Chi phí: Cluster tối thiểu 3 master + 3 replica.

**Lưu ý / bẫy thường gặp:** chuyển từ Sentinel sang Cluster sau này đòi hỏi sửa code (multi-key, hash tag, SCAN theo node, Pub/Sub). Nếu dự báo tăng trưởng lớn, ngay từ đầu thiết kế key với hash tag hợp lý và tránh lệnh đa key tùy tiện, dù đang chạy Sentinel.

## Làm sao migrate Redis (đổi hạ tầng, lên Cluster, sang managed/Valkey) mà không downtime? [senior]
**Bước 0 — Phân loại dữ liệu:** cache thuần (có thể mất) khác hẳn dữ liệu chính (session, queue, leaderboard, counter). Cache thuần có thể chấp nhận cold start có kiểm soát; dữ liệu chính phải được sao chép.

**Chiến lược 1 — Replication trực tiếp (cùng topology, ví dụ VM → VM mới/version mới):**
1. Đặt instance mới làm `REPLICAOF` instance cũ, chờ `master_link_status:up` và offset bằng nhau.
2. Chuyển client sang endpoint mới (DNS ngắn TTL hoặc config động), sau đó `REPLICAOF NO ONE` trên instance mới. Có thể bật `min-replicas`/`CLIENT PAUSE WRITE` (6.2) vài giây trên instance cũ để không mất ghi trong lúc cắt.
Managed thường không cho `REPLICAOF` ra ngoài → dùng công cụ của nhà cung cấp (ElastiCache online migration) hoặc chiến lược dưới.

**Chiến lược 2 — Đồng bộ bằng công cụ (khác topology, standalone → Cluster):** RIOT (Redis Input/Output Tools), RedisShake (Alibaba) đọc RDB + replication stream của nguồn và ghi vào đích có slot routing → live sync liên tục, sau đó cutover.

**Chiến lược 3 — Dual-write / dual-read ở tầng app (cache):**
```text
Phase 1: ghi cả cũ và mới; đọc từ cũ                -> cache mới được làm ấm tự nhiên
Phase 2: đọc từ mới, miss thì fallback cũ (hoặc DB)  -> theo dõi hit rate mới
Phase 3: dừng ghi cũ; giữ vài ngày rồi tắt
```
Kết hợp **feature flag** và chuyển dần theo % traffic (canary). Với Cluster: sửa key có hash tag và code multi-key **trước** khi cutover.

**Checklist:**
- Kiểm tra tương thích: version, lệnh/module dùng (`INFO commandstats`), ACL, TLS, Lua/Functions phải `FUNCTION LOAD` lại, giới hạn lệnh của managed.
- Benchmark đích bằng traffic thực (replay) — `redis-benchmark`/memtier.
- Pre-warm cache, rate limit đường về DB để chống stampede nếu hit rate tụt.
- Rollback plan: giữ instance cũ ở chế độ đồng bộ ngược (hoặc dual-write) đến khi ổn định.
- So sánh `DBSIZE`, sample key ngẫu nhiên giữa nguồn và đích.

**Lưu ý / bẫy thường gặp:** TTL phải được giữ khi copy (DUMP/RESTORE kèm TTL; công cụ tốt tự làm). Chuyển DNS không cắt các connection đang mở — client (ConnectionMultiplexer, ioredis) cần được reconnect hoặc restart rolling.
