---
id: nextjs
title: Next.js
icon: ▲
order: 10
description: Rendering strategies, App Router, Server/Client Components, data fetching & caching, Server Actions, Middleware, SEO, hiệu năng và triển khai Next.js.
---

# Tổng quan và chiến lược rendering

## Tại sao chọn Next.js thay vì React thuần (Vite SPA)? [junior]
Next.js là **React framework full-stack** cung cấp sẵn những thứ React thuần không có:

- **Nhiều chiến lược rendering**: SSR, SSG, ISR, CSR, streaming, Partial Prerendering – chọn theo từng route.
- **File-based routing** (App Router với layout lồng nhau).
- **React Server Components** và **Server Actions** – fetch dữ liệu, mutate ngay trên server.
- **Backend tích hợp**: Route Handlers, Middleware.
- **Tối ưu sẵn**: `next/image`, `next/font`, `next/link` prefetch, code splitting tự động.
- **SEO** tốt nhờ HTML được render sẵn, Metadata API.
- Tooling: Turbopack, TypeScript, ESLint.

Khi **không cần** Next.js: dashboard nội bộ sau đăng nhập, không cần SEO, đã có backend riêng → Vite SPA đơn giản và rẻ hơn khi host (chỉ static file).

**Lưu ý / bẫy thường gặp:** Next.js tăng độ phức tạp (môi trường server/client, caching, hạ tầng Node). Hãy trả lời theo yêu cầu dự án, không phải "Next.js luôn tốt hơn".

## So sánh CSR, SSR, SSG và ISR. [junior]
| | CSR | SSR | SSG | ISR |
|---|---|---|---|---|
| HTML tạo lúc | Trên trình duyệt | Mỗi request | Build time | Build time + tái tạo định kỳ/theo yêu cầu |
| TTFB | Nhanh (HTML rỗng) | Chậm hơn | Rất nhanh (CDN) | Rất nhanh |
| SEO | Kém | Tốt | Tốt | Tốt |
| Dữ liệu | Luôn mới (fetch client) | Luôn mới | Cũ đến lần build sau | Mới sau `revalidate` |
| Ví dụ | Dashboard | Trang cá nhân hóa, giỏ hàng | Blog, docs | Trang sản phẩm, tin tức |

- **CSR**: tải JS rồi mới render → màn hình trắng/spinner lâu.
- **SSR**: server render HTML mỗi request, sau đó **hydrate** để tương tác.
- **SSG**: HTML tĩnh, phục vụ từ CDN.
- **ISR**: SSG + cơ chế **stale-while-revalidate**: phục vụ bản cũ, tái tạo nền khi hết hạn.

**Lưu ý / bẫy thường gặp:** trong App Router không còn tên API riêng – chiến lược được suy ra từ cách bạn fetch/cấu hình (static vs dynamic rendering, `revalidate`).

## Pages Router và App Router khác nhau thế nào? [mid]
| | Pages Router (`pages/`) | App Router (`app/`) |
|---|---|---|
| Component mặc định | Client Component (render cả server lẫn client) | **Server Component** |
| Data fetching | `getServerSideProps`, `getStaticProps` | `async` component + `fetch`/DB trực tiếp |
| Layout | `_app`, `_document`, layout thủ công | `layout.tsx` lồng nhau, giữ state khi điều hướng |
| Loading/Error | Tự xử lý | `loading.tsx`, `error.tsx` (Suspense/Error Boundary) |
| Streaming | Hạn chế | Có sẵn |
| Mutation | API Routes | **Server Actions** + Route Handlers |
| API | `pages/api/*` | `app/**/route.ts` |

App Router là hướng phát triển chính (React 19, RSC, PPR, `use cache`). Pages Router vẫn được hỗ trợ; hai router có thể **cùng tồn tại** để migrate từng phần.

**Lưu ý / bẫy thường gặp:** điều hướng giữa hai router là hard navigation (tải lại trang). `next/router` dùng cho Pages, `next/navigation` cho App Router.

## Giải thích `getServerSideProps`, `getStaticProps` và `getStaticPaths` (Pages Router). [mid]
- **`getServerSideProps`**: chạy trên server **mỗi request** → SSR. Có `req`, `res`, cookies, query.
- **`getStaticProps`**: chạy lúc **build** → SSG; thêm `revalidate: 60` → ISR.
- **`getStaticPaths`**: dùng với route động + `getStaticProps`, khai báo các path cần pre-render.

```tsx
export async function getStaticPaths() {
  const posts = await getTopPosts();
  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: 'blocking', // path chưa build sẽ SSR lần đầu rồi cache
  };
}

export async function getStaticProps({ params }) {
  const post = await getPost(params.slug);
  if (!post) return { notFound: true };
  return { props: { post }, revalidate: 60 };
}
```

`fallback`: `false` (404 cho path lạ), `true` (hiện fallback UI rồi load), `'blocking'` (chờ SSR).

**Lưu ý / bẫy thường gặp:** các hàm này chỉ dùng được trong file page, không trong component con; props trả về phải serializable (không `Date`, `undefined`). Tương đương App Router: `generateStaticParams`, `export const revalidate`, `dynamicParams`.

## Hydration là gì? [junior]
**Hydration** là quá trình React trên client "gắn" event handler và state vào HTML đã được server render sẵn, biến trang tĩnh thành ứng dụng tương tác. React không tạo lại DOM mà **tái sử dụng** DOM hiện có, và mong đợi output render trên client **khớp chính xác** với HTML từ server.

Chi phí hydration: phải tải và chạy JS của mọi Client Component → trang "nhìn thấy được" nhưng chưa "bấm được" (ảnh hưởng INP/TTI).

Cách giảm chi phí:
- Dùng **Server Components** – không cần hydrate.
- Đẩy `'use client'` xuống lá của cây.
- **Selective hydration** với Suspense (React 18): hydrate từng phần, ưu tiên phần user đang tương tác.
- Lazy load component nặng (`next/dynamic`).

# App Router: routing và file conventions

## Các file convention trong App Router gồm những gì? [junior]
| File | Vai trò |
|---|---|
| `page.tsx` | UI của route, làm route có thể truy cập công khai |
| `layout.tsx` | UI bao quanh, **giữ state, không re-render** khi điều hướng giữa các trang con |
| `template.tsx` | Giống layout nhưng **remount** mỗi lần điều hướng |
| `loading.tsx` | Fallback tự động bọc page trong `<Suspense>` |
| `error.tsx` | Error Boundary (phải là Client Component), có `reset()` |
| `global-error.tsx` | Bắt lỗi ở root layout |
| `not-found.tsx` | UI khi gọi `notFound()` hoặc URL không khớp |
| `route.ts` | Route Handler (API) |
| `default.tsx` | Fallback cho parallel route slot |

Thứ tự lồng: `layout` > `template` > `error` > `loading` > `not-found` > `page`.

```text
app/
  layout.tsx
  dashboard/
    layout.tsx
    loading.tsx
    error.tsx
    page.tsx
```

**Lưu ý / bẫy thường gặp:** `error.tsx` không bắt lỗi của `layout.tsx` cùng cấp – lỗi đó lên `error.tsx` của cấp cha. File khác trong thư mục (component, util) không thành route nếu không có `page`/`route`.

## Route groups, private folders và dynamic routes hoạt động thế nào? [mid]
- **Route group `(name)`**: tổ chức thư mục, **không ảnh hưởng URL**. Dùng để có nhiều root layout hoặc layout riêng cho nhóm trang: `app/(marketing)/about/page.tsx` → `/about`.
- **Private folder `_name`**: loại khỏi routing, chứa component/util nội bộ.
- **Dynamic segment**:
  - `[slug]` → `/blog/hello`
  - `[...slug]` catch-all → `/docs/a/b/c` (không khớp `/docs`)
  - `[[...slug]]` optional catch-all → khớp cả `/docs`

```tsx
// app/blog/[slug]/page.tsx (Next 15+: params là Promise)
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return <article>{post.title}</article>;
}

export async function generateStaticParams() {
  return (await getPosts()).map(p => ({ slug: p.slug }));
}
```

**Lưu ý / bẫy thường gặp:** từ Next 15, `params`, `searchParams`, `cookies()`, `headers()` là **async** – phải `await`.

## Parallel routes và intercepting routes là gì? [senior]
**Parallel routes** (`@slot`): render **nhiều trang độc lập cùng lúc** trong một layout, mỗi slot có loading/error riêng.

```text
app/dashboard/
  layout.tsx       -> nhận props { children, analytics, team }
  @analytics/page.tsx
  @team/page.tsx
  @team/default.tsx
```

Dùng cho dashboard nhiều panel, hiển thị có điều kiện theo quyền (`isAdmin ? admin : user`).

**Intercepting routes** `(.)`, `(..)`, `(..)(..)`, `(...)`: chặn một route để hiển thị trong ngữ cảnh hiện tại (thường là modal), trong khi truy cập trực tiếp URL vẫn ra trang đầy đủ.

```text
app/
  feed/page.tsx
  photo/[id]/page.tsx            -> trang đầy đủ khi mở link/refresh
  @modal/(.)photo/[id]/page.tsx  -> modal khi click từ feed
  @modal/default.tsx             -> trả về null
```

Kết hợp hai tính năng → **modal có URL chia sẻ được**, back button đóng modal, refresh vẫn giữ nội dung.

**Lưu ý / bẫy thường gặp:** thiếu `default.tsx` cho slot sẽ gây 404 khi hard navigation; `(..)` dựa trên route segment, không phải thư mục vật lý.

## `next/link` và prefetching hoạt động thế nào? [junior]
`<Link>` thực hiện **client-side navigation** (không tải lại trang, giữ layout và state) và **prefetch** route đích.

Prefetch trong App Router (production):
- Khi Link vào **viewport** thì prefetch.
- Route **static**: prefetch toàn bộ RSC payload.
- Route **dynamic**: chỉ prefetch tới `loading.tsx` gần nhất (shared layout + skeleton), phần còn lại tải khi click.
- `prefetch={true}` buộc prefetch đầy đủ; `prefetch={false}` tắt.

```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

<Link href={`/products/${id}`}>Chi tiết</Link>

const router = useRouter();
router.push('/login');
router.refresh(); // fetch lại dữ liệu server, giữ client state
```

**Router cache** phía client lưu RSC payload của trang đã truy cập để back/forward tức thì.

**Lưu ý / bẫy thường gặp:** prefetch chỉ chạy ở production build. Dùng `<a>` thường cho route nội bộ sẽ mất client navigation.

# Server Components và Client Components

## Server Component và Client Component khác nhau thế nào trong Next.js? [junior]
Trong App Router, mọi component **mặc định là Server Component**. Thêm `'use client'` ở đầu file để tạo Client Component.

| Cần làm | Server | Client |
|---|---|---|
| Fetch dữ liệu, truy cập DB, dùng secret | ✅ | ❌ |
| Giảm JS gửi về client | ✅ | ❌ |
| `useState`, `useEffect`, context | ❌ | ✅ |
| Event handler (`onClick`, `onChange`) | ❌ | ✅ |
| Browser API (`window`, `localStorage`) | ❌ | ✅ |

```tsx
// app/products/page.tsx – Server Component
export default async function Page() {
  const products = await db.product.findMany();
  return <ProductList products={products} />;
}
```

**Lưu ý / bẫy thường gặp:** Client Component **vẫn được pre-render ra HTML trên server** (SSR) rồi hydrate – "client" nghĩa là có mặt trong bundle client, không phải "chỉ chạy ở trình duyệt". Vì vậy truy cập `window` lúc render vẫn lỗi.

## `'use client'` boundary hoạt động thế nào? [mid]
`'use client'` đánh dấu **ranh giới** giữa module graph server và client: file đó **và mọi module nó import** đều thuộc client bundle.

Hệ quả & best practice:
- Không cần đặt `'use client'` ở mọi file – chỉ ở **entry point** của phần tương tác.
- **Đẩy boundary xuống lá**: tách nút `LikeButton` thành Client Component thay vì biến cả trang thành client.
- Client Component **không import** Server Component, nhưng có thể nhận Server Component qua **`children` hoặc props** (composition pattern).

```tsx
// ClientShell.tsx
'use client';
export function Tabs({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState(0);
  return <div onClick={() => setTab(1)}>{children}</div>;
}

// page.tsx (Server)
<Tabs>
  <ServerRenderedContent /> {/* vẫn là Server Component */}
</Tabs>
```

**Lưu ý / bẫy thường gặp:** thư viện bên thứ ba dùng hook mà chưa có `'use client'` → bọc lại trong file client của bạn. Context Provider phải là Client Component, đặt sâu nhất có thể.

## Props truyền từ Server sang Client Component cần điều kiện gì? [mid]
Props đi qua ranh giới server → client phải **serializable** bởi React (được đóng gói vào RSC payload).

Được phép:
- Primitive, plain object, array, `Date`, `Map`, `Set`, `BigInt`, typed array.
- **Promise** (client đọc bằng `use()`).
- **JSX/Server Component** đã render.
- **Server Function** (`'use server'`) – truyền như một tham chiếu.

Không được phép:
- Function thường, class instance, Symbol không đăng ký, object có prototype tùy chỉnh.

```tsx
// Sai: truyền callback thường
<ClientButton onClick={() => console.log('x')} />

// Đúng: truyền Server Action
async function like() { 'use server'; await db.like.create(...); }
<ClientButton onClick={like} />
```

**Lưu ý / bẫy thường gặp:** mọi prop gửi xuống client đều **lộ ra trong HTML/payload** – đừng truyền cả object user từ DB (password hash, token). Chọn field cần thiết (DTO), dùng package `server-only` để ngăn module nhạy cảm bị import vào client, và React Taint API nếu cần.

## Khi nào phải dùng Client Component? [junior]
Dùng Client Component khi cần:
- **Tương tác**: `onClick`, `onChange`, form có state UI phức tạp.
- **State & lifecycle**: `useState`, `useReducer`, `useEffect`, `useRef`.
- **Browser API**: `window`, `localStorage`, `IntersectionObserver`, geolocation.
- **Context** (Provider/consumer), thư viện dựa trên hook (TanStack Query, Zustand, form library, chart library).
- Custom hook dùng các thứ trên.

Còn lại (hiển thị dữ liệu, layout, nội dung tĩnh, markdown) nên giữ là Server Component.

```tsx
'use client';
import { useEffect, useState } from 'react';

export function OnlineBadge() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return <span>{online ? 'Online' : 'Offline'}</span>;
}
```

**Lưu ý / bẫy thường gặp:** component chỉ cần browser API ở client có thể dùng `next/dynamic` với `ssr: false` (chỉ gọi được trong Client Component).

# Data fetching và caching trong App Router

## Data fetching trong App Router khác gì Pages Router? [mid]
Trong App Router, Server Component là `async` function – **fetch trực tiếp** trong component, không cần `getServerSideProps`.

```tsx
export default async function Page() {
  const [user, orders] = await Promise.all([getUser(), getOrders()]); // song song
  return <Dashboard user={user} orders={orders} />;
}
```

Nguyên tắc:
- **Fetch ở nơi cần dùng** (colocation); request trùng trong cùng một render được **dedupe** (request memoization của `fetch`, hoặc `React.cache` cho DB/ORM).
- Tránh **waterfall**: chạy song song bằng `Promise.all`, hoặc tách component + Suspense để stream.
- Gọi DB/service trực tiếp – **không gọi Route Handler của chính mình** từ Server Component (thêm một hop HTTP thừa).
- Client-side fetching (TanStack Query, SWR) vẫn dùng cho dữ liệu realtime, polling, infinite scroll.

```typescript
import { cache } from 'react';
export const getUser = cache(async (id: string) => db.user.findUnique({ where: { id } }));
```

## Giải thích các lớp cache của Next.js. [senior]
| Cache | Ở đâu | Lưu gì | Thời gian |
|---|---|---|---|
| Request Memoization | Server | Kết quả `fetch` trùng trong **một lần render** | 1 request |
| Data Cache | Server | Kết quả `fetch` (persistent qua request/deploy) | Đến khi revalidate |
| Full Route Cache | Server | HTML + RSC payload của route static | Đến khi revalidate/redeploy |
| Router Cache | Client (memory) | RSC payload các route đã xem | Phiên làm việc / theo `staleTimes` |

Cách invalidate:
- **Time-based**: `fetch(url, { next: { revalidate: 60 } })` hoặc `export const revalidate = 60`.
- **On-demand**: `revalidatePath('/blog')`, `revalidateTag('posts')` (gắn tag qua `next: { tags: ['posts'] }`), `updateTag` trong Server Action.
- Opt-out: `cache: 'no-store'`, dùng dynamic API (`cookies()`, `headers()`, `searchParams`).
- Client: `router.refresh()`; Server Action gọi revalidate cũng làm mới Router Cache.

**Lưu ý / bẫy thường gặp:** "trang không cập nhật dữ liệu mới" thường do Full Route Cache – route bị build static. Kiểm tra output `next build` (ký hiệu ○ static, ƒ dynamic).

## Next.js 15 thay đổi caching mặc định thế nào? [senior]
Next 14 bị phàn nàn vì **cache quá mạnh mặc định**. Next 15 đổi sang **opt-in caching**:

| | Next 14 | Next 15 |
|---|---|---|
| `fetch()` | `force-cache` mặc định | **Không cache** mặc định (`no-store`) |
| GET Route Handler | Static/cached mặc định | **Dynamic** mặc định |
| Router Cache cho page | Giữ 30s (dynamic) | `staleTime` = 0 cho page (layout vẫn giữ, back/forward vẫn dùng cache) |
| `params`, `cookies()`, `headers()` | Đồng bộ | **Async** |

Muốn cache trong Next 15:
```typescript
fetch(url, { cache: 'force-cache' });
fetch(url, { next: { revalidate: 3600, tags: ['products'] } });
export const dynamic = 'force-static';
```

Lưu ý: một route vẫn có thể được **prerender static** nếu không dùng dynamic API; fetch không cache trong route static sẽ chạy lúc build.

Next 16 tiếp tục hướng này với **Cache Components** (`"use cache"`, `cacheLife`, `cacheTag`) thay cho các route segment config như `dynamic`, `revalidate`.

## Directive `"use cache"` là gì? [senior]
`"use cache"` (Cache Components – thử nghiệm ở Next 15 qua `dynamicIO`, ổn định hơn ở Next 16 với `cacheComponents: true`) cho phép **cache ở mức file, component hoặc function**, không chỉ `fetch`.

```tsx
import { cacheLife, cacheTag } from 'next/cache';

export async function getProducts(category: string) {
  'use cache';
  cacheLife('hours');           // profile: seconds, minutes, hours, days, max
  cacheTag(`products-${category}`);
  return db.product.findMany({ where: { category } });
}
```

Đặc điểm:
- **Cache key** tự sinh từ arguments và các biến closure (phải serializable).
- Hoạt động với mọi nguồn dữ liệu (ORM, SDK), không phụ thuộc `fetch`.
- Invalidate bằng `revalidateTag`/`updateTag`.
- Kết hợp **Partial Prerendering**: phần được cache vào static shell, phần dynamic bọc trong Suspense.

**Lưu ý / bẫy thường gặp:** không đọc `cookies()`/`headers()` bên trong scope cached – đọc bên ngoài rồi truyền giá trị vào làm argument. Biến thể `'use cache: private'`/`'use cache: remote'` cho trường hợp đặc thù.

## Static rendering và dynamic rendering được quyết định thế nào? [mid]
Mặc định Next.js cố gắng **render static lúc build**. Route chuyển sang **dynamic (render mỗi request)** khi dùng:

- Dynamic API: `cookies()`, `headers()`, `connection()`, `draftMode()`, prop `searchParams`.
- `fetch` với `cache: 'no-store'` (trong Next 14; Next 15 fetch không cache vẫn có thể chạy lúc build nếu không có dynamic API).
- Route segment config: `export const dynamic = 'force-dynamic'`.

Cấu hình liên quan:
```typescript
export const dynamic = 'auto' | 'force-dynamic' | 'force-static' | 'error';
export const revalidate = 60;       // ISR cho cả segment
export const dynamicParams = false; // path ngoài generateStaticParams -> 404
```

Kiểm tra bằng output `next build`: `○` static, `●` SSG với params, `ƒ` dynamic.

**Lưu ý / bẫy thường gặp:** một lời gọi `cookies()` trong layout gốc (ví dụ đọc theme) làm **toàn bộ app thành dynamic**. Đẩy phần dynamic xuống thấp hoặc bọc trong Suspense (PPR).

# Server Actions và Route Handlers

## Server Actions là gì? Dùng với form thế nào? [mid]
**Server Actions** là async function chạy trên server, đánh dấu bằng `'use server'`, có thể gọi trực tiếp từ form hoặc Client Component. Next.js tự tạo endpoint POST ẩn.

```tsx
// app/actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(prevState: State, formData: FormData) {
  const parsed = schema.safeParse({ title: formData.get('title') });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  await db.post.create({ data: parsed.data });
  revalidatePath('/posts');
  redirect('/posts');
}
```

```tsx
'use client';
const [state, formAction, pending] = useActionState(createPost, {});
<form action={formAction}>
  <input name="title" />
  <button disabled={pending}>Tạo</button>
</form>
```

Ưu điểm: **progressive enhancement** (form chạy khi JS chưa load), không cần viết API, revalidate cache và cập nhật UI trong một round-trip.

**Lưu ý / bẫy thường gặp:** Server Action chạy tuần tự (không song song) và dùng POST – không dùng để fetch dữ liệu; dùng cho mutation.

## Những vấn đề bảo mật cần chú ý với Server Actions? [senior]
Mỗi Server Action là **một endpoint public** – ai cũng có thể gọi với tham số tùy ý, kể cả khi nút bấm bị ẩn trên UI.

Checklist:
1. **Authentication & authorization trong từng action**: kiểm tra session và quyền sở hữu resource, không tin vào việc "chỉ admin mới thấy nút".
2. **Validate input** bằng Zod – `FormData`/arguments đều do client kiểm soát.
3. **Không tin dữ liệu ẩn** (hidden input chứa `userId`, giá tiền) – lấy từ session/DB.
4. **Closure encryption**: biến được closure trong action inline được mã hóa, nhưng vẫn không nên đặt secret ở đó.
5. **Rate limiting** cho action nhạy cảm (login, gửi mail).
6. Trả lỗi chung chung, không lộ stack trace.

```typescript
'use server';
export async function deletePost(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const post = await db.post.findUnique({ where: { id } });
  if (post?.authorId !== session.user.id) throw new Error('Forbidden');
  await db.post.delete({ where: { id } });
}
```

Next.js có sẵn: chống CSRF bằng kiểm tra `Origin` vs `Host`, ID action không đoán được, loại bỏ action không dùng khỏi build. Đặt logic truy cập dữ liệu trong **Data Access Layer** riêng.

## Route Handlers là gì? Khi nào dùng thay cho Server Actions? [mid]
**Route Handlers** (`app/**/route.ts`) định nghĩa endpoint HTTP với Web `Request`/`Response` API, export theo method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`...

```typescript
// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}
```

| Dùng Route Handler | Dùng Server Action |
|---|---|
| API cho bên thứ ba, mobile app | Mutation từ UI của chính app |
| Webhook (Stripe, GitHub) | Submit form |
| Trả file, stream, RSS, sitemap động | Cập nhật dữ liệu + revalidate |
| Cần GET cacheable, CORS, method tùy ý | Gọi function như RPC |

**Lưu ý / bẫy thường gặp:** `route.ts` và `page.tsx` không được cùng một segment. Không fetch Route Handler của chính app từ Server Component.

# Middleware, streaming và rendering nâng cao

## Middleware trong Next.js dùng để làm gì? [mid]
**Middleware** (`middleware.ts` ở root; Next 16 đổi tên thành **`proxy.ts`**) chạy **trước khi request tới route**, có thể rewrite, redirect, sửa header/cookie hoặc trả response.

Use case: redirect khi chưa đăng nhập, i18n (chọn locale), A/B testing, chặn bot/geo, thêm security header.

```typescript
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token && req.nextUrl.pathname.startsWith('/dashboard')) {
    const url = new URL('/login', req.url);
    url.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Lưu ý / bẫy thường gặp:**
- Mặc định chạy **Edge runtime** (Next 15.5+ hỗ trợ Node.js runtime) – Edge không có đầy đủ Node API, nhiều ORM/driver DB không chạy.
- Chạy cho mọi request khớp matcher → giữ logic nhẹ, không truy vấn DB nặng.
- **Không chỉ dựa vào middleware để bảo vệ** (từng có CVE-2025-29927 bypass middleware qua header) – luôn kiểm tra auth lại ở page/Server Action/data layer.

## Edge runtime khác Node.js runtime thế nào? [senior]
| | Edge runtime | Node.js runtime |
|---|---|---|
| Nền tảng | V8 isolate, Web API chuẩn | Node.js đầy đủ |
| Cold start | Rất nhanh | Chậm hơn |
| Vị trí | Gần user (CDN edge) | Region server |
| API | `fetch`, `Request`, `crypto.subtle`, Streams | Toàn bộ Node API: `fs`, `net`, native module |
| Giới hạn | Kích thước code, thời gian chạy, không TCP | Ít giới hạn |
| Phù hợp | Middleware, redirect, personalization nhẹ | DB access, xử lý nặng, thư viện Node |

```typescript
export const runtime = 'edge'; // trong route.ts hoặc page
```

**Lưu ý / bẫy thường gặp:** chạy ở edge nhưng DB ở một region xa → mỗi query đi vòng xa, **chậm hơn** Node runtime đặt cạnh DB. Next.js khuyến nghị Node.js runtime cho phần lớn trường hợp; edge chỉ dùng khi có lý do rõ ràng.

## Streaming và Suspense trong Next.js hoạt động thế nào? [mid]
**Streaming** cho phép server gửi HTML **từng phần**: phần nhanh (layout, header) hiển thị ngay, phần chậm được gửi sau khi dữ liệu sẵn sàng, cùng một HTTP response.

Hai cách:
1. **`loading.tsx`**: tự bọc toàn bộ `page` trong Suspense – fallback ở cấp route.
2. **`<Suspense>` thủ công**: chi tiết hơn, mỗi khối dữ liệu chậm stream độc lập.

```tsx
export default function Page() {
  return (
    <>
      <ProductInfo />                       {/* nhanh */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />                          {/* async, chậm */}
      </Suspense>
      <Suspense fallback={<RecoSkeleton />}>
        <Recommendations />
      </Suspense>
    </>
  );
}
```

Lợi ích: giảm **TTFB/FCP**, tránh "tất cả hoặc không có gì" của SSR truyền thống, selective hydration.

**Lưu ý / bẫy thường gặp:** `await` dữ liệu chậm ở cấp page sẽ chặn cả trang – đẩy việc fetch xuống component con bên trong Suspense. Status code và header phải quyết định trước khi stream bắt đầu (redirect/notFound sau đó dùng meta tag).

## Partial Prerendering (PPR) là gì? [senior]
**PPR** kết hợp static và dynamic **trong cùng một route**:
- Lúc build, Next.js prerender **static shell** (layout, nội dung không phụ thuộc request) – phục vụ tức thì từ CDN.
- Các phần dynamic (giỏ hàng, thông tin user) được bọc trong `<Suspense>`, để lại "lỗ" (hole) và được **stream** vào trong cùng response khi request đến.

```tsx
export default function ProductPage() {
  return (
    <main>
      <ProductDetails />                 {/* static / "use cache" */}
      <Suspense fallback={<CartSkeleton />}>
        <UserCart />                     {/* đọc cookies() -> dynamic */}
      </Suspense>
    </main>
  );
}
```

Lợi ích: TTFB như trang static nhưng vẫn cá nhân hóa – không phải chọn static **hoặc** dynamic cho cả route.

Trạng thái: thử nghiệm ở Next 14/15 (`experimental.ppr`), Next 16 tích hợp vào **Cache Components** (`cacheComponents: true`), nơi dynamic là mặc định và `"use cache"` đánh dấu phần được đưa vào shell.

**Lưu ý / bẫy thường gặp:** đọc dynamic API ngoài Suspense boundary sẽ làm cả route dynamic hoặc báo lỗi build.

# SEO, tối ưu tài nguyên và môi trường

## Metadata API trong App Router dùng thế nào cho SEO? [junior]
Export `metadata` (tĩnh) hoặc `generateMetadata` (động) từ `layout.tsx`/`page.tsx`. Next.js tự sinh thẻ `<title>`, `<meta>`, Open Graph, Twitter card, canonical.

```tsx
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug); // được dedupe với lần fetch trong page
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { images: [post.cover] },
  };
}
```

Bổ sung:
- Template title ở root layout: `title: { template: '%s | Shop', default: 'Shop' }`.
- File convention: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx` (sinh ảnh OG động), `icon.png`.
- **JSON-LD** structured data qua `<script type="application/ld+json">`.
- `metadataBase` để resolve URL tuyệt đối.

**Lưu ý / bẫy thường gặp:** `metadata` chỉ dùng được trong Server Component. Không dùng `next/head` trong App Router.

## `next/image` tối ưu ảnh như thế nào? [junior]
Component `<Image>` tự động:
- **Resize & chuyển định dạng** (WebP/AVIF) theo thiết bị, sinh `srcset`.
- **Lazy loading** mặc định.
- **Tránh layout shift (CLS)**: bắt buộc `width`/`height` hoặc `fill` để giữ chỗ.
- Cache ảnh đã tối ưu.

```tsx
import Image from 'next/image';
import hero from './hero.jpg'; // static import -> tự biết kích thước, có blur placeholder

<Image src={hero} alt="Banner" priority placeholder="blur" />

<div style={{ position: 'relative', aspectRatio: '16/9' }}>
  <Image src={product.url} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" />
</div>
```

Cấu hình ảnh ngoài trong `next.config`: `images.remotePatterns`.

**Lưu ý / bẫy thường gặp:**
- Ảnh LCP (hero) phải có `priority` (Next 16: `preload`) – nếu không bị lazy load làm LCP chậm.
- Thiếu `sizes` với `fill` → trình duyệt tải ảnh quá lớn.
- Self-host: tối ưu ảnh tốn CPU (cần `sharp`), có thể dùng loader CDN.

## `next/font` giải quyết vấn đề gì? [mid]
`next/font` tối ưu font tự động:
- **Self-host** Google Fonts lúc build – không có request tới Google khi chạy (nhanh hơn, tốt cho privacy/GDPR).
- **Không layout shift**: tự tính `size-adjust` cho fallback font, giảm CLS khi font swap.
- Chỉ tải subset và weight cần dùng, preload tự động.

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';
import localFont from 'next/font/local';

const inter = Inter({ subsets: ['latin', 'vietnamese'], display: 'swap', variable: '--font-inter' });
const brand = localFont({ src: './Brand.woff2', variable: '--font-brand' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${brand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Lưu ý / bẫy thường gặp:** gọi font loader ở top-level module và tái sử dụng – gọi ở nhiều file tạo nhiều bản font. Với tiếng Việt nhớ thêm subset `vietnamese`. Dùng variable font để giảm số file.

## Biến môi trường trong Next.js hoạt động thế nào? `NEXT_PUBLIC_` nghĩa là gì? [junior]
Next.js tự load `.env`, `.env.local`, `.env.development`, `.env.production` (`.env*.local` không commit).

- Biến **không có prefix**: chỉ có trên **server** (Server Component, Route Handler, Server Action).
- Biến **`NEXT_PUBLIC_*`**: được **inline vào JS bundle lúc build** → dùng được trên client và **ai cũng đọc được**.

```bash
DATABASE_URL=postgres://...          (chỉ server)
STRIPE_SECRET_KEY=sk_live_...        (chỉ server)
NEXT_PUBLIC_API_URL=https://api.example.com   (lộ ra client)
```

**Lưu ý / bẫy thường gặp:**
- Không bao giờ đặt secret với prefix `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_*` bị "đóng băng" lúc build → với Docker build một lần, deploy nhiều môi trường, giá trị không đổi theo môi trường runtime. Giải pháp: đọc biến ở server và truyền xuống, hoặc endpoint config runtime.
- Truy cập động `process.env[key]` không được inline.
- Validate env bằng Zod (`@t3-oss/env-nextjs`) để fail sớm khi thiếu biến.

## Triển khai authentication trong Next.js (Auth.js/NextAuth) thế nào? [senior]
**Auth.js (NextAuth v5)** hỗ trợ OAuth providers, credentials, magic link, session JWT hoặc database session (qua adapter Prisma/Drizzle).

```typescript
// auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' },
  callbacks: {
    authorized: ({ auth }) => !!auth, // dùng trong middleware
  },
});

// app/api/auth/[...nextauth]/route.ts
export const { GET, POST } = handlers;
```

Bảo vệ theo nhiều lớp:
1. **Middleware**: redirect sớm, kiểm tra nhẹ (cookie/JWT), tối ưu UX.
2. **Server Component/layout**: `const session = await auth(); if (!session) redirect('/login')`.
3. **Server Action/Route Handler/Data Access Layer**: kiểm tra lại auth và quyền – đây là lớp bắt buộc.

Lựa chọn khác: Clerk, Better Auth, Supabase Auth, tự làm với session cookie `HttpOnly`.

**Lưu ý / bẫy thường gặp:** kiểm tra auth chỉ ở layout là chưa đủ – layout không re-render khi điều hướng và không bảo vệ Server Action/Route Handler. Không truyền session đầy đủ (token) xuống Client Component.

# Hiệu năng, debugging và triển khai

## Lỗi hydration mismatch là gì, nguyên nhân và cách sửa? [mid]
Lỗi xảy ra khi HTML render trên server **khác** với lần render đầu trên client. React sẽ cảnh báo và có thể render lại cả cây phía client (chậm, nháy UI).

Nguyên nhân thường gặp:
- Giá trị khác nhau giữa server/client: `Date.now()`, `new Date().toLocaleString()` (khác timezone), `Math.random()`.
- Đọc `window`, `localStorage`, `typeof window !== 'undefined'` để rẽ nhánh khi render.
- HTML lồng sai: `<p>` chứa `<div>`, `<a>` trong `<a>`, `<table>` thiếu `<tbody>`.
- Browser extension sửa DOM (thêm attribute vào `<body>`/`<html>`).

Cách sửa:
```tsx
'use client';
function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => setText(new Date(iso).toLocaleString('vi-VN')), [iso]);
  return <time dateTime={iso}>{text ?? ''}</time>;
}
```
- Chuyển logic phụ thuộc browser vào `useEffect`.
- `next/dynamic(() => import(...), { ssr: false })` cho component chỉ chạy client.
- `suppressHydrationWarning` cho trường hợp nhỏ, cố ý (timestamp, `<html>` với theme script).
- Sửa cấu trúc HTML không hợp lệ.

**Lưu ý / bẫy thường gặp:** `suppressHydrationWarning` chỉ có tác dụng một cấp, không phải giải pháp chung.

## Tối ưu Core Web Vitals cho ứng dụng Next.js thế nào? [senior]
| Chỉ số | Ý nghĩa | Ngưỡng tốt | Cách cải thiện trong Next.js |
|---|---|---|---|
| **LCP** | Thời gian hiển thị phần tử lớn nhất | ≤ 2.5s | Static/ISR/PPR, `next/image` với `priority`, `next/font`, giảm TTFB, CDN |
| **INP** | Độ trễ phản hồi tương tác | ≤ 200ms | Ít JS client (Server Components), code splitting, `useTransition`, tránh long task |
| **CLS** | Độ dịch chuyển layout | ≤ 0.1 | Kích thước ảnh, `next/font`, skeleton có kích thước cố định |

Thêm:
- **Đo thực tế**: `useReportWebVitals`, Vercel Speed Insights, Chrome UX Report; lab: Lighthouse.
- Script bên thứ ba: `next/script` với `strategy="lazyOnload"`/`afterInteractive`, hoặc Partytown.
- Giảm JS: đẩy `'use client'` xuống lá, `next/dynamic` cho component nặng, `optimizePackageImports` cho thư viện icon/UI lớn.
- Streaming với Suspense để FCP sớm.

**Lưu ý / bẫy thường gặp:** điểm Lighthouse (lab) khác dữ liệu field (người dùng thật) – Google xếp hạng theo field data.

## Phân tích và giảm bundle size trong Next.js thế nào? [mid]
Công cụ:
- `@next/bundle-analyzer` – treemap các chunk client/server.
- Next 16.1+: `next experimental-analyze` (bundle analyzer tích hợp cho Turbopack).
- Output `next build` hiển thị kích thước First Load JS mỗi route.

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });
module.exports = withBundleAnalyzer({
  experimental: { optimizePackageImports: ['lodash-es', 'lucide-react'] },
});
```

Chiến lược giảm:
- Chuyển component sang **Server Component** (thư viện markdown, date, syntax highlight chạy trên server → 0 KB client).
- `next/dynamic` cho modal, chart, editor.
- Thay thư viện nặng: `moment` → `date-fns`/`dayjs`; import theo path (`lodash-es/debounce`).
- Kiểm tra dependency bị kéo vào client do `'use client'` ở file cao.
- Dùng package `server-only` để chặn code server lọt vào client.

**Lưu ý / bẫy thường gặp:** barrel file (`index.ts` re-export mọi thứ) có thể làm tree-shaking kém.

## Turbopack là gì? [junior]
**Turbopack** là bundler viết bằng **Rust**, kế nhiệm Webpack trong Next.js.

- Dev server khởi động và **Fast Refresh nhanh hơn nhiều** nhờ incremental computation (chỉ tính lại phần thay đổi, cache theo function).
- `next dev --turbopack` stable từ Next 15; `next build --turbopack` beta ở 15.5; từ **Next 16 Turbopack là bundler mặc định** cho cả dev và build.
- Có file system caching để khởi động lại nhanh hơn.

So với Webpack:
| | Webpack | Turbopack |
|---|---|---|
| Ngôn ngữ | JavaScript | Rust |
| HMR ở dự án lớn | Chậm dần | Gần như không đổi |
| Plugin ecosystem | Rất lớn | Hỗ trợ webpack loader phổ biến, không hỗ trợ plugin webpack tùy ý |

**Lưu ý / bẫy thường gặp:** dự án có cấu hình `webpack()` tùy chỉnh trong `next.config` cần chuyển sang `turbopack` config hoặc chạy với cờ `--webpack`.

## Triển khai Next.js: Vercel và self-host bằng Docker khác nhau thế nào? [mid]
**Vercel**: zero-config, hỗ trợ đầy đủ mọi tính năng (ISR, PPR, image optimization, edge middleware, preview deployment mỗi PR), CDN toàn cầu. Đổi lại: chi phí tăng theo traffic, phụ thuộc nhà cung cấp.

**Self-host** (Node server, Docker, Kubernetes, hoặc các nền tảng như Netlify, Cloudflare qua OpenNext adapter):
- `next start` với Node.js hỗ trợ hầu hết tính năng.
- `output: 'standalone'` tạo thư mục `.next/standalone` chỉ chứa file cần thiết + `server.js` → image Docker nhỏ.
- `output: 'export'` → static HTML thuần (mất SSR, Server Actions, ISR, middleware).

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Lưu ý / bẫy thường gặp:** chạy nhiều instance cần **shared cache handler** (Redis) cho ISR/Data Cache, nếu không mỗi pod có cache riêng; cần `sharp` cho image optimization; phải tự copy `public` và `.next/static` (hoặc đưa lên CDN).

## Bạn sẽ cấu trúc một dự án Next.js App Router lớn như thế nào? [senior]
Cấu trúc gợi ý (feature-based, tách rõ server/client):

```text
src/
  app/                 -> chỉ routing: layout, page, loading, error, route.ts
    (marketing)/
    (app)/dashboard/
  features/
    orders/
      components/      -> UI theo feature (server & client)
      actions.ts       -> Server Actions ('use server')
      queries.ts       -> data access ('server-only', React.cache / 'use cache')
      schema.ts        -> Zod schema dùng chung client/server
  components/ui/       -> design system
  lib/                 -> db client, auth, utils
```

Nguyên tắc:
- `app/` mỏng, page chỉ ghép component và fetch dữ liệu.
- **Data Access Layer**: mọi truy cập DB qua module `server-only`, kiểm tra auth tại đây, trả DTO.
- Server Component mặc định, `'use client'` ở lá.
- Validate bằng schema dùng chung; Server Actions trả state có cấu trúc.
- Chiến lược cache rõ ràng: tag theo entity, revalidate sau mutation.
- Testing: unit cho logic, Playwright E2E cho luồng chính (async Server Component khó unit test).
- Observability: `instrumentation.ts` (OpenTelemetry), Sentry.

**Lưu ý / bẫy thường gặp:** đừng biến `app/` thành nơi chứa toàn bộ code; tránh fetch Route Handler nội bộ từ Server Component.
