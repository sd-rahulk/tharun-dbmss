import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  gender: z.enum(['FEMALE','MALE','NON_BINARY','PREFER_NOT_TO_SAY']),
  email: z.string().email(),
  password: z.string().min(8).max(100)
});
export const searchSchema = z.object({ from: z.string().min(1), to: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), mode: z.enum(['ALL','BUS','METRO']).default('ALL') });
export const bookingSchema = z.object({ scheduleId: z.string().min(1), passengerId: z.string().min(1), boardingCityId: z.string().min(1), destinationCityId: z.string().min(1), quantity: z.number().int().positive().max(8), seats: z.array(z.string().max(10)).max(8).default([]), paymentMethod: z.enum(['SIMULATED_CARD','UPI_SIMULATION','PASS']).default('SIMULATED_CARD'), simulateFailure: z.boolean().default(false) });
