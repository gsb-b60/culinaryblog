import { PrismaClient } from '@prisma/client';
import { PassportStatic } from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';

import { UserRepository } from '../../persistence/repositories/UserRepository.js';
import { JwtService } from '../JwtService.js';

const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);

export function configureJwtStrategy(passport: PassportStatic): void {
  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_ACCESS_SECRET!,
  };

  passport.use(
    new JwtStrategy(options, async (payload, done) => {
      try {
        const user = await userRepository.findById(payload.userId);
        if (!user || !user.isActive) {
          return done(null, false);
        }

        const currentUser = {
          id: user.id,
          email: user.email.getValue(),
          displayName: user.displayName,
          roles: [user.role],
          isActive: user.isActive,
        };

        return done(null, currentUser);
      } catch (error) {
        return done(error, false);
      }
    })
  );
}

export { JwtService };