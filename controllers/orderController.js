import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import razorpay from "razorpay";
import nodemailer from "nodemailer";

// global variables
const currency = "inr";
const deliveryCharge = 10;

// gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, phone } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      phone,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    // Save the order to the database
    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Clear the user's cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Fetch user's email from the database
    const user = await userModel.findById(userId);
    const userEmail = user.email;
    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // or 465 for SSL
      secure: false,
      //   service: "Gmail", // Or another email service
      auth: {
        user: "futrclo@gmail.com", // Replace with your email
        pass: "szza brxy kayx barl", // Replace with your email password or app password
      },
    });

    const mailOptions = {
      from: "futrclo@gmail.com",
      to: userEmail,
      subject: "Order Confirmation",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #000; color: #fff; text-align: center; padding: 20px;">
                  <h1 style="margin: 0; font-size: 24px;">FUTURE</h1>
              </div>
              <div style="padding: 20px;">
                  <h2 style="color: #333;">Order Confirmation</h2>
                  <p style="font-size: 16px; color: #555;">Thank you for your order! Your order has been placed successfully.</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <h3 style="color: #333;">Order Summary:</h3>
                  <ul style="list-style-type: none; padding: 0;">
                      ${items
                        .map(
                          (item) => `
                              <li style="margin-bottom: 15px; display: flex; align-items: center;">
                                  <img src="${item.image[0]}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
                                  <div>
                                      <p style="margin: 0; font-size: 16px; color: #333;"><strong>${item.name}</strong></p>
                                      <p style="margin: 5px 0; font-size: 14px; color: #666;">Size: ${item.size}</p>
                                      <p style="margin: 0; font-size: 14px; color: #666;">Quantity: ${item.quantity}</p>
                                  </div>
                              </li>
                          `
                        )
                        .join("")}
                  </ul>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="font-size: 16px; color: #333;">
                      <strong>Total Amount:</strong> ₹${amount}
                  </p>
                  <p style="font-size: 16px; color: #333;">
                      <strong>Shipping Address:</strong> ${address.street}, ${
        address.city
      }, ${address.state}, ${address.zipcode}, ${address.country}
                  </p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="font-size: 14px; color: #555; text-align: center;">We hope you enjoy your purchase!</p>
              </div>
              <div style="background-color: #f4f4f4; text-align: center; padding: 10px; font-size: 14px; color: #777;">
                  <p style="margin: 0;">&copy; 2024 FUTRCLO. All rights reserved.</p>
              </div>
          </div>
      `,
    };

    const mailOptionsAdminNotify = {
      from: "futrclo@gmail.com",
      to: "orders.futureclo@gmail.com",
      subject: "New Order Notification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #000; color: #fff; text-align: center; padding: 20px;">
            <h1 style="margin: 0; font-size: 28px;">FUTURE</h1>
            <p style="font-size: 16px; margin: 10px 0 0;">New Order Notification</p>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Order Details</h2>
            <p style="font-size: 16px; color: #555;">A new order has been placed successfully. Below are the details:</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Order Summary:</h3>
            <ul style="list-style: none; padding: 0;">
              ${items
                .map(
                  (item, index) => `
                    <li style="margin-bottom: 20px;">
                      <div style="display: flex; align-items: flex-start;">
                        <img src="${item.image[0]}" alt="${
                    item.name
                  }" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; margin-right: 20px;">
                        <div>
                          <p style="margin: 0; font-size: 16px; color: #333;"><strong>Item ${
                            index + 1
                          }: ${item.name}</strong></p>
                          <p style="margin: 5px 0; font-size: 14px; color: #666;">Size: ${
                            item.size
                          }</p>
                          <p style="margin: 5px 0; font-size: 14px; color: #666;">Quantity: ${
                            item.quantity
                          }</p>
                          <p style="margin: 5px 0; font-size: 14px; color: #666;">Price (each): ₹${
                            item.price
                          }</p>
                        </div>
                      </div>
                    </li>
                  `
                )
                .join("")}
            </ul>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Customer Details:</h3>
            <p style="font-size: 14px; color: #555;">
              <strong>Name:</strong> ${user.name || "N/A"}<br>
              <strong>Email:</strong> ${user.email || "N/A"}<br>
              <strong>Phone:</strong> ${phone || "N/A"}<br>
              <strong>Order Date:</strong> ${
                newOrder.date
                  ? new Date(newOrder.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "N/A"
              }
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Shipping Address:</h3>
            <p style="font-size: 14px; color: #555;">
              ${address.street}, ${address.city}, ${address.state}, ${
        address.zipcode
      }, ${address.country}
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Payment Details:</h3>
            <p style="font-size: 14px; color: #555;">
              <strong>Total Amount:</strong> ₹${amount}<br>
              <strong>Payment Method:</strong> COD<br>
              <strong>Payment Status:</strong> Pending
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          </div>
          <div style="background-color: #f4f4f4; text-align: center; padding: 10px; font-size: 14px; color: #777;">
            <p style="margin: 0;">&copy; 2024 FUTRCLO. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptionsAdminNotify);

    // Respond to the client
    res.json({
      success: true,
      message: "Order Placed and Confirmation Email Sent",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Placing orders using Stripe Method
const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const { origin } = req.headers;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Stripe",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: deliveryCharge * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Verify Stripe
const verifyStripe = async (req, res) => {
  const { orderId, success, userId } = req.body;

  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      res.json({ success: true });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req, res) => {
  try {
    const { userId, items, amount, address, phone } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      phone,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    const options = {
      amount: amount * 100,
      currency: currency.toUpperCase(),
      receipt: newOrder._id.toString(),
    };

    await razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.json({ success: false, message: error });
      }
      res.json({ success: true, order });
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { userId, razorpay_order_id } = req.body;

    // Fetch order details from Razorpay
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      const order = await orderModel.findById(orderInfo.receipt);

      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const { items, amount, address, phone } = order;
      // Update order payment status

      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderInfo.receipt,
        { payment: true },
        { new: true }
      );

      // Clear the user's cart
      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      // Fetch user's email
      const user = await userModel.findById(userId);
      const userEmail = user.email;

      // Set up nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "futrclo@gmail.com",
          pass: "szza brxy kayx barl", // Replace with secure storage for passwords
        },
      });

      // Send confirmation email to user
      const mailOptions = {
        from: "futrclo@gmail.com",
        to: userEmail,
        subject: "Order Confirmation",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #000; color: #fff; text-align: center; padding: 20px;">
                    <h1 style="margin: 0; font-size: 24px;">FUTURE</h1>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #333;">Order Confirmation</h2>
                    <p style="font-size: 16px; color: #555;">Thank you for your order! Your order has been placed successfully.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <h3 style="color: #333;">Order Summary:</h3>
                    <ul style="list-style-type: none; padding: 0;">
                        ${items
                          .map(
                            (item) => `
                                <li style="margin-bottom: 15px; display: flex; align-items: center;">
                                    <img src="${item.image[0]}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
                                    <div>
                                        <p style="margin: 0; font-size: 16px; color: #333;"><strong>${item.name}</strong></p>
                                        <p style="margin: 5px 0; font-size: 14px; color: #666;">Size: ${item.size}</p>
                                        <p style="margin: 0; font-size: 14px; color: #666;">Quantity: ${item.quantity}</p>
                                    </div>
                                </li>
                            `
                          )
                          .join("")}
                    </ul>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 16px; color: #333;">
                        <strong>Total Amount:</strong> ₹${amount}
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        <strong>Shipping Address:</strong> ${address.street}, ${
          address.city
        }, ${address.state}, ${address.zipcode}, ${address.country}
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 14px; color: #555; text-align: center;">We hope you enjoy your purchase!</p>
                </div>
                <div style="background-color: #f4f4f4; text-align: center; padding: 10px; font-size: 14px; color: #777;">
                    <p style="margin: 0;">&copy; 2024 FUTRCLO. All rights reserved.</p>
                </div>
            </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      // Send notification email to admin
      const mailOptionsAdminNotify = {
        from: "futrclo@gmail.com",
        to: "orders.futureclo@gmail.com",
        subject: "New Order Notification",
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #000; color: #fff; text-align: center; padding: 20px;">
        <h1 style="margin: 0; font-size: 28px;">FUTURE</h1>
        <p style="font-size: 16px; margin: 10px 0 0;">New Order Notification</p>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Order Details</h2>
        <p style="font-size: 16px; color: #555;">A new order has been placed successfully. Below are the details:</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <h3 style="color: #333; margin-bottom: 10px;">Order Summary:</h3>
        <ul style="list-style: none; padding: 0;">
          ${items
            .map(
              (item, index) => `
                <li style="margin-bottom: 20px;">
                  <div style="display: flex; align-items: flex-start;">
                    <img src="${item.image[0]}" alt="${
                item.name
              }" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; margin-right: 20px;">
                    <div>
                      <p style="margin: 0; font-size: 16px; color: #333;"><strong>Item ${
                        index + 1
                      }: ${item.name}</strong></p>
                      <p style="margin: 5px 0; font-size: 14px; color: #666;">Size: ${
                        item.size
                      }</p>
                      <p style="margin: 5px 0; font-size: 14px; color: #666;">Quantity: ${
                        item.quantity
                      }</p>
                      <p style="margin: 5px 0; font-size: 14px; color: #666;">Price (each): ₹${
                        item.price
                      }</p>
                    </div>
                  </div>
                </li>
              `
            )
            .join("")}
        </ul>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <h3 style="color: #333; margin-bottom: 10px;">Customer Details:</h3>
        <p style="font-size: 14px; color: #555;">
          <strong>Name:</strong> ${user.name || "N/A"}<br>
          <strong>Email:</strong> ${user.email || "N/A"}<br>
          <strong>Phone:</strong> ${address.phone || "N/A"}<br>
          <strong>Order Date:</strong> ${new Date(
            order.date
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <h3 style="color: #333; margin-bottom: 10px;">Shipping Address:</h3>
        <p style="font-size: 14px; color: #555;">
          ${address.street}, ${address.city}, ${address.state}, ${
          address.zipcode
        }, ${address.country}
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <h3 style="color: #333; margin-bottom: 10px;">Payment Details:</h3>
        <p style="font-size: 14px; color: #555;">
          <strong>Total Amount:</strong> ₹${amount}<br>
          <strong>Payment Status:</strong> Paid
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      </div>
      <div style="background-color: #f4f4f4; text-align: center; padding: 10px; font-size: 14px; color: #777;">
        <p style="margin: 0;">&copy; 2024 FUTRCLO. All rights reserved.</p>
      </div>
    </div>
  `,
      };

      await transporter.sendMail(mailOptionsAdminNotify);

      res.json({ success: true, message: "Payment Successful and Email Sent" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// User Order Data For Forntend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update order status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  verifyRazorpay,
  verifyStripe,
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
};
