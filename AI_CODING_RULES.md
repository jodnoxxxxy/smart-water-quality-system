# AI Coding Model Rules & Architecture Guidelines

These 15 core rules govern all software engineering, module generation, and code modifications in this project:

---

### RULE 1: Do not generate the entire application in one response
- Break complex requirements into logical, focused modules.
- Plan and deliver changes incrementally so each piece can be inspected, tested, and verified before proceeding.

### RULE 2: Build one module at a time
- Complete a single functional unit (e.g., authentication, database schema, analysis pipeline, analytics visualization) before beginning the next.
- Avoid spreading partial changes across disconnected subsystems simultaneously.

### RULE 3: Before creating a new file, check the existing project structure
- Inspect existing directories, naming conventions, and shared utilities before adding files.
- Prevent duplicate files, fragmented utilities, and inconsistent folder structures.

### RULE 4: Never overwrite working code unnecessarily
- Use targeted, surgical edits rather than wiping and replacing entire files.
- Preserve existing working functionality, routes, and tests unless an explicit refactor is requested.

### RULE 5: Never use fake APIs when the real architecture is already defined
- Connect directly to the defined backend routes, schemas, and live integrations.
- Do not introduce stubbed responses or mock endpoints when a production contract exists.

### RULE 6: Never create fake WIP data and present it as real functionality
- Do not hardcode static sample items to mimic dynamic operations.
- Clearly differentiate mock/seed fixtures from live production execution paths.

### RULE 7: Every database operation must respect user roles and authorization
- Enforce strict role-based access control (RBAC) and authorization checks on every read, write, update, and delete operation.
- Users must only be able to view and modify data they are authorized to access.

### RULE 8: Every important operation must have loading, success, empty, and error states
- All asynchronous actions and data-fetching views must handle:
  1. **Loading state**: Clear feedback during processing.
  2. **Success state**: Confirmation and updated UI.
  3. **Empty state**: Informative prompt when no records exist.
  4. **Error state**: Actionable, user-friendly error message with recovery options.

### RULE 9: Keep business logic separate from UI
- Decouple domain calculations, data validations, and storage operations from presentation templates/components.
- Business logic lives in service or utility layers; presentation code focuses on rendering and user interaction.

### RULE 10: Do not hard-code service categories when they belong in the database
- Dynamic domain categories, options, and classification parameters must be stored in data sources or configuration tables, not hardcoded into UI strings or brittle conditional trees.

### RULE 11: Do not expose secrets or API keys in frontend code
- All credentials, API keys, database connection strings, and tokens must remain in server-side environment variables (`.env`).
- Never pass private credentials or secrets to client-facing scripts or templates.

### RULE 12: After completing each module, test it before continuing
- Validate syntax, verify routes, run unit/integration checks, and test edge cases before marking a module complete.
- Confirm end-to-end functionality before moving to dependent modules.

### RULE 13: If an architectural decision is unclear, stop and explain the alternatives
- When encountering ambiguity, trade-offs, or potentially breaking changes, present the options, pros, and cons rather than silently choosing a destructive or irreversible path.

### RULE 14: Preserve backward compatibility with previously completed modules
- New features and schema updates must not break existing interfaces, persisted records, or previously delivered modules.
- Maintain stable contracts across migrations and updates.

### RULE 15: Production code must be maintainable, documented, and scalable
- Write clean, idiomatic code with clear comments on complex algorithms.
- Structure modules for horizontal scalability, readability, and long-term maintainability.
