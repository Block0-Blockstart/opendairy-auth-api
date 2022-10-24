const {
  AuthenticationDetails,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} = require('amazon-cognito-identity-js');

const extractError = err => {
  try {
    //case 1 : err is an object. Check message prop if possible
    return err.message || 'Unknown error';
  } catch (_e) {
    //case 2 : err was not an object. Return it as string if possible
    return err || 'Unknown error';
  }
};

// create a userpool singleton
const createCognitoUserPool = () => {
  let cup;
  if (!cup) {
    console.log('Creating Cognito User Pool Instance');
    cup = new CognitoUserPool({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      ClientId: process.env.COGNITO_CLIENT_ID,
    });
  }
  return () => cup;
};

// get the singleton
const getCognitoUserPool = createCognitoUserPool();

/**
 *
 * @param {{ email:string, password:string }}
 * @returns {Promise<CognitoUser>}
 */
const signup = ({ email, password }) => {
  const attributeList = [new CognitoUserAttribute({ Name: 'email', Value: email })];

  return new Promise((resolve, reject) => {
    getCognitoUserPool().signUp(email, password, attributeList, null, (err, result) => {
      if (err) reject(extractError(err));
      else resolve(result.user);
    });
  });
};

/**
 *
 * @param {{ email:string, password:string }}
 * @returns {Promise<CognitoUserSession>}
 */
const login = ({ email, password }) => {
  const authenticationDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: getCognitoUserPool(),
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: result => resolve(result),
      onFailure: err => reject(extractError(err)),
    });
  });
};

/**
 *
 * @param {string} refreshToken
 * @returns {Promise<CognitoUserSession>}
 */
const refreshSession = refreshToken => {
  const cognitoRefreshToken = new CognitoRefreshToken({
    RefreshToken: refreshToken,
  });

  const cognitoUser = new CognitoUser({
    Username: '',
    Pool: getCognitoUserPool(),
  });

  return new Promise((resolve, reject) => {
    cognitoUser.refreshSession(cognitoRefreshToken, (err, result) => {
      if (err) reject(extractError(err));
      else resolve(result);
    });
  });
};

/**
 *
 * @param {{ email:string, code:string }}
 * @returns {Promise<string>}
 */
const confirmSignup = ({ email, code }) => {
  const cognitoUser = new CognitoUser({ Username: email, Pool: getCognitoUserPool() });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) reject(extractError(err));
      else resolve(result); //result is a string 'SUCCESS'
    });
  });
};

module.exports = { signup, login, refreshSession, confirmSignup };
