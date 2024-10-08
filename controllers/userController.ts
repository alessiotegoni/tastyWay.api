import asyncHandler from "express-async-handler";
import { OrderSchema, RestaurantSchema, UserSchema } from "../models";
import {
  calcExpectedTime,
  calcTotalPrice,
  getItems,
  uploadImg,
} from "../lib/utils";
import { DBOrderItem, SingleOrderItem } from "../types";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import { stripe } from "../config/stripe";
import { Request, Response } from "express";

export const getUserOrders = asyncHandler(async (req, res) => {
  const { id: orderId, page, limit } = req.query;

  const { id: userId } = req.user!;

  if (orderId) {
    const order = await OrderSchema.findById(orderId).lean();

    if (!order)
      return res
        .status(404)
        .json({ message: "Ordine cancellato o non esistente" });

    if (order.customerId.toString() !== userId)
      return res
        .status(401)
        .json({ message: "L'ordine non e' di tua proprieta" });

    const { _id, status, totalPrice, createdAt } = order;

    const restaurant = await RestaurantSchema.findById(order.restaurantId, {
      items: 1,
      "deliveryInfo.time": 1,
      imageUrl: 1,
      name: 1,
    }).lean();

    if (!restaurant)
      return res.status(404).json({
        message:
          "Il ristoranre che si e' occupato del tuo ordine non esiste piu",
      });

    const items = getItems(
      order.items,
      restaurant.items as DBOrderItem[],
      "FULL"
    );

    const expectedTime =
      order.status !== "consegnato"
        ? calcExpectedTime(createdAt, restaurant.deliveryInfo!.time)
        : null;

    // TODO: frontend = quanto fetcha tutti gli ordini, filtrare
    // quelli attivi (diversi da consegnato), se ci sono fetcharli
    // e metterli nel widget sopra se non ci sono fetchare ultimo ordine

    const fullInfo = {
      _id: _id.toString(),
      status,
      totalPrice,
      createdAt,
      expectedTime,
      items,
      restaurant: {
        id: restaurant._id.toString(),
        img: restaurant.imageUrl,
        name: restaurant.name,
      },
    };

    return res.status(200).json(fullInfo);
  }

  // Skip and limit method

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await OrderSchema.find(
    { customerId: userId },
    { customerId: 0, address: 0 }
  )
    .lean()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(Number(limit));

  const fullOrders = [];

  for (const {
    items: orderItems,
    updatedAt,
    restaurantId,
    customerId,
    address,
    ...restOrder
  } of orders) {
    const orderRestaurant = await RestaurantSchema.findById(restaurantId, {
      name: 1,
      imageUrl: 1,
      items: 1,
      "deliveryInfo.time": 1,
    }).lean();

    if (!orderRestaurant)
      return res.status(404).json({
        message: `Il ristorante che si e' occupato di questo ordine non esiste piu`,
      });

    const items = getItems(
      orderItems,
      orderRestaurant.items as DBOrderItem[],
      "NAME_QUANTITY"
    );

    fullOrders.push({
      ...restOrder,
      items,
      restaurant: {
        id: restaurantId,
        name: orderRestaurant.name,
        img: orderRestaurant.imageUrl,
      },
    });
  }

  res.status(200).json(fullOrders);
});

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const {
    userId,
    restaurantId,
    restaurantName,
    items,
    deliveryPrice,
    address,
  } = req.body;

  // const { id: userId } = req.user!;

  const line_items = items.map((item: any) => ({
    price_data: {
      currency: "eur",
      product_data: {
        name: item.name,
        images: [
          item.img ?? "https://cdn-icons-png.flaticon.com/512/3225/3225116.png",
        ],
      },
      unit_amount: item.price * 100,
    },
    quantity: item.qnt,
  }));

  const CLIENT_URL = process.env.CLIENT_URL!;

  const metadata = {
    userId,
    restaurantId,
    itemIds: items.map((i: any) => i._id),
    address,
  };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "paypal"],
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery",
          type: "fixed_amount",
          fixed_amount: {
            amount: deliveryPrice * 100,
            currency: "eur",
          },
        },
      },
    ],
    line_items,
    metadata,
    mode: "payment",
    success_url: `${CLIENT_URL}/restaurants/${restaurantName}?success=true`,
    cancel_url: `${CLIENT_URL}/restaurants/${restaurantName}?success=false`,
  });

  if (!session) return res.status(404);

  res.status(200).json(session.url);
});

export const stripeWebhookHandler = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"]!;

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

  if (event?.type !== "checkout.session.completed")
    return res.status(500).json({ message: "Errore durante il pagamento" });

  console.log(event.data.object.metadata);

  const { restaurantId, userId, address, itemIds } =
    event.data.object.metadata!;

  const order = {
    customerId: userId,
    restaurantId,
    address,
    itemIds,
  };

  await createOrder({ body: order }, res);
});

export const createOrder = async (req: Partial<Request>, res: Response) => {
  const { customerId, restaurantId, itemIds, address } = req.body;

  const query = {
    restaurantId,
    // location: {
    //   $near: {
    //     $geometry: {
    //       type: "Point",
    //       coordinates: req.coords,
    //     },
    //     $maxDistance: 5000,
    //   },
    // },
  };

  try {
    const restaurant = await RestaurantSchema.findOne(query, {
      _id: 1,
      deliveryInfo: 1,
      address: 1,
      items: 1,
    }).lean();

    if (!restaurant)
      throw new Error(
        "Questo ristorante non esiste piu' o non e' presente nella tua zona"
      );

    const items = getItems(itemIds, restaurant.items as DBOrderItem[], "FULL");

    if (!items.length)
      return res.status(404).json({
        message:
          "I piatti che hai ordinato sono stati eliminati dal ristorante",
      });

    const totalPrice = calcTotalPrice(
      items as SingleOrderItem[],
      restaurant.deliveryInfo!.price
    );

    await OrderSchema.create({
      customerId,
      restaurantId,
      totalPrice,
      address,
      items: items.map((i) => i._id!),
    });

    res.status(201).json({
      message: "Ordine creato con successo!",
    });
  } catch (err: any) {
    res
      .status(404)
      .json({ message: err.message ?? "Errore nella creazione dell'ordine" });
  }
};

export const getUserProfile = asyncHandler(async (req, res) => {
  const { id: userId } = req.user!;

  const user = await UserSchema.findById(userId, {
    password: 0,
    _id: 0,
    updatedAt: 0,
    __v: 0,
  }).lean();

  if (!user) return res.status(404).json({ message: "Utente non trovato" });

  res.status(200).json(user);
});

export const updateUserInfo = asyncHandler(async (req, res) => {
  const { phoneNumber, isCompanyAccount } = req.body;

  const user = await UserSchema.findById(req.user!.id, {
    isCompanyAccount: 1,
    profileImg: 1,
    phoneNumber: 1,
  });

  const numberExist = await UserSchema.findOne(
    { phoneNumber },
    { phoneNumber: 1 }
  ).lean();

  if (numberExist && numberExist.phoneNumber !== user?.phoneNumber)
    return res.status(401).json({
      message: "Numero di telefono gia' associato ad un'altro account",
    });

  if (user?.isCompanyAccount && !isCompanyAccount)
    return res.status(400).json({
      message: "Non puoi passare da account aziendale a account utente",
    });

  const image = req.file as Express.Multer.File;

  let profileImg = user?.profileImg;
  if (image) profileImg = await uploadImg(image);

  await user!.updateOne({ ...req.body, profileImg }).lean();

  res.status(200).json({ message: "Utente modificato con successo" });
});

export const updateUserSecurity = asyncHandler(async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  const user = await UserSchema.findOne({ _id: req.user!.id }, { password: 1 });

  const passwordsMatch = await bcrypt.compare(oldPassword, user!.password);

  if (!passwordsMatch)
    return res.status(401).json({ message: "Le password non corrispondono" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await user!.updateOne({ password: hashedPassword }).lean();

  res.status(200).json({ message: "Password cambiata con successo!" });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id: userId } = req.user!;

  await UserSchema.findOneAndDelete({ _id: userId });
  await OrderSchema.findOneAndDelete({ customerId: userId });

  res.status(200).json({ message: "Utente ed ordini cancellati con successo" });
});
