# 🚀 Hướng dẫn Deploy Render — CTV ChatGPT & Grok Store

## Tổng quan

```text
┌──────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────┐
│  Khách truy cập web  │ ───▶ │  Render Node/Express App │ ───▶ │  API Server gốc      │
│  giao diện premium   │      │  server.js + index.html  │      │  103.69.87.202:5000  │
└──────────────────────┘      └──────────────────────────┘      └──────────────────────┘
```

- Frontend và backend chạy chung trên **Render**
- API key nằm **server-side** trong biến môi trường
- Không còn dùng Cloudflare Worker cho proxy nữa

---

## File chính

| File | Vai trò |
|------|---------|
| `server.js` | Backend Express proxy + serve frontend |
| `index.html` | Giao diện bán ChatGPT/Grok |
| `package.json` | Cấu hình Node app |
| `render.yaml` | Blueprint để Render đọc config |
| `.gitignore` | Bỏ qua node_modules / env |
| `api_doc.html` | Tài liệu API đối tác |

---

## Bước 1 — Tạo GitHub repo

Nếu chưa có repo:

```powershell
git init
git add .
git commit -m "Initial Render deploy"
```

Tạo repo mới trên GitHub, sau đó nối remote:

```powershell
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

> [!IMPORTANT]
> Không commit file chứa secret. `API_KEY` sẽ đặt trực tiếp trên Render.

---

## Bước 2 — Deploy lên Render

### Cách dễ nhất
1. Vào https://render.com
2. Chọn **New +** → **Web Service**
3. Kết nối GitHub repo của bạn
4. Chọn đúng repo này
5. Render sẽ tự nhận `render.yaml`

### Nếu tự nhập tay
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

---

## Bước 3 — Set biến môi trường trên Render

Trong phần **Environment Variables**, thêm:

| Key | Value |
|-----|-------|
| `API_BASE` | `http://103.69.87.202:5000` |
| `API_KEY` | `DLR_xxxxx` |
| `PASS_KEY` | `your-secret-buy-pass` |

> [!WARNING]
> `API_KEY` phải đặt trong Render dashboard, không để cứng trong code.

---

## Bước 4 — Test sau deploy

Sau khi deploy xong, bạn sẽ có URL kiểu:

```text
https://your-app-name.onrender.com
```

Test nhanh:

### Debug endpoint
```text
https://your-app-name.onrender.com/api/debug
```

### Trang chính
```text
https://your-app-name.onrender.com
```

Nếu ổn:
- trang hiện danh sách sản phẩm
- có số dư
- bấm mua được

---

## Troubleshooting

| Lỗi | Cách xử lý |
|-----|------------|
| `Thiếu API_KEY trên server` | Chưa set env `API_KEY` trên Render |
| `Không kết nối được upstream` | Render không gọi được `103.69.87.202:5000`, cần test lại với đối tác |
| Trang lên nhưng không có sản phẩm | Kiểm tra `/api/debug` và log Render |
| Deploy fail | Kiểm tra Node version / `package.json` |

---

## Lệnh chạy local

```powershell
npm install
$env:API_BASE="http://103.69.87.202:5000"
$env:API_KEY="DLR_xxxxx"
npm start
```

Mở trình duyệt:

```text
http://localhost:3000
```
