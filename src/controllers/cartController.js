const cartModel = require("../models/cart");


const cartController = {
  //Thêm hoặc xoá sản phẩm trong giỏ hàng
  updateCart: async (req, res) => {
    try {
      const { id } = req.params; //Id khách hàng
      const product = req.body;
      const cart = await cartModel.find({ idCustomer: id });
      const cartUpdate = await cartModel.findByIdAndUpdate(cart._id, {listProduct:product});
      return res.status(200).json({ success: true, data: cartUpdate });
    } catch (error) {
      res.send(error);
    }
  },
  //Reset giỏ hàng sau khi thanh toán xong
  resetCart: async (req, res) => {
    try {
      const { id } = req.params; //Id khách hàng
      const cart = await cartModel.find({ idCustomer: id });
      await cartModel.findByIdAndUpdate(cart._id, { listProduct: [] });
      return res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.send(error)
    }
  },
};
module.exports = { cartController };
