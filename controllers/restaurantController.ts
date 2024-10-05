import asyncHandler from "express-async-handler";
import { OrderSchema, RestaurantSchema, UserSchema } from "../models";
import { v2 as cloudinary } from "cloudinary";
import { calcExpectedTime, getItems, uploadImg } from "../lib/utils";
import {
  DBOrderItem,
  RestaurantItemsFilters,
  RestaurantOrder,
  RestautantFilters,
} from "../types";

export const getRestaurants = asyncHandler(async (req, res) => {
  const { pageParam, limit, filters } = req.query;

  // Skip and limit method
  // const skip = (Number(page) - 1) * Number(limit);

  // const restaurants = await RestaurantSchema.find(
  //   {
  //     location: {
  //       $near: {
  //         $geometry: {
  //           type: "Point",
  //           coordinates: req.coords,
  //         },
  //         $maxDistance: 5000,
  //       },
  //     },
  //   },
  //   { items: 0, location: 0, createdAt: 0, updatedAt: 0, ownerId: 0 }
  // )
  //   .lean()
  //   .sort({ _id: -1 })
  //   .skip(skip)
  //   .limit(Number(limit));

  // res.status(201).json({ currentPage: page, restaurants });

  // Cursor method (performance)

  const query: any = {
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

  const restaurantFilters = filters as RestautantFilters;

  if (pageParam) query._id = { $lt: pageParam };

  if (restaurantFilters?.name) {
    const nameRegex = new RegExp(restaurantFilters.name, "i");
    query.name = { $regex: nameRegex };
  }
  if (restaurantFilters?.foodType?.length)
    query.cuisine = { $in: restaurantFilters.foodType };

  // TODO: restaurant type filters (calc required)

  const restaurants = await RestaurantSchema.find(query, {
    items: 0,
    location: 0,
    createdAt: 0,
    updatedAt: 0,
    ownerId: 0,
  })
    .sort({ _id: -1 })
    .limit(Number(limit));

  const lastRestaurant = restaurants.at(-1);

  res.status(200).json({
    restaurants,
    nextCursor: lastRestaurant ? lastRestaurant._id : null,
  });
});

export const getRestaurantByName = asyncHandler(async (req, res) => {
  const { restaurantName } = req.params;

  console.log(restaurantName);

  const restaurant = await RestaurantSchema.findOne(
    {
      name: { $regex: new RegExp(restaurantName, "i") },
    },
    {
      address: 1,
      name: 1,
      deliveryInfo: 1,
      imageUrl: 1,
      createdAt: 1,
      items: 1,
    }
  ).lean();

  const itemsTypes = restaurant?.items.map((item) => item.type) ?? [];

  let obj = null;

  if (restaurant)
    obj = {
      _id: restaurant._id,
      name: restaurant.name,
      imageUrl: restaurant.imageUrl,
      address: restaurant.address,
      deliveryInfo: restaurant.deliveryInfo,
      itemsTypes,
      createdAt: restaurant.createdAt,
    };

  return res.status(201).json(obj);
});

export const getRestaurantItems = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const { pageParam, limit, filters } = req.query;

  const itemsFilters = filters as RestaurantItemsFilters;

  let projection: any = {};

  if (itemsFilters?.name || itemsFilters?.itemsType?.length) {
    projection.items = { $elemMatch: {} };
  }

  if (itemsFilters?.name) {
    const nameRegex = new RegExp(itemsFilters.name, "i");
    projection.items.$elemMatch.name = { $regex: nameRegex };
  }
  if (itemsFilters?.itemsType?.length)
    projection.items.$elemMatch.type = { $in: itemsFilters.itemsType };

  console.log(projection);

  const restaurant = await RestaurantSchema.findById(
    restaurantId,
    projection
  ).limit(Number(limit));

  console.log(restaurant?.items);

  const lastItem = restaurant?.items?.at(-1);

  // TODO: add types to each restaurant items in db

  res.status(200).json({
    restaurantItems: restaurant?.items,
    nextCursor: lastItem ? lastItem._id : null,
  });
});

export const getMyRestaurant = asyncHandler(async (req, res) => {
  const { id: ownerId } = req.user!;

  const restaurant = await RestaurantSchema.findOne(
    { ownerId },
    { ownerId: 0 }
  ).lean();

  if (!restaurant)
    return res.status(404).json({ message: "Crea il tuo ristorante" });

  res.status(200).json(restaurant);
});

export const createRestaurant = asyncHandler(async (req, res) => {
  const { name, items } = req.body;

  if (!req.files)
    return res
      .status(400)
      .json({ message: "Immagini del ristorante e dei piatti obbligatoria" });

  const hasRestaurant = await RestaurantSchema.exists({
    ownerId: req.user!.id,
  }).lean();

  if (hasRestaurant)
    return res
      .status(400)
      .json({ message: "Sei gia' il titolare di un ristorante" });

  const nameExist = await RestaurantSchema.exists({ name }).lean();

  if (nameExist)
    return res.status(401).json({ message: "Questo ristorante esiste già" });

  // TODO: dal middleware per la verifica dell'address passa alla richiesta le coordinate
  // e checka se esiste gia un ristorante a quelle coordinate e aggiungi alla creaione dello schema

  const addressExist = await RestaurantSchema.exists({
    location: {
      coords: req.coords,
    },
  }).lean();

  if (addressExist)
    return res.status(403).json({
      message: `Esiste gia' un ristorante in questo indirizzo`,
    });

  const restaurantImg = req.files["restaurantImg"]?.at(0);
  const itemsImgs = req.files["itemsImg"];

  if (!restaurantImg || !itemsImgs?.length) {
    return res
      .status(400)
      .json({ message: "Immagini del ristorante e dei piatti obbligatoria" });
  }

  let restaurantImgUrl;
  try {
    const imgUrl = await uploadImg(restaurantImg, {
      transformation: [{ width: 260, height: 140, crop: "fill" }],
    });

    restaurantImgUrl = imgUrl;
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Errore nel caricamento dell'immagine del ristorante" });
  }

  const fullItems: Omit<DBOrderItem, "_id">[] = [];

  try {
    const itemPromises = items.map(
      async (item: Omit<DBOrderItem, "_id">, index: number) => {
        const itemImg = req.files!["itemsImg"].at(index);

        if (!itemImg) {
          throw new Error("Tutti gli item devono avere un'immagine");
        }

        const itemImgUrl = await uploadImg(itemImg);

        return { ...item, img: itemImgUrl };
      }
    );

    const uploadedItems = await Promise.all(itemPromises);
    fullItems.push(...uploadedItems);
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Errore nel caricamento delle immagini dei piatti" });
  }

  await RestaurantSchema.create({
    ...req.body,
    location: {
      type: "Point",
      coords: req.coords,
    },
    ownerId: req.user!.id,
    imageUrl: restaurantImgUrl,
    items: fullItems,
  });

  res.status(201).json({
    message: "Ristorante creato con successo!",
    restaurantImg: restaurantImgUrl,
  });
});

export const updateRestaurant = asyncHandler(async (req, res) => {
  const { name, items } = req.body;

  const nameExist = await RestaurantSchema.exists({ name }).lean();

  console.log(nameExist);

  if (nameExist) {
    res.status(403).json({ message: "Nome gia' utlizzato" });
    return;
  }

  const addressExist = await RestaurantSchema.exists({
    location: {
      coords: req.coords,
    },
  }).lean();

  if (addressExist)
    return res.status(403).json({
      message: `Esiste gia' un ristorante in questa via nella tua citta`,
    });

  const restaurantImg = req.files ? req.files["restaurantImg"] : undefined;

  let restaurantImgUrl = req.restaurant.imageUrl;

  if (restaurantImg) {
    try {
      console.log("creating new restaurantImg");
      const imgUrl = await uploadImg(restaurantImg[0]);

      restaurantImgUrl = imgUrl;
    } catch (error) {
      return res.status(500).json({
        message: "Errore nel caricamento dell'immagine del ristorante",
      });
    }
  }

  // Nel frontend passare tutti gli item, chi ha l'id e l'img attaccarli
  // al formData tutti e due (!IMPORTANTE) per evitare problemi con
  // l'update delle immagini degli item, ogni item anche se
  // l'utente non gli ha cambiato l'immagine, attaccare
  // al formdata ugualmente un file creato simile al file
  // cosi' da rispettare l'index di ogni item
  // (guardare bene cosa ritorna react hook form)

  const updatedItems: DBOrderItem[] = [];
  try {
    const itemPromises = items.map(async (item: DBOrderItem, index: number) => {
      const itemImg = req.files!["itemsImg"]?.at(index);

      if (!itemImg && !item.img) {
        throw new Error("Tutti gli item devono avere un'immagine");
      }

      if (!itemImg) return item;

      const itemImgUrl = await uploadImg(itemImg);

      return { ...item, img: itemImgUrl };
    });

    const uploadedItems = await Promise.all(itemPromises);
    updatedItems.push(...uploadedItems);
  } catch (err: any) {
    return res.status(400).json({
      message: err.message,
    });
  }

  const updatedRestaurant = await RestaurantSchema.findByIdAndUpdate(
    req.restaurant.id,
    {
      ...req.body,
      items: updatedItems,
      location: {
        coords: req.coords,
      },
      imageUrl: restaurantImgUrl,
    },
    { returnDocument: "after", projection: { items: 1 } }
  ).lean();

  if (!updatedRestaurant)
    throw new Error("Errore nell'aggiornamento del ristorante");

  return res.status(201).json({
    message: "Ristorante aggiornato con successo!",
    restaurant: {
      restaurantImg: restaurantImgUrl,
      items: updatedRestaurant.items,
    },
  });
});

export const getActiveOrders = asyncHandler(async (req, res) => {
  const restaurant = req.restaurant;

  const activeOrders = await OrderSchema.find({
    restaurantId: restaurant._id,
    status: { $ne: "Consegnato" },
  })
    .lean()
    .sort({ _id: -1 });

  const fullOrders = [];

  for (const order of activeOrders) {
    const customer = await UserSchema.findById(order.customerId, {
      name: 1,
      surname: 1,
    }).lean();

    if (!customer)
      return res
        .status(404)
        .json({ message: `L'utente che ha creato l'ordine non esiste piu` });

    const expectedTime = calcExpectedTime(
      order.createdAt,
      restaurant.deliveryInfo!.time
    );

    const fullInfo = {
      customerSurname: customer.surname,
      orderId: order._id.toString(),
      street: order.address,
      status: order.status,
      totalPrice: order.totalPrice,
      expectedTime,
    };

    fullOrders.push(fullInfo);
  }

  res.status(200).json(fullOrders);
});

export const getRestaurantOrders = asyncHandler(async (req, res) => {
  const { id: orderId, page, limit } = req.query;

  if (orderId) {
    const customer = await UserSchema.findById(req.order!.customerId, {
      name: 1,
      surname: 1,
    }).lean();

    if (!customer)
      return res
        .status(404)
        .json({ message: `L'utente che ha creato l'ordine non esiste piu` });

    const { id, address, status, totalPrice, createdAt } = req.order!;

    const restaurant = req.restaurant;

    if (!restaurant)
      return res
        .status(404)
        .json({ message: "Il tuo ristorante non esiste piu" });

    const items = getItems(req.order!.items, restaurant.items, "FULL");

    const expectedTime = calcExpectedTime(
      createdAt,
      restaurant.deliveryInfo!.time
    );

    const fullInfo: RestaurantOrder = {
      clientFullName: `${customer.name} ${customer.surname}`,
      orderId: id,
      address,
      status,
      totalPrice,
      expectedTime,
      items,
    };

    return res.status(200).json(fullInfo);
  }

  // All orders

  const restaurant = req.restaurant;

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await OrderSchema.find({ restaurantId: restaurant._id })
    .lean()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(Number(limit));

  const fullOrders: RestaurantOrder[] = [];

  for (const order of orders) {
    const customer = await UserSchema.findById(order.customerId, {
      name: 1,
      surname: 1,
    }).lean();

    if (!customer)
      return res
        .status(404)
        .json({ message: `L'utente che ha creato l'ordine non esiste piu` });

    if (!restaurant)
      return res
        .status(404)
        .json({ message: "Il tuo ristorante non esiste piu" });

    const items = getItems(order.items, restaurant.items, "NAME_QUANTITY");

    const expectedTime = calcExpectedTime(
      order.createdAt,
      restaurant.deliveryInfo!.time
    );

    const fullInfo: RestaurantOrder = {
      clientFullName: `${customer.name} ${customer.surname}`,
      orderId: order._id.toString(),
      address: order.address,
      status: order.status,
      totalPrice: order.totalPrice,
      expectedTime,
      items,
    };

    fullOrders.push(fullInfo);
  }

  res.status(200).json(fullOrders);
});

export const updateOrder = asyncHandler(async (req, res) => {
  if (!req.order) return res.status(404).json({ message: "order ID missing" });
  const { status } = req.body;

  if (!status) return res.status(404).json({ message: "Order status missing" });

  await req.order.updateOne({ status });

  res.status(200).json({ message: `L'ordine e' ora nello stato di ${status}` });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  if (!req.order) return res.status(404).json({ message: "order ID missing" });

  await req.order.deleteOne();

  res.status(200).json({ message: "Ordine cancellato con successo!" });
});
