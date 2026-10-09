# MemCard

Ứng dụng flashcard học từ vựng (React + TypeScript, Create React App). Toàn bộ dữ liệu lưu trong trình duyệt (localStorage); có thể tuỳ chọn đồng bộ sang Google Drive của chính bạn.

## Chạy dự án

```bash
npm install
npm start          # http://localhost:3000
npm test           # chạy test (watch)
npm run lint       # kiểm tra kiểu TypeScript
npm run build      # build production vào thư mục build/
```

## Đồng bộ Google Drive

Xem hướng dẫn từng bước (tạo OAuth Client ID, bật Drive API, xử lý sự cố) tại [docs/GOOGLE_DRIVE_SETUP.md](docs/GOOGLE_DRIVE_SETUP.md).

Tóm tắt: tạo OAuth Client ID loại *Web application* với *Authorized JavaScript origin* là địa chỉ bạn mở app, bật Google Drive API, rồi dán Client ID vào cửa sổ Google Drive trong app hoặc đặt `GOOGLE_CLIENT_ID` trong `.env`.
