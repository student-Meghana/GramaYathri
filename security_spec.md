# Security Specification - Grama-Yatri

## Data Invariants
- Pings are immutable once created.
- Alerts can only be created by signed-in users (including anonymous).
- Routes are read-only for standard users; only admins can create/edit routes.
- Every ping/alert must be associated with a valid `routeId`.
- Timestamps must be strictly set to the server's time (`request.time`).
- Field sizes must be strictly capped to prevent resource exhaustion attacks.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Spoofing**: User `A` tries to create a ping with `userId: "UserB"`.
2. **Time Travel**: User tries to set `timestamp` to a date in the future.
3. **Ghost Fields**: User tries to add `isVerified: true` to a ping payload.
4. **ID Poisoning**: User tries to use a 1KB string as a `routeId`.
5. **Malicious Content**: User tries to inject a script into the `message` field of an alert.
6. **Immutable Breach**: User tries to update the `stopId` of an existing ping.
7. **Unauthorized Deletion**: User tries to delete an alert they didn't create.
8. **Admin Escalation**: User tries to update a `route` document.
9. **Blanket Read Scam**: User tries to `list` all pings across all routes without a filter.
10. **Type Mismatch**: User sends a number for the `userName` field.
11. **Resource Exhaustion**: User sends a 2MB string for the alert message.
12. **Orphaned Writes**: User tries to create a ping for a `routeId` that doesn't exist in the database.

## Test Runner (Logic)
- `create` on `/routes/{routeId}/pings` fails if `request.resource.data.userId != request.auth.uid`.
- `update` on any collection fails (except for admin).
- `create` on `/routes/{routeId}/alerts` fails if `request.resource.data.message.size() > 500`.
- `list` on `/routes` is allowed, but `list` on `/routes/{routeId}/pings` requires `routeId` to be valid.
