import { Address, Mail } from "mailtrap";
import { mailtrapClient, sender } from "../../config/mailtrap";
import { VERIFICATION_EMAIL_TEMPLATE } from "./emailsTemplates";

export const sendEmail = async (emailInfo: any) =>
  await mailtrapClient.send({
    from: sender,
    ...emailInfo,
  });

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
) =>
  await sendEmail({
    to: [{ email, name }],
    subject: "Verifica la tua email",
    html: VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationCode}",
      token
    ).replace("{username}", name),
    category: "verify_email",
  });

export const sendWelcomeEmail = async (email: string, name: string) =>
  await sendEmail({
    to: [{ email, name }],
    template_uuid: "061d93b9-0312-4f27-b612-0e4004a082a4",
    template_variables: {
      username: name,
    },
  });

export const sendPasswordResetEmail = async (email: string, name: string, resetToken: string) =>
  await sendEmail({
    to: [{ email, name }],
    template_uuid: "28400a42-5683-4750-9dd7-0c5a3bbf5021",
    template_variables: {
      username: name,
      resetLink: `${process.env.CLIENT_URL}/reset-password/${resetToken}`,
    },
  });
