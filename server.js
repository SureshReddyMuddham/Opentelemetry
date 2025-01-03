// Import necessary modules
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import winston from "winston";
import { connectDB } from "./config/db.js";
import Product from "./model/product.model.js";
import { trace } from "@opentelemetry/api"; // Import OpenTelemetry API

// Winston logger setup
const serviceName = "my-service";
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format((info) => {
      info.service = serviceName;
      return info;
    })(),
    winston.format.printf(({ timestamp, level, service, message }) => {
      return `${timestamp} ${level} [${service}] ${message}`;
    }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const app = express();
dotenv.config(); // Load environment variables

// Middleware for parsing JSON
app.use(express.json());

// File system example
fs.writeFileSync("file.txt", "Hello, Node.js!");

// Log initialization messages
logger.info("Server starting...");
logger.info("Initializing MongoDB connection...");

// Connect to MongoDB
connectDB();

// Define routes
app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.get("/books", (req, res) => {
  res.send("Books service is ready");
  logger.info("Message: books endpoint is available");
});

app.get("/greet", (req, res) => {
  const name = req.query.name || "Guest";
  res.send(`Hello, ${name}! Welcome to the server.`);
});

// POST route to create a new product
app.post("/createProduct", async (req, res) => {
  const tracer = trace.getTracer("default");
  const span = tracer.startSpan("POST /createProduct");

  const product = req.body;

  if (!product.name || !product.price || !product.image) {
    span.setStatus({ code: 2, message: "Validation failed" }); // Error status
    span.end();
    return res.status(400).json({ success: false, message: "Please provide all fields" });
  }

  span.setAttribute("product.name", product.name);
  span.setAttribute("product.price", product.price);
  span.setAttribute("product.image", product.image);

  const newProduct = new Product(product);

  try {
    await newProduct.save();
    span.addEvent("Product saved to database", { productId: newProduct._id });

    span.setStatus({ code: 1, message: "Product created successfully" });
    res.status(201).json({ success: true, data: newProduct });
    logger.info(`New product added: Name: ${newProduct.name}, Price: ${newProduct.price}, Image URL: ${newProduct.image}`);
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: 2, message: "Server error" });
    logger.error("Error in Create Product:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    span.end();
  }
});

// GET route to fetch products
app.get("/getProduct", async (req, res) => {
  const tracer = trace.getTracer("default");
  const span = tracer.startSpan("GET /getProduct");

  try {
    const products = await Product.find({});
    span.addEvent("Fetched products from database", { count: products.length });

    span.setStatus({ code: 1, message: "Fetched products successfully" });
    logger.info(`Fetched ${products.length} products successfully.`);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: 2, message: "Server error" });
    logger.error(`Error in fetching products: ${error.message}`);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    span.end();
  }
});

// Start the Express server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`Server started at http://localhost:${PORT}`);
});
