const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/category');
const router = express.Router();

// get all the categories
router.get('/', async (req, res) => {
    
    try {
        const categoryList = await Category.find()

    if (!categoryList || categoryList.length === 0) {
        return res.status(404).send('No category found')
    }
    return res.status(200).send({categoryList});
            
    } catch (err) {
        console.error(err)
        return res.status(500).send('Internal server error');
    }
});

// get single category by Id
router.get('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).send('No category found');
        }
        return res.status(200).send(category)
    } catch (err) {
        console.error(err);
        return res.status(500).send('Interner server error')
    }
});

// Create a category
router.post(`/`, async (req, res) => {
    const { name, icon, color} = req.body
    try {
      const  category = await Category.create({
            name, 
            icon,
            color
        });
        if (!category) {
            return res.status(400).send('The category can not be created');
        }
        res.json(category)
    } catch (err) {
        console.error(err)
        return res.status(500).send('Internal server error');
    }
    
    
});

// update the category by Id
router.put('/:id', async (req, res) => {
    const {id} = req.params;
    const { name, icon, color} = req.body;

    try {
        const category = await Category.findByIdAndUpdate(id,
            {
                name,
                icon,
                color
            },
            { new: true}
        );

        if (!category) {
            return res.status(404).send('No category found to update');
        }
        return res.status(200).json({category});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});

// Delete a category by id
router.delete('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).send('No category found')
        }
        return res.status(200).json({message: 'category deleted successfull'})
    } catch (err) {
        console.error(err);
        return res.status(500).send('internal server error')
    }
});


module.exports = router;