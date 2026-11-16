
Admit One — Frontend
Frontend cho Admit One, nền tảng bán vé sự kiện chịu tải cao (concert, show...). React + Vite, giao diện marketplace nền sáng, cam coral làm điểm nhấn.

Backend: admit-one-be

Công nghệ
React 19 + Vite
React Router — điều hướng, phân quyền route theo vai trò (CUSTOMER / STAFF / ADMIN)
Tailwind CSS — design token 3 lớp (primitive → semantic → component)
@stomp/stompjs — nhận cập nhật số vé còn lại realtime qua WebSocket
html5-qrcode — quét QR vé bằng camera lúc check-in
qrcode.react — vẽ QR cho vé điện tử
recharts — biểu đồ doanh thu, đơn hàng ở trang quản trị
framer-motion — hiệu ứng chuyển động
Tính năng chính
Phía khách (public):

Xem danh sách, chi tiết sự kiện; số vé còn lại cập nhật trực tiếp
Đăng ký, xác minh email bằng OTP, đăng nhập
Chọn vé, giữ vé tạm 10 phút, thanh toán qua payOS
Xem đơn của tôi, vé điện tử có QR, in vé
Phía quản trị (/dashboard, cần đăng nhập Admin/Staff):

Tổng quan (Admin) — doanh thu, vé đã bán, vé đang giữ, kèm biểu đồ
Sự kiện (Admin) — tạo/sửa sự kiện, hạng vé, công bố, mở bán
Người dùng (Admin) — tạo tài khoản Staff, tra cứu theo vai trò
Đơn hàng (Admin) — tra cứu đơn, xem log các lần thanh toán
Check-in (Admin/Staff) — quét QR vé tại cửa, xem số người đã vào trên tổng số vé
Chạy ở máy
Yêu cầu
Node.js (khuyến nghị bản LTS mới)
Backend admit-one-be đang chạy
Cài đặt
npm install
Biến môi trường
Tạo file .env ở thư mục gốc:

VITE_API_URL=http://localhost:8080/api
Đổi thành URL backend thật khi deploy (vẫn giữ /api ở cuối).

Chạy dev server
npm run dev
Mặc định mở ở http://localhost:5173.

Build production
npm run build
Cấu trúc
src/
├── pages/            # Trang công khai + pages/dashboard (quản trị)
├── layout/            # Khung trang (Public, Auth, Dashboard)
├── routes/            # Định tuyến, phân quyền theo vai trò
├── api/              # Gọi REST API backend
├── hook/              # Custom hook (data fetching, form, realtime...)
├── lib/              # Enum/nhãn dùng chung, định dạng ngày/tiền
├── context/           # AuthContext (token, fetchWithAuth)
└── components/        # UI dùng chung (Button, TextField, Spinner...)
