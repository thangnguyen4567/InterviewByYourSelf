---
topic: angular
---

## Thứ tự gọi đúng của các lifecycle hook trong lần render đầu tiên của một component có `@Input` được bind là gì? [junior]
- [ ] `ngOnInit` → `ngOnChanges` → `ngAfterViewInit` → `ngAfterContentInit`
- [x] `ngOnChanges` → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterViewInit`
- [ ] `ngOnChanges` → `ngDoCheck` → `ngOnInit` → `ngAfterViewInit` → `ngAfterContentInit`
- [ ] `ngOnInit` → `ngDoCheck` → `ngOnChanges` → `ngAfterContentInit` → `ngAfterViewInit`
> `ngOnChanges` chạy trước `ngOnInit` khi có input được bind, sau đó `ngDoCheck`, rồi content (projected) được khởi tạo trước view của chính component. Hook `...Checked` xen sau mỗi `...Init` tương ứng.

## Cú pháp nào là two-way binding ("banana in a box") trong Angular? [junior]
- [ ] `{{ name }}`
- [ ] `[ngModel]="name"`
- [ ] `(ngModel)="name"`
- [x] `[(ngModel)]="name"`
> `[( )]` kết hợp property binding `[ngModel]` và event binding `(ngModelChange)`. Chỉ `[ngModel]` là one-way từ component xuống view.

## Muốn vô hiệu hóa button theo biến `isSaving` trong component, cách viết đúng là gì? [junior]
- [x] `<button [disabled]="isSaving">Lưu</button>`
- [ ] `<button disabled="isSaving">Lưu</button>`
- [ ] `<button (disabled)="isSaving">Lưu</button>`
- [ ] `<button [disabled]="'isSaving'">Lưu</button>`
> Property binding `[disabled]` đánh giá biểu thức `isSaving`. Viết `disabled="isSaving"` chỉ gán chuỗi tĩnh nên button luôn bị disable; `'isSaving'` trong ngoặc cũng là chuỗi literal (truthy).

## Component con muốn báo cho cha biết người dùng đã bấm "Xóa" (kiểu decorator truyền thống). Cách khai báo đúng? [junior]
- [ ] `@Input() deleted = new EventEmitter<number>();`
- [ ] `@ViewChild() deleted = new EventEmitter<number>();`
- [x] `@Output() deleted = new EventEmitter<number>();` và gọi `this.deleted.emit(id)`
- [ ] `@Output() deleted: number;` và gán `this.deleted = id`
> `@Output` kết hợp `EventEmitter` phát sự kiện lên cha, cha lắng nghe bằng `(deleted)="onDelete($event)"`. `@Input` chỉ nhận dữ liệu từ cha xuống.

## `@Injectable({ providedIn: 'root' })` có ý nghĩa gì? [junior]
- [ ] Service được tạo mới cho mỗi component inject nó
- [x] Service là một instance dùng chung trong root injector của ứng dụng và có thể bị tree-shake nếu không được inject ở đâu
- [ ] Service chỉ dùng được trong `AppComponent`
- [ ] Service bắt buộc phải khai báo thêm trong mảng `providers` của `AppModule`
> `providedIn: 'root'` đăng ký service ở root injector (singleton toàn app) và cho phép tree-shaking. Không cần khai báo thêm trong `providers`.

## Pure pipe (mặc định) được Angular thực thi lại khi nào? [junior]
- [ ] Mỗi lần change detection chạy
- [ ] Chỉ một lần duy nhất khi component khởi tạo
- [ ] Mỗi khi bất kỳ thuộc tính nào của object đầu vào thay đổi, kể cả mutate bên trong
- [x] Khi giá trị primitive hoặc reference của tham số đầu vào thay đổi
> Pure pipe chỉ chạy lại khi phát hiện thay đổi "thuần" (primitive hoặc reference mới). Mutate object/array (ví dụ `push`) không làm pure pipe chạy lại; chạy mỗi chu kỳ là đặc điểm của impure pipe.

## Lợi ích chính của `async` pipe (`{{ user$ | async }}`) là gì? [junior]
- [ ] Biến Observable thành Promise để chạy nhanh hơn
- [ ] Bắt buộc phải dùng để HttpClient gửi request
- [x] Tự subscribe, lấy giá trị mới nhất, tự unsubscribe khi component bị destroy và đánh dấu view cần check (hợp với OnPush)
- [ ] Cache kết quả HTTP vĩnh viễn giữa các component
> `async` pipe quản lý vòng đời subscription nên tránh memory leak, đồng thời gọi `markForCheck` khi có giá trị mới. Nó không cache hay chia sẻ kết quả giữa các nơi dùng.

## Cấu hình route nào lazy load một standalone component? [junior]
- [ ] `{ path: 'admin', component: AdminComponent }`
- [x] `{ path: 'admin', loadComponent: () => import('./admin.component').then(m => m.AdminComponent) }`
- [ ] `{ path: 'admin', redirectTo: './admin.component' }`
- [ ] `{ path: 'admin', children: [AdminComponent] }`
> `loadComponent` với dynamic `import()` tách code thành chunk riêng, chỉ tải khi route được kích hoạt. `component:` import tĩnh nên nằm trong bundle chính; `loadChildren` dùng cho một tập route con.

## Đặc điểm nào thuộc về Reactive Forms (so với Template-driven Forms)? [junior]
- [ ] Model form được tạo ngầm từ các directive `ngModel` trong template
- [ ] Dữ liệu luôn bất đồng bộ và khó unit test
- [ ] Không hỗ trợ validator tùy chỉnh
- [x] Model form (`FormGroup`, `FormControl`) được định nghĩa tường minh trong class, đồng bộ và dễ test
> Reactive Forms khai báo cấu trúc form trong TypeScript, thao tác đồng bộ và có `valueChanges` Observable. Tạo model ngầm từ `ngModel` là cách của Template-driven.

## Phát biểu nào đúng về standalone component trong Angular hiện đại? [junior]
- [x] Component tự khai báo dependency qua mảng `imports`, không cần thuộc NgModule; từ Angular 19 `standalone: true` là mặc định
- [ ] Standalone component không thể dùng Dependency Injection
- [ ] Standalone component không thể được lazy load
- [ ] Standalone component bắt buộc phải khai báo trong `declarations` của `AppModule`
> Standalone component import trực tiếp các component/directive/pipe nó dùng. Chúng vẫn dùng DI bình thường và lazy load dễ hơn bằng `loadComponent`; khai báo trong `declarations` sẽ báo lỗi.

## Khác biệt nào giữa Observable và Promise là đúng? [junior]
- [ ] Promise có thể phát nhiều giá trị, Observable chỉ phát một
- [ ] Cả hai đều eager, chạy ngay khi được tạo
- [x] Observable là lazy (chỉ chạy khi subscribe), có thể phát nhiều giá trị và hủy được bằng unsubscribe; Promise eager, chỉ resolve một giá trị
- [ ] Observable không thể dùng với HTTP
> Observable cold chỉ thực thi khi có subscriber, hỗ trợ stream nhiều giá trị và operator. Promise bắt đầu thực thi ngay khi tạo và không có cơ chế hủy chuẩn.

## AOT (Ahead-of-Time) compilation, mặc định từ Angular 9 (Ivy), mang lại lợi ích gì? [junior]
- [ ] Cho phép sửa template trực tiếp trên production mà không cần build lại
- [ ] Biên dịch TypeScript thành C++ để chạy nhanh hơn
- [ ] Bỏ hoàn toàn nhu cầu dùng change detection
- [x] Template được biên dịch thành JavaScript lúc build: render nhanh hơn, bundle nhỏ hơn (không cần compiler ở runtime) và lỗi template được phát hiện sớm
> AOT chuyển công việc biên dịch template từ trình duyệt sang build time. JIT mới là biên dịch template trên trình duyệt lúc runtime.

## Component con dùng `ChangeDetectionStrategy.OnPush`. Cha chạy đoạn code sau khi bấm nút, view của con có cập nhật không? [mid]
```typescript
// Parent template: <app-list [items]="items"></app-list>
addItem() {
  this.items.push({ id: 3, name: 'C' });
}
```
- [ ] Có, vì OnPush so sánh sâu (deep compare) mảng `items`
- [x] Không, vì reference của `items` không đổi nên OnPush không đánh dấu con cần check; cần gán mảng mới `this.items = [...this.items, item]`
- [ ] Có, vì sự kiện click luôn check toàn bộ cây component
- [ ] Không, và cũng không cách nào cập nhật được ngoài việc bỏ OnPush
> OnPush chỉ check lại khi input đổi reference, có event từ chính component/con của nó, async pipe/signal trong template phát giá trị, hoặc gọi `markForCheck`. Event ở cha không làm con OnPush được check nếu input giữ nguyên reference.

## Ô tìm kiếm gọi API theo từng phím gõ, chỉ quan tâm kết quả của từ khóa mới nhất. Operator phù hợp nhất? [mid]
- [x] `switchMap`
- [ ] `mergeMap`
- [ ] `concatMap`
- [ ] `exhaustMap`
> `switchMap` hủy request cũ khi có giá trị mới, tránh kết quả cũ về sau ghi đè kết quả mới. `mergeMap` chạy song song nên response có thể về sai thứ tự.

## Nút "Đăng nhập" bị người dùng bấm liên tục; bạn muốn bỏ qua mọi lần bấm trong lúc request đầu tiên chưa xong. Operator nào? [mid]
- [ ] `switchMap`
- [ ] `concatMap`
- [x] `exhaustMap`
- [ ] `mergeMap`
> `exhaustMap` bỏ qua giá trị nguồn mới khi inner Observable hiện tại còn chạy. `concatMap` thì xếp hàng và vẫn gửi đủ các request sau đó.

## Cần upload lần lượt nhiều file, file sau chỉ bắt đầu khi file trước hoàn tất và giữ đúng thứ tự. Operator nào? [mid]
- [ ] `mergeMap`
- [x] `concatMap`
- [ ] `switchMap`
- [ ] `exhaustMap`
> `concatMap` subscribe inner Observable tuần tự, bảo toàn thứ tự và không bỏ giá trị nào. `mergeMap` chạy song song; `switchMap`/`exhaustMap` có thể hủy hoặc bỏ qua upload.

## Phát biểu nào đúng về `BehaviorSubject`? [mid]
- [ ] Không cần giá trị khởi tạo và chỉ phát giá trị mới cho subscriber đến sau
- [x] Bắt buộc có giá trị khởi tạo, luôn giữ giá trị hiện tại (`getValue()`) và phát ngay giá trị đó cho subscriber mới
- [ ] Chỉ phát giá trị cuối cùng khi `complete()` được gọi
- [ ] Phát lại toàn bộ lịch sử giá trị cho mọi subscriber mới
> Đó là đặc điểm của BehaviorSubject, phù hợp để giữ state. Phát giá trị cuối khi complete là AsyncSubject; phát lại lịch sử theo buffer là ReplaySubject.

## Phát biểu nào đúng về `computed()` trong Angular Signals? [mid]
```typescript
const price = signal(100);
const qty = signal(2);
const total = computed(() => price() * qty());
```
- [ ] Có thể gọi `total.set(500)` để ghi đè giá trị
- [ ] `total` tính lại ngay lập tức mỗi lần `price` hoặc `qty` thay đổi, kể cả khi không ai đọc
- [ ] Phải khai báo thủ công mảng dependency `[price, qty]`
- [x] `total` là read-only, lazy và memoized: chỉ tính lại khi được đọc sau khi dependency thay đổi
> `computed` trả về `Signal` chỉ đọc, tự track dependency đã đọc trong hàm và cache kết quả. Nó không có `set`/`update`; tính lại theo kiểu lazy khi có người đọc.

## Component khai báo `providers: [CartService]` trong `@Component`, dù `CartService` đã có `providedIn: 'root'`. Kết quả là gì? [mid]
- [ ] Angular báo lỗi vì service được provide hai lần
- [ ] Component vẫn dùng instance của root injector
- [x] Mỗi instance của component nhận một `CartService` mới, dùng chung cho các component con bên trong nó; nơi khác vẫn dùng instance root
- [ ] Tất cả component trong ứng dụng chuyển sang dùng instance mới này
> Provider ở cấp component tạo element injector riêng, che (shadow) instance root cho cây con của nó. Đây là cách cô lập state theo từng widget.

## Đoạn code sau lỗi lúc runtime với thông báo `NG0203`. Nguyên nhân là gì? [mid]
```typescript
export class ChatComponent {
  ngOnInit() {
    this.chat.messages$.pipe(takeUntilDestroyed()).subscribe(m => this.list.push(m));
  }
}
```
- [ ] `takeUntilDestroyed` chỉ dùng được với `HttpClient`
- [ ] Phải gọi `unsubscribe()` thủ công trước khi dùng `takeUntilDestroyed`
- [ ] `ngOnInit` không được phép subscribe Observable
- [x] `takeUntilDestroyed()` không tham số phải được gọi trong injection context (constructor/field initializer); trong `ngOnInit` phải truyền `DestroyRef` đã inject
> Không có tham số, nó dùng `inject(DestroyRef)` nên chỉ hợp lệ trong injection context. Cách sửa là chuyển vào constructor hoặc dùng `takeUntilDestroyed(this.destroyRef)`.

## Functional guard nào chuyển người dùng chưa đăng nhập về trang login một cách đúng chuẩn? [mid]
- [ ] `export const authGuard: CanActivateFn = () => { window.location.href = '/login'; return true; };`
- [x] `export const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn() || inject(Router).createUrlTree(['/login']);`
- [ ] `export const authGuard: CanActivateFn = () => { throw new Error('/login'); };`
- [ ] `export const authGuard = new CanActivate(() => '/login');`
> Guard có thể trả về `boolean`, `UrlTree` (hoặc `RedirectCommand`), hay Observable/Promise của chúng; trả `UrlTree` khiến router hủy điều hướng hiện tại và redirect. `inject()` dùng được vì guard chạy trong injection context.

## Interceptor functional sau muốn gắn token. Dòng nào đúng? [mid]
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  // ???
};
```
- [ ] `req.headers.set('Authorization', 'Bearer ' + token); return next(req);`
- [ ] `return next(req).pipe(map(r => r.headers.set('Authorization', token)));`
- [x] `return next(req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }));`
- [ ] `req.setHeader('Authorization', token); return next.handle();`
> `HttpRequest` và `HttpHeaders` là immutable: `headers.set` trả về object mới chứ không sửa request, nên phải `clone`. Interceptor được đăng ký qua `provideHttpClient(withInterceptors([authInterceptor]))`.

## Phát biểu nào đúng về `track` trong `@for`? [mid]
```html
@for (user of users(); track user.id) {
  <app-user-card [user]="user" />
} @empty {
  <p>Không có dữ liệu</p>
}
```
- [ ] `track` là tùy chọn, bỏ đi Angular tự dùng `$index`
- [x] `track` là bắt buộc; nó giúp Angular nhận diện item để tái sử dụng DOM khi danh sách đổi, nên dùng khóa ổn định như `id`
- [ ] `track user.id` khiến Angular sắp xếp danh sách theo `id`
- [ ] `@empty` chạy khi `track` trả về `undefined`
> Thiếu `track` sẽ lỗi biên dịch. Track theo khóa ổn định giúp chỉ thêm/xóa/di chuyển DOM cần thiết; `track $index` hoặc track theo object reference mới tạo có thể gây render lại toàn bộ.

## Service dùng `private events = new Subject<string>()` làm event bus. Component A gọi `events.next('saved')` trước khi component B subscribe. B nhận được gì? [mid]
- [ ] B nhận `'saved'` ngay khi subscribe
- [x] B không nhận gì, vì `Subject` thường không lưu giá trị cũ; chỉ subscriber đã có mặt lúc `next` mới nhận
- [ ] B nhận `'saved'` khi Subject `complete()`
- [ ] Angular ném lỗi vì chưa có subscriber khi gọi `next`
> `Subject` là hot và không có buffer. Nếu cần subscriber đến sau nhận giá trị gần nhất, dùng `BehaviorSubject` (có giá trị khởi tạo) hoặc `ReplaySubject(1)`.

## Khi nào `ExpressionChangedAfterItHasBeenCheckedError` xuất hiện? [senior]
- [ ] Chỉ ở production build khi một binding trả về `undefined`
- [ ] Khi hai component cùng inject một service
- [x] Ở dev mode, khi một binding thay đổi giá trị giữa lượt change detection chính và lượt kiểm tra bổ sung, ví dụ child sửa state mà cha đang bind trong `ngAfterViewInit`
- [ ] Khi gọi `markForCheck()` trong component OnPush
> Dev mode chạy thêm một lượt check để bảo đảm luồng dữ liệu một chiều; production không chạy lượt này nên không có lỗi nhưng UI có thể hiển thị giá trị cũ. Cách sửa là thiết kế lại luồng dữ liệu hoặc dùng signal, không phải bọc `setTimeout` bừa bãi.

## Ứng dụng zoneless (`provideZonelessChangeDetection()`), component Default strategy chạy đoạn sau. Điều gì xảy ra trên UI? [senior]
```typescript
count = 0; // template: {{ count }}
ngOnInit() {
  setTimeout(() => this.count++, 1000);
}
```
- [ ] UI hiển thị 1 sau một giây như khi có zone.js
- [x] UI vẫn hiển thị 0 vì không có zone.js nên `setTimeout` không kích hoạt change detection; nên dùng `count = signal(0)` hoặc gọi `markForCheck()`
- [ ] Angular ném lỗi vì `setTimeout` bị cấm ở chế độ zoneless
- [ ] UI hiển thị 1 vì Default strategy luôn check sau mỗi macrotask
> Zoneless chỉ lên lịch change detection khi có thông báo: signal được đọc trong template thay đổi, `markForCheck`, `async` pipe, event listener trong template, `setInput`... Thay đổi field thường trong callback bất đồng bộ không được phát hiện.

## Trong một click handler, code gọi `count.set(1); count.set(2); count.set(3);`. Một `effect(() => console.log(count()))` đã tồn tại sẽ log thế nào cho lần click đó? [senior]
- [ ] Log 1, 2, 3 đồng bộ ngay sau mỗi lần `set`
- [ ] Không log gì vì effect chỉ chạy một lần khi tạo
- [ ] Log 1 vì effect chỉ phản ứng với thay đổi đầu tiên
- [x] Log một lần với giá trị 3, vì effect được lên lịch chạy bất đồng bộ (trong change detection) sau khi các thay đổi đồng bộ hoàn tất
> Signal set chỉ đánh dấu effect "dirty"; effect chạy sau đó và đọc giá trị mới nhất. Vì vậy không nên dựa vào effect để quan sát từng giá trị trung gian, việc đó hợp với RxJS hơn.

## Với `const view = computed(() => showA() ? a() : b());`, khi `showA()` đang là `false`, điều gì xảy ra nếu `a.set(10)`? [senior]
- [ ] `view` tính lại vì Angular track tĩnh mọi signal xuất hiện trong hàm
- [x] `view` không bị đánh dấu dirty vì ở lần chạy gần nhất `a()` không được đọc; dependency được track động theo lần thực thi
- [ ] Angular ném lỗi vì computed có nhánh điều kiện
- [ ] `view` trả về `undefined` cho đến khi `showA` đổi
> Dependency của `computed` là tập signal thực sự được đọc trong lần chạy cuối. Khi `showA()` thành `true`, `a()` mới được đọc và lúc đó mới trở thành dependency.

## Nút "Lưu" gọi `save$.pipe(switchMap(data => this.http.post('/api/orders', data)))`. Vì sao đây là lựa chọn rủi ro? [senior]
- [ ] `switchMap` không hoạt động với `HttpClient.post`
- [ ] `switchMap` gửi request trùng lặp hai lần
- [ ] `switchMap` làm response về sai thứ tự
- [x] Bấm lần hai sẽ unsubscribe (abort phía client) request đầu, nhưng server có thể đã xử lý nó; client mất response và dữ liệu có thể bị ghi trùng hoặc lệch; nên dùng `exhaustMap` hoặc `concatMap`
> Hủy phía client không đảm bảo server chưa thực thi thao tác ghi. `switchMap` hợp với đọc (GET, search) hơn là thao tác có side effect.

## `data$ = this.http.get('/api/config').pipe(shareReplay(1));` dùng trong một component bị tạo/hủy nhiều lần. Điều cần lưu ý là gì? [senior]
- [ ] `shareReplay(1)` gửi lại request cho mỗi subscriber mới
- [x] Mặc định `refCount: false` nên subscription tới nguồn không bị hủy kể cả khi mọi subscriber đã unsubscribe; với nguồn không complete điều này gây leak, khi đó nên dùng `shareReplay({ bufferSize: 1, refCount: true })`
- [ ] `shareReplay` chỉ hoạt động với Subject, không với HTTP
- [ ] `shareReplay(1)` tự động hết hạn cache sau 1 giây
> Với HTTP (complete sau một giá trị) thì cache lâu dài thường là ý muốn, nhưng với stream vô hạn như WebSocket hay interval, `refCount: false` giữ subscription sống mãi. `shareReplay` không có TTL mặc định.

## Directive muốn lấy instance `FormStateService` của component/directive cha, bỏ qua instance mà chính nó provide. Cách inject nào đúng? [senior]
- [ ] `inject(FormStateService, { self: true })`
- [ ] `inject(FormStateService, { host: true })`
- [x] `inject(FormStateService, { skipSelf: true })`
- [ ] `inject(FormStateService, { optional: true })`
> `skipSelf` bắt đầu tìm từ injector cha, bỏ qua injector của chính element. `self` thì ngược lại, chỉ tìm ở injector hiện tại; `optional` chỉ trả `null` thay vì ném lỗi khi không tìm thấy.

## Thứ tự Angular resolve một dependency được inject trong component là gì? [senior]
- [ ] Root injector → element injector của component → NullInjector
- [ ] Platform injector → root injector → element injector → ném lỗi
- [ ] Chỉ tìm ở environment injector của route, không tìm ở element injector
- [x] Element injector của component và các tổ tiên trong cây DOM → environment injector (route lazy, root, platform) → NullInjector ném `NullInjectorError`
> Angular đi lên cây element injector trước, sau đó mới tới chuỗi environment injector. Không tìm thấy ở đâu thì NullInjector ném lỗi, trừ khi dùng `optional`.

## Service có `providedIn: 'root'` nhưng cũng được liệt kê trong `providers` của một lazy-loaded route. Component trong route đó nhận instance nào? [senior]
- [x] Một instance mới thuộc environment injector của route đó, khác instance ở root mà phần còn lại của app dùng
- [ ] Luôn là instance root vì `providedIn: 'root'` được ưu tiên
- [ ] Angular báo lỗi vì trùng provider
- [ ] Mỗi component trong route nhận một instance riêng
> `providers` của route tạo child environment injector, nó tìm thấy provider trước khi tới root nên tạo instance riêng, dùng chung cho cả cây route đó. Đây là nguồn gốc phổ biến của bug "service không còn là singleton".

## Phát biểu nào đúng về `@defer`? [senior]
- [ ] Trigger mặc định là `on viewport`
- [ ] Khối `@placeholder` luôn bắt buộc với mọi trigger
- [x] Dependency trong khối `@defer` chỉ được tách thành chunk lazy khi chúng là standalone và không được tham chiếu ở chỗ khác ngoài các khối defer trong cùng template/file
- [ ] Khi SSR, server render nội dung chính của khối `@defer` thay cho placeholder
> Trigger mặc định là `on idle`; trên server Angular render `@placeholder` (nội dung chính chỉ tải ở client, trừ khi dùng incremental hydration với trigger `hydrate`). Nếu component được dùng ở nơi khác bên ngoài khối defer, nó bị import eager và không được tách chunk.

## Sau khi bật SSR với `provideClientHydration()`, một component gọi `this.el.nativeElement.appendChild(div)` trong constructor và console báo lỗi hydration mismatch. Hướng xử lý hợp lý nhất? [senior]
- [ ] Tắt AOT để Angular hydrate ở chế độ JIT
- [ ] Chuyển component sang `ChangeDetectionStrategy.OnPush`
- [ ] Bọc code trong `setTimeout` để chạy sau khi hydrate xong là đủ cho mọi trường hợp
- [x] Tránh thao tác DOM trực tiếp (dùng template/`Renderer2` hoặc `afterNextRender` cho code chỉ chạy ở browser); nếu không thể, gắn `ngSkipHydration` cho component đó
> Non-destructive hydration yêu cầu DOM từ server khớp cấu trúc mà Angular mong đợi; thao tác DOM trực tiếp phá vỡ điều đó. `ngSkipHydration` là lối thoát, khiến component đó bị render lại ở client thay vì hydrate.

## Component con khai báo `name = input<string>('')` và trong method gọi `this.name.set('Bob')`. Kết quả và cách đúng để có two-way binding `[(name)]` là gì? [senior]
- [ ] Chạy bình thường, giá trị mới tự đồng bộ lên cha
- [ ] Lỗi runtime, cần bọc trong `untracked()`
- [x] Lỗi biên dịch vì `InputSignal` là read-only, không có `set`; dùng `name = model<string>('')` để con có thể `set` và cha bind `[(name)]="parentName"`
- [ ] Chạy được nhưng chỉ cập nhật giá trị local, cần thêm `@Output() nameChange`
> `input()` chỉ cho đọc giá trị từ cha. `model()` tạo `ModelSignal` có thể ghi và tự phát sự kiện `nameChange`, nên hỗ trợ cú pháp banana-in-a-box với cả signal lẫn field thường ở cha.
