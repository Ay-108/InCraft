# InCraft Phase 0 — Repository Inspection Report

**Repository:** Ay-108/InCraft  
**Baseline:** `main`  
**Baseline commit:** `7d746cede88fd84a633abcbc2601eca0c61eab0c`  
**Audit branch:** `feature/incraft-complete-improvement-audit`  
**Audit date:** 2026-11-03  
**Scope:** Read-only inspection of repository metadata, source tree, Flask routing, templates/assets, database schema, ML modules, and deployment configuration. No application code was changed in this phase.

## 1. Executive summary

InCraft is a hybrid Flask application. Flask is the application entry point and owns authentication, server-side routes, API endpoints, database access, and Jinja template rendering. The primary application pages are generally routed through a shared `templates/index.html` shell that loads `public/static/js/app.js` (the SPA-style client). The repository also retains a separate set of page-specific templates and scripts, as well as `templates/base.html` and legacy page templates.

The README and `pyproject.toml` identify `backend.app:app` as the Vercel entry point. `backend/app.py` configures Jinja templates from `templates/` and assets from `public/static/`. Vercel serves `public/static/` directly while Flask retains its static endpoint for template URL generation/local hosting. Render uses Gunicorn with `run:app`.

**Primary architectural risk:** The repository contains multiple front-end implementations and duplicate asset locations. A future change must target the code actually loaded by the route being changed. The route helper `_render_app_page()` renders `index.html`, while individual legacy templates exist and `base.html` references a set of page-specific scripts/styles not necessarily used by the unified index shell.

## 2. Confirmed repository structure and active entry points

### Backend
- `backend/app.py`: Flask application factory, global app instance, CSRFProtect, request-scoped DB cleanup, security/configuration gate, blueprint registration.
- `backend/config.py`: environment-driven configuration, production detection, secret-key handling, MySQL configuration, upload/export paths and limits, session cookie settings.
- `backend/db.py`: MySQL connector and request-scoped connection management.
- `backend/routes.py`: large central Flask blueprint containing page routes, APIs, authentication/authorization, business workflows, imports/exports, analytics and ML endpoints.
- `backend/utils.py`: validation, authentication/session helpers, formatting, references and common utilities.
- `backend/ml/{forecast,stockout,reorder}.py`: demand estimate, stockout risk assessment and reorder recommendation logic.

### Frontend
- `templates/index.html`: shared app shell used by `_render_app_page()`; loads `public/static/css/styles.css` and `public/static/js/app.js`.
- `public/static/js/app.js`: approximately 1,897 lines in the inspected file; SPA-style client rendering for landing/authenticated pages and multiple modules.
- `public/app.js` and `public/static/app.js` are duplicate references to the same blob in the inspected repository tree.
- `public/static/js/main.js`, `dashboard.js`, `inventory.js`, `sales.js`, `analytics.js`, `activity.js`, `settings.js` are also present as page-specific scripts. The unified index shell does not itself show references to these scripts.
- `templates/base.html` loads global page styles and `main.js`, `data-sync.js`, `ui-motion.js`, with page-specific scripts through Jinja blocks.
- Dedicated templates exist for dashboard, inventory, sales, analytics, activity, settings, authentication and related pages. They should be treated as active only where the corresponding Flask routes render them, or as explicit fallbacks.

### Deployment
- `pyproject.toml` sets Vercel entry point to `backend.app:app`.
- `vercel.json` currently configures cache headers for `/static/*` and the Mumbai region.
- `render.yaml` defines a Python web service running `gunicorn run:app` and environment placeholders for the secret/database configuration.
- `requirements.txt` is the runtime dependency set; `requirements-dev.txt` holds a broader development set.
- README documents a single full-stack Flask deployment, remote MySQL requirement, Vercel temporary filesystem limitations and 4.5 MB function request/response limit.

## 3. Functional inventory confirmed from repository

- Authentication and registration routes, current-session endpoint, CSRF token endpoint, password hashing utilities, user-active checks and admin role checks.
- Dashboard summary and sales trend APIs; dashboard template includes KPI, sales trend and inventory distribution elements plus admin-only inventory import shortcut.
- Inventory product management, CSV/XLSX import, export and print/share UI assets.
- Sales creation and related sale/item schema; transaction helpers exist in the database module and sales route.
- Analytics endpoints and page/client code.
- Activity log table and activity page/client code.
- Settings client page and profile/password/preferences-related interactions.
- ML endpoints for forecast, stockout risk and reorder recommendations.
- Health/diagnostics endpoint and deployment-specific configuration checks.

The presence of code/UI does not prove that each control or workflow is fully correct. Those require targeted runtime and integration tests.

## 4. Confirmed data model

Core tables in `database/schema.sql`:
1. `users` — identity, unique email, password hash field, role (admin/manager/staff), active/inactive status and timestamps.
2. `products` — product code, name, category, quantity, price, minimum stock, supplier, status and timestamps; non-negative checks.
3. `sales` — invoice number, customer, total amount, payment method, date and user; non-negative total check.
4. `sale_items` — sale/product references, positive quantity, unit price and generated subtotal; FK cascade on sale, restrict on product deletion.
5. `activity_logs` — user, action, entity type/id, description and timestamp.

Views:
- `inventory_summary`
- `sales_summary`
- `product_sales_performance`
- `category_performance`
- `low_stock_products`

Indexes exist for common user, product, sale date/customer/user, sale-item and activity lookup fields.

### Data-model gaps relative to the requested roadmap
No dedicated schema tables were found for:
- stock movement ledger / inventory adjustment audit,
- purchase orders or suppliers with configurable lead times,
- sale cancellation/return/refund records and line-level reversal state,
- persistent notification preferences/events,
- authenticated-session inventory or remote session revocation,
- persistent file/object-storage metadata,
- explicit idempotency keys for sale submission (must inspect the existing route and DB implementation before concluding there is no equivalent mechanism).

These are gaps relative to the future requirements, not a recommendation to add all tables blindly. Each requires a migration and a clear consistency strategy.

## 5. ML implementation observations

- `forecast_product()` builds a 180-day daily series from supplied historical sale data, uses a weighted moving-average baseline and optionally a RandomForestRegressor when there are enough non-zero sales days. It returns 7-day/30-day aggregate forecasts, average daily demand, history observations, confidence label and method.
- `assess_stockout()` estimates lead-time demand and days of stock from current stock and average daily demand; it derives a risk score/category and explanation.
- `recommend_reorder()` uses current stock, minimum stock, daily demand, lead time and safety stock to estimate reorder point and quantity.
- These are estimates/heuristics and should be labeled accordingly. A confidence label based on non-zero sales days is not a statistically calibrated prediction interval or validated reliability score.
- Runtime data lineage, missing-history behavior and forecast evaluation metrics still require test coverage against real DB data.

## 6. Issues, risks and incomplete areas to validate

### A. Frontend/source-of-truth ambiguity — high priority
- A unified SPA-style shell and a separate page-template/script architecture coexist.
- Multiple stylesheets provide overlapping global/theme layers (including `style.css`, `styles.css`, `theme.css`, `ui-redesign.css`, `crunchyroll-theme.css`, `incraft-final.css`, `auth-final.css`).
- Both `public/app.js` and `public/static/app.js` are present alongside `public/static/js/app.js`; verify whether root-level assets are referenced by any deploy path before removing/altering.
- Page-specific scripts appear to be separate from the unified `app.js`; duplicate event logic is a maintenance risk if both paths are loaded in some page modes.

### B. Backend concentration and maintainability
- `backend/routes.py` is a large central module (about 124 KB in the tree metadata). It mixes page rendering, API logic, authorization, business rules and data access. Refactor only after mapping route dependencies; no broad rewrite is recommended.
- Route/API behavior must be documented before changing response contracts consumed by the SPA.

### C. Database consistency and audit gaps
- Sales and sale-items are relationally modeled, but no stock movement ledger exists in the core schema.
- Product deletion is restricted when linked to sale items; archive/status should be preferred for historical integrity.
- **Confirmed sales schema mismatch:** `create_sale()` selects/inserts `sales.idempotency_key`, and the client sends a UUID, but the committed `database/schema.sql` did not define that column or unique index. A clean database initialized from the schema would fail sale creation. This has been addressed with a schema update and an idempotent migration for existing databases.
- Returns, refunds, cancellation and inventory reversal are not represented as first-class schema concepts.
- No explicit supplier lead-time field appears in the products table; ML route uses an assumed/default lead time unless separately configured.
- Activity logs are not a substitute for a full quantity movement ledger.

### D. ML reliability communication
- Forecasting includes a Random Forest path and fallback statistical estimator. The UI should expose the selected method and sufficient-history caveats.
- Current confidence categories are heuristic labels. Do not present them as calibrated confidence intervals.
- MAE/RMSE evaluation and out-of-sample validation are not apparent in the inspected ML service functions.

### E. Settings/session/notification boundaries
- Client settings code uses browser localStorage for some preferences. Distinguish local device preferences from server-wide business configuration.
- No session tracking table is in the inspected schema; remote session termination must not be advertised without server-side session records and revocation logic.
- Notification UI/configuration requires verification that server workflows actually consult persisted preferences.

### F. File storage/deployment
- Vercel storage is temporary under `/tmp`; durable uploaded files/exports require external object storage.
- The configured 4 MB Vercel upload default leaves headroom under function request limits, but larger imports/exports need direct object storage workflows.
- `config.allowed_file()` checks extension/path shape; uploaded content still needs validation and parser hardening.
- **Confirmed health endpoint information leak:** `/api/health` included the raw MySQL connector message in the public `db_error` field when connectivity fails. This could disclose host/account/connection details. The response has been changed to a generic status message while exception details remain in server logs.
- Database reachability and secrets cannot be fully verified without deployment environment access.

### G. Testing
- `run_security_tests.py` references seven security/transaction test modules. Their availability, importability and execution result were not established in this remote audit.
- No DB-backed, browser-based or deployed integration test was executed in Phase 0.
- No claim is made that each existing feature currently works.

## 7. Security controls observed (static inspection)
- Flask-WTF CSRF protection is initialized application-wide.
- Production boot has a missing-secret configuration gate.
- Session cookie defaults include HttpOnly, SameSite=Lax and Secure in production (configurable).
- Password hashing/checking utilities are imported into the route layer.
- Active-account and database-role authorization decorators exist; admin role is checked against the database rather than trusting a client role.
- MySQL operations are centralized in `backend/db.py` helpers.
- File upload extension allow-list and request-size configuration exist.

These are positive controls, not a complete security certification. SQL query audit, endpoint-by-endpoint authorization tests, CSRF coverage, upload content validation and deployed configuration checks remain pending.

## 8. Recommended implementation sequence

1. Map every route to the frontend shell/template and exact script bundle it serves; capture an endpoint/page matrix.
2. Run the current security/transaction suite and establish a reproducible baseline.
3. Audit and fix confirmed functional regressions before UI changes.
4. Improve dashboard using current database-backed endpoints, avoiding a second data-fetching implementation.
5. Harden inventory import/export and stock adjustment history.
6. Improve sales transaction integrity and multi-line workflows only after auditing the current sale transaction, locking and idempotency behavior.
7. Align analytics and activity pagination/filter semantics with database queries.
8. Improve ML data lineage, caveats and evaluation before changing the algorithms.
9. Audit settings persistence and permissions.
10. Consolidate styles and duplicate assets only after verifying the active routes and deployment references.
11. Run integration/regression tests; document unavailable external dependencies.

## 9. Phase 0 status

**Completed:** Repository metadata and main baseline identified; application entry points and deployment configuration inspected; hybrid frontend architecture identified; schema and ML service structures reviewed; initial risk register documented; dedicated feature branch created.

**Follow-on functional fixes on the same feature branch:** the sales idempotency column/index is now in the baseline schema with an idempotent migration for existing installations; the public health response is hardened and covered by a regression test.

**Not completed:** Runtime/database tests, full frontend interaction tests, external deployment verification, or implementation of phases 1–12.

## 10. References
- Repository: https://github.com/Ay-108/InCraft
- Baseline commit: https://github.com/Ay-108/InCraft/commit/7d746cede88fd84a633abcbc2601eca0c61eab0c
- Audit branch: https://github.com/Ay-108/InCraft/tree/feature/incraft-complete-improvement-audit
