import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PassportStatic } from 'passport';
import { UserRepository } from '../../persistence/repositories/UserRepository.js';
import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../PasswordService.js';
import { UserRole } from '../../../domain/enums/UserRole.js';
import { EmailAddress } from '../../../domain/value-objects/EmailAddress.js';

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
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          if (!profile.emails || !profile.emails[0]) {
            return done(new Error('No email found in Google profile'), false);
          }

          const email = EmailAddress.create(profile.emails[0].value);
          let user = await userRepository.findByEmail(email);

          if (!user) {
            // Create new user from Google profile
            const displayName = profile.displayName || profile.name?.givenName || 'User';
            user = await userRepository.save(
              // User.create would need to be called, but we need to handle the googleId
              // For now, we'll create a user object manually
            );
          }

          if (user && !user.googleId) {
            // Link Google account if not already linked
            // This would require updating the user
          }

          const currentUser = {
            id: user!.id,
            email: user!.email.getValue(),
            displayName: user!.displayName,
            roles: [user!.role],
            isActive: user!.isActive,
          };

          return done(null, currentUser);
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );
}