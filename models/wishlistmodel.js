const mongoose = require('mongoose')
const wishlistSchema = new mongoose.Schema({
    userId: {type: String},
    products: [
    {
        pId: String
    }
    ]
})

const Wishlist = mongoose.model("Wishlist",wishlistSchema)
module.exports = Wishlist

