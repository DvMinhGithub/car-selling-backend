const cartModel = require('#models/cart');
const carModel = require('#models/car');
const { HTTP_STATUS, ROLES } = require('#configs/constants');

const isSelf = (req, customerId) => String(req.user?._id) === String(customerId);

const normalizeAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 1;
  return Math.floor(amount);
};

const recalculateCart = async (cart) => {
  const items = Array.isArray(cart.listProduct) ? cart.listProduct : [];
  let totalPrice = 0;

  for (const item of items) {
    const car = await carModel.findById(item.idProduct).select('amountPrice price');
    if (!car) continue;

    const unitPrice = Number(car.amountPrice) || Number(car.price) || 0;
    totalPrice += unitPrice * item.amountProduct;
  }

  cart.totalPrice = Math.round(totalPrice * 100) / 100;
  return cart;
};

const ensureAuthorizedCustomer = (req, customerId) => {
  if (req.user?.role === ROLES.ADMIN) return true;
  return isSelf(req, customerId);
};

const getCustomerIdFromRequest = (req) => req.params.idCustomer || req.user?._id;

const cartController = {
  getCartItems: async (req, res) => {
    try {
      const customerId = getCustomerIdFromRequest(req);
      if (!customerId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu idCustomer',
        });
      }

      if (!ensureAuthorizedCustomer(req, customerId)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Bạn không có quyền truy cập giỏ hàng này',
        });
      }

      let cart = await cartModel
        .findOne({ idCustomer: customerId })
        .populate('listProduct.idProduct');
      if (!cart) {
        cart = await cartModel.create({ idCustomer: customerId, listProduct: [], totalPrice: 0 });
      }

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy giỏ hàng thành công',
        data: cart,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  getMyCart: async (req, res) => {
    req.params.idCustomer = req.user?._id;
    return cartController.getCartItems(req, res);
  },

  addToCart: async (req, res) => {
    try {
      const customerId = getCustomerIdFromRequest(req);
      if (!customerId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu idCustomer',
        });
      }
      if (!ensureAuthorizedCustomer(req, customerId)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Bạn không có quyền cập nhật giỏ hàng này',
        });
      }

      const inputItems = [];
      if (Array.isArray(req.body.listProduct)) {
        for (const item of req.body.listProduct) {
          if (!item?.idProduct) continue;
          inputItems.push({
            idProduct: item.idProduct,
            amountProduct: normalizeAmount(item.amountProduct),
          });
        }
      } else if (req.body.idProduct) {
        inputItems.push({
          idProduct: req.body.idProduct,
          amountProduct: normalizeAmount(req.body.amountProduct),
        });
      }

      if (!inputItems.length) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu sản phẩm để thêm vào giỏ hàng',
        });
      }

      const carIds = inputItems.map((item) => item.idProduct);
      const existingCars = await carModel.find({ _id: { $in: carIds } }).select('_id quantity');
      const existingCarMap = new Map(existingCars.map((car) => [String(car._id), car]));
      const notFound = inputItems.find((item) => !existingCarMap.has(String(item.idProduct)));
      if (notFound) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: `Không tìm thấy xe: ${notFound.idProduct}`,
        });
      }

      let cart = await cartModel.findOne({ idCustomer: customerId });
      if (!cart) {
        cart = await cartModel.create({ idCustomer: customerId, listProduct: [], totalPrice: 0 });
      }

      for (const item of inputItems) {
        const car = existingCarMap.get(String(item.idProduct));
        const currentItem = cart.listProduct.find(
          (product) => String(product.idProduct) === String(item.idProduct),
        );
        const nextAmount = (currentItem?.amountProduct || 0) + item.amountProduct;

        if (Number.isFinite(car.quantity) && car.quantity > 0 && nextAmount > car.quantity) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Số lượng vượt quá tồn kho cho xe ${item.idProduct}`,
          });
        }

        if (currentItem) {
          currentItem.amountProduct = nextAmount;
        } else {
          cart.listProduct.push({
            idProduct: item.idProduct,
            amountProduct: item.amountProduct,
          });
        }
      }

      await recalculateCart(cart);
      await cart.save();

      const populatedCart = await cartModel
        .findById(cart._id)
        .populate('listProduct.idProduct')
        .lean();

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Thêm sản phẩm vào giỏ hàng thành công',
        data: populatedCart,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  addToMyCart: async (req, res) => {
    req.params.idCustomer = req.user?._id;
    return cartController.addToCart(req, res);
  },

  updateCartItem: async (req, res) => {
    try {
      const customerId = req.user?._id;
      const carId = req.params.carId;
      const amountProduct = normalizeAmount(req.body.amountProduct);

      if (!carId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu carId',
        });
      }

      const cart = await cartModel.findOne({ idCustomer: customerId });
      if (!cart) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy giỏ hàng',
        });
      }

      const item = cart.listProduct.find((product) => String(product.idProduct) === String(carId));
      if (!item) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Sản phẩm chưa có trong giỏ hàng',
        });
      }

      const car = await carModel.findById(carId).select('quantity');
      if (!car) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy xe',
        });
      }
      if (Number.isFinite(car.quantity) && car.quantity > 0 && amountProduct > car.quantity) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Số lượng vượt quá tồn kho',
        });
      }

      item.amountProduct = amountProduct;
      await recalculateCart(cart);
      await cart.save();

      const populatedCart = await cartModel
        .findById(cart._id)
        .populate('listProduct.idProduct')
        .lean();

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Cập nhật giỏ hàng thành công',
        data: populatedCart,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  removeCartItem: async (req, res) => {
    try {
      const customerId = req.user?._id;
      const carId = req.params.carId;
      const cart = await cartModel.findOne({ idCustomer: customerId });

      if (!cart) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy giỏ hàng',
        });
      }

      cart.listProduct = cart.listProduct.filter(
        (product) => String(product.idProduct) !== String(carId),
      );

      await recalculateCart(cart);
      await cart.save();

      const populatedCart = await cartModel
        .findById(cart._id)
        .populate('listProduct.idProduct')
        .lean();

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
        data: populatedCart,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  resetCart: async (req, res) => {
    try {
      const customerId = getCustomerIdFromRequest(req);
      if (!customerId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu idCustomer',
        });
      }

      if (!ensureAuthorizedCustomer(req, customerId)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Bạn không có quyền cập nhật giỏ hàng này',
        });
      }

      const cartReset = await cartModel.findOneAndUpdate(
        { idCustomer: customerId },
        { listProduct: [], totalPrice: 0 },
        { returnDocument: 'after', upsert: true },
      );

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Reset giỏ hàng thành công',
        data: cartReset,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  resetMyCart: async (req, res) => {
    req.params.idCustomer = req.user?._id;
    return cartController.resetCart(req, res);
  },
};

module.exports = cartController;
