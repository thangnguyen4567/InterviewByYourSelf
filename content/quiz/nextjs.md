---
topic: nextjs
---

## Trong App Router, file nào định nghĩa UI cho route `/blog`? [junior]
- [ ] `pages/blog.tsx`
- [x] `app/blog/page.tsx`
- [ ] `app/blog.tsx`
- [ ] `app/blog/index.tsx`
> Trong App Router, thư mục định nghĩa segment và chỉ file `page.tsx` mới làm segment đó truy cập được công khai. `pages/blog.tsx` là quy ước của Pages Router.

## Biến môi trường nào có thể đọc được trong code chạy trên trình duyệt? [junior]
- [ ] `API_SECRET`
- [ ] `PUBLIC_API_URL`
- [ ] `REACT_APP_API_URL`
- [x] `NEXT_PUBLIC_API_URL`
> Chỉ biến có prefix `NEXT_PUBLIC_` được Next.js inline vào client bundle. Biến khác chỉ có trên server; `REACT_APP_` là quy ước của Create React App.

## Mặc định, component trong thư mục `app/` là loại gì? [junior]
- [x] Server Component
- [ ] Client Component
- [ ] Static HTML không có React
- [ ] Tuỳ vào tên file
> App Router mặc định mọi component là React Server Component; cần `'use client'` ở đầu file để biến module đó (và những gì nó import) thành Client Component.

## Directive `'use client'` phải đặt ở đâu? [junior]
- [ ] Bên trong thân component, trước `return`
- [ ] Trong `next.config.js`
- [x] Ở dòng đầu tiên của file, trước mọi import
- [ ] Ngay trước khai báo `useState`
> `'use client'` là directive cấp module và phải đứng đầu file (chỉ cho phép comment phía trên). Nó đánh dấu ranh giới: module này và các module nó import thuộc client bundle.

## Cấu trúc nào tạo route động `/blog/hello-world`, `/blog/abc`...? [junior]
- [ ] `app/blog/:slug/page.tsx`
- [x] `app/blog/[slug]/page.tsx`
- [ ] `app/blog/{slug}/page.tsx`
- [ ] `app/blog/*slug/page.tsx`
> Dynamic segment dùng ngoặc vuông `[slug]`; `[...slug]` là catch-all và `[[...slug]]` là optional catch-all.

## Lợi ích chính của `<Link>` từ `next/link` so với thẻ `<a>` thường? [junior]
- [ ] Tự động thêm SEO metadata cho trang đích
- [ ] Bắt buộc để route hoạt động
- [ ] Mở link trong tab mới
- [x] Điều hướng phía client (không reload toàn trang) và prefetch route khi link xuất hiện trong viewport (ở production)
> `<Link>` giữ state của layout chung, chỉ tải phần thay đổi và prefetch trước. Thẻ `<a>` thường vẫn chạy nhưng gây full page reload.

## Vì sao nên dùng `next/image` thay vì `<img>`? [junior]
- [ ] Vì `<img>` không được hỗ trợ trong Next.js
- [x] Tự động resize/chuyển định dạng hiện đại (WebP/AVIF), lazy load mặc định và tránh layout shift nhờ `width`/`height`
- [ ] Vì ảnh được nhúng base64 vào HTML
- [ ] Vì `next/image` không cần khai báo domain của ảnh remote
> `next/image` tối ưu ảnh theo thiết bị và giữ chỗ để tránh CLS. Ảnh remote vẫn phải được cấu hình trong `images.remotePatterns`.

## SSG (Static Site Generation) nghĩa là gì? [junior]
- [ ] HTML được tạo trên server ở mỗi request
- [ ] HTML được tạo hoàn toàn trên trình duyệt
- [ ] HTML được tạo lại sau mỗi lần deploy cho từng user
- [x] HTML được tạo sẵn lúc build và phục vụ lại cho mọi request
> SSG render lúc build (có thể qua CDN). SSR render ở mỗi request; CSR render trên trình duyệt; ISR là SSG có thể tái tạo định kỳ.

## Đặc điểm của `layout.tsx` khi điều hướng giữa các page con cùng layout? [junior]
- [ ] Layout bị unmount và mount lại mỗi lần điều hướng
- [x] Layout được giữ nguyên, giữ state và không re-render; chỉ phần page thay đổi
- [ ] Layout chỉ áp dụng cho route gốc `/`
- [ ] Layout phải là Client Component
> Layout là UI dùng chung được bảo toàn qua các lần điều hướng (partial rendering). Nếu cần remount mỗi lần điều hướng thì dùng `template.tsx`.

## File `loading.tsx` trong một route segment làm gì? [junior]
- [ ] Chạy code trước khi request tới server
- [ ] Hiển thị khi page ném lỗi
- [x] Tự động bọc page trong `<Suspense>` và hiển thị fallback trong lúc nội dung đang tải
- [ ] Preload toàn bộ JavaScript của ứng dụng
> `loading.tsx` tạo loading UI tức thì với streaming. Hiển thị khi lỗi là việc của `error.tsx`; chạy trước request là middleware.

## Trong Pages Router, `getServerSideProps` chạy khi nào? [junior]
- [ ] Một lần lúc build
- [x] Trên server ở mỗi request tới trang đó
- [ ] Trên trình duyệt sau khi trang hydrate
- [ ] Chỉ khi chạy `next dev`
> `getServerSideProps` là SSR: chạy trên server mỗi request và không bao giờ được gửi xuống client. `getStaticProps` mới chạy lúc build (và khi revalidate).

## Thư mục `app/(marketing)/about/page.tsx` tương ứng URL nào? [junior]
- [ ] `/(marketing)/about`
- [ ] `/marketing/about`
- [x] `/about`
- [ ] Không tạo route nào
> Thư mục trong ngoặc tròn là route group: dùng để tổ chức code hoặc gán layout riêng, không xuất hiện trong URL.

## Trong Next.js 15, `fetch('https://api.example.com/posts')` (không truyền option cache) trong Server Component có được lưu vào Data Cache không? [mid]
- [ ] Có, mặc định `force-cache` và lưu vĩnh viễn
- [ ] Có, nhưng chỉ 60 giây
- [x] Không, mặc định không cache; muốn cache phải dùng `cache: 'force-cache'` hoặc `next: { revalidate }`
- [ ] Không, và fetch bị cấm trong Server Component
> Next.js 15 đổi mặc định: `fetch` không còn được cache tự động (Next.js 14 thì mặc định `force-cache`). Route vẫn có thể được prerender tĩnh nếu không dùng dynamic API, nhưng Data Cache cho request đó không được dùng.

## Với cấu hình sau, request đầu tiên tới trang sau khi đã quá 60 giây kể từ lần generate trước sẽ nhận gì? [mid]
```tsx
export const revalidate = 60;
export default async function Page() { /* ... */ }
```
- [x] Vẫn nhận bản cũ (stale), đồng thời Next.js tái tạo trang ở background; các request sau nhận bản mới
- [ ] Phải chờ server render xong bản mới rồi mới nhận
- [ ] Nhận lỗi 404 cho tới khi tái tạo xong
- [ ] Nhận bản mới vì cache tự hết hạn đúng 60 giây
> ISR dùng mô hình stale-while-revalidate: hết hạn chỉ đánh dấu stale, request kế tiếp kích hoạt regenerate nền. Nếu regenerate lỗi, bản cũ tiếp tục được phục vụ.

## Đoạn Client Component sau thường gây lỗi gì? [mid]
```tsx
'use client';
export default function Clock() {
  return <p>{new Date().toLocaleTimeString()}</p>;
}
```
- [ ] Lỗi build vì không được dùng `Date` trong Client Component
- [ ] Không lỗi gì vì Client Component chỉ render trên trình duyệt
- [ ] Lỗi vì thiếu `async`
- [x] Hydration mismatch, vì HTML render trên server khác với lần render đầu ở client
> Client Component vẫn được prerender trên server; thời gian ở server và client khác nhau nên text không khớp khi hydrate. Hãy set giá trị trong `useEffect` sau khi mount (hoặc `suppressHydrationWarning` cho text thời gian).

## Sau khi Server Action tạo bài viết mới, cách đúng để trang `/posts` hiển thị dữ liệu mới là gì? [mid]
```ts
'use server';
export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') as string } });
  // ???
}
```
- [ ] `router.refresh()`
- [ ] `window.location.reload()`
- [x] `revalidatePath('/posts')`
- [ ] `export const revalidate = 0` bên trong action
> `revalidatePath`/`revalidateTag` (từ `next/cache`) xoá cache liên quan trên server và làm client nhận payload mới. `router.refresh()` và `window` chỉ dùng được ở client, không trong Server Action.

## Phát biểu nào về Route Handler (`route.ts`) là ĐÚNG? [mid]
- [ ] Route Handler phải nằm trong thư mục `pages/api`
- [x] Export các hàm theo HTTP method (`GET`, `POST`...) và không được đặt `route.ts` cùng cấp với `page.tsx` trong một segment
- [ ] Mỗi file `route.ts` chỉ được export một default handler
- [ ] Route Handler chỉ chạy được ở Edge runtime
> Trong App Router, `app/api/users/route.ts` export `GET`, `POST`... nhận `Request` và trả `Response`. `route.ts` và `page.tsx` cùng segment sẽ xung đột; runtime mặc định là Node.js.

## Trong Next.js 15, `config.matcher` trong `middleware.ts` dùng để làm gì? [mid]
```ts
export const config = { matcher: ['/dashboard/:path*'] };
```
- [ ] Khai báo các route sẽ được prerender tĩnh
- [ ] Đổi tên route `/dashboard` thành `/:path*`
- [ ] Liệt kê route bị chặn hoàn toàn
- [x] Giới hạn middleware chỉ chạy cho các path khớp, thay vì mọi request
> Middleware mặc định chạy cho mọi route (kể cả asset nếu không lọc); `matcher` lọc sớm để giảm overhead. (Next.js 16 đổi tên quy ước này thành `proxy.ts`.)

## Trong Next.js 15, cách đúng để đọc `slug` trong page động là gì? [mid]
- [ ] `export default function Page({ params }) { const { slug } = params; }`
- [x] `export default async function Page({ params }) { const { slug } = await params; }`
- [ ] `const { slug } = useParams()` trong Server Component
- [ ] `const slug = getServerSideProps().params.slug`
> Từ Next.js 15, `params` và `searchParams` là Promise (truy cập đồng bộ chỉ còn được hỗ trợ tạm với cảnh báo, và bị bỏ ở 16). `useParams` là hook của Client Component.

## Page Server Component gọi `cookies()` từ `next/headers`. Điều gì xảy ra với cách render route này? [mid]
- [ ] Route vẫn được prerender tĩnh lúc build
- [ ] Build lỗi vì không được đọc cookie trên server
- [x] Route chuyển sang dynamic rendering (render ở thời điểm request)
- [ ] Cookie được đọc từ trình duyệt sau khi hydrate
> `cookies()`, `headers()`, `searchParams`... là dynamic API, chỉ biết được khi có request, nên Next.js không thể prerender route đó lúc build.

## Client Component muốn hiển thị một Server Component bên trong nó. Cách nào đúng? [mid]
- [ ] `import ServerComp from './ServerComp'` trực tiếp trong file `'use client'`
- [ ] Gọi `await ServerComp()` trong `useEffect`
- [ ] Thêm `'use server'` vào đầu file `ServerComp`
- [x] Ở component cha (server), truyền `<ServerComp />` vào Client Component qua `children` (hoặc một prop JSX)
> Mọi thứ được import vào module client đều trở thành client code. Truyền qua `children` để Server Component được render trên server và Client Component chỉ nhận kết quả đã render. `'use server'` dùng cho Server Functions, không phải component.

## Phát biểu nào về metadata trong App Router là ĐÚNG? [mid]
- [x] `export const metadata` / `generateMetadata` chỉ được hỗ trợ trong Server Component (`layout`/`page`), không dùng trong file `'use client'`
- [ ] Phải dùng `next/head` trong mỗi page
- [ ] Metadata của page luôn ghi đè hoàn toàn và không merge với layout
- [ ] `generateMetadata` chạy trên trình duyệt
> Metadata API chạy trên server; `next/head` là của Pages Router. Metadata được merge từ root layout xuống page, field trùng ở segment sâu hơn sẽ ghi đè.

## `next/font/google` hoạt động thế nào? [mid]
- [ ] Trình duyệt tải font trực tiếp từ Google Fonts ở runtime
- [x] Font được tải về lúc build và self-host cùng ứng dụng; trình duyệt không gửi request tới Google
- [ ] Font được nhúng base64 vào mọi trang HTML
- [ ] Chỉ hoạt động trong Pages Router
> `next/font` tải và self-host font, dùng `size-adjust` để giảm layout shift và tránh lộ request tới Google (tốt cho privacy/performance).

## Với code sau, truy cập `/blog/khong-ton-tai` (không có trong danh sách trả về) sẽ ra sao? [mid]
```tsx
export const dynamicParams = false;
export async function generateStaticParams() {
  return [{ slug: 'a' }, { slug: 'b' }];
}
```
- [ ] Render động lúc request rồi cache lại
- [ ] Hiển thị trang `a`
- [x] Trả về 404
- [ ] Build lỗi
> `generateStaticParams` prerender các params liệt kê lúc build. Mặc định `dynamicParams = true` sẽ render on-demand cho params mới; đặt `false` thì params ngoài danh sách trả 404.

## Trong Next.js 15, Route Handler `GET` sau có bị cache mặc định không? [senior]
```ts
export async function GET() {
  const data = await getStats();
  return Response.json(data);
}
```
- [ ] Có, `GET` luôn được cache tĩnh như Next.js 14
- [ ] Có, nhưng chỉ khi deploy lên Vercel
- [ ] Không, và không có cách nào để cache Route Handler
- [x] Không, từ Next.js 15 `GET` handler mặc định không cache; opt-in bằng `export const dynamic = 'force-static'`
> Next.js 14 cache `GET` handler mặc định (khi không dùng dynamic API); Next.js 15 đảo lại thành không cache, cùng đợt với thay đổi mặc định của `fetch` và Client Router Cache.

## Trong Next.js 15, giá trị mặc định của `staleTimes` cho Client Router Cache là gì? [senior]
- [ ] `dynamic: 30s`, `static: 5 phút`
- [x] `dynamic: 0`, `static: 5 phút`
- [ ] `dynamic: 0`, `static: 0`
- [ ] Cả hai đều cache tới khi reload trang
> Next.js 15 đặt `staleTimes.dynamic` mặc định là 0 nên page động được fetch lại khi điều hướng (back/forward vẫn khôi phục từ cache, layout/loading vẫn được tái sử dụng). Next.js 14 dùng 30s cho dynamic.

## Phát biểu nào về bảo mật Server Actions là ĐÚNG? [senior]
- [ ] Server Action chỉ gọi được từ chính form đã render nó nên không cần kiểm tra quyền
- [ ] Next.js tự động kiểm tra session người dùng trước khi chạy action
- [x] Server Action là endpoint POST công khai có thể bị gọi trực tiếp; phải xác thực, phân quyền và validate input bên trong action
- [ ] Server Action không nhận được dữ liệu từ người dùng nên không cần validate
> Next.js có ID action khó đoán, kiểm tra Origin, loại bỏ action không dùng, nhưng không thay thế authN/authZ. Hãy coi mỗi action như một API route public.

## Cách nào giúp ngăn module truy cập database bị import nhầm vào Client Component (và báo lỗi lúc build)? [senior]
- [ ] Đặt `'use server'` ở đầu module
- [x] `import 'server-only'` ở đầu module
- [ ] Đặt file trong thư mục `app/server/`
- [ ] Dùng biến môi trường không có prefix `NEXT_PUBLIC_`
> Package `server-only` gây build error nếu module bị import vào client bundle. `'use server'` biến các export thành Server Functions gọi được từ client – dùng sai còn mở thêm endpoint.

## Một component nằm trong `<Suspense>` gọi `notFound()` sau khi response đã bắt đầu stream. Status code HTTP trả về là gì? [senior]
- [ ] 404
- [ ] 500
- [x] 200, vì header đã gửi; Next.js chèn `<meta name="robots" content="noindex">` vào nội dung stream
- [ ] 302 tới trang not-found
> Khi streaming, status và headers được gửi cùng phần shell nên không thể đổi về sau. Next.js báo hiệu lỗi trong nội dung stream (render not-found UI, thêm noindex). Muốn có 404 thật, gọi `notFound()` trước khi stream (ngoài Suspense).

## Vì sao đoạn Server Action sau không redirect sau khi tạo user? [senior]
```ts
'use server';
export async function signup(formData: FormData) {
  try {
    await createUser(formData);
    redirect('/welcome');
  } catch (e) {
    return { error: 'Đăng ký thất bại' };
  }
}
```
- [x] `redirect()` hoạt động bằng cách ném một lỗi đặc biệt; `catch` đã nuốt lỗi đó và trả về `{ error }`
- [ ] `redirect()` không dùng được trong Server Action
- [ ] Phải `await redirect('/welcome')`
- [ ] Phải dùng `router.push` thay cho `redirect`
> `redirect()` (và `notFound()`) throw lỗi nội bộ để Next.js xử lý. Đặt `redirect` sau khối try/catch hoặc rethrow (ví dụ dùng `unstable_rethrow`).

## Phát biểu nào mô tả đúng Partial Prerendering (PPR)? [senior]
- [ ] Mỗi route chọn hoặc toàn bộ static hoặc toàn bộ dynamic, PPR chỉ giúp chọn tự động
- [ ] PPR render phần dynamic trên trình duyệt bằng `useEffect`
- [x] Một static shell được prerender sẵn và gửi ngay, các phần dynamic bọc trong `<Suspense>` được render và stream vào trong cùng response
- [ ] PPR tái tạo toàn trang theo chu kỳ như ISR
> PPR kết hợp static và dynamic trong một route: fallback của Suspense nằm trong shell tĩnh, phần dynamic stream từ server. Ở Next.js 14/15 đây là tính năng experimental (`experimental.ppr`), Next.js 16 đưa vào qua `cacheComponents`.

## Khi deploy với `output: 'standalone'` trong Docker, bước nào thường bị quên khiến CSS/JS và ảnh trong `public` bị 404? [senior]
- [ ] Không chạy `npm install` trong image runtime
- [ ] Không đặt `NODE_ENV=development`
- [ ] Không copy `next.config.js` vào image
- [x] Không copy `public/` và `.next/static/` vào cạnh `server.js` trong `.next/standalone`
> Standalone chỉ chứa `server.js` và các `node_modules` tối thiểu đã trace; `public` và `.next/static` được giả định phục vụ qua CDN nên phải tự copy nếu muốn server tự phục vụ.

## Build Docker image một lần, rồi chạy container với `NEXT_PUBLIC_API_URL` khác nhau cho staging/production. Kết quả ở client? [senior]
- [ ] Client đọc giá trị mới từ `process.env` lúc runtime
- [x] Client vẫn dùng giá trị lúc build, vì `NEXT_PUBLIC_*` được inline vào bundle JS khi `next build`
- [ ] Client nhận `undefined`
- [ ] Next.js tự rebuild khi khởi động container
> Biến `NEXT_PUBLIC_` được thay thế tĩnh lúc build. Muốn cấu hình runtime, đọc biến ở server (Server Component/Route Handler, vốn đọc `process.env` lúc request với dynamic rendering) rồi truyền xuống client.

## Trong Next.js 15, Client Component dùng `useSearchParams()` trong một route được prerender tĩnh mà không bọc `<Suspense>`. Điều gì xảy ra khi `next build`? [senior]
- [ ] Không có gì, `useSearchParams` hoạt động như trong route động
- [ ] Route tự động chuyển sang SSR, build vẫn thành công không cảnh báo
- [ ] `useSearchParams` trả về `null` vĩnh viễn
- [x] Build lỗi "Missing Suspense boundary with useSearchParams" vì phần đó phải bail out sang client rendering tới Suspense gần nhất
> Search params không biết được lúc prerender nên cây tới Suspense gần nhất phải render ở client; thiếu boundary thì cả trang bị ảnh hưởng và Next.js 15 coi là lỗi build. Bọc component trong `<Suspense>` để phần còn lại vẫn static.

## Khác biệt giữa `cache()` của React và `unstable_cache` của Next.js? [senior]
- [ ] Không khác, `unstable_cache` chỉ là alias
- [x] `React.cache` memo hoá kết quả trong phạm vi một request (dedupe khi render), còn `unstable_cache` lưu kết quả qua nhiều request/deploy và revalidate bằng tag/thời gian
- [ ] `React.cache` lưu kết quả vĩnh viễn trên disk, `unstable_cache` chỉ trong một request
- [ ] `React.cache` chỉ dùng được ở Client Component
> `cache()` giúp nhiều component gọi `getUser(id)` trong cùng một lần render chỉ query một lần, cache bị bỏ sau request. `unstable_cache` (thay thế dần bởi `'use cache'`) ghi vào Data Cache bền vững.

## Cấu trúc JSX nào sau đây gây hydration error do HTML lồng không hợp lệ? [senior]
- [ ] `<div><p>Nội dung</p></div>`
- [ ] `<ul><li><a href="/">Link</a></li></ul>`
- [x] `<p><div>Nội dung</div></p>`
- [ ] `<section><article>Nội dung</article></section>`
> Parser HTML tự đóng `<p>` khi gặp `<div>`, nên DOM thực tế khác cây React render trên server → mismatch khi hydrate. Các cấu trúc còn lại hợp lệ.
