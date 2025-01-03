// Import mongoose and dotenv
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config(); // This is necessary to access process.env variables

// Function to connect to MongoDB
export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, // Ensure backward compatibility
            useUnifiedTopology: true, // Use the new connection engine
        });

        // Log the connection host
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        // Handle errors and log them
        console.error(`Error: ${error.message}`);
        process.exit(1); // Exit the process if DB connection fails
    }
};

