# Hệ thống thanh toán Microservice

Đây là hệ thống thanh toán được xây dựng trên kiến trúc microservice, sử dụng TypeScript, Node.js, Express và RabbitMQ cho giao tiếp giữa các dịch vụ.

## Kiến trúc

Hệ thống bao gồm các microservice sau:

1. **Gateway** - API Gateway, điểm vào của hệ thống
2. **User Service** - Quản lý thông tin người dùng
3. **Payment Service** - Xử lý thanh toán
4. **Statistics Service** - Xử lý thống kê và báo cáo

![Kiến trúc Microservice](https://i.imgur.com/1YyZnQ2.png)

## Giao tiếp giữa các dịch vụ

Hệ thống sử dụng hai cơ chế giao tiếp chính:

1. **HTTP/REST API** - Thông qua API Gateway với http-proxy-middleware
2. **RabbitMQ** - Giao tiếp nội bộ giữa các dịch vụ

### RabbitMQ Queues

- `auth_queue` - Xử lý các yêu cầu liên quan đến xác thực
- `user_queue` - Xử lý các yêu cầu liên quan đến quản lý người dùng

## Cách sử dụng

### 1. Cài đặt

#### a. Tải các gói cần thiết cho từng service

```bash
npm install
```

#### b. Thiết lập đầy đủ các biến môi trường cho từng service

```bash
// Tạo JWT_SECRET_KEY random
console.log(require('crypto').randomBytes(32).toString('hex'))
```

#### c. Migrate database

```bash
npx prisma migrate dev --name init
```

#### d. Khởi động engine (MySQL, MongoDB, RabbitMQ)

```bash
docker-compose up
```

### 2. API Endpoints

#### Authentication

- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất

#### User

- `GET /api/user` - Kiểm tra dịch vụ người dùng
- `GET /api/user/get-all` - Lấy danh sách tất cả người dùng
- `GET /api/user/get-profile/:userId` - Lấy thông tin người dùng theo ID

## Công nghệ sử dụng

- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL (User Service), MongoDB (Payment Service)
- **Giao tiếp**: RabbitMQ
- **Gateway**: http-proxy-middleware
- **Container**: Docker, Docker Compose

## Cấu trúc dự án

```
server/
  ├── docker-compose.yml       # Cấu hình Docker Compose
  ├── gateway/                 # API Gateway
  ├── user/                    # User Service
  ├── payment/                 # Payment Service
  └── statistics/              # Statistics Service
```

## Cấu trúc project

- `gateway/`: API Gateway (Node.js, Express)
- `
