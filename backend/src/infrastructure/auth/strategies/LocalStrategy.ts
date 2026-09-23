import { PrismaClient } from '@prisma/client';
import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { EmailAddress } from '../../../domain/value-objects/EmailAddress.js';
import { UserRepository } from '../../persistence/repositories/UserRepository.js';
import { PasswordService } from '../PasswordService.js';

const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);

export function configureLocalStrategy(passport: PassportStatic): void {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async (_req, email, password, done) => {
        try {
          const emailVO = EmailAddress.create(email);
          const user = await userRepository.findByEmail(emailVO);

          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          if (!user.isActive) {
            return done(null, false, { message: 'Account is deactivated' });
          }

          if (!user.passwordHash) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          const isValid = await PasswordService.verify(password, user.passwordHash);
          if (!isValid) {
            user.recordFailedAccess();
            await userRepository.save(user);
            return done(null, false, { message: 'Invalid credentials' });
          }

          user.resetAccessFailedCount();
          await userRepository.save(user);

          const currentUser = {
            id: user.id,
            email: user.email.getValue(),
            displayName: user.displayName,
            roles: [user.role],
            isActive: user.isActive,
          };

          return done(null, currentUser);
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );
}