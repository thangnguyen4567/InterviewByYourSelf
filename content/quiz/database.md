---
topic: database
---

## Khác biệt chính giữa `WHERE` và `HAVING`? [junior]
- [ ] `HAVING` được thực thi trước `WHERE`
- [x] `WHERE` lọc từng dòng trước `GROUP BY`, `HAVING` lọc các nhóm sau `GROUP BY`
- [ ] `HAVING` không dùng được với aggregate function
- [ ] `WHERE` chỉ dùng được khi câu lệnh có `GROUP BY`
> `WHERE` chạy trước khi gom nhóm nên không dùng được aggregate như `SUM()`, còn `HAVING` lọc trên kết quả đã gom nhóm. Lọc sớm bằng `WHERE` khi có thể sẽ giảm lượng dữ liệu phải group.

## Bảng `t(col)` có 5 dòng với giá trị `1, NULL, 1, NULL, 2`. Kết quả của truy vấn sau? [junior]
```sql
SELECT COUNT(*), COUNT(col), COUNT(DISTINCT col) FROM t;
```
- [ ] `5, 5, 3`
- [ ] `5, 3, 3`
- [ ] `3, 3, 2`
- [x] `5, 3, 2`
> `COUNT(*)` đếm mọi dòng (5), `COUNT(col)` bỏ qua NULL (3), `COUNT(DISTINCT col)` đếm giá trị khác nhau không NULL (1 và 2 → 2). NULL không được coi là một giá trị distinct khi đếm.

## Truy vấn `SELECT * FROM users WHERE deleted_at = NULL;` trả về gì? [junior]
- [ ] Các dòng có `deleted_at` là NULL
- [ ] Các dòng có `deleted_at` khác NULL
- [x] Không dòng nào, vì so sánh `= NULL` cho kết quả UNKNOWN
- [ ] Lỗi cú pháp ở mọi hệ quản trị
> Trong SQL, mọi so sánh với NULL bằng `=` hay `<>` đều cho UNKNOWN, và `WHERE` chỉ giữ dòng có điều kiện TRUE. Muốn lọc NULL phải dùng `IS NULL` / `IS NOT NULL`; câu lệnh này hợp lệ về cú pháp nên không báo lỗi.

## Bảng `Customers` có 3 khách (id 1, 2, 3). Bảng `Orders`: khách 1 có 2 đơn, khách 2 không có đơn, khách 3 có 1 đơn. Truy vấn sau trả về bao nhiêu dòng? [junior]
```sql
SELECT c.id, o.id
FROM Customers c LEFT JOIN Orders o ON o.customer_id = c.id;
```
- [ ] 3
- [x] 4
- [ ] 5
- [ ] 6
> LEFT JOIN giữ mọi dòng bên trái: khách 1 xuất hiện 2 lần (2 đơn), khách 2 xuất hiện 1 lần với `o.id` NULL, khách 3 xuất hiện 1 lần → 4 dòng. Đáp án 3 sai vì quên rằng một dòng bên trái có thể nhân lên theo số dòng khớp bên phải.

## `UNION` khác `UNION ALL` thế nào? [junior]
- [x] `UNION` loại bỏ dòng trùng lặp nên thường chậm hơn, `UNION ALL` giữ nguyên mọi dòng
- [ ] `UNION ALL` loại bỏ dòng trùng, `UNION` giữ nguyên
- [ ] `UNION` cho phép số cột khác nhau giữa các SELECT, `UNION ALL` thì không
- [ ] `UNION ALL` luôn sắp xếp kết quả theo cột đầu tiên
> `UNION` phải sort hoặc hash để khử trùng, tốn chi phí; nếu biết chắc không trùng hoặc cần giữ trùng thì dùng `UNION ALL`. Cả hai đều yêu cầu số cột và kiểu dữ liệu tương thích.

## Phát biểu nào đúng về `DELETE`, `TRUNCATE` và `DROP`? [junior]
- [ ] `DELETE` không có mệnh đề `WHERE` sẽ xóa luôn cấu trúc bảng
- [ ] `TRUNCATE` cho phép lọc dòng bằng `WHERE`
- [x] `TRUNCATE` xóa toàn bộ dữ liệu, thường nhanh hơn `DELETE` và reset identity; `DROP` xóa cả cấu trúc bảng
- [ ] `DROP` chỉ xóa dữ liệu, giữ lại cấu trúc bảng để dùng tiếp
> `TRUNCATE` deallocate các data page thay vì ghi log từng dòng nên nhanh, không có `WHERE` và không kích hoạt trigger DELETE. `DROP` xóa cả định nghĩa bảng, index, constraint.

## Phát biểu nào đúng về primary key? [junior]
- [ ] Một bảng có thể có nhiều primary key
- [ ] Primary key cho phép một giá trị NULL duy nhất
- [ ] Primary key bắt buộc phải là kiểu số tự tăng
- [x] Primary key là duy nhất, không NULL, và một bảng chỉ có một primary key (có thể gồm nhiều cột)
> Primary key định danh duy nhất mỗi dòng, có thể là composite key nhiều cột và có thể là UUID, mã chuỗi... Nhầm lẫn thường gặp là với unique constraint: SQL Server cho phép một NULL trong cột UNIQUE, nhưng primary key thì không.

## Chữ "A" (Atomicity) trong ACID nghĩa là gì? [junior]
- [x] Transaction hoặc thành công toàn bộ, hoặc không có thay đổi nào được áp dụng
- [ ] Dữ liệu sau khi commit sẽ không bị mất dù server sập
- [ ] Các transaction chạy đồng thời không thấy dữ liệu của nhau
- [ ] Dữ liệu luôn thỏa mãn các constraint đã định nghĩa
> Atomicity là "all or nothing", ví dụ chuyển tiền phải trừ và cộng cùng lúc. Phương án thứ hai là Durability, thứ ba là Isolation, thứ tư là Consistency.

## Nhược điểm chính khi tạo quá nhiều index trên một bảng? [junior]
- [ ] Các câu SELECT sẽ chậm hơn
- [x] INSERT/UPDATE/DELETE chậm hơn và tốn thêm dung lượng lưu trữ
- [ ] Bảng không thể có primary key
- [ ] Database tự động khóa bảng khi đọc
> Mỗi lần ghi dữ liệu phải cập nhật tất cả index liên quan, và mỗi index chiếm thêm dung lượng. SELECT thường không chậm đi vì index thừa, chỉ là optimizer có nhiều lựa chọn hơn.

## Trong SQL Server, một bảng có thể có bao nhiêu clustered index? [junior]
- [ ] Không giới hạn
- [ ] Tối đa 2
- [x] Tối đa 1
- [ ] Bằng số cột của bảng
> Clustered index quyết định thứ tự lưu trữ vật lý của chính các dòng dữ liệu (leaf level là data page), nên chỉ có thể có một. Non-clustered index thì có thể tạo nhiều (tới 999).

## Cần xây dựng bảng xếp hạng (leaderboard) điểm người chơi theo thời gian thực bằng Redis. Data type nào phù hợp nhất? [junior]
- [ ] String
- [ ] List
- [ ] Set
- [x] Sorted Set
> Sorted Set lưu member kèm score, giữ thứ tự theo score, hỗ trợ `ZADD`, `ZINCRBY`, `ZREVRANGE`, `ZRANK` với độ phức tạp O(log N). Set thường không có thứ tự, List phải tự sắp xếp lại khi điểm thay đổi.

## Ứng dụng mạng xã hội cần truy vấn nhiều về quan hệ "bạn của bạn", gợi ý kết bạn qua nhiều cấp. Loại NoSQL nào phù hợp nhất? [junior]
- [ ] Key-value store (Redis)
- [x] Graph database (Neo4j)
- [ ] Wide-column store (Cassandra)
- [ ] Time-series database (InfluxDB)
> Graph database lưu node và edge trực tiếp, duyệt quan hệ nhiều cấp hiệu quả mà không cần JOIN đệ quy tốn kém. Key-value store chỉ truy cập theo key nên không phù hợp để duyệt quan hệ.

## Khách 2 trong `Customers` không có đơn hàng nào trong `Orders`. Truy vấn sau cho kết quả thế nào? [mid]
```sql
SELECT c.id, o.id
FROM Customers c
LEFT JOIN Orders o ON o.customer_id = c.id
WHERE o.status = 'PAID';
```
- [ ] Vẫn giữ khách 2 với `o.id` là NULL, vì đây là LEFT JOIN
- [ ] Báo lỗi vì không được lọc cột bảng phải trong `WHERE`
- [ ] Giống hệt khi chuyển `o.status = 'PAID'` vào mệnh đề `ON`
- [x] Khách 2 bị loại, truy vấn hoạt động như INNER JOIN
> Với khách 2, `o.status` là NULL nên `NULL = 'PAID'` là UNKNOWN và dòng bị `WHERE` loại. Muốn giữ khách không có đơn PAID thì đặt điều kiện vào `ON ... AND o.status = 'PAID'`.

## Vì sao truy vấn sau báo lỗi trên SQL Server và PostgreSQL? [mid]
```sql
SELECT price * qty AS amount FROM order_items WHERE amount > 100 ORDER BY amount;
```
- [ ] Vì `ORDER BY` không được dùng alias
- [x] Vì `WHERE` được xử lý logic trước `SELECT`, nên alias `amount` chưa tồn tại
- [ ] Vì không được nhân hai cột trong `SELECT`
- [ ] Vì thiếu `GROUP BY`
> Thứ tự logic là FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY, nên `WHERE` không thấy alias, nhưng `ORDER BY` thì thấy. Cách sửa: lặp lại biểu thức `price * qty > 100` hoặc bọc trong subquery/CTE.

## Bảng lương có các giá trị `300, 200, 200, 100`. Với `ORDER BY salary DESC`, kết quả `RANK()` và `DENSE_RANK()` lần lượt là? [mid]
- [ ] RANK: `1,2,3,4`; DENSE_RANK: `1,2,2,3`
- [ ] RANK: `1,2,2,3`; DENSE_RANK: `1,2,2,4`
- [x] RANK: `1,2,2,4`; DENSE_RANK: `1,2,2,3`
- [ ] RANK: `1,2,2,3`; DENSE_RANK: `1,2,3,4`
> `RANK` cho các giá trị bằng nhau cùng hạng và bỏ qua hạng tiếp theo (nhảy sang 4), `DENSE_RANK` không bỏ hạng (sang 3). `1,2,3,4` là kết quả của `ROW_NUMBER()`.

## Có composite index trên `(a, b, c)`. Truy vấn nào KHÔNG thể dùng index seek theo quy tắc leftmost prefix? [mid]
- [ ] `WHERE a = 1`
- [ ] `WHERE a = 1 AND b = 2`
- [ ] `WHERE a = 1 AND c = 3`
- [x] `WHERE b = 2 AND c = 3`
> B-tree sắp xếp theo `a` trước, nên thiếu cột `a` thì không seek được (thường phải scan; một số DB như MySQL 8 có skip scan nhưng chỉ hiệu quả khi `a` ít giá trị). `WHERE a = 1 AND c = 3` vẫn seek theo `a`, còn `c` được lọc thêm.

## Cột `created_at` có index. Cách viết nào là SARGable (tận dụng được index seek)? [mid]
- [ ] `WHERE YEAR(created_at) = 2024`
- [x] `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`
- [ ] `WHERE CONVERT(varchar(4), created_at, 120) = '2024'`
- [ ] `WHERE DATEDIFF(day, created_at, GETDATE()) < 365`
> Bọc cột trong hàm khiến database phải tính hàm cho từng dòng và không seek được trên index. Viết thành điều kiện range trên cột gốc giữ được SARGability.

## Truy vấn `SELECT order_date, total FROM Orders WHERE customer_id = @id` bị Key Lookup nhiều trong execution plan. Cách tối ưu phù hợp nhất? [mid]
- [ ] Tạo thêm một clustered index trên `customer_id`
- [ ] Thêm hint `WITH (NOLOCK)`
- [x] Tạo index `(customer_id) INCLUDE (order_date, total)` để thành covering index
- [ ] Chuyển sang `SELECT *` để optimizer chọn table scan
> Covering index chứa đủ mọi cột truy vấn cần, nên không phải quay về clustered index lấy thêm cột (Key Lookup). Bảng đã có clustered index thì không tạo thêm được, và NOLOCK không giải quyết vấn đề lookup.

## Ở mức isolation `READ COMMITTED`, hiện tượng nào vẫn CÓ THỂ xảy ra? [mid]
- [ ] Dirty read
- [x] Non-repeatable read và phantom read
- [ ] Chỉ dirty read
- [ ] Không hiện tượng nào
> READ COMMITTED chỉ đảm bảo không đọc dữ liệu chưa commit; đọc lại cùng dòng hoặc cùng điều kiện trong một transaction vẫn có thể ra kết quả khác. Muốn chặn non-repeatable read cần REPEATABLE READ trở lên.

## `B.a_id` có chứa ít nhất một giá trị NULL. Truy vấn sau trả về gì? [mid]
```sql
SELECT * FROM A WHERE A.id NOT IN (SELECT a_id FROM B);
```
- [ ] Các dòng của A không có trong B, bỏ qua NULL
- [ ] Toàn bộ các dòng của A
- [ ] Báo lỗi vì subquery có NULL
- [x] Không dòng nào
> `x NOT IN (1, 2, NULL)` tương đương `x <> 1 AND x <> 2 AND x <> NULL`, và vế cuối luôn UNKNOWN nên điều kiện không bao giờ TRUE. Dùng `NOT EXISTS` hoặc lọc `WHERE a_id IS NOT NULL` trong subquery để tránh bẫy này.

## Áp dụng optimistic locking với cột `version`. Câu `UPDATE products SET stock = 5, version = version + 1 WHERE id = 10 AND version = 3` trả về 0 rows affected. Điều đó nghĩa là gì? [mid]
- [ ] Database bị deadlock, cần restart transaction
- [x] Đã có transaction khác cập nhật dòng này trước, cần báo conflict hoặc đọc lại và thử lại
- [ ] Dòng đang bị khóa, câu lệnh sẽ tự chờ rồi chạy lại
- [ ] Cập nhật thành công nhưng chưa commit
> Optimistic locking không giữ lock khi đọc mà kiểm tra version lúc ghi; 0 dòng bị ảnh hưởng nghĩa là version đã thay đổi. Database không tự retry; ứng dụng (vd. EF Core ném `DbUpdateConcurrencyException`) phải xử lý.

## Bảng `OrderItems(order_id, product_id, quantity, product_name)` có primary key `(order_id, product_id)`. Bảng này vi phạm dạng chuẩn nào đầu tiên? [mid]
- [ ] 1NF, vì có nhiều cột
- [x] 2NF, vì `product_name` chỉ phụ thuộc vào một phần của key (`product_id`)
- [ ] 3NF, vì `quantity` phụ thuộc bắc cầu
- [ ] BCNF, nhưng vẫn đạt 3NF
> 2NF yêu cầu mọi thuộc tính non-key phụ thuộc vào toàn bộ composite key; `product_name` là partial dependency. Cách sửa là tách sang bảng `Products`.

## Redis cấu hình AOF với `appendfsync everysec`. Khi server sập đột ngột, dữ liệu mất tối đa khoảng bao nhiêu? [mid]
- [ ] Không mất gì
- [x] Khoảng 1 giây ghi gần nhất
- [ ] Toàn bộ dữ liệu kể từ lần snapshot RDB gần nhất
- [ ] Toàn bộ dữ liệu, vì AOF chỉ lưu trong RAM
> `everysec` fsync file AOF mỗi giây nên chỉ mất tối đa khoảng 1 giây ghi gần nhất; `always` an toàn hơn nhưng chậm. Mất dữ liệu kể từ snapshot gần nhất là đặc điểm của RDB.

## Người dùng cập nhật profile thành công, reload trang ngay lập tức lại thấy dữ liệu cũ. Hệ thống đọc từ read replica dùng async replication. Nguyên nhân và cách xử lý hợp lý? [mid]
- [ ] Transaction chưa commit; cần tăng isolation level
- [ ] Cache của trình duyệt; cần tắt index
- [x] Replication lag; đọc từ primary ngay sau khi ghi (read-your-writes) hoặc định tuyến theo session
- [ ] Deadlock trên replica; cần restart replica
> Async replication khiến replica chậm hơn primary một khoảng (eventual consistency). Với các thao tác cần đọc lại ngay dữ liệu vừa ghi, nên route sang primary hoặc chờ replica bắt kịp vị trí log (LSN/GTID).

## Trên PostgreSQL, có một session để "idle in transaction" suốt nhiều giờ. Hậu quả nghiêm trọng nhất thường là gì? [senior]
- [ ] Mọi câu SELECT khác bị block cho tới khi session đó kết thúc
- [ ] PostgreSQL tự động rollback toàn bộ transaction khác
- [ ] WAL bị xóa nên không thể restore point-in-time
- [x] VACUUM không dọn được dead tuple mới hơn snapshot của transaction đó, gây table/index bloat
> Với MVCC, UPDATE/DELETE tạo phiên bản dòng mới và để lại dead tuple; VACUUM chỉ dọn được những phiên bản không còn transaction nào có thể thấy. Reader không block reader/writer trong MVCC, nên phương án đầu là sai (trừ khi session giữ lock xung đột); nên đặt `idle_in_transaction_session_timeout`.

## Quy tắc: luôn phải có ít nhất 1 bác sĩ trực. Hai transaction ở PostgreSQL `REPEATABLE READ`, mỗi bên đếm thấy 2 người đang trực rồi cập nhật cho bác sĩ của mình nghỉ. Cả hai đều commit. Đây là hiện tượng gì? [senior]
- [ ] Dirty read; nâng lên READ COMMITTED là đủ
- [ ] Lost update; REPEATABLE READ của PostgreSQL lẽ ra đã chặn được
- [x] Write skew; cần `SERIALIZABLE` (SSI) hoặc khóa tường minh các dòng đã đọc bằng `SELECT ... FOR UPDATE`
- [ ] Phantom read; đây là bug của PostgreSQL
> Hai transaction đọc chung dữ liệu nhưng ghi vào các dòng khác nhau nên snapshot isolation không phát hiện xung đột ghi-ghi. SERIALIZABLE của PostgreSQL phát hiện phụ thuộc đọc-ghi và abort một bên; đây không phải lost update vì hai bên không ghi cùng một dòng.

## T1 chạy `UPDATE accounts ... WHERE id = 1` rồi `... WHERE id = 2`; cùng lúc T2 cập nhật id = 2 rồi id = 1. Điều gì xảy ra và cách phòng tránh tốt nhất? [senior]
- [ ] Hai transaction chờ nhau mãi mãi; cần DBA kill thủ công
- [x] Deadlock, database chọn một transaction làm victim và rollback; nên cập nhật theo thứ tự nhất quán (vd. id tăng dần) và retry khi gặp lỗi deadlock
- [ ] Nâng isolation lên SERIALIZABLE sẽ loại bỏ hoàn toàn deadlock
- [ ] Thêm `WITH (NOLOCK)` vào câu UPDATE để không lấy lock
> Các DB phổ biến có deadlock detector và tự hủy một bên (SQL Server lỗi 1205, PostgreSQL `40P01`). Isolation cao hơn giữ lock lâu hơn nên dễ deadlock hơn; NOLOCK không áp dụng cho việc ghi.

## Phát biểu nào đúng về InnoDB (MySQL) ở isolation level mặc định? [senior]
- [ ] Mặc định là READ COMMITTED giống SQL Server
- [ ] Mọi SELECT thường đều lấy shared lock trên các dòng đã đọc
- [x] Mặc định là REPEATABLE READ; SELECT thường đọc consistent snapshot, còn locking read/UPDATE dùng next-key lock (gồm gap lock) để hạn chế phantom
- [ ] REPEATABLE READ của InnoDB không hỗ trợ MVCC
> InnoDB dùng MVCC cho consistent nonlocking read và next-key lock cho `SELECT ... FOR UPDATE`, `UPDATE`, `DELETE` theo range. Gap lock cũng là nguyên nhân hay gặp gây deadlock khi insert đồng thời vào cùng khoảng.

## Phát biểu nào chính xác nhất về hint `WITH (NOLOCK)` trong SQL Server? [senior]
- [ ] Hoàn toàn không lấy lock nào, kể cả schema lock
- [ ] Chỉ đọc dữ liệu đã commit nhưng không chờ lock
- [ ] Tương đương với bật Snapshot Isolation
- [x] Có thể đọc dữ liệu chưa commit, và thậm chí bỏ sót hoặc đọc trùng dòng khi có page split trong lúc scan
> NOLOCK = READ UNCOMMITTED: vẫn lấy Sch-S lock, nhưng không tôn trọng lock của writer. Với allocation-order scan, việc dữ liệu di chuyển do page split có thể làm một dòng bị đọc 2 lần hoặc bỏ sót; muốn đọc không chặn mà vẫn nhất quán thì dùng RCSI/SNAPSHOT.

## Một stored procedure SQL Server lúc chạy nhanh lúc rất chậm tùy tham số truyền vào, dù dữ liệu không đổi. Nguyên nhân khả dĩ nhất? [senior]
- [ ] Transaction log bị đầy
- [x] Parameter sniffing: plan được compile và cache theo giá trị tham số lần đầu, không phù hợp với giá trị có phân phối dữ liệu khác
- [ ] Stored procedure không được dùng index nào
- [ ] Do statistics luôn được cập nhật tự động sau mỗi lần chạy
> Với dữ liệu lệch (skewed), plan tối ưu cho giá trị hiếm (seek + lookup) lại tệ cho giá trị phổ biến (nên scan). Cách xử lý: `OPTION (RECOMPILE)`, `OPTIMIZE FOR`, tách procedure, hoặc Query Store force plan.

## API phân trang dùng `ORDER BY created_at DESC OFFSET 1000000 LIMIT 20` rất chậm ở trang sâu. Giải pháp tốt nhất? [senior]
- [ ] Tăng `LIMIT` lên để giảm số request
- [ ] Thêm index trên `OFFSET`
- [ ] Dùng `SELECT COUNT(*)` trước để optimizer biết số trang
- [x] Keyset pagination: `WHERE (created_at, id) < (:last_created_at, :last_id) ORDER BY created_at DESC, id DESC LIMIT 20` với index `(created_at, id)`
> OFFSET vẫn phải đọc và bỏ qua 1 triệu dòng; keyset seek thẳng đến vị trí tiếp theo nên chi phí gần như không đổi theo độ sâu. Đánh đổi là không nhảy trực tiếp đến trang bất kỳ được, và cần cột `id` để phá thế hòa của `created_at`.

## MySQL: cột `phone VARCHAR(20)` có index. Truy vấn `WHERE phone = 0912345678` (không có dấu nháy) có vấn đề gì? [senior]
- [x] MySQL ép chuỗi sang số để so sánh từng dòng nên không dùng được index để lookup, và có thể khớp sai (vd. `'912345678'` cũng bằng)
- [ ] MySQL báo lỗi kiểu dữ liệu và không chạy
- [ ] MySQL tự ép hằng số sang chuỗi `'0912345678'` nên vẫn dùng index bình thường
- [ ] Không có vấn đề gì, kết quả và hiệu năng như có dấu nháy
> Khi so sánh chuỗi với số, MySQL chuyển cả hai về số (floating-point), nên phải chuyển đổi cột ở mọi dòng và mất SARGability; số 0 đầu cũng bị mất. Ngược lại, cột số so với hằng chuỗi thì vẫn dùng được index.

## Sharding theo range trên `order_id` tự tăng (shard 1: 1–10 triệu, shard 2: 10–20 triệu...). Vấn đề lớn nhất khi tải ghi cao? [senior]
- [ ] Không thể truy vấn theo `order_id`
- [x] Hot spot: mọi đơn hàng mới đều ghi vào shard cuối cùng trong khi các shard cũ gần như rảnh
- [ ] Mỗi query đều phải scatter-gather qua mọi shard
- [ ] Không thể thêm shard mới
> Key tăng đơn điệu với range sharding dồn toàn bộ write mới vào một shard. Hash sharding phân tán đều write nhưng khiến range query phải scatter-gather, đó là đặc điểm của hash chứ không phải range.

## Trên PostgreSQL 14, với bảng 500 triệu dòng, lệnh nào có khả năng rewrite toàn bộ bảng và giữ `ACCESS EXCLUSIVE` lock rất lâu? [senior]
- [ ] `ALTER TABLE t ADD COLUMN status int NOT NULL DEFAULT 0;`
- [ ] `ALTER TABLE t ADD COLUMN note text;`
- [ ] `ALTER TABLE t DROP COLUMN legacy_flag;`
- [x] `ALTER TABLE t ALTER COLUMN id TYPE bigint;`
> Từ PostgreSQL 11, thêm cột với default non-volatile chỉ cập nhật metadata; `DROP COLUMN` chỉ đánh dấu cột bị xóa. Đổi `int` → `bigint` thay đổi định dạng lưu trữ nên phải rewrite bảng và rebuild index; trên bảng lớn nên làm theo kiểu thêm cột mới, backfill dần rồi chuyển đổi.

## Phát biểu nào đúng về `CREATE INDEX CONCURRENTLY` trong PostgreSQL? (chọn nhiều) [senior]
- [x] Không chạy được bên trong một transaction block
- [ ] Chạy nhanh hơn `CREATE INDEX` thông thường
- [x] Nếu thất bại giữa chừng, có thể để lại index ở trạng thái INVALID cần drop rồi tạo lại
- [ ] Chặn mọi INSERT/UPDATE/DELETE trên bảng trong suốt quá trình build
> CONCURRENTLY không chặn write, đổi lại phải scan bảng hai lần và chờ các transaction cũ kết thúc nên chậm hơn. Vì không chạy trong transaction được, nhiều migration tool phải tắt transaction riêng cho bước này.

## Đơn hàng 1 có 3 dòng `order_items` và 1 dòng `payments` với amount = 100. Truy vấn sau trả về `paid` bằng bao nhiêu cho đơn 1? [senior]
```sql
SELECT o.id, COUNT(i.id) AS items, SUM(p.amount) AS paid
FROM orders o
JOIN order_items i ON i.order_id = o.id
JOIN payments p ON p.order_id = o.id
GROUP BY o.id;
```
- [ ] 100
- [x] 300
- [ ] 33.33
- [ ] Báo lỗi vì JOIN hai bảng con cùng lúc
> JOIN hai quan hệ one-to-many cùng lúc gây fan-out: 3 items × 1 payment = 3 dòng, nên payment bị cộng 3 lần. Cách sửa là aggregate từng bảng con trong subquery/CTE trước rồi mới JOIN.
