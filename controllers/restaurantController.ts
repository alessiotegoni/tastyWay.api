import asyncHandler from "express-async-handler";
import { OrderSchema, RestaurantSchema, UserSchema } from "../models";
import { calcExpectedTime, getItems, uploadImg } from "../lib/utils";
import {
  DBOrderItem,
  RestaurantDocument,
  RestaurantFilters,
  RestaurantItemsFilters,
  RestaurantOrder,
  RestaurantOrdersFilters,
} from "../types";
import mongoose, { isValidObjectId } from "mongoose";

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

  const restaurantFilters = filters as RestaurantFilters;

  const baseQuery: mongoose.PipelineStage[] = [
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: req.coords!,
        },
        distanceField: "distance",
        maxDistance: 5000,
        spherical: true,
      },
    },
    {
      $sort: { _id: -1 },
    },
    {
      $match: {
        "deliveryInfo.time": { $gt: 0 },
        $expr: {
          $and: [
            { $gt: [{ $strLenCP: "$name" }, 3] },
            { $gt: [{ $strLenCP: "$imageUrl" }, 0] },
            { $gt: [{ $size: "$cuisine" }, 0] },
            { $gt: [{ $size: "$items" }, 1] },
          ],
        },
      },
    },
  ];

  if (restaurantFilters?.name) {
    const nameRegex = new RegExp(restaurantFilters.name, "i");
    baseQuery.push({
      $match: {
        name: { $regex: nameRegex },
      },
    });
  }

  if (restaurantFilters?.foodType?.length) {
    baseQuery.push({
      $match: {
        cuisine: { $in: restaurantFilters.foodType },
      },
    });
  }

  const typeFilter = restaurantFilters?.restaurantType?.at(0);
  if (typeFilter) {
    const avgItemPriceField = {
      $addFields: {
        avgItemPrice: { $avg: "$items.price" },
      },
    };

    const typeFiltersObj: { [key: string]: mongoose.PipelineStage[] } = {
      cheap: [
        avgItemPriceField,
        {
          $sort: {
            avgItemPrice: 1,
          },
        },
      ],
      expensive: [
        avgItemPriceField,
        {
          $sort: {
            avgItemPrice: -1,
          },
        },
      ],
      fast_delivery: [
        {
          $sort: {
            "deliveryInfo.time": 1,
          },
        },
      ],
      // $lookup permette di unire i dati dai documenti di altre collection
      // alla collection della query
      trending: [
        {
          $lookup: {
            from: "orders", // nome della collezione ordini
            localField: "_id", // campo del ristorante da usare per la join
            foreignField: "restaurantId", // campo nella collezione ordini che corrisponde a `localField`
            as: "orders", // nome dell'array risultato della join
          },
        },
        {
          $addFields: {
            orderCount: { $size: "$orders" },
          },
        },
        {
          $sort: { orderCount: -1 },
        },
      ],
    };

    baseQuery.push(...typeFiltersObj[typeFilter]);
  }

  if (pageParam) {
    baseQuery.push({
      $match: {
        _id: { $lt: new mongoose.Types.ObjectId(pageParam as string) },
      },
    });
  }

  baseQuery.push({
    $project: {
      name: 1,
      imageUrl: 1,
      address: 1,
      deliveryInfo: 1,
      cuisine: 1,
    },
  });

  const restaurants = await RestaurantSchema.aggregate(baseQuery).limit(
    Number(limit)
  );

  const lastRestaurant = restaurants.at(-1);

  res.status(200).json({
    restaurants,
    nextCursor: lastRestaurant ? lastRestaurant._id : null,
  });
});

export const getRestaurantByName = asyncHandler(async (req, res) => {
  const { restaurantName } = req.params;

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

  res.status(200).json(
    restaurant
      ? {
          _id: restaurant._id,
          name: restaurant.name,
          imageUrl: restaurant.imageUrl,
          address: restaurant.address,
          deliveryInfo: restaurant.deliveryInfo,
          itemsTypes: restaurant.items
            .filter(
              (item, _, arr) => arr.indexOf(item) === arr.lastIndexOf(item)
            )
            .map((i) => i.type),
          createdAt: restaurant.createdAt,
        }
      : null
  );
});

export const getRestaurantItems = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const { filters } = req.query;

  const itemsFilters = filters as RestaurantItemsFilters;

  const itemConditions: any[] = [];

  if (itemsFilters?.name) {
    itemConditions.push({
      $regexMatch: {
        input: "$$item.name",
        regex: itemsFilters.name,
        options: "i",
      },
    });
  }

  if (itemsFilters?.itemsTypes && itemsFilters?.itemsTypes?.length) {
    itemConditions.push({ $in: ["$$item.type", itemsFilters.itemsTypes] });
  }

  const itemFilterCondition = itemConditions.length
    ? { $and: itemConditions }
    : true;

  const [restaurant] = await RestaurantSchema.aggregate<RestaurantDocument>([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(restaurantId),
      },
    },
    {
      $project: {
        items: {
          $filter: {
            input: "$items",
            as: "item",
            cond: itemFilterCondition,
          },
        },
      },
    },
  ]);

  res.status(200).json(restaurant.items ?? []);
});

export const getMyRestaurant = asyncHandler(async (req, res) => {
  const { id: ownerId } = req.user!;

  const restaurant = await RestaurantSchema.findOne(
    { ownerId },
    { ownerId: 0, createdAt: 0, updatedAt: 0, imageUrl: 0, location: 0, _id: 0 }
  ).lean();

  if (!restaurant) {
    res.status(404).json({ message: "Crea il tuo ristorante" });
    return;
  }

  res.status(200).json(restaurant);
});

export const createRestaurant = asyncHandler(async (req, res) => {
  const { id: _id, address } = req.user!;

  const hasRestaurant = await RestaurantSchema.exists({ _id });

  if (hasRestaurant) {
    res.status(401).json({ message: "Hai gia un ristorante" });
    return;
  }

  if (!address) {
    res.status(404).json({
      message: "Prima di creare il ristorante devi aggiornare il tuo indirizzo",
    });
    return;
  }

  await RestaurantSchema.create({
    ownerId: req.user!.id,
    location: {
      type: "Point",
      coordinates: [0, 0],
    },
    deliveryInfo: {
      price: 0,
      time: 0,
    },
    cuisine: [],
    items: [],
  });

  res.status(201).json({
    message: "Ristorante creato con successo",
  });
});

export const updateRestaurant = asyncHandler(async (req, res) => {
  const { name, items } = req.body;

  const nameExist = await RestaurantSchema.exists({
    name,
    _id: { $ne: req.restaurant._id },
  }).lean();

  if (nameExist) {
    res.status(403).json({ message: "Nome gia' utlizzato" });
    return;
  }

  const addressExist = await RestaurantSchema.exists({
    _id: { $ne: req.restaurant._id },
    location: {
      coords: req.coords,
    },
  }).lean();

  if (addressExist) {
    res.status(403).json({
      message: `Esiste gia' un ristorante in questa via nella tua citta`,
    });
    return;
  }

  if (!req.restaurant.imageUrl) {
    res.status(404).json({ message: "Immagine del ristorante obbligatoria" });
    return;
  }

  const updatedItems: DBOrderItem[] = [];
  try {
    const itemPromises = items.map(async (item: DBOrderItem, index: number) => {
      const itemImg = req.files?.find(
        (file) => file.fieldname === `items[${index}][img]`
      );

      item.name = `${item.name[0].toUpperCase()}${item.name.slice(1)}`;
      item.description = `${item.description[0].toUpperCase()}${item.description.slice(
        1
      )}`;

      if (!itemImg && !item.img)
        throw new Error("Tutti gli item devono avere un'immagine");

      if (!itemImg) return item;

      const itemImgUrl = await uploadImg(itemImg, {
        transformation: {
          width: 800,
          height: 800,
          crop: "fill",
          dpr: "auto",
          quality: "auto",
          format: "auto",
          aspect_ratio: "1:1",
        },
      });

      return {
        ...item,
        img: itemImgUrl,
      };
    });

    const uploadedItems = await Promise.all(itemPromises);
    updatedItems.push(...uploadedItems);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
    return;
  }

  await req.restaurant
    .updateOne({
      ...req.body,
      items: updatedItems,
      location: {
        type: "Point",
        coordinates: req.coords,
      },
    })
    .lean();

  res.status(201).json({
    message: "Ristorante aggiornato con successo!",
  });
});

export const updateRestaurantImg = asyncHandler(async (req, res) => {
  const restaurantImg = req.file;

  let restaurantImgUrl = req.restaurant.imageUrl;

  if (restaurantImg) {
    try {
      const imgUrl = await uploadImg(restaurantImg, {
        transformation: {
          width: 800,
          height: 800,
          crop: "fill",
          dpr: "auto",
          quality: "auto",
          format: "auto",
          aspect_ratio: "4:3",
        },
      });

      restaurantImgUrl = imgUrl;
      await req.restaurant.updateOne({ imageUrl: restaurantImgUrl });
    } catch (error) {
      res.status(500).json({
        message: "Errore nel caricamento dell'immagine del ristorante",
      });
      return;
    }
  }

  res.json({
    message: "Immagine aggiornata con successo",
    imageUrl: restaurantImgUrl,
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

  const ordersPromises = activeOrders.map(async (order) => {
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
      address: order.address,
      status: order.status,
      totalPrice: order.totalPrice,
      expectedTime,
    };

    return fullInfo;
  });

  const fullOrders = await Promise.all(ordersPromises);

  res.status(200).json({ orders: fullOrders, type: "RESTAURANT_ORDERS" });
});

export const getRestaurantOrders = asyncHandler(async (req, res) => {
  const { pageParam, limit, filters } = req.query;

  const restaurant = req.restaurant;

  // const skip = (Number(page) - 1) * Number(limit);

  const query: any = { restaurantId: restaurant._id };

  if (pageParam) query._id = { $lt: pageParam };

  const restaurantOrderFilter = (filters as RestaurantOrdersFilters) ?? {};

  const { statusTypes, orderInfo } = restaurantOrderFilter;

  if (statusTypes?.length)
    query.status = { $in: restaurantOrderFilter.statusTypes };

  const foundOrders: any[] = await OrderSchema.find(query)
    .lean()
    .sort({ _id: -1 })
    .limit(Number(limit));

  const ordersPromises = foundOrders.map(async (order) => {
    const customer = await UserSchema.findById(order.customerId, {
      name: 1,
      surname: 1,
    });

    if (!customer) return;

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

    return fullInfo;
  });

  let fullOrders = await Promise.all(ordersPromises);

  if (orderInfo) {
    fullOrders = fullOrders.filter(
      (o) =>
        o?.clientFullName.toLowerCase().includes(orderInfo.toLowerCase()) ||
        o?.address.toLowerCase().includes(orderInfo.toLowerCase())
    );
  }

  const lastOrder = fullOrders.at(-1);
  const nextCursor = lastOrder ? lastOrder.orderId : null;

  res.status(200).json({ orders: fullOrders, nextCursor });
});

export const getRestaurantOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!orderId || !isValidObjectId(orderId)) {
    res.status(400).json({ message: "Id dell'ordine non presente o invalido" });
    return;
  }

  const customer = await UserSchema.findById(req.order!.customerId, {
    name: 1,
    surname: 1,
  }).lean();

  if (!customer) {
    res
      .status(404)
      .json({ message: `L'utente che ha creato l'ordine non esiste piu` });
    return;
  }

  const { id, address, status, totalPrice, createdAt } = req.order!;

  const restaurant = req.restaurant;

  if (!restaurant) {
    res.status(404).json({ message: "Il tuo ristorante non esiste piu" });
    return;
  }

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

  res.status(200).json(fullInfo);
});

export const updateOrder = asyncHandler(async (req, res) => {
  if (!req.order) {
    res.status(404).json({ message: "order ID missing" });
    return;
  }

  const { status } = req.body;

  if (!status) {
    res.status(404).json({ message: "Order status missing" });
    return;
  }

  await req.order.updateOne({ status });

  res.status(200).json({ message: `L'ordine e' ora nello stato di ${status}` });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  if (!req.order) {
    res.status(404).json({ message: "order ID missing" });
    return;
  }

  await req.order.deleteOne();

  res.status(200).json({ message: "Ordine cancellato con successo!" });
});
