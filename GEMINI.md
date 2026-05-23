<!-- TRIGGER.DEV GUARDRAILS START -->
# Trigger.dev Guardrails (v4)

**MUST use `@trigger.dev/sdk`, NEVER `client.defineJob`**

## Key Restrictions
- **Result vs Output**: `triggerAndWait()` returns a `Result` object with `ok`, `output`, `error` properties - NOT the direct task output.
- **NEVER use Promise.all**: Never wrap `triggerAndWait`, `batchTriggerAndWait`, or `wait` calls in a `Promise.all` or `Promise.allSettled` as this is not supported in Trigger.dev tasks.
- **NEVER Use (v2 deprecated)**: 
  ```ts
  // BREAKS APPLICATION
  client.defineJob({
    id: "job-id",
    run: async (payload, io) => {
      /* ... */
    },
  });
  ```
  Always use the SDK (`@trigger.dev/sdk`), check `result.ok` before accessing `result.output`.
<!-- TRIGGER.DEV GUARDRAILS END -->
