# Security Specification & Threat Model (TDD)

## 1. Data Invariants

1. **Secretarias (Municipal Secretariats)**: Secretariats represent the municipal infrastructure structure. Standard users cannot create, edit, or delete secretariats. Standard users can only view active secretariats.
2. **POPI Access Control**:
   - Master documents of POPI represent public or internal processes.
   - Any authenticated municipal user can retrieve and edit, but deleting a POPI requires special verification or is not allowed. To protect resource limits, only authenticated users can write.
   - User id (`created_by` / `updated_by`) must be correct representation of `request.auth.uid`.
3. **Temporal Integrity**: All writes requiring timestamp (`created_at`, `updated_at`) must align strictly with the server hour (`request.time`).
4. **Id Integrity & Size limits**: All ID fields must be strictly validated alphanumeric, and no field can exceed a safe packet budget (size boundaries).

---

## 2. The "Dirty Dozen" Malicious Payloads (Vulnerability Vector Spec)

Below are the 12 exploitation vectors targeted by the system:

1. **T01_SPOOF_SECRETARIAT_CREATION**: Unauthenticated attacker tries to insert a fake secretariat.
2. **T02_NON_ADMIN_SECRETARIAT_MODIFICATION**: Non-admin authenticated user tries to edit or deactivate a secretariat.
3. **T03_POPI_UNAUTHENTICATED_READ**: Anonymous call attempting to scraper-read overall public POPIs.
4. **T04_POPI_SPOOF_CREATOR**: User authenticated as `user_A` tries to create a POPI with `created_by` parameter set to `user_B`.
5. **T05_POPI_INVALID_STATE_BYPASS**: Attacker tries to create a POPI directly with status `aprovado` without passing through raw/edit stages (`rascunho`).
6. **T06_POPI_OVERWHELMING_TITLE**: Attacker attempts a Denial of Wallet / Resource exhaustion attack by injecting a 5MB unicode string inside `title`.
7. **T07_POPI_INPUT_HIJACK**: Attacker tries to modify `current` inputs for a POPI they don't have privileges to edit, or with a missing master POPI.
8. **T08_POPI_DOCUMENT_INJECT_MALICIOUS_SCRIPTS**: Attacker attempts to update the Mermaid code of document `current` adding unescaped/oversized field values.
9. **T09_POPI_VERSION_TAMPERING**: Attacker attempts to manual overwrite or delete historical `/versions/{versionId}` entries to cover up malicious state changes.
10. **T10_PROMPT_CROSS_USER_EDIT**: User `user_A` attempts to write/edit a `CustomPrompts` document inside `user_B`'s `/users/{userId}/prompts` subpath.
11. **T11_IMMUTABLE_FIELD_OVERRIDE**: Attacker attempts to rewrite `created_at` or `sequential_number` of an existing active POPI document during update.
12. **T12_SPOOF_EMAIL_VERIFIED**: User attempts to fetch/write data passing an unverified email token where verification is required.

---

## 3. Test Runner Design

All "Dirty Dozen" scenarios would terminate with `PERMISSION_DENIED` in a local emulator runtime environment:

```ts
// firestore.rules.test.ts mock structure
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("Fortress FireStore Rules - Red Team Audit Suite", () => {
  it("rejects unauthorized actions defined in Dirty Dozen", async () => {
    // Assert all 12 paths fail with PERMISSION_DENIED under invalid conditions
  });
});
```
