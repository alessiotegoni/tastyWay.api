import asyncHandler from "express-async-handler";
import { OrderSchema, RestaurantSchema, UserSchema } from "../models";
import {
  calcExpectedTime,
  calcTotalPrice,
  getItems,
  uploadImg,
} from "../lib/utils";
import bcrypt from "bcrypt";
import { stripe } from "../config/stripe";

export const getUserOrders = asyncHandler(async (req, res) => {
  const { id: orderId, pageParam, limit } = req.query;
  const { id: userId } = req.user!;

  if (orderId) {
    const order = await OrderSchema.findOne({
      _id: orderId,
      customerId: userId,
    }).lean();

    if (!order) {
      res.status(404).json({ message: "Ordine cancellato o non esistente" });
      return;
    }

    const { _id, status, totalPrice, createdAt } = order;
    const restaurant = await RestaurantSchema.findById(order.restaurantId, {
      items: 1,
      "deliveryInfo.time": 1,
      imageUrl: 1,
      name: 1,
    }).lean();

    if (!restaurant) {
      res.status(404).json({
        message:
          "Il ristorante che si è occupato del tuo ordine non esiste più",
      });
      return;
    }

    const items = getItems<"FULL">(order.items, restaurant.items, "FULL");
    const expectedTime =
      order.status !== "Consegnato"
        ? calcExpectedTime(createdAt, restaurant.deliveryInfo!.time)
        : null;

    const fullInfo = {
      _id,
      status,
      totalPrice,
      createdAt,
      expectedTime,
      items,
      restaurant: {
        id: restaurant._id,
        img: restaurant.imageUrl,
        name: restaurant.name,
      },
    };

    res.status(200).json(fullInfo);
  }

  const query: any = { customerId: userId, status: "Consegnato" };

  if (pageParam) query._id = { $lt: pageParam };

  const orders = await OrderSchema.find(query, {
    customerId: 0,
    address: 0,
    status: 0,
  })
    .lean()
    .sort({ _id: -1 })
    .limit(Number(limit));

  const ordersPromises = orders.map(async (order) => {
    const orderRestaurant = await RestaurantSchema.findById(
      order.restaurantId,
      {
        name: 1,
        imageUrl: 1,
        items: 1,
        "deliveryInfo.time": 1,
      }
    ).lean();

    if (!orderRestaurant) return;

    const items = getItems<"FULL">(order.items, orderRestaurant.items, "FULL");

    return {
      _id: order._id,
      items,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      restaurant: {
        id: orderRestaurant._id,
        name: orderRestaurant.name,
        img: orderRestaurant.imageUrl,
      },
    };
  });

  const fullOrders = await Promise.all(ordersPromises);
  const nextCursor = fullOrders.at(-1)?._id;

  res.status(200).json({ orders: fullOrders, nextCursor });
});

export const getUserActiveOrders = asyncHandler(async (req, res) => {
  const { id: userId } = req.user!;

  const activeOrders = await OrderSchema.find(
    {
      customerId: userId,
      status: { $ne: "Consegnato" },
    },
    { customerId: 0 }
  )
    .lean()
    .sort({ _id: -1 });

  const fullOrdersPromise = activeOrders.map(async (order) => {
    const orderRestaurant = await RestaurantSchema.findById(
      order.restaurantId,
      {
        name: 1,
        items: 1,
        deliveryInfo: 1,
      }
    ).lean();

    if (!orderRestaurant) return;

    const items = getItems<"FULL">(order.items, orderRestaurant.items, "FULL");

    const expectedTime = calcExpectedTime(
      order.createdAt,
      orderRestaurant.deliveryInfo!.time
    );

    const totalPrice = calcTotalPrice(
      items,
      orderRestaurant.deliveryInfo!.price
    );

    return {
      id: order._id,
      status: order.status,
      expectedTime,
      items,
      address: order.address,
      totalPrice,
      restaurant: {
        name: orderRestaurant.name,
      },
    };
  });

  const fullOrders = await Promise.all(fullOrdersPromise);

  res.status(200).json({ orders: fullOrders, type: "USER_ORDERS" });
});

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { restaurantId, itemsIds, address } = req.body;
  const { id: userId } = req.user!;

  const query = {
    _id: restaurantId,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: req.coords,
        },
        $maxDistance: 5000,
      },
    },
  };

  const restaurant = await RestaurantSchema.findOne(query, {
    _id: 1,
    "deliveryInfo.price": 1,
    name: 1,
    items: 1,
  }).lean();

  if (!restaurant) {
    res.status(404).json({
      message:
        "Questo ristorante non esiste più o non è presente nella tua zona",
    });
    return;
  }

  const items = getItems<"FULL">(itemsIds, restaurant.items, "FULL");

  if (!items.length) {
    res.status(400).json({
      message: "I piatti che hai ordinato sono stati eliminati dal ristorante",
    });
    return;
  }

  const line_items = items.map((item) => ({
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
    quantity: item.quantity,
  }));

  const CLIENT_URL = process.env.CLIENT_URL!;

  const totalPrice = calcTotalPrice(items, restaurant.deliveryInfo!.price);

  const metadata = {
    userId,
    restaurantId,
    itemsIds: JSON.stringify(items.map((i) => i._id)),
    totalPrice,
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
            amount: restaurant.deliveryInfo!.price * 100,
            currency: "eur",
          },
        },
      },
    ],
    line_items,
    metadata,
    mode: "payment",
    success_url: `${CLIENT_URL}/active-orders`,
    cancel_url: `${CLIENT_URL}/restaurants/${encodeURIComponent(
      restaurant.name
    )}?failed=true`,
  });

  if (!session) {
    res.status(404).json({ message: "Errore nella creazione della sessione" });
    return;
  }

  res.status(200).json(session.url);
});

export const stripeWebhookHandler = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"]!;

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

  if (event?.type !== "checkout.session.completed") {
    res.status(500).json({ message: "Errore durante il pagamento" });
    return;
  }

  const { restaurantId, userId, itemsIds, totalPrice, address } =
    event.data.object.metadata!;

  await createOrder({
    customerId: userId,
    restaurantId,
    address,
    itemsIds: JSON.parse(itemsIds),
    totalPrice: Number(totalPrice),
  });
});

export const createOrder = async (order: {
  customerId: string;
  restaurantId: string;
  address: string;
  itemsIds: string[];
  totalPrice: number;
}) => {
  try {
    await OrderSchema.create({
      ...order,
      items: order.itemsIds,
    });
  } catch (err: any) {
    console.error(err.message ?? "Errore nella creazione dell'ordine");
  }
};

export const getUserProfile = asyncHandler(async (req, res) => {
  const { id: userId } = req.user!;

  const user = await UserSchema.findById(userId, {
    password: 0,
    _id: 0,
    updatedAt: 0,
    createdAt: 0,
    profileImg: 0,
    __v: 0,
  }).lean();

  if (!user) {
    res.status(404).json({ message: "Utente non trovato" });
    return;
  }

  res.status(200).json(user);
});

export const updateUserInfo = asyncHandler(async (req, res) => {
  const { phoneNumber, isCompanyAccount } = req.body;

  const user = await UserSchema.findById(req.user!.id, {
    isCompanyAccount: 1,
    profileImg: 1,
    phoneNumber: 1,
  });

  if (!user) {
    res.status(500);
    return;
  }

  const numberExist = await UserSchema.exists({
    phoneNumber,
    _id: { $ne: user._id },
  }).lean();

  if (numberExist) {
    res.status(401).json({
      message: "Numero di telefono gia' associato ad un'altro account",
    });
    return;
  }

  if (user.isCompanyAccount && !isCompanyAccount) {
    res.status(400).json({
      message: "Non puoi passare da account aziendale a account utente",
    });
    return;
  }

  await user.updateOne({ ...req.body }).lean();

  res.status(200).json({ message: "Utente modificato con successo" });
});

export const updateUserSecurity = asyncHandler(async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  const user = await UserSchema.findOne({ _id: req.user!.id }, { password: 1 });

  const passwordsMatch = await bcrypt.compare(oldPassword, user!.password);

  if (!passwordsMatch) {
    res.status(401).json({ message: "Le password non corrispondono" });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await user!.updateOne({ password: hashedPassword }).lean();

  res.status(200).json({ message: "Password cambiata con successo!" });
});

export const updateUserImg = asyncHandler(async (req, res) => {
  const image = req.file;

  if (!image) {
    res.status(404).json({ message: "Immagine obbligatoria" });
    return;
  }

  const profileImg = await uploadImg(image);

  await req.user!.updateOne({ profileImg });

  res.status(201).json({ message: "Immagine aggiornata con successo" });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id: userId } = req.user!;

  await UserSchema.findOneAndDelete({ _id: userId });
  await OrderSchema.findOneAndDelete({ customerId: userId });

  res.status(200).json({ message: "Utente ed ordini cancellati con successo" });
});
