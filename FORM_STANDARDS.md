Form Controls Standards

Scope
- Applies to `clothing-frontend` React components and pages.
- Aligns with backend (Django/DRF) error shapes and admin expectations.

Principles
- Label every control with a `<label htmlFor>` that references an `id` on the control.
- Prefer the shared components: `FormField` and `Input` from `src/components/ui`.
- Expose validation state via `aria-invalid` and `aria-describedby` when errors or hints are present.
- Show errors adjacent to fields with `role="alert"` and `aria-live="assertive"`.
- Avoid placeholders as the only label; placeholders are optional hints.
- Use semantic `fieldset/legend` for grouped radios/checkboxes.

Components
- `FormField`: wraps a form control to wire `label`, `hint`, and `error` with correct a11y attributes.
  - Props: `label`, `hint`, `error`, `required`, `children` (single input), optional className props.
- `Input`: consistent, accessible text input with focus, disabled, and invalid styles.

Backend Error Shape
- Generic errors use `{ detail: string, code?: string }`.
- Field-specific errors use `{ field_name: ["message", ...] }`.
- Frontend should prefer `detail` for general messages and map arrays for fields.

Usage Example
```
<FormField label="Email" error={errors.email}>
  <Input type="email" name="email" value={email} onChange={...} required />
</FormField>
```

Notes
- For async submit errors not tied to a field, render an error paragraph with `role="alert"`.
- Keep `noValidate` on forms to rely on controlled validation and consistent messages.

