const mongoose = require('mongoose')
const customerModel = new mongoose.Schema({
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
    },
    reviewCustomer:[{
        idProduct:{
            type:mongoose.Types.ObjectId,
            ref:'car'
        },
        review:{
            type:String
        }
    }]
}) 

module.exports = mongoose.model('customer',customerModel)