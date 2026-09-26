import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(1).max(200),
  phone: z.string().min(7).max(20),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  couponCode: z.string().max(50).optional(),
  paymentMethod: z.enum(["safepay", "cod"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
