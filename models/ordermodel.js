const mongoose = require('mongoose')
const orderSchema = new mongoose.Schema({
        userId: {type: String},
        fname:{type:String},
        sname:{type:String},
        address:{type:String},
        locality:{type:String},
        district:{type:String},
        pincode:{type:String},
        mobilenumber:{type:String},
        email:{type:String},
        paymentoption:{type:String},
        cartid:{type:String},
            proId:{type: String},
            productname:{type:String},
            price:{type:Number},
            subtotalprod:{type:Number},
            category:{type:String},
            image:{type:String},
        quantity:{type:Number},
        subtotal:{type:Number},
        discount:{type:Number},
        total:{type:Number},
        date:{type:String,
            default: function() {
                return new Date().toDateString()
            }},
        status:{type:String,
                default:'Placed'},
        payment:{type:String,
                default:'Failure'},
        appliedCoupons:{type:Array,
                default: []}
})

const Order = mongoose.model("Order",orderSchema)
module.exports = Order;

