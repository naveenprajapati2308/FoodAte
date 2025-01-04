import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://naveenprajapati2308:335577@cluster0.pnnw4.mongodb.net/FoodAte').then(() => console.log("DataBase connected"))

}