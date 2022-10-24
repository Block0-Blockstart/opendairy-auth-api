const express = require('express');
const { signup, login, confirmSignup, refreshSession } = require('./auth.service');

/**
 * Documentation:
 *
 * https://github.com/cnikolov/aws-cognito-http/blob/main/index.js
 * https://github.com/ja-klaudiusz/Nuxt.js-SSR-AWS-Cognito/blob/master/server/index.js
 * https://docs.nestjs.com/techniques/cookies#cookies
 * https://github.com/jacobdo2/nestjs-cognito-example
 * https://github.com/aws-amplify/amplify-js/blob/main/packages/amazon-cognito-identity-js/src/CognitoUser.js#L1440
 * https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_ConfirmSignUp.html
 * to go further, especially on CSRF security :
 * https://medium.com/@ryanchenkie_40935/react-authentication-how-to-store-jwt-in-a-cookie-346519310e81
 *
 */

/**
interface CookieOptions {
    maxAge?: number | undefined;
    signed?: boolean | undefined;
    expires?: Date | undefined;
    httpOnly?: boolean | undefined;
    path?: string | undefined;
    domain?: string | undefined;
    secure?: boolean | undefined;
    encode?: ((val: string) => string) | undefined;
    sameSite?: boolean | 'lax' | 'strict' | 'none' | undefined;
}
*/
const cookieBaseOpts = {
  httpOnly: true, //forbids the client from reading the cookie’s contents
  secure: true, //any request containing a cookie must be made with the HTTP over TLS (SSL)
  /* Strict: cookie can be sent only from the origin that issued that cookie.
   * Lax: allows sending the cookie when the user navigates to the origin where the cookie was issued
   * from a different origin.
   * However, the cookie still cannot be sent on cross-site requests (i.e., load an image or video).
   * None: allows sending the cookie in all contexts including cross-site requests.
   */
  sameSite: 'strict',
  path: '/',
  /* domain can be the base domain to maximize compatibility. Here I try with the aws api gateway execution domain
   * this domain is not in public suffix list. All sites listed in public suffix list are considered as pure suffix,
   * meaning that their subdomains are third party to each other.
   * for example, s3-website.eu-central-1.amazonaws.com is a public suffix
   * (see https://publicsuffix.org/list/public_suffix_list.dat)
   * So, abcd.s3-website.eu-central-1.amazonaws.com is third party with xyz.s3-website.eu-central-1.amazonaws.com
   */
  domain: process.env.COOKIE_DOMAIN,
};

const authController = express.Router();

const oneMonthMs = 1000 * 60 * 60 * 24 * 30;

authController.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'missing email or password' });
  }

  try {
    res.status(200).json(await signup({ email, password }));
  } catch (e) {
    res.status(400).json({ message: e });
  }
});

authController.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'missing email or password' });
  }

  try {
    const awsAuthResult = await login({ email, password });
    const expirationTime = new Date(awsAuthResult.getAccessToken().payload.exp * 1000);

    const auth = {
      jwt: awsAuthResult.getAccessToken().getJwtToken(),
      jwt_expired: expirationTime,
      email: awsAuthResult.getIdToken().payload.email,
    };

    res
      .cookie('token', awsAuthResult.getRefreshToken().getToken(), {
        ...cookieBaseOpts,
        expires: new Date(awsAuthResult.getAccessToken().payload.auth_time * 1000 + oneMonthMs),
      })
      .status(200)
      .json(auth);
  } catch (e) {
    res.status(400).json({ message: e });
  }
});

authController.post('/logout', async (_req, res) => {
  res
    .cookie('token', '', {
      ...cookieBaseOpts,
      expires: new Date(Date.now()),
    })
    .json({ message: 'Success' });
});

/* eslint-disable max-len */
/**
 * This uses the refreshToken from the cookie to retrieve a new access token,
 * see https://github.com/aws-amplify/amplify-js/blob/dfe6461aab6e26cdb259358b9399c48f03c44a8e/packages/amazon-cognito-identity-js/src/CognitoUser.js#L1440
 */
/* eslint-enable max-len */
authController.get('/refresh-session', async (req, res) => {
  if (!req.cookies || !req.cookies.token) {
    return res.status(401).json({ message: 'No token supplied' });
  }

  try {
    const awsAuthResult = await refreshSession(req.cookies.token);

    const expirationTime = new Date(awsAuthResult.getAccessToken().payload.exp * 1000);

    const auth = {
      jwt: awsAuthResult.getAccessToken().getJwtToken(),
      jwt_expired: expirationTime,
      email: awsAuthResult.getIdToken().payload.email,
    };

    console.log(awsAuthResult.getRefreshToken().getToken());

    res
      .cookie('token', awsAuthResult.getRefreshToken().getToken(), {
        ...cookieBaseOpts,
        expires: new Date(awsAuthResult.getAccessToken().payload.auth_time * 1000 + oneMonthMs),
      })
      .status(200)
      .json(auth);
  } catch (e) {
    res.status(401).json({ message: e });
  }
});

authController.post('/confirm', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'missing email or code' });
  }

  try {
    await confirmSignup({ email, code });
    res.status(200).json({ message: 'Success' });
  } catch (e) {
    res.status(400).json({ message: e });
  }
});

module.exports = authController;
