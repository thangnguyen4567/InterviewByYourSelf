---
topic: reactjs
---

## Vì sao không nên dùng index làm `key` cho list có thể sắp xếp lại / thêm / xoá? [junior]
- [ ] Vì React sẽ báo lỗi và không render list
- [x] Vì React có thể gán nhầm state/DOM giữa các item khi thứ tự thay đổi
- [ ] Vì `key` bắt buộc phải là string, không được là number
- [ ] Vì làm chậm lần render đầu tiên
> `key` giúp React đối chiếu item giữa các lần render; khi thứ tự đổi, index đổi theo nên state nội bộ (input, checkbox…) bị "dính" sang item khác. React không báo lỗi, và number vẫn hợp lệ làm key.

## Khác biệt giữa `useState(compute())` và `useState(() => compute())` là gì? [junior]
- [ ] Không khác gì, React tự tối ưu cả hai
- [ ] Cách thứ hai khiến state luôn là một function
- [x] Cách thứ hai (lazy initializer) chỉ gọi `compute` ở lần render đầu; cách thứ nhất gọi `compute` ở mọi lần render
- [ ] Cách thứ nhất chỉ chạy một lần, cách thứ hai chạy mỗi lần render
> Truyền function vào `useState` là lazy initialization: React chỉ gọi nó khi khởi tạo. Với `useState(compute())`, biểu thức được tính mỗi lần render dù kết quả bị bỏ qua sau lần đầu.

## Cách nào cập nhật state mảng `items` đúng để component re-render? [junior]
```jsx
const [items, setItems] = useState([]);
```
- [ ] `items.push(x); setItems(items);`
- [ ] `items[items.length] = x;`
- [ ] `setItems(items.concat)`
- [x] `setItems([...items, x]);`
> React so sánh state bằng `Object.is`; `push` rồi set lại cùng reference thì React coi như không đổi và bỏ qua re-render. Phải tạo mảng mới (immutable update).

## Với `count = 0`, đoạn JSX sau render gì? [junior]
```jsx
<div>{count && <p>Có {count} thông báo</p>}</div>
```
- [ ] Không render gì bên trong `div`
- [x] Ký tự `0` bên trong `div`
- [ ] `<p>Có 0 thông báo</p>`
- [ ] Lỗi vì `&&` không dùng được trong JSX
> `0 && ...` trả về `0`, và React render số `0` thành text (chỉ `false`, `null`, `undefined`, `true` là bị bỏ qua). Nên viết `count > 0 && ...`.

## `useEffect(() => { ... }, [])` chạy khi nào (bỏ qua StrictMode)? [junior]
- [ ] Trước khi component render lần đầu
- [ ] Sau mỗi lần render
- [ ] Chỉ khi component unmount
- [x] Một lần, sau khi component mount (render và commit lần đầu)
> Deps rỗng nghĩa là effect không phụ thuộc giá trị nào nên chỉ chạy sau lần commit đầu tiên; cleanup (nếu có) chạy khi unmount. Không truyền deps mới là "chạy sau mỗi render".

## Điều gì xảy ra với input sau? [junior]
```jsx
const [name, setName] = useState('');
return <input value={name} />;
```
- [x] Input bị "read-only": gõ phím không thay đổi giá trị, React cảnh báo thiếu `onChange` ở dev
- [ ] Input hoạt động bình thường như uncontrolled input
- [ ] React tự động cập nhật `name` khi gõ
- [ ] Lỗi runtime, component không render
> Truyền `value` biến input thành controlled; không có `onChange` thì React luôn ép giá trị về `name`. Muốn uncontrolled thì dùng `defaultValue`.

## Fragment (`<>...</>`) dùng để làm gì? [junior]
- [ ] Tạo một component có state riêng
- [ ] Lazy load một nhóm component
- [x] Nhóm nhiều phần tử con mà không thêm node DOM thừa
- [ ] Ngăn các component con re-render
> Một component phải trả về một root; Fragment cho phép trả nhiều phần tử mà không thêm `<div>` bọc ngoài. Muốn gán `key` thì dùng `<Fragment key=...>` thay vì cú pháp rút gọn.

## Đoạn code sau gây ra lỗi gì? [junior]
```jsx
function Counter() {
  const [n, setN] = useState(0);
  const handleClick = () => setN(n + 1);
  return <button onClick={handleClick()}>{n}</button>;
}
```
- [ ] Không lỗi, nút tăng 1 mỗi lần bấm
- [ ] Nút không phản hồi khi bấm nhưng không lỗi
- [ ] Lỗi cú pháp JSX
- [x] "Too many re-renders" vì `handleClick` bị gọi ngay trong lúc render
> `onClick={handleClick()}` gọi hàm khi render → set state → render lại → gọi tiếp → vòng lặp vô hạn. Phải truyền tham chiếu `onClick={handleClick}`.

## Đoạn code sau in ra gì? [junior]
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```
- [ ] `0 1 2`
- [x] `3 3 3`
- [ ] `undefined undefined undefined`
- [ ] `2 2 2`
> `var` có function scope nên ba callback cùng tham chiếu một biến `i`, khi timeout chạy vòng lặp đã kết thúc với `i = 3`. Dùng `let` (block scope mỗi vòng) sẽ in `0 1 2`.

## Component con muốn báo dữ liệu lên component cha thì cách chuẩn trong React là gì? [junior]
- [ ] Con sửa trực tiếp `props` do cha truyền xuống
- [x] Cha truyền một callback qua props, con gọi callback đó với dữ liệu
- [ ] Con dùng `useRef` trỏ tới state của cha
- [ ] Con gọi `this.parent.setState()`
> Dữ liệu trong React chảy một chiều; con "báo lên" bằng cách gọi hàm cha truyền xuống (lifting state up). Props là read-only, không được mutate.

## Thay đổi `ref.current` (từ `useRef`) có làm component re-render không? [junior]
- [ ] Có, giống như `setState`
- [ ] Có, nhưng chỉ ở lần render kế tiếp
- [ ] Chỉ khi ref gắn vào một DOM element
- [x] Không, `useRef` giữ giá trị qua các lần render nhưng mutate nó không trigger render
> `useRef` trả về object ổn định; gán `.current` là mutate thuần JS, React không biết. Dùng ref cho giá trị không ảnh hưởng UI (timer id, DOM node, giá trị trước đó).

## Khi component cha re-render, component con (không dùng `memo`) có re-render không dù props không đổi? [junior]
- [x] Có, mặc định React render lại toàn bộ cây con của component vừa render
- [ ] Không, React tự so sánh props và bỏ qua
- [ ] Chỉ khi con có state
- [ ] Chỉ khi con dùng `useEffect`
> Mặc định React không so sánh props; mọi component con trong output của cha đều được gọi lại. `React.memo` mới thêm bước so sánh shallow props để bỏ qua.

## Sau khi bấm nút một lần, `count` hiển thị bao nhiêu? [mid]
```jsx
const [count, setCount] = useState(0);
const onClick = () => { setCount(count + 1); setCount(count + 1); };
```
- [x] 1
- [ ] 2
- [ ] 0
- [ ] Lỗi vòng lặp render
> Cả hai lần đều đọc `count` = 0 từ closure của lần render hiện tại → set 1 hai lần. Dùng updater `setCount(c => c + 1)` hai lần mới được 2.

## Thứ tự in ra của đoạn code sau? [mid]
```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```
- [ ] A B C D
- [ ] A D B C
- [x] A D C B
- [ ] A C D B
> Code đồng bộ chạy trước (A, D); sau đó event loop xả hết microtask queue (Promise → C) rồi mới tới macrotask (setTimeout → B), dù delay là 0.

## Đoạn code sau in ra gì? [mid]
```js
const user = {
  name: 'An',
  greet() {
    setTimeout(() => console.log(this.name), 0);
  },
};
user.greet();
```
- [ ] `undefined`
- [x] `An`
- [ ] `''` (chuỗi rỗng, `window.name`)
- [ ] TypeError: Cannot read properties of undefined
> Arrow function không có `this` riêng mà lấy `this` từ scope bao quanh, tức `this` của `greet()` khi gọi `user.greet()` là `user`. Nếu dùng `function () {}` thường trong setTimeout thì `this` mới bị mất.

## Khi prop `id` đổi từ 1 sang 2, console in ra gì (theo thứ tự)? [mid]
```jsx
useEffect(() => {
  console.log('effect ' + id);
  return () => console.log('cleanup ' + id);
}, [id]);
```
- [ ] `effect 2` rồi `cleanup 1`
- [ ] `cleanup 2` rồi `effect 2`
- [ ] Chỉ `effect 2`
- [x] `cleanup 1` rồi `effect 2`
> Khi deps đổi, React chạy cleanup của effect cũ (closure cũ nên thấy `id = 1`) trước, rồi mới chạy effect mới với `id = 2`.

## Counter sau hiển thị gì sau 5 giây? [mid]
```jsx
const [count, setCount] = useState(0);
useEffect(() => {
  const t = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(t);
}, []);
```
- [ ] 5
- [ ] 0
- [x] 1 (đứng yên ở 1)
- [ ] Tăng vô hạn rất nhanh
> Stale closure: callback interval được tạo một lần ở render đầu nên luôn thấy `count = 0` và set `0 + 1 = 1`. Sửa bằng `setCount(c => c + 1)` hoặc thêm `count` vào deps.

## `Child` được bọc `React.memo` nhưng vẫn re-render mỗi khi `Parent` render. Nguyên nhân hợp lý nhất? [mid]
```jsx
<Child onSelect={() => setSelected(id)} />
```
- [x] Mỗi lần render `Parent` tạo một arrow function mới, shallow compare props thấy khác reference
- [ ] `React.memo` chỉ hoạt động với class component
- [ ] `memo` không so sánh props là function
- [ ] Vì `setSelected` thay đổi mỗi lần render
> `memo` so sánh shallow bằng `Object.is`; function inline là reference mới mỗi render. Bọc bằng `useCallback` để giữ reference ổn định. Setter của `useState` vốn đã ổn định.

## Biểu thức nào tương đương với `useCallback(fn, deps)`? [mid]
- [ ] `useMemo(fn, deps)`
- [ ] `useRef(fn).current`
- [x] `useMemo(() => fn, deps)`
- [ ] `useEffect(fn, deps)`
> `useCallback` memo hoá chính function, còn `useMemo` memo hoá giá trị trả về của function truyền vào. `useMemo(fn, deps)` sẽ gọi `fn` và lưu kết quả của nó, không phải lưu `fn`.

## Với React 18 (`createRoot`), bấm nút sau làm component render bao nhiêu lần? [mid]
```jsx
const onClick = () => {
  setTimeout(() => {
    setA(1);
    setB(2);
  }, 0);
};
```
- [ ] 2 lần, vì batching không áp dụng trong setTimeout
- [x] 1 lần, nhờ automatic batching
- [ ] 0 lần, vì update trong setTimeout bị bỏ qua
- [ ] 3 lần
> React 18 với `createRoot` gộp (batch) mọi update kể cả trong setTimeout, Promise, native event. React 17 (hoặc `ReactDOM.render` legacy) chỉ batch trong React event handler nên sẽ render 2 lần.

## Ở React 18+ chế độ development với `<StrictMode>`, component sau mount sẽ in gì? [mid]
```jsx
useEffect(() => {
  console.log('mount');
  return () => console.log('cleanup');
}, []);
```
- [ ] `mount`
- [ ] `mount` `mount`
- [x] `mount` `cleanup` `mount`
- [ ] `cleanup` `mount`
> StrictMode (chỉ ở dev) mô phỏng mount → unmount → mount lại để lộ effect thiếu cleanup. Production chỉ in `mount` một lần.

## Khi nào nên dùng `useLayoutEffect` thay cho `useEffect`? [mid]
- [ ] Khi cần fetch dữ liệu nhanh hơn
- [ ] Khi effect cần chạy trên server khi SSR
- [ ] Khi muốn effect chạy trước lần render
- [x] Khi cần đọc layout DOM (đo kích thước) và cập nhật đồng bộ trước khi trình duyệt paint để tránh nhấp nháy
> `useLayoutEffect` chạy đồng bộ sau khi DOM được cập nhật nhưng trước paint, nên chặn paint; `useEffect` chạy sau paint. Cả hai đều không chạy trên server và đều chạy sau render.

## Vì sao mọi consumer của context sau đều re-render mỗi khi `App` re-render, dù `user` không đổi? [mid]
```jsx
<UserContext.Provider value={{ user, setUser }}>
```
- [ ] Vì `setUser` thay đổi reference mỗi lần render
- [x] Vì object `{ user, setUser }` được tạo mới mỗi lần render nên `value` luôn khác reference
- [ ] Vì Context luôn re-render mọi consumer bất kể `value`
- [ ] Vì Provider phải được bọc trong `React.memo`
> React so sánh `value` của Provider bằng `Object.is`; object literal mới mỗi render khiến mọi consumer cập nhật. Dùng `useMemo(() => ({ user, setUser }), [user])`.

## Với React Testing Library, query nào phù hợp để chờ một phần tử xuất hiện sau khi gọi API (async)? [mid]
- [ ] `getByText`
- [ ] `queryByText`
- [ ] `getAllByText`
- [x] `findByText`
> `findBy*` trả về Promise và retry cho tới khi tìm thấy hoặc timeout (mặc định 1000ms). `getBy*` ném lỗi ngay nếu chưa có, `queryBy*` trả `null` – hợp để assert phần tử không tồn tại.

## Khi `isA` đổi từ `true` sang `false`, state `count` bên trong `Counter` ra sao? [senior]
```jsx
{isA ? <Counter label="A" /> : <Counter label="B" />}
```
- [ ] Reset về 0 vì đây là hai element khác nhau
- [x] Được giữ nguyên, chỉ prop `label` đổi
- [ ] Bị reset và React cảnh báo thiếu `key`
- [ ] Phụ thuộc vào việc `Counter` có dùng `memo` hay không
> React giữ state theo vị trí trong cây và type: cùng type `Counter` ở cùng vị trí nên được coi là một instance. Muốn reset, gán `key="A"`/`key="B"` khác nhau hoặc render ở hai vị trí khác nhau.

## Vấn đề của đoạn code sau là gì? [senior]
```jsx
function Form() {
  const [text, setText] = useState('');
  function Field() {
    return <input value={text} onChange={e => setText(e.target.value)} />;
  }
  return <Field />;
}
```
- [ ] Không vấn đề gì, chỉ hơi khó đọc
- [ ] `Field` không truy cập được `text` do closure
- [x] Mỗi lần `Form` render, `Field` là một component type mới nên bị unmount/mount lại – input mất focus sau mỗi phím gõ
- [ ] React báo lỗi hook gọi trong hàm lồng nhau
> React so sánh type bằng reference; function khai báo trong thân component là reference mới mỗi render, nên cây con bị huỷ và tạo lại (mất state, focus). Hãy khai báo component ở top-level module.

## Thứ tự in ra của đoạn code sau? [senior]
```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve()
  .then(() => { console.log(3); setTimeout(() => console.log(4), 0); })
  .then(() => console.log(5));
queueMicrotask(() => console.log(6));
console.log(7);
```
- [ ] 1 7 3 5 6 2 4
- [ ] 1 7 3 6 5 4 2
- [ ] 1 3 7 6 5 2 4
- [x] 1 7 3 6 5 2 4
> Sync: 1, 7. Microtask queue ban đầu có [then-3, 6]; chạy 3 xong mới enqueue then-5 nên thứ tự là 3, 6, 5. Macrotask: timeout 2 được đăng ký trước timeout 4.

## Vì sao `useEffect(() => {...}, [ref.current])` không đáng tin cậy để phản ứng khi DOM node thay đổi? [senior]
- [ ] Vì `ref.current` luôn là `null` trong effect
- [x] Vì mutate `ref.current` không gây re-render, deps chỉ được so sánh khi component render vì lý do khác; nên dùng callback ref
- [ ] Vì React cấm đưa ref vào mảng deps và sẽ ném lỗi
- [ ] Vì `ref.current` được gán sau khi mọi effect đã chạy
> React gán ref trong commit trước khi chạy effect, nhưng việc đổi ref không lên lịch render nên effect không biết để chạy lại. Callback ref (`ref={node => ...}`) được gọi đúng lúc node gắn/gỡ.

## Phát biểu nào về `useTransition` / `startTransition` là ĐÚNG? [senior]
- [ ] `startTransition` trì hoãn update một khoảng thời gian cố định giống debounce
- [ ] Nên bọc `setValue` của controlled input trong `startTransition` để gõ mượt hơn
- [x] Update trong transition là non-urgent và có thể bị ngắt bởi update khẩn cấp hơn (như gõ phím); `isPending` cho biết transition đang chờ
- [ ] Transition khiến render chạy trên Web Worker riêng
> Transition không delay theo thời gian mà đánh dấu độ ưu tiên thấp, render có thể bị bỏ dở khi có update urgent. Docs React nói rõ không dùng transition cho state điều khiển text input vì input phải cập nhật đồng bộ.

## Trong React 19, `useOptimistic` hoạt động thế nào khi action kết thúc? [senior]
```jsx
const [optimisticTodos, addOptimistic] = useOptimistic(
  todos,
  (state, newTodo) => [...state, { ...newTodo, pending: true }]
);
```
- [ ] Giá trị optimistic được giữ vĩnh viễn cho tới khi gọi `addOptimistic` lần nữa
- [x] Khi action/transition kết thúc (thành công hay lỗi), `optimisticTodos` quay về giá trị `todos` thật hiện tại
- [ ] Nếu action lỗi, React tự gọi lại action cho tới khi thành công
- [ ] `addOptimistic` có thể gọi ở bất cứ đâu, kể cả ngoài action/transition, mà không có cảnh báo
> Optimistic state chỉ tồn tại trong lúc action pending; sau đó React hiển thị state thật (nếu server đã cập nhật `todos` thì item thật xuất hiện, nếu lỗi thì item optimistic tự biến mất). Gọi `addOptimistic` ngoài transition/action sẽ bị cảnh báo.

## Trong React 19, tham số đầu tiên mà `submitAction` nhận được là gì? [senior]
```jsx
const [state, formAction, isPending] = useActionState(submitAction, { error: null });
return <form action={formAction}>...</form>;
```
- [ ] `FormData` của form
- [ ] Event `submit`
- [x] State trước đó (lần đầu là `{ error: null }`)
- [ ] `isPending`
> Với `useActionState`, action được gọi với `(previousState, formData)`; giá trị trả về trở thành `state` mới. Đây là điểm khác so với truyền function trực tiếp vào `<form action>` (chỉ nhận `formData`).

## Phát biểu nào về API `use` của React 19 là ĐÚNG? [senior]
- [ ] `use` là hook nên phải gọi ở top-level, không được nằm trong `if`
- [ ] `use` chỉ dùng được trong Server Components
- [ ] `use(promise)` không cần Suspense boundary vì tự trả về `undefined` khi đang chờ
- [x] `use` có thể gọi có điều kiện (trong `if`/vòng lặp) và dùng được cho cả Promise lẫn Context
> `use` là ngoại lệ với Rules of Hooks: được gọi có điều kiện nhưng vẫn phải trong component/hook. Khi Promise chưa resolve, component suspend tới Suspense gần nhất; Promise nên được tạo/cache bên ngoài render (ví dụ truyền từ Server Component).

## Prop nào KHÔNG thể truyền từ Server Component sang Client Component? [senior]
- [ ] Một `Date` object
- [ ] Một Promise (để Client Component đọc bằng `use`)
- [x] Một arrow function thường `onClick={() => console.log('hi')}`
- [ ] JSX element (truyền qua `children`)
> Props qua ranh giới server → client phải serializable bởi RSC: primitive, plain object/array, Date, Map/Set, Promise, JSX, và Server Functions (`'use server'`). Function thường không serialize được nên sẽ lỗi.

## `MemoChild` (bọc `React.memo`) có bỏ qua re-render khi `Parent` re-render không? [senior]
```jsx
function Parent() {
  const [n, setN] = useState(0);
  return (
    <MemoChild>
      <span>Hello</span>
    </MemoChild>
  );
}
```
- [ ] Có, vì nội dung `children` không đổi
- [x] Không, vì `children` là một React element mới (object mới) mỗi lần `Parent` render
- [ ] Có, vì React so sánh JSX theo nội dung
- [ ] Không, vì `memo` không hỗ trợ component có `children`
> JSX biên dịch thành object mới mỗi render nên prop `children` luôn khác reference, làm `memo` vô hiệu. Có thể `useMemo` phần children hoặc tái cấu trúc để state nằm ở chỗ khác.

## Không dùng StrictMode, khi mount lần đầu console in theo thứ tự nào? [senior]
```jsx
function Child() {
  console.log('render Child');
  useEffect(() => console.log('effect Child'));
  return null;
}
function Parent() {
  console.log('render Parent');
  useEffect(() => console.log('effect Parent'));
  return <Child />;
}
```
- [ ] render Parent, effect Parent, render Child, effect Child
- [ ] render Parent, render Child, effect Parent, effect Child
- [x] render Parent, render Child, effect Child, effect Parent
- [ ] render Child, render Parent, effect Child, effect Parent
> Render đi từ trên xuống (cha gọi trước để biết con là gì), còn effect chạy sau commit theo thứ tự từ con lên cha. Vì vậy effect của cha có thể giả định effect của con đã chạy.

## Với Redux Toolkit, component sau re-render khi nào? [senior]
```jsx
const { user, theme } = useSelector(state => ({
  user: state.user,
  theme: state.theme,
}));
```
- [ ] Chỉ khi `state.user` hoặc `state.theme` thay đổi
- [ ] Không bao giờ sau lần đầu vì selector được memo tự động
- [ ] Chỉ khi component cha re-render
- [x] Sau mỗi action được dispatch làm store cập nhật, vì selector trả về object mới và `useSelector` so sánh bằng `===`
> `useSelector` chạy lại selector sau mỗi lần store thay đổi và so sánh strict reference; object literal luôn mới nên luôn re-render (dev còn cảnh báo). Tách thành hai `useSelector`, dùng `shallowEqual` hoặc selector memo (`createSelector`).
