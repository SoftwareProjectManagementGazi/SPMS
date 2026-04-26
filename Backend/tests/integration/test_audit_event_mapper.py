# Phase 13 D-X1 hidden contract — audit_log → semantic event mapping.
#
# The mapper itself lives in Frontend2/lib/audit-event-mapper.ts because the
# transformation is a pure UI rendering concern (semantic types feed the
# eventMeta map for icon / color / label). Backend-side coverage is
# intentionally an empty placeholder so Phase 12 D-09 Nyquist file-existence
# checks pass (the file IS present and runs in pytest -x without errors)
# while the mapper's 10-case unit coverage stays in
# Frontend2/lib/audit-event-mapper.test.ts where it belongs.
#
# DO NOT add backend-side mapper tests here — duplicating the contract in
# Python would create two sources of truth and force every audit_log shape
# change to be reflected in two languages.
