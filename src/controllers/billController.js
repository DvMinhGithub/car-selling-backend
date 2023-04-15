const billModel = require("../models/bill");
const cart = require("../models/cart");
const customerModel = require("../models/customer");
const cartModel = require("../models/cart");

const billController = {
  getAllBill: async (req, res) => {
    try {
      const { idCustomer } = req.params; //Id của khách hàng
      const customer = await customerModel
        .findById(idCustomer)
        .populate("listOrder");
      const listOrder = customer.listOrder;
      res.status(200).json({ success: true, data: listOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getBillDetail: async (req, res) => {
    try {
      const { id } = req.query; //Id của hoá đơn
      const billDetail = await billModel.findById(id);
      res.status(200).json({ success: true, data: billDetail });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  //Khi người dùng bấm thanh toán sẽ tạo bill
  createBill: async (req, res) => {
    try {
      const { idCustomer } = req.params; //Id khách hàng

      //Tạo bill mới
      const billCreated = await billModel.create({
        ...req.body,
        idCustomer,
      });

      //Đẩy bill mới vào lịch sử đơn hàng
      const customer = await customerModel.findById(idCustomer);
      const customerListOrder = customer.listOrder;
      customerListOrder.push(billCreated);

      await customerModel.findByIdAndUpdate(idCustomer, {
        listOrder: customerListOrder,
      });
      res.status(200).json({ success: true, data: billCreated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = billController;
