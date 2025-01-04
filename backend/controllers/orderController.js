import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
////check the port before the run the project 
const frontend_url = "https://foodate-frontend.onrender.com/";

// Placing user order from the frontend
const placeOrder = async (req, res) => {
    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
        });
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100, // Convert to smallest currency unit
            },
            quantity: item.quantity,
        }));
        line_items.push({
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Delivery Charges",
                },
                unit_amount: 40 * 100, // Delivery charge in smallest currency unit
            },
            quantity: 1,
        });

        // Stripe session creation with metadata for compliance
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "payment",
            billing_address_collection: "required",
            metadata: {
                orderId: newOrder._id.toString(), // Ensure orderId is passed here
                customerName: req.body.name,
                customerEmail: req.body.email,
            },
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`, // Corrected parameter name
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`, // Corrected parameter name
        });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.error("Error in placeOrder:", error);
        res.status(500).json({ success: false, message: "Failed to place order" });
    }
};

// Create a payment intent for direct payments
export const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency } = req.body; // Ensure these values come from the client

        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,        // Amount in smallest currency unit (e.g., cents)
            currency,      // e.g., 'inr' for Indian Rupee
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Error in createPaymentIntent:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Verifying the order based on success or failure
const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success == "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment failed, order deleted" });
        }
    } catch (error) {
        console.error("Error in verifyOrder:", error);
        res.status(500).json({ success: false, message: "Failed to verify order" });
    }
};

// Fetch user orders for frontend
const userOrders = async (req, res) => {
    try {
        // console.log("Request Body:", req.body); 
        const orders = await orderModel.find({ userId: req.body.userId }); // Use `userId` from middlewarek
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Failed to fetch user orders" });
    }
};
//listing orders for admin pannel

const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to fetch orders" });

    }

}
//api for updating status of order  

const updateStatus = async (req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Order status updated successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to update order status" });

    }

}


export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
