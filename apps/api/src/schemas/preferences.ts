import { z } from "zod";

const Namespace = z.record(z.string(), z.unknown());

/** Contract C3. One object, one namespace per owner. Add new namespaces here (additive). */
export const PreferencesSchema = z
  .strictObject({
    ui: Namespace.optional(), //       Member 1
    captions: Namespace.optional(), // Member 1
    sign: Namespace.optional(), //     Member 2
    ad: Namespace.optional(), //       Member 2
    offline: Namespace.optional(), //  Member 2
    jobs: Namespace.optional(), //     Member 3
  })
  .refine((v) => JSON.stringify(v).length <= 20_000, "Preferences are too large (20 KB max).");
export type Preferences = z.infer<typeof PreferencesSchema>;
