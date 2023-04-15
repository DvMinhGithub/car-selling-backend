const cartModel = require("../models/cart");
const carModel = require("../models/car");

const cartController = {
  //Thêm hoặc xoá sản phẩm trong giỏ hàng
  updateCart: async (req, res) => {
    try {
      const { idCustomer } = req.params; //Id khách hàng
      const product = req.body;

      for (i = 0; i < product.length; i++) {
        const getCar = await carModel.findById(product[i].idProduct);
        const getPrice = getCar.amountPrice;
        product[i].price = getPrice;
      }
      
      const totalPrice = product.reduce(
        (totalValue, currentValue) =>
          totalValue + currentValue.price * currentValue.amountProduct,
        0
      );

      const cartUpdate = await cartModel.findOneAndUpdate(
        { idCustomer },
        {
          listProduct: product,
          totalPrice,
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
