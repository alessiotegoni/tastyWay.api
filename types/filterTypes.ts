export enum FoodType {
  PIZZA = "pizza",
  SUSHI = "sushi",
  BURGER = "burger",
  DESSERT = "dessert",
  ITALIAN = "italian",
  CHINESE = "chinese",
  MEXICAN = "mexican",
  INDIAN = "indian",
  MEDITERRANEAN = "mediterranean",
  VEGETARIAN = "vegetarian",
  VEGAN = "vegan",
  FAST_FOOD = "fast_food",
  SEAFOOD = "seafood",
  BBQ = "bbq",
  HEALTHY = "healthy",
  STEAKHOUSE = "steakhouse",
  BREAKFAST = "breakfast",
  BAKERY = "bakery",
  THAI = "thai",
}

export enum RestaurantType {
  CHEAP = "cheap",
  EXPENSIVE = "expensive",
  TOP_RATED = "top_rated",
  FAST_DELIVERY = "fast_delivery",
  NEW = "new",
  TRENDING = "trending",
}

export type RestaurantFilters = {
  name: string | null;
  foodType: FoodType[] | null;
  restaurantType: `${RestaurantType}`[] | null; // tranforma gli enum in union type di stringhe
};

export enum RestaurantItemsTypes {
  PIZZA = "pizza",
  BURGER = "burger",
  PASTA = "pasta",
  SALAD = "salad",
  SANDWICH = "sandwich",
  FLATBREAD = "flatbread",
  FRIED_FOOD = "fried_food",
  SUSHI = "sushi",
  APPETIZERS = "appetizers",
  DESSERTS = "desserts",
  DRINKS = "drinks",
  BBQ = "bbq",
  SEAFOOD = "seafood",
  MEAT = "meat",
  SOUP = "soup",
  VEGAN = "vegan",
  VEGETARIAN = "vegetarian",
  GLUTEN_FREE = "gluten_free",
  FRUIT = "fruit",
  TAPAS = "tapas",
  SANDWICHES = "sandwiches",
  RICE = "rice",
  POKE = "poke",
  MAIN_COURSE = "main_course",
}

export type RestaurantItemsFilters = {
  name: string | null;
  itemsTypes: RestaurantItemsTypes[] | null;
};

export type OrderStatus =
  | "In attesa"
  | "Accettato"
  | "In preparazione"
  | "In consegna"
  | "Consegnato";

export type RestaurantOrdersFilters = {
  statusTypes: OrderStatus[];
  orderInfo: string;
};
