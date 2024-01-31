const express = require('express');
const { adminLogin, adLoginPost, getDashboard, getProduct, getCategory, getOrder, getUsers, logout, getCategoryPage, isBlocked, deleteOrder, editOrder, setStatus, listProduct } = require('../controllers/admin-controller');
const { verifyAdmin, upload, categoryRules, categValidation, categoryValidation, productRules, proValidation, productValidation } = require('../middlewares/middlewares');
const { addPro, addProduct, addCategory, listCategory, deleteCategory, editCat, editcategory, updateimage, deleteProduct, updatePro, editProduct, editimage, editimages, deleteImage, deleteImages } = require('../controllers/product-controller');
const app = express.Router();


/*............................................login............................................................*/
app.get('/',adminLogin)
app.post('/',adLoginPost)


/*............................................dashboard........................................................*/
app.get('/dashboard',verifyAdmin,getDashboard)


/*..........................................only products.........................................*/
app.get('/product',verifyAdmin,getProduct)
app.get('/unlist/:id',verifyAdmin,listProduct)
app.get('/addproduct',verifyAdmin,addPro)
app.post('/addproduct',verifyAdmin,upload.single('image'),productRules,proValidation,addProduct)
app.get('/deleteproduct/:id',verifyAdmin,deleteProduct)
app.get('/editproduct/:id',verifyAdmin,updatePro)
app.post('/editproduct/:id',verifyAdmin,productRules,productValidation,editProduct)
app.post('/editimage/:proId',verifyAdmin,upload.single('image'),editimage)
app.get('/deleteimage/:id',verifyAdmin,deleteImage)
app.post('/editimages/:proId',verifyAdmin,upload.array('images',6),editimages)
app.get('/deleteimages',verifyAdmin,deleteImages)


/*..........................................category.................................................*/
app.get('/category',verifyAdmin,getCategoryPage)
app.get('/addcategory',verifyAdmin,listCategory)
app.post('/addcategory',verifyAdmin,upload.single('image'),categoryRules,categValidation,addCategory)
app.get('/cdelete/:id',verifyAdmin,deleteCategory)
app.get('/editcategory/:id',verifyAdmin,editCat)
app.post('/editcategory/:id',verifyAdmin,categoryRules,categoryValidation,editcategory)
app.post('/updateimage/:catId',verifyAdmin,upload.single('image'),updateimage)


/*...........................................orders..............................................*/
app.get('/order',verifyAdmin,getOrder)
app.get('/deleteorder/:oid',verifyAdmin,deleteOrder)
app.get('/editorder/:oid',verifyAdmin,editOrder)
app.get('/setstat',verifyAdmin,setStatus)



/*.............................................users........................................................*/
app.get('/customers',verifyAdmin,getUsers)
app.get('/isblocked/:id',verifyAdmin,isBlocked)



/*..............................................logout.....................................................*/
app.get('/logout',verifyAdmin,logout)

module.exports = app