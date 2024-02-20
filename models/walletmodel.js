const mongoose = require('mongoose')
const walletSchema = new mongoose.Schema({
userId: {type: String},
amount: {type:Number},
orderId : {type:String},
total:{type:Number} 
})

const Wallet = mongoose.model("Wallet",walletSchema)
module.exports = Wallet

