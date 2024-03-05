const mongoose = require('mongoose')
const bannerSchema = new mongoose.Schema({
    image1:String,
    image2:String
})

const Banner = mongoose.model("Banner",bannerSchema)
module.exports = Banner

