---
topic: redis
---

## Vì sao Redis thường đạt latency dưới 1 millisecond cho các lệnh đơn giản? [junior]
- [x] Dữ liệu nằm trong RAM, command được thực thi trên một thread chính kết hợp I/O multiplexing (epoll/kqueue), không tốn chi phí lock và context switch
- [ ] Redis dùng nhiều thread để thực thi song song mọi command trên tất cả CPU core
- [ ] Redis ghi đồng bộ mọi thao tác xuống đĩa SSD trước khi trả lời nên đọc rất nhanh
- [ ] Redis biên dịch command thành query plan được cache sẵn giống SQL
> Redis nhanh nhờ in-memory, cấu trúc dữ liệu tối ưu và event loop single-thread dùng I/O multiplexing nên không có tranh chấp lock. Việc thực thi command không chạy song song trên nhiều core; đó cũng là lý do một lệnh chậm sẽ block mọi client khác.

## Production có 50 triệu key, một dev chạy `KEYS session:*` để debug. Hậu quả có khả năng xảy ra nhất? [junior]
- [ ] Chỉ connection của dev bị chậm, các client khác vẫn được phục vụ bình thường
- [x] Redis bị block cho tất cả client trong lúc duyệt toàn bộ keyspace O(N), có thể gây timeout hàng loạt
- [ ] Redis tự giới hạn trả về 1000 key đầu tiên nên không ảnh hưởng
- [ ] Lệnh bị từ chối vì `KEYS` bị tắt mặc định từ Redis 6
> `KEYS` chạy trên thread chính và duyệt hết keyspace, nên mọi client khác phải chờ. Dùng `SCAN` với cursor (`SCAN 0 MATCH session:* COUNT 100`) để duyệt từng phần; `KEYS` không bị tắt mặc định, chỉ nên chặn bằng ACL hoặc `rename-command`.

## Hai instance API cùng tăng lượt xem bài viết bằng cách `GET` giá trị, cộng 1 ở app rồi `SET` lại, dẫn tới mất lượt đếm. Cách sửa đúng? [junior]
- [ ] Gọi `GET` rồi `SET` trên cùng một connection
- [ ] Dùng `SETNX` mỗi lần tăng
- [x] Dùng `INCR page:views:42`
- [ ] Dùng `APPEND page:views:42 1`
> `INCR` là thao tác read-modify-write atomic trên server nên không bị lost update. Dùng chung connection không ngăn được client khác chen vào giữa `GET` và `SET`; `APPEND` chỉ nối chuỗi "1" vào cuối giá trị.

## Đoạn lệnh sau trả về gì ở dòng cuối? [junior]
```bash
LPUSH tasks a
LPUSH tasks b
RPUSH tasks c
LRANGE tasks 0 -1
```
- [ ] `a b c`
- [ ] `c b a`
- [ ] `b c a`
- [x] `b a c`
> `LPUSH` chèn vào đầu list, `RPUSH` chèn vào cuối: `[a]` → `[b, a]` → `[b, a, c]`. `LRANGE 0 -1` trả về toàn bộ list theo thứ tự từ đầu đến cuối.

## Redis chỉ bật RDB với cấu hình `save 300 10`, không bật AOF. Server mất điện đột ngột. Dữ liệu nào có thể bị mất? [junior]
- [x] Toàn bộ các write xảy ra sau lần snapshot thành công gần nhất, có thể lên tới vài phút dữ liệu
- [ ] Không mất gì, vì RDB ghi lại từng lệnh ngay khi thực thi
- [ ] Tối đa khoảng 1 giây dữ liệu
- [ ] Mất toàn bộ dataset vì RDB chỉ tồn tại trong RAM
> RDB là snapshot định kỳ (ở đây: sau 300 giây nếu có ít nhất 10 thay đổi), nên mọi thứ sau snapshot cuối sẽ mất khi crash. Mức mất tối đa ~1 giây là đặc điểm của AOF với `appendfsync everysec`, không phải RDB.

## Cần lưu thông tin user (name, email, plan...) và thường xuyên đọc/sửa từng field riêng lẻ. Data type nào phù hợp nhất? [junior]
- [ ] List, mỗi phần tử là một field
- [x] Hash, dùng `HSET user:1 email a@b.com` và `HGET user:1 email`
- [ ] Set chứa các cặp "field=value"
- [ ] HyperLogLog
> Hash cho phép đọc/ghi từng field mà không cần tải lại cả object, và hash nhỏ được lưu bằng encoding compact (listpack) rất tiết kiệm RAM. Lưu JSON trong String cũng được nhưng mỗi lần sửa một field phải đọc-sửa-ghi cả object.

## Cần tìm danh sách bạn chung giữa user 1 và user 2. Cách làm hiệu quả nhất với Redis? [junior]
- [ ] Lưu bạn bè vào List, `LRANGE` cả hai rồi so sánh ở ứng dụng
- [ ] Lưu vào Sorted Set rồi dùng `ZRANGEBYSCORE`
- [x] Lưu vào Set và dùng `SINTER friends:1 friends:2`
- [ ] Lưu vào HyperLogLog rồi dùng `PFCOUNT`
> Set lưu phần tử duy nhất và hỗ trợ phép giao/hợp/hiệu ngay trên server (`SINTER`, `SUNION`, `SDIFF`). HyperLogLog chỉ ước lượng số lượng phần tử, không trả lại được danh sách phần tử.

## Cần đếm số visitor duy nhất mỗi ngày (hàng trăm triệu lượt), chấp nhận sai số nhỏ, tối thiểu bộ nhớ. Nên dùng gì? [junior]
- [ ] Set chứa toàn bộ user id rồi gọi `SCARD`
- [ ] Hash với field là user id
- [ ] List chứa user id rồi `LLEN`
- [x] HyperLogLog với `PFADD` / `PFCOUNT`
> HyperLogLog ước lượng cardinality với sai số chuẩn khoảng 0.81% và chỉ tốn tối đa ~12KB mỗi key, bất kể số phần tử. Set cho kết quả chính xác nhưng tốn bộ nhớ tỉ lệ với số user; `LLEN` của List còn đếm cả phần tử trùng.

## User có id số nguyên từ 0 đến 10 triệu. Cần lưu trạng thái điểm danh mỗi ngày và đếm số người đã điểm danh. Cách tiết kiệm bộ nhớ nhất? [junior]
- [x] Bitmap: `SETBIT checkin:2026-10-15 <userId> 1` và `BITCOUNT checkin:2026-10-15`
- [ ] Sorted Set với score là userId
- [ ] Geo index với userId làm toạ độ
- [ ] Stream, mỗi lần điểm danh là một entry
> Bitmap dùng 1 bit cho mỗi user, 10 triệu user chỉ tốn khoảng 1.25MB mỗi ngày, và `BITCOUNT` đếm số bit 1 rất nhanh. Bitmap thực chất là String nên giới hạn 512MB (2^32 bit). Sorted Set tốn hàng chục byte mỗi phần tử.

## Cần tìm các cửa hàng trong bán kính 5km quanh vị trí người dùng. Lựa chọn phù hợp nhất? [junior]
- [ ] Lưu lat/lng trong Hash rồi quét toàn bộ để tính khoảng cách ở ứng dụng
- [x] `GEOADD stores <lng> <lat> <id>` và `GEOSEARCH stores FROMLONLAT <lng> <lat> BYRADIUS 5 km`
- [ ] Bitmap với mỗi bit là một ô lưới
- [ ] HyperLogLog chứa toạ độ cửa hàng
> Kiểu Geo được xây dựng trên Sorted Set với score là geohash 52-bit, cho phép tìm theo bán kính hoặc hình chữ nhật trên server. Lưu ý `GEOADD` nhận longitude trước, latitude sau.

## Service B subscribe channel `orders` bằng Pub/Sub. B bị restart mất 2 phút, trong lúc đó service A vẫn `PUBLISH` liên tục. Điều gì xảy ra với các message đó? [junior]
- [ ] Redis lưu lại và gửi bù khi B subscribe lại
- [ ] Message nằm trong Pending Entries List chờ B xác nhận
- [x] Các message đó bị mất với B, vì Pub/Sub là fire-and-forget và không lưu trữ
- [ ] `PUBLISH` trả về lỗi cho A cho đến khi B kết nối lại
> Pub/Sub chỉ chuyển message tới các subscriber đang kết nối; `PUBLISH` vẫn thành công và trả về số subscriber đã nhận (có thể là 0). Pending Entries List là khái niệm của Streams consumer group, nên dùng Streams nếu cần durability.

## Redis đạt `maxmemory` với policy mặc định `noeviction`. Điều gì xảy ra? [junior]
- [ ] Redis tự xoá các key cũ nhất để có chỗ
- [ ] Redis crash rồi tự khởi động lại
- [ ] Redis ghi phần dữ liệu tràn xuống đĩa
- [x] Các lệnh ghi làm tăng bộ nhớ (như `SET`) trả về lỗi OOM, lệnh đọc vẫn hoạt động
> Với `noeviction`, Redis không xoá key nào mà từ chối lệnh ghi với lỗi `OOM command not allowed when used memory > 'maxmemory'`. Muốn tự xoá key khi làm cache phải chọn policy như `allkeys-lru` hoặc `allkeys-lfu`.

## Ứng dụng gửi 10.000 lệnh `SET` qua pipeline. Phát biểu nào đúng? [junior]
- [x] Pipeline giảm số round-trip mạng; các lệnh không được đảm bảo atomic và lệnh của client khác có thể xen vào giữa
- [ ] Pipeline tương đương `MULTI/EXEC`: hoặc tất cả thành công hoặc không lệnh nào được áp dụng
- [ ] Pipeline khiến Redis thực thi các lệnh song song trên nhiều thread
- [ ] Nếu một lệnh trong pipeline lỗi thì các lệnh sau bị huỷ
> Pipelining chỉ là kỹ thuật phía client gửi nhiều lệnh liền nhau và đọc reply sau, tiết kiệm RTT. Mỗi lệnh vẫn được thực thi độc lập; muốn các lệnh chạy liền một khối thì dùng `MULTI/EXEC` hoặc Lua script.

## Cách sử dụng `ConnectionMultiplexer` của StackExchange.Redis đúng trong ứng dụng ASP.NET Core? [junior]
- [ ] Tạo mới trong khối `using` cho mỗi HTTP request
- [x] Tạo một lần, dùng chung (singleton) cho toàn ứng dụng, gọi `GetDatabase()` khi cần
- [ ] Tạo một instance cho mỗi thread vì nó không thread-safe
- [ ] Tạo mới mỗi lần gọi `GetDatabase()` và `Dispose()` sau mỗi lệnh
> `ConnectionMultiplexer` tốn kém khi tạo (handshake, nhiều socket) và được thiết kế thread-safe để chia sẻ, thường đăng ký singleton trong DI. Đối tượng `IDatabase` từ `GetDatabase()` rất nhẹ, không cần cache hay dispose.

## Redis khởi động không đặt password và không cấu hình `bind`. Client từ máy khác nhận lỗi `DENIED Redis is running in protected mode`. Cách xử lý đúng? [junior]
- [ ] Cài lại Redis vì file cấu hình bị hỏng
- [ ] Nâng cấp lên Redis Enterprise để mở kết nối từ xa
- [x] Cấu hình password/ACL user và `bind` đúng network interface, thay vì tắt protected mode rồi mở Redis ra ngoài
- [ ] Đổi client sang port 6380 dành cho kết nối từ xa
> Protected mode chỉ cho phép kết nối loopback khi Redis chưa có `bind` và chưa có password, nhằm tránh lộ instance không xác thực ra mạng. Từ Redis 6 nên dùng ACL (`ACL SETUSER`) để giới hạn user theo command và key pattern.

## Đoạn lệnh sau trả về gì ở dòng cuối? [mid]
```bash
SET a 1 EX 100
SET a 2
TTL a
```
- [ ] Khoảng `100`
- [ ] `-2`
- [ ] `0`
- [x] `-1`
> `SET` ghi đè cả value lẫn TTL cũ, nên key `a` trở thành không có expiry và `TTL` trả về `-1` (`-2` là khi key không tồn tại). Muốn giữ TTL khi ghi đè phải dùng `SET a 2 KEEPTTL` (Redis 6.0+).

## Đoạn code lấy lock sau có vấn đề gì? [mid]
```bash
SETNX lock:order 1
EXPIRE lock:order 30
```
- [x] Hai lệnh không atomic: nếu process crash giữa hai lệnh, lock tồn tại vĩnh viễn; nên dùng `SET lock:order <token> NX PX 30000`
- [ ] `SETNX` không atomic khi nhiều client cùng gọi
- [ ] `EXPIRE` không có tác dụng với key được tạo bởi `SETNX`
- [ ] `SETNX` đã bị xoá khỏi Redis 7 nên lệnh sẽ lỗi
> Bản thân `SETNX` là atomic, nhưng cặp `SETNX` + `EXPIRE` thì không, nên có thể để lại lock không có TTL. `SET ... NX PX` đặt value và expiry trong một lệnh; giá trị nên là token ngẫu nhiên để giải phóng lock an toàn.

## Đoạn lệnh sau trả về gì ở dòng cuối? [mid]
```bash
SET counter 10 EX 100
INCR counter
TTL counter
```
- [ ] `-1`, vì `INCR` ghi lại value nên xoá TTL
- [x] Khoảng `100` (ví dụ `99` hoặc `100`)
- [ ] `-2`
- [ ] `0`
> Các lệnh sửa value tại chỗ như `INCR`, `LPUSH`, `HSET` không đụng tới TTL; chỉ những lệnh ghi đè toàn bộ key như `SET`, `GETSET` mới xoá TTL. Đây là điểm khác biệt hay bị nhầm với câu hỏi về `SET`.

## Có 2 triệu key đã hết hạn nhưng không client nào đọc lại chúng. Phát biểu nào đúng về cơ chế expiration của Redis? [mid]
- [ ] Redis đặt timer riêng cho từng key và xoá chính xác tại thời điểm hết hạn
- [ ] Key hết hạn chỉ bị xoá khi có client truy cập, nên chúng sẽ tồn tại mãi
- [x] Redis kết hợp lazy expiration (xoá khi truy cập) và active expiration (định kỳ lấy mẫu ngẫu nhiên các key có TTL, xoá key hết hạn và lặp lại nếu tỉ lệ hết hạn cao), nên key hết hạn có thể chiếm RAM thêm một thời gian
- [ ] Key hết hạn được chuyển xuống đĩa để giải phóng RAM
> Lazy expiration đảm bảo client không bao giờ đọc được key đã hết hạn, còn active cycle dọn dần các key không ai đọc. Redis không dùng timer cho từng key vì quá tốn kém với hàng triệu key.

## Redis cấu hình `maxmemory-policy volatile-lru`, nhưng ứng dụng `SET` mọi key mà không đặt TTL. Khi đầy bộ nhớ, điều gì xảy ra? [mid]
- [x] Lệnh ghi bị lỗi OOM giống `noeviction`, vì không có key nào có TTL để evict
- [ ] Redis evict key ít dùng nhất trong toàn bộ keyspace
- [ ] Redis tự gán TTL mặc định cho các key rồi evict
- [ ] Redis xoá ngẫu nhiên các key bất kể TTL
> Các policy `volatile-*` chỉ chọn ứng viên trong các key có expiry; không có ứng viên thì Redis xử lý như `noeviction`. Với cache mà key không có TTL, dùng `allkeys-lru` hoặc `allkeys-lfu`.

## Sau khi chạy đoạn sau, `EXEC` trả về gì và `GET b` cho kết quả gì? [mid]
```bash
SET a hello
MULTI
INCR a
SET b 1
EXEC
```
- [ ] `EXEC` trả về lỗi `EXECABORT`, key `b` không tồn tại
- [ ] Toàn bộ transaction bị rollback, `GET b` trả về `(nil)`
- [ ] Redis dừng ở lệnh lỗi nên `SET b 1` không chạy
- [x] `EXEC` trả về `1) ERR value is not an integer...` và `2) OK`; `GET b` là `"1"` vì không có rollback
> Lỗi runtime (như `INCR` trên chuỗi không phải số) chỉ làm lệnh đó lỗi, các lệnh khác trong `MULTI/EXEC` vẫn được áp dụng. `EXECABORT` chỉ xảy ra khi có lỗi lúc queue lệnh, ví dụ sai cú pháp hoặc sai số tham số.

## Client A chạy đoạn sau. Giữa `GET` và `EXEC`, client B chạy `SET balance 50`. Kết quả? [mid]
```bash
WATCH balance
GET balance        # "100"
MULTI
SET balance 80
EXEC
```
- [ ] `EXEC` trả về `OK`, `balance` = `80`
- [x] `EXEC` trả về `(nil)`, transaction bị huỷ, `balance` vẫn là `50`
- [ ] `EXEC` trả về lỗi xung đột và huỷ luôn thay đổi của B, `balance` = `100`
- [ ] `EXEC` chờ B hoàn tất rồi mới chạy, `balance` = `80`
> `WATCH` là optimistic locking: nếu key được watch bị thay đổi trước `EXEC`, transaction bị huỷ và trả về null reply, client phải tự retry. Redis không bao giờ rollback thay đổi của client khác.

## Xoá một Set 5 triệu phần tử bằng `DEL` làm Redis đứng vài trăm ms. Cách khắc phục phù hợp nhất? [mid]
- [ ] Dùng `FLUSHDB` thay thế
- [ ] Bọc `DEL` trong `MULTI/EXEC` để không block
- [x] Dùng `UNLINK`: gỡ key khỏi keyspace ngay rồi giải phóng bộ nhớ ở background thread
- [ ] Gửi `DEL` qua pipeline
> `DEL` giải phóng từng phần tử đồng bộ trên thread chính, tốn O(N) với big key. `UNLINK` (hoặc bật `lazyfree-lazy-user-del yes`) chuyển việc giải phóng sang thread nền; transaction và pipeline không làm lệnh chạy nhanh hơn.

## Instance Redis dùng 20GB RAM, workload ghi nhiều. Mỗi lần `BGSAVE`, RAM của máy tăng gần 40GB và có lúc bị OOM killer. Giải thích đúng nhất? [mid]
- [x] `BGSAVE` fork process con; nhờ copy-on-write hai process ban đầu chia sẻ page, nhưng mỗi page bị ghi trong lúc snapshot sẽ bị copy, nên ghi nhiều làm bộ nhớ gần gấp đôi
- [ ] RDB phải nén toàn bộ dataset trong RAM trước khi ghi ra file
- [ ] Redis load lại toàn bộ file RDB vào RAM sau mỗi lần save
- [ ] `fork` copy ngay lập tức toàn bộ 20GB dataset sang process con
> Fork dùng copy-on-write, không copy toàn bộ dữ liệu ngay; chi phí bộ nhớ tỉ lệ với lượng page bị sửa trong lúc snapshot. Vì vậy cần để dư RAM, tắt Transparent Huge Pages (page 2MB làm COW tốn hơn) và cân nhắc lịch snapshot.

## Trên Redis Cluster, `MGET user:1:name user:1:email` trả về lỗi `CROSSSLOT`. Cách khắc phục đúng? [mid]
- [ ] Dùng `SELECT 1` để đưa hai key vào cùng database
- [ ] Tăng số hash slot của cluster từ 16384 lên 65536
- [ ] Dùng `KEYS user:1:*` để gom key về cùng node
- [x] Đặt hash tag: `{user:1}:name` và `{user:1}:email`, để chỉ phần trong `{}` được hash
> Slot được tính bằng `CRC16(key) mod 16384`; lệnh multi-key chỉ chạy được khi mọi key cùng slot. Hash tag buộc các key liên quan vào cùng slot; Cluster chỉ hỗ trợ database 0 và số slot cố định 16384.

## Consumer trong một consumer group đọc message bằng `XREADGROUP` rồi crash trước khi gọi `XACK`. Message đó sẽ ra sao? [mid]
- [ ] Bị mất giống như Pub/Sub
- [x] Nằm trong Pending Entries List (PEL) của consumer đó; không tự giao cho consumer khác, phải dùng `XCLAIM`/`XAUTOCLAIM` hoặc consumer đọc lại pending với ID `0`
- [ ] Tự động được giao lại cho consumer khác sau 30 giây
- [ ] Bị xoá khỏi stream vì chưa được ack
> Streams lưu message bền vững và theo dõi message đã giao nhưng chưa ack trong PEL. Redis không tự redeliver theo timeout; ứng dụng phải chủ động claim message idle quá lâu (`XAUTOCLAIM`, Redis 6.2+).

## Rate limiter fixed window dưới đây chạy ổn, nhưng thỉnh thoảng có user bị chặn vĩnh viễn. Nguyên nhân? [mid]
```python
count = r.incr("rl:user42")
if count == 1:
    r.expire("rl:user42", 60)
if count > 100:
    reject()
```
- [ ] `INCR` không atomic khi nhiều request đồng thời
- [ ] `EXPIRE` bị gọi lại mỗi request nên window không bao giờ kết thúc
- [x] Nếu app crash hoặc lệnh `EXPIRE` lỗi/timeout ngay sau `INCR` đầu tiên, key không có TTL và counter tăng mãi; cần gộp `INCR` + `EXPIRE` atomic bằng Lua hoặc `MULTI`
- [ ] `INCR` xoá TTL của key mỗi lần được gọi
> `EXPIRE` chỉ chạy khi `count == 1`, nên nếu lần đó thất bại thì sẽ không bao giờ có TTL nữa. Fixed window còn có nhược điểm cho phép gần gấp đôi limit quanh ranh giới hai window.

## Worker lấy lock rồi xử lý job. Đoạn sau có vấn đề gì? [mid]
```bash
SET lock:job <token> NX PX 10000
# ... xử lý mất 12 giây ...
DEL lock:job
```
- [x] Lock đã hết hạn và có thể worker khác đã lấy; `DEL` sẽ xoá lock của người khác. Phải kiểm tra token và xoá atomic bằng Lua
- [ ] `DEL` không xoá được key được tạo với `PX`
- [ ] `NX` không dùng chung được với `PX` trong một lệnh
- [ ] Không có vấn đề vì `DEL` là idempotent
> Release đúng là script `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`. Làm `GET` rồi `DEL` ở client vẫn có race, vì lock có thể hết hạn và bị lấy giữa hai lệnh.

## Đoạn lệnh sau trả về gì ở dòng cuối? [mid]
```bash
ZADD board 10 alice 20 bob 15 carol
ZINCRBY board 12 alice
ZREVRANGE board 0 1 WITHSCORES
```
- [ ] `bob 20 carol 15`
- [ ] `bob 20 alice 22`
- [ ] `alice 12 bob 20`
- [x] `alice 22 bob 20`
> `ZINCRBY` cộng 12 vào score hiện tại của alice (10 → 22). `ZREVRANGE 0 1` lấy 2 phần tử có score cao nhất theo thứ tự giảm dần: alice (22), bob (20).

## Redis làm cache thuần với `allkeys-lru`. Một nhóm key được đọc liên tục cả ngày, nhưng job batch hằng đêm quét qua hàng triệu key lạnh một lần, khiến key hot bị evict. Policy nào phù hợp hơn? [mid]
- [ ] `volatile-ttl`
- [ ] `noeviction`
- [x] `allkeys-lfu`
- [ ] `allkeys-random`
> LFU (Redis 4.0+) evict theo tần suất truy cập với counter logarithmic có decay theo thời gian, nên một lần scan không đủ để key lạnh vượt key hot. LRU chỉ nhìn lần truy cập gần nhất, nên bị "ô nhiễm" bởi các lần scan như vậy.

## Rate limiter sliding window log dưới đây cho phép tối đa 100 request/phút. Load test bắn 500 request của cùng user trong cùng một millisecond và tất cả đều qua. Vì sao? [senior]
```lua
-- KEYS[1]=rl:user42, ARGV[1]=now_ms, ARGV[2]=window_ms
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[1])
local c = redis.call('ZCARD', KEYS[1])
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return c
```
- [ ] Lua script không atomic nên các request chạy chồng lên nhau
- [x] Member chính là timestamp, các request cùng millisecond có member trùng nên `ZADD` chỉ cập nhật score, `ZCARD` không tăng; cần member duy nhất (timestamp + request id)
- [ ] `ZREMRANGEBYSCORE` xoá luôn request hiện tại khỏi window
- [ ] `PEXPIRE` reset counter về 0 sau mỗi request
> Sorted Set là tập hợp: thêm member đã tồn tại chỉ cập nhật score. Lua script chạy atomic nên không có race ở đây; lỗi nằm ở việc chọn member.

## Trong Redis Cluster, key nào được hash slot theo đúng chuỗi `bar`? [senior]
- [ ] `foo{}{bar}`
- [ ] `foo{{bar}}`
- [ ] `{bar`
- [x] `foo{bar}{zap}`
> Redis lấy phần nằm giữa `{` đầu tiên và `}` đầu tiên sau nó, nếu ở giữa có ít nhất một ký tự. `foo{}{bar}` có cặp đầu rỗng nên hash cả key, `foo{{bar}}` hash chuỗi `{bar`, còn `{bar` không có `}` nên hash cả key.

## Trong lúc resharding slot 1234 từ node A sang node B, client gửi lệnh tới A và nhận `-ASK 1234 10.0.0.2:6379`. Client nên làm gì? [senior]
- [x] Gửi `ASKING` rồi gửi lại lệnh tới node B chỉ cho lần này, không cập nhật slot map
- [ ] Cập nhật slot map để từ nay slot 1234 luôn trỏ tới node B
- [ ] Retry lại node A sau vài millisecond cho tới khi migration xong
- [ ] Gửi lệnh tới replica của node A
> `ASK` báo key có thể đã được chuyển sang node đích trong lúc slot đang migrate; `ASKING` cho phép node B phục vụ slot đang ở trạng thái importing. `MOVED` mới là redirect vĩnh viễn, khi đó client cập nhật slot map.

## Có 5 Sentinel giám sát một master với `quorum 2`. Phát biểu nào đúng? [senior]
- [ ] Chỉ cần 2 Sentinel đồng ý master chết là failover được thực hiện ngay
- [x] Quorum 2 chỉ đủ để đánh dấu master là ODOWN; để thực hiện failover, một Sentinel phải được đa số (3/5) Sentinel bầu làm leader
- [ ] Quorum là số replica tối thiểu phải online để failover
- [ ] Quorum bắt buộc phải bằng tổng số Sentinel
> Quorum quyết định việc phát hiện lỗi (SDOWN → ODOWN), còn việc được phép failover cần majority của toàn bộ Sentinel. Nhờ vậy phía thiểu số trong một network partition không thể tự promote replica.

## Client nhận `OK` cho một `SET` quan trọng, sau đó gọi `WAIT 1 1000` và nhận `1`. Điều đó có đảm bảo write không bao giờ mất khi failover? [senior]
- [ ] Có, `WAIT` biến replication thành synchronous và đảm bảo không mất dữ liệu
- [ ] Có, vì nếu `WAIT` timeout Redis sẽ rollback write trên master
- [x] Không, chỉ giảm rủi ro: failover vẫn có thể promote một replica khác chưa nhận write, và khi `WAIT` timeout write cũng không bị rollback
- [ ] Không cần `WAIT`, vì replication của Redis mặc định là synchronous
> Replication của Redis là asynchronous, và `WAIT` chỉ cho biết số replica đã ack tại thời điểm đó chứ không biến Redis thành hệ CP. Cửa sổ mất write khi master chết trước khi replicate vẫn còn, đặc biệt khi có network partition.

## Martin Kleppmann chỉ trích Redlock vì lý do cốt lõi nào? [senior]
- [ ] Redlock cần ít nhất 2 node Redis nên quá tốn kém
- [ ] Redlock không dùng TTL nên lock có thể tồn tại mãi
- [ ] Redlock chỉ chạy được trên Redis Cluster
- [x] Tính an toàn dựa vào giả định về thời gian (clock drift có giới hạn, network delay, process pause) và không sinh fencing token tăng dần, nên storage không thể từ chối writer đã mất lock
> Redlock dùng 5 node độc lập và cần lấy được majority trong thời gian hiệu lực của lock, nhưng clock nhảy hoặc process pause vẫn có thể khiến hai client cùng nghĩ mình giữ lock. Nếu cần correctness, dùng hệ consensus (ZooKeeper/etcd) kèm fencing token; Redlock chỉ phù hợp cho efficiency lock.

## Một Lua script chạy vòng lặp ghi dữ liệu đã 20 giây; các client khác nhận lỗi `BUSY`. Chạy `SCRIPT KILL` nhận lỗi `UNKILLABLE`. Vì sao và còn lựa chọn nào? [senior]
- [x] Script đã thực hiện lệnh ghi, kill giữa chừng sẽ phá tính atomic nên Redis từ chối; chỉ còn `SHUTDOWN NOSAVE` để dừng mà không lưu trạng thái dở dang
- [ ] `SCRIPT KILL` chỉ dùng được với `EVALSHA`; chạy `SCRIPT FLUSH` sẽ dừng script
- [ ] Redis sẽ tự kill script sau `lua-time-limit` (5 giây), chỉ cần chờ thêm
- [ ] `SCRIPT KILL` sẽ thành công nếu chạy từ replica
> Script chạy atomic và không có rollback, nên một script đã ghi thì không thể dừng an toàn giữa chừng. `lua-time-limit`/`busy-reply-threshold` chỉ khiến Redis bắt đầu trả `BUSY` cho client khác, không tự kill script.

## Hệ thống cập nhật cache bằng cách ghi đè (update) thay vì xoá. Thứ tự sự kiện thực tế như sau. Trạng thái cuối cùng? [senior]
```text
W1: UPDATE products SET price=100 WHERE id=1   (commit)
W2: UPDATE products SET price=200 WHERE id=1   (commit)
W2: SET product:1 '{"price":200}'
W1: SET product:1 '{"price":100}'
```
- [ ] DB tự rollback W1 vì cache không khớp
- [ ] Redis tự đồng bộ lại với DB nên cache = 200
- [x] Cache = 100 trong khi DB = 200, dữ liệu stale cho tới khi hết TTL; nên xoá cache sau khi ghi DB thay vì ghi đè (hoặc kiểm tra version)
- [ ] Cache = 200 vì Redis sắp thứ tự `SET` theo thời điểm commit của DB
> Hai writer cập nhật cache theo thứ tự khác với thứ tự commit DB, nên giá trị cũ ghi đè giá trị mới. Xoá cache thì idempotent và để lần đọc sau nạp giá trị mới nhất; Redis không biết gì về thứ tự commit của DB.

## p99 latency tăng vọt định kỳ; `SLOWLOG` cho thấy `HGETALL product:catalog` mất 180ms, hash này có 3 triệu field. Hướng xử lý đúng? [senior]
- [ ] Chuyển `HGETALL` sang pipeline
- [x] Tách big key thành nhiều key nhỏ (chia bucket theo hash của id), chỉ đọc field cần bằng `HMGET` hoặc duyệt bằng `HSCAN`, xoá key cũ bằng `UNLINK`
- [ ] Tăng `io-threads` để `HGETALL` chạy song song
- [ ] Bật `appendfsync always` để giảm latency
> Big key làm mỗi lệnh O(N) block thread chính, tốn băng thông, và còn gây lệch tải trên Cluster. Pipeline không làm một lệnh nhanh hơn, và `io-threads` chỉ song song hoá I/O socket, không song song hoá việc thực thi. Có thể tìm big key bằng `redis-cli --bigkeys` hoặc `--memkeys`.

## Một message trong Stream làm consumer crash mỗi lần xử lý; vòng `XAUTOCLAIM` cứ giao lại nó cho consumer khác và cả group bị kẹt. Cách xử lý chuẩn? [senior]
- [ ] `XDEL` message khỏi stream, PEL sẽ tự sạch
- [ ] Tăng `min-idle-time` của `XAUTOCLAIM` để message ít bị claim hơn
- [ ] Chuyển sang Pub/Sub để không còn redelivery
- [x] Dựa vào delivery count (trả về từ `XPENDING`): vượt ngưỡng thì ghi message sang dead-letter stream rồi `XACK` nó
> Mỗi lần `XCLAIM`/`XAUTOCLAIM` giao lại message, delivery count tăng lên, nên đây là tín hiệu nhận diện poison message. `XDEL` không gỡ entry khỏi PEL; tăng idle time chỉ làm chậm vòng lặp chứ không chấm dứt nó.

## Ứng dụng .NET dùng StackExchange.Redis báo lỗi `Timeout performing GET ... WORKER: (Busy=250,Free=32517,Min=8,Max=32767)` dưới tải cao, trong khi Redis server rảnh. Nguyên nhân có khả năng nhất? [senior]
- [x] Thread pool starvation: code gọi `.Result`/`.Wait()` trên async (sync-over-async), số worker busy vượt xa `Min` nên thread mới được tạo chậm, reply không kịp xử lý; sửa bằng async xuyên suốt và/hoặc tăng `ThreadPool.SetMinThreads`
- [ ] Redis server xử lý command chậm, cần tăng `maxclients`
- [ ] Phải tạo `ConnectionMultiplexer` mới cho mỗi request để có thêm socket
- [ ] Key `GET` quá lớn nên Redis trả về chậm
> Thông báo timeout của StackExchange.Redis kèm số liệu thread pool; Busy lớn hơn nhiều so với Min là dấu hiệu kinh điển của starvation phía client. Server rảnh nghĩa là vấn đề nằm ở phía ứng dụng, và tạo nhiều multiplexer chỉ làm mọi thứ tệ hơn.

## Log Redis có `Can't save in background: fork: Cannot allocate memory`, sau đó mọi lệnh ghi trả về lỗi `MISCONF Redis is configured to save RDB snapshots, but it's currently unable to persist to disk`. Nguyên nhân và cách sửa đúng? [senior]
- [ ] Đĩa đầy; cần xoá file AOF cũ
- [ ] Đạt `maxmemory`; đổi policy sang `allkeys-lru`
- [x] `fork` thất bại do kernel overcommit heuristic, và với `stop-writes-on-bgsave-error yes` Redis từ chối ghi; đặt `vm.overcommit_memory=1` và đảm bảo đủ RAM cho copy-on-write
- [ ] Replica bị lag; tăng `repl-backlog-size`
> Khi `fork` một process lớn, kernel với `vm.overcommit_memory=0` có thể từ chối cấp phát dù thực tế COW cần ít bộ nhớ hơn. Redis chủ động chặn ghi để không âm thầm mất khả năng persist; lỗi OOM do `maxmemory` có thông báo khác hẳn.

## Client đo được p99 latency 120ms, nhưng `SLOWLOG GET` (ngưỡng 10ms) trống. Giải thích nào hợp lý nhất? [senior]
- [ ] `SLOWLOG` bao gồm cả thời gian mạng, nên khi nó trống thì phép đo phía client chắc chắn sai
- [x] `SLOWLOG` chỉ đo thời gian thực thi command, không tính network I/O hay thời gian chờ; latency có thể đến từ mạng, value lớn, fork, hoặc phía client, nên cần kiểm tra bằng `LATENCY DOCTOR` hoặc `redis-cli --latency`
- [ ] `SLOWLOG` chỉ ghi lệnh ghi, bỏ qua lệnh đọc
- [ ] `SLOWLOG` tự động reset mỗi phút nên đã mất dữ liệu
> `slowlog-log-slower-than` tính bằng microsecond và chỉ đo phần thực thi trên server. Latency spike do fork, swap, THP hoặc mạng được ghi nhận qua latency monitor, không qua slowlog.

## Redis chạy một core ở mức 100% vì nhiều lệnh `ZUNIONSTORE` trên các Sorted Set lớn, 7 core còn lại rảnh. Bật `io-threads 4` sẽ có tác dụng gì? [senior]
- [x] Gần như không giải quyết được: `io-threads` chỉ song song hoá đọc/ghi socket và parse protocol, việc thực thi command vẫn single-threaded nên lệnh nặng vẫn block
- [ ] Redis chia mỗi `ZUNIONSTORE` ra chạy song song trên 4 core
- [ ] Mỗi client được phục vụ bởi một thread riêng, nên các lệnh nặng không block nhau
- [ ] Redis chuyển sang chế độ multi-master với 4 shard nội bộ
> I/O threading (Redis 6+) giúp khi bottleneck nằm ở network I/O với nhiều kết nối, không giúp với command tốn CPU. Muốn scale command nặng phải tối ưu thuật toán/dữ liệu hoặc shard dữ liệu bằng Cluster.

## Phát biểu nào đúng về Valkey? [senior]
- [ ] Valkey là Redis Enterprise được Redis Ltd. đổi tên và phát hành miễn phí
- [ ] Valkey fork từ Redis 4 vì Redis bỏ hỗ trợ module
- [ ] Valkey là thư viện client cho Redis viết bằng Rust
- [x] Năm 2024 Redis đổi license từ BSD sang dual RSALv2/SSPLv1 (từ 7.4); Linux Foundation fork Redis 7.2.4 thành Valkey với license BSD-3, tương thích protocol và command
> Việc đổi license khiến các cloud provider và cộng đồng lập Valkey làm bản kế nhiệm mã nguồn mở. Sau đó Redis 8 bổ sung AGPLv3 như một lựa chọn license, nhưng Valkey vẫn phát triển độc lập.
