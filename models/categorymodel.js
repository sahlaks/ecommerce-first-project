const mongoose = require('mongoose')
const categorySchema = new mongoose.Schema({
category: {
    type: String
  },
  description: {
    type:String,
  },
  image: {
    type:String
  },
addedAt: {
    type:String,
    default:function(){
            return new Date().toDateString()
    }
}
})

const Category = mongoose.model("Category",categorySchema)
module.exports = Category

