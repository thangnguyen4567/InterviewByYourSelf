# Ôn Phỏng Vấn — trang web tĩnh

Tổng hợp câu hỏi phỏng vấn: PHP, C#, .NET, Architectures, Database, DevOps, Design Patterns, Angular, ReactJS, Next.js, System Design, Message Broker, Redis.

## Mở trang
Mở trực tiếp `index.html` bằng trình duyệt (không cần server, chạy offline được).

## Đồng bộ tiến độ lên MongoDB

```
GitHub Pages (web tĩnh) ──HTTPS──► API serverless (Vercel: api/*.js) ──► MongoDB Atlas
        └── localStorage luôn lưu trước → API/DB sập vẫn dùng được, có mạng lại tự đồng bộ
```

- Tiến độ (✅ đã thuộc, ⭐, điểm trắc nghiệm, câu từng sai) lưu trong trình duyệt trước, sau đó đẩy lên API.
- Nút trạng thái trên thanh trên cùng: ☁️ đã đồng bộ · ⏳ chờ / đang đồng bộ · ⚠️ offline (API/DB lỗi, tự thử lại mỗi 60s).
- **Không cần nhập gì**: mở trang là tự đồng bộ (chế độ mở — không đặt `SYNC_KEY`). API chỉ cho 1 profile `default`,
  chỉ nhận đúng các trường tiến độ, và chặn website khác gọi từ trình duyệt.
- Muốn khóa lại: đặt `SYNC_KEY` trên server → trang sẽ hiện 🔑 để nhập key (Shift + bấm nút để đổi key).
- Nhiều máy cùng một profile: tự gộp thay đổi (hợp các đánh dấu, điểm lấy cao nhất).
- `MONGODB_URI` chỉ nằm ở server (biến môi trường), **không bao giờ** nằm trong code frontend. File `.env` đã được `.gitignore`.

### Chạy local (web + API)
```bash
npm install
npm start            # build nội dung + mở http://localhost:3000
```
Cấu hình trong `.env`: `MONGODB_URI`, `MONGODB_DB`, `SYNC_KEY`, `ALLOWED_ORIGINS`, `PORT`.

### Deploy API lên Vercel (miễn phí)
1. Đẩy repo lên GitHub, vào https://vercel.com → **Add New Project** → import repo này (Framework: *Other*).
2. **Settings → Environment Variables** thêm:
   - `MONGODB_URI` = chuỗi kết nối Atlas
   - `MONGODB_DB` = `interview_prep`
   - (tùy chọn) `SYNC_KEY` — chỉ đặt nếu muốn bắt nhập key
   - (tùy chọn) `ALLOWED_ORIGINS` — chỉ cần khi web chạy ở domain khác API (vd GitHub Pages: `https://<username>.github.io`)
3. Deploy → kiểm tra `https://<project>.vercel.app/api/health` trả về `{"ok":true,"db":"up"}`.
4. MongoDB Atlas → **Network Access** → cho phép `0.0.0.0/0` (Vercel không có IP cố định).

### Deploy web lên GitHub Pages
1. Sửa `assets/config.js`: `window.SYNC_API = 'https://<project>.vercel.app/api';`
2. Chạy `node build.js` và commit cả `assets/content.js`.
3. GitHub repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `(root)`.
4. Mở `https://<username>.github.io/<repo>/`.

## Thêm / sửa nội dung
1. Sửa file trong `content/*.md`
2. Chạy `node build.js` (hoặc `node build.js --watch` để tự build khi lưu)
3. Refresh trình duyệt

Định dạng file markdown:

```
---
id: csharp
title: C#
icon: 🟣
order: 2
description: Mô tả ngắn
---

# Tên nhóm câu hỏi

## Câu hỏi? [junior]
Câu trả lời (markdown, code block, bảng...)
```

- `# ` = nhóm (section), `## ` = câu hỏi, cuối câu hỏi là level `[junior]` / `[mid]` / `[senior]`.
- Trong câu trả lời dùng `###` trở xuống cho tiêu đề phụ.

## Câu hỏi trắc nghiệm
File `content/quiz/<id-chủ-đề>.md` (front matter `topic: <id>`):

```
## Câu hỏi? [junior]
(tùy chọn: đoạn code / mô tả)
- [ ] Đáp án sai
- [x] Đáp án đúng
- [ ] Đáp án sai
- [ ] Đáp án sai
> Giải thích đáp án
```

Nếu có nhiều đáp án đúng, đánh `[x]` cho từng đáp án và thêm "(chọn nhiều)" vào cuối câu hỏi.

## Tính năng
- **Trắc nghiệm** theo từng chủ đề và độ khó (Junior / Mid / Senior / Trộn / Câu từng sai). Đáp án được xáo ngẫu nhiên, có chấm điểm, giải thích, xem lại câu sai, lưu điểm cao nhất. Phím `1`–`4` chọn đáp án, `Enter` để trả lời / sang câu tiếp
- Lọc theo level, trạng thái (chưa thuộc / đã thuộc / ⭐), tìm kiếm không dấu toàn bộ chủ đề (phím `/`)
- Đánh dấu ✅ đã thuộc và ⭐ ôn lại — lưu trong localStorage của trình duyệt
- Flashcard ngẫu nhiên theo chủ đề hoặc tất cả: `Space` xem đáp án, `1` chưa nhớ, `2` đã nhớ
- Giao diện sáng/tối, responsive mobile, in ra giấy (Ctrl+P sẽ mở hết đáp án)
