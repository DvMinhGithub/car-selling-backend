# FE Build Guide (Customer + Admin)

Tài liệu này dùng để xây dựng toàn bộ frontend bám theo backend hiện tại.

## 1. Thông tin chung

- Base API: `http://localhost:3001/api/v1`
- Auth header: `Authorization: Bearer <accessToken>`
- Cookie refresh token: backend set ở cookie `refreshToken`
- Khi gọi API cần cookie: FE phải bật `withCredentials: true`

Ví dụ cấu hình Axios:

```js
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  withCredentials: true,
});
```

## 2. Quy ước response

Backend trả dạng:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Lỗi:

```json
{
  "success": false,
  "message": "string"
}
```

## 3. Page Map cần build

### 3.1 Public pages

| FE route | Mục đích | API chính |
|---|---|---|
| `/register` | Đăng ký customer | `POST /customers/register` |
| `/login` | Đăng nhập customer | `POST /customers/login` |
| `/admin/login` | Đăng nhập admin | `POST /admins/login` |

### 3.2 Customer pages

| FE route | Mục đích | API chính |
|---|---|---|
| `/cars` | Danh sách xe + filter + phân trang | `GET /cars` |
| `/cars/:id` | Chi tiết xe | `GET /cars/:id` |
| `/cart` | Quản lý giỏ hàng | `GET /carts/me`, `POST /carts/me/items`, `PUT /carts/me/items/:carId`, `DELETE /carts/me/items/:carId` |
| `/checkout` | Tạo đơn từ giỏ | `POST /bills/me` |
| `/orders` | Danh sách đơn của tôi | `GET /bills/me` |
| `/orders/:id` | Chi tiết đơn + hủy đơn | `GET /bills/detail/:id`, `PATCH /bills/me/:id/cancel` |
| `/profile` | Hồ sơ cá nhân | `GET /customers/me`, `PUT /customers/me` |
| `/profile/addresses` | Sổ địa chỉ giao hàng | `GET/POST/PUT/DELETE/PATCH /customers/me/addresses...` |
| `/profile/security` | Đổi mật khẩu | `PUT /customers/me/change-password` |

### 3.3 Admin pages

| FE route | Mục đích | API chính |
|---|---|---|
| `/admin/profile` | Hồ sơ admin | `GET /admins/me`, `PUT /admins/:id` |
| `/admin/cars` | Quản lý xe | `GET /cars`, `POST /cars`, `PUT /cars/:id`, `DELETE /cars/:id` |
| `/admin/orders` | Quản lý đơn | `GET /bills` |
| `/admin/orders/:id` | Cập nhật trạng thái đơn | `GET /bills/detail/:id`, `PATCH /bills/:id/status` |
| `/admin/customers` | Danh sách khách hàng | `GET /customers`, `GET /customers/:id` |

## 4. API Catalog theo module

### 4.1 Customer auth + profile

- `POST /customers/register`
- `POST /customers/login`
- `POST /customers/refreshToken`
- `POST /customers/logout`
- `GET /customers/me`
- `PUT /customers/me`
- `PUT /customers/me/change-password`

Payload mẫu:

```json
{
  "userName": "minhdev",
  "phoneNumber": "0900000000",
  "email": "minh@example.com",
  "address": "HCM",
  "password": "Password123!"
}
```

### 4.2 Address book

- `GET /customers/me/addresses`
- `POST /customers/me/addresses`
- `PUT /customers/me/addresses/:addressId`
- `DELETE /customers/me/addresses/:addressId`
- `PATCH /customers/me/addresses/:addressId/default`

Payload tạo/cập nhật địa chỉ:

```json
{
  "receiverName": "Nguyen Van A",
  "phoneNumber": "0900000000",
  "addressLine": "123 Le Loi",
  "ward": "Ben Nghe",
  "district": "Quan 1",
  "city": "TP HCM",
  "note": "Giao gio hanh chinh",
  "isDefault": true
}
```

### 4.3 Cars

- `GET /cars`
  - Query hỗ trợ: `name`, `company`, `model`, `color`, `minPrice`, `maxPrice`, `page`, `limit`
- `GET /cars/:id`
- `POST /cars` (admin, `multipart/form-data`)
- `PUT /cars/:id` (admin, `multipart/form-data`)
- `DELETE /cars/:id` (admin)

Field ảnh upload: `image`

Payload tạo xe mẫu:

```json
{
  "name": "Mazda CX-5",
  "price": 850000000,
  "discount": 5,
  "model": "2024",
  "company": "Mazda",
  "color": "White",
  "description": "SUV 5 cho",
  "quantity": 10
}
```

### 4.4 Cart

- `GET /carts/me`
- `POST /carts/me/items`
- `PUT /carts/me/items/:carId`
- `DELETE /carts/me/items/:carId`
- `PUT /carts/me/reset`

Payload thêm item:

```json
{
  "idProduct": "CAR_ID",
  "amountProduct": 2
}
```

Hoặc thêm nhiều item:

```json
{
  "listProduct": [
    { "idProduct": "CAR_ID_1", "amountProduct": 1 },
    { "idProduct": "CAR_ID_2", "amountProduct": 2 }
  ]
}
```

### 4.5 Bills (orders)

- `GET /bills/me`
- `GET /bills/detail/:id`
- `POST /bills/me`
- `PATCH /bills/me/:id/cancel`
- `GET /bills` (admin)
- `PATCH /bills/:id/status` (admin)

Payload tạo đơn:

```json
{
  "shippingAddress": "123 Le Loi, Quan 1, TP HCM",
  "phoneNumber": "0900000000"
}
```

Nếu không gửi `listProduct`, backend tự lấy từ giỏ hiện tại.

Payload cập nhật trạng thái (admin):

```json
{
  "status": "shipping"
}
```

Giá trị status hợp lệ:
- `pending`
- `confirmed`
- `shipping`
- `completed`
- `cancelled`

### 4.6 Admin auth + profile

- `POST /admins`
- `POST /admins/login`
- `POST /admins/refreshToken`
- `POST /admins/logout`
- `GET /admins/me`
- `PUT /admins/:id` (`multipart/form-data`, field ảnh `image`)

## 5. Luồng FE chi tiết

### 5.1 Luồng đăng nhập customer

1. User submit email/password tại `/login`.
2. Gọi `POST /customers/login`.
3. Lưu `accessToken` vào memory hoặc localStorage.
4. Điều hướng sang `/cars`.
5. Gọi `GET /customers/me` để hydrate profile.

### 5.2 Luồng refresh token tự động

1. API bất kỳ trả `401`.
2. FE gọi `POST /customers/refreshToken` với `withCredentials: true`.
3. Nếu thành công: cập nhật access token và retry request cũ.
4. Nếu thất bại: clear auth state, chuyển `/login`.

### 5.3 Luồng mua hàng

1. Từ `/cars/:id`, bấm "Thêm giỏ" gọi `POST /carts/me/items`.
2. Vào `/cart`, chỉnh số lượng bằng `PUT /carts/me/items/:carId`.
3. Bấm thanh toán ở `/checkout`, gọi `POST /bills/me`.
4. Thành công thì điều hướng `/orders/:id`.

### 5.4 Luồng hủy đơn user

1. Tại `/orders/:id`, nếu đơn `pending` hoặc `confirmed` thì show nút hủy.
2. Bấm hủy -> gọi `PATCH /bills/me/:id/cancel`.
3. Reload chi tiết đơn.

### 5.5 Luồng quản lý địa chỉ

1. `/profile/addresses` load bằng `GET /customers/me/addresses`.
2. Thêm mới: `POST /customers/me/addresses`.
3. Sửa: `PUT /customers/me/addresses/:addressId`.
4. Xóa: `DELETE /customers/me/addresses/:addressId`.
5. Đặt mặc định: `PATCH /customers/me/addresses/:addressId/default`.

### 5.6 Luồng admin xử lý đơn

1. `/admin/orders` gọi `GET /bills`.
2. Chọn đơn, mở `/admin/orders/:id`.
3. Cập nhật trạng thái bằng `PATCH /bills/:id/status`.

Khuyến nghị FE nên giới hạn chuyển trạng thái:
- `pending` -> `confirmed` hoặc `cancelled`
- `confirmed` -> `shipping` hoặc `cancelled`
- `shipping` -> `completed`
- `completed`/`cancelled` -> khóa thao tác

## 6. Guard và phân quyền FE

- Customer route bắt buộc role `customer`:
  - `/cart`, `/checkout`, `/orders/*`, `/profile*`
- Admin route bắt buộc role `admin`:
  - `/admin/*`
- Public route:
  - `/login`, `/register`, `/admin/login`

## 7. Checklist build theo thứ tự khuyến nghị

1. Auth layer (login/register/refresh/logout) + axios interceptor.
2. Layout + route guard theo role.
3. Cars list/detail.
4. Cart + checkout.
5. Orders list/detail + cancel.
6. Profile + address book + change password.
7. Admin: cars CRUD.
8. Admin: orders status + customers list.

## 8. Ghi chú implementation

- Endpoint upload ảnh dùng `multipart/form-data`, field name là `image`.
- Khi logout hoặc đổi mật khẩu: clear access token phía FE.
- Nếu backend chạy domain khác FE, bắt buộc:
  - `withCredentials: true`
  - CORS backend bật credentials và origin đúng domain FE.
