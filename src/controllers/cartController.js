const cartModel = require("../models/cart");

const cartController = {
  //Thêm hoặc xoá sản phẩm trong giỏ hàng
  updateCart: async (req, res) => {
    try {
      const { idCustomer } = req.params; //Id khách hàng
      const product = req.body;
      const cartUpdate = await cartModel.findOneAndUpdate(
        { idCustomer },
        {
          listProduct: product,
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
      const cartReset = await cartModel.findOneAndUpdate({ idCustomer }, { listProduct: [] }, {new: true});
      res.status(200).json({ success: true, data: cartReset });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
module.exports = cartController;
