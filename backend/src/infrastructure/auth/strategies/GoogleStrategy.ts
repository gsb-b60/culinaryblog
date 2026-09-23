import { PrismaClient } from '@prisma/client';
import { PassportStatic } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { User } from '../../../domain/entities/User.js';
import { EmailAddress } from '../../../domain/value-objects/EmailAddress.js';
import { UserRepository } from '../../persistence/repositories/UserRepository.js';

const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);

export function configureGoogleStrategy(passport: PassportStatic): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ['openid', 'email', 'profile'],
        passReqToCallback: true,
      },
      async (_req, _accessToken, _refreshToken, profile, done) => {
        try {
          if (!profile.emails || !profile.emails[0]) {
            return done(new Error('No email found in Google profile'), false);
          }

          const email = EmailAddress.create(profile.emails[0].value);
          let user = await userRepository.findByEmail(email);

          if (!user) {
            const displayName = profile.displayName || profile.name?.givenName || 'User';
            const newUser = User.create({
              email: profile.emails[0].value,
              displayName,
              avatarUrl: profile.photos?.[0]?.value,
              googleId: profile.id,
            });
            user = await userRepository.save(newUser);
          }

          // TODO: Link Google account if not already linked

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