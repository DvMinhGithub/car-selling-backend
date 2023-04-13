const mongoose = require('mongoose')

const cartModel = new mongoose.Schema({
    idCustomer:{
        type:mongoose.Types.ObjectId,
        ref:'customer'
    },
    totalPrice:{
        type:Number
    },
    listProduct:[{
        product:{
            type:mongoose.Types.ObjectId,
            ref:'product'
        },

        //Số lượng
        amountProduct:{
            type:Number,
            default:1
        }
    }]
})

module.exports = mongoose.model('cart',cartModel)