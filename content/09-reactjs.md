---
id: reactjs
title: ReactJS
icon: ⚛️
order: 9
description: JavaScript core, cơ chế render, Hooks, React 18/19, tối ưu hiệu năng, state management, testing và bảo mật trong React.
---

# JavaScript core cho React

## Closure là gì và liên quan gì đến React? [junior]
**Closure** là khi một function "nhớ" được các biến trong scope nơi nó được tạo ra, kể cả khi scope đó đã kết thúc.

- Mỗi lần component render, mọi function bên trong (event handler, callback trong `useEffect`) là closure "chụp" lại giá trị `props`/`state` **của lần render đó**.
- Đây là nguồn gốc của lỗi **stale closure**: callback cũ vẫn đọc state cũ.

```javascript
function makeCounter() {
  let count = 0;
  return () => ++count; // nhớ biến count
}
const inc = makeCounter();
inc(); // 1
inc(); // 2
```

**Lưu ý / bẫy thường gặp:** `setInterval(() => setCount(count + 1), 1000)` trong `useEffect` với deps `[]` sẽ luôn cộng từ giá trị `count` ban đầu. Sửa bằng functional update `setCount(c => c + 1)`.

## `this` trong JavaScript hoạt động thế nào? [junior]
Giá trị `this` được xác định **lúc gọi hàm**, không phải lúc định nghĩa (trừ arrow function).

| Cách gọi | `this` |
|---|---|
| `obj.method()` | `obj` |
| `fn()` (strict mode) | `undefined` |
| `new Fn()` | object mới |
| `fn.call(ctx)` / `apply` / `bind` | `ctx` |
| Arrow function | lấy `this` từ scope bao ngoài (lexical) |

Trong class component cũ, phải `this.handleClick = this.handleClick.bind(this)` hoặc dùng class field arrow function, vì khi truyền `onClick={this.handleClick}` hàm bị tách khỏi object nên mất `this`. Function component + Hooks loại bỏ hoàn toàn vấn đề này.

## Giải thích Event Loop, microtask và macrotask. [mid]
JavaScript chạy **single-thread**. Event loop điều phối:

1. Chạy hết **call stack** (code đồng bộ).
2. Chạy **toàn bộ microtask queue**: `Promise.then`, `queueMicrotask`, `MutationObserver`.
3. Browser có thể render (requestAnimationFrame, paint).
4. Lấy **một macrotask**: `setTimeout`, `setInterval`, I/O, sự kiện UI. Quay lại bước 1.

```javascript
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
// A D C B
```

**Lưu ý / bẫy thường gặp:** Microtask chạy liên tục có thể "chặn" render. Tác vụ nặng đồng bộ sẽ đóng băng UI – đó là lý do React 18 có concurrent rendering (chia nhỏ công việc, nhường main thread).

## Promise và async/await khác nhau thế nào? [junior]
`async/await` là **cú pháp** viết trên nền Promise, giúp code bất đồng bộ đọc như đồng bộ.

- `async` function luôn trả về Promise.
- `await` tạm dừng function cho tới khi Promise settle; lỗi được bắt bằng `try/catch`.
- Promise chain dùng `.then().catch()`.

```javascript
// Chạy song song – đừng await tuần tự khi không phụ thuộc
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

| Tiện ích | Hành vi |
|---|---|
| `Promise.all` | fail nếu 1 promise reject |
| `Promise.allSettled` | chờ tất cả, trả về trạng thái từng cái |
| `Promise.race` | promise settle đầu tiên |
| `Promise.any` | promise fulfill đầu tiên |

**Lưu ý / bẫy thường gặp:** callback của `useEffect` không được là `async` (vì nó phải trả về cleanup hoặc undefined) – hãy định nghĩa async function bên trong rồi gọi.

## `==` và `===` khác nhau thế nào? [junior]
- `===` (strict equality): so sánh **giá trị và kiểu**, không ép kiểu.
- `==` (loose equality): **ép kiểu** trước khi so sánh, dễ cho kết quả bất ngờ.

```javascript
0 == '0';        // true
0 == '';         // true
null == undefined; // true
null === undefined; // false
NaN === NaN;     // false -> dùng Number.isNaN
```

Với object/array, cả hai đều so sánh **tham chiếu**: `{} === {}` là `false`. Đây chính là cách React so sánh props/deps (`Object.is`), nên object tạo mới mỗi render sẽ luôn bị coi là "thay đổi".

**Best practice:** luôn dùng `===`, chỉ dùng `x == null` khi muốn bắt cả `null` lẫn `undefined`.

## So sánh `var`, `let`, `const`. [junior]
| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | function | block | block |
| Hoisting | có, khởi tạo `undefined` | có, nhưng nằm trong TDZ | có, TDZ |
| Gán lại | được | được | không |
| Khai báo lại | được | không | không |

```javascript
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j)); // 0 1 2
```

**Lưu ý / bẫy thường gặp:** `const` không làm object bất biến – `const arr = []; arr.push(1)` vẫn hợp lệ. Muốn bất biến nông dùng `Object.freeze`.

## Shallow copy và deep copy khác nhau thế nào? Tại sao quan trọng trong React? [mid]
- **Shallow copy** chỉ sao chép cấp đầu tiên; object lồng bên trong vẫn chung tham chiếu: spread `{...obj}`, `[...arr]`, `Object.assign`.
- **Deep copy** sao chép toàn bộ cây: `structuredClone(obj)` (hiện đại), lodash `cloneDeep`. `JSON.parse(JSON.stringify())` mất `Date`, `undefined`, function, `Map`.

React yêu cầu cập nhật state **immutable**: tạo object mới ở mọi cấp bị thay đổi để React nhận ra khác tham chiếu.

```javascript
setUser(prev => ({
  ...prev,
  address: { ...prev.address, city: 'Hà Nội' },
}));
```

**Lưu ý / bẫy thường gặp:** mutate trực tiếp (`state.items.push(x); setState(state)`) khiến React bỏ qua re-render. Với state lồng sâu, dùng **Immer** (có sẵn trong Redux Toolkit) hoặc làm phẳng state.

# Nền tảng React: Virtual DOM, JSX, Props/State

## Virtual DOM là gì và reconciliation hoạt động thế nào? [junior]
**Virtual DOM** là cây object JavaScript mô tả UI. Khi state thay đổi, React tạo cây mới, **diff** với cây cũ (reconciliation) rồi chỉ áp dụng các thay đổi tối thiểu lên DOM thật (commit).

Thuật toán diff dùng heuristic O(n):
- Khác **type** element (ví dụ `<div>` → `<span>`, hoặc `ComponentA` → `ComponentB`) → hủy cả subtree và mount lại (state mất).
- Cùng type → giữ DOM node/instance, chỉ cập nhật thuộc tính.
- Danh sách con được ghép cặp bằng **key**.

**Lưu ý / bẫy thường gặp:** Virtual DOM không "nhanh hơn DOM" tuyệt đối; giá trị của nó là mô hình lập trình declarative với hiệu năng đủ tốt. Định nghĩa component bên trong component khác tạo type mới mỗi render → mount lại liên tục, mất state.

## React Fiber là gì? [senior]
**Fiber** là kiến trúc reconciler viết lại từ React 16. Mỗi fiber là một đơn vị công việc tương ứng một node trong cây, dạng linked list (`child`, `sibling`, `return`).

Hai pha:
- **Render phase**: tính toán thay đổi, **có thể ngắt quãng, tạm dừng, bỏ đi** (pure, không side effect).
- **Commit phase**: áp dụng lên DOM, chạy `useLayoutEffect`, sau đó `useEffect` – **đồng bộ, không ngắt được**.

Fiber cho phép:
- Ưu tiên công việc theo **lanes** (input của user > render dữ liệu nền).
- **Time slicing**: nhường main thread cho browser mỗi ~5ms.
- Nền tảng cho Concurrent features, Suspense, transitions.
- Double buffering: `current` tree và `workInProgress` tree.

**Lưu ý / bẫy thường gặp:** vì render phase có thể chạy nhiều lần, component phải pure. StrictMode cố tình render 2 lần trong dev để phát hiện side effect.

## Tại sao cần `key` khi render list? Dùng index làm key có sao không? [junior]
`key` giúp React xác định item nào được thêm, xóa, di chuyển giữa các lần render, để tái sử dụng đúng DOM node và state.

- Key phải **ổn định, duy nhất trong cùng danh sách anh em** – thường là `id` từ dữ liệu.
- Dùng **index** chỉ ổn khi list tĩnh, không sắp xếp/lọc/chèn.

```jsx
{todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
```

**Lưu ý / bẫy thường gặp:**
- Index làm key + chèn item đầu list → state nội bộ (input đang gõ, checkbox) bị "dịch" sang item khác.
- `key={Math.random()}` khiến mọi item remount mỗi render.
- Mẹo: đổi `key` của component để **reset toàn bộ state** của nó (`<Form key={userId} />`).

## JSX là gì và được biên dịch ra sao? [junior]
**JSX** là cú pháp mở rộng cho phép viết markup trong JavaScript. Nó được compiler (Babel, SWC, esbuild) chuyển thành lời gọi hàm.

```jsx
const el = <Button color="blue">Lưu</Button>;
// New JSX transform (React 17+):
// import { jsx as _jsx } from 'react/jsx-runtime';
// _jsx(Button, { color: 'blue', children: 'Lưu' });
```

Điểm cần nhớ:
- Dùng `className`, `htmlFor`, camelCase cho event (`onClick`).
- Biểu thức trong `{}`, không dùng được statement (`if`, `for`) – dùng ternary, `&&`, `map`.
- Phải có một root – dùng Fragment `<>...</>`.
- JSX tự escape chuỗi → chống XSS mặc định.

**Lưu ý / bẫy thường gặp:** `{count && <Badge />}` khi `count = 0` sẽ render chữ `0`. Dùng `{count > 0 && ...}`.

## Props và State khác nhau thế nào? [junior]
| | Props | State |
|---|---|---|
| Nguồn | Component cha truyền xuống | Component tự quản lý |
| Thay đổi | Read-only với component con | Thay đổi qua setter |
| Mục đích | Cấu hình component | Dữ liệu thay đổi theo thời gian/tương tác |
| Trigger re-render | Khi cha re-render với props mới | Khi gọi setter với giá trị khác |

Data flow trong React là **một chiều (top-down)**. Con muốn thay đổi dữ liệu của cha thì cha truyền callback xuống.

Nguyên tắc:
- Không copy props vào state (trừ khi cần giá trị khởi tạo) – dễ lệch dữ liệu.
- Giá trị tính được từ props/state thì **tính trực tiếp khi render**, không lưu thành state riêng.
- **Lifting state up**: đưa state lên component cha chung gần nhất khi nhiều con cần dùng.

## Controlled và uncontrolled component khác nhau thế nào? [junior]
- **Controlled**: giá trị input do React state quản lý (`value` + `onChange`). Single source of truth, dễ validate, format theo thời gian thực.
- **Uncontrolled**: DOM tự giữ giá trị, đọc qua `ref` hoặc `FormData` khi submit (`defaultValue`).

```jsx
// Controlled
const [name, setName] = useState('');
<input value={name} onChange={e => setName(e.target.value)} />

// Uncontrolled
const ref = useRef(null);
<input defaultValue="" ref={ref} />
```

| | Controlled | Uncontrolled |
|---|---|---|
| Re-render mỗi lần gõ | Có | Không |
| Validate tức thì | Dễ | Khó hơn |
| Hiệu năng form lớn | Kém hơn | Tốt |

**Lưu ý / bẫy thường gặp:** chuyển từ `value={undefined}` sang có giá trị gây cảnh báo "uncontrolled to controlled" – khởi tạo bằng `''`. React Hook Form dùng hướng uncontrolled để tối ưu.

# React Hooks

## `useState` hoạt động thế nào? Batching và functional update là gì? [junior]
`useState` trả về `[state, setState]`. Gọi setter **không đổi state ngay** mà lên lịch re-render; trong lần render hiện tại `state` vẫn là giá trị cũ (snapshot).

**Batching**: nhiều lần set trong cùng một event được gộp thành một lần render. Từ React 18, batching áp dụng **mọi nơi** (setTimeout, promise, native event).

```jsx
// Sai: chỉ tăng 1
setCount(count + 1);
setCount(count + 1);

// Đúng: functional update dựa trên giá trị mới nhất
setCount(c => c + 1);
setCount(c => c + 1);
```

Thêm:
- **Lazy initial state**: `useState(() => expensiveInit())` chỉ chạy lần đầu.
- Set cùng giá trị (`Object.is`) → React bỏ qua re-render.

**Lưu ý / bẫy thường gặp:** `console.log(state)` ngay sau `setState` vẫn in giá trị cũ.

## `useEffect` hoạt động thế nào? Giải thích dependency array và cleanup. [junior]
`useEffect` dùng để **đồng bộ component với hệ thống bên ngoài** (API, subscription, DOM, timer). Chạy **sau khi commit và browser paint**.

| Deps | Khi chạy |
|---|---|
| Không truyền | Sau mỗi lần render |
| `[]` | Một lần sau mount |
| `[a, b]` | Khi `a` hoặc `b` thay đổi (`Object.is`) |

**Cleanup** chạy trước lần effect kế tiếp và khi unmount.

```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(() => {});
  return () => controller.abort(); // tránh race condition
}, [id]);
```

**Lưu ý / bẫy thường gặp:** StrictMode trong dev chạy mount → cleanup → mount để kiểm tra cleanup đúng. Không dùng effect để tính dữ liệu dẫn xuất hay xử lý event của user ("You Might Not Need an Effect").

## Stale closure trong `useEffect` là gì và cách xử lý? [mid]
Effect/callback "chụp" giá trị props/state tại lần render nó được tạo. Nếu deps thiếu biến đó, effect tiếp tục dùng giá trị cũ.

```jsx
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1); // count luôn = 0
  }, 1000);
  return () => clearInterval(id);
}, []);
```

Cách xử lý:
1. **Khai báo đủ deps** (bật rule `react-hooks/exhaustive-deps`).
2. **Functional update**: `setCount(c => c + 1)` – không cần `count` trong deps.
3. **`useReducer`**: dispatch ổn định, logic nằm trong reducer.
4. **`useRef`** lưu giá trị mới nhất (`latestRef.current = value`) để đọc trong callback lâu dài.
5. React 19.2: **`useEffectEvent`** tách phần "đọc giá trị mới nhất nhưng không phải dependency".

**Lưu ý / bẫy thường gặp:** đừng tắt lint rule để "chữa" – thường đó là dấu hiệu thiết kế effect sai.

## `useLayoutEffect` khác `useEffect` thế nào? [mid]
| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Thời điểm | Sau khi browser paint (async) | Sau khi DOM mutate, **trước paint** (sync) |
| Chặn paint | Không | Có |
| Dùng cho | Fetch, subscription, logging | Đo kích thước/vị trí DOM rồi set state để tránh "nháy" |

```jsx
useLayoutEffect(() => {
  const { height } = tooltipRef.current.getBoundingClientRect();
  setTop(anchorTop - height);
}, [anchorTop]);
```

**Lưu ý / bẫy thường gặp:** `useLayoutEffect` không chạy trên server (SSR sẽ cảnh báo trong phiên bản cũ). Lạm dụng làm chậm hiển thị. Mặc định dùng `useEffect`, chỉ chuyển khi thấy flicker. Ngoài ra có `useInsertionEffect` dành cho thư viện CSS-in-JS.

## `useRef` dùng để làm gì? [junior]
`useRef` trả về object `{ current }` **tồn tại suốt vòng đời component**; thay đổi `.current` **không gây re-render**.

Hai mục đích chính:
1. **Tham chiếu DOM**: focus, scroll, đo kích thước, tích hợp thư viện non-React.
2. **Lưu giá trị mutable** không ảnh hưởng UI: timer id, giá trị trước đó, cờ `isMounted`, giá trị mới nhất cho callback.

```jsx
function SearchInput() {
  const inputRef = useRef(null);
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}
```

React 19: `ref` là **prop bình thường** cho function component, không cần `forwardRef`; ref callback có thể trả về cleanup.

**Lưu ý / bẫy thường gặp:** không đọc/ghi `ref.current` trong lúc render (trừ lazy init) – làm component không pure. Dữ liệu cần hiển thị thì dùng state.

## `useMemo` và `useCallback` khác nhau thế nào? Khi nào nên dùng? [mid]
- `useMemo(() => compute(a), [a])` – memo **giá trị** trả về.
- `useCallback(fn, [deps])` – memo **chính function** (tương đương `useMemo(() => fn, deps)`).

Khi nào nên dùng:
- Tính toán **thực sự tốn kém** (lọc/sort list lớn).
- Giữ **ổn định tham chiếu** cho prop truyền vào component bọc `React.memo`.
- Giá trị/hàm nằm trong deps của effect hoặc hook khác.

```jsx
const visible = useMemo(() => todos.filter(t => t.done === showDone), [todos, showDone]);
const handleSelect = useCallback(id => setSelected(id), []);
return <MemoList items={visible} onSelect={handleSelect} />;
```

**Lưu ý / bẫy thường gặp:** `useCallback` không làm hàm chạy nhanh hơn; vô dụng nếu component con không memo. Memo có chi phí (so sánh deps, bộ nhớ). Với **React Compiler**, phần lớn memo thủ công không còn cần thiết.

## Khi nào dùng `useReducer` thay vì `useState`? [mid]
`useReducer(reducer, initialState)` phù hợp khi:
- State phức tạp, nhiều field liên quan nhau.
- State tiếp theo phụ thuộc state trước theo nhiều kiểu hành động.
- Muốn tách logic cập nhật khỏi component (dễ test – reducer là pure function).
- `dispatch` có tham chiếu **ổn định**, truyền xuống con/Context mà không gây re-render thừa.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'add':    return { ...state, items: [...state.items, action.item] };
    case 'remove': return { ...state, items: state.items.filter(i => i.id !== action.id) };
    default:       throw new Error('Unknown action');
  }
}
const [state, dispatch] = useReducer(reducer, { items: [] });
```

**Lưu ý / bẫy thường gặp:** reducer phải pure, không mutate state, không gọi API. Kết hợp `useReducer` + Context là mô hình "mini Redux" cho state cục bộ một feature.

## `useContext` hoạt động thế nào và có hạn chế gì? [mid]
Context cho phép truyền dữ liệu xuyên cây mà không **prop drilling**: `createContext` → `<Ctx.Provider value>` (React 19 có thể viết `<Ctx value>`) → `useContext(Ctx)`.

Hạn chế:
- **Mọi consumer re-render** khi `value` đổi tham chiếu, kể cả khi chỉ dùng một phần.
- Không có selector, không có devtools/middleware như Redux.
- Provider với `value={{ user, setUser }}` inline tạo object mới mỗi render.

```jsx
const value = useMemo(() => ({ user, login, logout }), [user]);
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```

Phù hợp: theme, locale, auth, dữ liệu **ít thay đổi**. Không phù hợp: state cập nhật liên tục (form, vị trí chuột) cho nhiều consumer.

**Lưu ý / bẫy thường gặp:** tách context theo mức độ thay đổi (state vs dispatch) và memo `value`.

## Custom hook là gì? Cho ví dụ. [mid]
Custom hook là function bắt đầu bằng `use` và gọi các hook khác, dùng để **tái sử dụng logic có state** (không phải tái sử dụng state – mỗi component gọi hook có state riêng).

```tsx
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Dùng
const q = useDebounce(searchText, 500);
```

Ví dụ phổ biến: `useFetch`, `useLocalStorage`, `useMediaQuery`, `useOnClickOutside`, `usePrevious`.

Best practice:
- Đặt tên theo mục đích, không theo cơ chế (`useOnlineStatus` thay vì `useEventListenerEffect`).
- Trả về giá trị ổn định (memo callback nếu cần).
- Không tạo custom hook chỉ để bọc `useEffect` vô nghĩa.

## Rules of Hooks là gì và tại sao tồn tại? [junior]
Hai quy tắc:
1. Chỉ gọi hook ở **top level** – không trong `if`, vòng lặp, nested function, sau `return` sớm.
2. Chỉ gọi hook trong **function component hoặc custom hook**.

Lý do: React lưu state của hook theo **thứ tự gọi** (linked list trên fiber). Nếu thứ tự thay đổi giữa các lần render, hook sẽ đọc nhầm state của nhau.

```jsx
// Sai
if (isLoggedIn) { const [x] = useState(0); }

// Đúng
const [x] = useState(0);
if (!isLoggedIn) return null;
```

Ngoại lệ: API **`use()`** của React 19 có thể gọi trong `if`/vòng lặp.

**Lưu ý / bẫy thường gặp:** dùng ESLint plugin `eslint-plugin-react-hooks` để phát hiện tự động.

## `useTransition` và `useDeferredValue` dùng khi nào? [senior]
Cả hai đánh dấu cập nhật là **non-urgent** để React ưu tiên tương tác của user (gõ phím, click).

- **`useTransition`**: bạn kiểm soát **setter** → bọc trong `startTransition`. Có `isPending` để hiện loading. React 19 cho phép async function trong transition (Actions).
- **`useDeferredValue`**: bạn chỉ có **giá trị** (thường từ props) → nhận về phiên bản "trễ" của nó.

```jsx
const [isPending, startTransition] = useTransition();
function onTabChange(tab) {
  startTransition(() => setTab(tab)); // render tab nặng không chặn UI
}

const deferredQuery = useDeferredValue(query);
const results = useMemo(() => search(deferredQuery), [deferredQuery]);
```

**Lưu ý / bẫy thường gặp:** không dùng transition cho input controlled (giá trị input phải cập nhật urgent). Khác debounce: không có delay cố định, render bị ngắt nếu có cập nhật mới, và chỉ hiệu quả khi component nặng được memo.

## `useId` dùng để làm gì? [mid]
`useId()` sinh ID **duy nhất và ổn định giữa server và client**, dùng cho thuộc tính accessibility (`htmlFor`, `aria-describedby`).

```jsx
function EmailField() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>Email</label>
      <input id={id} aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`}>Chúng tôi không chia sẻ email.</p>
    </>
  );
}
```

Tại sao không dùng `Math.random()` hay counter toàn cục: giá trị khác nhau giữa server và client → **hydration mismatch**; thứ tự render có thể khác khi streaming.

**Lưu ý / bẫy thường gặp:** không dùng `useId` làm `key` cho list – key phải đến từ dữ liệu.

# React 18 & 19: tính năng mới

## Concurrent rendering trong React 18 là gì? [senior]
Concurrent rendering cho phép React **chuẩn bị nhiều phiên bản UI cùng lúc** và **ngắt quãng** việc render để xử lý cập nhật ưu tiên cao hơn. Không phải đa luồng – vẫn single thread, nhưng render có thể tạm dừng/tiếp tục/bỏ.

Kích hoạt khi dùng `createRoot` và các API concurrent:
- `startTransition` / `useTransition`, `useDeferredValue`.
- Suspense cho data fetching, streaming SSR.

Lợi ích:
- UI vẫn phản hồi khi render cây lớn.
- Tránh hiện loading "giật" – giữ UI cũ trong lúc chuẩn bị UI mới.

Hệ quả cho developer:
- Render phải **pure** (có thể bị gọi nhiều lần).
- Store bên ngoài phải dùng `useSyncExternalStore` để tránh **tearing** (các component đọc giá trị khác nhau của cùng store trong một lần render).

## Automatic batching trong React 18 thay đổi gì? [mid]
React 17: chỉ batch trong React event handler. Trong `setTimeout`, promise, native listener, mỗi `setState` gây một lần render.

React 18 (với `createRoot`): **tự động batch ở mọi nơi**.

```jsx
fetch('/api').then(() => {
  setLoading(false);
  setData(d);   // React 18: 1 lần render; React 17: 2 lần
});
```

Muốn buộc render ngay (hiếm khi cần, ví dụ đọc DOM ngay sau update):

```jsx
import { flushSync } from 'react-dom';
flushSync(() => setOpen(true));
listRef.current.scrollTop = 0;
```

**Lưu ý / bẫy thường gặp:** code cũ dựa vào việc state được flush ngay trong async callback có thể đổi hành vi khi nâng cấp.

## Suspense hoạt động thế nào? [mid]
`<Suspense fallback={...}>` hiển thị fallback khi một component con **"suspend"** (chưa sẵn sàng), rồi thay bằng nội dung thật khi xong.

Nguồn có thể suspend:
- `React.lazy` (code splitting).
- Thư viện data hỗ trợ Suspense: TanStack Query (`useSuspenseQuery`), Relay, SWR.
- `use(promise)` trong React 19, Server Components async.

```jsx
<Suspense fallback={<Spinner />}>
  <Comments postId={id} />
</Suspense>
```

Điểm quan trọng:
- Suspense boundary lồng nhau → kiểm soát mức độ chi tiết loading.
- Kết hợp `startTransition` để **giữ UI cũ** thay vì nhảy về fallback khi chuyển trang.
- Streaming SSR: server gửi HTML từng phần theo Suspense boundary, selective hydration.
- Lỗi thì do **Error Boundary** xử lý, không phải Suspense.

**Lưu ý / bẫy thường gặp:** tạo promise mới trong mỗi render (không cache) với `use()` sẽ suspend vô hạn.

## Actions, `useActionState`, `useFormStatus` trong React 19 là gì? [senior]
**Actions**: function async được truyền vào transition hoặc `<form action={fn}>`. React tự quản lý pending state, lỗi, optimistic update và reset form.

- **`useActionState(action, initialState)`** → `[state, formAction, isPending]`: lưu kết quả lần submit gần nhất (thay `useFormState` cũ).
- **`useFormStatus()`**: đọc trạng thái `pending` của `<form>` cha – dùng trong nút submit con.

```jsx
async function updateName(prevState, formData) {
  const err = await saveName(formData.get('name'));
  return err ? { error: err } : { error: null };
}

function NameForm() {
  const [state, formAction, isPending] = useActionState(updateName, { error: null });
  return (
    <form action={formAction}>
      <input name="name" />
      <button disabled={isPending}>Lưu</button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
```

Trong Next.js, action có thể là **Server Action** (`'use server'`), form hoạt động cả khi JS chưa load (progressive enhancement).

## `useOptimistic` dùng để làm gì? [senior]
`useOptimistic` hiển thị **kết quả dự kiến ngay lập tức** trong khi action async đang chạy; khi action xong (thành công hoặc lỗi), state tự quay về giá trị thật.

```jsx
function Messages({ messages, sendAction }) {
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (state, newMsg) => [...state, { text: newMsg, sending: true }]
  );

  async function formAction(formData) {
    addOptimistic(formData.get('text'));
    await sendAction(formData);
  }

  return (
    <form action={formAction}>
      {optimistic.map((m, i) => <p key={i}>{m.text}{m.sending && ' (đang gửi)'}</p>)}
      <input name="text" />
    </form>
  );
}
```

Dùng cho: like, thêm comment, toggle todo – nơi tỉ lệ thành công cao và cần cảm giác tức thì.

**Lưu ý / bẫy thường gặp:** `addOptimistic` phải gọi bên trong Action/transition. Cần xử lý thông báo lỗi khi rollback. TanStack Query có cơ chế optimistic update tương tự qua `onMutate`.

## API `use()` trong React 19 là gì? [senior]
`use(resource)` đọc giá trị từ **Promise** hoặc **Context** ngay trong lúc render.

- Với Promise: component suspend cho tới khi resolve (cần Suspense bao ngoài), reject thì ném lên Error Boundary.
- Với Context: giống `useContext` nhưng **được gọi trong điều kiện/vòng lặp**.

```jsx
// Server Component tạo promise, truyền xuống Client Component
export default function Page() {
  const commentsPromise = getComments(); // không await
  return (
    <Suspense fallback={<p>Đang tải...</p>}>
      <Comments promise={commentsPromise} />
    </Suspense>
  );
}

'use client';
function Comments({ promise }) {
  const comments = use(promise);
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}
```

**Lưu ý / bẫy thường gặp:** không tạo promise trong Client Component mỗi render – promise phải được cache hoặc tạo từ Server Component/thư viện data. `use` không được gọi trong `try/catch`.

## React Compiler là gì? [senior]
**React Compiler** (stable từ cuối 2025, v1.0) là build-time compiler (plugin Babel/SWC) tự động **memoize** component và hook – thay thế phần lớn `useMemo`, `useCallback`, `React.memo` viết tay.

Cách hoạt động:
- Phân tích data flow của component, chỉ tính lại giá trị/JSX khi input liên quan thay đổi.
- Memo chi tiết hơn con người (cả từng phần JSX), kể cả sau điều kiện.

Yêu cầu:
- Code tuân thủ **Rules of React**: component/hook pure, không mutate props/state, tuân thủ rules of hooks.
- Code vi phạm sẽ bị compiler **bỏ qua** (không tối ưu) thay vì làm hỏng.

Áp dụng: bật `eslint-plugin-react-hooks` (có rule compiler), bật dần theo thư mục, có thể opt-out bằng directive `"use no memo"`.

**Lưu ý / bẫy thường gặp:** compiler không sửa lỗi thiết kế (state đặt sai chỗ, context quá to); vẫn cần profiler để đo.

## React Server Components (RSC) là gì? [senior]
**Server Components** là component **chỉ chạy trên server** (lúc build hoặc lúc request), output là một định dạng serialize (RSC payload) gửi về client; **code của chúng không nằm trong JS bundle**.

| | Server Component | Client Component |
|---|---|---|
| Directive | mặc định (trong framework hỗ trợ) | `'use client'` |
| Truy cập DB/filesystem/secret | Có | Không |
| `async/await` trực tiếp | Có | Không (dùng `use`) |
| State, effect, event handler | Không | Có |
| Ảnh hưởng bundle | 0 KB | Có |

- Server Component có thể render Client Component và truyền props **serializable**.
- Client Component không import được Server Component, nhưng nhận nó qua `children`/props.
- **Server Functions** (`'use server'`) cho phép client gọi function trên server.

**Lưu ý / bẫy thường gặp:** RSC khác SSR – SSR render component (cả client) ra HTML; RSC là mô hình component chạy trên server, có thể dùng cùng SSR. Cần framework (Next.js App Router, React Router v7 có hỗ trợ).

# Re-render và tối ưu hiệu năng

## Khi nào một component re-render? [junior]
Component re-render khi:
1. **State** của nó thay đổi (setter với giá trị khác theo `Object.is`).
2. **Component cha re-render** – mặc định toàn bộ con re-render, **bất kể props có đổi hay không**.
3. **Context** mà nó dùng đổi `value`.
4. Custom hook bên trong có state thay đổi.

Hiểu đúng:
- Re-render ≠ cập nhật DOM. Render là gọi function component; DOM chỉ đổi nếu kết quả diff khác.
- Props thay đổi **không** phải nguyên nhân độc lập – props đổi vì cha re-render.

Công cụ chẩn đoán: React DevTools Profiler ("Highlight updates", "Why did this render?"), `why-did-you-render`.

**Lưu ý / bẫy thường gặp:** re-render không xấu; chỉ tối ưu khi đo được render chậm.

## `React.memo` hoạt động thế nào? Khi nào nó vô dụng? [mid]
`React.memo(Component, areEqual?)` bỏ qua re-render nếu props **shallow equal** với lần trước.

```jsx
const Row = React.memo(function Row({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>;
});
```

`React.memo` vô dụng khi:
- Cha truyền **object/array/function inline** mới mỗi render: `style={{}}`, `onSelect={() => ...}`.
- Truyền `children` là JSX (luôn là object mới).
- Component dùng context hay thay đổi.

Cách khắc phục: `useCallback`/`useMemo` cho props, hoặc để React Compiler lo.

Kỹ thuật không cần memo:
- **Move state down**: đưa state xuống component con dùng nó.
- **Lift content up**: truyền phần nặng qua `children` – `children` được tạo ở cha phía trên nên không re-render khi wrapper đổi state.

**Lưu ý / bẫy thường gặp:** custom `areEqual` trả `true` nghĩa là "bằng nhau – không render" (ngược với `shouldComponentUpdate`).

## Làm sao tránh Context gây re-render toàn bộ cây? [senior]
Vấn đề: mọi consumer re-render khi `value` của Provider thay đổi.

Giải pháp:
1. **Memo value**: `useMemo(() => ({...}), [deps])` để không đổi tham chiếu vô cớ.
2. **Tách context** theo tần suất thay đổi và theo nhóm dữ liệu: `ThemeContext`, `UserContext`; tách `StateContext` và `DispatchContext` (dispatch ổn định → component chỉ dispatch không re-render).
3. **Đặt Provider gần nơi dùng** thay vì bọc toàn app.
4. Component bọc Provider nhận `children` – children không re-render khi provider đổi state.
5. Cần **selector** → dùng store ngoài (Zustand, Redux, Jotai) với `useSyncExternalStore`, chỉ re-render khi phần được chọn thay đổi.

```jsx
const CountState = createContext(0);
const CountDispatch = createContext(null);

function CountProvider({ children }) {
  const [count, dispatch] = useReducer(reducer, 0);
  return (
    <CountDispatch.Provider value={dispatch}>
      <CountState.Provider value={count}>{children}</CountState.Provider>
    </CountDispatch.Provider>
  );
}
```

## Virtualization là gì? Khi nào cần? [mid]
**Virtualization (windowing)**: chỉ render các item **đang hiển thị trong viewport** (cộng một ít buffer), thay vì toàn bộ danh sách hàng nghìn phần tử. Khi scroll, item được tái sử dụng/thay thế.

Lợi ích: giảm số DOM node, giảm thời gian render và bộ nhớ.

Thư viện: **TanStack Virtual**, `react-window`, `react-virtuoso` (hỗ trợ chiều cao động tốt).

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
});
// render virtualizer.getVirtualItems() với position absolute / transform
```

Cần khi: list/table > vài trăm dòng phức tạp, infinite scroll, grid dữ liệu.

**Lưu ý / bẫy thường gặp:** item chiều cao động cần đo; Ctrl+F của trình duyệt không tìm được item chưa render; cần chú ý accessibility. Có thể cân nhắc pagination hoặc CSS `content-visibility: auto` trước.

## Code splitting với `React.lazy` hoạt động thế nào? [mid]
Code splitting tách bundle thành nhiều chunk, chỉ tải khi cần → giảm JS ban đầu, cải thiện LCP/TTI.

```jsx
import { lazy, Suspense } from 'react';
const AdminPage = lazy(() => import('./AdminPage'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Suspense>
  );
}
```

Chiến lược:
- **Route-based** splitting: hiệu quả nhất, mỗi trang một chunk.
- **Component-based**: modal, chart, editor nặng, chỉ tải khi mở.
- **Prefetch** khi hover/idle: gọi `import('./AdminPage')` sớm.
- Import động thư viện lớn: `const { jsPDF } = await import('jspdf')`.

**Lưu ý / bẫy thường gặp:** `lazy` yêu cầu default export (hoặc map `.then(m => ({ default: m.X }))`). Khai báo `lazy` ở top-level module, không trong component. Lỗi tải chunk (sau deploy mới) cần Error Boundary để retry/reload.

## Bạn sẽ debug một trang React chậm như thế nào? [senior]
Quy trình theo hướng **đo trước, tối ưu sau**:

1. **Tái hiện & đo**: Chrome Performance tab (long tasks, INP), Lighthouse, Web Vitals; React DevTools **Profiler** để xem component nào render lâu/nhiều lần.
2. **Phân loại nguyên nhân**:
   - Bundle quá lớn → bundle analyzer, code splitting, bỏ thư viện nặng.
   - Re-render thừa → state đặt quá cao, context quá to, props không ổn định.
   - Render nặng → list lớn (virtualization), tính toán lặp (`useMemo`, Web Worker).
   - Network → waterfall request, thiếu cache (TanStack Query), ảnh chưa tối ưu.
3. **Áp dụng**: colocate state, tách context, `React.memo`/React Compiler, `useTransition` cho cập nhật nặng, debounce input.
4. **Xác nhận lại** bằng số liệu, dùng production build để đo (dev build chậm hơn nhiều).

**Lưu ý / bẫy thường gặp:** đo ở chế độ development hoặc StrictMode sẽ cho kết quả sai lệch.

# State management

## So sánh Context API, Redux Toolkit và Zustand. [mid]
| Tiêu chí | Context + useReducer | Redux Toolkit | Zustand |
|---|---|---|---|
| Boilerplate | Ít | Trung bình (đã giảm nhiều) | Rất ít |
| Re-render | Mọi consumer | Theo selector | Theo selector |
| DevTools, middleware | Không | Mạnh (time travel) | Có (middleware devtools, persist) |
| Cần Provider | Có | Có | Không |
| Phù hợp | State ít đổi: theme, auth | App lớn, nhiều team, cần quy ước chặt | App vừa/lớn muốn đơn giản |

```javascript
// Zustand
const useCart = create(set => ({
  items: [],
  add: item => set(s => ({ items: [...s.items, item] })),
}));
const count = useCart(s => s.items.length); // chỉ re-render khi length đổi
```

Redux Toolkit: `configureStore`, `createSlice` (Immer bên trong), **RTK Query** cho server state.

**Lưu ý / bẫy thường gặp:** câu trả lời tốt là "tùy bài toán": phần lớn state thực ra là **server state** → dùng TanStack Query; client state toàn cục còn lại thường nhỏ.

## Server state khác client state thế nào? Tại sao dùng TanStack Query? [mid]
- **Client state**: thuộc về UI, đồng bộ, app sở hữu (modal mở, tab hiện tại, form draft).
- **Server state**: dữ liệu ở server, bất đồng bộ, có thể **lỗi thời**, nhiều người cùng sửa.

Tự quản lý server state bằng `useEffect + useState` phải tự làm: loading/error, cache, dedupe request, refetch khi focus, retry, pagination, invalidation, race condition. **TanStack Query** giải quyết tất cả.

```tsx
const { data, isPending, error } = useQuery({
  queryKey: ['todos', filter],
  queryFn: () => fetchTodos(filter),
  staleTime: 60_000,
});

const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: addTodo,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
});
```

Khái niệm chính: `queryKey` (cache key, deps), `staleTime` (bao lâu coi là fresh), `gcTime` (bao lâu giữ cache khi không dùng), invalidation, optimistic update qua `onMutate`.

**Lưu ý / bẫy thường gặp:** không copy data từ query vào Redux/state – mất lợi ích cache.

## Prop drilling là gì và các cách giải quyết? [junior]
**Prop drilling** là truyền props qua nhiều tầng component trung gian không dùng đến chúng, chỉ để tới component sâu bên dưới.

Cách giải quyết (theo thứ tự nên cân nhắc):
1. **Component composition**: truyền JSX qua `children` hoặc slot props thay vì truyền dữ liệu.
2. **Context API** cho dữ liệu toàn cục ít thay đổi.
3. **State management library** (Zustand, Redux) cho state phức tạp.
4. **Server state library** (TanStack Query) – component nào cần thì gọi hook với cùng key, cache dùng chung.

```jsx
// Composition thay vì drilling `user` qua Layout -> Header
<Layout header={<Header user={user} />}>
  <Content />
</Layout>
```

**Lưu ý / bẫy thường gặp:** drilling 2-3 tầng không phải vấn đề – nó rõ ràng, dễ trace. Đừng vội đưa mọi thứ vào Context.

# Forms, patterns và TypeScript

## Tại sao dùng React Hook Form? Nó tối ưu thế nào? [mid]
**React Hook Form (RHF)** quản lý form theo hướng **uncontrolled** (đăng ký input qua `ref`), nên gõ phím không làm re-render cả form.

Ưu điểm:
- Hiệu năng tốt với form lớn, ít re-render (chỉ field/watch liên quan).
- API gọn: `register`, `handleSubmit`, `formState`, `watch`, `reset`.
- Tích hợp schema validation qua resolver: **Zod**, Yup.
- `Controller` cho component controlled của UI library (MUI, Ant Design, React Select).

```tsx
const schema = z.object({ email: z.string().email(), age: z.coerce.number().min(18) });
type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } =
  useForm<FormData>({ resolver: zodResolver(schema) });

<form onSubmit={handleSubmit(data => save(data))}>
  <input {...register('email')} />
  {errors.email && <span>{errors.email.message}</span>}
</form>
```

**Lưu ý / bẫy thường gặp:** `watch()` toàn form gây re-render nhiều – dùng `useWatch` cho field cụ thể. Validate phía client không thay thế validate phía server.

## Error Boundary là gì? Những lỗi nào nó không bắt được? [mid]
Error Boundary là component bắt lỗi JavaScript **trong quá trình render, lifecycle và constructor** của cây con, hiển thị fallback UI thay vì làm trắng cả app.

Hiện vẫn phải viết bằng **class component** (`static getDerivedStateFromError`, `componentDidCatch`), hoặc dùng thư viện `react-error-boundary`.

```jsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <div>Lỗi: {error.message} <button onClick={resetErrorBoundary}>Thử lại</button></div>
  )}
  onError={(err, info) => logToSentry(err, info)}
>
  <Dashboard />
</ErrorBoundary>
```

**Không** bắt được:
- Lỗi trong **event handler** (dùng `try/catch`).
- Code async (`setTimeout`, promise) – trừ khi lỗi được đưa vào render (ví dụ qua `use()`, hoặc `setState(() => { throw err })`).
- Lỗi SSR, lỗi trong chính Error Boundary.

**Lưu ý / bẫy thường gặp:** đặt boundary ở nhiều cấp (route, widget) để lỗi một phần không làm sập toàn trang.

## Portal là gì và dùng khi nào? [mid]
`createPortal(children, domNode)` render children vào **một DOM node khác** ngoài cây DOM của component cha, nhưng vẫn giữ nguyên vị trí trong **cây React**.

Dùng cho: modal, tooltip, dropdown, toast – các phần tử cần thoát khỏi `overflow: hidden`, `z-index` hay stacking context của cha.

```jsx
import { createPortal } from 'react-dom';

function Modal({ children, onClose }) {
  return createPortal(
    <div className="backdrop" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  );
}
```

Đặc điểm:
- Context vẫn truyền bình thường.
- **Event bubbling đi theo cây React**, không theo cây DOM – click trong portal vẫn bubble lên handler của component cha React.

**Lưu ý / bẫy thường gặp:** cần xử lý accessibility cho modal (focus trap, `aria-modal`, Esc để đóng); `document` không tồn tại khi SSR. Cũng có thể cân nhắc thẻ `<dialog>` native.

## So sánh HOC, render props và custom hooks. [senior]
Cả ba đều là cách **tái sử dụng logic** giữa các component.

| | HOC | Render props | Custom hooks |
|---|---|---|---|
| Hình thức | `withX(Component)` trả component mới | Prop là function trả JSX | Function `useX()` |
| Wrapper hell | Có | Có (callback lồng nhau) | Không |
| Xung đột tên props | Có thể | Không | Không |
| Nguồn dữ liệu rõ ràng | Kém (props "ma") | Tốt | Tốt |
| TypeScript | Khó | Trung bình | Dễ |

```jsx
// HOC
const withAuth = C => props => useAuth().user ? <C {...props} /> : <Login />;
// Render props
<MouseTracker render={({ x, y }) => <Dot x={x} y={y} />} />
// Hook
const { x, y } = useMousePosition();
```

Hiện nay **custom hook là lựa chọn mặc định**. HOC vẫn hữu ích cho cross-cutting concern bọc UI (route guard, `React.memo` cũng là HOC); render props/children-as-function vẫn gặp trong thư viện headless UI.

## Dùng TypeScript với React: cách type props, events, hooks? [mid]
```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<'button'>;

function Button({ variant = 'primary', children, ...rest }: ButtonProps) {
  return <button className={variant} {...rest}>{children}</button>;
}

const [user, setUser] = useState<User | null>(null);
const inputRef = useRef<HTMLInputElement>(null);
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value);
```

Điểm quan trọng:
- Ưu tiên kiểu cho props trực tiếp thay vì `React.FC` (FC từng ngầm thêm `children`).
- `ReactNode` cho children; `ReactElement` khi cần đúng một element.
- **Generic component**: `function List<T>({ items, render }: { items: T[]; render: (i: T) => ReactNode })`.
- **Discriminated union** cho props loại trừ nhau: `{ type: 'link'; href: string } | { type: 'button'; onClick: () => void }`.
- Context: `createContext<Ctx | null>(null)` + custom hook ném lỗi nếu null.

**Lưu ý / bẫy thường gặp:** tránh `any`; `as` cast che giấu lỗi. Type dữ liệu từ API cần validate runtime (Zod) – TypeScript chỉ kiểm tra lúc compile.

# Testing và bảo mật

## Bạn test component React như thế nào với Jest và React Testing Library? [mid]
**React Testing Library (RTL)** khuyến khích test **hành vi như người dùng thấy**, không test implementation detail (state nội bộ, tên hàm).

Thứ tự ưu tiên query: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('hiển thị lời chào sau khi submit', async () => {
  const user = userEvent.setup();
  render(<Greeting />);

  await user.type(screen.getByLabelText(/tên/i), 'An');
  await user.click(screen.getByRole('button', { name: /gửi/i }));

  expect(await screen.findByText('Xin chào, An')).toBeInTheDocument();
});
```

- `getBy*` (ném lỗi nếu không có), `queryBy*` (kiểm tra không tồn tại), `findBy*` (async).
- Mock API bằng **MSW** (Mock Service Worker) thay vì mock `fetch` thủ công.
- Test hook: `renderHook`.
- Runner: Jest hoặc **Vitest** (nhanh hơn với Vite); E2E: Playwright/Cypress.

**Lưu ý / bẫy thường gặp:** dùng `userEvent` thay `fireEvent`; tránh snapshot test lớn – dễ vỡ và ít giá trị.

## Phân biệt unit, integration và E2E test trong frontend. [junior]
| Loại | Phạm vi | Công cụ | Tốc độ |
|---|---|---|---|
| Unit | Hàm thuần, hook, component nhỏ cô lập | Jest/Vitest | Rất nhanh |
| Integration | Nhiều component + state + API mock (MSW) | RTL + Jest/Vitest | Nhanh |
| E2E | Toàn bộ app trên trình duyệt thật, backend thật/staging | Playwright, Cypress | Chậm |

Chiến lược phổ biến là **Testing Trophy** (Kent C. Dodds): nền là static analysis (TypeScript, ESLint), nhiều **integration test** nhất vì cho độ tin cậy/chi phí tốt, ít unit test hơn cho logic phức tạp, một số E2E cho luồng quan trọng (đăng nhập, thanh toán).

**Lưu ý / bẫy thường gặp:** coverage cao không đồng nghĩa test tốt; test bám vào implementation sẽ vỡ mỗi lần refactor.

## React chống XSS thế nào? Rủi ro của `dangerouslySetInnerHTML`? [mid]
Mặc định React **escape** mọi giá trị trong `{}` trước khi đưa vào DOM, nên `<div>{userInput}</div>` an toàn với `<script>`.

Vẫn có lỗ hổng khi:
1. **`dangerouslySetInnerHTML`**: chèn HTML thô → phải **sanitize** bằng DOMPurify.
2. **URL từ user** trong `href`/`src`: `javascript:alert(1)` (React 19 chặn/cảnh báo `javascript:` URL nhưng vẫn nên validate protocol).
3. Spread props không kiểm soát từ dữ liệu user.
4. Thao tác DOM trực tiếp qua ref (`innerHTML`), thư viện bên thứ ba.
5. SSR serialize state vào `<script>` không escape.

```jsx
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.html) }} />
```

Biện pháp bổ sung: **Content Security Policy (CSP)**, cookie `HttpOnly` cho token (thay vì localStorage), validate input phía server.

**Lưu ý / bẫy thường gặp:** sanitize ở server khi lưu chưa đủ nếu dữ liệu có thể đến từ nguồn khác – sanitize ngay trước khi render.

## Nên lưu access token ở đâu trong ứng dụng React? [senior]
| Nơi lưu | XSS | CSRF | Ghi chú |
|---|---|---|---|
| `localStorage` | Dễ bị đánh cắp | Không bị | Đơn giản nhưng rủi ro nhất |
| Memory (biến JS/state) | Khó đánh cắp hơn, mất khi reload | Không bị | Kết hợp refresh token |
| Cookie `HttpOnly; Secure; SameSite` | JS không đọc được | Cần phòng (SameSite, CSRF token) | Khuyến nghị |

Mô hình phổ biến:
- **Refresh token** trong cookie `HttpOnly`, **access token** ngắn hạn trong memory, làm mới bằng silent refresh.
- Hoặc **BFF (Backend for Frontend)**: session cookie, token chỉ nằm ở server (Next.js server-side rất hợp mô hình này).

**Lưu ý / bẫy thường gặp:** `HttpOnly` không chống được XSS hoàn toàn – kẻ tấn công vẫn gửi request thay user; XSS cần được chặn ở gốc (escape, CSP). Phân quyền trên UI chỉ là UX, server phải kiểm tra lại.
