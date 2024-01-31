const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
userId: {type: String},
statusofcart:{type:String,
              default:'in cart'},
products:[
      {
        proId:{
          type: String
        },
        quantity:{type:Number}
      }
    ]
})

const Cart = mongoose.model("Cart",cartSchema)
module.exports = Cart

