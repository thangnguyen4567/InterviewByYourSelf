---
topic: system-design
---

## Hệ thống cần 99.99% availability. Downtime tối đa mỗi năm xấp xỉ bao nhiêu? [junior]
- [ ] ~8.76 giờ
- [ ] ~3.65 ngày
- [x] ~52.6 phút
- [ ] ~5.26 phút
> 0.01% × 525,600 phút/năm ≈ 52.6 phút. 8.76 giờ là của 99.9%, còn ~5.26 phút là của 99.999%.

## Ứng dụng có 10 triệu DAU, mỗi user trung bình gửi 10 request/ngày. QPS trung bình xấp xỉ bao nhiêu? [junior]
- [ ] ~120
- [x] ~1,200
- [ ] ~12,000
- [ ] ~100,000
> 100 triệu request / 86,400 giây ≈ 1,157 QPS. Khi thiết kế thường nhân thêm hệ số peak (×2–×5) chứ không dùng con số trung bình để sizing.

## Thứ tự latency nào đúng (từ nhanh đến chậm) theo "latency numbers every programmer should know"? [junior]
- [ ] RAM < L1 cache < SSD random read < round trip liên lục địa < round trip trong cùng datacenter
- [ ] L1 cache < SSD random read < RAM < round trip trong cùng datacenter < round trip liên lục địa
- [ ] L1 cache < RAM < round trip liên lục địa < SSD random read < HDD seek
- [x] L1 cache < RAM < SSD random read < round trip trong cùng datacenter < round trip liên lục địa
> Cỡ độ lớn: L1 ~1 ns, RAM ~100 ns, SSD random read ~16–150 µs, round trip trong datacenter ~0.5 ms, round trip liên lục địa ~150 ms. RAM luôn nhanh hơn SSD hàng trăm lần.

## Mô tả nào đúng về Pull CDN? [junior]
- [x] CDN edge chỉ lấy file từ origin khi có request đầu tiên bị miss, sau đó cache theo TTL
- [ ] Origin chủ động upload toàn bộ nội dung lên CDN trước khi user truy cập
- [ ] CDN chỉ phù hợp cho dữ liệu động thay đổi theo từng request
- [ ] Pull CDN không bao giờ cần cấu hình TTL vì luôn đọc từ origin
> Pull CDN tự kéo nội dung khi bị miss nên dễ vận hành, nhưng request đầu tiên chậm. Push CDN (origin chủ động upload) phù hợp với file lớn, ít thay đổi và cần kiểm soát thời điểm phát hành.

## Cần route `/api/*` tới cụm backend và `/static/*` tới cụm khác. Loại load balancer nào làm được? [junior]
- [ ] L4 load balancer, vì nó đọc được IP và port
- [x] L7 load balancer, vì nó đọc được nội dung HTTP như path, header, cookie
- [ ] Chỉ DNS round robin mới làm được
- [ ] Không LB nào làm được, phải tách domain riêng
> L7 hiểu giao thức ứng dụng nên route được theo path/host/header. L4 chỉ thấy IP/port/TCP nên không phân biệt được `/api` hay `/static`.

## Ứng dụng lưu session trong memory của từng instance; sau load balancer round robin, user bị logout ngẫu nhiên. Bật sticky session thì có nhược điểm gì? [junior]
- [ ] Không có nhược điểm, đây là cách chuẩn để scale stateful app
- [ ] LB phải giải mã toàn bộ body request nên rất chậm
- [x] Tải phân bố không đều và user mất session khi instance của họ chết hoặc bị scale in
- [ ] Bắt buộc phải chuyển LB sang thuật toán least connections
> Sticky session chỉ che lỗi thiết kế stateful: instance chết là mất session, và hot user dồn vào một node. Cách bền vững là đưa session ra store chung (Redis) hoặc dùng token stateless.

## Thuật toán rate limiting nào cho phép một lượng burst ngắn nhưng vẫn giới hạn tốc độ trung bình? [junior]
- [x] Token bucket
- [ ] Leaky bucket với hàng đợi kích thước 0
- [ ] Fixed window với cửa sổ 1 ngày
- [ ] Round robin
> Token bucket tích lũy token đến dung lượng bucket, nên client dồn token có thể burst rồi bị giới hạn theo tốc độ nạp. Round robin là thuật toán load balancing, không phải rate limiting.

## Phát biểu nào đúng về Bloom filter? [junior]
- [ ] Có thể trả lời "có" chắc chắn 100% và "không" có thể sai
- [ ] Hỗ trợ xóa phần tử dễ dàng bằng cách reset các bit
- [ ] Lưu toàn bộ giá trị gốc nên tốn bộ nhớ như hash set
- [x] Có thể false positive nhưng không bao giờ false negative
> Bloom filter trả "không có" là chắc chắn, "có thể có" thì có thể sai. Bloom filter chuẩn không xóa được vì reset bit có thể ảnh hưởng phần tử khác (cần Counting Bloom filter).

## Dịch vụ lưu 1 triệu ảnh mới mỗi ngày, mỗi ảnh trung bình 500 KB, giữ 5 năm (chưa tính replica). Dung lượng xấp xỉ? [junior]
- [ ] ~9 TB
- [ ] ~90 TB
- [x] ~0.9 PB
- [ ] ~9 PB
> 1 triệu × 500 KB = 500 GB/ngày; × 365 × 5 ≈ 912 TB ≈ 0.9 PB. Nhân thêm 3 nếu replication factor = 3.

## Snowflake ID 64-bit gồm những thành phần chính nào? [junior]
- [x] Timestamp (ms) + machine/worker ID + sequence number
- [ ] Random 122 bit + version
- [ ] Hash MD5 của nội dung bản ghi
- [ ] Auto-increment từ một database trung tâm
> Snowflake: 1 bit dấu + 41 bit timestamp + 10 bit machine ID + 12 bit sequence, sinh phân tán, không cần điều phối và sắp xếp gần đúng theo thời gian.

## Vai trò của Dead Letter Queue (DLQ)? [junior]
- [ ] Lưu message đã xử lý thành công để audit
- [x] Chứa message xử lý thất bại sau số lần retry tối đa, để không chặn queue chính và có thể điều tra/replay
- [ ] Tăng throughput bằng cách xử lý song song
- [ ] Thay thế hoàn toàn cơ chế retry
> DLQ cô lập "poison message" để consumer không retry vô hạn và chặn các message sau. Cần monitor và có quy trình replay sau khi fix lỗi.

## Phân biệt RPO và RTO? [junior]
- [ ] RPO là thời gian khôi phục dịch vụ, RTO là lượng dữ liệu được phép mất
- [ ] Cả hai đều đo uptime theo năm
- [ ] RPO áp dụng cho cache, RTO áp dụng cho database
- [x] RPO là lượng dữ liệu tối đa được phép mất (tính theo thời gian), RTO là thời gian tối đa để khôi phục dịch vụ
> Ví dụ backup mỗi 1 giờ → RPO tối đa ~1 giờ. RTO là khoảng từ lúc sự cố đến khi dịch vụ chạy lại; hay bị nhầm ngược hai khái niệm.

## Dashboard chỉ cần server đẩy cập nhật giá một chiều xuống browser. Công nghệ đơn giản và phù hợp nhất? [junior]
- [ ] WebSocket, vì là cách duy nhất để server push
- [x] Server-Sent Events (SSE), một chiều server→client qua HTTP, có auto-reconnect
- [ ] Short polling mỗi 100 ms
- [ ] gRPC bidirectional streaming trực tiếp từ browser
> SSE chạy trên HTTP thường, đơn giản, tự reconnect, phù hợp luồng một chiều. WebSocket mạnh hơn (hai chiều) nhưng phức tạp hơn mức cần thiết ở đây.

## Cần leaderboard real-time cho game với hàng triệu người chơi, lấy top 100 và hạng của một user. Cấu trúc dữ liệu phù hợp? [junior]
- [ ] Redis List, sort lại mỗi lần đọc
- [ ] Bảng SQL với `ORDER BY score DESC` không index cho mỗi request
- [x] Redis Sorted Set (`ZADD`, `ZREVRANGE`, `ZREVRANK`)
- [ ] Redis HyperLogLog
> Sorted Set (skip list) cho update và lấy rank O(log N). HyperLogLog chỉ ước lượng số phần tử distinct, không lưu thứ hạng.

## Elasticsearch tìm kiếm full-text nhanh chủ yếu nhờ cấu trúc nào? [junior]
- [x] Inverted index: ánh xạ từng term → danh sách document chứa term đó
- [ ] B-tree index trên toàn bộ chuỗi văn bản
- [ ] Quét tuần tự mọi document nhưng chạy song song
- [ ] Hash index trên ID document
> Text được analyze (tokenize, lowercase, stemming) thành term, mỗi term trỏ tới posting list. B-tree trên chuỗi đầy đủ không hỗ trợ tìm theo từ ở giữa câu.

## Điểm khác biệt chính giữa leaky bucket và token bucket? [mid]
- [ ] Leaky bucket cho phép burst lớn hơn token bucket
- [ ] Token bucket bỏ request, leaky bucket không bao giờ bỏ request
- [ ] Hai thuật toán hoàn toàn tương đương về hành vi đầu ra
- [x] Leaky bucket xả request ra với tốc độ cố định (làm mượt traffic), token bucket cho phép burst khi còn token
> Leaky bucket như hàng đợi xả đều, phù hợp bảo vệ downstream cần tốc độ ổn định; queue đầy thì request bị drop. Token bucket linh hoạt hơn với traffic burst.

## API giới hạn 100 request/phút bằng fixed window counter. Client gửi 100 request lúc 00:00:59 và 100 request lúc 00:01:00. Vấn đề và cách khắc phục? [mid]
- [ ] Không có vấn đề, mỗi cửa sổ đều đúng 100 request
- [x] 200 request lọt qua trong ~2 giây ở ranh giới cửa sổ; dùng sliding window log hoặc sliding window counter
- [ ] Client bị chặn toàn bộ 200 request; chuyển sang leaky bucket
- [ ] Counter bị race condition; chỉ cần thêm lock
> Fixed window reset đột ngột ở ranh giới nên cho phép gấp đôi limit trong thời gian ngắn. Sliding window counter nội suy theo trọng số cửa sổ trước, tốn ít bộ nhớ hơn sliding log.

## Cụm cache dùng consistent hashing với 4 node vật lý, mỗi node một điểm trên ring. Tải rất lệch và khi một node chết, toàn bộ tải dồn sang node kế tiếp. Giải pháp? [mid]
- [ ] Chuyển về `hash(key) % N` cho phân bố đều
- [ ] Tăng TTL của cache
- [x] Dùng virtual nodes: mỗi node vật lý có nhiều điểm trên ring
- [ ] Thêm replica cho node kế tiếp node chết
> Virtual nodes làm phân bố đều hơn và khi một node rời ring, key của nó rải ra nhiều node khác. `hash % N` sẽ remap gần như toàn bộ key khi N thay đổi.

## Bảng MySQL InnoDB dùng UUID v4 làm primary key, insert ngày càng chậm và index phình to. Nguyên nhân và hướng xử lý? [mid]
- [x] UUID v4 ngẫu nhiên làm insert rải khắp clustered index gây page split; dùng ID có thứ tự thời gian như UUID v7/ULID/Snowflake
- [ ] UUID v4 bị trùng thường xuyên; chuyển sang MD5
- [ ] InnoDB không hỗ trợ khóa 128-bit; chuyển sang MyISAM
- [ ] Do thiếu index phụ trên cột UUID
> InnoDB lưu dữ liệu theo thứ tự PK, key ngẫu nhiên làm mất locality, cache kém và page split liên tục. UUID v7/ULID có tiền tố timestamp nên insert gần như append ở cuối index.

## Hệ thống leaderless với N=3, W=2, R=2. Ý nghĩa của cấu hình này? [mid]
- [ ] Mỗi write ghi vào 2 node nên chịu được 2 node chết khi ghi
- [ ] Đảm bảo linearizability tuyệt đối trong mọi trường hợp
- [ ] Read chỉ cần 1 node phản hồi
- [x] R + W > N nên tập node đọc và tập node ghi luôn giao nhau, read thường thấy được bản ghi mới nhất
> 2 + 2 > 3 đảm bảo overlap. Nhưng vẫn có edge case (sloppy quorum, write lỗi một phần, clock skew khi dùng LWW) nên không bằng linearizability.

## User sửa tên trong profile rồi reload trang thì vẫn thấy tên cũ; DB dùng leader-follower async và đọc từ follower. Cách xử lý phù hợp nhất? [mid]
- [ ] Chuyển toàn bộ replica sang synchronous
- [x] Đảm bảo read-your-writes: đọc dữ liệu của chính user từ leader trong một khoảng ngắn sau khi ghi (hoặc theo replication position)
- [ ] Tăng số lượng follower
- [ ] Thêm cache trước follower
> Đây là replication lag. Read-your-writes chỉ định tuyến các read nhạy cảm, không phạt toàn hệ thống như sync replication. Thêm follower hay cache không giải quyết độ trễ.

## Attacker gửi hàng loạt request với ID sản phẩm không tồn tại, cache luôn miss và DB bị quá tải. Đây là vấn đề gì, xử lý thế nào? [mid]
- [ ] Cache avalanche; thêm jitter vào TTL
- [ ] Cache stampede; dùng mutex khi rebuild
- [x] Cache penetration; cache cả giá trị null với TTL ngắn và/hoặc dùng Bloom filter chặn key không tồn tại
- [ ] Hot key; nhân bản key ra nhiều shard
> Penetration là truy vấn dữ liệu không tồn tại nên không bao giờ được cache. Avalanche là nhiều key hết hạn cùng lúc, stampede là một key hot hết hạn.

## Sau khi warm-up cache lúc 0h với cùng TTL 1 giờ, đúng 1h sáng DB bị quá tải đột biến. Giải pháp phù hợp nhất? [mid]
- [x] Thêm random jitter vào TTL để các key hết hạn rải rác
- [ ] Giảm TTL xuống 1 phút
- [ ] Dùng Bloom filter trước cache
- [ ] Chuyển cache sang write-through
> Đây là cache avalanche: hàng loạt key hết hạn đồng thời. Jitter TTL phân tán thời điểm hết hạn; Bloom filter dành cho cache penetration.

## Key trang chủ bị hàng nghìn request truy cập mỗi giây; mỗi lần hết hạn, hàng trăm request cùng query DB nặng để rebuild. Giải pháp phù hợp nhất? [mid]
- [ ] Cache giá trị null cho key đó
- [ ] Tăng số connection pool của DB
- [ ] Xóa key thủ công trước khi hết hạn
- [x] Chỉ cho một request rebuild (mutex/single-flight), các request khác dùng giá trị cũ hoặc chờ; hoặc refresh sớm trước khi hết hạn
> Đây là cache stampede (thundering herd). Single-flight hoặc probabilistic early expiration giảm số request chạm DB xuống còn một. Tăng connection pool chỉ làm DB chịu thêm tải.

## Hệ thống active-passive failover bằng cách đổi DNS record sang region dự phòng, nhưng nhiều client vẫn gọi IP cũ hàng giờ. Nguyên nhân chính? [mid]
- [x] TTL của DNS record quá dài và resolver/client cache kết quả DNS
- [ ] DNS chỉ hỗ trợ IPv6
- [ ] Load balancer ở region mới chưa bật sticky session
- [ ] CDN chặn mọi request tới region mới
> Failover dựa trên DNS phụ thuộc TTL và việc client tôn trọng TTL (một số runtime cache lâu hơn). Cần TTL thấp trước khi failover hoặc dùng anycast/global load balancer.

## Team muốn mỗi thay đổi trong bảng `orders` được đồng bộ sang Elasticsearch, hiện code đang ghi DB rồi ghi ES (dual write) và đôi khi lệch dữ liệu. Giải pháp phù hợp nhất? [mid]
- [ ] Bọc hai lệnh ghi trong cùng một try/catch
- [ ] Cron job mỗi đêm reindex toàn bộ
- [x] Change Data Capture (ví dụ Debezium đọc binlog/WAL) đẩy thay đổi qua Kafka rồi index vào ES
- [ ] Ghi ES trước rồi mới ghi DB
> CDC lấy DB làm nguồn sự thật duy nhất và đọc log commit, nên không mất thay đổi khi app crash giữa hai lệnh ghi. Đổi thứ tự dual write chỉ đổi kiểu lệch dữ liệu.

## Ứng dụng chat cần hiển thị trạng thái online/offline cho hàng chục triệu user. Thiết kế presence nào hợp lý? [mid]
- [ ] Mỗi khi user online, broadcast sự kiện tới toàn bộ user trên hệ thống
- [x] Client gửi heartbeat định kỳ, server lưu last-seen với TTL; chỉ đẩy thay đổi tới những người đang mở cuộc trò chuyện/danh sách bạn liên quan
- [ ] Query DB mỗi giây để kiểm tra từng user còn kết nối TCP không
- [ ] Đánh dấu offline ngay khi mất một gói tin heartbeat
> Heartbeat + TTL chịu được mạng chập chờn (thường cho phép trễ vài chu kỳ). Fan-out presence phải giới hạn theo người quan tâm, broadcast toàn cục sẽ bùng nổ số message.

## Đặc điểm của fan-out on write (push model) trong news feed? [mid]
- [ ] Đọc feed chậm vì phải merge bài từ mọi người được follow lúc request
- [ ] Không tốn thêm storage vì chỉ lưu bài gốc
- [ ] Phù hợp nhất với tài khoản có hàng chục triệu follower
- [x] Khi đăng bài, ghi post ID vào feed của từng follower nên đọc feed rất nhanh, nhưng ghi tốn kém
> Push model đổi chi phí ghi lấy tốc độ đọc. Với tài khoản rất nhiều follower, chi phí ghi bùng nổ, đó là celebrity problem.

## Autocomplete cần trả về top 5 gợi ý trong < 50 ms cho mỗi ký tự gõ. Thiết kế phù hợp? [mid]
- [ ] Mỗi lần gõ chạy `LIKE 'prefix%'` rồi `ORDER BY count` trên bảng query log
- [x] Trie trong đó mỗi node lưu sẵn top-k gợi ý; cập nhật tần suất offline theo batch
- [ ] Inverted index full-text với fuzzy match trên mọi request
- [ ] Bloom filter chứa toàn bộ câu truy vấn
> Lưu sẵn top-k tại node làm việc đọc gần O(độ dài prefix). Cập nhật trie theo batch (hàng giờ/ngày) tránh ghi nóng trên đường đọc; Bloom filter không liệt kê được phần tử.

## Ứng dụng gọi xe dùng geohash để tìm tài xế gần. Có những tài xế chỉ cách 100 m nhưng không xuất hiện trong kết quả. Nguyên nhân và cách sửa? [mid]
- [ ] Geohash không hỗ trợ tọa độ âm
- [ ] Do precision geohash quá thấp; tăng precision là đủ
- [x] Tài xế nằm ở cell kề bên dù rất gần; cần query cả cell hiện tại và 8 cell lân cận rồi lọc theo khoảng cách
- [ ] Phải dùng Bloom filter cho vị trí
> Hai điểm gần nhau có thể khác prefix geohash khi nằm hai bên ranh giới cell. Tăng precision còn làm cell nhỏ hơn nên vấn đề ranh giới xuất hiện nhiều hơn.

## Hai worker dùng distributed lock có lease 10 giây. Worker A bị GC pause 15 giây, lock hết hạn, worker B lấy lock và ghi; sau đó A tỉnh dậy và ghi đè dữ liệu. Cách khắc phục đúng? [senior]
- [x] Dùng fencing token tăng dần cấp cùng lock; storage từ chối write có token nhỏ hơn token đã thấy
- [ ] Tăng lease lên 60 giây là đủ
- [ ] Chuyển sang Redlock với 5 node Redis
- [ ] A kiểm tra lại lock ngay trước khi ghi
> Pause có thể xảy ra ngay sau bước kiểm tra, nên check lại hay tăng lease chỉ giảm xác suất. Fencing token buộc chính resource bảo vệ tính đúng; Redlock cũng không có fencing.

## Hệ thống multi-leader (hai region đều nhận ghi) dùng last-write-wins theo timestamp. Rủi ro lớn nhất? [senior]
- [ ] Không thể đọc dữ liệu khi một region chết
- [ ] Write latency tăng gấp đôi vì phải chờ cả hai region
- [x] Các cập nhật đồng thời bị âm thầm mất, và clock skew có thể làm bản ghi cũ hơn "thắng"
- [ ] LWW đảm bảo không xung đột nên không có rủi ro
> LWW giải quyết conflict bằng cách vứt bỏ một phía, không báo lỗi. Với dữ liệu quan trọng cần conflict-free (CRDT), merge theo ngữ nghĩa, hoặc phân vùng để mỗi bản ghi chỉ có một leader.

## Một sản phẩm flash sale tạo 500k QPS vào cùng một key Redis, vượt năng lực của một shard trong khi các shard khác rảnh. Giải pháp phù hợp nhất? [senior]
- [ ] Thêm shard cho cluster, consistent hashing sẽ tự chia tải
- [x] Thêm local in-process cache TTL ngắn ở app và/hoặc nhân bản key thành nhiều bản (`key#1..key#N`) rải trên nhiều shard
- [ ] Giảm TTL của key để cache hit nhanh hơn
- [ ] Chuyển key sang DB vì DB chịu tải tốt hơn
> Thêm shard không giúp vì một key luôn map vào một shard. Local cache và key replication chia tải đọc, đổi lại phải chấp nhận stale ngắn hoặc phức tạp khi invalidate.

## Một request fan-out song song tới 100 backend và phải chờ tất cả. Mỗi backend có p99 = 1 giây (còn lại nhanh). Tỷ lệ request tổng bị chậm ≥ 1 giây xấp xỉ? [senior]
- [ ] 1%
- [ ] 10%
- [ ] 99%
- [x] 63%
> 1 − 0.99^100 ≈ 0.634. Tail latency khuếch đại khi fan-out; giảm bằng hedged request, timeout + kết quả partial, hoặc giảm số backend phải chờ.

## Service bị quá tải giờ cao điểm: queue nội bộ không giới hạn phình to, mọi request (kể cả checkout) đều timeout. Hướng xử lý phù hợp nhất? [senior]
- [x] Giới hạn queue (bounded) để tạo back-pressure, và load shedding: chủ động từ chối sớm request ưu tiên thấp (503/429) để giữ latency cho checkout
- [ ] Tăng kích thước queue để không mất request nào
- [ ] Tăng timeout phía client lên 5 phút
- [ ] Retry ngay lập tức mọi request bị timeout
> Queue không giới hạn làm request chờ đến khi vô nghĩa và hệ thống chết theo kiểu "khỏe nhưng vô dụng". Từ chối nhanh có chọn lọc giữ được goodput; retry ngay chỉ làm quá tải nặng hơn.

## Ngân hàng muốn RPO = 0 khi mất cả một region, đồng thời write latency thấp cho user ở hai châu lục. Nhận định đúng? [senior]
- [ ] Active-passive với async replication đạt được cả hai
- [ ] Active-active với async replication đảm bảo RPO = 0
- [x] RPO = 0 đòi hỏi ghi đồng bộ sang region khác trước khi xác nhận, nên phải trả giá bằng write latency liên vùng; cần chọn ưu tiên hoặc phân vùng dữ liệu theo region
- [ ] Chỉ cần backup snapshot mỗi 5 phút
> Async replication luôn có cửa sổ mất dữ liệu (RPO > 0). Sync cross-region đạt RPO = 0 nhưng mỗi write tốn ít nhất một round trip liên vùng; đây là trade-off vật lý.

## Mạng xã hội dùng fan-out on write. Khi một ca sĩ 50 triệu follower đăng bài, hệ thống chậm hàng chục phút. Thiết kế phù hợp nhất? [senior]
```text
Post -> Fan-out service -> ghi vào feed cache của từng follower
```
- [ ] Chuyển toàn bộ hệ thống sang fan-out on read
- [x] Hybrid: push cho tài khoản thường, còn bài của celebrity được pull và merge lúc user đọc feed
- [ ] Tăng số worker fan-out lên 50 triệu
- [ ] Giới hạn mỗi tài khoản tối đa 5,000 follower
> Hybrid giữ đọc nhanh cho đa số và tránh ghi 50 triệu bản cho mỗi bài celebrity. Pull hoàn toàn làm đọc chậm với user follow nhiều người.

## Bán vé concert: 10,000 vé, 1 triệu người bấm mua cùng lúc. Code hiện tại đọc `stock`, kiểm tra `> 0` rồi `UPDATE stock = stock - 1` và bị oversell. Cách sửa phù hợp nhất? [senior]
- [ ] Thêm cache Redis để đọc `stock` nhanh hơn
- [ ] Bọc trong transaction với isolation READ COMMITTED mặc định
- [ ] Kiểm tra lại `stock` hai lần trước khi update
- [x] Giảm tồn kho nguyên tử có điều kiện (`UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock > 0`, hoặc Redis Lua/`DECR`), kết hợp giữ chỗ có TTL và queue để chặn bớt traffic
> Read-check-write tách rời gây race condition; READ COMMITTED không ngăn lost update kiểu này. Câu lệnh điều kiện nguyên tử chỉ thành công khi còn hàng, kiểm tra số hàng bị ảnh hưởng để biết mua được hay không.

## Hệ thống payment cần sổ cái (ledger) đáng tin cậy và dễ audit. Thiết kế nào đúng nguyên tắc? [senior]
- [x] Double-entry, append-only: mỗi giao dịch gồm các entry debit/credit có tổng bằng 0; sai sót được sửa bằng entry đảo (reversal) chứ không update/xóa
- [ ] Một cột `balance` trên bảng `accounts`, cập nhật trực tiếp mỗi giao dịch, không lưu lịch sử
- [ ] Lưu số tiền bằng kiểu `float` để tính toán nhanh
- [ ] Cho phép update entry cũ khi phát hiện sai để giữ sổ gọn
> Append-only + double-entry cho phép tái tạo số dư và phát hiện lệch (tổng debit ≠ credit). Tiền phải dùng kiểu decimal/integer minor unit, `float` gây sai số làm tròn.

## Dịch vụ đồng bộ file kiểu Dropbox chia file thành chunk cố định 4 MB để dedupe. User chèn 1 byte vào đầu file 1 GB thì gần như toàn bộ chunk phải upload lại. Giải pháp? [senior]
- [ ] Giảm chunk xuống 4 KB
- [ ] Nén file trước khi chia chunk
- [x] Content-defined chunking (rolling hash như Rabin) để ranh giới chunk dựa vào nội dung, chỉ chunk quanh vị trí sửa bị thay đổi
- [ ] Upload lại toàn bộ file mỗi lần sửa để đơn giản
> Fixed-size chunking bị dịch toàn bộ ranh giới khi chèn dữ liệu. CDC chunking chọn ranh giới theo nội dung nên các chunk sau vẫn có hash cũ và được dedupe. Chunk nhỏ hơn không giải quyết dịch ranh giới mà còn tăng metadata.

## Nền tảng video có nhiều user mobile mạng chập chờn bị buffering liên tục. Thiết kế phù hợp nhất? [senior]
- [ ] Chỉ phục vụ một file MP4 chất lượng cao nhất qua CDN
- [x] Transcode thành nhiều rendition (bitrate ladder), chia segment ngắn, phát qua HLS/DASH để player tự chuyển bitrate theo băng thông (adaptive bitrate)
- [ ] Chuyển sang WebSocket để stream video từ origin
- [ ] Transcode realtime mỗi khi user bấm play
> ABR cho phép đổi chất lượng ở ranh giới segment mà không dừng phát. Transcode thường làm bất đồng bộ một lần sau upload (pipeline song song theo segment), không phải mỗi lượt xem.

## Chat nhóm sắp xếp tin nhắn theo timestamp của client gửi; user phàn nàn thứ tự tin nhắn bị đảo. Cách xử lý phù hợp nhất? [senior]
- [ ] Đồng bộ đồng hồ mọi điện thoại bằng NTP
- [ ] Dùng timestamp của server nhận, mỗi server một đồng hồ riêng là đủ
- [ ] Sắp xếp theo thứ tự client nhận được qua WebSocket
- [x] Cấp sequence number tăng dần theo từng conversation (ví dụ một partition/leader chịu trách nhiệm mỗi conversation) và sắp xếp theo số đó
> Đồng hồ client và giữa các server đều có skew, nên timestamp không đảm bảo thứ tự. Thứ tự chỉ cần đúng trong phạm vi conversation, nên một nguồn cấp sequence per conversation vừa đúng vừa scale được.

## SaaS multi-tenant dùng chung DB với cột `tenant_id`. Một khách hàng enterprise lớn gây noisy neighbor và yêu cầu dữ liệu cách ly để đáp ứng compliance. Hướng thiết kế hợp lý nhất? [senior]
- [x] Mô hình hybrid: tenant nhỏ ở pooled (kèm row-level security), tenant lớn/nhạy cảm được tách silo (DB hoặc cluster riêng) với routing theo tenant
- [ ] Tách mỗi tenant (kể cả hàng chục nghìn tenant nhỏ) ra một database riêng
- [ ] Giữ nguyên, chỉ thêm index trên `tenant_id`
- [ ] Đặt tenant lớn lên server mạnh hơn nhưng vẫn chung schema và DB
> Silo cho tất cả làm chi phí và vận hành (migration hàng nghìn DB) bùng nổ; pool cho tất cả không đáp ứng cách ly. Hybrid phân tầng theo nhu cầu, cần lớp routing/tenant catalog.

## Cần đổi tên cột `fullname` thành `display_name` trên bảng lớn mà không downtime, app đang chạy rolling deploy. Thứ tự đúng theo expand/contract? [senior]
- [ ] Rename cột trực tiếp rồi deploy code mới ngay sau đó
- [ ] Deploy code đọc `display_name` trước, rồi mới thêm cột
- [x] Thêm cột mới → code ghi cả hai cột → backfill dữ liệu cũ → chuyển đọc sang cột mới → ngừng ghi cột cũ → xóa cột cũ
- [ ] Thêm cột mới → xóa cột cũ → backfill → deploy code mới
> Trong rolling deploy, phiên bản cũ và mới cùng chạy nên schema phải tương thích với cả hai ở mọi bước. Rename trực tiếp làm instance cũ lỗi ngay.

## Chuỗi gọi API Gateway → Service A → Service B → DB, mỗi tầng retry tối đa 3 lần (tổng 3 attempt) khi timeout. Khi DB chậm, chuyện gì xảy ra và cách xử lý? [senior]
- [ ] Mỗi user request tạo tối đa 9 request tới DB; chỉ cần thêm jitter
- [ ] Không vấn đề gì vì retry luôn cải thiện availability
- [ ] Tắt hoàn toàn retry ở mọi tầng
- [x] Retry nhân lên đến 3 × 3 × 3 = 27 request vào DB cho mỗi user request (retry storm); chỉ retry ở một tầng, dùng retry budget và circuit breaker
> Retry ở nhiều tầng nhân cấp số nhân đúng lúc downstream yếu nhất. Jitter chỉ dàn trải thời điểm, không giảm tổng số request; retry budget giới hạn tỷ lệ retry trên tổng traffic.
