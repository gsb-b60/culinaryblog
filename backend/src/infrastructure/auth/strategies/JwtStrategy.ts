import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PassportStatic } from 'passport';
import { JwtService } from './JwtService.js';
import { UserRepository } from '../../persistence/repositories/UserRepository.js';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../../../domain/enums/UserRole.js';

const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const jwtService = new JwtService();

export function configureJwtStrategy(passport: PassportStatic): void {
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_ACCESS_SECRET!,
    passReqToCallback: true,
  };

  passport.use(
    new JwtStrategy(options, async (req, payload, done) => {
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

        (req as any).user = currentUser;
        return done(null, currentUser);
      } catch (error) {
        return done(error, false);
      }
    })
  );
}

export { JwtService };