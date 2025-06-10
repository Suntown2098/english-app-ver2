# Cấu trúc thư mục `frontend/app`

Thư mục này chứa toàn bộ source code chính của ứng dụng Next.js (App Router). Dưới đây là mô tả các thư mục và file quan trọng:

## 1. Mô tả thư mục & file chính

- **components/**: Chứa các component chính của app, gồm:
  - `Sidebar`: Thanh điều hướng bên trái, cho phép chuyển đổi giữa các chức năng, truy cập lịch sử, cài đặt, đăng xuất.
  - `MainContent`: Vùng hiển thị nội dung chat chính, nhập/gửi tin nhắn, ghi âm, hiển thị hội thoại.
  - `MessageList`: Danh sách các tin nhắn trong hội thoại, hỗ trợ tra cứu từ điển, phát âm thanh.
  - `SettingsModal`: Modal cài đặt tài khoản, đổi tên hiển thị, đổi mật khẩu.
  - `HistoryPanel`: Panel hiển thị lịch sử các cuộc hội thoại, cho phép chọn lại hội thoại cũ.
  - `ChatLayout`: Layout tổng hợp, kết hợp Sidebar, MainContent và HistoryPanel.
- **contexts/**: Chứa các React Context để quản lý state toàn cục, gồm:
  - `AuthContext`: Quản lý trạng thái đăng nhập, thông tin user, xử lý login/logout.
  - `ConversationContext`: Quản lý hội thoại, danh sách tin nhắn, gửi/nhận tin nhắn, trạng thái loading, socket.
- **hooks/**: Chứa các custom React hook (gồm: useIsMobile, useToast).
- **lib/**: Chứa các hàm tiện ích, helper function dùng chung toàn app (gồm: utils.ts).
- **providers/**: Chứa các provider dùng toàn app (gồm: theme-provider.tsx).
- **public/**: Chứa các file tĩnh (ảnh, icon, ...)
- **styles/**: Chứa các file CSS, Tailwind, ...
- **ui/**: Chứa các UI component nhỏ, tái sử dụng (button, input, modal, ...).
- **view/**: Chứa các trang giao diện chính của app, gồm.
  - `page.tsx`: Trang hội thoại/chat chính (sau khi đăng nhập).
- **globals.css**: File CSS toàn cục cho app (import Tailwind, custom style).
- **layout.tsx**: File layout gốc, bọc toàn bộ app (dùng cho App Router).
- **page.tsx**: Trang chính (home page) của app.
