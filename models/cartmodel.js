const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
userId: {type: String},
products:[
      {
        proId:String,
        quantity:Number
      }
    ]
})

const Cart = mongoose.model("Cart",cartSchema)
module.exports = Cart

