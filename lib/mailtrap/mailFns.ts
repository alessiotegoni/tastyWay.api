import { Address, Mail } from "mailtrap";
import { mailtrapClient, sender } from "../../config/mailtrap";
import { SingleOrderItem } from "types/orderTypes";

export const sendEmail = async (emailInfo: any) =>
  await mailtrapClient.send({
    from: sender,
    ...emailInfo,
  });

export const sendEmailVerification = async (
  email: string,
  name: string,
  verificationCode: string
) =>
  await sendEmail({
    to: [{ email, name }],
    template_uuid: "43b529a9-a995-4f89-b335-3cba87fe99e2",
    template_variables: {
      username: name,
      email,
      verificationCode,
    },
  });

export const sendWelcomeEmail = async (email: string, name: string) =>
  await sendEmail({
    to: [{ email, name }],
    template_uuid: "061d93b9-0312-4f27-b612-0e4004a082a4",
    template_variables: {
      username: name,
    },
  });

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetLink: string
) =>
  await sendEmail({
    to: [{ email, name }],
    template_uuid: "28400a42-5683-4750-9dd7-0c5a3bbf5021",
    template_variables: {
      username: name,
      resetLink,
    },
  });

export const sendPasswordResetSuccessfullyEmail = async (
  email: string,
  name: string
) =>
  await sendEmail({
    to: [{ email, name }],
    template_uuid: "59103f33-1c10-4b45-b645-484613a804a7",
    template_variables: {
      username: name,
    },
  });

export const sendOrderRecapEmail = async (
  email: string,
  name: string,
  items: SingleOrderItem[],
  totalPrice: string,
  deliveryAddress: string
) => {
  const itemsList = items
    .map(
      (item) => `
      <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; border-bottom: 1px solid #eee;">
        <img
          src="${item.img}"
          alt="${item.name}"
          style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;"
        />
        <div style="flex: 1;">
          <p style="margin: 0; font-weight: bold; font-size: 16px;">${
            item.name
          }</p>
          <p style="margin: 5px 0 0; color: #666;">Quantità: ${
            item.quantity
          }</p>
          <p style="margin: 5px 0 0; color: #666;">Prezzo: €${item.price.toFixed(
            2
          )}</p>
        </div>
      </div>
    `
    )
    .join("");
    
  return sendEmail({
    to: [{ email, name }],
    template_uuid: "d6cedc42-0eb6-4bed-b1e7-d154f822f2b2",
    template_variables: {
      username: name,
      email,
      itemsList,
      totalPrice,
      deliveryAddress,
    },
  });
};
