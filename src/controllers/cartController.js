const cartModel = require("../models/cart");
const carModel = require("../models/car");

const cartController = {
  getCartItems: async (req, res, next) => {
    try {
      const idCustomer = req.params.idCustomer;

      const data = await cartModel
        .findOne({ idCustomer })
        .populate("listProduct.idProduct");

      return res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  addToCart: async (req, res, next) => {
    try {
      const idCustomer = req.params.idCustomer;
      let cart = await cartModel.findOne({ idCustomer });

      // kiểm tra có san pham chưa
      const product = cart.listProduct.find(
        (item) => item.idProduct.toString() === req.body.idProduct
      );

      product
        ? (product.amountProduct += 1)
        : cart.listProduct.push({ idProduct: req.body.idProduct });

      cart.totalPrice += req.body.amountPrice;

      await cart.save();

      cart = await cartModel
        .findOne({ idCustomer })
        .populate("listProduct.idProduct");

      res
        .status(201)
        .json({ message: "Thêm sản phẩm vào giỏ hàng thành công", data: cart });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  //Thêm hoặc xoá sản phẩm trong giỏ hàng
  updateCart: async (req, res) => {
    try {
      const { idCustomer } = req.params;
      const product = req.body.listProduct;

      const carIds = product.map((p) => p.idProduct);
      // lấy ra các document có _id thuộc carIds
      const cars = await carModel.find({ _id: { $in: carIds } });

      const totalPrice = cars.reduce((total, car) => {
        // lấy ra amount product tương ứng với car hiện tại
        const { amountProduct } = product.find(
          (p) => p.idProduct === car._id.toString()
        );
        return total + car.amountPrice * amountProduct;
      }, 0);

      const cartUpdate = await cartModel.findOneAndUpdate(
        { idCustomer },
        {
          $set: {
            listProduct: product,
            totalPrice,
          },
        },
        { new: true }
      );

      res.status(200).json({ success: true, data: cartUpdate });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  //Reset giỏ hàng sau khi thanh toán xong
  resetCart: async (req, res) => {
    try {
      const { idCustomer } = req.params; //Id khách hàng
      const cartReset = await cartModel.findOneAndUpdate(
        { idCustomer },
        { listProduct: [] },
        { new: true }
      );
      res.status(200).json({ success: true, data: cartReset });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
module.exports = cartController;
