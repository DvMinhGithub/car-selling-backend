const billModel = require("../models/bill");
const customerModel = require("../models/customer");

const billController = {
  getAllBill: async (req, res) => {
    try {
      const {id} = req.params; //Id của khách hàng
      const customer = await customerModel.findById(id);
      const listOrder = customer.listOrder;
      return res.status(200).json({ success: true, data: listOrder });
    } catch (error) {
      res.send(error);
    }
  },

  getBillDetail: async (req, res) => {
    try {
        const {id}=req.query //Id của hoá đơn
      const billDetail = await billModel.findById(id);
      return res.status(200).json({ success: true, data: billDetail });
    } catch (error) {
      res.send(error);
    }
  },

  //Khi người dùng bấm thanh toán sẽ tạo bill
  createBill: async (req, res) => {
    try {
      const id = req.params.id;//Id khách hàng

      //Tạo bill mới 
      const billCreated = await billModel.create({
        ...req.body,
        idCustomer: id,
      });

      //Đẩy bill mới vào lịch sử đơn hàng
      const customer = await customerModel.findById(id);
      const customerListOrder = customer.listOrder;
      customerListOrder.push(billCreated);
      await customerModel.findByIdAndUpdate(id, {
        listOrder: customerListOrder,
      });
      return res.status(200).json({ success: true, data: billCreated });
    } catch (error) {
      res.send(error);
    }
  },
};

module.exports = { billController };
