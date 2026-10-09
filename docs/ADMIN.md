# Quản trị MemCard (dành cho chủ ứng dụng)

MemCard là ứng dụng chạy trên trình duyệt. Phần cấu hình dùng chung cho mọi người (tài khoản nhận ủng hộ, danh sách "Ứng dụng liên quan") được chỉnh **ngay trên giao diện** và lưu trong **Vercel Edge Config** thông qua một hàm serverless nhỏ (`api/config.js`). Mật khẩu admin được kiểm tra ở **phía máy chủ**, nên đây là bảo mật thật: không ai ngoài bạn lưu được cấu hình.

## Mở màn hình quản trị

- **Phím tắt: `Alt + Shift + A`** (Mac: `Option + Shift + A`).
- Trên điện thoại: bấm **logo MemCard 7 lần** trong 4 giây.
- Chưa đăng nhập thì hiện ô nhập mật khẩu. Đăng nhập xong thì mở màn hình "Quản trị MemCard". Khi đang ở chế độ admin, trên thanh đầu trang có biểu tượng khiên tím để mở lại màn hình này.
- Phiên đăng nhập sống tối đa 8 giờ và mất khi đóng tab. Nhập sai 5 lần thì bị khoá 1 phút.

Người học bình thường không thấy các công cụ này (cửa sổ Google Drive không hiện hướng dẫn Google Cloud và lỗi kỹ thuật, trang "Ứng dụng liên quan" chỉ xem được).

Màn hình quản trị gồm 3 tab:
- **Ủng hộ**: bật/tắt mục "Mời cà phê"; mã ngân hàng VietQR, tên ngân hàng, số tài khoản, tên chủ tài khoản.
- **Ứng dụng liên quan**: thêm, sửa, xoá, đổi thứ tự (tối đa 30 mục).
- **Hệ thống**: tình trạng nơi lưu cấu hình, phím tắt, thoát chế độ admin.

Bấm **Lưu cho mọi người** để áp dụng. Người dùng thấy thay đổi sau khoảng 15–60 giây (bộ nhớ đệm).

## Cài đặt một lần trên Vercel

1. **Tạo store**: Vercel Dashboard → *Storage* → *Create Database* → *Edge Config* (trên giao diện mới có thể hiện tên **Global Config**; đó là cùng một thứ, miễn phí). Đặt tên bất kỳ.
2. **Nối vào project**: trong Edge Config vừa tạo, mục *Projects* → *Connect Project* → chọn project MemCard. Vercel tự thêm biến `EDGE_CONFIG` (store tạo dưới tên "Global Config" có thể đặt tên biến là `GLOBAL_CONFIG`; cả hai đều được hỗ trợ).
3. **Tạo API token** (để hàm có quyền ghi): <https://vercel.com/account/tokens> → Create Token (phạm vi chọn đúng team/tài khoản chứa project). Thêm vào Environment Variables của project: `VERCEL_API_TOKEN` = token này.
4. **Mật khẩu admin**: thêm `ADMIN_PASSWORD` = một mật khẩu dài (4 từ ngẫu nhiên trở lên). Biến này chỉ nằm trên máy chủ, không bao giờ vào mã trình duyệt.
5. Nếu project thuộc một **team**: thêm `VERCEL_TEAM_ID` (Team Settings → General → Team ID, dạng `team_...`).
6. **Redeploy** để các biến có hiệu lực.
7. Mở app, bấm `Alt+Shift+A`, đăng nhập, mở tab **Hệ thống**: phải thấy "Vercel Edge Config (sẵn sàng)" và "ADMIN_PASSWORD: đã đặt".

Các biến môi trường:

| Biến | Nơi dùng | Ý nghĩa |
|---|---|---|
| `EDGE_CONFIG` hoặc `GLOBAL_CONFIG` | máy chủ | Tự có sau khi nối store (Edge Config / Global Config); chứa địa chỉ và token đọc. Một trong hai là đủ |
| `VERCEL_API_TOKEN` | máy chủ | Token để ghi vào Edge Config |
| `VERCEL_TEAM_ID` | máy chủ | Chỉ cần nếu project thuộc team |
| `ADMIN_PASSWORD` | máy chủ | Mật khẩu admin (bí mật thật) |
| `GOOGLE_CLIENT_ID` | build | OAuth Client ID cho Google Drive. **Chỉ đặt bằng biến môi trường**, không chỉnh trên giao diện ([hướng dẫn](GOOGLE_DRIVE_SETUP.md)) |

Chỉ `GOOGLE_CLIENT_ID` được đưa vào mã trình duyệt (và nó vốn công khai). Ba biến còn lại chỉ máy chủ đọc được.

## Lỗi thường gặp khi lưu

| Thông báo | Cách xử lý |
|---|---|
| `403: You don't have permission to create the edge config item` | `VERCEL_API_TOKEN` không có quyền ghi vào store. Tạo lại token tại <https://vercel.com/account/tokens> với **Scope** là đúng team/tài khoản chứa project; nếu project thuộc team thì đặt thêm `VERCEL_TEAM_ID` (dạng `team_...`); tài khoản tạo token phải là Owner hoặc Member (không phải Viewer). Sau khi đổi biến, Redeploy |
| `404: Edge Config Item not found` | Bản cũ dùng thao tác `upsert`; bản hiện tại tự chọn create/update. Cập nhật lên bản mới nhất |
| Thiếu biến môi trường | Thông báo nêu rõ tên biến còn thiếu; thêm rồi Redeploy |

## Giới hạn và lưu ý

- **Edge Config bản miễn phí giới hạn 8KB** cho cả kho; mã giới hạn cấu hình khoảng 7KB. Mô tả ứng dụng nên ngắn.
- Thay đổi lan ra mọi nơi chậm vài giây đến vài chục giây (Edge Config và bộ nhớ đệm).
- Nếu chưa đặt tài khoản ủng hộ, app dùng tài khoản mặc định có trong mã (`DEFAULT_DONATE` trong `src/utils/siteConfig.ts`). Fork dự án thì nhớ đặt tài khoản của bạn trong tab Ủng hộ.
- Nếu máy chủ cấu hình tạm lỗi, app giữ cấu hình đã nhớ lần trước, không quay về mặc định.
- **Chạy local**: `npm start` không có thư mục `api/` nên không đăng nhập admin được (app báo "chỉ chạy khi deploy trên Vercel"). Để thử cả phần admin ở máy, dùng `npx vercel dev` (đã `vercel link` project và có các biến trên, có thể lấy bằng `vercel env pull`).
- Đổi `ADMIN_PASSWORD` sẽ vô hiệu hoá mọi phiên đăng nhập đang mở. Nếu nghi lộ mật khẩu, đổi ngay rồi Redeploy.
- Chế độ admin ở trình duyệt chỉ ẩn/hiện giao diện; việc ghi cấu hình luôn được máy chủ kiểm tra lại token. Dù vậy, chỉ đặt vào cấu hình những thứ công khai (số tài khoản trên mã QR, đường link), vì mọi người dùng đều tải được chúng.
