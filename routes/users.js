const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

// Get users List
router.get('/', async (req, res) => {
    try {
        const userList = await User.find().select('-password')

        if (!userList) {
            return res.status(400).send('No user found');
        }
        return res.status(200).json({userList});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});

// Get single user by id
router.get('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).send('No user found');
        }
        return res.status(200).json({user})
    } catch (err) {
        console.error(err);
        return res.status(500).send('Interner server error')
    }
});

// Delete user by id
router.delete('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).send('No user found')
        }
        return res.status(200).json({message: 'user deleted successfull'})
    } catch (err) {
        console.error(err);
        return res.status(500).send('internal server error')
    }

});

// Register new user
router.post('/register', async (req, res) => {
    const {
        name, email, password, phone, street,
        apartment, zip, city, country
    } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) { 
            return res.status(400).json('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ 
             name, email, password: hashedPassword,
             phone, street, apartment, zip,
             city, country
            });
            res.status(201).json({ newUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json('Internal server error');
    }
});

// login with email and password
router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await User.findOne({email});

        if (!user) {
            return res.status(400).send('Invalid user')
        }
        const passwordMatched = await bcrypt.compare(password, user.password);
        const secret = process.env.secret;
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            {expiresIn: '1d'}
        );

        if (!passwordMatched) {
            return res.status(400).send('Password does not matched');
        }
        return res.status(200).send({user: user.email, token: token});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});

// Get count
router.get('/get/count', async (req, res) => {
    const {count} = req.body;

    try {
        const userCount = await User.countDocuments(count);

        if (!userCount) {
            return res.status(400).send('Empty product');
        }
        return res.status(200).json({userCount});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});


module.exports = router;