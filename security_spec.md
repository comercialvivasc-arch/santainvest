# Security Specification & Threat Model (VIVASC Portal)

This document contains structural security assertions, threat model analysis, and "Dirty Dozen" payload test descriptions for the Firestore security rules.

## 1. Core Data Invariants

1. **Authentication Level**: Banners and Properties catalog can be viewed publicly (anonymous `read` is allowed).
2. **Admin Privilege Isolation**: All mutations (`create`, `update`, `delete`) are strictly gated by `isAdmin()` checks.
3. **No Email Spoofing**: Admin status relies strictly on the email address `comercial.vivasc@gmail.com` with `email_verified == true`.
4. **ID Hardening**: Any document operations on properties or banners must validate that IDs are safe and do not cause resource exhaustion attacks.
5. **No Orphan/Shadow Fields**: Writes must comply exactly with schema keys using validation helpers on both create and update.

## 2. The "Dirty Dozen" Threat Payloads

The following payloads attempt to bypass authorization or inject malformed formats:

1. **Email Spoofing (Admin Hijack)**: Creating a property while signed in with user email `comercial.vivasc@gmail.com` but with `email_verified: false`. Must be `PERMISSION_DENIED`.
2. **Shadow Field Injection**: Attempt to create a property with an extra unmapped field: `isApprovedBySystem: true`. Must be `PERMISSION_DENIED`.
3. **Property ID Poisoning**: Specifying a 10KB string as property ID to blow up index budgets. Must be `PERMISSION_DENIED`.
4. **Malicious Status Transition**: Setting `status: "SuperAwesomeUltraReady"` (not in permitted enums). Must be `PERMISSION_DENIED`.
5. **Value Poisoning (Type Mismatch)**: Attempting to submit `price: "One Million BRL"` (string instead of number). Must be `PERMISSION_DENIED`.
6. **Negative Value Exploits**: Setting integers, e.g. `bedrooms: -5`. Must be `PERMISSION_DENIED`.
7. **Banners Unauthorized Mutation**: Regular authenticated user attempts to disable a banner (`active: false`). Must be `PERMISSION_DENIED`.
8. **Banner Shadow Injection**: Creating a banner with a ghost key `linkAction: "malicious_js"`. Must be `PERMISSION_DENIED`.
9. **Banner URL Overflow**: Creating a banner with an image URL of 20KB to cause wallet exhaustion. Must be `PERMISSION_DENIED`.
10. **Immutable Primary Key Bypass**: Attempt to update a property by changing its primary `id`. Must be `PERMISSION_DENIED`.
11. **Anomalous Large Size values**: Setting `area` to `9999999"`. Must be `PERMISSION_DENIED`.
12. **Unauthenticated Public Destruction**: Attempt to delete a property listings package without credentials or auth header. Must be `PERMISSION_DENIED`.
