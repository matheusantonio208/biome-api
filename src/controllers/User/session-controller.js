import Jwt from 'jsonwebtoken';

import authConfig from '#config/auth-config.js';

import User from './user-repository.js';

class SessionController {
  async store(req, res) {
    try {
      const loginUser = req.body;

      const isLogged = await User.login(
        loginUser.email,
        loginUser.password_hash,
      );

      if (isLogged) {
        const user = await User.checkEmail(loginUser.email);

        const userAccessToken = {
          user: { id: user.id, name: user.name },
          token: Jwt.sign(
            { id: user.id, name: user.name },
            authConfig.secret_key,
            {
              expiresIn: authConfig.expiresIn,
            },
          ),
        };

        return res.status(201).json(userAccessToken);
      }

      return false;
    } catch (error) {
      return res.status(401).json({ error_msg: error.toString() });
    }
  }
}

export default new SessionController();
