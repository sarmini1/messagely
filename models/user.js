'use strict';

const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const db = require("../db");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    //before starting the insert statement, need to generate the hashed
    //version of the user's password to send in

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username,
                             password,
                             first_name,
                             last_name,
                             phone,
                             join_at,
                             last_login_at
                             )
         VALUES
           ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
         RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    console.log("hashed passwrod: ", hashedPassword);

    const result = await db.query(
      `SELECT password
            FROM users
            WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    //console.log("u line 50: ", u);

    // if (u === undefined) throw new NotFoundError(`User cannot be found: ${username}`);
    //since this function should just return yes/no, we wouldn't want to do the
    //user check in this case. also, for security purposes so we don't give extra hints

    return user && await bcrypt.compare(password, user.password) === true;
    //better to explicitly return the u variable as well as the bcrypt evaluation
    //this is more performant as if the user doesn't exist
    //look up Boolean method here, we'll want to use this instead

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
                            SET last_login_at = current_timestamp
                            WHERE username = $1
                            RETURNING username, last_login_at`,
      [username]
    );
    const u = result.rows[0];
    if (u === undefined) throw new NotFoundError(`User cannot be found: ${username}`);
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
                            FROM users`//add an order by and fix indentation
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
      [username]
    );
    const user = result.rows[0];
    if (user === undefined) throw new NotFoundError(`User cannot be found: ${username}`);
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

    const user = await db.query(
      `SELECT username FROM users WHERE username = $1`, [username]);
    const u = user.rows[0];
    if (u === undefined) {
      throw new NotFoundError(`User cannot be found: ${username}`);
    }

    const result = await db.query(
      `SELECT m.id,
              m.to_username,
              m.from_username,
              m.body,
              m.sent_at,
              m.read_at,
              user_to.username,
              user_to.first_name,
              user_to.last_name,
              user_to.phone
         FROM messages AS m
                JOIN users AS user_to ON m.to_username = user_to.username
         WHERE m.from_username = $1`,
      [username]
    );
    const messagesResult = result.rows;

    let messagesWithRecipientInfo = messagesResult.map((m) => {
      return {
        id: m.id,
        to_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
      };
    });
    return messagesWithRecipientInfo;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */
  static async messagesTo(username) {

    const user = await db.query(
      `SELECT username FROM users WHERE username = $1`, [username]);
    const u = user.rows[0];
    if (u === undefined) {
      throw new NotFoundError(`User cannot be found: ${username}`);
    }

    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              m.body,
              m.sent_at,
              m.read_at,
              u.username,
              u.first_name,
              u.last_name,
              u.phone
         FROM messages AS m
                JOIN users AS u ON m.from_username = u.username
         WHERE m.to_username = $1`,
      [username]
    );
    const messagesResult = result.rows;

    let messagesWithRecipientInfo = messagesResult.map((m) => {
      return {
        id: m.id,
        from_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
      };
    });
    return messagesWithRecipientInfo;
  }
}

module.exports = User;
