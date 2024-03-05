const express = require('express');
const { adminLogin, adLoginPost, getDashboard, getProduct, getCategory, getOrder, getUsers, logout, getCategoryPage, isBlocked, deleteOrder, editOrder, setStatus, listProduct, getDailySales } = require('../controllers/adminController');
const { verifyAdmin, upload, categoryRules, categValidation, categoryValidation, productRules, proValidation, productValidation, productImgResize, productImgResizeSingle } = require('../middlewares/middlewares');
const { addPro, addProduct, addCategory, listCategory, deleteCategory, editCat, editcategory, updateimage, deleteProduct, updatePro, editProduct, editimage, editimages, deleteImage, deleteImages } = require('../controllers/productController');
const { getCoupon, createNewCoupon, postNewCoupon, editCoupon, deleteCoupon } = require('../controllers/couponController');
const { getBanner, addBanner, deleteBanner } = require('../controllers/bannerController');
const { salesReport, getSalesReport, getSales, report, customReport, monthlyReport, yearlyReport, yearlyCsv, monthlyCsv, dailyCsv, customCsv } = require('../controllers/salesReportController');
const app = express.Router();


/*............................................login............................................................*/
app.get('/',adminLogin)
app.post('/',adLoginPost)


/*............................................dashboard........................................................*/
app.get('/dashboard',verifyAdmin,getDashboard)
app.get('/salesreport',verifyAdmin,salesReport)
app.get('/getSalesreport',getSalesReport)
app.post('/getSales',getSales)
app.post('/customReport',customReport)
app.post('/getMonthlyReport',monthlyReport)
app.post('/getYearlyReport',yearlyReport)
app.get('/yearlyReport',yearlyCsv)
app.get('/monthlyCsv',monthlyCsv)
app.get('/dailyCsv',dailyCsv)
app.get('/customCsv',customCsv)



/*..........................................only products.........................................*/
app.get('/product',verifyAdmin,getProduct)
app.get('/unlist/:id',verifyAdmin,listProduct)
app.get('/addproduct',verifyAdmin,addPro)
app.post('/addproduct',verifyAdmin,upload.single('image'),productImgResizeSingle,productRules,proValidation,addProduct)
app.get('/deleteproduct/:id',verifyAdmin,deleteProduct)
app.get('/editproduct/:id',verifyAdmin,updatePro)
app.post('/editproduct/:id',verifyAdmin,productRules,productValidation,editProduct)
app.post('/editimage/:proId',verifyAdmin,upload.single('image'),productImgResizeSingle,editimage)
app.get('/deleteimage/:id',verifyAdmin,deleteImage)
app.post('/editimages/:proId',verifyAdmin,upload.array('images',6),productImgResize,editimages)
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


/*........................................coupons................................................*/
app.get('/coupons',verifyAdmin,getCoupon)
app.post('/addcoupons',verifyAdmin,postNewCoupon)
app.get('/deletecoupon',verifyAdmin,deleteCoupon)

/*.............................................users........................................................*/
app.get('/customers',verifyAdmin,getUsers)
app.get('/isblocked/:id',verifyAdmin,isBlocked)

/*.............................................banner..................................................................*/
app.get('/banner',verifyAdmin,getBanner)
app.post('/addBanner',verifyAdmin,upload.array('images',4),addBanner)
app.get('/deleteBanner',verifyAdmin,deleteBanner)

/*..............................................logout.....................................................*/
app.get('/logout',verifyAdmin,logout)
app.get('/getSalesDetails', getDailySales)

  

module.exports = app