---
id: database
title: Database
icon: 🗄️
order: 5
description: SQL, thiết kế CSDL, index, transaction, concurrency, NoSQL, Redis và vận hành database cho phỏng vấn backend
---

# SQL cơ bản

## Các loại JOIN trong SQL và khác nhau thế nào? [junior]
JOIN dùng để kết hợp dữ liệu từ nhiều bảng dựa trên điều kiện liên kết.

| Loại | Kết quả |
|---|---|
| `INNER JOIN` | Chỉ các dòng khớp ở cả hai bảng |
| `LEFT JOIN` | Toàn bộ bảng trái + phần khớp bên phải (không khớp → `NULL`) |
| `RIGHT JOIN` | Ngược lại với LEFT JOIN |
| `FULL OUTER JOIN` | Toàn bộ hai bảng, không khớp → `NULL` |
| `CROSS JOIN` | Tích Descartes (m × n dòng) |
| `SELF JOIN` | Bảng join với chính nó (vd: nhân viên – quản lý) |

```sql
-- Khách hàng chưa từng đặt hàng (anti-join)
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```

**Lưu ý / bẫy thường gặp:** đặt điều kiện lọc bảng phải của LEFT JOIN trong `WHERE` (vd `WHERE o.status = 'PAID'`) sẽ biến nó thành INNER JOIN. Muốn giữ dòng bên trái thì đưa điều kiện vào `ON`.

## WHERE khác HAVING như thế nào? [junior]
- `WHERE` lọc **từng dòng trước** khi GROUP BY; không dùng được aggregate function.
- `HAVING` lọc **các nhóm sau** khi GROUP BY; dùng được `COUNT`, `SUM`, `AVG`...

```sql
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
WHERE status = 'ACTIVE'          -- lọc dòng
GROUP BY department_id
HAVING AVG(salary) > 20000000;   -- lọc nhóm
```

**Lưu ý / bẫy thường gặp:** điều kiện không liên quan aggregate nên đặt ở `WHERE` để giảm số dòng phải group, nhanh hơn và tận dụng được index.

## Thứ tự thực thi logic của một câu SELECT? [mid]
Thứ tự viết khác thứ tự xử lý logic:

1. `FROM` / `JOIN`
2. `WHERE`
3. `GROUP BY`
4. `HAVING`
5. `SELECT` (tính biểu thức, window function)
6. `DISTINCT`
7. `ORDER BY`
8. `LIMIT` / `OFFSET` / `TOP`

Hệ quả thực tế:
- Không dùng alias của SELECT trong `WHERE` (vì WHERE chạy trước), nhưng dùng được trong `ORDER BY`.
- Window function không đặt trong `WHERE` được → phải bọc subquery/CTE rồi lọc.
- Mọi cột trong SELECT không nằm trong aggregate phải có trong `GROUP BY` (chuẩn SQL; MySQL cũ cho phép nhưng kết quả không xác định).

Optimizer có thể đổi thứ tự vật lý (vd đẩy predicate xuống), nhưng kết quả phải tương đương thứ tự logic này.

## UNION khác UNION ALL? [junior]
- `UNION`: gộp kết quả và **loại bỏ dòng trùng** → phải sort/hash, tốn chi phí.
- `UNION ALL`: gộp nguyên, **giữ dòng trùng** → nhanh hơn.

Điều kiện: số cột bằng nhau, kiểu dữ liệu tương thích theo thứ tự; tên cột lấy theo câu SELECT đầu tiên.

```sql
SELECT email FROM customers
UNION ALL
SELECT email FROM leads;
```

**Lưu ý / bẫy thường gặp:** mặc định nên dùng `UNION ALL` nếu biết chắc dữ liệu không trùng hoặc chấp nhận trùng — dùng `UNION` "cho chắc" là lỗi hiệu năng phổ biến. `ORDER BY` chỉ đặt một lần ở cuối toàn bộ câu.

## Subquery và CTE khác nhau thế nào? Khi nào dùng CTE đệ quy? [mid]
- **Subquery**: truy vấn lồng trong `SELECT/FROM/WHERE`. Có loại *correlated* (tham chiếu cột truy vấn ngoài, chạy lại theo từng dòng về mặt logic).
- **CTE** (`WITH ...`): đặt tên cho một tập kết quả tạm, dễ đọc, tái sử dụng nhiều lần trong cùng câu, hỗ trợ **đệ quy**.

```sql
-- Cây tổ chức: toàn bộ cấp dưới của manager 1
WITH RECURSIVE sub AS (
    SELECT id, name, manager_id, 1 AS lvl FROM employees WHERE id = 1
    UNION ALL
    SELECT e.id, e.name, e.manager_id, s.lvl + 1
    FROM employees e JOIN sub s ON e.manager_id = s.id
)
SELECT * FROM sub;
```
(SQL Server bỏ từ khóa `RECURSIVE`.)

**Lưu ý / bẫy thường gặp:** CTE không mặc định nhanh hơn subquery. SQL Server inline CTE (tham chiếu 2 lần = chạy 2 lần); PostgreSQL < 12 luôn materialize CTE (optimization fence), từ 12 có `MATERIALIZED / NOT MATERIALIZED`. `EXISTS` thường tốt hơn `IN` với subquery lớn và an toàn hơn `NOT IN` khi có `NULL`.

## Window function là gì? Phân biệt ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD. [mid]
Window function tính toán trên một "cửa sổ" các dòng liên quan **mà không gộp dòng** như GROUP BY. Cú pháp: `func() OVER (PARTITION BY ... ORDER BY ... [frame])`.

| Hàm | Với lương 100, 100, 90 |
|---|---|
| `ROW_NUMBER()` | 1, 2, 3 (luôn duy nhất) |
| `RANK()` | 1, 1, 3 (nhảy hạng) |
| `DENSE_RANK()` | 1, 1, 2 (không nhảy) |

`LAG(col, n)` / `LEAD(col, n)` lấy giá trị dòng trước/sau — dùng so sánh kỳ trước.

```sql
SELECT month, revenue,
       revenue - LAG(revenue) OVER (ORDER BY month) AS diff,
       SUM(revenue) OVER (ORDER BY month
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM monthly_sales;
```

**Lưu ý / bẫy thường gặp:** khi có `ORDER BY` mà không chỉ định frame, mặc định là `RANGE ... CURRENT ROW` → các dòng có cùng giá trị sort được tính chung; muốn running total chính xác theo từng dòng nên ghi rõ `ROWS`.

## DELETE, TRUNCATE và DROP khác nhau thế nào? [junior]
| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| Loại lệnh | DML | DDL | DDL |
| Phạm vi | Dòng (có `WHERE`) | Toàn bộ dòng | Cả bảng (cấu trúc + dữ liệu + index) |
| Log | Ghi log từng dòng | Log tối thiểu (deallocate page) | Log tối thiểu |
| Trigger | Kích hoạt | Không | Không |
| Identity/auto increment | Giữ nguyên | Reset | Mất |
| Tốc độ | Chậm với bảng lớn | Rất nhanh | Rất nhanh |
| Rollback | Được | SQL Server/PostgreSQL: được trong transaction; MySQL: auto-commit, không được | Tương tự TRUNCATE |

**Lưu ý / bẫy thường gặp:** TRUNCATE không chạy được khi bảng đang được tham chiếu bởi foreign key (SQL Server), cần quyền cao hơn DELETE. Xóa hàng triệu dòng bằng DELETE nên chia batch để tránh phình transaction log và lock escalation.

# Thiết kế cơ sở dữ liệu

## Chuẩn hóa (normalization) là gì? Giải thích 1NF, 2NF, 3NF, BCNF. [mid]
Chuẩn hóa là tổ chức bảng để **giảm dư thừa** và tránh **update/insert/delete anomaly**.

- **1NF**: mỗi ô chứa giá trị nguyên tố (atomic), không có nhóm lặp (`phone1, phone2` hay `"0901,0902"`).
- **2NF**: đạt 1NF + mọi cột không khóa phụ thuộc **toàn bộ** primary key (không phụ thuộc một phần của composite key). Vd bảng `(order_id, product_id, product_name)` vi phạm vì `product_name` chỉ phụ thuộc `product_id`.
- **3NF**: đạt 2NF + không có **phụ thuộc bắc cầu** (cột không khóa phụ thuộc cột không khóa khác). Vd `employee(id, dept_id, dept_name)` → tách bảng `department`.
- **BCNF**: chặt hơn 3NF — với mọi phụ thuộc hàm `X → Y`, X phải là super key.

Câu nhớ nhanh: *"The key, the whole key, and nothing but the key."*

**Lưu ý / bẫy thường gặp:** thực tế hệ OLTP thường dừng ở 3NF; chuẩn hóa quá mức gây nhiều JOIN, ảnh hưởng hiệu năng đọc.

## Denormalization là gì, khi nào nên dùng? [mid]
Denormalization là **cố ý thêm dư thừa** để tăng tốc đọc, đổi lại việc ghi phức tạp hơn và rủi ro dữ liệu không nhất quán.

Kỹ thuật phổ biến:
- Lưu cột tính sẵn: `orders.total_amount`, `posts.comment_count`.
- Sao chép cột hay dùng: lưu `customer_name` vào `orders` để in hóa đơn (cũng là snapshot lịch sử).
- Bảng tổng hợp / materialized view cho báo cáo.
- Star schema trong data warehouse (OLAP).

Khi nào dùng:
- Hệ thống đọc nhiều hơn ghi rất nhiều, JOIN là bottleneck đã đo được.
- Báo cáo, dashboard, search.

Cách giữ nhất quán: trigger, cập nhật trong cùng transaction, event/CDC, job đồng bộ định kỳ.

**Lưu ý / bẫy thường gặp:** chỉ denormalize khi có số liệu chứng minh, không làm từ đầu "phòng xa". Phân biệt dữ liệu snapshot (giá tại thời điểm mua — *đúng* là phải lưu) với dư thừa thuần túy.

## Phân biệt primary key, unique key, foreign key, candidate key, surrogate key. [junior]
- **Candidate key**: tập cột tối thiểu xác định duy nhất một dòng; có thể có nhiều.
- **Primary key**: candidate key được chọn; `NOT NULL`, duy nhất, mỗi bảng một PK. SQL Server mặc định tạo clustered index trên PK.
- **Unique key**: đảm bảo duy nhất, cho phép `NULL` (SQL Server chỉ 1 NULL; PostgreSQL/MySQL nhiều NULL), một bảng có nhiều unique key.
- **Foreign key**: tham chiếu PK/unique của bảng khác, đảm bảo referential integrity; có `ON DELETE CASCADE / SET NULL / RESTRICT`.
- **Natural key** (CMND, email) vs **surrogate key** (`IDENTITY`, `SERIAL`, UUID) không mang nghĩa nghiệp vụ.

Các constraint khác: `NOT NULL`, `CHECK`, `DEFAULT`.

**Lưu ý / bẫy thường gặp:** FK **không tự tạo index** ở SQL Server/PostgreSQL (MySQL InnoDB có) → JOIN và DELETE bảng cha chậm, dễ lock. UUID v4 ngẫu nhiên làm clustered index phân mảnh; nên dùng UUID v7 / sequential GUID hoặc bigint.

## Nên dùng UUID hay auto-increment làm primary key? [senior]
| | Auto-increment (int/bigint) | UUID |
|---|---|---|
| Kích thước | 4–8 byte | 16 byte |
| Insert vào B-tree | Tuần tự, ít page split | v4 ngẫu nhiên → page split, phân mảnh |
| Sinh ở client / phân tán | Không (cần DB) | Được, không đụng độ |
| Lộ thông tin | Đoán được số lượng, ID kế tiếp | Khó đoán |
| Merge dữ liệu nhiều DB | Xung đột | Dễ |

Giải pháp cân bằng:
- **UUID v7 / ULID / sequential GUID**: có timestamp ở đầu nên gần tuần tự.
- **Snowflake ID** (bigint 64-bit: thời gian + node + sequence).
- Dùng bigint làm PK nội bộ + cột `public_id` UUID để expose ra API.

**Lưu ý / bẫy thường gặp:** ở SQL Server/MySQL InnoDB, PK là clustered key và được nhúng vào **mọi** secondary index → PK lớn làm mọi index phình to.

# Index và tối ưu truy vấn

## Index là gì và B-tree index hoạt động thế nào? [junior]
Index là cấu trúc dữ liệu phụ giúp tìm dòng nhanh mà không phải quét toàn bảng — giống mục lục sách.

**B+tree** (mặc định ở hầu hết RDBMS):
- Cây cân bằng, gồm root → intermediate → leaf; độ sâu thường 3–4 tầng cho hàng triệu dòng.
- Leaf node chứa key đã **sắp xếp** và được liên kết với nhau → hỗ trợ tốt `=`, `>`, `<`, `BETWEEN`, `ORDER BY`, `LIKE 'abc%'`.
- Tìm kiếm O(log n).

Loại khác: **Hash** (chỉ `=`), **GIN** (PostgreSQL, JSONB/array/full-text), **GiST** (geo), **BRIN** (bảng rất lớn có dữ liệu tương quan thứ tự vật lý), **full-text**, **columnstore**.

Đánh đổi:
- Tăng tốc đọc, nhưng **làm chậm INSERT/UPDATE/DELETE** (phải cập nhật index) và tốn dung lượng.
- Index trên cột selectivity thấp (vd `gender`) thường vô ích.

## Clustered index và non-clustered index khác nhau thế nào? [mid]
- **Clustered index**: leaf node **chính là dữ liệu dòng**, bảng được lưu vật lý theo thứ tự key. Mỗi bảng chỉ có **một**. SQL Server mặc định tạo trên PK; MySQL InnoDB luôn cluster theo PK.
- **Non-clustered index**: cấu trúc riêng, leaf chứa key + con trỏ tới dòng (clustered key hoặc RID nếu bảng là heap). Có thể có nhiều.

Khi dùng non-clustered index mà cần cột không có trong index → phải **Key Lookup / Bookmark Lookup** quay về clustered index lấy thêm cột. Nếu nhiều dòng, optimizer có thể bỏ index và scan toàn bảng.

PostgreSQL không có clustered index thực sự: bảng là heap, mọi index đều là secondary; lệnh `CLUSTER` chỉ sắp xếp lại một lần.

**Lưu ý / bẫy thường gặp:** chọn clustered key nên **hẹp, duy nhất, tăng dần, ít thay đổi** (vd bigint identity). Clustered key là cột hay update sẽ khiến mọi non-clustered index phải cập nhật theo.

## Composite index và quy tắc leftmost prefix? [mid]
Composite index là index trên nhiều cột, sắp xếp theo thứ tự cột khai báo — giống danh bạ sắp theo (họ, tên).

Index `(a, b, c)` dùng được cho:
- `WHERE a = ?`
- `WHERE a = ? AND b = ?`
- `WHERE a = ? AND b = ? AND c = ?`
- `WHERE a = ? ORDER BY b`

Không dùng hiệu quả (seek) cho `WHERE b = ?` hoặc `WHERE c = ?` vì thiếu cột đầu.

Quy tắc chọn thứ tự cột:
1. Cột lọc bằng `=` đặt trước, cột lọc theo **range** (`>`, `BETWEEN`) đặt sau — sau cột range, các cột tiếp theo không còn seek được.
2. Ưu tiên cột hay được dùng chung nhiều query.
3. Selectivity là yếu tố phụ.

```sql
CREATE INDEX ix_orders_cust_status_date
ON orders (customer_id, status, created_at);
-- Tốt: WHERE customer_id = 1 AND status = 'PAID' AND created_at >= '2026-01-01'
```

**Lưu ý / bẫy thường gặp:** thứ tự điều kiện trong `WHERE` không quan trọng (optimizer tự sắp), thứ tự cột trong **index** mới quan trọng.

## Covering index là gì? [mid]
Covering index là index chứa **đủ mọi cột** mà query cần (lọc, sort, select) → DB đọc từ index là xong, không cần quay lại bảng (tránh Key Lookup). PostgreSQL gọi là **Index Only Scan**.

```sql
-- SQL Server / PostgreSQL 11+
CREATE INDEX ix_orders_customer
ON orders (customer_id, created_at)
INCLUDE (total_amount, status);

SELECT created_at, total_amount, status
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC;
```

- Cột trong key: dùng để seek/sort.
- Cột trong `INCLUDE`: chỉ nằm ở leaf, không tham gia sắp xếp → index gọn hơn.

**Lưu ý / bẫy thường gặp:** đừng include quá nhiều cột — index phình to, ghi chậm. `SELECT *` gần như luôn phá covering index. Với PostgreSQL, Index Only Scan còn phụ thuộc visibility map (cần VACUUM đều).

## Khi nào index không được sử dụng? SARGable là gì? [mid]
**SARGable** (Search ARGument-able) là điều kiện cho phép DB **seek** trên index. Các trường hợp làm mất SARGable:

- Bọc hàm/biểu thức lên cột: `WHERE YEAR(created_at) = 2026`, `WHERE UPPER(email) = ...`, `WHERE price * 1.1 > 100`.
- `LIKE '%abc'` (wildcard ở đầu).
- **Implicit conversion**: cột `VARCHAR` so sánh với tham số `NVARCHAR`, cột string so với số.
- `OR` giữa các cột khác nhau, `<>`, `NOT IN` (thường scan).
- Không thỏa leftmost prefix của composite index.
- Selectivity thấp hoặc statistics cũ → optimizer chọn scan.

```sql
-- Không SARGable
WHERE YEAR(created_at) = 2026
-- SARGable
WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'

-- Không SARGable
WHERE ISNULL(status, '') = 'A'
-- SARGable
WHERE status = 'A'
```

**Lưu ý / bẫy thường gặp:** nếu bắt buộc lọc theo biểu thức, dùng **function-based/expression index** (PostgreSQL: `CREATE INDEX ON users (lower(email))`) hoặc computed column có index (SQL Server).

## Đọc execution plan như thế nào? [mid]
Execution plan cho biết optimizer thực thi query ra sao. Lấy plan:
- SQL Server: *Include Actual Execution Plan* (Ctrl+M), `SET STATISTICS IO, TIME ON`.
- PostgreSQL/MySQL: `EXPLAIN ANALYZE`.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42;
```

Những điểm cần nhìn:
- **Scan vs Seek**: Table/Clustered Index Scan, Seq Scan trên bảng lớn → thiếu index hoặc không SARGable.
- **Key Lookup** lặp nhiều lần → cân nhắc covering index.
- **Estimated vs Actual rows** chênh lệch lớn → statistics cũ, parameter sniffing.
- Loại join: **Nested Loop** (tập nhỏ), **Hash Join** (tập lớn, không sort), **Merge Join** (hai tập đã sort).
- Toán tử tốn kém: **Sort**, **Hash spill to tempdb**, implicit conversion warning.
- Logical reads (I/O) là chỉ số so sánh ổn định hơn thời gian.

**Lưu ý / bẫy thường gặp:** "cost %" trong plan là ước lượng, không phải thời gian thực; luôn so sánh trên plan **actual**.

## Một query chạy chậm trên production, bạn xử lý thế nào? [senior]
Quy trình có hệ thống:

1. **Xác định & đo**: query nào, chậm bao nhiêu, từ khi nào (Query Store, `pg_stat_statements`, slow query log, APM). Chậm luôn hay thỉnh thoảng?
2. **Xem execution plan actual**: scan bảng lớn, key lookup, estimate sai, spill, implicit conversion.
3. **Kiểm tra môi trường**: blocking/lock wait, deadlock, CPU/IO/memory, tempdb, kết nối.
4. **Tối ưu theo thứ tự rủi ro thấp**:
   - Viết lại query cho SARGable, bỏ `SELECT *`, tránh hàm trên cột, giảm dữ liệu sớm.
   - Thêm/sửa index (composite, covering); xóa index trùng.
   - Cập nhật statistics; xử lý **parameter sniffing** (`OPTION (RECOMPILE)`, `OPTIMIZE FOR`).
   - Phân trang bằng **keyset** thay vì `OFFSET` lớn.
   - Sửa N+1 query ở tầng ứng dụng (ORM).
5. **Kiến trúc**: cache (Redis), read replica, denormalize, partition, chuyển báo cáo sang OLAP.
6. **Xác minh** trên môi trường giống production và theo dõi sau deploy.

**Lưu ý / bẫy thường gặp:** "nhanh trên SSMS, chậm trên app" thường do parameter sniffing hoặc khác `SET` options (ARITHABORT) → khác plan cache.

# Transaction và Concurrency

## Transaction là gì? Giải thích ACID. [junior]
Transaction là một đơn vị công việc gồm nhiều thao tác, hoặc **thành công toàn bộ** hoặc **không có gì xảy ra**.

- **Atomicity**: tất cả hoặc không gì cả (rollback khi lỗi). Thực hiện nhờ undo log.
- **Consistency**: đưa DB từ trạng thái hợp lệ sang trạng thái hợp lệ khác, thỏa mọi constraint/rule.
- **Isolation**: các transaction đồng thời không thấy trạng thái dở dang của nhau (mức độ tùy isolation level).
- **Durability**: đã commit thì không mất kể cả khi sập nguồn — nhờ **write-ahead log (WAL)/redo log** được flush trước khi báo commit.

```sql
BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- lỗi giữa chừng thì ROLLBACK
```

**Lưu ý / bẫy thường gặp:** giữ transaction **ngắn**; không gọi API bên ngoài, gửi email hay chờ người dùng bên trong transaction — gây giữ lock lâu và blocking.

## Các hiện tượng dirty read, non-repeatable read, phantom read là gì? [mid]
- **Dirty read**: đọc dữ liệu transaction khác **chưa commit**; nếu bên kia rollback thì đã đọc dữ liệu "ma".
- **Non-repeatable read**: trong một transaction, đọc **cùng một dòng** hai lần ra giá trị khác nhau vì transaction khác đã UPDATE và commit ở giữa.
- **Phantom read**: chạy **cùng một điều kiện** hai lần ra **tập dòng khác nhau** vì transaction khác INSERT/DELETE dòng thỏa điều kiện.
- **Lost update**: hai transaction cùng đọc rồi cùng ghi, bản ghi sau đè mất bản ghi trước.
- **Write skew**: hai transaction đọc chung dữ liệu, mỗi bên cập nhật dòng khác nhau, tổng thể vi phạm rule (vd: hai bác sĩ cùng xin nghỉ khiến ca trực không còn ai).

```text
T1: SELECT balance FROM acc WHERE id=1;  -- 100
T2: UPDATE acc SET balance=50 WHERE id=1; COMMIT;
T1: SELECT balance FROM acc WHERE id=1;  -- 50 → non-repeatable read
```

## Các isolation level và hiện tượng mà mỗi level ngăn chặn? [mid]
| Isolation level | Dirty read | Non-repeatable read | Phantom |
|---|---|---|---|
| Read Uncommitted | Có thể | Có thể | Có thể |
| Read Committed | Ngăn | Có thể | Có thể |
| Repeatable Read | Ngăn | Ngăn | Có thể (theo chuẩn) |
| Serializable | Ngăn | Ngăn | Ngăn |
| Snapshot (SQL Server) | Ngăn | Ngăn | Ngăn (nhưng có thể write skew) |

Mặc định:
- **SQL Server, PostgreSQL, Oracle**: Read Committed.
- **MySQL InnoDB**: Repeatable Read (dùng next-key lock nên hầu như ngăn phantom).
- PostgreSQL Repeatable Read thực chất là snapshot isolation; Serializable dùng SSI.

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

**Lưu ý / bẫy thường gặp:** isolation càng cao càng ít anomaly nhưng tăng locking/blocking hoặc lỗi serialization phải retry. Ứng dụng dùng Serializable phải có logic **retry**.

## Lock trong database và deadlock xử lý thế nào? [mid]
**Các loại lock chính:**
- **Shared (S)**: khi đọc; nhiều S cùng tồn tại.
- **Exclusive (X)**: khi ghi; xung đột với mọi lock khác.
- **Update (U)** (SQL Server): tránh deadlock khi đọc-rồi-ghi.
- **Intent lock** (IS, IX) ở mức cao hơn; granularity: row → page → table (có **lock escalation**).

**Deadlock**: T1 giữ A chờ B, T2 giữ B chờ A. DB tự phát hiện, chọn một **victim** để rollback (SQL Server lỗi 1205; PostgreSQL `deadlock detected`).

Phòng tránh:
- Truy cập tài nguyên theo **cùng một thứ tự** ở mọi nơi.
- Transaction ngắn, ít dòng; có index phù hợp để lock ít dòng hơn (scan = lock nhiều).
- Dùng isolation thấp hơn / snapshot (RCSI) khi phù hợp.
- Ứng dụng **retry** khi bị chọn làm victim.

Điều tra: SQL Server `system_health` Extended Events (deadlock graph); PostgreSQL `log_lock_waits`, `pg_locks`; MySQL `SHOW ENGINE INNODB STATUS`.

**Lưu ý / bẫy thường gặp:** phân biệt **blocking** (chờ, sẽ hết) và **deadlock** (vòng chờ, phải kill một bên).

## MVCC là gì? [senior]
**MVCC (Multi-Version Concurrency Control)** giữ **nhiều phiên bản** của một dòng để reader đọc snapshot nhất quán mà **không chặn writer và ngược lại** ("readers don't block writers").

Cách triển khai:
- **PostgreSQL**: mỗi tuple có `xmin`/`xmax` (transaction ID tạo/xóa). UPDATE = tạo tuple mới + đánh dấu tuple cũ chết → sinh **dead tuple**, cần **VACUUM** dọn.
- **MySQL InnoDB / Oracle**: dữ liệu mới ghi tại chỗ, phiên bản cũ dựng lại từ **undo log** qua read view.
- **SQL Server**: mặc định dùng lock; bật `READ_COMMITTED_SNAPSHOT` hoặc `ALLOW_SNAPSHOT_ISOLATION` để lưu row version trong **tempdb** (version store).

Ưu điểm: tăng concurrency, đọc không bị block.
Nhược điểm: tốn lưu trữ phiên bản, cần dọn dẹp; transaction chạy rất lâu giữ snapshot cũ khiến bloat (PostgreSQL) hoặc undo/tempdb phình to.

**Lưu ý / bẫy thường gặp:** MVCC không ngăn được **lost update / write skew** tự động — vẫn cần `SELECT ... FOR UPDATE`, optimistic locking hoặc Serializable.

## Optimistic locking và pessimistic locking khác nhau thế nào? [mid]
**Pessimistic locking**: giả định xung đột hay xảy ra → **khóa trước** khi sửa.
```sql
BEGIN;
SELECT * FROM products WHERE id = 1 FOR UPDATE; -- SQL Server: WITH (UPDLOCK, ROWLOCK)
UPDATE products SET stock = stock - 1 WHERE id = 1;
COMMIT;
```

**Optimistic locking**: giả định xung đột hiếm → không khóa, khi ghi **kiểm tra version**.
```sql
UPDATE products
SET stock = 9, version = version + 1
WHERE id = 1 AND version = 5;
-- affected rows = 0 → có người sửa trước → báo lỗi hoặc retry
```
ORM hỗ trợ sẵn: EF Core `[Timestamp]/rowversion`, JPA `@Version`.

| | Optimistic | Pessimistic |
|---|---|---|
| Phù hợp | Ít xung đột, đọc nhiều, form web | Xung đột cao, cần đảm bảo tuyệt đối (trừ kho, đặt vé) |
| Chi phí | Retry khi xung đột | Giữ lock, blocking, deadlock |
| Hoạt động qua nhiều request | Được | Không nên |

**Lưu ý / bẫy thường gặp:** với counter đơn giản, dùng câu **atomic** `UPDATE ... SET stock = stock - 1 WHERE id = 1 AND stock > 0` là đủ, không cần đọc trước.

# Lập trình trong database

## Stored procedure và function khác nhau thế nào? [junior]
| | Stored Procedure | Function (UDF) |
|---|---|---|
| Giá trị trả về | 0..n result set, output param, return code | Bắt buộc trả về scalar hoặc table |
| Dùng trong SELECT/WHERE/JOIN | Không | Được |
| Thay đổi dữ liệu (INSERT/UPDATE) | Được | SQL Server: không (trừ table variable nội bộ) |
| Transaction, TRY/CATCH | Được | Hạn chế |
| Gọi | `EXEC sp_name` | `SELECT dbo.fn(...)` |

Ưu điểm stored procedure: plan được cache, giảm round-trip, phân quyền chỉ cho `EXECUTE`, chống SQL injection khi tham số hóa.
Nhược điểm: logic nghiệp vụ nằm trong DB → khó test, khó version control, khó scale, gắn chặt vendor.

**Lưu ý / bẫy thường gặp:** **scalar UDF** trong SQL Server (trước 2019) chạy từng dòng và chặn parallelism → rất chậm trên tập lớn; ưu tiên **inline table-valued function**.

## Trigger là gì? Ưu nhược điểm? [mid]
Trigger là đoạn code **tự động chạy** khi có sự kiện trên bảng: `INSERT`, `UPDATE`, `DELETE` (DML trigger) hoặc `CREATE/ALTER/DROP` (DDL trigger).

- Thời điểm: `BEFORE` / `AFTER` / `INSTEAD OF` (dùng cho view).
- SQL Server: trigger chạy **một lần mỗi câu lệnh**, truy cập dữ liệu qua bảng ảo `inserted` / `deleted`. PostgreSQL/MySQL có `FOR EACH ROW` với `NEW`/`OLD`.

```sql
CREATE TRIGGER trg_salary_audit ON employees
AFTER UPDATE AS
BEGIN
    INSERT INTO salary_audit(emp_id, old_salary, new_salary, changed_at)
    SELECT d.id, d.salary, i.salary, SYSDATETIME()
    FROM inserted i JOIN deleted d ON i.id = d.id
    WHERE i.salary <> d.salary;
END;
```

Use case hợp lý: audit log, ràng buộc phức tạp không biểu diễn bằng constraint, đồng bộ cột denormalize.

Nhược điểm: logic "ẩn", khó debug, làm chậm ghi, chạy trong cùng transaction (lỗi trigger rollback cả lệnh), dễ tạo chuỗi trigger lồng nhau.

**Lưu ý / bẫy thường gặp:** viết trigger SQL Server giả định `inserted` chỉ có 1 dòng là bug kinh điển — phải xử lý theo tập.

## View và materialized view khác nhau thế nào? [mid]
- **View**: câu SELECT được đặt tên, **không lưu dữ liệu**; mỗi lần truy vấn view thì chạy lại query gốc.
  - Dùng để: đơn giản hóa query phức tạp, ẩn cột nhạy cảm (bảo mật), tạo lớp trừu tượng khi đổi schema.
  - View đơn giản (1 bảng, không aggregate) có thể updatable.
- **Materialized view**: **lưu kết quả vật lý**, đọc rất nhanh, nhưng dữ liệu có thể cũ.
  - PostgreSQL: `CREATE MATERIALIZED VIEW ...`, làm mới bằng `REFRESH MATERIALIZED VIEW CONCURRENTLY mv` (cần unique index).
  - SQL Server: **indexed view** (`WITH SCHEMABINDING` + unique clustered index) — tự cập nhật đồng bộ khi bảng gốc đổi, nên tăng chi phí ghi.
  - Oracle: refresh `ON COMMIT` hoặc `ON DEMAND`.

```sql
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT order_date, SUM(total) AS revenue FROM orders GROUP BY order_date;
```

**Lưu ý / bẫy thường gặp:** view thường **không** làm query nhanh hơn; view lồng view nhiều tầng còn khiến optimizer khó tối ưu.

# Đặc thù SQL Server, PostgreSQL, MySQL

## Temp table và table variable trong SQL Server khác nhau thế nào? NOLOCK có nên dùng? [mid]
| | `#TempTable` | `@TableVariable` |
|---|---|---|
| Lưu ở | tempdb | tempdb (không phải chỉ RAM như hay hiểu nhầm) |
| Statistics | Có | Không (ước lượng 1 dòng; 2019+ có deferred compilation) |
| Index | Tạo tự do | Chỉ khai báo inline |
| Phạm vi | Session / procedure và các proc con | Batch / procedure hiện tại |
| Rollback | Tham gia transaction | Không bị rollback |
| Phù hợp | Tập lớn, cần JOIN | Tập nhỏ vài trăm dòng |

**`WITH (NOLOCK)`** = Read Uncommitted: không lấy shared lock nên không bị block, nhưng có thể đọc **dirty data**, **đọc trùng hoặc bỏ sót dòng** do page split, thậm chí lỗi 601.

Thay thế tốt hơn: bật **READ_COMMITTED_SNAPSHOT (RCSI)** để reader không bị block mà vẫn đọc dữ liệu đã commit.

**Lưu ý / bẫy thường gặp:** rải NOLOCK khắp code báo cáo tài chính là red flag trong phỏng vấn.

## JSONB trong PostgreSQL là gì? Khác JSON thế nào? [mid]
- `JSON`: lưu nguyên văn text, giữ thứ tự key và khoảng trắng, mỗi lần truy vấn phải parse lại.
- `JSONB`: lưu dạng **binary đã parse**, bỏ key trùng, không giữ thứ tự → ghi chậm hơn chút nhưng **truy vấn nhanh** và **index được** (GIN).

```sql
CREATE TABLE products (id bigserial PRIMARY KEY, attrs jsonb);
CREATE INDEX ix_products_attrs ON products USING GIN (attrs);

SELECT * FROM products WHERE attrs @> '{"color": "red"}';   -- containment
SELECT attrs->>'brand' AS brand FROM products;               -- lấy text
SELECT * FROM products WHERE attrs ? 'warranty';             -- có key
CREATE INDEX ix_brand ON products ((attrs->>'brand'));        -- expression index
```

Use case: thuộc tính động (EAV thay thế), lưu payload, cấu hình, dữ liệu bán cấu trúc.

**Lưu ý / bẫy thường gặp:** đừng nhét mọi thứ vào JSONB — mất kiểu dữ liệu, FK, constraint, statistics kém. Cột hay lọc/JOIN nên tách thành cột thường. Update một key vẫn ghi lại toàn bộ dòng (MVCC).

## VACUUM trong PostgreSQL dùng để làm gì? [senior]
Do MVCC, UPDATE/DELETE trong PostgreSQL để lại **dead tuple**. VACUUM:
- Đánh dấu không gian dead tuple để **tái sử dụng** (không trả lại OS).
- Cập nhật **visibility map** → giúp Index Only Scan.
- **Freeze** transaction ID cũ để tránh **transaction ID wraparound** (32-bit XID) — nếu không, DB sẽ buộc dừng ghi để bảo vệ dữ liệu.

Các dạng:
- `VACUUM`: không khóa chặn đọc/ghi.
- `VACUUM FULL`: viết lại toàn bộ bảng, trả dung lượng cho OS, nhưng **khóa ACCESS EXCLUSIVE** — tránh trên production (dùng `pg_repack`).
- `ANALYZE`: cập nhật statistics cho planner.
- **Autovacuum**: chạy nền theo ngưỡng `autovacuum_vacuum_scale_factor` (mặc định 20% dòng thay đổi).

```sql
SELECT relname, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;
```

**Lưu ý / bẫy thường gặp:** bảng lớn update nhiều nên giảm scale factor riêng cho bảng đó. Transaction treo lâu (`idle in transaction`) hoặc replication slot bị bỏ quên sẽ chặn VACUUM dọn dẹp → bloat.

## MySQL InnoDB có đặc điểm gì quan trọng? So với MyISAM? [mid]
InnoDB là storage engine mặc định từ MySQL 5.5:
- Hỗ trợ **transaction ACID**, **row-level locking**, **foreign key**, crash recovery qua **redo log**; MVCC qua **undo log**.
- **Clustered index theo PK**: dữ liệu nằm ở leaf của PK; secondary index lưu giá trị PK → PK nên ngắn, tăng dần. Không khai báo PK thì InnoDB dùng unique NOT NULL đầu tiên hoặc tự tạo row ID ẩn.
- Mặc định **Repeatable Read**, dùng **gap lock / next-key lock** để chống phantom → dễ gặp deadlock khi insert đồng thời vào cùng khoảng.
- **Buffer pool** (`innodb_buffer_pool_size` thường 60–80% RAM) cache data + index.
- Binlog phục vụ replication & point-in-time recovery.

| | InnoDB | MyISAM |
|---|---|---|
| Transaction | Có | Không |
| Lock | Row | Table |
| FK | Có | Không |
| Crash recovery | Tốt | Dễ hỏng bảng |

**Lưu ý / bẫy thường gặp:** `utf8` trong MySQL chỉ là 3 byte (không lưu được emoji) → dùng `utf8mb4`.

# NoSQL và Redis

## Các loại NoSQL database và use case? [junior]
| Loại | Ví dụ | Mô hình | Use case |
|---|---|---|---|
| Key-Value | Redis, DynamoDB, Memcached | key → value | Cache, session, counter, rate limit |
| Document | MongoDB, Couchbase, Firestore | Document JSON/BSON lồng nhau | Catalog sản phẩm, CMS, profile có schema linh hoạt |
| Wide-column | Cassandra, HBase, ScyllaDB | Row key + column family | Time-series, IoT, log, ghi cực lớn |
| Graph | Neo4j, Amazon Neptune | Node + edge | Mạng xã hội, gợi ý, phát hiện gian lận |
| Search | Elasticsearch, OpenSearch | Inverted index | Full-text search, log analytics |
| Time-series | InfluxDB, TimescaleDB | Theo thời gian | Metrics, monitoring |

Đặc điểm chung: schema linh hoạt, scale ngang dễ, thường đánh đổi consistency (BASE: *Basically Available, Soft state, Eventually consistent*) và hạn chế JOIN/transaction phức tạp.

**Lưu ý / bẫy thường gặp:** NoSQL thiết kế theo **access pattern** (query trước, model sau), ngược với RDBMS (model chuẩn hóa trước).

## MongoDB cơ bản: document, collection, embed vs reference? [mid]
- **Database → Collection → Document** (BSON, tối đa 16MB), mỗi document có `_id` (ObjectId mặc định).
- Hỗ trợ index (single, compound, multikey cho array, text, TTL, geospatial), **aggregation pipeline**, transaction đa document (từ 4.0, nhưng tốn kém hơn).
- Scale: **replica set** (primary + secondaries, tự failover) và **sharding** theo shard key.

**Embed vs Reference:**
- **Embed** khi quan hệ 1-1 / 1-few, dữ liệu luôn đọc cùng nhau (order + order items, user + addresses).
- **Reference** khi 1-many lớn / many-many, dữ liệu con tăng không giới hạn hoặc được truy cập độc lập.

```javascript
db.orders.aggregate([
  { $match: { status: "PAID" } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
  { $limit: 10 }
]);
```

**Lưu ý / bẫy thường gặp:** chọn shard key sai (vd tăng dần như timestamp) gây hot shard; array embed tăng vô hạn sẽ chạm giới hạn 16MB.

## Redis có những data type nào và use case tương ứng? [mid]
Redis là in-memory data store, single-threaded xử lý lệnh (I/O threads từ 6.0) nên mỗi lệnh là **atomic**.

| Type | Use case |
|---|---|
| **String** | Cache object (JSON), counter (`INCR`), distributed lock (`SET key val NX PX 30000`) |
| **Hash** | Lưu object theo field (user profile, giỏ hàng) |
| **List** | Queue đơn giản (`LPUSH`/`BRPOP`), timeline gần nhất |
| **Set** | Tập duy nhất, tag, bạn chung (`SINTER`) |
| **Sorted Set (ZSet)** | Leaderboard, rate limit sliding window, priority queue |
| **Stream** | Message queue có consumer group, event log |
| **Bitmap / HyperLogLog** | Điểm danh, đếm unique visitor xấp xỉ |
| **Geo** | Tìm địa điểm gần |

```bash
SET session:abc123 '{"userId":1}' EX 1800
INCR rate:user:1:202610151030
ZADD leaderboard 1500 "player1"
ZREVRANGE leaderboard 0 9 WITHSCORES
```

**Lưu ý / bẫy thường gặp:** tránh lệnh O(n) trên key lớn (`KEYS *`, `HGETALL` hash khổng lồ) trên production vì sẽ chặn toàn bộ server — dùng `SCAN`.

## Redis persistence: RDB và AOF khác nhau thế nào? [mid]
- **RDB (snapshot)**: chụp toàn bộ dataset định kỳ ra file nhị phân (`fork` process con).
  - Ưu: file gọn, khởi động nhanh, tốt cho backup.
  - Nhược: mất dữ liệu kể từ snapshot cuối; `fork` với dataset lớn có thể gây trễ.
- **AOF (Append Only File)**: ghi log mọi lệnh ghi.
  - `appendfsync always` (an toàn nhất, chậm) / `everysec` (mặc định, mất tối đa ~1s) / `no`.
  - Có **AOF rewrite** để nén log.
  - Nhược: file lớn hơn, khôi phục chậm hơn RDB.
- **Kết hợp** (khuyến nghị): bật cả hai; Redis 4+ có AOF với preamble RDB.

High availability: **Replication** (master–replica, bất đồng bộ), **Redis Sentinel** (tự failover), **Redis Cluster** (sharding 16384 hash slot).

**Lưu ý / bẫy thường gặp:** replication bất đồng bộ nên failover vẫn có thể mất vài lệnh ghi — Redis không nên là nguồn dữ liệu duy nhất cho dữ liệu tài chính.

## Chiến lược cache và các vấn đề cache thường gặp? Eviction policy của Redis? [senior]
**Pattern:**
- **Cache-aside** (phổ biến nhất): đọc cache → miss thì đọc DB rồi set cache; khi ghi thì update DB rồi **xóa** cache.
- **Write-through**: ghi cache và DB đồng bộ. **Write-behind**: ghi cache, đẩy DB sau (nhanh, rủi ro mất dữ liệu).

**Vấn đề:**
- **Cache penetration**: query key không tồn tại liên tục → cache giá trị null với TTL ngắn, Bloom filter.
- **Cache breakdown (hot key hết hạn)**: nhiều request cùng đập DB → mutex/single-flight, refresh trước khi hết hạn.
- **Cache avalanche**: nhiều key hết hạn cùng lúc → TTL + jitter ngẫu nhiên, cache nhiều tầng.
- **Inconsistency**: xóa cache sau khi commit DB, delayed double delete, hoặc CDC.

**Eviction policy** (`maxmemory-policy`) khi đầy bộ nhớ:
- `noeviction` (mặc định — báo lỗi khi ghi)
- `allkeys-lru`, `allkeys-lfu` (thường dùng cho cache thuần)
- `volatile-lru`, `volatile-lfu`, `volatile-ttl`, `volatile-random` (chỉ key có TTL)
- `allkeys-random`

**Lưu ý / bẫy thường gặp:** Redis LRU là **xấp xỉ** (lấy mẫu `maxmemory-samples`), không phải LRU chính xác.

## Khi nào chọn SQL, khi nào chọn NoSQL? [mid]
**Chọn SQL (RDBMS) khi:**
- Dữ liệu có cấu trúc, quan hệ rõ ràng, cần JOIN và query ad-hoc linh hoạt.
- Cần **transaction ACID** mạnh: tài chính, kế toán, HRM, payroll, đơn hàng.
- Ràng buộc toàn vẹn quan trọng.

**Chọn NoSQL khi:**
- Schema thay đổi liên tục hoặc dữ liệu bán cấu trúc.
- Khối lượng ghi/đọc cực lớn, cần **scale ngang** dễ dàng.
- Access pattern đơn giản, biết trước (lookup theo key).
- Yêu cầu đặc thù: cache (Redis), search (Elasticsearch), graph (Neo4j), time-series.

**CAP theorem**: khi có network partition, hệ phân tán chỉ chọn được **Consistency** hoặc **Availability**. Vd MongoDB (mặc định) thiên CP, Cassandra thiên AP (tunable consistency).

Thực tế thường là **polyglot persistence**: PostgreSQL/SQL Server làm nguồn chính + Redis cache + Elasticsearch cho search.

**Lưu ý / bẫy thường gặp:** "NoSQL nhanh hơn SQL" là khẳng định sai — phụ thuộc workload. PostgreSQL với JSONB cũng phục vụ tốt nhiều nhu cầu document.

# Scale và vận hành database

## Replication là gì? Sync vs async replication? [mid]
Replication là sao chép dữ liệu từ **primary** sang một hoặc nhiều **replica**.

Mục đích: high availability (failover), **read scaling** (đọc từ replica), backup/báo cáo không ảnh hưởng primary, disaster recovery.

| | Synchronous | Asynchronous |
|---|---|---|
| Commit | Chờ replica xác nhận | Không chờ |
| Mất dữ liệu khi primary chết | Không (RPO = 0) | Có thể mất phần chưa đồng bộ |
| Độ trễ ghi | Cao hơn | Thấp |

Mô hình: single-leader (phổ biến), multi-leader (xung đột ghi), leaderless (Cassandra, quorum).

Công nghệ: PostgreSQL streaming replication (WAL) & logical replication; MySQL binlog replication / Group Replication; SQL Server **Always On Availability Groups**, log shipping.

**Lưu ý / bẫy thường gặp:** **replication lag** — user vừa ghi xong đọc từ replica không thấy dữ liệu của mình. Giải pháp: *read-your-writes* (đọc từ primary một khoảng sau khi ghi), sticky session, đọc primary cho dữ liệu quan trọng.

## Partitioning và sharding khác nhau thế nào? [senior]
- **Partitioning**: chia một bảng lớn thành nhiều phần **trong cùng một database server**. Ứng dụng vẫn thấy một bảng.
  - Kiểu: **range** (theo tháng), **list** (theo vùng), **hash**.
  - Lợi ích: **partition pruning** (chỉ quét partition liên quan), xóa dữ liệu cũ nhanh bằng drop/switch partition, bảo trì theo phần.
- **Sharding**: chia dữ liệu ra **nhiều database server** độc lập (horizontal scaling), mỗi shard giữ một phần dữ liệu theo **shard key**.
  - Chiến lược: range, hash, directory/lookup, consistent hashing.
  - Lợi ích: scale ghi và dung lượng vượt giới hạn một máy.
  - Khó khăn: JOIN/transaction cross-shard, rebalancing, hot shard, unique ID toàn cục, vận hành phức tạp.

```sql
-- PostgreSQL declarative partitioning
CREATE TABLE logs (id bigint, created_at date, msg text)
PARTITION BY RANGE (created_at);
CREATE TABLE logs_2026_10 PARTITION OF logs
FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```

**Lưu ý / bẫy thường gặp:** sharding là phương án cuối cùng — trước đó hãy tối ưu query, index, cache, read replica, scale dọc, partition. Query không chứa partition key sẽ quét mọi partition.

## Chiến lược backup và restore database? RPO, RTO là gì? [mid]
**Loại backup (SQL Server làm ví dụ):**
- **Full**: toàn bộ database.
- **Differential**: thay đổi kể từ lần full gần nhất.
- **Transaction log backup**: các log record kể từ lần log backup trước → cho phép **point-in-time recovery** (cần recovery model FULL).

PostgreSQL: `pg_dump` (logical), `pg_basebackup` + WAL archiving (physical, PITR), công cụ pgBackRest. MySQL: `mysqldump`, Percona XtraBackup + binlog.

Ví dụ lịch: full hằng tuần, differential hằng ngày, log mỗi 15 phút.

- **RPO** (Recovery Point Objective): chấp nhận mất tối đa bao nhiêu dữ liệu (vd 15 phút → log backup 15 phút/lần).
- **RTO** (Recovery Time Objective): thời gian tối đa để khôi phục hệ thống.

Nguyên tắc **3-2-1**: 3 bản sao, 2 loại phương tiện, 1 bản off-site; mã hóa backup; dùng immutable storage chống ransomware.

**Lưu ý / bẫy thường gặp:** backup chưa từng được **test restore** thì coi như không có backup. Replication không thay thế backup (lỡ `DELETE` sai cũng được replicate ngay).

## Connection pooling là gì, tại sao cần? [mid]
Mở kết nối DB tốn kém (TCP, TLS, xác thực, cấp phát process/memory phía server — PostgreSQL mỗi connection là một process). **Connection pool** giữ sẵn một tập kết nối mở để tái sử dụng.

- Ứng dụng: ADO.NET (bật mặc định, pool theo connection string), HikariCP (Java), `pg-pool` (Node).
- Phía DB / proxy: **PgBouncer** (transaction pooling), ProxySQL (MySQL), RDS Proxy.

Tham số quan trọng: `min/max pool size`, connection timeout, idle timeout, max lifetime.

```text
Server=db;Database=hrm;Min Pool Size=5;Max Pool Size=100;Connection Timeout=30
```

Kích thước pool không phải càng lớn càng tốt — công thức tham khảo của HikariCP: `connections ≈ (core_count * 2) + effective_spindle_count`. Quá nhiều kết nối gây context switching, tranh chấp lock.

**Lưu ý / bẫy thường gặp:** lỗi *"Timeout expired... max pool size was reached"* thường do **connection leak** (không `Dispose`/`using`, không đóng reader), không phải do pool nhỏ. Nhiều instance app × max pool có thể vượt `max_connections` của DB.

## Làm sao thay đổi schema (migration) trên bảng lớn mà không downtime? [senior]
Nguyên tắc: thay đổi phải **tương thích ngược** để version app cũ và mới cùng chạy được (rolling deploy). Dùng pattern **expand – migrate – contract**:

1. **Expand**: thêm cột/bảng mới (nullable hoặc có default), không xóa gì.
2. **Dual write**: app mới ghi cả cột cũ và mới.
3. **Backfill**: chuyển dữ liệu cũ theo **batch** nhỏ, có nghỉ giữa các batch để tránh lock và log phình.
4. **Switch read**: app đọc từ cột mới.
5. **Contract**: bỏ cột cũ ở một release sau.

Kỹ thuật cụ thể:
- PostgreSQL: `CREATE INDEX CONCURRENTLY`; thêm cột có default constant (PG 11+) là thao tác metadata, nhanh; đặt `lock_timeout` cho DDL.
- SQL Server: `CREATE INDEX ... WITH (ONLINE = ON)` (Enterprise), `RESUMABLE = ON`.
- MySQL: online DDL `ALGORITHM=INPLACE/INSTANT`, công cụ `gh-ost`, `pt-online-schema-change`.
- Đổi tên cột = thêm cột mới + chuyển dần, không `RENAME` trực tiếp.

**Lưu ý / bẫy thường gặp:** DDL chờ lock sẽ chặn hàng đợi mọi query phía sau (lock queue) → luôn đặt timeout và chạy giờ thấp điểm.

# Bài tập SQL kinh điển

## Tìm mức lương cao thứ N (Nth highest salary)? [junior]
```sql
-- Cách 1: DENSE_RANK (xử lý đúng lương trùng)
SELECT DISTINCT salary
FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
) t
WHERE rnk = 3;

-- Cách 2: OFFSET (PostgreSQL/MySQL: LIMIT 1 OFFSET N-1)
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
OFFSET 2 ROWS FETCH NEXT 1 ROWS ONLY;

-- Cách 3: subquery tương quan (không dùng window function)
SELECT DISTINCT e1.salary
FROM employees e1
WHERE 2 = (SELECT COUNT(DISTINCT e2.salary)
           FROM employees e2 WHERE e2.salary > e1.salary);

-- Lương cao thứ 2 đơn giản
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

**Lưu ý / bẫy thường gặp:** phải có `DISTINCT` hoặc `DENSE_RANK` để xử lý lương trùng; dùng `ROW_NUMBER` sẽ sai khi có nhiều người cùng lương. Nên hỏi lại interviewer: nếu không tồn tại thứ hạng N thì trả `NULL` hay rỗng?

## Tìm các bản ghi bị trùng lặp? [junior]
```sql
-- Email bị trùng và số lần trùng
SELECT email, COUNT(*) AS cnt
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Lấy đầy đủ các dòng bị trùng
SELECT u.*
FROM users u
JOIN (
    SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1
) d ON d.email = u.email
ORDER BY u.email, u.id;

-- Dùng window function
SELECT *
FROM (
    SELECT *, COUNT(*) OVER (PARTITION BY email) AS cnt
    FROM users
) t
WHERE cnt > 1;
```

Trùng theo nhiều cột thì GROUP BY nhiều cột: `GROUP BY first_name, last_name, birth_date`.

**Lưu ý / bẫy thường gặp:** chú ý chuẩn hóa trước khi so sánh (`LOWER(TRIM(email))`), và `NULL` được GROUP BY gom chung một nhóm. Sau khi dọn dữ liệu nên thêm **unique constraint** để chặn từ gốc.

## Xóa bản ghi trùng lặp, chỉ giữ lại một bản? [mid]
```sql
-- SQL Server: xóa qua CTE (giữ id nhỏ nhất)
WITH cte AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    FROM users
)
DELETE FROM cte WHERE rn > 1;

-- PostgreSQL
DELETE FROM users
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
        FROM users
    ) t WHERE t.rn > 1
);

-- MySQL: self join
DELETE u1 FROM users u1
JOIN users u2 ON u1.email = u2.email AND u1.id > u2.id;
```

Nếu bảng không có cột id: PostgreSQL dùng `ctid`; hoặc copy `SELECT DISTINCT` sang bảng mới rồi đổi tên.

**Lưu ý / bẫy thường gặp:** luôn chạy `SELECT` kiểm tra trước, backup/thực hiện trong transaction, xóa theo batch nếu dữ liệu lớn, cân nhắc giữ bản **mới nhất** (`ORDER BY updated_at DESC`) tùy nghiệp vụ, và kiểm tra FK từ bảng con trỏ tới các dòng sắp xóa.

## Lấy top N bản ghi trong mỗi nhóm (vd: 3 nhân viên lương cao nhất mỗi phòng ban)? [mid]
```sql
-- Cách phổ biến: window function
WITH ranked AS (
    SELECT e.*,
           DENSE_RANK() OVER (PARTITION BY department_id
                              ORDER BY salary DESC) AS rnk
    FROM employees e
)
SELECT department_id, name, salary
FROM ranked
WHERE rnk <= 3
ORDER BY department_id, salary DESC;

-- SQL Server: CROSS APPLY (PostgreSQL: LATERAL) — hiệu quả khi có index (department_id, salary DESC)
SELECT d.id, x.name, x.salary
FROM departments d
CROSS APPLY (
    SELECT TOP 3 name, salary
    FROM employees e
    WHERE e.department_id = d.id
    ORDER BY salary DESC
) x;
```

- `ROW_NUMBER`: đúng N dòng mỗi nhóm.
- `RANK`/`DENSE_RANK`: bao gồm người đồng hạng (có thể > N dòng).

**Lưu ý / bẫy thường gặp:** làm rõ yêu cầu về đồng hạng với interviewer. Biến thể hay gặp: "lấy đơn hàng mới nhất của mỗi khách hàng" — cùng kỹ thuật với `ROW_NUMBER() ... ORDER BY created_at DESC` và `rn = 1`.
