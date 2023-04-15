const carModel = require("../models/car");

const carController = {
  getAllCar: async (req, res) => {
    try {
      const car = await carModel.find();
      res.status(200).json({ success: true, data: car });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getCarDetail: async (req, res) => {
    try {
      const id = req.query.id;
      const carDetail = await carModel.findById(id);
      res.status(200).json({ success: true, data: carDetail });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  createCar: async (req, res) => {
    try {
      const carCreated = await carModel.create(req.body);

      res.status(200).json({ success: true, data: carCreated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateCar: async (req, res) => {
    try {
      const { price, discount } = req.body;
      let amountPrice;
      if (discount) {
        amountPrice = (price * discount) / 100;
      } else {
        amountPrice = price;
      }
      const id = req.query.id;
      const carUpdate = await carModel.findByIdAndUpdate(
        id,
        {
          ...req.body,
          amountPrice,
        },
        { new: true }
      );
      res.status(200).json({ success: true, data: carUpdate });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
module.exports = carController;
