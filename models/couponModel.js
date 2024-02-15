const mongoose = require('mongoose')
const couponSchema = new mongoose.Schema({
code: {
    type: String,
},
minAmount: {
    type:Number,
},
discount:{
    type:Number,
},
expirationDate:{
    type:Date,
},
addedAt:{
    type:Date,
    default:Date.now()
},
isUsed:{
    type:Boolean,
    default:false
},
users:[{
    userId:{
    type:String
    }
}]

})

const Coupon = mongoose.model("Coupon",couponSchema)
module.exports = Coupon

