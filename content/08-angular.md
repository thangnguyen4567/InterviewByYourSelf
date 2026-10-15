---
id: angular
title: Angular
icon: 🅰️
order: 8
description: Kiến trúc Angular, component, DI, change detection, Signals, RxJS, routing, forms, performance, SSR và testing (Angular 14-19)
---

# Kiến trúc & khái niệm cơ bản

## Kiến trúc tổng quan của một ứng dụng Angular gồm những gì? [junior]
Angular là **framework** (không chỉ là thư viện UI) viết bằng TypeScript, cung cấp sẵn routing, forms, HTTP, DI, testing.

**Các building block chính:**
| Thành phần | Vai trò |
|---|---|
| **Component** | Đơn vị UI: class TypeScript + template HTML + style |
| **Template** | HTML mở rộng với binding, directive, pipe, control flow |
| **Directive** | Thêm hành vi cho DOM element (attribute/structural) |
| **Pipe** | Biến đổi dữ liệu hiển thị trong template |
| **Service** | Logic nghiệp vụ, gọi API, chia sẻ state — inject qua **DI** |
| **NgModule / Standalone** | Cách tổ chức và khai báo dependency của component |
| **Router** | Điều hướng giữa các view, lazy loading |

```typescript
@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    @for (e of employees(); track e.id) {
      <p>{{ e.name }} - {{ e.joinDate | date:'dd/MM/yyyy' }}</p>
    }
  `,
})
export class EmployeeListComponent {
  private service = inject(EmployeeService);
  employees = this.service.employees; // signal
}
```

**Luồng chạy:** `main.ts` gọi `bootstrapApplication(AppComponent, appConfig)` → Angular tạo root injector, render component tree, change detection cập nhật DOM khi state đổi.

**Lưu ý:** Angular là **opinionated** — cấu trúc thống nhất, phù hợp ứng dụng enterprise lớn, đổi lại learning curve cao hơn React/Vue.

## NgModule và Standalone Component khác nhau thế nào? [junior]
**NgModule** (cách cũ) gom các component/directive/pipe vào `declarations` và chia sẻ qua `exports`. **Standalone component** (Angular 14 preview, stable 15, **mặc định từ Angular 19**) tự khai báo dependency của nó qua `imports`, không cần NgModule.

```typescript
// NgModule
@NgModule({
  declarations: [EmployeeListComponent, EmployeeCardComponent],
  imports: [CommonModule, ReactiveFormsModule],
  exports: [EmployeeListComponent],
})
export class EmployeeModule {}

// Standalone
@Component({
  selector: 'app-employee-list',
  imports: [EmployeeCardComponent, ReactiveFormsModule, DatePipe], // standalone: true là mặc định từ v19
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent {}
```

| | NgModule | Standalone |
|---|---|---|
| Boilerplate | Nhiều | Ít |
| Dependency | Ngầm qua module | Tường minh trong component |
| Lazy loading | `loadChildren` một module | `loadComponent` trực tiếp |
| Tree-shaking | Kém hơn | Tốt hơn |
| Bootstrap | `platformBrowserDynamic().bootstrapModule()` | `bootstrapApplication()` + `provideRouter`, `provideHttpClient` |

**Lưu ý / bẫy thường gặp:** hai cách **dùng chung được** — standalone component có thể import NgModule, và NgModule có thể import standalone component. Migration: `ng generate @angular/core:standalone`.

## Directive là gì? Có những loại directive nào? [junior]
**Directive** là class thêm hành vi cho element trong template. Có 3 loại:

| Loại | Mô tả | Ví dụ |
|---|---|---|
| **Component** | Directive có template | `<app-header>` |
| **Attribute directive** | Thay đổi giao diện/hành vi của element | `ngClass`, `ngStyle`, `ngModel` |
| **Structural directive** | Thay đổi cấu trúc DOM (thêm/xoá element), cú pháp `*` | `*ngIf`, `*ngFor`, `*ngSwitchCase` |

### Custom attribute directive
```typescript
@Directive({
  selector: '[appHighlight]',
  host: { '(mouseenter)': 'onEnter()', '(mouseleave)': 'onLeave()' },
})
export class HighlightDirective {
  color = input('yellow', { alias: 'appHighlight' });
  private el = inject(ElementRef<HTMLElement>);

  onEnter() { this.el.nativeElement.style.backgroundColor = this.color(); }
  onLeave() { this.el.nativeElement.style.backgroundColor = ''; }
}
```
```html
<p appHighlight="lightblue">Hover me</p>
```

### Custom structural directive
```typescript
@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective {
  private tpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);

  appHasRole = input.required<string>();
  constructor() {
    effect(() => {
      this.vcr.clear();
      if (this.auth.hasRole(this.appHasRole())) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}
```

**Lưu ý:** dấu `*` là cú pháp rút gọn của `<ng-template>`. Từ Angular 17, built-in control flow `@if/@for/@switch` thay thế `*ngIf/*ngFor`. **Host directive** (`hostDirectives`, v15) cho phép compose directive vào component.

## Pipe là gì? Pure pipe và impure pipe khác nhau thế nào? [junior]
**Pipe** biến đổi giá trị để hiển thị trong template: `{{ value | pipeName:arg }}`. Built-in: `date`, `currency`, `decimal`, `percent`, `uppercase`, `json`, `async`, `slice`, `keyvalue`.

```typescript
@Pipe({ name: 'fullName' }) // pure: true mặc định
export class FullNamePipe implements PipeTransform {
  transform(e: Employee, format: 'short' | 'long' = 'long'): string {
    return format === 'short' ? e.lastName : `${e.firstName} ${e.lastName}`;
  }
}
```
```html
{{ employee | fullName:'short' }}
```

| | Pure pipe (mặc định) | Impure pipe (`pure: false`) |
|---|---|---|
| Chạy lại khi | Input thay đổi **reference** (primitive đổi giá trị / object đổi reference) | **Mỗi lần change detection** |
| Hiệu năng | Tốt, được memoize | Có thể rất tốn |
| Phát hiện mutate mảng/object | Không | Có |
| Ví dụ | `date`, `currency`, custom format | `async`, `json`, `keyvalue` |

**Tại sao nên dùng pipe thay cho gọi method trong template:** `{{ formatName(e) }}` chạy lại **mỗi chu kỳ change detection**, còn pure pipe chỉ chạy khi input đổi.

**Lưu ý / bẫy thường gặp:** `array.push(x)` không làm pure pipe chạy lại vì reference không đổi — hãy dùng immutable update `items = [...items, x]`. Với Signals, `computed()` là lựa chọn thay thế tốt cho logic biến đổi.

## Service là gì? Tại sao nên tách logic ra service? [junior]
**Service** là class (thường decorate `@Injectable`) chứa logic **không liên quan trực tiếp đến view**: gọi API, xử lý nghiệp vụ, chia sẻ state giữa các component, logging, auth.

```typescript
@Injectable({ providedIn: 'root' })   // singleton toàn app, tree-shakable
export class EmployeeService {
  private http = inject(HttpClient);
  private readonly api = '/api/employees';

  getAll() { return this.http.get<Employee[]>(this.api); }
  getById(id: string) { return this.http.get<Employee>(`${this.api}/${id}`); }
  create(dto: CreateEmployeeDto) { return this.http.post<Employee>(this.api, dto); }
}

@Component({ /* ... */ })
export class EmployeeListComponent {
  private service = inject(EmployeeService);
  employees$ = this.service.getAll();
}
```

**Lợi ích:**
- **Separation of concerns:** component chỉ lo hiển thị và tương tác.
- **Tái sử dụng** giữa nhiều component.
- **Dễ test:** mock service khi test component.
- **Chia sẻ state** (service singleton chứa signal/BehaviorSubject).

**Lưu ý / bẫy thường gặp:** service `providedIn: 'root'` là singleton; nếu khai báo lại trong `providers` của component thì mỗi instance component có **instance service riêng** — đôi khi là bug, đôi khi là chủ đích (state cục bộ).

# Component & giao tiếp giữa component

## Trình bày các lifecycle hook của Angular component. [junior]
Thứ tự gọi các hook:

| Hook | Khi nào chạy | Dùng để |
|---|---|---|
| `constructor` | Khi tạo instance (không phải hook) | Inject dependency, không truy cập input |
| `ngOnChanges(changes)` | Trước `ngOnInit` và mỗi khi **@Input reference** thay đổi | Phản ứng với input đổi |
| `ngOnInit` | **Một lần** sau lần `ngOnChanges` đầu tiên | Khởi tạo, gọi API, đọc input |
| `ngDoCheck` | Mỗi chu kỳ change detection | Custom change detection (hiếm dùng) |
| `ngAfterContentInit` | Một lần, sau khi content projection (`ng-content`) được khởi tạo | Truy cập `@ContentChild` |
| `ngAfterContentChecked` | Sau mỗi lần check content | — |
| `ngAfterViewInit` | Một lần, sau khi view và child view khởi tạo | Truy cập `@ViewChild`, thao tác DOM |
| `ngAfterViewChecked` | Sau mỗi lần check view | — |
| `ngOnDestroy` | Trước khi component bị huỷ | Unsubscribe, clear timer, detach listener |

```typescript
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private timer?: number;

  ngOnInit() { this.loadData(); }
  ngAfterViewInit() { this.renderChart(this.canvas.nativeElement); }
  ngOnDestroy() { clearInterval(this.timer); }
}
```

**Hook mới (v16+):** `afterNextRender()` và `afterRender()` (v19 đổi thành `afterEveryRender`) — chạy sau khi DOM render, an toàn với SSR; `DestroyRef.onDestroy()` thay cho `ngOnDestroy`.

**Lưu ý / bẫy thường gặp:** sửa state trong `ngAfterViewInit` gây lỗi `ExpressionChangedAfterItHasBeenCheckedError` ở dev mode.

## Có những kiểu data binding nào trong Angular? [junior]
| Kiểu | Cú pháp | Hướng |
|---|---|---|
| **Interpolation** | `{{ expression }}` | Component → View |
| **Property binding** | `[property]="expr"` | Component → View |
| **Attribute binding** | `[attr.aria-label]="expr"` | Component → View |
| **Class / style binding** | `[class.active]="isActive"`, `[style.width.px]="w"` | Component → View |
| **Event binding** | `(event)="handler($event)"` | View → Component |
| **Two-way binding** | `[(ngModel)]="name"` hoặc `[(value)]="x"` | Hai chiều |

```html
<h2>{{ employee.name }}</h2>
<img [src]="employee.avatarUrl" [alt]="employee.name" />
<button [disabled]="isSaving" (click)="save()">Lưu</button>
<div [class.highlight]="employee.isManager" [style.color]="statusColor"></div>
<input [(ngModel)]="searchTerm" />
<app-rating [(value)]="rating" />
```

**Two-way binding = "banana in a box" `[()]`** là cú pháp rút gọn của property + event:
```html
<app-rating [value]="rating" (valueChange)="rating = $event" />
```
Component con cần input `value` và output `valueChange` (hoặc dùng `model()` signal từ v17.2).

**Property vs attribute:** property là thuộc tính DOM object (`input.value`), attribute là HTML (`<input value="">`). `[attr.x]` dùng khi element không có property tương ứng (`colspan`, `aria-*`).

**Lưu ý / bẫy thường gặp:** `[(ngModel)]` cần import `FormsModule`. Tránh gọi function nặng trong interpolation vì chạy lại mỗi chu kỳ change detection.

## @Input và @Output dùng thế nào? Có những cách giao tiếp giữa component nào? [junior]
### @Input / @Output (parent ↔ child)
```typescript
@Component({
  selector: 'app-employee-card',
  template: `<div (click)="selected.emit(employee)">{{ employee.name }}</div>`,
})
export class EmployeeCardComponent {
  @Input({ required: true }) employee!: Employee;
  @Input({ transform: booleanAttribute }) compact = false;
  @Output() selected = new EventEmitter<Employee>();
}
```
```html
<app-employee-card [employee]="e" compact (selected)="onSelect($event)" />
```

Phiên bản signal (v17.1+):
```typescript
employee = input.required<Employee>();
selected = output<Employee>();
```

### Các cách giao tiếp
| Quan hệ | Cách |
|---|---|
| Parent → Child | `@Input` / `input()` |
| Child → Parent | `@Output` / `output()` |
| Parent gọi method của child | `@ViewChild` / `viewChild()` hoặc template reference `#child` |
| Hai chiều | `model()` / `[(x)]` |
| Component không liên quan (sibling, xa nhau) | **Shared service** với signal / `BehaviorSubject` |
| Qua URL | Route params, query params |
| State toàn cục phức tạp | NgRx / NgRx SignalStore |

**Lưu ý / bẫy thường gặp:** truyền object qua input rồi child **mutate** nó sẽ làm thay đổi dữ liệu của parent (cùng reference) và không trigger OnPush — nên coi input là immutable. Tránh "prop drilling" qua nhiều tầng, hãy dùng service.

## @ViewChild và @ContentChild khác nhau thế nào? [mid]
- **ViewChild/ViewChildren:** truy vấn element/component/directive nằm **trong template của chính component**.
- **ContentChild/ContentChildren:** truy vấn những gì được **parent truyền vào giữa thẻ** của component (content projection qua `<ng-content>`).

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="header"><ng-content select="[card-title]" /></div>
    <input #searchBox />
    <ng-content />
  `,
})
export class CardComponent implements AfterViewInit, AfterContentInit {
  @ViewChild('searchBox') searchBox!: ElementRef<HTMLInputElement>;  // trong template của Card
  @ContentChild(CardTitleDirective) title?: CardTitleDirective;      // do parent project vào

  ngAfterContentInit() { console.log(this.title); }       // content sẵn sàng
  ngAfterViewInit() { this.searchBox.nativeElement.focus(); } // view sẵn sàng
}
```
```html
<app-card>
  <h3 card-title>Danh sách nhân viên</h3>
  <p>Nội dung...</p>
</app-card>
```

| | ViewChild | ContentChild |
|---|---|---|
| Nguồn | Template của component | Content do parent truyền vào |
| Sẵn sàng tại | `ngAfterViewInit` | `ngAfterContentInit` |

**Option `static`:** `@ViewChild('x', { static: true })` có sẵn từ `ngOnInit` nếu element không nằm trong `@if/@for`.

**Signal queries (v17.2+):** `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()` trả về signal, không cần lo thời điểm lifecycle:
```typescript
searchBox = viewChild.required<ElementRef>('searchBox');
```

## Content projection là gì? Single-slot, multi-slot và ng-template? [mid]
**Content projection** cho phép parent truyền **nội dung HTML** vào bên trong component con, giống `children` của React hay slot của Vue. Dùng để xây component tái sử dụng: card, modal, tab, layout.

### Single-slot
```html
<!-- card.component.html -->
<div class="card"><ng-content /></div>
```

### Multi-slot với `select`
```html
<!-- dialog.component.html -->
<header><ng-content select="[dialog-title]" /></header>
<main><ng-content /></main>                  <!-- slot mặc định -->
<footer><ng-content select="app-dialog-actions" /></footer>
```
```html
<app-dialog>
  <h2 dialog-title>Xác nhận xoá</h2>
  <p>Bạn chắc chắn muốn xoá?</p>
  <app-dialog-actions><button>OK</button></app-dialog-actions>
</app-dialog>
```

### Conditional / lặp lại: dùng `ng-template` + `ngTemplateOutlet`
`<ng-content>` luôn được khởi tạo một lần (kể cả khi bị ẩn trong `@if`) và **không thể render nhiều lần**. Khi cần lazy render hoặc truyền context, dùng template:
```typescript
@Component({
  selector: 'app-list',
  imports: [NgTemplateOutlet],
  template: `
    @for (item of items(); track item.id) {
      <ng-container *ngTemplateOutlet="itemTpl(); context: { $implicit: item }" />
    }
  `,
})
export class ListComponent<T> {
  items = input.required<T[]>();
  itemTpl = contentChild.required(TemplateRef);
}
```
```html
<app-list [items]="employees">
  <ng-template let-e><b>{{ e.name }}</b></ng-template>
</app-list>
```

**Lưu ý / bẫy thường gặp:** content được project có lifecycle thuộc về **parent**, không phải component con.

# Dependency Injection

## Dependency Injection trong Angular hoạt động thế nào? providedIn có ý nghĩa gì? [junior]
Angular có hệ thống DI tích hợp: khi component/service cần dependency, Angular tìm **provider** trong cây **injector** và trả về instance (tạo mới nếu chưa có).

### Các cách đăng ký provider
```typescript
// 1. providedIn — khuyến nghị, tree-shakable
@Injectable({ providedIn: 'root' })
export class AuthService {}

// 2. Trong app config (standalone)
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LoggerService, useClass: ConsoleLoggerService },
  ],
};

// 3. Ở cấp component — mỗi instance component có instance riêng
@Component({ providers: [EmployeeFormStore] })
export class EmployeeFormComponent {}

// 4. Ở cấp route
{ path: 'admin', providers: [AdminService], loadComponent: () => ... }
```

**Giá trị `providedIn`:**
| Giá trị | Ý nghĩa |
|---|---|
| `'root'` | Singleton toàn ứng dụng, được tree-shake nếu không dùng |
| `'platform'` | Dùng chung giữa nhiều app trên cùng trang (hiếm) |
| `'any'` | Mỗi lazy-loaded module một instance (đã deprecated) |

**Các loại provider:** `useClass`, `useValue`, `useFactory` (kèm `deps`), `useExisting` (alias).

**Lưu ý / bẫy thường gặp:** service trong `providers` của lazy route tạo **instance khác** với root — nguyên nhân phổ biến của bug "state không đồng bộ".

## Hierarchical injector là gì? Angular resolve dependency theo thứ tự nào? [mid]
Angular có **hai cây injector**:

1. **EnvironmentInjector** (trước đây ModuleInjector): `root` → các environment injector con của lazy route.
2. **ElementInjector**: tạo theo cây DOM cho mỗi component/directive có `providers` hoặc `viewProviders`.

**Thứ tự resolve:**
1. ElementInjector của chính component → lên các component cha theo cây DOM.
2. Nếu không thấy → EnvironmentInjector (route injector → root).
3. Lên **Platform injector** → **NullInjector** → ném lỗi `NullInjectorError: No provider for X`.

**Resolution modifiers** điều chỉnh việc tìm kiếm:
```typescript
export class ChildComponent {
  logger = inject(LoggerService, { optional: true });  // null thay vì lỗi
  form = inject(FormGroupDirective, { self: true });   // chỉ tìm ở chính element này
  parentTab = inject(TabsComponent, { skipSelf: true }); // bỏ qua chính mình, tìm từ cha
  config = inject(ConfigService, { host: true });       // dừng ở host component
}
```
(Phiên bản decorator: `@Optional()`, `@Self()`, `@SkipSelf()`, `@Host()`.)

**`providers` vs `viewProviders`:** `viewProviders` chỉ hiển thị cho view của component, **không** cho content được project vào.

**Ứng dụng:** component-level store (mỗi form một state riêng), component `Tabs` cung cấp chính nó cho `Tab` con inject.

**Lưu ý / bẫy thường gặp:** cùng một service vừa `providedIn: 'root'` vừa khai báo trong `providers` của component sẽ có 2 instance khác nhau.

## inject() function là gì? So với constructor injection? [mid]
Từ Angular 14, có thể dùng hàm `inject()` để lấy dependency thay vì khai báo trong constructor. Chỉ gọi được trong **injection context**: field initializer, constructor, factory của provider, functional guard/resolver/interceptor, hoặc trong `runInInjectionContext()`.

```typescript
// Constructor injection
export class EmployeeListComponent {
  constructor(private service: EmployeeService, private router: Router) {}
}

// inject()
export class EmployeeListComponent {
  private service = inject(EmployeeService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
}
```

**Ưu điểm của `inject()`:**
- Dùng được trong **function** (functional guard, interceptor, resolver) — nơi không có constructor.
- Kế thừa dễ hơn: subclass không phải gọi `super(...)` với toàn bộ dependency.
- Tạo được **reusable helper function**:
```typescript
export function injectRouteParam(name: string) {
  return toSignal(inject(ActivatedRoute).paramMap.pipe(map(p => p.get(name))));
}
// trong component
employeeId = injectRouteParam('id');
```
- Type inference tốt hơn với `InjectionToken`, không phụ thuộc metadata decorator.

**Lưu ý / bẫy thường gặp:** gọi `inject()` trong `ngOnInit` hoặc trong callback (setTimeout, subscribe) sẽ lỗi `NG0203: inject() must be called from an injection context`. Angular team hiện khuyến nghị dùng `inject()` và có schematic migration.

## InjectionToken dùng khi nào? useFactory/useValue/useExisting khác gì nhau? [mid]
**InjectionToken** dùng làm key DI cho những thứ **không phải class**: object config, string, function, interface (TypeScript interface không tồn tại ở runtime nên không làm token được).

```typescript
export interface AppConfig { apiUrl: string; pageSize: number; }
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

// Token có giá trị mặc định, tree-shakable
export const WINDOW = new InjectionToken<Window>('WINDOW', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT).defaultView!,
});

providers: [
  { provide: APP_CONFIG, useValue: { apiUrl: '/api', pageSize: 20 } },
  { provide: LoggerService, useClass: environment.production ? RemoteLogger : ConsoleLogger },
  { provide: StorageService, useFactory: () => isPlatformBrowser(inject(PLATFORM_ID)) ? new LocalStorage() : new MemoryStorage() },
  { provide: AbstractNotifier, useExisting: ToastService },     // alias, cùng instance
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, // multi provider
]

// Sử dụng
config = inject(APP_CONFIG);
```

| Provider | Ý nghĩa |
|---|---|
| `useClass` | Tạo instance của class chỉ định |
| `useValue` | Dùng giá trị có sẵn |
| `useFactory` | Gọi function để tạo (có logic điều kiện) |
| `useExisting` | Alias tới provider khác — **cùng instance** |
| `multi: true` | Gom nhiều provider vào một mảng |

**Lưu ý / bẫy thường gặp:** `useClass: X` khi X đã là service khác sẽ tạo **instance mới**, muốn dùng chung instance phải dùng `useExisting`.

# Change Detection & Signals

## Change detection trong Angular hoạt động thế nào? Vai trò của zone.js? [mid]
**Change detection (CD)** là quá trình Angular kiểm tra các binding trong template và cập nhật DOM khi dữ liệu thay đổi.

**Cơ chế truyền thống (với zone.js):**
1. **zone.js** monkey-patch các API bất đồng bộ của trình duyệt: event DOM, `setTimeout`, `Promise`, XHR/fetch.
2. Khi một tác vụ async kết thúc, `NgZone` báo `onMicrotaskEmpty`.
3. Angular gọi `ApplicationRef.tick()` → duyệt **toàn bộ component tree từ root xuống** (top-down, một chiều).
4. Mỗi component so sánh giá trị binding mới với cũ (`===`) và cập nhật DOM nếu khác.

```typescript
// Chạy code ngoài Angular zone để tránh CD liên tục (vd: scroll, mousemove, animation)
export class MapComponent {
  private zone = inject(NgZone);
  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.onMove);
    });
  }
  private onMove = (e: MouseEvent) => {
    if (needUpdate(e)) this.zone.run(() => this.position = { x: e.x, y: e.y });
  };
}
```

**Dev mode** chạy CD hai lần để phát hiện thay đổi trong lúc check → lỗi `ExpressionChangedAfterItHasBeenCheckedError`.

**Công cụ điều khiển thủ công:** `ChangeDetectorRef.markForCheck()`, `detectChanges()`, `detach()`/`reattach()`.

**Lưu ý / bẫy thường gặp:** mỗi event (kể cả không liên quan) đều trigger CD toàn cây → ứng dụng lớn bị chậm. Giải pháp: `OnPush`, Signals, zoneless.

## ChangeDetectionStrategy.Default và OnPush khác nhau thế nào? [mid]
| | Default | OnPush |
|---|---|---|
| Component được check khi | **Mọi** chu kỳ change detection | Chỉ khi bị **đánh dấu dirty** |
| Hiệu năng | Kém hơn với cây lớn | Tốt hơn, bỏ qua cả subtree |
| Yêu cầu | Không | Dữ liệu **immutable** |

**Component OnPush chỉ được check khi:**
1. Một `@Input` thay đổi **reference** (so sánh `===`).
2. Có **event** phát sinh từ template của chính nó hoặc con của nó.
3. `async` pipe nhận giá trị mới (gọi `markForCheck` bên trong).
4. Một **signal** được đọc trong template thay đổi.
5. Gọi thủ công `cdr.markForCheck()` / `detectChanges()`.

```typescript
@Component({
  selector: 'app-employee-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (e of employees(); track e.id) { <tr>{{ e.name }}</tr> }`,
})
export class EmployeeTableComponent {
  employees = input.required<Employee[]>();
}

// Parent — sai: mutate, OnPush child không cập nhật
this.employees.push(newEmp);
// Đúng: tạo reference mới
this.employees = [...this.employees, newEmp];
```

**Lưu ý / bẫy thường gặp:**
- `setTimeout`/subscribe tự gán field trong component OnPush sẽ **không** cập nhật view → dùng signal, `async` pipe hoặc `markForCheck()`.
- `markForCheck()` đánh dấu component và **các tổ tiên** là dirty; `detectChanges()` chạy CD ngay cho component và con.
- Best practice hiện nay: **OnPush cho mọi component** + Signals.

## Zoneless Angular là gì? [senior]
**Zoneless** là chế độ chạy Angular **không cần zone.js** (experimental v18, developer preview v19, stable v20). Thay vì dựa vào zone.js để đoán khi nào cần CD, Angular chỉ chạy CD khi có **thông báo rõ ràng** rằng state thay đổi.

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(), // v18-19; v20: provideZonelessChangeDetection()
    provideRouter(routes),
  ],
};
// và xoá 'zone.js' khỏi polyfills trong angular.json
```

**CD được lên lịch khi:**
- Signal đọc trong template thay đổi.
- `markForCheck()` (bao gồm từ `async` pipe).
- Event listener trong template được gọi.
- `ComponentRef.setInput()`, attach/detach view.

**Lợi ích:**
- Bundle nhỏ hơn (~30KB zone.js), khởi động nhanh hơn.
- Ít chu kỳ CD thừa → hiệu năng tốt.
- Stack trace dễ đọc, debug dễ hơn.
- Tương thích tốt với native `async/await` (zone.js không patch được native async, phải downlevel).

**Yêu cầu để migrate:**
- Component tương thích **OnPush** (không dựa vào việc gán field trong `setTimeout`/`subscribe` rồi chờ CD tự chạy).
- Dùng Signals hoặc `async` pipe cho state.
- Thư viện bên thứ ba phải tương thích (không dùng `NgZone.onStable`...).

**Lưu ý / bẫy thường gặp:** test với zoneless dùng `await fixture.whenStable()` thay vì dựa vào `fakeAsync` của zone.

## Signals là gì? signal, computed, effect dùng thế nào? [mid]
**Signal** (v16, stable v17) là primitive **reactive** bọc một giá trị và **thông báo cho consumer** khi giá trị thay đổi. Angular biết chính xác component nào đọc signal nào → change detection chi tiết hơn (fine-grained reactivity), nền tảng cho zoneless.

```typescript
export class CartComponent {
  // Writable signal
  items = signal<CartItem[]>([]);
  discount = signal(0);

  // Computed: derived, lazy, memoized, read-only
  subtotal = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
  total = computed(() => this.subtotal() * (1 - this.discount()));

  constructor() {
    // Effect: side effect khi signal phụ thuộc thay đổi
    effect(() => localStorage.setItem('cart', JSON.stringify(this.items())));
  }

  add(item: CartItem) {
    this.items.update(list => [...list, item]);   // immutable update
  }
  clear() { this.items.set([]); }
}
```
```html
<p>Tổng: {{ total() | currency:'VND' }}</p>
```

| API | Mục đích |
|---|---|
| `signal()` | State có thể ghi: `.set()`, `.update()` |
| `computed()` | Giá trị dẫn xuất, tự track dependency, chỉ tính lại khi cần |
| `effect()` | Side effect (log, localStorage, gọi API ngoài Angular) |
| `linkedSignal()` (v19) | Signal ghi được nhưng reset theo signal nguồn |
| `resource()` / `rxResource()` (v19, experimental) | Load dữ liệu async dựa trên signal |
| `untracked()` | Đọc signal mà không tạo dependency |

**Lưu ý / bẫy thường gặp:**
- Đừng dùng `effect()` để **đồng bộ state** giữa các signal — dùng `computed()` hoặc `linkedSignal()`.
- Signal so sánh bằng `Object.is` → mutate object bên trong (`items().push(x)`) sẽ **không** thông báo thay đổi.

## Signal inputs: input(), output(), model() khác gì @Input/@Output? [mid]
Từ v17.1–17.3, Angular cung cấp API dựa trên signal để khai báo input/output (stable ở v19):

```typescript
@Component({
  selector: 'app-rating',
  template: `
    @for (s of stars(); track s) {
      <span (click)="value.set(s)" [class.on]="s <= value()">★</span>
    }
  `,
})
export class RatingComponent {
  max = input(5);                                  // optional, default 5
  label = input.required<string>();                // bắt buộc
  disabled = input(false, { transform: booleanAttribute });
  value = model(0);                                // two-way binding
  changed = output<number>();                      // thay EventEmitter

  stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
}
```
```html
<app-rating label="Đánh giá" [max]="10" [(value)]="score" (changed)="log($event)" />
```

| | `@Input` | `input()` |
|---|---|---|
| Kiểu | Property thường | `InputSignal<T>` (read-only) |
| Phản ứng thay đổi | `ngOnChanges` / setter | `computed()` / `effect()` trực tiếp |
| Required | `@Input({ required: true })` | `input.required<T>()` |
| Ghi từ bên trong | Được (dễ gây lỗi) | Không — muốn ghi dùng `model()` |

- `model()` = input có thể ghi; khi `.set()` sẽ tự emit sự kiện `valueChange` để parent cập nhật qua `[(value)]`.
- `output()` không phải RxJS Subject; dùng `outputFromObservable()` / `outputToObservable()` để chuyển đổi.

**Lưu ý / bẫy thường gặp:** signal input chưa có giá trị trong constructor (required input đọc sớm sẽ lỗi `NG0950`); hãy đọc trong `computed`, `effect` hoặc template.

## Signals khác RxJS Observable thế nào? Khi nào dùng cái nào? [senior]
| | Signal | Observable (RxJS) |
|---|---|---|
| Bản chất | **Giá trị** thay đổi theo thời gian (luôn có giá trị hiện tại) | **Luồng sự kiện** theo thời gian |
| Đọc | Đồng bộ: `count()` | Phải `subscribe` |
| Push/Pull | Push thông báo, pull giá trị (lazy) | Push |
| Glitch-free | Có (computed không thấy trạng thái trung gian) | Không mặc định (`combineLatest` có thể emit trung gian) |
| Unsubscribe | Tự động | Phải quản lý |
| Toán tử thời gian | Không có | Có: `debounceTime`, `switchMap`, `retry`, `buffer`... |
| Phù hợp | **State** đồng bộ của UI | **Async/event**: HTTP, WebSocket, race condition, debounce |

**Kết hợp với `@angular/core/rxjs-interop`:**
```typescript
export class EmployeeSearchComponent {
  private service = inject(EmployeeService);
  query = signal('');

  // signal -> observable -> xử lý async -> signal
  results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.service.search(q)),
    ),
    { initialValue: [] },
  );
}
```

**Quy tắc thực tế:** "**Signals cho state, RxJS cho events/async**". Từ v19, `resource()`/`rxResource()` dần thay thế nhiều trường hợp phải tự viết `toSignal(... switchMap ...)`.

**Lưu ý / bẫy thường gặp:** `toSignal()` subscribe ngay và cần injection context; với observable không emit đồng bộ, giá trị ban đầu là `undefined` nếu không truyền `initialValue`.

# RxJS trong Angular

## Observable và Promise khác nhau thế nào? [junior]
| | Promise | Observable |
|---|---|---|
| Số giá trị | **Một** giá trị | **Nhiều** giá trị theo thời gian (0..n) |
| Thực thi | **Eager** — chạy ngay khi tạo | **Lazy** — chỉ chạy khi `subscribe` |
| Huỷ | Không huỷ được | Huỷ được qua `unsubscribe()` (HttpClient sẽ abort request) |
| Toán tử | `then`, `catch`, `finally` | Hàng trăm operator: `map`, `filter`, `retry`, `debounceTime`... |
| Multicast | Luôn dùng chung kết quả | Mặc định **unicast** (mỗi subscriber chạy lại), có thể `share` |
| Đồng bộ/bất đồng bộ | Luôn async | Có thể sync hoặc async |

```typescript
// Observable: mỗi lần subscribe = một HTTP request mới
const emp$ = this.http.get<Employee[]>('/api/employees');
emp$.subscribe();   // request 1
emp$.subscribe();   // request 2

// Chuyển đổi
const data = await firstValueFrom(emp$);     // Observable -> Promise
const obs$ = from(fetch('/api/x'));           // Promise -> Observable
```

**Tại sao Angular dùng Observable cho HttpClient:** huỷ được request (ví dụ khi user gõ tìm kiếm liên tục dùng `switchMap`), retry, kết hợp nhiều luồng, interceptor.

**Lưu ý / bẫy thường gặp:** `toPromise()` đã deprecated, dùng `firstValueFrom` / `lastValueFrom`. Dùng `| async` nhiều lần cùng một HTTP observable trong template sẽ gửi nhiều request — dùng `shareReplay` hoặc `toSignal`.

## Các loại Subject trong RxJS: Subject, BehaviorSubject, ReplaySubject, AsyncSubject? [mid]
**Subject** vừa là Observable vừa là Observer → có thể `next()` giá trị và **multicast** cho nhiều subscriber.

| Loại | Giá trị ban đầu | Subscriber mới nhận được | Use case |
|---|---|---|---|
| `Subject` | Không | Chỉ giá trị phát **sau** khi subscribe | Event bus, trigger hành động, `destroy$` |
| `BehaviorSubject` | **Bắt buộc** | **Giá trị hiện tại** + các giá trị sau; có `.value` | State (user hiện tại, filter) |
| `ReplaySubject(n)` | Không | **n giá trị gần nhất** + các giá trị sau | Cache, lịch sử thông báo |
| `AsyncSubject` | Không | Chỉ **giá trị cuối cùng** khi `complete()` | Giống Promise, hiếm dùng |

```typescript
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _user = new BehaviorSubject<User | null>(null);
  readonly user$ = this._user.asObservable();          // không lộ next() ra ngoài
  readonly isLoggedIn$ = this.user$.pipe(map(u => !!u));

  get currentUser() { return this._user.value; }
  login(u: User) { this._user.next(u); }
  logout() { this._user.next(null); }
}
```

**Best practice:** giữ Subject `private`, chỉ expose `asObservable()` để bên ngoài không `next()` bừa bãi.

**Lưu ý / bẫy thường gặp:** trong Angular hiện đại, state dạng "BehaviorSubject service" thường được thay bằng `signal()` — đơn giản hơn, không cần unsubscribe. Subject vẫn hợp lý cho **event stream**.

## Phân biệt switchMap, mergeMap, concatMap và exhaustMap? [mid]
Cả bốn đều là **higher-order mapping operator**: map mỗi giá trị nguồn thành một inner Observable (vd HTTP request) rồi flatten. Khác nhau ở cách xử lý khi inner cũ **chưa hoàn thành** mà giá trị mới tới:

| Operator | Hành vi | Use case |
|---|---|---|
| `switchMap` | **Huỷ** inner cũ, chuyển sang inner mới | Search/autocomplete, đổi route params |
| `mergeMap` | Chạy **song song** tất cả | Upload nhiều file, request độc lập |
| `concatMap` | **Xếp hàng**, chạy tuần tự giữ thứ tự | Lưu theo thứ tự, queue thao tác |
| `exhaustMap` | **Bỏ qua** giá trị mới khi inner đang chạy | Nút Login/Submit chống double-click, refresh token |

```typescript
// Search: chỉ quan tâm kết quả của từ khoá mới nhất
this.results$ = this.searchCtrl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(q => this.api.search(q)),
);

// Chống submit nhiều lần
this.submit$.pipe(exhaustMap(() => this.api.save(this.form.value))).subscribe();

// Auto-save tuần tự theo thứ tự thay đổi
this.form.valueChanges.pipe(debounceTime(500), concatMap(v => this.api.patch(v))).subscribe();

// Song song có giới hạn
from(files).pipe(mergeMap(f => this.api.upload(f), 3)).subscribe();
```

**Lưu ý / bẫy thường gặp:** dùng `switchMap` cho **thao tác ghi** (POST/DELETE) nguy hiểm — request đã gửi tới server có thể vẫn được xử lý dù client huỷ, và thứ tự không đảm bảo. Dùng `concatMap` hoặc `exhaustMap` cho thao tác ghi.

## Tại sao phải unsubscribe? Có những cách nào để quản lý subscription? [mid]
Observable **không kết thúc** (`interval`, `valueChanges`, `router.events`, Subject của store, WebSocket) nếu không unsubscribe sẽ tiếp tục chạy sau khi component bị huỷ → **memory leak**, callback chạy trên component đã chết, gọi API thừa.

**Không cần unsubscribe:** HttpClient (complete sau 1 response — nhưng unsubscribe vẫn có lợi để huỷ request), `ActivatedRoute` observables (Angular tự cleanup), `async` pipe.

### Các cách (từ được khuyến nghị nhất)
```typescript
// 1. async pipe — tự subscribe/unsubscribe
// template: @if (employees$ | async; as list) { ... }

// 2. toSignal — tự unsubscribe khi injection context bị huỷ
employees = toSignal(this.service.getAll(), { initialValue: [] });

// 3. takeUntilDestroyed (v16+)
export class Cmp {
  private destroyRef = inject(DestroyRef);
  constructor() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe(...);   // trong injection context
  }
  ngOnInit() {
    this.store.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...); // ngoài context cần destroyRef
  }
}

// 4. Pattern cũ: takeUntil + destroy$ Subject
private destroy$ = new Subject<void>();
obs$.pipe(takeUntil(this.destroy$)).subscribe();
ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

// 5. Giữ Subscription và unsubscribe thủ công
private sub = new Subscription();
this.sub.add(obs$.subscribe());
ngOnDestroy() { this.sub.unsubscribe(); }
```

**Lưu ý / bẫy thường gặp:** `takeUntil` / `takeUntilDestroyed` phải đặt **cuối** trong `pipe` — đặt trước `switchMap` thì inner observable vẫn sống (rule ESLint `rxjs/no-unsafe-takeuntil`).

## async pipe hoạt động thế nào và có lợi ích gì? [junior]
`async` pipe **subscribe** vào Observable (hoặc Promise) ngay trong template, trả về giá trị mới nhất và **tự unsubscribe** khi component bị huỷ hoặc khi reference của observable thay đổi.

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
  template: `
    @if (vm$ | async; as vm) {
      <h2>{{ vm.department.name }}</h2>
      @for (e of vm.employees; track e.id) { <app-employee-card [employee]="e" /> }
    } @else {
      <app-spinner />
    }
  `,
})
export class DepartmentComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  vm$ = this.route.paramMap.pipe(
    map(p => p.get('id')!),
    switchMap(id => combineLatest({
      department: this.api.getDepartment(id),
      employees: this.api.getEmployees(id),
    })),
  );
}
```

**Lợi ích:**
- Không cần tự quản lý subscription → tránh memory leak.
- Gọi `markForCheck()` khi có giá trị mới → hoạt động tốt với **OnPush**.
- Code khai báo (declarative), dễ đọc.

**Pattern "view model" (`vm$`)**: gom nhiều stream vào một object để chỉ dùng một `async` pipe.

**Lưu ý / bẫy thường gặp:**
- Mỗi lần dùng `| async` là một subscription riêng → cùng một HTTP observable dùng 3 lần sẽ gửi 3 request. Dùng `@if (... as x)`, `shareReplay({ bufferSize: 1, refCount: true })`, hoặc `toSignal()`.
- Giá trị ban đầu là `null` trước khi observable emit.

# Routing, Forms & HTTP

## Lazy loading trong Angular router hoạt động thế nào? [junior]
**Lazy loading** chỉ tải code (JavaScript chunk) của một feature **khi người dùng điều hướng tới route đó**, giúp giảm bundle ban đầu và tăng tốc khởi động.

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'employees',
    loadChildren: () => import('./employees/employee.routes').then(m => m.EMPLOYEE_ROUTES),
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/report.component').then(m => m.ReportComponent),
    canMatch: [roleGuard('Manager')],
  },
  { path: '**', component: NotFoundComponent },
];

// employees/employee.routes.ts
export const EMPLOYEE_ROUTES: Routes = [
  { path: '', component: EmployeeListComponent },
  { path: ':id', component: EmployeeDetailComponent },
];

// app.config.ts
provideRouter(routes,
  withPreloading(PreloadAllModules),      // tải trước các chunk khi rảnh
  withComponentInputBinding(),            // map route param vào input()
)
```

**Preloading strategy:** `NoPreloading` (mặc định), `PreloadAllModules`, hoặc custom (chỉ preload route có `data: { preload: true }`), hoặc thư viện `ngx-quicklink`.

**`withComponentInputBinding()`** (v16): `:id`, query params, `data`, resolver được bind thẳng vào `id = input<string>()` của component.

**Lưu ý / bẫy thường gặp:** import trực tiếp (static `import`) component của feature lazy ở nơi khác sẽ kéo nó vào main bundle, làm mất tác dụng lazy loading. Kiểm tra bằng `ng build --stats-json` + bundle analyzer.

## Route guard là gì? Functional guard viết thế nào? [mid]
**Guard** quyết định có cho phép điều hướng hay không. Từ v14.2, Angular khuyến nghị **functional guard** (class-based guard `CanActivate` interface đã deprecated từ v15.2).

| Guard | Khi nào chạy |
|---|---|
| `canActivate` | Trước khi vào route |
| `canActivateChild` | Trước khi vào route con |
| `canDeactivate` | Trước khi rời route (form chưa lưu) |
| `canMatch` | Quyết định route có được **match** không — chặn cả việc tải lazy chunk |
| `resolve` | Tải dữ liệu trước khi kích hoạt route |

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const roleGuard = (role: string): CanMatchFn => () => inject(AuthService).hasRole(role);

export const unsavedChangesGuard: CanDeactivateFn<{ hasUnsavedChanges(): boolean }> =
  (component) => !component.hasUnsavedChanges() || confirm('Bỏ thay đổi chưa lưu?');

// routes
{ path: 'admin', canMatch: [roleGuard('Admin')], canActivate: [authGuard], loadChildren: ... }
{ path: 'edit/:id', component: EditComponent, canDeactivate: [unsavedChangesGuard] }
```

Guard có thể trả `boolean`, `UrlTree` (redirect), `Observable` hoặc `Promise` của chúng. Từ v18 có thể trả `RedirectCommand`.

**Lưu ý / bẫy thường gặp:** guard chỉ là bảo vệ **UX phía client** — mọi kiểm tra quyền thật sự phải nằm ở **backend API**. Nên trả `UrlTree` thay vì gọi `router.navigate()` trong guard để tránh race condition.

## Resolver là gì? Ưu nhược điểm so với load dữ liệu trong component? [mid]
**Resolver** tải dữ liệu **trước khi** route được kích hoạt; component nhận dữ liệu đã sẵn sàng.

```typescript
export const employeeResolver: ResolveFn<Employee> = (route) => {
  const service = inject(EmployeeService);
  const router = inject(Router);
  return service.getById(route.paramMap.get('id')!).pipe(
    catchError(() => {
      router.navigate(['/not-found']);
      return EMPTY;
    }),
  );
};

// routes
{ path: 'employees/:id', component: EmployeeDetailComponent, resolve: { employee: employeeResolver } }

// component (với withComponentInputBinding)
export class EmployeeDetailComponent {
  employee = input.required<Employee>();
}
// hoặc: inject(ActivatedRoute).data.pipe(map(d => d['employee']))
```

| | Resolver | Load trong component |
|---|---|---|
| UX | Màn hình cũ "đứng" tới khi có data | Hiện ngay khung + skeleton/spinner |
| Code component | Đơn giản, data luôn có | Phải xử lý trạng thái loading/error |
| Xử lý lỗi | Có thể redirect trước khi vào trang | Hiển thị lỗi trong trang |
| Phù hợp | Data nhỏ, nhanh, bắt buộc phải có | Data lớn/chậm, nhiều phần độc lập |

**Lưu ý / bẫy thường gặp:** resolver chậm làm app có cảm giác "không phản hồi" — nên kèm loading indicator toàn cục bằng cách lắng nghe `router.events` (`NavigationStart`/`NavigationEnd`). Mặc định resolver chỉ chạy lại khi path params đổi; dùng `runGuardsAndResolvers` để tuỳ chỉnh.

## Template-driven forms và Reactive forms khác nhau thế nào? [junior]
| | Template-driven | Reactive |
|---|---|---|
| Định nghĩa model | Trong **template** (`ngModel`) | Trong **class** (`FormGroup`, `FormControl`) |
| Module | `FormsModule` | `ReactiveFormsModule` |
| Data flow | Bất đồng bộ, two-way binding | Đồng bộ, immutable, explicit |
| Validation | Directive (`required`, `minlength`) | Function validator |
| Form động (thêm/bớt field) | Khó | Dễ (`FormArray`) |
| Testing | Khó hơn (cần render template) | Dễ, test logic không cần DOM |
| Phù hợp | Form đơn giản (login, search) | Form phức tạp, enterprise |

### Template-driven
```html
<form #f="ngForm" (ngSubmit)="save(f.value)">
  <input name="email" [(ngModel)]="model.email" required email #email="ngModel" />
  @if (email.invalid && email.touched) { <small>Email không hợp lệ</small> }
  <button [disabled]="f.invalid">Lưu</button>
</form>
```

### Reactive
```typescript
export class EmployeeFormComponent {
  private fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    skills: this.fb.array<string>([]),
  });
  save() { if (this.form.valid) this.api.create(this.form.getRawValue()); }
}
```
```html
<form [formGroup]="form" (ngSubmit)="save()">
  <input formControlName="fullName" />
  @if (form.controls.fullName.hasError('required')) { <small>Bắt buộc</small> }
</form>
```

**Lưu ý:** Angular đang phát triển **Signal Forms** (experimental từ v21) — hướng tương lai cho forms dựa trên signal.

## Viết custom validator, cross-field validator và async validator như thế nào? [mid]
### Validator đồng bộ
```typescript
export function forbiddenNameValidator(pattern: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    pattern.test(control.value) ? { forbiddenName: { value: control.value } } : null;
}
```

### Cross-field validator (đặt ở FormGroup)
```typescript
export const dateRangeValidator: ValidatorFn = (group: AbstractControl) => {
  const from = group.get('fromDate')?.value;
  const to = group.get('toDate')?.value;
  return from && to && from > to ? { dateRange: true } : null;
};

form = this.fb.group(
  { fromDate: [''], toDate: [''] },
  { validators: dateRangeValidator },
);
```

### Async validator (kiểm tra trùng trên server)
```typescript
export function uniqueEmailValidator(api: EmployeeService): AsyncValidatorFn {
  return (control) =>
    timer(400).pipe(                                       // debounce
      switchMap(() => api.checkEmailExists(control.value)),
      map(exists => (exists ? { emailTaken: true } : null)),
      catchError(() => of(null)),
    );
}

email = new FormControl('', {
  validators: [Validators.required, Validators.email],
  asyncValidators: [uniqueEmailValidator(inject(EmployeeService))],
  updateOn: 'blur',                                         // giảm số lần gọi API
});
```

**Điểm chính:**
- Validator trả `null` khi hợp lệ, object lỗi khi không hợp lệ.
- Async validator chỉ chạy khi **tất cả sync validator đã pass**; trong lúc chạy, `status === 'PENDING'`.
- Observable của async validator phải **complete** (HTTP tự complete; `timer` + `switchMap` ổn).

**Lưu ý / bẫy thường gặp:** `updateOn: 'blur'` hoặc debounce để tránh gọi API mỗi lần gõ phím. Hiển thị lỗi theo `touched`/`dirty` để không báo lỗi ngay khi form vừa mở.

## Typed Reactive Forms (Angular 14) là gì? [mid]
Từ **Angular 14**, Reactive Forms được **strongly typed**: `FormControl<T>`, `FormGroup<{...}>`, giá trị và `patchValue` được kiểm tra kiểu ở compile-time. Trước đó mọi thứ là `any`.

```typescript
interface EmployeeForm {
  fullName: FormControl<string>;
  age: FormControl<number | null>;
  address: FormGroup<{ city: FormControl<string>; street: FormControl<string> }>;
}

const form = new FormGroup<EmployeeForm>({
  fullName: new FormControl('', { nonNullable: true }),
  age: new FormControl<number | null>(null),
  address: new FormGroup({
    city: new FormControl('', { nonNullable: true }),
    street: new FormControl('', { nonNullable: true }),
  }),
});

form.controls.fullName.value;      // string
form.value;                        // Partial<{ fullName: string; age: number | null; ... }>
form.getRawValue();                // đầy đủ, gồm cả control bị disabled
form.patchValue({ age: 'abc' });   // compile error
```

**Điểm quan trọng:**
- **`nonNullable: true`** — `reset()` đưa control về giá trị ban đầu thay vì `null`; nếu không, kiểu là `string | null`. Dùng `NonNullableFormBuilder` (`inject(FormBuilder).nonNullable`) để áp dụng cho cả form.
- `form.value` có kiểu `Partial<...>` vì control **disabled** bị loại khỏi `value`.
- `FormRecord<T>` cho form có key động.
- `UntypedFormGroup` / `UntypedFormControl` dùng khi migrate code cũ (`ng update` tự đổi).

**Lưu ý / bẫy thường gặp:** để gửi API nên dùng `getRawValue()` nếu muốn có đầy đủ field kể cả disabled.

## HttpClient và Interceptor dùng thế nào? [mid]
**HttpClient** là service gọi HTTP trả về **Observable**, tự parse JSON, hỗ trợ typed response, progress event, interceptor.

```typescript
// app.config.ts
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]), withFetch())

// Gọi API
this.http.get<PagedResult<Employee>>('/api/employees', {
  params: { page: 1, size: 20, keyword: 'an' },
});
```

**Interceptor** chặn mọi request/response để xử lý **cross-cutting concerns** (Chain of Responsibility). Functional interceptor (v15+):
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authReq);
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);
  return next(req).pipe(
    retry({ count: 2, delay: 1000, resetOnSuccess: true }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) router.navigate(['/login']);
      else toast.error(err.error?.message ?? 'Có lỗi xảy ra');
      return throwError(() => err);
    }),
  );
};
```

**Use case phổ biến:** gắn token, refresh token (dùng `exhaustMap`/share để chỉ refresh một lần), loading indicator, xử lý lỗi tập trung, logging, cache, thêm header `Accept-Language`.

**Lưu ý / bẫy thường gặp:**
- `HttpRequest` là **immutable** → phải `req.clone()`.
- Thứ tự interceptor: request đi theo thứ tự khai báo, response đi **ngược lại**.
- Dùng `HttpContext` + `HttpContextToken` để bật/tắt interceptor cho từng request (vd bỏ qua loading spinner).
- Class interceptor cũ cần `withInterceptorsFromDi()`.

# State management & Performance

## Quản lý state trong Angular: service + signals hay NgRx? [senior]
Có nhiều mức độ, chọn theo độ phức tạp:

| Cách | Khi nào dùng |
|---|---|
| State cục bộ trong component (`signal`) | State chỉ một component dùng |
| **Service + signals** (hoặc BehaviorSubject) | Phần lớn ứng dụng: state chia sẻ giữa vài màn hình |
| **NgRx SignalStore** | Muốn cấu trúc chuẩn, nhẹ, dựa trên signal |
| **NgRx Store** (Redux) | App lớn, nhiều team, state phức tạp, cần DevTools/time-travel, quy trình chặt |

### Service + signals
```typescript
@Injectable({ providedIn: 'root' })
export class EmployeeStore {
  private api = inject(EmployeeService);
  private readonly _employees = signal<Employee[]>([]);
  private readonly _loading = signal(false);

  readonly employees = this._employees.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly activeCount = computed(() => this._employees().filter(e => e.active).length);

  async load() {
    this._loading.set(true);
    try { this._employees.set(await firstValueFrom(this.api.getAll())); }
    finally { this._loading.set(false); }
  }
  remove(id: string) { this._employees.update(list => list.filter(e => e.id !== id)); }
}
```

### NgRx Store — luồng một chiều
`Component` dispatch **Action** → **Reducer** (pure function) tạo state mới → **Selector** đọc state (memoized) → **Effect** xử lý side effect (gọi API) và dispatch action mới.

| | Service + signals | NgRx Store |
|---|---|---|
| Boilerplate | Ít | Nhiều (action, reducer, effect, selector) |
| Debug | Thường | Redux DevTools, time-travel |
| Learning curve | Thấp | Cao |
| Tính nhất quán team lớn | Phụ thuộc kỷ luật | Bắt buộc theo pattern |

**Lưu ý / bẫy thường gặp:** không nên đưa **mọi thứ** vào global store (form state, UI tạm thời). Câu trả lời senior: "bắt đầu với service + signals, chuyển sang NgRx khi thực sự có nhu cầu".

## trackBy / track trong @for có tác dụng gì? [junior]
Khi danh sách thay đổi, Angular cần biết phần tử nào là **cùng một item** để **tái sử dụng DOM node** thay vì xoá và tạo lại toàn bộ.

### Built-in control flow (v17+) — `track` là **bắt buộc**
```html
@for (emp of employees(); track emp.id; let i = $index, last = $last) {
  <app-employee-row [employee]="emp" [index]="i" [class.last]="last" />
} @empty {
  <p>Không có nhân viên nào</p>
}
```

### `*ngFor` cũ — `trackBy` là tuỳ chọn
```typescript
trackById = (index: number, emp: Employee) => emp.id;
```
```html
<app-employee-row *ngFor="let emp of employees; trackBy: trackById" [employee]="emp" />
```

**Không có track hợp lý** (track theo object reference) mà dữ liệu được fetch lại từ API → mọi object là reference mới → Angular **huỷ và tạo lại toàn bộ DOM** và component con: chậm, mất focus/scroll/state của input, animation chạy lại.

**Chọn key gì:**
- **ID duy nhất, ổn định** (`emp.id`) — tốt nhất.
- `$index` — chỉ khi list tĩnh, không sắp xếp/chèn/xoá.
- `track emp` (reference) — chỉ khi object không bị thay reference.

**Biến ngữ cảnh của `@for`:** `$index`, `$first`, `$last`, `$even`, `$odd`, `$count`.

**Lưu ý / bẫy thường gặp:** `@for` mới dùng thuật toán diffing nhanh hơn `ngFor` đáng kể. Dùng key không duy nhất sẽ có cảnh báo `NG0955` ở dev mode.

## Built-in control flow (@if, @for, @switch) khác gì *ngIf, *ngFor? [junior]
Từ **Angular 17**, template có cú pháp control flow tích hợp sẵn trong compiler (stable từ v18), thay thế structural directive `*ngIf`, `*ngFor`, `*ngSwitch`.

```html
@if (user(); as u) {
  <p>Xin chào {{ u.name }}</p>
} @else if (loading()) {
  <app-spinner />
} @else {
  <a routerLink="/login">Đăng nhập</a>
}

@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>Danh sách trống</li>
}

@switch (status()) {
  @case ('active') { <span class="green">Đang làm việc</span> }
  @case ('leave') { <span class="orange">Nghỉ phép</span> }
  @default { <span>Không xác định</span> }
}
```

| | `*ngIf` / `*ngFor` | `@if` / `@for` |
|---|---|---|
| Import | Cần `CommonModule`/`NgIf`/`NgFor` | Không cần import |
| `else` | `<ng-template #elseBlock>` lủng củng | `@else`, `@else if` |
| Empty state | Tự viết `*ngIf="list.length === 0"` | `@empty` |
| `track` | Tuỳ chọn (`trackBy` function) | **Bắt buộc**, viết inline |
| Hiệu năng | Chậm hơn | Diffing nhanh hơn, bundle nhỏ hơn |
| Type narrowing | Hạn chế | Tốt hơn |
| Zoneless | Ổn | Tối ưu |

**Migration:** `ng generate @angular/core:control-flow`.

**Thêm:** `@let` (v18.1) khai báo biến cục bộ trong template: `@let total = price() * qty();`. `@defer` cho lazy loading một phần template.

**Lưu ý:** `*ngIf`, `*ngFor` đã bị **deprecated** từ v20.

## @defer (deferrable views) là gì? [mid]
**`@defer`** (Angular 17) cho phép **lazy load một phần template** — component, directive, pipe bên trong block được tách thành **chunk JS riêng** và chỉ tải khi trigger xảy ra. Đây là lazy loading ở mức **template**, không cần router.

```html
@defer (on viewport; prefetch on idle) {
  <app-salary-chart [data]="salaryData()" />
} @placeholder (minimum 300ms) {
  <div class="chart-skeleton"></div>
} @loading (after 100ms; minimum 500ms) {
  <app-spinner />
} @error {
  <p>Không tải được biểu đồ</p>
}
```

**Triggers:**
| Trigger | Ý nghĩa |
|---|---|
| `on idle` (mặc định) | Khi trình duyệt rảnh (`requestIdleCallback`) |
| `on viewport` | Khi placeholder xuất hiện trong viewport (IntersectionObserver) |
| `on interaction` | Khi user click/keydown vào placeholder |
| `on hover` | Khi rê chuột |
| `on immediate` | Ngay sau khi render xong phần không defer |
| `on timer(2s)` | Sau thời gian |
| `when condition` | Khi biểu thức `true` |
| `prefetch on ...` | Tải trước code, render sau |

**Điều kiện để thực sự lazy:** component bên trong phải **standalone** và **không được tham chiếu ở nơi khác** trong cùng file (không dùng trong `viewChild`, không import static ở chỗ khác).

**Ứng dụng:** biểu đồ, editor rich-text, comment section, tab/modal ít dùng, phần nằm dưới fold.

**SSR & hydration:** v19 thêm **incremental hydration**: `@defer (hydrate on viewport)` — server render HTML đầy đủ, client chỉ hydrate khi cần.

## Những kỹ thuật tối ưu hiệu năng ứng dụng Angular? [senior]
### Runtime / change detection
- **OnPush** cho mọi component + **Signals**; hướng tới **zoneless**.
- `track` đúng trong `@for`; **virtual scroll** (`cdk-virtual-scroll-viewport`) cho list hàng nghìn dòng.
- Tránh gọi function/getter nặng trong template → dùng **pure pipe** hoặc `computed()`.
- `NgZone.runOutsideAngular()` cho event tần suất cao (scroll, mousemove, WebSocket, chart).
- Debounce input, `distinctUntilChanged`, huỷ request thừa bằng `switchMap`.
- Unsubscribe đúng cách để tránh memory leak.

### Load time / bundle
- **Lazy loading route** (`loadComponent`, `loadChildren`) + preloading strategy hợp lý.
- **`@defer`** cho phần nặng không cần ngay.
- Standalone component + tree-shaking; tránh import cả thư viện (`lodash` → `lodash-es` hoặc hàm riêng).
- **Budgets** trong `angular.json` để chặn bundle phình.
- Build production: AOT, minify, esbuild (`application` builder từ v17).
- `NgOptimizedImage` (`ngSrc`): lazy load ảnh, `priority` cho LCP, srcset tự động.
- **SSR + hydration** cho First Contentful Paint / SEO.

### Network
- Cache HTTP (`shareReplay`, interceptor cache, `withHttpTransferCacheOptions` khi SSR).
- Phân trang / infinite scroll phía server, không tải hết dữ liệu.
- Service Worker (`@angular/pwa`) cho cache tĩnh.

### Đo lường trước khi tối ưu
- **Angular DevTools** (Profiler xem component nào CD lâu), Chrome Performance, Lighthouse.
- `source-map-explorer` / `esbuild` metafile để phân tích bundle.

**Lưu ý:** nêu được "đo trước, tối ưu sau" và ví dụ thực tế đã làm (vd "chuyển bảng 5000 dòng sang virtual scroll + OnPush, giảm thời gian render từ 2s xuống 200ms") là điểm cộng lớn.

# SSR, Build, Testing & Versions

## SSR và Hydration trong Angular là gì? [senior]
**SSR (Server-Side Rendering)**: render HTML của trang trên server (Node.js, Express) và gửi về trình duyệt → người dùng thấy nội dung sớm hơn (FCP/LCP tốt), **SEO** và preview khi share link tốt hơn. Trước v17 gọi là **Angular Universal**; từ v17 tích hợp vào `@angular/ssr`.

```bash
ng new my-app --ssr
ng add @angular/ssr          # thêm vào app có sẵn
```

**Hydration** (v16, stable v17): client **tái sử dụng DOM** do server render, gắn event listener và state, thay vì **xoá và render lại** toàn bộ (gây nhấp nháy, layout shift).
```typescript
providers: [
  provideClientHydration(
    withEventReplay(),              // v18: ghi lại click trước khi hydrate xong, replay sau
    withIncrementalHydration(),     // v19: hydrate từng @defer block khi cần
    withHttpTransferCacheOptions({ includePostRequests: false }), // không gọi lại API đã gọi ở server
  ),
]
```

**Các mode khác:**
- **SSG / Prerendering**: render HTML lúc build cho trang tĩnh.
- **Hybrid rendering** (v19): cấu hình từng route là `Server`, `Client` hoặc `Prerender` qua `ServerRoute`.

**Lưu ý / bẫy thường gặp:**
- Code chạy trên server **không có** `window`, `document`, `localStorage` → dùng `isPlatformBrowser(inject(PLATFORM_ID))`, `inject(DOCUMENT)`, hoặc `afterNextRender()` cho code chỉ chạy ở browser.
- Thao tác DOM trực tiếp (jQuery, `innerHTML`) làm DOM lệch với server → lỗi hydration mismatch `NG0500`; có thể dùng `ngSkipHydration` tạm thời.
- Timer/observable không complete trên server làm request SSR không bao giờ trả về (app không "stable").

## AOT và JIT compilation khác nhau thế nào? [mid]
Angular template (HTML + binding) phải được **compile** thành JavaScript instruction (render function của Ivy) trước khi chạy.

| | JIT (Just-in-Time) | AOT (Ahead-of-Time) |
|---|---|---|
| Thời điểm compile | Trên **trình duyệt** lúc runtime | Lúc **build** |
| Bundle | Phải kèm Angular compiler (~lớn) | Không cần compiler, nhỏ hơn |
| Khởi động | Chậm hơn (phải compile) | Nhanh hơn |
| Phát hiện lỗi template | Lúc runtime | Lúc **build** |
| Bảo mật | Có rủi ro injection template động | An toàn hơn, ít eval |
| Tree-shaking | Kém | Tốt |

**Hiện tại:** từ Angular 9 (**Ivy** engine), **AOT là mặc định** cho cả `ng serve` và `ng build`. JIT hầu như chỉ còn dùng trong một số kịch bản test cũ hoặc compile component động lúc runtime.

**Ivy engine (v9+) mang lại:**
- **Locality**: mỗi component compile độc lập → build incremental nhanh.
- Tree-shakable instructions, bundle nhỏ hơn View Engine.
- Nền tảng cho standalone component, signals.

**Build system:** từ v17, builder mặc định là **`application`** dùng **esbuild + Vite** (dev server), nhanh hơn nhiều so với webpack cũ.

**Strict template checking:** bật `strictTemplates: true` trong `tsconfig.json` (`angularCompilerOptions`) để AOT kiểm tra kiểu trong template chặt chẽ.

**Lưu ý / bẫy thường gặp:** một số pattern chạy được với JIT nhưng lỗi khi AOT, ví dụ dùng function call/arrow function không export được trong metadata decorator, hoặc template tham chiếu field `private`.

## Unit test component trong Angular với TestBed như thế nào? [mid]
**TestBed** tạo một môi trường Angular giả lập (testing module) để khởi tạo component/service với DI, render template và kiểm tra DOM.

```typescript
describe('EmployeeListComponent', () => {
  let fixture: ComponentFixture<EmployeeListComponent>;
  let serviceSpy: jasmine.SpyObj<EmployeeService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('EmployeeService', ['getAll']);
    serviceSpy.getAll.and.returnValue(of([{ id: '1', name: 'An' }, { id: '2', name: 'Bình' }]));

    await TestBed.configureTestingModule({
      imports: [EmployeeListComponent],                         // standalone: đưa vào imports
      providers: [{ provide: EmployeeService, useValue: serviceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeListComponent);
    fixture.detectChanges();                                     // chạy ngOnInit + render
  });

  it('should render employees', () => {
    const rows = fixture.nativeElement.querySelectorAll('li');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('An');
  });

  it('should set input', () => {
    fixture.componentRef.setInput('pageSize', 10);              // cho signal input
    fixture.detectChanges();
  });
});
```

**Test HTTP service:**
```typescript
TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
const httpMock = TestBed.inject(HttpTestingController);
service.getAll().subscribe(data => expect(data.length).toBe(1));
httpMock.expectOne('/api/employees').flush([{ id: '1' }]);
httpMock.verify();
```

**Async:** `fakeAsync` + `tick()`/`flush()` (cần zone.js), `waitForAsync`, hoặc `await fixture.whenStable()` (zoneless).

**Các công cụ khác:** `RouterTestingHarness`, Component Harness của Angular CDK/Material, `@testing-library/angular`, `ng-mocks`.

**Lưu ý / bẫy thường gặp:** quên `fixture.detectChanges()` nên DOM không cập nhật; test OnPush component cần `setInput()` thay vì gán trực tiếp field.

## Jasmine/Karma và Jest khác nhau thế nào? Angular đang hướng tới gì? [mid]
| | Jasmine + Karma | Jest |
|---|---|---|
| Môi trường | Chạy trong **trình duyệt thật** (Chrome) | **Node.js** với jsdom |
| Tốc độ | Chậm hơn (khởi động browser, bundle) | Nhanh hơn, chạy song song |
| Watch mode | Có | Thông minh hơn (chỉ chạy test liên quan) |
| Mock | `jasmine.createSpyObj`, `spyOn` | `jest.fn()`, `jest.mock()` module mocking mạnh |
| Snapshot test | Không | Có |
| Mặc định Angular CLI | Có (đến v19) | Cần cấu hình (`jest-preset-angular`) hoặc builder experimental |

```typescript
// Jasmine
const spy = jasmine.createSpyObj('Api', ['get']);
spy.get.and.returnValue(of([]));
expect(spy.get).toHaveBeenCalledWith('1');

// Jest
const api = { get: jest.fn().mockReturnValue(of([])) };
expect(api.get).toHaveBeenCalledWith('1');
```

**Xu hướng:**
- **Karma đã deprecated** (thông báo 2023).
- Angular CLI thêm builder experimental cho **Jest** (v16) và **Web Test Runner**.
- Từ v20-21, Angular chuyển hướng sang **Vitest** làm test runner mặc định cho project mới.
- **E2E**: Protractor đã bị khai tử (v15); dùng **Cypress** hoặc **Playwright**.

**Câu trả lời thực tế:** "Dự án mới tôi ưu tiên Jest/Vitest vì nhanh và DX tốt; với dự án cũ dùng Karma có thể migrate dần vì cú pháp `describe/it/expect` gần như tương thích."

**Lưu ý / bẫy thường gặp:** jsdom không có layout thật (`getBoundingClientRect` trả 0), nên test phụ thuộc layout cần browser thật hoặc E2E.

## Các tính năng nổi bật từ Angular 14 đến 19? [mid]
| Phiên bản | Năm | Điểm nổi bật |
|---|---|---|
| **14** | 2022 | **Standalone components** (preview), **Typed Reactive Forms**, `inject()` function, route `title`, `ENVIRONMENT_INITIALIZER` |
| **15** | 2022 | Standalone **stable**, **functional guards/resolvers/interceptors**, `provideRouter`/`provideHttpClient`, **directive composition** (`hostDirectives`), `NgOptimizedImage` stable, bỏ Protractor |
| **16** | 2023 | **Signals** (preview), `takeUntilDestroyed`, `DestroyRef`, **required inputs**, input `transform`, `withComponentInputBinding()`, **non-destructive hydration** (preview), esbuild dev preview |
| **17** | 2023 | **Built-in control flow** `@if/@for/@switch`, **`@defer`**, Signals stable, `application` builder (esbuild + Vite) mặc định, **SSR tích hợp** `@angular/ssr`, hydration stable, logo/docs mới **angular.dev**; v17.1–17.3: `input()`, `model()`, `output()`, signal queries |
| **18** | 2024 | **Zoneless** experimental, control flow & `@defer` stable, **event replay**, `@let` (18.1), route redirect dạng function, fallback content cho `ng-content` |
| **19** | 2024 | **Standalone mặc định** (`standalone: true` không cần ghi), **incremental hydration**, hybrid rendering / route-level render mode, `linkedSignal()`, **`resource()`/`rxResource()`** (experimental), signal input/output/queries stable, HMR cho style/template, `afterRenderEffect` |

**Sau đó (bổ sung):** v20 (2025) — zoneless và các signal API stable, deprecated `*ngIf/*ngFor`, style guide mới (bỏ hậu tố `.component`); v21 — Signal Forms (experimental), Vitest mặc định.

**Lưu ý / bẫy thường gặp:** Angular release **major mỗi 6 tháng**, mỗi version được hỗ trợ **18 tháng** (6 tháng active + 12 tháng LTS). Nâng cấp nên đi **từng major một** với `ng update` và tham khảo **update.angular.dev**.
