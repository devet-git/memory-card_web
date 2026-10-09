# Cài đặt đồng bộ Google Drive cho MemCard

MemCard lưu dữ liệu trong trình duyệt. Tính năng đồng bộ Google Drive sao lưu dữ liệu đó thành **một tệp `memcard_backup.json`** trong Drive của bạn và trộn (merge) hai chiều giữa các thiết bị. Không có máy chủ trung gian: trình duyệt nói chuyện thẳng với Google.

- Quyền xin: `drive.file` (không nhạy cảm) — MemCard **chỉ thấy tệp do chính nó tạo**, không đọc được các tệp khác trong Drive.
- Cần một **OAuth Client ID** (loại *Web application*) do bạn tạo trên Google Cloud. Việc này miễn phí, làm một lần, khoảng 5 phút.

> Nếu bạn chỉ dùng bản MemCard của người khác triển khai và họ đã cấu hình sẵn, bạn chỉ cần bấm "Đăng nhập với Google" trong cửa sổ Google Drive. Các bước dưới đây dành cho người tự chạy/triển khai MemCard.

## 1. Tạo project và bật Drive API

1. Vào <https://console.cloud.google.com/> và tạo project mới (ví dụ `memcard`).
2. Mở **APIs & Services → Library**, tìm **Google Drive API** và bấm **Enable**.
   - Quên bước này sẽ gặp lỗi 403 `accessNotConfigured` / `SERVICE_DISABLED` (MemCard sẽ báo "Chưa bật Drive API").

## 2. Cấu hình màn hình đồng ý (OAuth consent screen)

1. **APIs & Services → OAuth consent screen** (hoặc *Google Auth Platform → Branding*).
2. Chọn **External**, điền tên ứng dụng và email hỗ trợ.
3. Mục **Scopes**: thêm `.../auth/drive.file` (scope này không cần Google xét duyệt).
4. **Publishing status**:
   - Để **Testing**: chỉ các tài khoản trong danh sách *Test users* đăng nhập được, và phiên đăng nhập hết hạn sau ~7 ngày. Thêm email của bạn vào *Test users*.
   - Khuyến nghị bấm **Publish app** (In production). Với scope `drive.file` không cần xác minh, và không bị giới hạn 7 ngày.

## 3. Tạo OAuth Client ID

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized JavaScript origins** — thêm đúng địa chỉ bạn mở MemCard (không có dấu `/` ở cuối, không có đường dẫn):
   - Chạy local: `http://localhost:3000`
   - Triển khai: `https://ten-mien-cua-ban.com` (hoặc `https://<user>.github.io`)
   - Bật [chế độ quản trị](ADMIN.md) (`Alt+Shift+A`), mở cửa sổ Google Drive trong MemCard: mục *Quản trị* hiện chính xác origin hiện tại để bạn sao chép.
4. **Authorized redirect URIs**: để trống (luồng popup của Google Identity Services không cần).
5. Bấm **Create**, sao chép **Client ID** (dạng `1234-abc.apps.googleusercontent.com`). Không cần Client secret.
6. Chờ vài phút để cài đặt có hiệu lực.

## 4. Đưa Client ID vào MemCard

Client ID chỉ đặt bằng **biến môi trường** `GOOGLE_CLIENT_ID` (không chỉnh trên giao diện). Ưu tiên: biến môi trường, rồi ID mặc định có sẵn trong mã nguồn.

```bash
cp .env.example .env
# sửa dòng:
GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com
npm start          # hoặc npm run build
```
Biến được nhúng vào bundle khi build (script `npm start` / `npm run build` tự chuyển `GOOGLE_CLIENT_ID` thành `REACT_APP_GOOGLE_CLIENT_ID` mà Create React App yêu cầu); sửa `.env` xong phải khởi động lại `npm start` / build lại. Trên Vercel: xem mục "Triển khai lên Vercel" bên dưới.

## 5. Kết nối và sử dụng

1. Mở menu tiện ích → **Google Drive** → **Đăng nhập với Google** → chọn tài khoản → tích đủ quyền Drive → Cho phép.
2. Bấm **Đồng bộ ngay** để đồng bộ lần đầu. MemCard tải bản trên Drive (nếu có), **trộn** với dữ liệu máy, rồi đẩy kết quả lên nếu có khác biệt.
3. Bật **Tự động đồng bộ** (cũng có trong Cài đặt học): đồng bộ khi bật, ~8 giây sau khi bạn sửa dữ liệu, khi quay lại tab / có mạng lại, và mỗi 5 phút.
4. Trên thiết bị khác: làm bước 1 với **cùng tài khoản Google** và cùng Client ID.

### Cách trộn dữ liệu
- Thẻ/bộ thẻ được trộn theo từng mục; thẻ đã xoá được ghi dấu xoá (tombstone) nên không "sống lại" từ thiết bị khác.
- Thống kê học tập được trộn, không bị ghi đè.
- Nếu tệp trên Drive bị hỏng/không đọc được, MemCard **không ghi đè** nó mà báo lỗi.
- "Ghi đè Drive" và "Thay thế dữ liệu máy" (mục nâng cao) là hai nút duy nhất có thể làm mất dữ liệu một phía, và luôn hỏi xác nhận.

### Phiên đăng nhập hết hạn
Token Google chỉ sống ~1 giờ. MemCard tự gia hạn âm thầm khi trình duyệt còn phiên Google. Nếu không gia hạn được (đăng xuất Google, chặn cookie bên thứ ba, app ở chế độ Testing quá 7 ngày…), trạng thái chuyển thành **cần kết nối lại**: hiện biểu tượng đám mây gạch chéo ở đầu trang → bấm **Kết nối lại**. Dữ liệu trên máy không bị ảnh hưởng.

## Xử lý sự cố

| Triệu chứng | Nguyên nhân & cách sửa |
|---|---|
| `Error 400: redirect_uri_mismatch` / `origin_mismatch` | Origin đang mở chưa có trong *Authorized JavaScript origins*. Thêm đúng scheme + host + port (`http://localhost:3000` ≠ `http://127.0.0.1:3000`). |
| `Error 403: access_denied` ("app chưa được xác minh") | App ở chế độ Testing và email chưa trong *Test users* → thêm email, hoặc Publish app. |
| "Chưa bật Drive API" (403 `accessNotConfigured`) | Bật Google Drive API ở bước 1, đúng project chứa Client ID. |
| Popup bị chặn / không hiện | Cho phép popup cho trang này rồi bấm lại. |
| "Chưa cấp đủ quyền Drive" | Ở màn hình đồng ý phải để tích ô quyền Drive; bấm **Kết nối lại** và cấp đủ. |
| Cứ đòi kết nối lại sau vài giờ/ngày | Trình duyệt chặn cookie bên thứ ba hoặc app đang ở Testing (7 ngày). Publish app / cho phép cookie của `accounts.google.com`. |
| Hai thiết bị thấy dữ liệu khác nhau | Bấm **Đồng bộ ngay** ở cả hai; kiểm tra cùng tài khoản Google và cùng Client ID (tệp là riêng theo Client ID/app). |
| Lỗi mạng / quota (429) | Thử lại sau; MemCard tự thử lại ở lần đồng bộ kế tiếp. |

## Triển khai lên Vercel

1. Import repo vào Vercel (framework Create React App). Repo đã có `vercel.json` ép dùng `npm run build`, đây là lệnh tự chuyển `GOOGLE_CLIENT_ID` thành biến mà Create React App đọc được. Đừng đổi Build Command thành `react-scripts build`.
2. **Project → Settings → Environment Variables**: thêm `GOOGLE_CLIENT_ID` = Client ID của bạn, tích môi trường Production (và Preview nếu cần).
3. Biến này được nhúng lúc **build**, nên sau khi thêm hoặc sửa phải **Redeploy**.
4. Thêm domain production (ví dụ `https://memcard.vercel.app` hoặc domain riêng) vào *Authorized JavaScript origins* của Client ID. Mỗi bản Preview có một domain khác nhau nên đăng nhập Google sẽ không chạy trên Preview, trừ khi bạn thêm từng domain đó.
5. Kiểm tra: bật chế độ quản trị (`Alt+Shift+A`), mở Google Drive → mục *Quản trị*, dòng *Client ID đang dùng* phải là ID của bạn và ghi "từ biến môi trường GOOGLE_CLIENT_ID". Nếu ghi "mặc định" tức là biến chưa được nạp (quên Redeploy, hoặc đặt sai tên).

## Dùng chung một dự án GCP cho nhiều app

MemCard được viết để không đụng tới dữ liệu app khác:
- Chỉ xin quyền `drive.file` và chỉ làm việc với **một** tệp `memcard_backup.json` do chính nó tạo (cùng tài khoản sở hữu, chưa vào thùng rác). Không bao giờ gọi lệnh xoá, không liệt kê hay mở tệp nào khác.
- Tệp được gắn nhãn `appProperties.app = "memcard"`. Tệp mang nhãn của app khác bị bỏ qua. Tệp cùng tên nhưng chưa có nhãn (bản MemCard cũ) vẫn được dùng và được gắn nhãn ở lần tải lên kế tiếp.
- Trước khi trộn hoặc ghi đè, nội dung tệp phải đúng định dạng sao lưu của MemCard; nếu không MemCard báo lỗi và **không ghi gì**, kể cả với nút "Ghi đè Drive".
- **Đăng xuất không thu hồi quyền ở Google.** Thu hồi (revoke) sẽ gỡ quyền của cả OAuth Client, làm các app khác dùng chung Client ID bị mất phiên.

Khuyến nghị: dù chung project GCP, mỗi app nên có **một OAuth Client ID riêng** (miễn phí). Quyền `drive.file` được cấp theo từng ứng dụng, nên tệp của app này không hiện ra với app kia; còn nếu dùng chung một Client ID thì các app có thể thấy tệp của nhau. Mã của MemCard vẫn an toàn trong trường hợp đó nhờ các lớp bảo vệ ở trên, nhưng app khác thì tôi không kiểm soát được.

## Bảo mật & quyền riêng tư
- Token truy cập chỉ lưu trong trình duyệt của bạn (localStorage) và hết hạn sau ~1 giờ; **Đăng xuất** xoá phiên trên trình duyệt này (không thu hồi quyền ở Google, xem mục dưới).
- Client ID không phải bí mật; không có Client secret nào trong ứng dụng.
- Tệp sao lưu chứa toàn bộ thẻ và thống kê ở dạng JSON không mã hoá trong Drive của bạn.
- Muốn xoá hẳn: xoá `memcard_backup.json` trong Drive, và thu hồi quyền tại <https://myaccount.google.com/permissions>.
