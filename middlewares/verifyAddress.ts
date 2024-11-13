import axios from "axios";
import asyncHandler from "express-async-handler";
import { Client } from "@googlemaps/google-maps-services-js";

export const verifyAddress = asyncHandler(async (req, res, next) => {
  const address = req.body.address || req.query.address;

  if (!address) {
    res.status(403).json({
      message: "Missing address",
    });
    return;
  }

  const googleMapsClient = new Client({});

  const data = (
    await googleMapsClient.geocode({
      params: {
        address,
        components: "country:IT",
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    })
  ).data.results.at(0);

  if (!data) {
    res.status(403).json({
      message: "Indirizzo non valido",
    });
    return;
  }

  const isItalianAddress = data.address_components.some(
    (component) =>
      component.short_name === "IT" || component.long_name === "Italia"
  );

  if (!isItalianAddress) {
    res
      .status(403)
      .json({ message: "L'indirizzo deve essere situato in Italia." });
    return;
  }

  const lng = data.geometry.location.lng; // asse x
  const lat = data.geometry.location.lat; // asse y

  if (!lat || !lng) {
    res.status(403).json({
      message: "Indirizzo non valido",
    });
    return;
  }

  req.coords = [lng, lat];

  next();
});
