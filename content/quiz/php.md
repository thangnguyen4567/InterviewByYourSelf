---
topic: php
---

## Kết quả của `var_dump(0 == "");` trong PHP 8 là gì? [junior]
- [ ] `bool(true)`
- [ ] `int(0)`
- [x] `bool(false)`
- [ ] Ném ra `TypeError`
> Từ PHP 8, khi so sánh int với string không phải numeric, PHP chuyển int thành string rồi so sánh chuỗi: "0" == "" → false. Ở PHP 7, "" bị ép thành 0 nên kết quả là true — đó là bẫy phổ biến.

## Đoạn code sau in ra gì? [junior]
```php
$x = 0;
echo $x ?: 'a';
echo $x ?? 'b';
```
- [ ] `ab`
- [x] `a0`
- [ ] `00`
- [ ] `0b`
> `?:` (Elvis) kiểm tra truthy: 0 là falsy nên trả về 'a'. `??` (null coalescing) chỉ kiểm tra null/không tồn tại: `$x` là 0 (không null) nên trả về 0.

## Hàm nào trả về `true` cho key tồn tại trong mảng ngay cả khi giá trị của key đó là `null`? [junior]
- [ ] `isset($arr['k'])`
- [ ] `!empty($arr['k'])`
- [ ] `in_array('k', $arr)`
- [x] `array_key_exists('k', $arr)`
> `array_key_exists` chỉ kiểm tra sự tồn tại của key. `isset` trả về false nếu giá trị là null, còn `in_array` tìm theo value chứ không phải key.

## Đoạn code sau in ra gì? [junior]
```php
echo "5" + "5", "5" . "5";
```
- [ ] `5555`
- [ ] `1010`
- [x] `1055`
- [ ] Lỗi TypeError vì cộng hai string
> Toán tử `+` là phép cộng số học, các numeric string được chuyển thành số → 10. Toán tử `.` là nối chuỗi → "55". Numeric string hợp lệ nên không có lỗi.

## Thuộc tính khai báo `protected` có thể được truy cập từ đâu? [junior]
- [x] Trong chính class đó và các class con kế thừa
- [ ] Chỉ trong chính class khai báo nó
- [ ] Từ bất kỳ đâu trong cùng namespace
- [ ] Từ bên ngoài class nhưng chỉ ở chế độ đọc
> `protected` cho phép truy cập trong class khai báo và các class con (và class cha). `private` mới là chỉ trong class khai báo; PHP không có visibility theo namespace.

## Phát biểu nào đúng về interface và abstract class trong PHP? [junior]
- [ ] Interface có thể chứa property instance thông thường
- [ ] Một class có thể `extends` nhiều abstract class
- [ ] Abstract class không được chứa method có phần thân
- [x] Một class có thể `implements` nhiều interface nhưng chỉ `extends` một class
> PHP chỉ hỗ trợ đơn kế thừa class, nhưng cho phép implement nhiều interface. Abstract class hoàn toàn có thể có method đã cài đặt; interface chỉ chứa method signature và constant.

## Cách phòng chống SQL Injection hiệu quả nhất trong PHP là gì? [junior]
- [ ] Dùng `addslashes()` cho mọi input
- [x] Dùng prepared statements với tham số bind (PDO/mysqli)
- [ ] Dùng `htmlspecialchars()` trước khi đưa vào query
- [ ] Chỉ chấp nhận request POST thay vì GET
> Prepared statement tách cấu trúc câu SQL khỏi dữ liệu nên dữ liệu không bao giờ được hiểu là câu lệnh. `addslashes` có thể bị bypass (ví dụ với một số charset multi-byte), còn `htmlspecialchars` dùng chống XSS, không phải SQL Injection.

## Để chống XSS khi in dữ liệu người dùng ra HTML, nên dùng hàm nào? [junior]
- [ ] `strip_slashes()`
- [ ] `urlencode()`
- [x] `htmlspecialchars($s, ENT_QUOTES, 'UTF-8')`
- [ ] `filter_var($s, FILTER_VALIDATE_EMAIL)`
> `htmlspecialchars` escape các ký tự `< > & " '` để trình duyệt không hiểu chúng là markup. `urlencode` chỉ phù hợp khi đưa giá trị vào query string của URL.

## Composer sử dụng chuẩn autoloading nào để ánh xạ namespace sang thư mục? [junior]
- [ ] PSR-7
- [ ] PSR-12
- [ ] PSR-3
- [x] PSR-4
> PSR-4 định nghĩa quy tắc ánh xạ namespace prefix → base directory. PSR-7 là HTTP message, PSR-12 là coding style, PSR-3 là logger interface.

## Cách lưu mật khẩu người dùng đúng chuẩn trong PHP hiện đại? [junior]
- [x] `password_hash($pwd, PASSWORD_DEFAULT)` và kiểm tra bằng `password_verify()`
- [ ] `md5($pwd . $salt)`
- [ ] `sha1($pwd)` lưu kèm salt cố định
- [ ] `base64_encode($pwd)`
> `password_hash` dùng thuật toán chậm có salt ngẫu nhiên (bcrypt/argon2) và tự lưu salt trong chuỗi hash. MD5/SHA1 quá nhanh nên dễ brute-force, còn base64 chỉ là encoding, không phải hash.

## Sự khác nhau giữa `include` và `require` khi file không tồn tại? [junior]
- [ ] `include` gây fatal error, `require` chỉ warning
- [ ] Cả hai đều chỉ gây warning
- [x] `require` gây fatal error và dừng script, `include` chỉ phát warning và tiếp tục chạy
- [ ] `require` tự động tìm file trong `include_path`, `include` thì không
> `require` dùng cho file bắt buộc nên lỗi là fatal (E_COMPILE_ERROR). `include` chỉ phát E_WARNING. Cả hai đều tìm file theo `include_path`.

## Thuộc tính `$fillable` trong Eloquent model dùng để làm gì? [junior]
- [ ] Liệt kê các cột tự động được ẩn khi chuyển sang JSON
- [x] Whitelist các cột cho phép mass assignment (ví dụ `Model::create($request->all())`)
- [ ] Khai báo các cột có giá trị mặc định khi insert
- [ ] Liệt kê các cột bắt buộc phải có giá trị (NOT NULL)
> `$fillable` bảo vệ khỏi lỗ hổng mass assignment: chỉ các cột trong danh sách mới được gán hàng loạt. Ẩn cột khi serialize là việc của `$hidden`.

## Đoạn code sau in ra gì? [mid]
```php
$a = [1, 2, 3];
foreach ($a as &$v) {}
foreach ($a as $v) {}
print_r($a);
```
- [ ] `[1, 2, 3]`
- [ ] `[3, 3, 3]`
- [x] `[1, 2, 2]`
- [ ] `[1, 1, 1]`
> Sau vòng lặp đầu, `$v` vẫn là reference tới `$a[2]`. Vòng lặp thứ hai gán lần lượt 1, 2, 2 vào `$v` (tức là vào `$a[2]`), nên phần tử cuối thành 2. Cần `unset($v)` sau vòng lặp by-reference.

## Kết quả của `var_dump("1e3" == "1000");` là gì? [mid]
- [ ] `bool(false)` vì hai chuỗi khác nhau
- [x] `bool(true)`
- [ ] Ném ra `ValueError`
- [ ] `bool(false)` vì PHP 8 không còn so sánh số với chuỗi
> Khi cả hai vế đều là numeric string, `==` so sánh theo giá trị số: "1e3" = 1000.0 bằng 1000. PHP 8 chỉ đổi quy tắc cho trường hợp string không phải numeric; muốn so sánh đúng chuỗi phải dùng `===`.

## Hai trait `A` và `B` cùng có method `hello()`. Cú pháp nào giúp class dùng `hello()` của `A`? [mid]
- [ ] `use A, B { A::hello override B; }`
- [ ] `use A, B { hello as A; }`
- [ ] Không thể dùng hai trait có method trùng tên trong một class
- [x] `use A, B { A::hello insteadof B; }`
> `insteadof` chọn implementation nào thắng khi có xung đột; có thể kết hợp `B::hello as helloB;` để giữ lại phiên bản còn lại với tên khác. Nếu không giải quyết xung đột, PHP báo fatal error.

## Đoạn code sau in ra gì? [mid]
```php
class A {
    public static function create() { return new static(); }
}
class B extends A {}
echo get_class(B::create());
```
- [x] `B`
- [ ] `A`
- [ ] Lỗi vì không thể `new static()` trong static method
- [ ] `static`
> `static` dùng Late Static Binding: trỏ tới class được gọi lúc runtime (B). Nếu viết `new self()`, kết quả sẽ là `A` vì `self` được resolve theo class nơi method được định nghĩa.

## Đoạn code sau in ra gì? [mid]
```php
echo match ("1") {
    1 => 'int',
    '1' => 'string',
    default => 'none',
};
```
- [ ] `int`
- [ ] `none`
- [x] `string`
- [ ] `intstring`
> `match` so sánh nghiêm ngặt (`===`), nên "1" không khớp với int 1 mà khớp với '1'. Khác `switch` dùng `==` sẽ khớp ngay nhánh đầu tiên. `match` không fall-through.

## Kết quả của `[1, 2] + [3, 4, 5]` là gì? [mid]
- [ ] `[1, 2, 3, 4, 5]`
- [ ] `[4, 6, 5]`
- [ ] `[3, 4, 5]`
- [x] `[1, 2, 5]`
> Toán tử `+` với mảng là union theo key: giữ phần tử của mảng trái, chỉ thêm các key chưa có từ mảng phải. Key 0, 1 đã tồn tại nên chỉ key 2 (giá trị 5) được thêm. Muốn nối mảng dùng `array_merge` hoặc spread `[...$a, ...$b]`.

## Kết quả của đoạn code sau là gì? [mid]
```php
print_r(array_merge(['a' => 1, 5 => 2], ['a' => 3, 5 => 4]));
```
- [ ] `['a' => 3, 5 => 4]`
- [x] `['a' => 3, 0 => 2, 1 => 4]`
- [ ] `['a' => 1, 5 => 2, 6 => 4]`
- [ ] `['a' => 3, 5 => 2, 6 => 4]`
> `array_merge` ghi đè key dạng string (giá trị sau thắng) nhưng với key số thì nối thêm và đánh lại chỉ số từ 0. Vì vậy key 5 không bị ghi đè mà trở thành 0 và 1.

## Đoạn code sau cho kết quả gì? [mid]
```php
class P {
    public function __construct(public readonly int $x) {}
}
$p = new P(1);
$p->x = 2;
echo $p->x;
```
- [ ] In ra `2`
- [ ] In ra `1` (phép gán bị bỏ qua lặng lẽ)
- [x] Ném `Error`: Cannot modify readonly property P::$x
- [ ] Lỗi cú pháp vì không được kết hợp constructor promotion với `readonly`
> Readonly property chỉ được khởi tạo một lần, từ bên trong scope của class; mọi lần ghi sau đều ném `Error`. Constructor promotion kết hợp `readonly` là hợp lệ từ PHP 8.1.

## Biện pháp quan trọng nhất để chống session fixation là gì? [mid]
- [ ] Lưu session ID trong `localStorage` thay vì cookie
- [x] Gọi `session_regenerate_id(true)` ngay sau khi đăng nhập thành công
- [ ] Tăng `session.gc_maxlifetime`
- [ ] Mã hóa dữ liệu trong `$_SESSION`
> Session fixation dựa vào việc nạn nhân dùng session ID do kẻ tấn công đặt trước; tạo ID mới khi đổi mức đặc quyền làm ID cũ vô dụng. Đặt cookie `HttpOnly`, `Secure`, `SameSite` và `session.use_strict_mode=1` là các biện pháp bổ sung.

## Đoạn code Laravel `foreach (Post::all() as $p) { echo $p->author->name; }` với 100 post sinh ra bao nhiêu query và cách sửa? [mid]
- [ ] 1 query; Eloquent tự động eager load quan hệ
- [ ] 2 query; không cần sửa
- [ ] 100 query; sửa bằng `Post::cursor()`
- [x] 101 query; sửa bằng `Post::with('author')->get()`
> Đây là vấn đề N+1: 1 query lấy post và mỗi lần truy cập `author` lazy load một query riêng. `with('author')` eager load bằng một query `WHERE id IN (...)`, tổng còn 2 query. `cursor()` chỉ giảm bộ nhớ, không giải quyết N+1.

## Đoạn code sau in ra gì? [mid]
```php
$x = 1;
$f = function () use ($x) { return $x; };
$g = fn() => $x;
$x = 2;
echo $f(), $g();
```
- [ ] `22`
- [ ] `12`
- [ ] `21`
- [x] `11`
> Cả `use ($x)` và arrow function đều capture biến theo giá trị tại thời điểm tạo closure. Muốn thấy giá trị mới phải dùng `use (&$x)`; arrow function không hỗ trợ capture by reference.

## Đoạn code sau cho kết quả gì? [mid]
```php
<?php
declare(strict_types=1);
function f(int $x): int { return $x * 2; }
echo f("5");
```
- [x] Ném `TypeError` vì truyền string cho tham số `int`
- [ ] In ra `10`
- [ ] In ra `55`
- [ ] Chỉ phát `E_DEPRECATED` rồi in ra `10`
> Với `strict_types=1`, PHP không tự ép kiểu scalar khi gọi hàm từ file này nên "5" bị từ chối bằng `TypeError`. Không có `strict_types` (chế độ coercive), "5" được ép thành 5 và in ra 10. Ngoại lệ duy nhất là int được phép truyền cho tham số float.

## Production đặt `opcache.validate_timestamps=0`. Sau khi deploy code mới bằng cách ghi đè file, điều gì xảy ra? [senior]
- [ ] OPcache tự phát hiện file thay đổi sau `opcache.revalidate_freq` giây
- [x] PHP-FPM tiếp tục chạy bytecode cũ cho đến khi reset OPcache (reload FPM hoặc `opcache_reset()`)
- [ ] Request đầu tiên sau deploy bị lỗi, các request sau chạy code mới
- [ ] OPcache tự vô hiệu hóa vì phát hiện checksum không khớp
> Với `validate_timestamps=0`, OPcache không bao giờ kiểm tra mtime nên `revalidate_freq` bị bỏ qua. Đây là cấu hình tối ưu hiệu năng nhưng bắt buộc quy trình deploy phải reload FPM (thường kết hợp deploy symlink atomic).

## Server dành khoảng 6GB RAM cho PHP-FPM, mỗi worker dùng trung bình ~60MB. Cấu hình `pm.max_children` hợp lý nhất? [senior]
- [ ] Bằng số CPU core, vì PHP là single-thread
- [ ] 1000, để đáp ứng nhiều request đồng thời nhất có thể
- [x] Khoảng 100 (6GB / 60MB), sau đó tinh chỉnh theo đo đạc thực tế
- [ ] 10, vì mỗi worker xử lý được nhiều request song song
> `max_children` bị giới hạn chủ yếu bởi bộ nhớ: vượt quá sẽ gây swap/OOM. Worker phần lớn thời gian chờ I/O (DB, HTTP) nên số worker thường lớn hơn nhiều so với số core; mỗi worker chỉ xử lý một request tại một thời điểm.

## Phát biểu nào đúng về đoạn code `$a = range(1, 1000000); $b = $a;`? [senior]
- [ ] Bộ nhớ tăng gấp đôi ngay lập tức vì mảng được copy khi gán
- [ ] `$b` là reference tới `$a`, sửa `$b` sẽ làm thay đổi `$a`
- [ ] PHP luôn truyền mảng theo reference nên không bao giờ copy
- [x] Hai biến chia sẻ cùng một zval (refcount = 2); mảng chỉ bị copy khi một trong hai bị ghi (copy-on-write)
> PHP dùng copy-on-write cho mảng: gán chỉ tăng refcount, việc nhân bản thực sự diễn ra khi có thao tác ghi. Về ngữ nghĩa vẫn là truyền theo giá trị, nên sửa `$b` không ảnh hưởng `$a`.

## Ứng dụng Laravel chạy trên Octane. Service lưu trạng thái theo user hiện tại được đăng ký bằng `singleton()`. Vấn đề và cách sửa? [senior]
- [ ] Không có vấn đề vì container được tạo lại mỗi request
- [x] Instance tồn tại xuyên suốt nhiều request trong cùng worker → rò rỉ state giữa các user; nên dùng `scoped()`
- [ ] `singleton()` không hoạt động trên Octane và sẽ ném exception
- [ ] Nên đổi sang `bind()` vì `bind()` cache instance theo từng worker
> Trên Octane, application được giữ trong bộ nhớ giữa các request nên singleton tồn tại mãi trong worker. `scoped()` tạo instance một lần mỗi request/job và được flush khi kết thúc. `bind()` tạo instance mới mỗi lần resolve, không cache.

## Đoạn code sau in ra gì trên PHP 8.1+? [senior]
```php
class A {
    public static function counter() {
        static $c = 0;
        return ++$c;
    }
}
class B extends A {}
A::counter();
A::counter();
B::counter();
echo B::counter();
```
- [ ] `2`
- [x] `4`
- [ ] `1`
- [ ] `3`
> Từ PHP 8.1, method kế thừa (không override) dùng chung biến static với method của class cha, nên bộ đếm tăng liên tục 1→4. Trước PHP 8.1, `B::counter()` có bản sao biến static riêng và sẽ in ra `2`.

## Đoạn code sau in ra gì? [senior]
```php
function gen() {
    $x = yield 1;
    echo $x;
    yield 2;
}
$g = gen();
echo $g->current();
echo $g->send('A');
```
- [ ] `12A`
- [ ] `1A`
- [x] `1A2`
- [ ] `A12`
> `current()` chạy generator tới `yield` đầu tiên và trả về 1. `send('A')` gán 'A' làm kết quả của biểu thức `yield 1`, chạy tiếp (in "A") tới `yield 2` và trả về 2.

## Khi so sánh API token hoặc HMAC signature, tại sao nên dùng `hash_equals()` thay vì `===`? [senior]
- [ ] `===` không so sánh được chuỗi nhị phân
- [ ] `hash_equals()` tự hash hai chuỗi trước khi so sánh nên an toàn hơn
- [ ] `===` bị type juggling nên `"0e123" === "0e456"` trả về true
- [x] `hash_equals()` so sánh thời gian hằng định, chống timing attack
> `===` dừng ngay ở byte khác đầu tiên, nên thời gian phản hồi lộ ra số ký tự đúng và cho phép đoán dần token. `===` không bị type juggling; lỗi magic hash "0e..." chỉ xảy ra với `==`.

## Gọi `unserialize($_COOKIE['data'])` có nguy cơ bảo mật gì và cách giảm thiểu? [senior]
- [ ] Chỉ gây lỗi hiệu năng; nên cache kết quả
- [ ] Gây SQL Injection; nên escape cookie trước
- [x] PHP Object Injection: kẻ tấn công tạo object của class bất kỳ, kích hoạt chuỗi gadget qua `__wakeup`/`__destruct`; dùng `json_decode` hoặc `['allowed_classes' => false]`
- [ ] Không có rủi ro vì `unserialize` chỉ tạo mảng và scalar
> `unserialize` có thể khôi phục object của bất kỳ class nào đã autoload, và magic method của chúng chạy tự động — nền tảng của nhiều lỗ hổng RCE (POP chain). Không bao giờ unserialize dữ liệu không tin cậy.

## Đoạn code `User::where('active', false)->chunk(100, fn($users) => $users->each->update(['active' => true]));` có vấn đề gì? [senior]
- [x] Bỏ sót bản ghi: điều kiện lọc bị thay đổi trong lúc chunk theo OFFSET nên các trang sau bị lệch; nên dùng `chunkById()`
- [ ] Gây N+1 query vì `update` trong vòng lặp
- [ ] `chunk` load toàn bộ bảng vào bộ nhớ trước khi chia
- [ ] Không có vấn đề gì, đây là cách làm khuyến nghị
> `chunk` phân trang bằng LIMIT/OFFSET; khi các bản ghi đã xử lý không còn thỏa `active = false`, OFFSET của trang tiếp theo nhảy qua một phần bản ghi chưa xử lý. `chunkById` phân trang theo `id > lastId` nên ổn định.

## Trong `DB::transaction()`, code tạo order rồi `dispatch(new SendInvoice($order))` lên queue Redis. Đôi khi job báo không tìm thấy order. Nguyên nhân và cách sửa? [senior]
- [ ] Redis mất dữ liệu; nên chuyển sang database queue
- [x] Worker xử lý job trước khi transaction commit; dùng `->afterCommit()` hoặc cấu hình `after_commit => true`
- [ ] `SerializesModels` serialize toàn bộ model nên dữ liệu bị cũ
- [ ] Do thiếu `$tries` trong job; tăng số lần retry sẽ giải quyết triệt để
> Job được đẩy vào queue ngay khi dispatch, trong khi bản ghi chưa commit nên worker (connection khác) không nhìn thấy. `afterCommit` hoãn dispatch tới khi transaction commit. `SerializesModels` chỉ lưu identifier rồi query lại, chính vì vậy mới không tìm thấy bản ghi.

## Trang gửi nhiều AJAX request song song tới các endpoint PHP dùng session (file handler mặc định), nhưng chúng chạy tuần tự. Vì sao? [senior]
- [ ] PHP-FPM chỉ xử lý một request mỗi client
- [ ] Trình duyệt giới hạn một kết nối tới mỗi domain
- [ ] OPcache khóa file script trong lúc thực thi
- [x] `session_start()` khóa file session cho đến khi script kết thúc; gọi `session_write_close()` sớm khi không cần ghi session
> File session handler dùng exclusive lock (flock), nên các request cùng session ID xếp hàng chờ nhau. Đóng session sớm (hoặc `session_start(['read_and_close' => true])`) giải phóng lock.

## Phát biểu nào đúng về Fibers trong PHP 8.1? [senior]
- [ ] Fiber chạy song song trên nhiều CPU core giống thread
- [ ] Fiber tự động biến mọi hàm I/O blocking như `file_get_contents` thành non-blocking
- [x] Fiber là coroutine cooperative: chỉ một fiber chạy tại một thời điểm, chuyển quyền bằng `Fiber::suspend()`/`resume()`, thường dùng bên dưới event loop (Revolt, AMPHP)
- [ ] Fiber thay thế PHP-FPM bằng mô hình multi-thread
> Fiber cho phép tạm dừng/tiếp tục một call stack hoàn chỉnh mà không cần "màu hàm" kiểu async/await, nhưng không mang lại song song. Hàm blocking vẫn block toàn bộ process; cần thư viện I/O non-blocking cùng event loop.
