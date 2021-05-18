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
  if (isValid === true) {
    let token = jwt.sign({ username }, SECRET_KEY);
    //it's the front end's job to choose what they do with the token, we just give it back
    //to them
    return res.json({ token });
  }
  else {
    throw new UnauthorizedError("Invalid user/password");
  }
}

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

module.exports = router;