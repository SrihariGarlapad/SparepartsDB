const express = require('express');
const mongoose = require('mongoose');
const port = 5000;
const cors=require('cors');
const app = express();
const { connectDB } = require('./config/db');
const Product = require('./models/product');

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());
app.get("/product/:productid", async (req, res) => {
    const id = req.params.productid;
    try {
        const product = await Product.findOne({_id: id }, {});
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: "Part is not available" });
        }
    } catch (err) {
        res.status(500).json({ message: "Error fetching part", error: err });
    }
});

// Placeholder route for /product (returns empty object)
app.get("/product", async (req, res) => {
    const allprod= await Product.find();
    if(allprod){
        res.status(200).json({success:true,data:allprod});
    }
    else{
        res.status(404).json({success:false,error:err});
    }
});

// Post a new product
app.post("/products", async (req, res) => {
    const product = req.body;

    // Validate the required fields
    if (!product.name || !product.price) {
        return res.status(400).json({ success: false, message: "Please provide all the fields" });
    }

    // Create a new product instance
    const newProduct = new Product(product);

    try {
        // Save the product to the database
        await newProduct.save();
        res.status(200).json({ success: true, message: "New Product added" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.post("/product-list", async (req, res) => {
  try {
    const { names } = req.body;

    // Validate input: Ensure names is an array and not empty
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ message: "Please pass an array of names" });
    }

    // Remove duplicate product names from the array
    const uniqueNames = [...new Set(names)];

    // Build the regex query for case-insensitive partial matching
    const regexQueries = uniqueNames.map(name => ({
      name: { 
        $regex: name.replace(/\s+/g, '.*'),  // Replace spaces with '.*' for partial matching
        $options: 'i' // Case-insensitive regex search
      } // Case-insensitive regex search
    }));

    // Find matching products in the database by name
    const matchingProducts = await Product.find({
      $or: regexQueries        // Use $or to match any of the names
    }, { _id: 1, name: 1 });

    // Construct the response with product details and URLs
    const result = matchingProducts
      .map((prod) => ({
        name: prod.name,
        id: prod._id,
        url: `http://localhost:${port}/product/${prod._id}`,
      }))
      .filter((value, index, self) => 
        index === self.findIndex((t) => (
          t.id === value.id
        ))
      ); // Remove duplicate products from response

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching product links",
      error: err.message,
    });
  }
});


// app.post("/product-list", async (req, res) => {
//   try {
//     const products = req.body;
//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ message: "Please pass a valid array" });
//     }
//     const names = products.map((product) => product.name);
//     const matchingProducts = await Product.find(
//       { name: { $in: names } },
//       { _id: 1, name: 1 }
//     );
//     const result = matchingProducts.map((prod) => ({
//       name: prod.name,
//       id: prod._id,
//       url: `http://localhost:${port}/product/${prod._id}`
//     }));

//     return res.status(200).json({ success: true, data: result });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching product links",
//       error: error.message
//     });
//   }
// });


app.delete("/product/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const del = await Product.findOneAndDelete({ _id: id });
        if (del) {
            return res.status(200).json({ success: true, message: "Deleted successfully" });
        } else {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting product", error: err });
    }
});
// app.put("/product/:id",async(req,res)=>{
//     try{
//     const id=req.params.id;
//     const update=await Product.findOneAndUpdate({part_id:id}
//         ,{$inc:{stock:-1}},
//         {returnDocument:"after"}
//     )
//     if(update){
//         res.status(200).json({success:true,message:"Product updated"});
//     }
//     else{
//         res.status(404).json({success:false,message:"Product with id not found"});
//     }
//     }
//     catch(err){
//         res.status(500).json({success:false,message:"Error updating product",error:err});
//     }
   
// })
app.put("/product/:id", async (req, res) => {
    try {
      const id = req.params.id;
  
      // Find the product and decrement stock
      const update = await Product.findOneAndUpdate(
        { _id: id },                // Filter by part_id
        { $inc: { stock: -1 } },        // Decrement stock by 1
        { new: true }                   // Return the updated document
      );
  
      if (update) {
        // Ensure stock is not negative
        if (update.stock < 0) {
          // Revert the decrement if stock is negative
          await Product.findOneAndUpdate({ part_id: id }, { $inc: { stock: 1 } });
          return res
            .status(400)
            .json({ success: false, message: "Insufficient stock" });
        }
  
        return res.status(200).json({
          success: true,
          message: "Product updated",
          product: update,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Product with id not found",
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Error updating product",
        error: err.message,
      });
    }
  });
  

// Start the server
app.listen(port, '0.0.0.0',() => {
    console.log(`Server listening at port ${port}`);
});
