"use strict";

const Router = require("express").Router;
const router = new Router();
//const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config');
const { UnauthorizedError } = require('../expressError');


/** POST /login: {username, password} => {token} */
router.post('/login', async function (req, res, next) {

  const { username, password } = req.body;
  const isValid = await User.authenticate(username, password);

  //switch order of these, fail first
  //for security stuff, always be 100% explicit and don't rely on truthy stuff
  if (isValid === false) {
    throw new UnauthorizedError("Invalid user/password");
  }
  else if (isValid === true) {
    await User.updateLoginTimestamp(username);
    let token = jwt.sign({ username }, SECRET_KEY);
    //it's the front end's job to choose what they do with the token, we just give it back
    //to them
    return res.json({ token });
  }

});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register', async function (req, res, next) {

  const { username,
    password,
    first_name,
    last_name,
    phone } = req.body;
  console.log("req.body looks like --->", req.body);
  const registeredUser = await User.register({
    username,
    password,
    first_name,
    last_name,
    phone
  });

  const isValid = await User.authenticate(username, password);

  if (isValid === false) {
    throw new UnauthorizedError("Invalid user/password");
  }
  else if (isValid === true) {
    //await User.updateLoginTimestamp(username);
    let token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }

});

module.exports = router;