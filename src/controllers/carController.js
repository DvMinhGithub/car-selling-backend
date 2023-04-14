const carModel = require('../models/car')

const carController = {
  getAllCar: async(req,res)=>{
    try {
      const car = await carModel.find()
      return res.status(200).json({success:true,data:car})
    } catch (error) {
      res.send(error)
    }
  },

  getCarDetail:async(req,res)=>{
    try {
      const id = req.query.id
      const carDetail = await carModel.findById(id)
      return res.status(200).json({success:true,data:carDetail})
    } catch (error) {
      res.send(error)
    }
  },
  createCar: async (req, res) => {
    try {
      const carCreated = await carModel.create(req.body)
      return res.status(200).json({ success: true, data:carCreated })
    } catch (error) {
      res.send(error)
    }

  },
  updateCar : async(req,res)=>{
    try {
      const {price,discount} = req.body
      let amountPrice 
      if(discount){
        amountPrice =  (price*discount)/100
      }else{
        amountPrice = price
      }
      const id = req.query.id
      const carUpdate = await carModel.findByIdAndUpdate(id,{...req.body,amountPrice})
      return res.status(200).json({success:true,data:carUpdate})
    } catch (error) {
      res.send(error)
    }
  }
}
module.exports = { carController }
