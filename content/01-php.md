---
id: php
title: PHP
icon: 🐘
order: 1
description: Câu hỏi phỏng vấn PHP từ cơ bản đến nâng cao: kiểu dữ liệu, OOP, PHP 8, runtime, bảo mật, Laravel và testing.
---

# Cơ bản & Kiểu dữ liệu

## Sự khác nhau giữa == và === trong PHP? [junior]
- `==` (loose comparison): so sánh **giá trị** sau khi PHP tự **type juggling** (ép kiểu ngầm).
- `===` (strict comparison): so sánh cả **giá trị và kiểu dữ liệu**, không ép kiểu.

```php
var_dump(0 == "a");      // PHP 8: false (PHP 7: true)
var_dump("1" == "01");   // true  (cả hai là numeric string)
var_dump("10" == "1e1"); // true
var_dump(null == false); // true
var_dump(null === false);// false
var_dump([] == false);   // true
```

Tương tự có `!=` / `!==`. Các hàm như `in_array()`, `array_search()` mặc định dùng loose comparison, nên truyền tham số thứ ba `true` để so sánh strict.

**Lưu ý / bẫy thường gặp:** `strpos()` trả về `0` khi tìm thấy ở vị trí đầu, nên `if (strpos($s, 'a') == false)` sẽ sai. Luôn dùng `=== false` (hoặc `str_contains()` ở PHP 8).

## Type juggling là gì? PHP 8 thay đổi gì về so sánh string với number? [mid]
**Type juggling** là cơ chế PHP tự động chuyển kiểu của biến theo ngữ cảnh: phép toán số, so sánh lỏng, nối chuỗi, điều kiện `if`.

```php
$a = "5" + 3;      // 8 (int)
$b = "5" . 3;      // "53"
if ("0") { }       // "0" là falsy
```

**Thay đổi ở PHP 8 (Saner string to number comparisons):**
- Trước PHP 8: so sánh number với non-numeric string thì string bị ép về number → `0 == "abc"` là `true`.
- Từ PHP 8: nếu string không phải numeric, **number được ép thành string** rồi so sánh chuỗi → `0 == "abc"` là `false`.

Các giá trị falsy: `false`, `0`, `0.0`, `""`, `"0"`, `[]`, `null`.

**Lưu ý / bẫy thường gặp:** lỗ hổng "magic hash" — `"0e123" == "0e456"` là `true` vì cả hai được hiểu là số khoa học bằng 0. So sánh hash phải dùng `hash_equals()` hoặc `===`.

## declare(strict_types=1) có tác dụng gì? [mid]
Mặc định PHP chạy ở **coercive mode**: khi truyền `"5"` vào tham số `int`, PHP tự ép kiểu. Với `declare(strict_types=1);` ở **dòng đầu file**, PHP ném `TypeError` nếu kiểu không khớp chính xác (ngoại lệ duy nhất: `int` được phép truyền vào `float`).

```php
<?php
declare(strict_types=1);

function add(int $a, int $b): int { return $a + $b; }

add(1, 2);     // OK
add("1", 2);   // TypeError
```

Điểm quan trọng:
- Có hiệu lực **theo file của nơi gọi hàm** (caller), không phải nơi định nghĩa hàm.
- Áp dụng cho tham số, giá trị trả về và typed properties.
- Không ảnh hưởng tới phép toán hay so sánh.

**Lưu ý / bẫy thường gặp:** callback do hàm built-in gọi (ví dụ `array_map`) chịu ảnh hưởng của strict mode theo file nội bộ, nên hành vi đôi khi khác kỳ vọng.

## Các kiểu dữ liệu trong PHP và các type mới (union, nullable, mixed, never)? [junior]
**Scalar:** `int`, `float`, `string`, `bool`. **Compound:** `array`, `object`, `callable`, `iterable`. **Special:** `null`, `resource`.

Type declarations hiện đại:

| Type | Phiên bản | Ví dụ |
|---|---|---|
| Nullable | 7.1 | `?string` |
| `void` | 7.1 | hàm không trả về |
| Union types | 8.0 | `int\|string` |
| `mixed` | 8.0 | mọi kiểu |
| `static` return | 8.0 | fluent API |
| `never` | 8.1 | hàm luôn throw/exit |
| Intersection | 8.1 | `Countable&Iterator` |
| DNF types | 8.2 | `(A&B)\|null` |
| `true`, `false`, `null` standalone | 8.2 | |

```php
function find(int $id): ?User { /* ... */ }
function fail(string $msg): never { throw new RuntimeException($msg); }
```

## Sự khác nhau giữa include, require, include_once, require_once? [junior]
- `include`: nếu file không tồn tại → **Warning**, script vẫn tiếp tục.
- `require`: nếu file không tồn tại → **Fatal error**, dừng script.
- `*_once`: kiểm tra file đã được nạp chưa; nếu rồi thì bỏ qua → tránh lỗi redeclare function/class.

```php
require_once __DIR__ . '/config.php';
$data = include 'data.php'; // include có thể trả về giá trị từ file
```

Trong dự án hiện đại gần như không gọi thủ công nữa mà dùng **Composer autoload** (PSR-4). `*_once` tốn thêm chi phí kiểm tra đường dẫn nhưng với OPcache thì không đáng kể.

**Lưu ý / bẫy thường gặp:** đường dẫn tương đối được resolve theo `include_path` và thư mục làm việc hiện tại, không phải thư mục của file đang chạy — luôn dùng `__DIR__`.

## Truyền tham số by value và by reference trong PHP? Object có được truyền by reference không? [mid]
- Biến scalar/array mặc định **truyền by value**, nhưng PHP dùng **copy-on-write**: chỉ thực sự copy khi bị sửa.
- `&$param` để truyền **by reference**.
- **Object** được truyền bằng **object handle** (giống "reference by value"): sửa thuộc tính bên trong hàm sẽ ảnh hưởng ra ngoài, nhưng gán lại biến thì không.

```php
function modify(array $arr) { $arr[] = 1; }        // không ảnh hưởng
function modifyRef(array &$arr) { $arr[] = 1; }    // ảnh hưởng

function change(User $u) { $u->name = 'A'; }       // ảnh hưởng
function replace(User $u) { $u = new User(); }     // không ảnh hưởng
```

**Lưu ý / bẫy thường gặp:** `foreach ($arr as &$v)` để lại reference sau vòng lặp; nếu dùng lại `$v` sẽ ghi đè phần tử cuối. Luôn `unset($v)` sau vòng lặp. Muốn sao chép object dùng `clone` (shallow copy, tùy biến bằng `__clone`).

# Lập trình hướng đối tượng (OOP)

## Interface khác Abstract class như thế nào? Khi nào dùng cái nào? [junior]
| Tiêu chí | Interface | Abstract class |
|---|---|---|
| Implementation | Không có method body (chỉ có constants) | Có thể có method đã cài đặt |
| Properties | Không (PHP 8.4 cho phép property hooks trong interface) | Có |
| Kế thừa | Class implement **nhiều** interface | Chỉ extends **một** class |
| Constructor | Không nên | Có |
| Visibility | Mọi method là `public` | `public`/`protected`/`private` |

```php
interface PaymentGateway { public function charge(int $amount): bool; }

abstract class BaseGateway implements PaymentGateway {
    protected function log(string $m): void { /* ... */ }
}
```

**Khi nào dùng:**
- **Interface**: định nghĩa contract/khả năng ("can-do"), phục vụ Dependency Injection, mocking, nhiều implementation.
- **Abstract class**: chia sẻ code chung giữa các class cùng họ ("is-a"), Template Method pattern.

Thường kết hợp cả hai: interface làm contract, abstract class làm base implementation.

## Trait là gì? Giải quyết xung đột method giữa các trait thế nào? [mid]
**Trait** là cơ chế tái sử dụng code theo chiều ngang (horizontal reuse), bù cho việc PHP chỉ hỗ trợ single inheritance. Code trong trait được "copy" vào class lúc compile.

```php
trait Loggable { public function log($m) { echo "Log: $m"; } }
trait Auditable { public function log($m) { echo "Audit: $m"; } }

class Order {
    use Loggable, Auditable {
        Auditable::log insteadof Loggable;
        Loggable::log as protected logInfo;
    }
}
```

Đặc điểm:
- Trait có thể có properties, abstract methods, static methods, constants (PHP 8.2).
- Thứ tự ưu tiên: **method của class > method của trait > method kế thừa từ parent**.
- `insteadof` để chọn method, `as` để đặt alias hoặc đổi visibility.

**Lưu ý / bẫy thường gặp:** lạm dụng trait gây coupling ẩn và khó test; trait không phải là type nên không dùng được cho type-hint hay `instanceof`. Ưu tiên composition khi có thể.

## Late Static Binding là gì? Khác gì giữa self và static? [mid]
- `self::` resolve tại **compile time** — trỏ tới class nơi method được **định nghĩa**.
- `static::` resolve tại **runtime** — trỏ tới class **được gọi thực sự** (late static binding, PHP 5.3+).

```php
class Model {
    public static function create(): static {
        return new static();   // trả về class con
    }
    public static function createSelf(): self {
        return new self();     // luôn trả về Model
    }
}
class User extends Model {}

get_class(User::create());     // User
get_class(User::createSelf()); // Model
```

Ứng dụng: Active Record (Eloquent `User::find()`), factory method, fluent interface trả về `static`.

**Lưu ý / bẫy thường gặp:** `parent::` và `self::` vẫn "chuyển tiếp" thông tin static gốc (forwarding call), còn gọi trực tiếp `Model::method()` thì không.

## Magic methods trong PHP? Kể tên và công dụng. [junior]
Magic methods bắt đầu bằng `__`, được PHP gọi tự động trong các tình huống cụ thể:

| Method | Khi nào được gọi |
|---|---|
| `__construct`, `__destruct` | Khởi tạo / hủy object |
| `__get`, `__set`, `__isset`, `__unset` | Truy cập property không tồn tại/không truy cập được |
| `__call`, `__callStatic` | Gọi method không tồn tại |
| `__toString` | Ép object thành string |
| `__invoke` | Gọi object như hàm `$obj()` |
| `__clone` | Khi `clone $obj` |
| `__serialize`, `__unserialize` | serialize/unserialize (thay `__sleep/__wakeup`) |
| `__set_state`, `__debugInfo` | `var_export`, `var_dump` |

```php
class Config {
    private array $data = [];
    public function __get($k) { return $this->data[$k] ?? null; }
    public function __set($k, $v) { $this->data[$k] = $v; }
}
```

Laravel dùng `__call`/`__callStatic` cho Facades và Eloquent query builder.

**Lưu ý / bẫy thường gặp:** magic methods chậm hơn truy cập trực tiếp, khó cho IDE/static analysis; `__unserialize`/`__wakeup` với dữ liệu không tin cậy có thể dẫn tới **PHP Object Injection**.

## Các nguyên tắc SOLID áp dụng trong PHP như thế nào? [mid]
- **S – Single Responsibility**: mỗi class một lý do để thay đổi. Ví dụ tách `UserController` khỏi `UserService`, `UserRepository`, `Mailer`.
- **O – Open/Closed**: mở rộng bằng cách thêm class mới (Strategy, Interface) thay vì sửa `if/else` cũ.
- **L – Liskov Substitution**: class con thay thế được class cha mà không phá vỡ hành vi (không ném exception mới, không thu hẹp input).
- **I – Interface Segregation**: interface nhỏ, chuyên biệt (`Readable`, `Writable`) thay vì một interface "béo".
- **D – Dependency Inversion**: phụ thuộc vào abstraction; inject qua constructor.

```php
final class OrderService {
    public function __construct(
        private PaymentGateway $gateway,   // interface
        private OrderRepository $orders,
    ) {}
}
```

Laravel Service Container hỗ trợ trực tiếp DIP qua binding `interface → implementation`.

## Sự khác nhau giữa static, final, abstract và visibility modifiers? [junior]
- **Visibility**: `public` (mọi nơi), `protected` (class và class con), `private` (chỉ class định nghĩa).
- **static**: thuộc về class thay vì instance; truy cập qua `ClassName::` hoặc `static::`. Không có `$this`.
- **final**: class `final` không thể kế thừa; method `final` không thể override; `final const` (8.1).
- **abstract**: class không thể khởi tạo; method abstract bắt buộc class con cài đặt.
- **readonly** (8.1 property, 8.2 class): chỉ gán một lần trong scope của class.

```php
final class Money {
    public function __construct(public readonly int $amount) {}
    public static function zero(): self { return new self(0); }
}
```

**Lưu ý / bẫy thường gặp:** static state chia sẻ toàn bộ request (và giữa các request trong long-running runtime như Swoole/Octane/RoadRunner), dễ gây rò rỉ dữ liệu và khó test. Nên khai báo class `final` mặc định để tránh kế thừa ngoài ý muốn.

# Tính năng PHP 7 và PHP 8+

## Những tính năng nổi bật của PHP 8.0? [junior]
- **JIT compiler**
- **Named arguments**: `htmlspecialchars($s, double_encode: false)`
- **Union types**: `int|float`
- **Constructor property promotion**
- **match expression**
- **Nullsafe operator**: `$user?->getAddress()?->city`
- **Attributes** thay docblock annotations
- **Saner string to number comparisons**
- `str_contains()`, `str_starts_with()`, `str_ends_with()`
- `throw` là expression: `$x = $y ?? throw new Exception();`
- `mixed`, `static` return type, `WeakMap`

```php
class Point {
    public function __construct(
        private int $x = 0,
        private int $y = 0,
    ) {}
}
$name = $user?->profile?->name ?? 'Guest';
```

Các bản sau: **8.1** (enums, readonly properties, fibers, `never`, first-class callable `strlen(...)`), **8.2** (readonly classes, DNF types), **8.3** (typed class constants, `json_validate`, `#[Override]`), **8.4** (property hooks, asymmetric visibility, `new` không cần ngoặc khi chain).

## match khác switch như thế nào? [junior]
| | `switch` | `match` (PHP 8) |
|---|---|---|
| So sánh | Loose `==` | Strict `===` |
| Giá trị trả về | Không (statement) | Có (expression) |
| `break` | Cần, dễ fall-through | Không cần |
| Không khớp case | Bỏ qua | Ném `UnhandledMatchError` |
| Nhiều điều kiện | Nhiều `case` | Dấu phẩy `1, 2 =>` |

```php
$label = match ($status) {
    200, 201 => 'Success',
    404      => 'Not Found',
    default  => 'Unknown',
};

// match(true) cho điều kiện phức tạp
$grade = match (true) {
    $score >= 90 => 'A',
    $score >= 70 => 'B',
    default      => 'C',
};
```

**Lưu ý / bẫy thường gặp:** mỗi arm của `match` chỉ là **một expression**, không chứa nhiều statement; nếu cần logic phức tạp hãy gọi hàm.

## Enums trong PHP 8.1 hoạt động như thế nào? Pure vs Backed enum? [mid]
Enum là một kiểu đặc biệt của object, tập giá trị hữu hạn, type-safe.

- **Pure enum**: chỉ có case, không có giá trị scalar.
- **Backed enum**: mỗi case gắn với `int` hoặc `string`, có `from()` (ném lỗi) và `tryFrom()` (trả `null`).

```php
enum OrderStatus: string {
    case Pending = 'pending';
    case Paid = 'paid';

    public function label(): string {
        return match ($this) {
            self::Pending => 'Chờ thanh toán',
            self::Paid => 'Đã thanh toán',
        };
    }
}

$s = OrderStatus::from('paid');
$s->value;           // 'paid'
OrderStatus::cases(); // mảng tất cả case
```

Enum có thể implement interface, có method, static method, constant; **không** có state (property) và không thể `new`. So sánh bằng `===` vì mỗi case là singleton.

Laravel hỗ trợ cast enum trong Eloquent: `protected $casts = ['status' => OrderStatus::class];`.

## readonly properties và readonly classes là gì? [mid]
- **readonly property (8.1)**: chỉ được khởi tạo **một lần**, từ **bên trong scope của class**; sau đó mọi phép gán đều ném `Error`. Bắt buộc phải có type.
- **readonly class (8.2)**: tất cả properties đều readonly, không cho thêm dynamic properties.

```php
final readonly class Money {
    public function __construct(
        public int $amount,
        public string $currency,
    ) {}

    public function add(Money $o): static {
        return new static($this->amount + $o->amount, $this->currency);
    }
}
```

Dùng cho **Value Object**, DTO, immutable domain model.

**Lưu ý / bẫy thường gặp:**
- readonly là "shallow": nếu property chứa object, object đó vẫn mutable bên trong.
- Không thể `clone` rồi sửa property (PHP 8.3 cho phép re-initialize trong `__clone`). Pattern "wither" phải tạo object mới.
- Không có default value cho readonly property (trừ qua constructor promotion).

## Attributes trong PHP 8 là gì? So với docblock annotations? [mid]
**Attributes** là metadata có cấu trúc gắn vào class, method, property, parameter, function, constant; đọc được qua **Reflection API**. Thay thế cho annotations trong docblock (vốn phải parse comment).

```php
#[Attribute(Attribute::TARGET_METHOD)]
final class Route {
    public function __construct(public string $path, public string $method = 'GET') {}
}

class UserController {
    #[Route('/users', method: 'GET')]
    public function index() {}
}

$ref = new ReflectionMethod(UserController::class, 'index');
foreach ($ref->getAttributes(Route::class) as $attr) {
    $route = $attr->newInstance();
}
```

Ưu điểm so với docblock: được engine parse, có cú pháp kiểm tra, hỗ trợ IDE, không phụ thuộc thư viện parse comment.

Attributes built-in: `#[Override]`, `#[Deprecated]` (8.4), `#[SensitiveParameter]`, `#[ReturnTypeWillChange]`, `#[AllowDynamicProperties]`.

Ứng dụng: Symfony routing, Doctrine ORM mapping, validation, PHPUnit 10+ (`#[Test]`, `#[DataProvider]`).

## JIT trong PHP 8 là gì? Có giúp ứng dụng web nhanh hơn không? [senior]
**JIT (Just-In-Time compiler)** biên dịch opcode thành **machine code** lúc runtime, xây dựng trên OPcache. Hai chế độ: **Function JIT** và **Tracing JIT** (mặc định, hiệu quả hơn).

```bash
opcache.enable=1
opcache.jit_buffer_size=128M
opcache.jit=tracing
```

**Hiệu quả thực tế:**
- Tăng tốc mạnh cho tác vụ **CPU-bound**: tính toán toán học, xử lý ảnh, ML, vòng lặp nặng.
- Với ứng dụng web điển hình (Laravel, WordPress) tăng rất ít, vì bottleneck là **I/O**: database, network, file, cache.

**Phân biệt:**
- **OPcache**: cache opcode đã compile → bỏ qua bước parse/compile mỗi request (quan trọng nhất với web).
- **JIT**: tối ưu tiếp bước **thực thi** opcode.

**Lưu ý / bẫy thường gặp:** JIT có thể xung đột với một số extension debug (Xdebug), tăng bộ nhớ, và khó debug. Hãy benchmark trước khi bật trong production.

## Fibers trong PHP 8.1 là gì? [senior]
**Fiber** là coroutine cấp thấp (stackful) cho phép **tạm dừng và tiếp tục** một hàm mà vẫn giữ nguyên call stack. Đây là nền tảng để xây dựng thư viện bất đồng bộ (ReactPHP, Amp v3, Revolt event loop) mà không cần `yield`/Promise lan khắp code.

```php
$fiber = new Fiber(function (string $x): string {
    $y = Fiber::suspend($x . ' suspended');
    return "resumed with $y";
});

$v = $fiber->start('hello');   // 'hello suspended'
$fiber->resume('data');
echo $fiber->getReturn();       // 'resumed with data'
```

Điểm chính:
- Fiber **không tạo thread** và **không chạy song song**; vẫn là single-thread, cooperative multitasking.
- Khác Generator: Generator là stackless, chỉ suspend ở hàm chứa `yield`; Fiber suspend từ bất kỳ độ sâu nào trong call stack.
- Lợi ích thực sự khi kết hợp **non-blocking I/O** và **event loop**.

**Lưu ý / bẫy thường gặp:** gọi các hàm blocking (PDO, `file_get_contents`) bên trong Fiber vẫn chặn toàn bộ process.

# Runtime: Request lifecycle, Memory, PHP-FPM, OPcache

## Vòng đời một request PHP diễn ra như thế nào? [mid]
PHP truyền thống theo mô hình **shared-nothing**: mỗi request bắt đầu sạch và kết thúc giải phóng toàn bộ.

1. **Module init (MINIT)**: khi PHP-FPM master khởi động, load extensions, đọc `php.ini`.
2. Web server (Nginx) nhận request → chuyển qua **FastCGI** tới một **worker** của PHP-FPM.
3. **Request init (RINIT)**: khởi tạo superglobals (`$_GET`, `$_POST`, `$_SERVER`...).
4. **Compile**: Lexer → Parser → AST → **Opcodes** (bỏ qua nếu đã có trong OPcache).
5. **Execute**: Zend VM thực thi opcode (hoặc machine code nếu JIT).
6. **Request shutdown (RSHUTDOWN)**: gọi `register_shutdown_function`, destructors, giải phóng bộ nhớ request, đóng resource.
7. Worker quay lại pool chờ request tiếp theo.

Ưu điểm: không rò rỉ state giữa các request, dễ scale ngang. Nhược điểm: phải bootstrap framework mỗi request → giải pháp là OPcache, preloading, hoặc long-running runtime (Laravel Octane, Swoole, RoadRunner, FrankenPHP).

## PHP-FPM là gì? Các chế độ process manager và cách tuning? [senior]
**PHP-FPM (FastCGI Process Manager)** gồm một **master process** quản lý pool các **worker process**; mỗi worker xử lý **một request tại một thời điểm**.

Các chế độ `pm`:
- **static**: số worker cố định (`pm.max_children`). Hiệu năng ổn định, phù hợp server chuyên dụng.
- **dynamic**: dao động giữa `pm.min_spare_servers` và `pm.max_spare_servers`, tối đa `pm.max_children`.
- **ondemand**: chỉ spawn khi có request, kill sau `pm.process_idle_timeout`. Tiết kiệm RAM, latency cao hơn.

```bash
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
request_terminate_timeout = 30s
```

**Tuning:** `max_children ≈ (RAM dành cho PHP) / (RAM trung bình mỗi worker)`. `pm.max_requests` giúp recycle worker để giảm ảnh hưởng memory leak từ extension.

**Lưu ý / bẫy thường gặp:** khi tất cả worker bận (do query chậm, gọi API ngoài), request mới xếp hàng → 502/504. Theo dõi qua `pm.status_path` và slowlog (`request_slowlog_timeout`).

## OPcache hoạt động như thế nào? Preloading là gì? [senior]
**OPcache** lưu **opcode đã compile** vào **shared memory**, dùng chung giữa các worker FPM → bỏ qua parse/compile ở các request sau. Thường tăng hiệu năng 2-3 lần.

Cấu hình quan trọng cho production:

```bash
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.preload=/var/www/preload.php
opcache.preload_user=www-data
```

- `validate_timestamps=0`: không kiểm tra file thay đổi → nhanh nhất, nhưng **phải reset OPcache khi deploy** (reload FPM hoặc `opcache_reset()`).
- **Preloading (PHP 7.4)**: nạp sẵn class/function vào memory lúc server khởi động, chúng tồn tại suốt vòng đời server như class built-in.

**Lưu ý / bẫy thường gặp:** deploy kiểu symlink swap mà không reload FPM sẽ chạy code cũ do `realpath_cache`/OPcache. Preload thay đổi thì cần restart FPM.

## PHP quản lý bộ nhớ như thế nào? Reference counting và Garbage Collector? [senior]
PHP dùng **reference counting** qua cấu trúc `zval`/`zend_refcounted`:
- Mỗi giá trị (string, array, object) có **refcount**; khi refcount về 0 thì giải phóng ngay.
- **Copy-on-write**: gán array cho biến khác chỉ tăng refcount; chỉ copy thật khi một bên sửa.

Vấn đề: **circular reference** (A trỏ B, B trỏ A) khiến refcount không bao giờ về 0. **Cycle collector** (GC) xử lý bằng cách thu thập "possible roots" vào buffer (mặc định 10.000 root), khi đầy sẽ chạy thuật toán đánh dấu để tìm và giải phóng chu trình.

```php
gc_collect_cycles();      // ép thu gom
gc_status();              // thống kê
memory_get_usage(true);
memory_get_peak_usage();
```

Trong mô hình FPM, mọi bộ nhớ request bị giải phóng khi kết thúc nên leak ít nghiêm trọng. Nhưng với **CLI workers, queue workers, Octane/Swoole**, leak tích lũy theo thời gian.

**Lưu ý / bẫy thường gặp:** xử lý file/kết quả lớn nên dùng **generator** (`yield`), `cursor()`/`chunk()` thay vì load toàn bộ vào array; dùng `WeakMap`/`WeakReference` cho cache gắn với object.

## Generator trong PHP là gì và khi nào nên dùng? [mid]
**Generator** là hàm chứa `yield`, trả về object `Generator` (implement `Iterator`). Giá trị được sinh ra **lazy** từng phần tử, không giữ toàn bộ tập dữ liệu trong bộ nhớ.

```php
function readLines(string $file): Generator {
    $h = fopen($file, 'r');
    try {
        while (($line = fgets($h)) !== false) {
            yield trim($line);
        }
    } finally {
        fclose($h);
    }
}

foreach (readLines('big.csv') as $line) { /* bộ nhớ ~ hằng số */ }
```

Tính năng thêm:
- `yield $key => $value`
- `yield from` để ủy quyền cho generator/array khác
- `$gen->send($value)` truyền dữ liệu ngược vào generator
- `return` trong generator, đọc bằng `getReturn()`

Dùng khi: đọc file lớn, export dữ liệu, xử lý pipeline, phân trang API. Laravel `LazyCollection` và `cursor()` xây dựng trên generator.

**Lưu ý / bẫy thường gặp:** generator chỉ duyệt **một lần** (không rewind sau khi đã chạy).

# Composer & PSR

## Composer hoạt động như thế nào? composer.json khác composer.lock? [junior]
**Composer** là dependency manager của PHP: resolve version theo constraint, tải package (từ Packagist), sinh **autoloader**.

- `composer.json`: khai báo dependency với **version constraint** (`^10.0`, `~1.2`), autoload, scripts.
- `composer.lock`: ghi lại **chính xác version** (và commit hash) đã được cài → đảm bảo mọi môi trường cài giống nhau.

| Lệnh | Tác dụng |
|---|---|
| `composer install` | Cài theo `composer.lock` (dùng cho CI/production) |
| `composer update` | Resolve lại theo `composer.json`, cập nhật lock |
| `composer require pkg` | Thêm package |
| `composer dump-autoload -o` | Sinh lại classmap tối ưu |

Constraint: `^1.2.3` = `>=1.2.3 <2.0.0`; `~1.2` = `>=1.2 <2.0`; `~1.2.3` = `>=1.2.3 <1.3.0`.

**Lưu ý / bẫy thường gặp:** luôn commit `composer.lock` cho application (không cần cho library). Production dùng `composer install --no-dev --optimize-autoloader --classmap-authoritative`.

## PSR-4 autoloading là gì? [junior]
**PSR-4** là chuẩn ánh xạ **namespace → thư mục** để autoload class mà không cần `require` thủ công.

```json
{
  "autoload": {
    "psr-4": { "App\\": "src/" }
  }
}
```

Class `App\Http\Controllers\UserController` → file `src/Http/Controllers/UserController.php`.

Quy tắc:
- Một class mỗi file, tên file trùng tên class (phân biệt hoa thường trên Linux).
- Namespace prefix ánh xạ tới base directory; phần còn lại ánh xạ tới thư mục con.

Composer đăng ký autoloader qua `spl_autoload_register()`. Khi gặp class chưa được load, autoloader tính đường dẫn và `require` file.

Ngoài PSR-4, Composer hỗ trợ `classmap` (quét toàn bộ, nhanh nhất ở runtime) và `files` (luôn load, dùng cho helper functions).

**Lưu ý / bẫy thường gặp:** chạy ổn trên Windows/macOS (filesystem không phân biệt hoa thường) nhưng lỗi "Class not found" trên Linux production do sai chữ hoa.

## Các PSR quan trọng: PSR-1, PSR-12, PSR-3, PSR-7, PSR-11, PSR-15? [mid]
PSR (PHP Standards Recommendations) do **PHP-FIG** ban hành giúp các framework/library tương thích lẫn nhau.

| PSR | Nội dung |
|---|---|
| PSR-1 | Basic coding standard (tên class StudlyCaps, method camelCase) |
| PSR-12 / PER-CS | Coding style mở rộng (thay PSR-2): indent 4 spaces, vị trí ngoặc, `declare` |
| PSR-3 | `LoggerInterface` (Monolog) |
| PSR-4 | Autoloading |
| PSR-6 / PSR-16 | Caching interface (pool phức tạp / simple cache) |
| PSR-7 | HTTP message interfaces (Request, Response, Stream) — **immutable** |
| PSR-11 | Container interface (`get`, `has`) |
| PSR-14 | Event dispatcher |
| PSR-15 | HTTP server request handlers & middleware |
| PSR-17 / PSR-18 | HTTP factories / HTTP client |

```php
// PSR-7 immutable: mỗi with* trả về object mới
$response = $response->withStatus(201)->withHeader('X-Id', '1');
```

Công cụ thực thi coding style: **PHP-CS-Fixer**, **PHP_CodeSniffer**, **Laravel Pint**.

## PSR-7 tại sao thiết kế immutable? PSR-15 middleware hoạt động thế nào? [senior]
**PSR-7 immutability:** các method `withHeader()`, `withStatus()`... trả về **bản sao mới** thay vì sửa object hiện tại. Lý do:
- Tránh side effect khi request/response được truyền qua nhiều middleware.
- Dễ suy luận, an toàn khi chia sẻ, thuận tiện cho testing.
- Đổi lại: tốn thêm allocation; body (`StreamInterface`) vẫn là mutable stream.

**PSR-15** định nghĩa:

```php
interface MiddlewareInterface {
    public function process(
        ServerRequestInterface $request,
        RequestHandlerInterface $handler
    ): ResponseInterface;
}

final class AuthMiddleware implements MiddlewareInterface {
    public function process($request, $handler): ResponseInterface {
        if (!$request->hasHeader('Authorization')) {
            return new Response(401);
        }
        return $handler->handle($request->withAttribute('user', '...'));
    }
}
```

Mô hình "onion": mỗi middleware có thể xử lý trước, gọi `$handler->handle()` để chuyển tiếp, rồi xử lý response trả về. Slim, Mezzio dùng PSR-15 trực tiếp; Laravel có middleware riêng (không theo PSR-7) nhưng cùng ý tưởng pipeline.

**Lưu ý / bẫy thường gặp:** quên gán lại kết quả `$request = $request->withAttribute(...)` thì thay đổi bị mất.

# Bảo mật (Security)

## Phòng chống SQL Injection trong PHP như thế nào? [junior]
SQL Injection xảy ra khi input của người dùng được nối trực tiếp vào câu SQL.

**Giải pháp chính: Prepared statements** với PDO hoặc MySQLi — dữ liệu và câu lệnh được gửi tách biệt nên input không bao giờ được hiểu là SQL.

```php
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
$stmt->execute(['email' => $_POST['email']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
```

Các điểm bổ sung:
- Placeholder **không dùng được cho tên cột/bảng, ORDER BY** → dùng **whitelist**.
- ORM (Eloquent, Doctrine) dùng binding mặc định, nhưng `DB::raw()`, `whereRaw()` vẫn có thể bị inject nếu nối chuỗi.
- Nguyên tắc least privilege cho DB user.

**Lưu ý / bẫy thường gặp:** `addslashes()`/`mysql_real_escape_string` không phải giải pháp đầy đủ (lỗi charset như GBK). Khi `EMULATE_PREPARES=true`, PDO tự escape phía client — nên tắt và đặt `charset=utf8mb4` trong DSN.

## XSS là gì và phòng chống trong PHP thế nào? [junior]
**XSS (Cross-Site Scripting)**: kẻ tấn công chèn JavaScript vào trang, chạy trong trình duyệt nạn nhân (đánh cắp cookie, thực hiện hành động thay người dùng).

Các loại: **Stored** (lưu trong DB), **Reflected** (qua URL/param), **DOM-based** (xử lý phía JS).

Phòng chống:
- **Escape output theo ngữ cảnh**: HTML body, attribute, JavaScript, URL, CSS có cách escape khác nhau.

```php
echo htmlspecialchars($input, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
echo '<a href="?q=' . urlencode($q) . '">';
```

- Template engine tự escape: Blade `{{ $var }}` (còn `{!! $var !!}` là raw — nguy hiểm), Twig autoescape.
- Cho phép HTML từ người dùng → dùng **HTML Purifier**.
- **Content-Security-Policy** header, cookie `HttpOnly`, `SameSite`.
- Validate input, nhưng **escape output** mới là phòng tuyến chính.

**Lưu ý / bẫy thường gặp:** `strip_tags()` không an toàn cho attribute; `htmlspecialchars` không đủ khi chèn vào `<script>` hoặc `href="javascript:..."` — dùng `json_encode` với flag `JSON_HEX_TAG` cho JS và validate scheme cho URL.

## CSRF là gì? Cách phòng chống? [mid]
**CSRF (Cross-Site Request Forgery)**: trang độc hại khiến trình duyệt của người dùng đã đăng nhập gửi request tới site của bạn (trình duyệt tự đính kèm cookie session) → thực hiện hành động ngoài ý muốn (chuyển tiền, đổi email).

Phòng chống:
- **CSRF token** (synchronizer token): token ngẫu nhiên lưu trong session, gửi kèm form/header, server so sánh.

```php
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
// form: <input type="hidden" name="_token" value="...">
if (!hash_equals($_SESSION['csrf'], $_POST['_token'] ?? '')) {
    http_response_code(419); exit;
}
```

- Cookie **`SameSite=Lax`/`Strict`**.
- Không dùng `GET` cho hành động thay đổi trạng thái.
- Kiểm tra `Origin`/`Referer` header.
- Laravel: middleware `VerifyCsrfToken`, directive `@csrf`, header `X-CSRF-TOKEN`/`X-XSRF-TOKEN`.

**Lưu ý / bẫy thường gặp:** API dùng token trong header `Authorization` (Bearer) thì không bị CSRF, nhưng API dùng cookie-based auth (SPA với Sanctum) vẫn cần CSRF.

## Lưu trữ mật khẩu đúng cách trong PHP? [junior]
Không bao giờ lưu plain text hay dùng `md5`/`sha1` (quá nhanh, dễ brute-force bằng GPU/rainbow table). Dùng API **`password_hash`** với thuật toán chậm, có salt tự động.

```php
$hash = password_hash($password, PASSWORD_DEFAULT);       // bcrypt hiện tại
$hash = password_hash($password, PASSWORD_ARGON2ID);      // nếu được hỗ trợ

if (password_verify($input, $hash)) {
    if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
        $hash = password_hash($input, PASSWORD_DEFAULT);  // nâng cấp hash
    }
}
```

Điểm chính:
- Salt được sinh ngẫu nhiên và nhúng sẵn trong chuỗi hash.
- `password_verify` so sánh constant-time, chống timing attack.
- Cột DB nên là `VARCHAR(255)` vì độ dài hash có thể thay đổi.
- Điều chỉnh `cost` (bcrypt) để mỗi lần hash mất ~100ms.

**Lưu ý / bẫy thường gặp:** bcrypt chỉ dùng **72 byte đầu** của mật khẩu (PHP 8.4 tăng cost mặc định lên 12). Kết hợp rate limiting đăng nhập và 2FA.

## Session fixation và session hijacking là gì? Cách phòng chống? [mid]
- **Session fixation**: kẻ tấn công ép nạn nhân dùng một session ID đã biết trước (qua URL, cookie), sau khi nạn nhân đăng nhập thì kẻ tấn công dùng chính ID đó.
- **Session hijacking**: đánh cắp session ID (XSS, sniffing qua HTTP, log) để mạo danh.

Phòng chống:

```php
ini_set('session.use_strict_mode', '1');     // từ chối session ID chưa khởi tạo
ini_set('session.use_only_cookies', '1');    // không nhận ID qua URL
session_set_cookie_params([
    'secure' => true, 'httponly' => true, 'samesite' => 'Lax',
]);
session_start();

// Sau khi đăng nhập thành công hoặc nâng quyền:
session_regenerate_id(true);
```

- Luôn dùng **HTTPS** + HSTS.
- Thời gian sống session hợp lý, idle timeout, logout hủy session (`session_destroy`).
- Laravel tự gọi `$request->session()->regenerate()` khi login.

**Lưu ý / bẫy thường gặp:** session file mặc định gây **session locking** — request đồng thời cùng session bị xếp hàng; gọi `session_write_close()` sớm hoặc dùng Redis.

## Những lỗ hổng khác cần lưu ý: file upload, deserialization, command injection? [senior]
**File upload:**
- Không tin `$_FILES['type']` (do client gửi); kiểm tra MIME thật bằng `finfo`, whitelist extension.
- Đổi tên file ngẫu nhiên, lưu **ngoài web root** hoặc tắt thực thi PHP trong thư mục upload.
- Giới hạn kích thước (`upload_max_filesize`, `post_max_size`).

**Insecure deserialization:** `unserialize()` dữ liệu người dùng có thể kích hoạt magic methods (`__wakeup`, `__destruct`) → **POP chain**, RCE. Dùng `json_decode` hoặc `unserialize($d, ['allowed_classes' => false])`. Cẩn thận wrapper `phar://`.

**Command injection:**

```php
$file = escapeshellarg($input);
exec("convert $file out.png");
// Tốt hơn: Symfony Process với mảng tham số
new Process(['convert', $input, 'out.png']);
```

**Khác:**
- **LFI/RFI**: `include $_GET['page']` → whitelist; tắt `allow_url_include`.
- **SSRF** khi fetch URL do người dùng cung cấp.
- **Mass assignment** trong Eloquent → `$fillable`.
- Tắt `display_errors` ở production, `expose_php=Off`.
- Sinh token bằng `random_bytes()`/`random_int()`, không dùng `rand()`/`uniqid()`.

# Laravel

## Laravel request lifecycle diễn ra như thế nào? [mid]
1. Request vào `public/index.php` → load Composer autoloader và bootstrap `Application` (`bootstrap/app.php`).
2. **HTTP Kernel** chạy các **bootstrappers**: load env, config, đăng ký error handling, facades, **register và boot Service Providers**.
3. Request đi qua **global middleware** (TrimStrings, maintenance mode, CORS...).
4. **Router** tìm route khớp → chạy **route/group middleware** (auth, throttle, `web`/`api`).
5. Gọi **controller/closure**; dependencies được resolve qua **Service Container** (route model binding, Form Request validation).
6. Kết quả được chuyển thành **Response**, đi ngược qua middleware.
7. Response được gửi cho client, sau đó chạy **terminable middleware** (`terminate()`).

Service Provider có hai pha: `register()` (chỉ bind vào container) và `boot()` (sau khi mọi provider đã register — dùng được service khác).

**Lưu ý / bẫy thường gặp:** không resolve service khác trong `register()`. Với **Octane**, app chỉ bootstrap một lần và sống qua nhiều request → cẩn thận singleton giữ state của request (user, request object).

## Service Container trong Laravel là gì? bind vs singleton vs scoped? [mid]
**Service Container** là IoC container quản lý việc tạo object và **Dependency Injection**. Nó có thể **auto-wire** class qua Reflection mà không cần cấu hình nếu dependency là class cụ thể.

```php
// AppServiceProvider::register()
$this->app->bind(PaymentGateway::class, StripeGateway::class);     // mới mỗi lần resolve
$this->app->singleton(Cache::class, fn ($app) => new RedisCache()); // một instance
$this->app->scoped(TenantContext::class);                           // 1 instance / request (Octane-safe)

// Contextual binding
$this->app->when(PhotoController::class)
    ->needs(Filesystem::class)
    ->give(fn () => Storage::disk('s3'));
```

Resolve: type-hint trong constructor/method, `app(Foo::class)`, `resolve()`, `$this->app->make()`.

| | bind | singleton | scoped |
|---|---|---|---|
| Số instance | Mới mỗi lần | Một cho toàn app lifecycle | Một mỗi request/job |

**Lưu ý / bẫy thường gặp:** binding interface là bắt buộc để container biết implementation; lỗi "Target [Interface] is not instantiable" do quên bind.

## Facade trong Laravel hoạt động như thế nào? Có phải static không? [mid]
Facade cung cấp cú pháp "static" (`Cache::get('k')`) nhưng thực chất **không phải static method**:

1. Class facade extends `Illuminate\Support\Facades\Facade`, định nghĩa `getFacadeAccessor()` trả về key trong container.
2. Gọi `Cache::get()` → không tồn tại static method → kích hoạt **`__callStatic`**.
3. `__callStatic` resolve instance thật từ **Service Container** (cache lại) và gọi method trên instance đó.

```php
class Cache extends Facade {
    protected static function getFacadeAccessor() { return 'cache'; }
}

// Test dễ dàng:
Cache::shouldReceive('get')->with('key')->andReturn('value');
Mail::fake();
```

So sánh:
- **Facade**: ngắn gọn, test được bằng `shouldReceive`/`fake()`.
- **Dependency Injection**: dependency hiển thị rõ trong constructor, phù hợp domain logic, không phụ thuộc framework.
- **Real-time facades**: `use Facades\App\Services\Foo;`.

**Lưu ý / bẫy thường gặp:** dùng quá nhiều facade trong một class che giấu "class quá nhiều trách nhiệm" (dependency ẩn).

## Middleware trong Laravel là gì? Cách tạo và đăng ký? [junior]
Middleware là lớp lọc request/response theo mô hình pipeline: xác thực, phân quyền, CORS, rate limit, logging, set locale...

```php
class EnsureUserIsAdmin {
    public function handle(Request $request, Closure $next, string $role = 'admin'): Response {
        if (! $request->user()?->hasRole($role)) {
            abort(403);
        }
        $response = $next($request);       // before ở trên, after ở dưới
        $response->headers->set('X-Checked', '1');
        return $response;
    }

    public function terminate(Request $request, Response $response): void {
        // chạy sau khi response đã gửi
    }
}
```

Đăng ký (Laravel 11+ trong `bootstrap/app.php`, bản cũ trong `Http/Kernel.php`):
- **Global**: chạy với mọi request.
- **Group**: `web` (session, CSRF, cookies), `api` (throttle).
- **Alias/Route**: `Route::get(...)->middleware('role:editor')`.

Thứ tự middleware quan trọng (ví dụ `StartSession` phải trước `VerifyCsrfToken`).

**Lưu ý / bẫy thường gặp:** quên `return $next($request)` khiến chuỗi bị ngắt.

## Vấn đề N+1 query trong Eloquent là gì và cách khắc phục? [mid]
**N+1** xảy ra khi lấy N bản ghi (1 query), rồi trong vòng lặp truy cập relationship → mỗi bản ghi thêm 1 query.

```php
// N+1: 1 + N queries
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;
}

// Eager loading: 2 queries
$posts = Post::with(['author', 'comments' => fn ($q) => $q->latest()])->get();

// Đã có collection
$posts->load('tags');

// Chỉ cần số lượng
Post::withCount('comments')->get();
```

Phát hiện:
- **Laravel Debugbar**, Telescope, Clockwork.
- `Model::preventLazyLoading(! app()->isProduction());` → ném exception khi lazy load.

Tối ưu thêm:
- `select()` chỉ cột cần thiết (nhớ chọn cả khóa ngoại).
- Dữ liệu lớn: `chunk()`, `chunkById()`, `cursor()`, `lazy()`.
- `with()` lồng: `with('author.profile')`.

**Lưu ý / bẫy thường gặp:** eager load quá nhiều relationship không cần thiết cũng tốn bộ nhớ; `$post->comments()->count()` (query) khác `$post->comments->count()` (load toàn bộ collection).

## Queue trong Laravel hoạt động như thế nào? Xử lý job thất bại ra sao? [mid]
Queue cho phép đẩy tác vụ chậm (gửi email, xử lý ảnh, gọi API) ra **background** để response nhanh hơn.

Thành phần: **Job** (class implement `ShouldQueue`), **driver** (Redis, database, SQS, Beanstalkd), **worker** (`php artisan queue:work`).

```php
class SendInvoice implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [10, 60, 300];
    public int $timeout = 120;

    public function __construct(public Order $order) {}

    public function handle(Mailer $mailer): void { /* ... */ }

    public function failed(Throwable $e): void { /* alert */ }
}

SendInvoice::dispatch($order)->onQueue('emails')->delay(now()->addMinutes(5));
```

- Job thất bại vượt `tries` → lưu vào bảng `failed_jobs`; `queue:retry`, `queue:flush`.
- `SerializesModels` chỉ lưu ID model, khi chạy sẽ query lại.
- **Horizon** để giám sát Redis queue; `Bus::chain()`, `Bus::batch()`.
- Worker là long-running process → **phải restart khi deploy** (`queue:restart`), dùng Supervisor.

**Lưu ý / bẫy thường gặp:** job nên **idempotent** (có thể chạy lại an toàn); dispatch trong transaction cần `afterCommit()` để tránh job chạy trước khi dữ liệu được commit.

## Events, Listeners và Observers trong Laravel khác nhau thế nào? [mid]
**Events & Listeners**: triển khai Observer pattern để tách rời (decouple) logic. Một event có thể có nhiều listener; listener có thể chạy queue (`ShouldQueue`).

```php
class OrderPlaced { public function __construct(public Order $order) {} }

class SendOrderConfirmation implements ShouldQueue {
    public function handle(OrderPlaced $event): void { /* gửi mail */ }
}

OrderPlaced::dispatch($order);   // hoặc event(new OrderPlaced($order))
```

Laravel 11 tự động discover listener theo type-hint của `handle()`.

**Model Observers**: gom các hook vòng đời Eloquent (`creating`, `created`, `updating`, `saved`, `deleted`, `restored`...) vào một class.

```php
#[ObservedBy(UserObserver::class)]
class User extends Model {}
```

| | Event/Listener | Observer |
|---|---|---|
| Phạm vi | Bất kỳ sự kiện domain nào | Vòng đời Eloquent model |
| Kích hoạt | Dispatch thủ công | Tự động khi save/delete |

**Lưu ý / bẫy thường gặp:** model events **không chạy** với mass update/delete (`User::where(...)->update()`). Lạm dụng observer khiến luồng xử lý khó theo dõi. Dùng `ShouldDispatchAfterCommit` để event chỉ phát khi transaction commit.

## Eloquent vs Query Builder vs Raw SQL? Các tính năng Eloquent nâng cao? [senior]
| | Eloquent | Query Builder | Raw SQL |
|---|---|---|---|
| Trả về | Model objects | `stdClass` | `stdClass`/array |
| Tốc độ | Chậm nhất (hydrate model, events) | Nhanh hơn | Nhanh nhất |
| Tính năng | Relationships, casts, events, scopes | Fluent API, binding | Toàn quyền |

Tính năng nâng cao nên biết:
- **Local/Global scopes**: `scopeActive()`, `SoftDeletes`.
- **Accessors/Mutators** và **casts** (custom cast, enum cast, `encrypted`).
- **Subquery select/order**: `addSelect(['last_login' => Login::select('created_at')->whereColumn(...)->latest()->limit(1)])`.
- `upsert()`, `insertOrIgnore()`, `updateOrCreate()`.
- **Polymorphic relations**, `hasManyThrough`, `withWhereHas`.
- `DB::transaction(fn () => ..., attempts: 3)`, `lockForUpdate()`, `sharedLock()`.

```php
DB::transaction(function () use ($id, $qty) {
    $p = Product::whereKey($id)->lockForUpdate()->firstOrFail();
    if ($p->stock < $qty) throw new OutOfStockException();
    $p->decrement('stock', $qty);
});
```

**Lưu ý / bẫy thường gặp:** báo cáo/batch lớn nên dùng Query Builder hoặc raw để tránh chi phí hydrate hàng chục nghìn model.

# Performance & Testing

## Làm thế nào để tối ưu hiệu năng ứng dụng PHP/Laravel? [senior]
Tiếp cận theo thứ tự: **đo trước, tối ưu sau** (profile bằng Blackfire, Xdebug profiler, Tideways, Telescope, APM).

**Tầng runtime:**
- Bật **OPcache** (`validate_timestamps=0`), cân nhắc preloading; PHP version mới nhất.
- Tuning PHP-FPM; cân nhắc **Octane** (Swoole/RoadRunner/FrankenPHP) để bỏ bootstrap mỗi request.

**Tầng framework:**

```bash
composer install --no-dev --classmap-authoritative
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

**Tầng database (thường là bottleneck lớn nhất):**
- Loại bỏ N+1, thêm **index** đúng (xem `EXPLAIN`), chỉ select cột cần.
- Pagination bằng cursor thay vì `OFFSET` lớn.
- Read replicas, connection pooling.

**Caching:** Redis cho cache query/kết quả, `Cache::remember()`, HTTP cache (ETag), CDN cho static assets.

**Kiến trúc:** đưa tác vụ chậm vào **queue**, rate limit, xử lý batch, dùng generator/`lazy()` cho dữ liệu lớn.

**Lưu ý / bẫy thường gặp:** micro-optimization (`'` vs `"`, `++$i`) gần như vô nghĩa so với tối ưu query và I/O. Cẩn thận **cache stampede** — dùng lock (`Cache::lock`) hoặc `flexible()` (stale-while-revalidate).

## Unit test, Integration test, Feature test khác nhau thế nào? Viết test với PHPUnit? [junior]
- **Unit test**: kiểm tra một đơn vị nhỏ (class/method) **cô lập**, mock dependency. Nhanh.
- **Integration test**: kiểm tra nhiều thành phần phối hợp (service + DB thật/sqlite).
- **Feature/E2E test**: kiểm tra luồng từ HTTP request tới response (Laravel `$this->get()`), hoặc qua trình duyệt (Dusk, Playwright).

```php
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;

final class PriceCalculatorTest extends TestCase {
    #[DataProvider('discountProvider')]
    public function test_apply_discount(int $price, int $pct, int $expected): void {
        $calc = new PriceCalculator();
        $this->assertSame($expected, $calc->apply($price, $pct));
    }

    public static function discountProvider(): array {
        return [[100, 10, 90], [200, 50, 100], [100, 0, 100]];
    }

    public function test_negative_discount_throws(): void {
        $this->expectException(InvalidArgumentException::class);
        (new PriceCalculator())->apply(100, -5);
    }
}
```

Cấu trúc **Arrange - Act - Assert**. Pest là framework test dựa trên PHPUnit với cú pháp gọn hơn.

**Lưu ý / bẫy thường gặp:** `assertEquals` so sánh lỏng, `assertSame` so sánh strict — ưu tiên `assertSame`.

## Mock, Stub, Fake, Spy khác nhau thế nào? Mock trong PHPUnit và Laravel? [mid]
| Test double | Mục đích |
|---|---|
| **Dummy** | Chỉ để điền tham số, không dùng |
| **Stub** | Trả về giá trị định sẵn, không kiểm tra cách gọi |
| **Mock** | Có **kỳ vọng** về việc được gọi (số lần, tham số) |
| **Spy** | Ghi lại lời gọi, kiểm tra **sau** khi chạy |
| **Fake** | Implementation đơn giản hoạt động thật (in-memory repo) |

```php
// PHPUnit
$gateway = $this->createMock(PaymentGateway::class);
$gateway->expects($this->once())
        ->method('charge')
        ->with(1000)
        ->willReturn(true);

// Laravel fakes
Mail::fake();
Queue::fake();
Http::fake(['api.stripe.com/*' => Http::response(['ok' => true], 200)]);

$this->post('/orders', $data)->assertCreated();

Mail::assertSent(OrderShipped::class);
Queue::assertPushed(SendInvoice::class);
```

Laravel còn có `RefreshDatabase`, model factories, `actingAs($user)`, `assertDatabaseHas()`.

**Lưu ý / bẫy thường gặp:** không thể mock class `final` bằng PHPUnit thuần (cần interface hoặc thư viện như `dg/bypass-finals`) — đây là lý do nên phụ thuộc vào interface. Mock quá nhiều khiến test gắn chặt vào implementation.

## Static analysis và code quality tools trong PHP? [mid]
PHP là ngôn ngữ dynamic, nên **static analysis** phát hiện lỗi kiểu, method không tồn tại, null access trước khi chạy.

- **PHPStan** / **Larastan** (cho Laravel): level 0-10 (càng cao càng chặt); hỗ trợ generics qua PHPDoc (`@template`, `@param list<User>`).
- **Psalm**: tương tự, mạnh về taint analysis (phát hiện luồng dữ liệu bẩn → SQL/XSS).
- **Rector**: refactor/upgrade code tự động (ví dụ nâng PHP 7.4 → 8.3).
- **PHP-CS-Fixer / Laravel Pint / PHPCS**: coding style PSR-12/PER.
- **Infection**: mutation testing đánh giá chất lượng test.
- Code coverage: Xdebug hoặc PCOV.

```bash
vendor/bin/phpstan analyse src --level=8
vendor/bin/pint --test
vendor/bin/phpunit --coverage-html coverage
```

```php
/** @return Collection<int, User> */
public function activeUsers(): Collection { /* ... */ }
```

Tích hợp vào **CI** (GitHub Actions, GitLab CI) và dùng **baseline** để áp dụng dần cho codebase cũ.
