# Security Specifications and TDD Targets

This specification document outlines the security policies, data invariants, and negative test targets for our salon booking application Firestore.

## 1. Data Invariants
- **Appointments**: Anyone can read appointments, but only logged-in users under their own `clientId` or an ADMIN can create/update appointments.
- **Stylists**: Anyone can read stylists. Only ADMIN can write (create/update/delete).
- **Services**: Anyone can read services. Only ADMIN can write (create/update/delete).
- **Clients**: A client can read and write (update) their own profile document (`clients/{clientId}`). Admins can read and write all client documents.
- **BusinessHours & BannerConfig**: Anyone can read, only admin can write.

## 2. The "Dirty Dozen" Threat Vectors
1. **Unauthenticated Appointment Creation**: Malicious user attempts to write to `/appointments/xyz` without authentication.
2. **Identity Spoofing in Bookings**: User A attempts to book an appointment with `clientId: "UserB"`.
3. **Privilege Escalation on Client Profiling**: A non-admin user attempts to create themselves as an ADMIN or update their profile role to admin.
4. **Unauthorized Stylist Registration**: A standard client attempts to create, edit, or delete a stylist record in `/stylists/`.
5. **Unauthorized Service Manipulation**: A malicious actor attempts to lower a service price in `/services/`.
6. **Bypassing Appointmt Confirmation Gate**: A regular client attempts to force-confirm an appointment.
7. **Junk Character Path Injection**: Malicious script attempts to create documents with high-payload invalid strings as IDs.
8. **Poisoning Business Hours**: A client tries to turn off salon schedule by making `businessHours/1` closed.
9. **Tampering banner promotion**: A client attempts to change the promo banner to show "99% OFF".
10. **Orphaned Bookings**: Creating a booking reference pointing to non-existent services.
11. **Reading Private Client Profiles**: Guest users attempting to read all clients in `/clients`.
12. **Double Status terminal lock bypass**: Attempting to edit or update an appointment's status after it has already reaching a terminal state (e.g. `CANCELADO`).

## 3. Deployment Rules Draft
We will build security rules that enforce checking user IDs, admin credentials (either dynamically evaluated, or hardcoded for the current admin user if needed, or by designating `admin` status to the admin profile, or since the app can log in user as CLIENT or admin, checking if their client record exists or if they log in). Let's write the `firestore.rules` containing solid, bulletproof checks!
