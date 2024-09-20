import axios from "axios";
import asyncHandler from "express-async-handler";

export const verifyAddress = asyncHandler(async (req, res, next) => {
  const address = req.body.address || req.query.address;

  const { data } = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json`,
    {
      params: {
        address,
        components: "country:IT",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    }
  );

  const results = data?.results?.at(0);

  if (!results)
    return res.status(403).json({
      message: "Indirizzo non valido",
    });

  const isItalianAddress = results.address_components.some(
    (component: google.maps.GeocoderAddressComponent) =>
      component.short_name === "IT" || component.long_name === "Italia"
  );

  if (!isItalianAddress)
    return res
      .status(403)
      .json({ message: "L'indirizzo deve essere situato in Italia." });

  const lng = results.geometry.location.lng as number; // asse x
  const lat = results.geometry.location.lat as number; // asse y

  console.log(lat, lng);

  if (!lat || !lng)
    return res.status(403).json({
      message: "Indirizzo non valido",
    });

  req.coords = [lng, lat];

  next();
});
