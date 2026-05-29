export const meta = {
  name: 'fake-pass-test-audit',
  description: 'Audit every backend + frontend test for FAKE PASSES — tests rigged to stay green without verifying real production behavior. One agent per test file reads the test AND its source; every flagged finding is adversarially re-verified.',
  whenToUse: 'When you need confidence that a test suite actually verifies behavior and is not fitted to pass.',
  phases: [
    { title: 'Discover', detail: 'list all tracked test files (backend pytest, FE vitest, FE playwright)', model: 'sonnet' },
    { title: 'Audit', detail: 'one agent per test file: read test + its production source, hunt fake-pass anti-patterns', model: 'sonnet' },
    { title: 'Verify', detail: 'independent skeptic re-checks each medium+ finding against the source (adversarial, Opus)' },
  ],
}

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------
const SEV = { critical: 4, high: 3, medium: 2, low: 1 }
const VERIFY_THRESHOLD = 2 // adversarially verify every finding of severity medium and above

function shortLabel(p) {
  const parts = String(p).split('/')
  return parts.slice(-2).join('/')
}

// --------------------------------------------------------------------------
// Schemas
// --------------------------------------------------------------------------
const DISCOVER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['backend', 'frontendUnit', 'frontendE2e'],
  properties: {
    backend: { type: 'array', items: { type: 'string' } },
    frontendUnit: { type: 'array', items: { type: 'string' } },
    frontendE2e: { type: 'array', items: { type: 'string' } },
  },
}

const AUDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['file', 'category', 'sourceFilesRead', 'testCaseCount', 'verdict', 'findings', 'summary'],
  properties: {
    file: { type: 'string' },
    category: { type: 'string', enum: ['backend', 'frontend-unit', 'frontend-e2e'] },
    sourceFilesRead: {
      type: 'array',
      items: { type: 'string' },
      description: 'Production source files you actually opened to judge whether these tests verify real behavior.',
    },
    testCaseCount: { type: 'integer' },
    verdict: { type: 'string', enum: ['CLEAN', 'MINOR_ISSUES', 'FAKE_PASSES_FOUND', 'COULD_NOT_LOCATE_SOURCE'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['testName', 'line', 'antiPattern', 'severity', 'evidence', 'whatRealTestWouldDo', 'mutationItWouldMiss', 'confidence'],
        properties: {
          testName: { type: 'string' },
          line: { type: 'integer', description: 'Line number in the TEST file where the issue lives.' },
          antiPattern: { type: 'string', description: 'Short label from the taxonomy, e.g. mock-the-SUT, assert-without-call, assertion-free.' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          evidence: { type: 'string', description: 'Quote the exact offending code and explain why it passes regardless of source correctness.' },
          whatRealTestWouldDo: { type: 'string' },
          mutationItWouldMiss: { type: 'string', description: 'A concrete one-line change to the SOURCE that introduces a real bug this test would FAIL to catch. Empty string only for low-severity quality notes.' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    summary: { type: 'string' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['confirmed', 'adjustedSeverity', 'mutationConfirmed', 'reasoning', 'fixSuggestion'],
  properties: {
    confirmed: { type: 'boolean', description: 'true ONLY if, after reading the code yourself, you independently agree this test stays green even when the production code is broken.' },
    mutationConfirmed: { type: 'boolean', description: 'Did you confirm the claimed (or a stronger) source mutation would actually still pass this test?' },
    adjustedSeverity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'not-an-issue'] },
    reasoning: { type: 'string' },
    fixSuggestion: { type: 'string' },
  },
}

// --------------------------------------------------------------------------
// Source-location guidance per category
// --------------------------------------------------------------------------
const PATHS = {
  'backend': 'Python imports like "from app.application.use_cases.manage_tasks import UpdateTaskUseCase" map to Backend/app/application/use_cases/manage_tasks.py. Use Glob/Grep under Backend/app to locate the module under test. Also read shared fixtures in Backend/tests/conftest.py and the nearest tests/integration/conftest.py when a test relies on fixtures (client, db_session, async_session, authenticated_client, permitted_client) — those fixtures determine whether an "integration" test actually hits the real test database.',
  'frontend-unit': 'Imports like "@/lib/audit-formatter" map to Frontend2/lib/audit-formatter.ts; "@/components/..." to Frontend2/components/... (.ts or .tsx); "@/hooks/...", "@/services/..." likewise. Relative imports ("./x") are siblings of the test file. Read the component/hook/service/util actually under test, plus any test helpers (e.g. Frontend2/test/helpers/render-with-providers).',
  'frontend-e2e': 'Playwright specs live in Frontend2/e2e. The "source under test" is the app behavior the spec drives — read the relevant pages under Frontend2/app and components under Frontend2/components that the spec exercises, plus any e2e fixtures/helpers/mocks in Frontend2/e2e. Note whether the spec runs against a real backend or stubs routes via page.route() — heavy route-stubbing can reduce an E2E test to asserting its own mock.',
}

// --------------------------------------------------------------------------
// Rubrics (no backtick characters inside — keeps the template literals clean)
// --------------------------------------------------------------------------
const RUBRIC_COMMON = [
  'A FAKE PASS is a test that PASSES but would KEEP passing even if the production code it claims to cover were broken. Hunt these patterns:',
  '1. ASSERTION-FREE / NO-OP — runs code but asserts nothing meaningful, or only asserts something always true: expect(true).toBe(true); assert 1 == 1; asserting a literal/const the test itself just defined; assert <obj> (truthy on a freshly built object).',
  '2. TAUTOLOGICAL / CIRCULAR — asserts a value equals itself; OR asserts output equals the EXACT canned value a mock was told to return while the production code merely forwards it untouched (no real transformation/logic exercised). NOTE: asserting a value that was genuinely transformed from mocked input is FINE.',
  '3. MOCK-THE-SUT — the very function/class/component/endpoint under test is itself mocked or stubbed, so the assertion checks the mock, not real code.',
  '4. OVER-MOCKING HOLLOW-OUT — so much is mocked that NO production logic runs on the asserted path; the test only proves the mocks were wired together.',
  '5. DISABLED-BUT-COUNTED — .skip / xit / it.skip / describe.skip / test.skip / test.fixme / @pytest.mark.skip / pytest.skip() mid-body / early return before asserts / commented-out assertions / .only (silently disables sibling tests in the file).',
  '6. SWALLOWED FAILURE — assertions inside try/except or try/catch that swallow the error; assertions guarded by a condition that is never true; assertions inside a callback that is never invoked.',
  '7. WEAK-ONLY MATCHER ON THE KEY CLAIM — the central behavior the test name promises is asserted ONLY via toBeDefined / toBeTruthy / not.toThrow / expect.anything / "is not None" / a truthy (not equality) status-code check.',
  '8. CHARACTERIZATION-OF-A-BUG — the expected value looks copied from actual output (including wrong/garbage values) rather than derived independently from the spec, locking in current behavior whether or not it is correct.',
].join('\n')

const RUBRIC_BACKEND = [
  'BACKEND / pytest-specific fake passes:',
  '- ASSERT-WITHOUT-CALL: mock.assert_called_once / assert_called / assert_called_once_with / assert_awaited / assert_awaited_once written WITHOUT parentheses — this only accesses the attribute and NEVER asserts, so it ALWAYS passes. Also "assert mock.called_once" (no such attribute -> a child MagicMock -> always truthy). This is a CRITICAL fake pass.',
  '- BROAD pytest.raises: pytest.raises(Exception) or a base class where an unintended error (AttributeError/TypeError from a typo, ImportError) would also satisfy it — the test can pass for the WRONG reason. The expected type should be the specific domain exception; ideally the test also asserts on the exception attributes/message.',
  '- UNAWAITED ASYNC: an async use-case/coroutine called without await; asserting on a coroutine object (always truthy); an AsyncMock configured but its call path never awaited.',
  '- FAKE INTEGRATION: a test under tests/integration/ (or named *_api*) that overrides EVERY dependency with mocks returning canned data, so the router logic, Pydantic serialization, and DB/ORM mapping never execute. Real integration tests use the db_session/client/authenticated_client/permitted_client fixtures and assert on persisted or serialized results.',
  '- SELF-ASSERTION: a "DB" test that never commits/queries and asserts only on the in-memory object it just constructed.',
  '- STATUS-CODE-ONLY: an API test that asserts only response.status_code and never checks the response body or the DB side effect the endpoint is supposed to produce. (status + body/side-effect together is fine.)',
].join('\n')

const RUBRIC_FE_UNIT = [
  'FRONTEND unit/component (Vitest + Testing Library) fake passes:',
  '- MOCK-THE-SUT: vi.mock() of the very module/component/hook under test, then asserting on the mock instead of real output.',
  '- MISSING AWAIT: async test that does not await/return expect(...).resolves/.rejects, waitFor(...), findBy*, or user-event interactions — the assertion may never settle and failures get swallowed as unhandled rejections.',
  '- RENDER-WITHOUT-ASSERT: renders a component but asserts nothing, or only expect(container).toBeTruthy() / that it "did not throw".',
  '- SNAPSHOT-ONLY: toMatchSnapshot / toMatchInlineSnapshot as the SOLE assertion (records whatever the component currently outputs, bugs included).',
  '- QUERY-WITHOUT-ASSERT: calls queryBy*/getBy* but never asserts on the content/state/behavior the test name promises.',
  '- MOCK-CALLED-ONLY: mocks a hook/service and asserts only that it "was called", never that the component rendered/behaved correctly as a result.',
  'NOTE: boundary mocks — mocking @/lib/api-client, network, or a leaf child component while the component/hook under test runs for real — are GOOD design, NOT findings.',
].join('\n')

const RUBRIC_FE_E2E = [
  'FRONTEND E2E (Playwright) fake passes:',
  '- DISABLED: test.skip / test.fixme / test.only / conditionally-skipped tests.',
  '- ACTION-WITHOUT-ASSERT: navigates or clicks but never expect(...) on the resulting state; or asserts only toHaveURL when the test name promises a data/behavior outcome.',
  '- SWALLOWED: try { ... } catch {} around steps; expect.soft(...) whose soft failures are never surfaced; awaiting locators but never asserting on them.',
  '- ESCAPE-HATCH CONDITIONALS: if (await x.isVisible()) { ...asserts... } so the meaningful assertions are skipped (test still passes) whenever the feature/element is absent.',
  '- VISIBLE-ONLY: asserts toBeVisible() on a static shell element while the real behavior (data loaded, mutation persisted, validation fired) is never checked.',
  'NOTE in evidence whether the spec stubs the backend via page.route — heavy stubbing can reduce an "E2E" test to asserting its own mock.',
].join('\n')

const RUBRIC = {
  'backend': RUBRIC_BACKEND,
  'frontend-unit': RUBRIC_FE_UNIT,
  'frontend-e2e': RUBRIC_FE_E2E,
}

const ANTIBIAS = [
  'ANTI-BIAS RULES (read carefully — false findings are worse than missed nits):',
  '- The MAJORITY of these tests are likely well-written. "CLEAN" is the correct, expected verdict for most files. Do NOT manufacture issues to appear thorough.',
  '- Boundary mocks are GOOD: mocking the DB/repo/HTTP client/network while the use-case / service / mapping / component logic runs for real is correct design, NOT a fake pass.',
  '- A precise assertion on a value transformed from mocked input is GOOD, even though a mock supplied the input.',
  '- For EVERY finding you report, you MUST be able to name mutationItWouldMiss: a concrete one-line change to the SOURCE that introduces a real bug this test would FAIL to catch (the test stays green). If you cannot name one, it is NOT a fake pass — drop it, or record it at most as a low-severity quality note with mutationItWouldMiss="".',
  '- Severity: "critical" = passes with NO dependence on source correctness (mock-the-SUT, assert-without-call, assertion-free, disabled-but-counted). "high" = a realistic source bug on the covered path would slip through. "medium" = weak assertion that could miss some regressions. "low" = quality nit.',
].join('\n')

// --------------------------------------------------------------------------
// Prompts
// --------------------------------------------------------------------------
const DISCOVER_PROMPT = [
  'List EVERY tracked test file in this repository (run from the repo root). Use git so node_modules and untracked files are excluded.',
  '',
  'Run exactly these and capture the FULL output (do not sample, summarize, or truncate — no ellipsis):',
  '- Backend pytest:  git ls-files "Backend/**/test_*.py" "Backend/**/*_test.py"',
  '- Frontend unit/component (Vitest):  git ls-files "Frontend2/**/*.test.ts" "Frontend2/**/*.test.tsx" "Frontend2/**/*.test.js" "Frontend2/**/*.test.jsx"',
  '- Frontend E2E (Playwright):  git ls-files "Frontend2/**/*.spec.ts"',
  '',
  'Exclude any path containing node_modules. Return three arrays — backend, frontendUnit, frontendE2e — containing EVERY path verbatim with forward slashes. The expected counts are roughly: backend ~105, frontendUnit ~127, frontendE2e ~17. If your counts are far below that, you truncated — re-run and return them all.',
].join('\n')

function auditPrompt(file, category) {
  return [
    'You are auditing ONE test file for FAKE PASSES — tests that pass but do not actually verify the production code is correct. A fake pass stays green even when the code it claims to cover is broken, giving false confidence. Take your time; do not skim.',
    '',
    'TEST FILE: ' + file,
    'CATEGORY: ' + category,
    '',
    'STEP 1 — Read the ENTIRE test file: ' + file,
    '',
    'STEP 2 — Locate and READ the production source the tests claim to cover. This is MANDATORY — you cannot judge a test without reading what it tests.',
    PATHS[category],
    'Record the source paths you actually opened in sourceFilesRead. If after a genuine effort you cannot find the source (e.g. the test imports symbols that do not exist), set verdict="COULD_NOT_LOCATE_SOURCE" and explain — that is itself a red flag.',
    '',
    'STEP 3 — For EACH test case (each it()/test()/def test_*), ask: "If I introduced a realistic bug into the production code path this test claims to cover, would THIS test fail?" If it would still pass, it is a fake pass.',
    '',
    RUBRIC_COMMON,
    '',
    RUBRIC[category],
    '',
    ANTIBIAS,
    '',
    'OUTPUT (structured): set testCaseCount to the number of test cases. For each finding give testName, the LINE NUMBER in the test file, the antiPattern label, severity, evidence (quote the exact offending code), whatRealTestWouldDo, mutationItWouldMiss, and confidence (0-1). verdict = FAKE_PASSES_FOUND if any critical/high finding; MINOR_ISSUES if only medium/low; CLEAN if none. summary = one honest sentence on the file.',
  ].join('\n')
}

function verifyPrompt(file, category, f) {
  return [
    'You are an INDEPENDENT SKEPTIC verifying ONE fake-pass finding raised by another auditor. Default stance: this may be a FALSE POSITIVE. Confirm it ONLY if, after reading the code yourself, you independently agree the test would stay green even when the production code is broken.',
    '',
    'TEST FILE: ' + file + ' (category ' + category + ')',
    'FINDING:',
    '  test: ' + f.testName + ' (line ' + f.line + ')',
    '  anti-pattern: ' + f.antiPattern + ' [auditor severity: ' + f.severity + ']',
    '  evidence: ' + f.evidence,
    '  claimed mutation the test would miss: ' + (f.mutationItWouldMiss || '(none given)'),
    '',
    'DO THIS:',
    '1. Read the test file AND the relevant production source yourself. Verify the auditor quotes are accurate — do not trust them blindly.',
    '2. Apply the claimed mutation (or a stronger one) to the SOURCE in your head. Would THIS specific test still PASS with that bug present? If yes -> confirmed=true. If the test would actually FAIL (it catches the bug) -> confirmed=false (false positive).',
    '3. Reject misflags: boundary mocks (DB/HTTP/repo/network) with real logic under test are GOOD; a precise assertion on a transformed value is GOOD even if a mock fed the input; an honest smoke test that asserts something real is fine.',
    '',
    'Return: confirmed, mutationConfirmed (did you confirm the mutation would actually still pass the test?), adjustedSeverity (critical/high/medium/low/not-an-issue), reasoning (cite exact code), fixSuggestion (the concrete assertion or change that makes this test real).',
  ].join('\n')
}

// --------------------------------------------------------------------------
// Run
// --------------------------------------------------------------------------
phase('Discover')
const disc = await agent(DISCOVER_PROMPT, { label: 'discover-test-files', phase: 'Discover', model: 'sonnet', schema: DISCOVER_SCHEMA })

const files = [
  ...((disc && disc.backend) || []).map((f) => ({ file: f, category: 'backend' })),
  ...((disc && disc.frontendUnit) || []).map((f) => ({ file: f, category: 'frontend-unit' })),
  ...((disc && disc.frontendE2e) || []).map((f) => ({ file: f, category: 'frontend-e2e' })),
]

if (!files.length) {
  return { error: 'No test files discovered', disc }
}

log(
  'Discovered ' + files.length + ' test files — ' +
  ((disc.backend || []).length) + ' backend, ' +
  ((disc.frontendUnit || []).length) + ' FE-unit, ' +
  ((disc.frontendE2e || []).length) + ' FE-e2e. Auditing each (read test + source), then adversarially verifying every medium+ finding.'
)

phase('Audit')
const results = await pipeline(
  files,
  (item) => agent(auditPrompt(item.file, item.category), {
    label: 'audit:' + shortLabel(item.file),
    phase: 'Audit',
    model: 'sonnet',
    schema: AUDIT_SCHEMA,
  }),
  (audit, item) => {
    if (!audit) return null
    const toVerify = (audit.findings || []).filter((f) => (SEV[f.severity] || 0) >= VERIFY_THRESHOLD)
    if (!toVerify.length) return { audit, verified: [] }
    return parallel(
      toVerify.map((f) => () =>
        agent(verifyPrompt(item.file, item.category, f), {
          label: 'verify:' + shortLabel(item.file),
          phase: 'Verify',
          schema: VERIFY_SCHEMA,
        })
          .then((v) => ({ finding: f, verdict: v }))
          .catch(() => null)
      )
    ).then((vs) => ({ audit, verified: vs.filter(Boolean) }))
  }
)

// --------------------------------------------------------------------------
// Aggregate
// --------------------------------------------------------------------------
const ok = results.filter((r) => r && r.audit)

const perFile = ok.map((r) => ({
  file: r.audit.file,
  category: r.audit.category,
  verdict: r.audit.verdict,
  findingCount: (r.audit.findings || []).length,
  sourceFilesRead: (r.audit.sourceFilesRead || []).length,
}))

const confirmedFindings = []
const refutedFindings = []
for (const r of ok) {
  for (const v of (r.verified || [])) {
    const base = {
      file: r.audit.file,
      category: r.audit.category,
      testName: v.finding.testName,
      line: v.finding.line,
      antiPattern: v.finding.antiPattern,
      auditorSeverity: v.finding.severity,
      evidence: v.finding.evidence,
      mutationItWouldMiss: v.finding.mutationItWouldMiss,
      whatRealTestWouldDo: v.finding.whatRealTestWouldDo,
    }
    if (v.verdict && v.verdict.confirmed) {
      confirmedFindings.push({
        ...base,
        severity: v.verdict.adjustedSeverity,
        mutationConfirmed: v.verdict.mutationConfirmed,
        reasoning: v.verdict.reasoning,
        fixSuggestion: v.verdict.fixSuggestion,
      })
    } else {
      refutedFindings.push({
        ...base,
        reasoning: v.verdict ? v.verdict.reasoning : 'verifier returned null',
      })
    }
  }
}

const lowNotes = []
for (const r of ok) {
  for (const f of (r.audit.findings || [])) {
    if ((SEV[f.severity] || 0) < VERIFY_THRESHOLD) {
      lowNotes.push({
        file: r.audit.file,
        category: r.audit.category,
        testName: f.testName,
        line: f.line,
        antiPattern: f.antiPattern,
        severity: f.severity,
        evidence: f.evidence,
      })
    }
  }
}

const countSev = (s) => confirmedFindings.filter((f) => f.severity === s).length
const totals = {
  filesDiscovered: files.length,
  filesAudited: ok.length,
  auditAgentsDropped: results.length - ok.length,
  clean: perFile.filter((p) => p.verdict === 'CLEAN').length,
  minorIssues: perFile.filter((p) => p.verdict === 'MINOR_ISSUES').length,
  fakePassesFound: perFile.filter((p) => p.verdict === 'FAKE_PASSES_FOUND').length,
  couldNotLocateSource: perFile.filter((p) => p.verdict === 'COULD_NOT_LOCATE_SOURCE').length,
  confirmedCritical: countSev('critical'),
  confirmedHigh: countSev('high'),
  confirmedMedium: countSev('medium'),
  confirmedTotal: confirmedFindings.length,
  refutedAsFalsePositive: refutedFindings.length,
  lowSeverityNotes: lowNotes.length,
}

log(
  'Audit complete. ' + totals.confirmedTotal + ' confirmed findings (' +
  totals.confirmedCritical + ' critical, ' + totals.confirmedHigh + ' high, ' +
  totals.confirmedMedium + ' medium); ' + totals.refutedAsFalsePositive +
  ' refuted as false positives; ' + totals.clean + '/' + totals.filesAudited + ' files clean.'
)

return {
  totals,
  confirmedFindings,
  refutedFindings,
  lowSeverityNotes: lowNotes,
  problemFiles: perFile.filter((p) => p.verdict !== 'CLEAN'),
  perFile,
}
