const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/order');
const OrderItem = require('../models/order-item')
const router = express.Router();

// get orders list
router.get('/', async (req, res) => {

    try {
        const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});

        if (!orderList) {
            return res.status(400).send('No order found');
        }
        return res.status(200).json({orderList});
    } catch (err) {
        console.error(err);
        return res.status(500).send({message: err})
    }
})

// get order by id
router.get('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const order = await Order.findById(id).populate('user', 'name').populate({
            path: 'orderItems',
            populate: {path: 'product', populate: 'category'}
        });

        if (!order) {
            return res.status(400).send('No order found');
        }
        return res.status(200).json({order});
    } catch (err) {
        console.error(err);
        return res.status(500).send({message: err})
    }
})

// post order
router.post('/', async (req, res) => {

    try {
        const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderItem) => {
             const newOrderItem = await OrderItem.create({
                quantity: orderItem.quantity,
                product: orderItem.product
             })

             return newOrderItem._id
            }))
            const orderItemsIdsResolved =  await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a,b) => a +b , 0);

        const newOrder = await Order.create({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
        })
        return res.status(200).json({newOrder})
    } catch (err) {
        console.error(err);
        return res.status(500).send({message: err})
    }
});

// update the order status by id
router.put('/:id', async (req, res) => {
    const {id} = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(id,
            {
                status,
                
            },
            { new: true}
        );

        if (!order) {
            return res.status(404).send('No order found to update');
        }
        return res.status(200).json({order});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});

// Delete an order and OrderItem by id
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (order) {
            await Promise.all(
                order.orderItems.map(async orderItem => {
                    await OrderItem.findByIdAndDelete(orderItem);
                })
            );
            return res.status(200).json({ success: true, message: 'The order is deleted!' });
        } else {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

router.get('/get/totalsales', async (req, res)=> {
    const totalSales= await Order.aggregate([
        { $group: { _id: null , totalsales : { $sum : '$totalPrice'}}}
    ])

    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({totalsales: totalSales.pop().totalsales})
});

router.get('/get/count', async (req, res) => {
    const {count} = req.body;

    try {
        const orderCount = await Order.countDocuments(count);

        if (!orderCount) {
            return res.status(400).send('No order');
        }
        return res.status(200).json({orderCount});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});

router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid}).populate({ 
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'} 
        }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})


module.exports = router;