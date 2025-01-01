import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

// function for add product
// const addProduct = async (req, res) => {
//     try {

//         const { name, description, price, category, subCategory, sizes, bestseller } = req.body

//         const image1 = req.files.image1 && req.files.image1[0]
//         const image2 = req.files.image2 && req.files.image2[0]
//         const image3 = req.files.image3 && req.files.image3[0]
//         const image4 = req.files.image4 && req.files.image4[0]

//         const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

//         let imagesUrl = await Promise.all(
//             images.map(async (item) => {
//                 let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
//                 return result.secure_url
//             })
//         )

//         const productData = {
//             name,
//             description,
//             category,
//             price: Number(price),
//             subCategory,
//             bestseller: bestseller === "true" ? true : false,
//             sizes: JSON.parse(sizes),
//             image: imagesUrl,
//             date: Date.now()
//         }

//         console.log(productData);

//         const product = new productModel(productData);
//         await product.save()

//         res.json({ success: true, message: "Product Added" })

//     } catch (error) {
//         console.log(error)
//         res.json({ success: false, message: error.message })
//     }
// }
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      outOfStock,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: JSON.parse(sizes),
      image: imagesUrl,
      outOfStock: outOfStock === "true" ? true : false, // New Field
      date: Date.now(),
    };

    console.log(productData);

    const product = new productModel(productData);
    await product.save();

    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params; // Assuming productId is passed as a URL parameter
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      outOfStock,
    } = req.body;

    // Check if product exists
    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Handle file uploads (images)
    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    let imagesUrl = [];
    if (images.length > 0) {
      imagesUrl = await Promise.all(
        images.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
          });
          return result.secure_url;
        })
      );
    }

    // Prepare the product data to be updated
    const updatedProductData = {
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: JSON.parse(sizes),
      image: imagesUrl.length > 0 ? imagesUrl : existingProduct.image, // Preserve existing images if none are uploaded
      outOfStock: outOfStock === "true" ? true : false, // New Field
    };

    // Update the product
    await productModel.findByIdAndUpdate(productId, updatedProductData, {
      new: true, // Return the updated document
    });

    res.json({ success: true, message: "Product Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for list product
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
const updateStockStatus = async (req, res) => {
  try {
    const { id, outOfStock } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const product = await productModel.findById(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.outOfStock = outOfStock;
    await product.save();
    res.json({ success: true, message: "Stock status updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  updateStockStatus,
  updateProduct,
};
