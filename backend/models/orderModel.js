import mongoose from "mongoose";

// Address schema as an embedded document
const addressSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
});

// Order schema with updated userId type for MongoDB compatibility
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // Updated to ObjectId
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    address: { type: addressSchema, required: false },  // Address is optional here
    status: { type: String, default: "Food Processing" },
    date: { type: Date, default: Date.now },
    payment: { type: Boolean, default: false },
});

// Create or retrieve the Order model
const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
