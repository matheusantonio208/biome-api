import JobQueue from '#lib/JobQueue.js';

import JobDeletedUser from '#jobs/emails/User/DeletedUser.js';
import JobUpdatedUserEmail from '#jobs/emails/User/UpdatedUserEmail.js';
import JobUpdatedUserPassword from '#jobs/emails/User/UpdatedUserPassword.js';
import JobWelcomeNewUser from '#jobs/emails/User/WelcomeNewUser.js';

import User from './user-repository.js';

class UserController {
  async show(req, res) {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(401).json({
          error_msg:
            'The User must be logged in to have access to the information',
        });
      }

      const user = await User.getById(userId);

      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).json({ error_msg: error.toString() });
    }
  }

  async store(req, res) {
    try {
      const newUser = req.body;
      const isDuplicateEmail = await User.checkDuplicateEmail(newUser.email);

      if (isDuplicateEmail) {
        return res.status(400).json({ error_msg: 'Email already register' });
      }

      const createdUser = await User.create(newUser);

      if (createdUser) {
        await JobQueue.add(JobWelcomeNewUser.key, createdUser);
      }

      return res.status(201).json(createdUser);
    } catch (error) {
      return res.status(400).json({ error_msg: error.toString() });
    }
  }

  async update(req, res) {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(401).json({
          error_msg:
            'This user needs to be authenticated to change their information',
        });
      }

      const updatedUser = await User.updateById(userId, req.body);

      if (updatedUser && req.body.password_hash) {
        await JobQueue.add(JobUpdatedUserPassword.key, updatedUser);
      }

      if (updatedUser && req.body.email) {
        await JobQueue.add(JobUpdatedUserEmail.key, updatedUser);
      }

      return res.status(200).json(updatedUser);
    } catch (error) {
      return res.status(400).json({ error_msg: error.toString() });
    }
  }

  async delete(req, res) {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(401).json({
          error_msg: 'The user must be logged in to delete his account',
        });
      }
      const userFound = await User.getById(userId);
      const isDeleted = await User.deleteById(userId);

      if (isDeleted) {
        await JobQueue.add(JobDeletedUser.key, userFound);
      }

      return res.status(200).json({ success_msg: 'User has been deleted' });
    } catch (error) {
      return res.status(400).json({ error_msg: error.toString() });
    }
  }
}

export default new UserController();
