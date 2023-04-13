const mongoose = require('mongoose')
const customer = new mongoose.Schema({
    userName:{
        type:String
    },
    phoneNumber:{
        type:String,
    },
    email:{
        type:String
    },
    address:{
        type:String
    },
    password:{
        type:String
    },
    idCart:{
        type: mongoose.Types.ObjectId,
        ref: 'cart'
    },

    //lịch sử mua hàng
    listOrder:[{
        type: mongoose.Types.ObjectId,
        ref: 'order'
    }],
    role:{
        default:'customer'
    }
}) 

module.exports = mongoose.model('customer',customer)