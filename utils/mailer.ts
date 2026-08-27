import { success } from "astro:schema";
import nodemailer from "nodemailer";


// Trnasporte de gmail
const transporter = nodemailer.createTransport({
service: "gmail",
auth: {
    user: import.meta.env.GMAIL_USER,
    pass: import.meta.env.GMAIL_PASS,
}
});

interface EmailItem {
    name: string, 
    quantity: number,
    price: number
}


export async function sendBookingConfirmation(
    email: string,
    name: string,
    total: number,
    items: EmailItem[]
) {
  try {
    const productsHTML = items.map((item) => 
      `
      <li style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e4e4e7;">
        <span style="font-size: 16px;"><strong>${item.quantity}x ${item.name}</strong></span><br>
        <span style="color: #52525b; font-size: 14px;">Subtotal: ${(item.price * item.quantity).toFixed(2)} €</span>
      </li>
      `
    ).join ();

    const info = await transporter.sendMail({
      from: `"Saudade Tienda" <${import.meta.env.GMAIL_USER}>`,
      to: email,
      subject: "Reserva confirmada - Saudade",
      html: `
        <div style="font-family: sans-serif; color: #18181b; max-width: 500px; margin: auto;">
          <h2>¡Hola, ${name}!</h2>
          <p>Hemos recibido tu solicitud de reserva correctamente.</p>
          
          <div style="background-color: #fafafa; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <h3 style="margin-top: 0;">Detalles de tu reserva:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${productsHTML}
            </ul>
            <p style="font-size: 18px; margin-bottom: 0; text-align: right;">
              Total estimado: <strong>${total.toFixed(2)} €</strong>
            </p>
          </div>
          
          <p>Recuerda que el pedido deberá <b>recogerse y pagarse físicamente en la tienda.</b></p>
          <br>
          <p>Si le gustó nuestro servicio recuerde ponernos una valoración positiva:</p>
          <a href="https://maps.app.goo.gl/KXUeqtmKWqYLAbc16">Valorar </a>
          <br>
          <p>Gracias por confiar en nosotros.</p>
        </div>
            `,
    });
    console.log("Correo enviado: ", info.messageId);
    return { success: true };
  } catch (e: any) {
    console.error("Error al enviar el corre:", e);
    return { success: false };
  }
}
