# Online Learning AI System

Hệ thống theo dõi sự tập trung của sinh viên trong lớp học trực tuyến sử dụng AI phân tích cảm xúc khuôn mặt.

## Thành viên nhóm

| Họ tên               | GitHub                                                     |
| -------------------- | ---------------------------------------------------------- |
| Nguyễn Đức Hoàng Huy | [@NguyenDucHoangHuy](https://github.com/NguyenDucHoangHuy) |
| Lê Quang Thọ         | @username                                                  |
| Lê Tấn Thịnh         | @username                                                  |

## Công nghệ sử dụng

| Thành phần       | Công nghệ                    |
| ---------------- | ---------------------------- |
| Frontend         | React + Vite + TailwindCSS   |
| Backend          | NodeJS + Express + Socket.IO |
| AI Service       | Python + FastAPI + PyTorch   |
| Database         | PostgreSQL                   |
| Containerization | Docker + Docker Compose      |

## Cấu trúc thư mục

online-learning-ai-system/
├── frontend/ # React app
├── backend/ # NodeJS + Express API
├── ai-service/ # Python AI model
├── .vscode/ # Cấu hình VSCode chung
├── .nvmrc # Version Node
├── .gitignore
├── docker-compose.yml
└── README.md

## Yêu cầu cài đặt

Trước khi chạy project, cần cài:

- [Git](https://git-scm.com)
- [Node.js 22.16.0](https://nodejs.org) hoặc dùng NVM
- [Python 3.10.x](https://python.org)
- [Docker Desktop](https://docker.com/products/docker-desktop)

## Hướng dẫn cài đặt

### 1. Clone project về máy

```bash
git clone https://github.com/NguyenDucHoangHuy/online-learning-ai-system.git
cd online-learning-ai-system
```

### 2. Khởi động Database và AI Service bằng Docker

```bash
docker-compose up -d
```

### 3. Cài đặt và chạy Backend

```bash
cd backend
npm install
npm run dev
```

### 4. Cài đặt và chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Cài đặt và chạy AI Service

```bash
cd ai-service
py -3.10 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Quy tắc làm việc nhóm

### Quy tắc nhánh

main ← code ổn định, chỉ merge khi hoàn thành tính năng
dev ← nhánh tích hợp chung
├── feature/backend-xxx ← backend
├── feature/frontend-xxx ← frontend
└── feature/ai-xxx ← AI service

### Quy tắc commit

feat: thêm tính năng mới
fix: sửa lỗi
refactor: cải thiện code không thêm tính năng
docs: cập nhật tài liệu
style: format code
chore: công việc lặt vặt (cài thư viện, config,...)

Ví dụ:

```bash
git commit -m "feat: add login API"
git commit -m "fix: correct emotion detection threshold"
git commit -m "docs: update README setup guide"
```

## Tính năng chính

- Đăng ký / đăng nhập cho giảng viên và sinh viên
- Giảng viên tạo khóa học và mở buổi học
- Sinh viên join buổi học bằng session code
- Waiting room — giảng viên duyệt từng sinh viên hoặc tất cả
- AI phân tích cảm xúc khuôn mặt real-time qua camera
- Dashboard thống kê mức độ tập trung cho giảng viên
- Chat trong buổi học
