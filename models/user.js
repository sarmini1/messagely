"use strict";

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("./config");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    //before starting the insert statement, need to generate the hashed
    //version of the user's password to send in

    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username,
                             password,
                             first_name,
                             last_name,
                             phone
                             )
         VALUES
           ($1, $2, $3, $4, $5)
         RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]);

    return result.rows[0];

  }




  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {

    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `SELECT password
                              FROM users
                              WHERE username = $1`,
      [username]);

    const u = result.rows[0];

    if (await bcrypt.compare(hashedPassword, u.password) === true) {
      return true;
    }
    else {
      return false;
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    const result = await db.query(
      `UPDATE users
                            SET last_login_at = current_timestamp
                            WHERE username = $1
                            RETURNING username, last_login_at`,
      [username]);

    //doesn't seem like we need to return anything here
  }


  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {

    const result = await db.query(
      `SELECT 
                                    username, 
                                    first_name, 
                                    last_name
                            FROM users`,
    );
    const users = result.rows;
    return users;

  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {

    const result = await db.query(
      `SELECT 
                                    username, 
                                    first_name, 
                                    last_name,
                                    phone,
                                    join_at,
                                    last_login_at
                            FROM users
                            WHERE username = $1`,
      [username]);
    const user = result.rows[0];
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

    const messageResult = await db.query(
      `SELECT m.id,
              m.to_username,
              m.body,
              m.sent_at,
              m.read_at
         FROM messages AS m
                JOIN users ON m.from_username = users.username
         WHERE m.from_username = $1`,
      [username]);
    const messages = messageResult.rows;

    //may need to loop through the messages array that we have
    // and set each object's to_user property
    // to be the result of a query to the users table
    //where we pull in their username, first/last name, phone

    let messagesWithUserInfo = messages.map(async m => )



//     const userResult = await db.query(
//       `SELECT 
//       username, 
//       first_name, 
//       last_name,
//       phone
// FROM users
// WHERE username = $1`,
// [username]);
// const user = userResult.rows[0];


  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;
