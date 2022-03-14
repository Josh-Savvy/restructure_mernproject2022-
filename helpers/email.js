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
exports.newLinkPublishedParams = (email, data) => {
  return {
    from: "MERN PROJECT",
    to: `${email}`,
    subject: `New Link Published!`,
    html: `<h2>A new link in your favorite category has been published! - <b>${
      data.title
    }</b></h2> 
  <p>The new links were published in the following categories: ${data.categories
    .map((c) => {
      return `
        <div>
          <h3>${c.title}</h3>
          <h4><a href="${process.env.CLIENT_URL}/links/${c.slug}">Check it out!</a></h4>
        </div>
      `;
    })
    .join(`<br/> ----------------------------------`)}
    
    <p>To turn off notifications on new links published in your category, kindly go to your <b>dashboard</b> > <b>update profile</b> and 
        uncheck the categories.</p>
  `,
  };
};
