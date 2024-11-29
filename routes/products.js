const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/product');
const Category = require('../models/category');
const router = express.Router();
const multer = require('multer');
const path = require('path');


const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if(isValid) {
            uploadError = null
        }
        cb(uploadError, 'Public/uploads')
    },
    filename: function (req, file, cb) {
        
      const fileName = file.originalname.split(' ').join('-');
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })

const upload = multer({ storage: storage });

// get the product lists
router.get(`/`, async (req, res) => {
    try {
        let filter = {}
        if (req.query.categories) {
            filter = {category: req.query.categories.split(',')}
        }

        const productList = await Product.find(filter).populate('category');

        if (!productList) {
            return res.status(404).json({message: 'No productList found'});
        }
        return res.status(200).send(productList)
    }
    catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});

// Get a single product by id
router.get(`/:id`, async (req, res) => {
    const {id} = req.params
    try {
        const product = await Product.findById(id).populate('category');

        if (!product) {
            return res.status(404).json({message: 'No product found'});
        }
        return res.status(200).send(product)
    }
    catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }

});
 
// create a product
router.post(`/`, upload.single('image'), async (req, res) => {
    const { 
            name, description, richDescription, brand,
            price, category, countInStock, rating, numReviews, isFeatured
        } = req.body
    try {
        const existingCategory = await Category.findById(category)
        if (!existingCategory) {
            console.error('Category not found:', category);
            return res.status(404).send('invalid category')
        }

        const file = req.file;
        if(!file) return res.status(400).send('No image in the request');

      const fileName = req.file.filename  
      const basePath = `${req.protocol}://${req.get('host')}/Public/uploads/`
      const  product = await Product.create({
            name,
            description,
            richDescription,
            image: `${basePath}${fileName}`,
            brand,
            price,
            category,
            countInStock,
            rating,
            numReviews,
            isFeatured 
        })
        res.json(product)
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }  

});

// update the product by id
router.put('/:id', async (req, res) => {
    const {id} = req.params;
    const { 
        name, description, richDescription, brand,
        price, category, countInStock, rating, numReviews, isFeatured} = req.body

    try {

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send('invalid product Id');
        }

        const existingCategory = await Category.findById(category)
        if (!existingCategory) {
            return res.status(404).send('invalid category')
        }

        const product = await Product.findByIdAndUpdate(id,
            {
                name, description, richDescription, image: req.body.image, brand,
                price, category, countInStock, rating, numReviews, isFeatured
            },
            { new: true}
        );

        if (!product) {
            return res.status(404).send('No product found to update');
        }
        return res.status(200).json({product});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }

});

// Delete product by id
router.delete('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).send('No product found')
        }
        return res.status(200).json({message: 'Product deleted successfull'})
    } catch (err) {
        console.error(err);
        return res.status(500).send('internal server error')
    }

});

router.get('/get/count', async (req, res) => {
    const {count} = req.body;

    try {
        const productCount = await Product.countDocuments(count);

        if (!productCount) {
            return res.status(400).send('Empty product');
        }
        return res.status(200).json({productCount});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});

router.get('/get/featured/:count', async (req, res) => {

    try {
        const count = req.params.count ? req.params.count : 0
        const products = await Product.find({isFeatured: true}).limit(count);

        if (!products) {
            return res.status(400).send('No product found');
        }
        return res.status(200).send({products})
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
})

router.put(
    '/gallery-images/:id', 
    upload.array('images', 10), 
    async (req, res)=> {
        if(!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id')
         }
         const files = req.files
         let imagesPaths = [];
         const basePath = `${req.protocol}://${req.get('host')}/Public/uploads/`;

         if(files) {
            files.map(file =>{
                imagesPaths.push(`${basePath}${file.filename}`);
            })
         }

         const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths
            },
            { new: true}
        )

        if(!product)
            return res.status(500).send('the gallery cannot be updated!')

        res.send(product);
    }
)

module.exports = router;