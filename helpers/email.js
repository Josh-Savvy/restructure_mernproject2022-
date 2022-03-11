exports.registerEmailParams = (email, token) => {
  return {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [email],
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `<html>
              <h1>Email Verification</h1>
                <p>Follow this link to complete your registration:</p>
                <a href="${process.env.CLIENT_URL}/auth/activate/${token}">Link</a>
              </html>`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Complete your registration",
      },
    },
  };
};

exports.forgotPasswordEmailParams = (email, token) => {
  return {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [email],
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8", 
          Data: `<html>
              <h1> Password reset confirmation </h1>
                <p>Follow this <a href="${process.env.CLIENT_URL}/auth/password/reset/${token}" style="text-decoration:underline #000 dotted">link</a> to reset your password:</p>
                
              </html>`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Reset Password",
      },
    },
  };
};
