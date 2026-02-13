require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const connectDb = require('#configs/db');
const { ORDER_STATUS, ROLES, SECURITY } = require('#configs/constants');

const adminModel = require('#models/admin');
const billModel = require('#models/bill');
const carModel = require('#models/car');
const cartModel = require('#models/cart');
const customerModel = require('#models/customer');

const SHOULD_RESET = process.argv.includes('--reset');
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'MatKhau@123';

const adminSeeds = [
  { userName: 'Nguyễn Minh Quân', email: 'admin01@carvn.demo' },
  { userName: 'Trần Hoàng Anh', email: 'admin02@carvn.demo' },
  { userName: 'Lê Thuỳ Linh', email: 'admin03@carvn.demo' },
];

const customerSeeds = [
  {
    userName: 'Nguyễn Văn An',
    email: 'khach01@carvn.demo',
    phoneNumber: '0909000001',
    address: 'Quận 1, TP. Hồ Chí Minh',
    addresses: [
      {
        receiverName: 'Nguyễn Văn An',
        phoneNumber: '0909000001',
        addressLine: '12 Nguyễn Huệ',
        ward: 'Bến Nghé',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        note: 'Giao giờ hành chính',
        isDefault: true,
      },
      {
        receiverName: 'Nguyễn Văn An',
        phoneNumber: '0909000001',
        addressLine: '120 Trần Hưng Đạo',
        ward: 'Phạm Ngũ Lão',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        note: 'Gọi trước khi giao',
        isDefault: false,
      },
    ],
  },
  {
    userName: 'Trần Thị Bình',
    email: 'khach02@carvn.demo',
    phoneNumber: '0909000002',
    address: 'Quận Cầu Giấy, Hà Nội',
    addresses: [
      {
        receiverName: 'Trần Thị Bình',
        phoneNumber: '0909000002',
        addressLine: '55 Trần Đăng Ninh',
        ward: 'Dịch Vọng',
        district: 'Cầu Giấy',
        city: 'Hà Nội',
        note: 'Nhận buổi tối',
        isDefault: true,
      },
    ],
  },
  {
    userName: 'Lê Quốc Huy',
    email: 'khach03@carvn.demo',
    phoneNumber: '0909000003',
    address: 'Quận Hải Châu, Đà Nẵng',
    addresses: [
      {
        receiverName: 'Lê Quốc Huy',
        phoneNumber: '0909000003',
        addressLine: '201 Bạch Đằng',
        ward: 'Hải Châu 1',
        district: 'Hải Châu',
        city: 'Đà Nẵng',
        note: '',
        isDefault: true,
      },
    ],
  },
  {
    userName: 'Phạm Thu Trang',
    email: 'khach04@carvn.demo',
    phoneNumber: '0909000004',
    address: 'TP. Biên Hoà, Đồng Nai',
    addresses: [
      {
        receiverName: 'Phạm Thu Trang',
        phoneNumber: '0909000004',
        addressLine: '88 Phạm Văn Thuận',
        ward: 'Tân Tiến',
        district: 'Biên Hoà',
        city: 'Đồng Nai',
        note: '',
        isDefault: true,
      },
    ],
  },
  {
    userName: 'Hoàng Gia Bảo',
    email: 'khach05@carvn.demo',
    phoneNumber: '0909000005',
    address: 'Quận Thanh Khê, Đà Nẵng',
    addresses: [
      {
        receiverName: 'Hoàng Gia Bảo',
        phoneNumber: '0909000005',
        addressLine: '15 Điện Biên Phủ',
        ward: 'Chính Gián',
        district: 'Thanh Khê',
        city: 'Đà Nẵng',
        note: '',
        isDefault: true,
      },
    ],
  },
  {
    userName: 'Đỗ Minh Châu',
    email: 'khach06@carvn.demo',
    phoneNumber: '0909000006',
    address: 'Quận Bình Thạnh, TP. Hồ Chí Minh',
    addresses: [
      {
        receiverName: 'Đỗ Minh Châu',
        phoneNumber: '0909000006',
        addressLine: '10 Xô Viết Nghệ Tĩnh',
        ward: '25',
        district: 'Bình Thạnh',
        city: 'TP. Hồ Chí Minh',
        note: '',
        isDefault: true,
      },
    ],
  },
  {
    userName: 'Ngô Thanh Vân',
    email: 'khach07@carvn.demo',
    phoneNumber: '0909000007',
    address: 'Quận Ninh Kiều, Cần Thơ',
    addresses: [
      {
        receiverName: 'Ngô Thanh Vân',
        phoneNumber: '0909000007',
        addressLine: '220 Nguyễn Văn Cừ',
        ward: 'An Khánh',
        district: 'Ninh Kiều',
        city: 'Cần Thơ',
        note: '',
        isDefault: true,
      },
    ],
  },
  {
    userName: 'Bùi Đức Mạnh',
    email: 'khach08@carvn.demo',
    phoneNumber: '0909000008',
    address: 'TP. Huế, Thừa Thiên Huế',
    addresses: [
      {
        receiverName: 'Bùi Đức Mạnh',
        phoneNumber: '0909000008',
        addressLine: '60 Lê Lợi',
        ward: 'Phú Hội',
        district: 'Huế',
        city: 'Thừa Thiên Huế',
        note: '',
        isDefault: true,
      },
    ],
  },
  {
    userName: 'Võ Thị Nhung',
    email: 'khach09@carvn.demo',
    phoneNumber: '0909000009',
    address: 'Quận Hoàn Kiếm, Hà Nội',
    addresses: [
      {
        receiverName: 'Võ Thị Nhung',
        phoneNumber: '0909000009',
        addressLine: '99 Hàng Bông',
        ward: 'Hàng Bông',
        district: 'Hoàn Kiếm',
        city: 'Hà Nội',
        note: '',
        isDefault: true,
      },
    ],
  },
  {
    userName: 'Đặng Hoài Nam',
    email: 'khach10@carvn.demo',
    phoneNumber: '0909000010',
    address: 'TP. Nha Trang, Khánh Hoà',
    addresses: [
      {
        receiverName: 'Đặng Hoài Nam',
        phoneNumber: '0909000010',
        addressLine: '45 Trần Phú',
        ward: 'Lộc Thọ',
        district: 'Nha Trang',
        city: 'Khánh Hoà',
        note: '',
        isDefault: true,
      },
    ],
  },
];

const carSeeds = [
  {
    name: 'Toyota Vios 1.5G',
    company: 'Toyota',
    model: '2024',
    color: 'Trắng ngọc trai',
    price: 620000000,
    discount: 5,
    description: 'Sedan phổ thông tiết kiệm nhiên liệu, phù hợp chạy dịch vụ.',
    quantity: 25,
  },
  {
    name: 'Toyota Corolla Cross 1.8V',
    company: 'Toyota',
    model: '2024',
    color: 'Đen',
    price: 860000000,
    discount: 7,
    description: 'SUV đô thị gầm cao, nhiều tính năng an toàn.',
    quantity: 18,
  },
  {
    name: 'Toyota Camry 2.0Q',
    company: 'Toyota',
    model: '2024',
    color: 'Đen ánh kim',
    price: 1420000000,
    discount: 6,
    description: 'Sedan hạng D cao cấp, thiết kế sang trọng.',
    quantity: 10,
  },
  {
    name: 'Honda City RS',
    company: 'Honda',
    model: '2024',
    color: 'Đỏ',
    price: 599000000,
    discount: 4,
    description: 'Sedan trẻ trung, cảm giác lái tốt.',
    quantity: 22,
  },
  {
    name: 'Honda CR-V L',
    company: 'Honda',
    model: '2024',
    color: 'Trắng',
    price: 1189000000,
    discount: 8,
    description: 'SUV 7 chỗ linh hoạt cho gia đình.',
    quantity: 14,
  },
  {
    name: 'Mazda 3 Premium',
    company: 'Mazda',
    model: '2024',
    color: 'Xanh đậm',
    price: 739000000,
    discount: 5,
    description: 'Sedan phong cách thể thao, nội thất hiện đại.',
    quantity: 16,
  },
  {
    name: 'Mazda CX-5 2.0 Premium',
    company: 'Mazda',
    model: '2024',
    color: 'Trắng',
    price: 949000000,
    discount: 10,
    description: 'SUV bán chạy, cân bằng giữa vận hành và tiện nghi.',
    quantity: 20,
  },
  {
    name: 'Kia Sonet Deluxe',
    company: 'Kia',
    model: '2024',
    color: 'Cam',
    price: 579000000,
    discount: 4,
    description: 'SUV cỡ nhỏ, phù hợp chạy phố.',
    quantity: 21,
  },
  {
    name: 'Kia Seltos Premium',
    company: 'Kia',
    model: '2024',
    color: 'Xám',
    price: 799000000,
    discount: 6,
    description: 'SUV cỡ B, thiết kế hiện đại và nhiều công nghệ.',
    quantity: 15,
  },
  {
    name: 'Kia Carnival 2.2D Signature',
    company: 'Kia',
    model: '2024',
    color: 'Đen',
    price: 1769000000,
    discount: 5,
    description: 'MPV cao cấp, rộng rãi cho gia đình nhiều thế hệ.',
    quantity: 8,
  },
  {
    name: 'Hyundai Accent 1.5 AT',
    company: 'Hyundai',
    model: '2024',
    color: 'Đỏ đô',
    price: 569000000,
    discount: 3,
    description: 'Sedan cỡ B giá tốt, dễ sử dụng.',
    quantity: 24,
  },
  {
    name: 'Hyundai Tucson 2.0 xăng',
    company: 'Hyundai',
    model: '2024',
    color: 'Bạc',
    price: 1049000000,
    discount: 7,
    description: 'SUV hạng C với thiết kế trẻ trung.',
    quantity: 12,
  },
  {
    name: 'Hyundai Santa Fe Dầu Cao Cấp',
    company: 'Hyundai',
    model: '2024',
    color: 'Nâu đồng',
    price: 1369000000,
    discount: 8,
    description: 'SUV 7 chỗ mạnh mẽ, trang bị an toàn cao.',
    quantity: 11,
  },
  {
    name: 'Ford Ranger Wildtrak',
    company: 'Ford',
    model: '2024',
    color: 'Cam',
    price: 1020000000,
    discount: 5,
    description: 'Bán tải mạnh mẽ, phù hợp công việc và dã ngoại.',
    quantity: 13,
  },
  {
    name: 'Ford Everest Titanium',
    company: 'Ford',
    model: '2024',
    color: 'Trắng',
    price: 1452000000,
    discount: 6,
    description: 'SUV 7 chỗ khung gầm chắc chắn, nhiều công nghệ.',
    quantity: 9,
  },
  {
    name: 'Mitsubishi Xpander Premium',
    company: 'Mitsubishi',
    model: '2024',
    color: 'Nâu',
    price: 658000000,
    discount: 5,
    description: 'MPV đa dụng, tiết kiệm nhiên liệu.',
    quantity: 19,
  },
  {
    name: 'Mitsubishi Xforce Ultimate',
    company: 'Mitsubishi',
    model: '2024',
    color: 'Vàng cát',
    price: 705000000,
    discount: 4,
    description: 'SUV cỡ B mới, thiết kế cá tính.',
    quantity: 14,
  },
  {
    name: 'Nissan Almera CVT',
    company: 'Nissan',
    model: '2024',
    color: 'Xanh',
    price: 539000000,
    discount: 6,
    description: 'Sedan tăng áp tiết kiệm nhiên liệu.',
    quantity: 12,
  },
  {
    name: 'Subaru Forester i-L',
    company: 'Subaru',
    model: '2024',
    color: 'Xanh rêu',
    price: 969000000,
    discount: 9,
    description: 'SUV dẫn động AWD an toàn cho hành trình dài.',
    quantity: 7,
  },
  {
    name: 'Peugeot 3008 AT',
    company: 'Peugeot',
    model: '2024',
    color: 'Trắng',
    price: 1069000000,
    discount: 7,
    description: 'SUV phong cách châu Âu, nội thất i-Cockpit.',
    quantity: 6,
  },
];

const reviews = [
  'Xe chạy êm, cách âm tốt, phù hợp đi gia đình.',
  'Nội thất đẹp, màn hình dễ dùng, rất hài lòng.',
  'Mức tiêu hao nhiên liệu ổn, chi phí vận hành hợp lý.',
  'Giao xe đúng hẹn, tư vấn nhiệt tình.',
  'Khả năng tăng tốc tốt, lái trong phố nhẹ nhàng.',
  'Hàng ghế sau rộng, đi xa thoải mái.',
  'Ngoại hình đẹp, đèn LED nhìn rất hiện đại.',
  'Đi cao tốc đầm chắc, vô lăng phản hồi tốt.',
  'Khoang hành lý rộng, chở đồ tiện lợi.',
  'Điều hòa mát nhanh, phù hợp thời tiết nóng.',
];

const buildAmountPrice = (price, discount) =>
  Math.round((price - (price * discount) / 100) * 100) / 100;

const stringifyAddress = (address) =>
  [address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ');

const pick = (arr, index) => arr[index % arr.length];

const clearAllCollections = async () => {
  await Promise.all([
    billModel.deleteMany({}),
    cartModel.deleteMany({}),
    customerModel.deleteMany({}),
    adminModel.deleteMany({}),
    carModel.deleteMany({}),
  ]);
};

const ensureCanSeed = async () => {
  const [adminCount, customerCount, carCount, cartCount, billCount] = await Promise.all([
    adminModel.countDocuments({}),
    customerModel.countDocuments({}),
    carModel.countDocuments({}),
    cartModel.countDocuments({}),
    billModel.countDocuments({}),
  ]);

  const hasData = adminCount || customerCount || carCount || cartCount || billCount;
  if (hasData && !SHOULD_RESET) {
    throw new Error(
      'Database đã có dữ liệu. Dùng `npm run seed:reset` để xoá dữ liệu cũ và seed lại.',
    );
  }
};

const seedAdmins = async (passwordHash) => {
  const payload = adminSeeds.map((admin) => ({
    ...admin,
    password: passwordHash,
    role: ROLES.ADMIN,
    avatar: '',
    refreshToken: null,
  }));
  return adminModel.insertMany(payload);
};

const seedCars = async () => {
  const payload = carSeeds.map((car) => ({
    ...car,
    amountPrice: buildAmountPrice(car.price, car.discount),
    carImage: '',
    reviewsCustomer: [],
  }));
  return carModel.insertMany(payload);
};

const seedCustomers = async (passwordHash) => {
  const payload = customerSeeds.map((customer) => ({
    ...customer,
    password: passwordHash,
    role: ROLES.CUSTOMER,
    avatar: '',
    idCart: null,
    listOrder: [],
    reviewCustomer: [],
    refreshToken: null,
  }));
  return customerModel.insertMany(payload);
};

const seedCarts = async (customers, cars) => {
  const cartPayload = customers.map((customer, index) => {
    const firstCar = pick(cars, index);
    const secondCar = pick(cars, index + 3);
    const listProduct =
      index % 2 === 0
        ? [
            { idProduct: firstCar._id, amountProduct: 1 },
            { idProduct: secondCar._id, amountProduct: 1 + (index % 2) },
          ]
        : [{ idProduct: firstCar._id, amountProduct: 1 }];

    const totalPrice = listProduct.reduce((sum, item) => {
      const car = cars.find((carDoc) => carDoc._id.equals(item.idProduct));
      const unitPrice = Number(car?.amountPrice || car?.price || 0);
      return sum + unitPrice * item.amountProduct;
    }, 0);

    return {
      idCustomer: customer._id,
      listProduct,
      totalPrice: Math.round(totalPrice * 100) / 100,
    };
  });

  const carts = await cartModel.insertMany(cartPayload);
  await Promise.all(
    carts.map((cart) =>
      customerModel.findByIdAndUpdate(cart.idCustomer, {
        $set: { idCart: cart._id },
      }),
    ),
  );

  return carts;
};

const seedBills = async (customers, cars) => {
  const statuses = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
  ];

  const billPayload = [];
  const customerOrderMap = new Map();

  for (let i = 0; i < customers.length; i += 1) {
    const customer = customers[i];
    const billCount = i < 6 ? 2 : 1;

    for (let j = 0; j < billCount; j += 1) {
      const carA = pick(cars, i + j);
      const carB = pick(cars, i + j + 5);

      const listProduct = [
        {
          idProduct: carA._id,
          amountProduct: 1 + (j % 2),
          unitPrice: Number(carA.amountPrice || carA.price || 0),
        },
        {
          idProduct: carB._id,
          amountProduct: 1,
          unitPrice: Number(carB.amountPrice || carB.price || 0),
        },
      ];

      const totalPrice = listProduct.reduce(
        (sum, item) => sum + item.unitPrice * item.amountProduct,
        0,
      );

      const defaultAddress =
        customer.addresses?.find((item) => item.isDefault) || customer.addresses?.[0];
      const shippingAddress = defaultAddress ? stringifyAddress(defaultAddress) : customer.address;

      billPayload.push({
        idCustomer: customer._id,
        listProduct,
        totalPrice: Math.round(totalPrice * 100) / 100,
        shippingAddress: shippingAddress || customer.address || '',
        phoneNumber: customer.phoneNumber || '',
        status: pick(statuses, i + j),
        timeOrder: new Date(Date.now() - (i * 2 + j) * 24 * 60 * 60 * 1000),
      });
    }
  }

  const bills = await billModel.insertMany(billPayload);

  bills.forEach((bill) => {
    const key = bill.idCustomer.toString();
    if (!customerOrderMap.has(key)) {
      customerOrderMap.set(key, []);
    }
    customerOrderMap.get(key).push(bill._id);
  });

  await Promise.all(
    Array.from(customerOrderMap.entries()).map(([customerId, listOrder]) =>
      customerModel.findByIdAndUpdate(customerId, { $set: { listOrder } }),
    ),
  );

  return bills;
};

const seedReviews = async (customers, cars) => {
  const reviewTasks = [];

  for (let index = 0; index < Math.min(customers.length, 12); index += 1) {
    const customer = customers[index];
    const car = pick(cars, index + 2);
    const review = pick(reviews, index);

    reviewTasks.push(
      customerModel.findByIdAndUpdate(customer._id, {
        $push: {
          reviewCustomer: {
            idProduct: car._id,
            review,
          },
        },
      }),
    );

    reviewTasks.push(
      carModel.findByIdAndUpdate(car._id, {
        $push: {
          reviewsCustomer: {
            idCustomer: customer._id,
            nameCustomer: customer.userName,
            review,
          },
        },
      }),
    );
  }

  await Promise.all(reviewTasks);
};

const printSummary = async () => {
  const [adminCount, customerCount, carCount, cartCount, billCount] = await Promise.all([
    adminModel.countDocuments({}),
    customerModel.countDocuments({}),
    carModel.countDocuments({}),
    cartModel.countDocuments({}),
    billModel.countDocuments({}),
  ]);

  console.log('Seed thành công.');
  console.log(
    `Tổng dữ liệu: admin=${adminCount}, customer=${customerCount}, car=${carCount}, cart=${cartCount}, bill=${billCount}`,
  );
  console.log('Tài khoản mẫu:');
  console.log(`- Admin: admin01@carvn.demo / ${DEFAULT_PASSWORD}`);
  console.log(`- Customer: khach01@carvn.demo / ${DEFAULT_PASSWORD}`);
};

const run = async () => {
  await connectDb();
  await ensureCanSeed();

  if (SHOULD_RESET) {
    await clearAllCollections();
    console.log('Đã xoá dữ liệu cũ.');
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SECURITY.SALT_ROUNDS);

  await seedAdmins(passwordHash);
  const cars = await seedCars();
  const customers = await seedCustomers(passwordHash);
  await seedCarts(customers, cars);
  await seedBills(customers, cars);
  await seedReviews(customers, cars);

  await printSummary();
};

run()
  .catch((error) => {
    console.error('Seed thất bại:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
