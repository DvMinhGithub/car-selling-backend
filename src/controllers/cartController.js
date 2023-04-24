const cartModel = require("../models/cart");
const carModel = require("../models/car");

const cartController = {
  getCartItems: async (req, res, next) => {
    try {
      const idCustomer = req.params.idCustomer;

      const data = await cartModel
        .findOne({ idCustomer })
        .populate("listProduct");

      return res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  addToCart: async (req, res, next) => {
    try {
      const idCustomer = req.params.idCustomer;
      let cart = await cartModel.findOne({ idCustomer });
      const listProduct = req.body;
      let totalPrice = 0;
      for (i = 0; i < listProduct.length; i++) {
        const product = await carModel.findById(listProduct[i].idProduct);
        const productPrice = product.amountPrice;
        totalPrice += (productPrice * listProduct[i].amountProduct);
      }
      console.log(totalPrice)
      let updateCart = await cartModel.findByIdAndUpdate(
        cart._id,
        { listProduct: req.body,totalPrice:totalPrice },
        { new: true }
      );

      res.status(201).json({
        message: "Thêm sản phẩm vào giỏ hàng thành công",
        data: updateCart,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
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
