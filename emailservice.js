import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("SMTP_USER:", process.env.SMTP_USER ? "OK" : "MISSING");
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "OK" : "MISSING");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendResetEmail = async (email, token) => {
    console.log("ENV CHECK", {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? "exists" : "missing"

  });
  console.log("SMTP TEST:", process.env.SMTP_USER);
  const resetLink = `https://budgeting-app-production-c792.up.railway.app/reset-password?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"Budget App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
      `,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", info.messageId);
    console.log("RESET LINK:", resetLink);

  } catch (err) {
    console.log("❌ EMAIL FAILED:");
    console.log(err);
  }
};
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export const sendResetEmail = async (email, token) => {
//      //const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
//   const resetLink = `https://budgeting-app-production-c792.up.railway.app/reset-password?token=${token}`;

//   try {
//     await transporter.sendMail({
//       from: `"Your App" <${process.env.SMTP_USER}>`,
//       to: email,
//       subject: "Password Reset",
//       html: `
//         <h2>Password Reset</h2>
//         <p>Click the link below to reset your password:</p>
//         <a href="${resetLink}">Reset Password</a>
//       `,
//     });

//       console.log("Reset email sent:", resetLink);
//       console.log("EMAIL SENT:", info.response);
//     console.log("RESET LINK:", resetLink);

//   } catch (err) {
//     console.log("❌ EMAIL ERROR:", err);
//   }
// };

    //console.log("EMAIL SENT SUCCESSFULLY");

 // } catch (err) {
    //console.log("EMAIL ERROR:", err);
  //}
//};
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export const sendResetEmail = async (to, token) => {
//   const resetLink = `http://localhost:3000/reset-password?token=${token}`;

//   await transporter.sendMail({
//     from: `"Your App" <${process.env.SMTP_USER}>`,
//     to: to,
//     subject: "Password Reset",
//     html: `
//       <h2>Password Reset</h2>
//       <p>Click the link below:</p>
//       <a href="${resetLink}">${resetLink}</a>
//     `,
//   });
//   try {
//   await sendResetEmail(email, token);
//   console.log("Email sent");
// } catch (err) {
//   console.log("EMAIL ERROR:", err);
// }
// };