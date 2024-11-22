export type UserAccessToken = {
  id: string;
  email: string;
  restaurantName?: string;
  imageUrl?: string;
  name: string;
  surname: string;
  address: string;
  isCmpAccount: boolean;
  isGoogleLogged: boolean;
  emailVerified: boolean;
  createdAt: NativeDate;
};

export type UserRefreshToken = {
  id: string;
  email: string;
};

export interface GoogleUserData {
  aud: string;
  azp: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name: string;
  given_name: string;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  nbf: number;
  picture: string;
  sub: string;
}
