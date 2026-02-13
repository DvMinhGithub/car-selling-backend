const billModel = require('#models/bill');
const carModel = require('#models/car');
const cartModel = require('#models/cart');
const customerModel = require('#models/customer');
const { HTTP_STATUS, ORDER_STATUS, ROLES } = require('#configs/constants');

const isSelf = (req, customerId) => String(req.user?._id) === String(customerId);

const normalizeAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 1;
  return Math.floor(amount);
};

const buildOrderItems = async (listProduct) => {
  const normalizedProducts = Array.isArray(listProduct)
    ? listProduct
        .filter((item) => item?.idProduct)
        .map((item) => ({
          idProduct: item.idProduct,
          amountProduct: normalizeAmount(item.amountProduct),
        }))
    : [];

  if (!normalizedProducts.length) {
    return { error: 'Danh sách sản phẩm trống' };
  }

  const ids = normalizedProducts.map((item) => item.idProduct);
  const cars = await carModel.find({ _id: { $in: ids } }).select('_id amountPrice price quantity');
  const carMap = new Map(cars.map((car) => [String(car._id), car]));

  const orderItems = [];
  const stockUpdates = [];
  let totalPrice = 0;

  for (const item of normalizedProducts) {
    const car = carMap.get(String(item.idProduct));
    if (!car) {
      return { error: `Không tìm thấy xe: ${item.idProduct}` };
    }

    if (
      Number.isFinite(car.quantity) &&
      car.quantity >= 0 &&
      item.amountProduct > Number(car.quantity)
    ) {
      return { error: `Số lượng vượt tồn kho cho xe: ${item.idProduct}` };
    }

    const unitPrice = Number(car.amountPrice) || Number(car.price) || 0;
    totalPrice += unitPrice * item.amountProduct;
    orderItems.push({
      idProduct: car._id,
      amountProduct: item.amountProduct,
      unitPrice,
    });
    stockUpdates.push({
      idProduct: car._id,
      amountProduct: item.amountProduct,
      shouldDecrease: Number.isFinite(car.quantity) && Number(car.quantity) >= 0,
    });
  }

  return { orderItems, totalPrice, stockUpdates };
};

const getDefaultAddressPayload = (customer) => {
  if (!Array.isArray(customer?.addresses) || customer.addresses.length === 0) {
    return null;
  }
  return customer.addresses.find((item) => item.isDefault) || customer.addresses[0] || null;
};

const buildShippingAddress = (payloadAddress, customer) => {
  if (payloadAddress) return payloadAddress;

  const defaultAddress = getDefaultAddressPayload(customer);
  if (defaultAddress) {
    return [
      defaultAddress.addressLine,
      defaultAddress.ward,
      defaultAddress.district,
      defaultAddress.city,
    ]
      .filter(Boolean)
      .join(', ');
  }

  return customer?.address || '';
};

const canCancelByCustomer = (status) =>
  [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(status);

const billController = {
  getAllBill: async (req, res) => {
    try {
      const idCustomer = req.params.idCustomer || req.query.idCustomer;
      const query = {};

      if (idCustomer) {
        if (req.user?.role !== ROLES.ADMIN && !isSelf(req, idCustomer)) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'Bạn không có quyền xem hóa đơn của người dùng khác',
          });
        }
        query.idCustomer = idCustomer;
      } else if (req.user?.role === ROLES.CUSTOMER) {
        query.idCustomer = req.user._id;
      }

      const bills = await billModel
        .find(query)
        .sort({ timeOrder: -1 })
        .populate('idCustomer', 'userName email phoneNumber')
        .populate('listProduct.idProduct');

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy danh sách hóa đơn thành công',
        data: bills,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  getMyBills: async (req, res) => {
    req.params.idCustomer = req.user?._id;
    return billController.getAllBill(req, res);
  },

  getBillDetail: async (req, res) => {
    try {
      const billId = req.params.id || req.query.id;
      if (!billId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id hóa đơn',
        });
      }

      const billDetail = await billModel
        .findById(billId)
        .populate('idCustomer', 'userName email phoneNumber')
        .populate('listProduct.idProduct');

      if (!billDetail) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy hóa đơn',
        });
      }

      if (req.user?.role !== ROLES.ADMIN && !isSelf(req, billDetail.idCustomer?._id)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Bạn không có quyền xem hóa đơn này',
        });
      }

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy chi tiết hóa đơn thành công',
        data: billDetail,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  createBill: async (req, res) => {
    try {
      const idCustomer = req.params.idCustomer || req.user?._id;
      if (!idCustomer) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu idCustomer',
        });
      }
      if (req.user?.role !== ROLES.ADMIN && !isSelf(req, idCustomer)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Bạn không có quyền tạo hóa đơn cho người dùng khác',
        });
      }

      const customer = await customerModel.findById(idCustomer);
      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      const cart = await cartModel.findOne({ idCustomer }).lean();
      const listProduct = Array.isArray(req.body.listProduct)
        ? req.body.listProduct
        : cart?.listProduct || [];

      const { orderItems, totalPrice, stockUpdates, error } = await buildOrderItems(listProduct);
      if (error) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: error,
        });
      }

      const billCreated = await billModel.create({
        idCustomer,
        listProduct: orderItems,
        totalPrice: Math.round(totalPrice * 100) / 100,
        shippingAddress: buildShippingAddress(req.body.shippingAddress, customer),
        phoneNumber: req.body.phoneNumber || customer.phoneNumber || '',
        status: req.body.status || ORDER_STATUS.PENDING,
      });

      await customerModel.findByIdAndUpdate(
        idCustomer,
        { $addToSet: { listOrder: billCreated._id } },
        { new: true },
      );

      for (const item of stockUpdates) {
        if (!item.shouldDecrease) continue;
        await carModel.findByIdAndUpdate(item.idProduct, {
          $inc: { quantity: -item.amountProduct },
        });
      }

      await cartModel.findOneAndUpdate(
        { idCustomer },
        { listProduct: [], totalPrice: 0 },
        { returnDocument: 'after' },
      );

      const billDetail = await billModel
        .findById(billCreated._id)
        .populate('idCustomer', 'userName email phoneNumber')
        .populate('listProduct.idProduct');

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Tạo hóa đơn thành công',
        data: billDetail,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  createMyBill: async (req, res) => {
    req.params.idCustomer = req.user?._id;
    return billController.createBill(req, res);
  },

  cancelMyBill: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id hóa đơn',
        });
      }

      const bill = await billModel.findById(id);
      if (!bill) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy hóa đơn',
        });
      }

      if (!isSelf(req, bill.idCustomer)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Bạn không có quyền hủy hóa đơn này',
        });
      }

      if (!canCancelByCustomer(bill.status)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Hóa đơn đã xử lý, không thể hủy',
        });
      }

      bill.status = ORDER_STATUS.CANCELLED;
      await bill.save();

      for (const item of bill.listProduct) {
        await carModel.findByIdAndUpdate(item.idProduct, {
          $inc: { quantity: item.amountProduct },
        });
      }

      const billDetail = await billModel
        .findById(id)
        .populate('idCustomer', 'userName email phoneNumber')
        .populate('listProduct.idProduct');

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Hủy hóa đơn thành công',
        data: billDetail,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  updateBillStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id hóa đơn hoặc status',
        });
      }

      if (!Object.values(ORDER_STATUS).includes(status)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Trạng thái hóa đơn không hợp lệ',
        });
      }

      const bill = await billModel.findById(id);
      if (!bill) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy hóa đơn',
        });
      }

      if (bill.status === ORDER_STATUS.CANCELLED || bill.status === ORDER_STATUS.COMPLETED) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Không thể cập nhật hóa đơn đã hoàn tất hoặc đã hủy',
        });
      }

      if (status === ORDER_STATUS.CANCELLED && bill.status !== ORDER_STATUS.CANCELLED) {
        for (const item of bill.listProduct) {
          await carModel.findByIdAndUpdate(item.idProduct, {
            $inc: { quantity: item.amountProduct },
          });
        }
      }

      bill.status = status;
      await bill.save();

      const billDetail = await billModel
        .findById(id)
        .populate('idCustomer', 'userName email phoneNumber')
        .populate('listProduct.idProduct');

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Cập nhật trạng thái hóa đơn thành công',
        data: billDetail,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = billController;
