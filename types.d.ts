import {
  UserDocument,
  RestaurantDocument,
  OrderDocument,
} from "./types/documentTypes";

// export interface UserRequest extends Request {
//   user: UserDocument;
// }

// export interface RestaurantRequest extends Request {
//   restaurant: RestaurantDocument;
// }

// export interface OrderRequest extends Request {
//   order: RestaurantDocument;
// }

// export interface FilesRequest extends Request {
//   files: Express.Multer.File[];
// }

// export interface CoordsRequest extends Request {
//   coords: [number, number];
// }

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      restaurant?: RestaurantDocument;
      order?: OrderDocument;
      files?: Multer.File[];
      coords?: [number, number];
    }
  }
}

// Tutti gli ordini

// declare global {}: Questa dichiarazione indica che stai modificando le dichiarazioni globali in TypeScript, il che significa che stai aggiungendo o modificando qualcosa che dovrebbe essere disponibile in tutto il progetto. In questo caso, stai aggiungendo una nuova proprietà alla classe Request di Express, che rappresenta ogni richiesta HTTP che arriva al server.

// namespace Express {}: namespace è una parola chiave TypeScript che permette di organizzare i tipi sotto un nome comune. Qui stai specificando il namespace di Express, che contiene tutti i tipi correlati a questa libreria. Estendendo Express, stai dicendo a TypeScript di aggiungere nuove informazioni al namespace già esistente.

// interface Request {}: Stai modificando l'interfaccia Request di Express, che rappresenta l'oggetto req che ricevi nei middleware o nei gestori delle rotte. Stai aggiungendo una nuova proprietà chiamata user, che potrebbe non essere presente (? indica che è opzionale).
