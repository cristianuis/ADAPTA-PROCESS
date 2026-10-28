import { appendFileSync, existsSync, readFileSync } from "node:fs";

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (!summaryPath) throw new Error("GITHUB_STEP_SUMMARY no está disponible.");

const reportPath = "test-results/e2e-report.json";
if (!existsSync(reportPath)) {
  appendFileSync(summaryPath, "## E2E sintético\nNo se generó el reporte JSON de Playwright.\n");
  process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const failed = [];

function visitSuites(suites = []) {
  for (const suite of suites) {
    const parent = [suite.title].filter(Boolean).join(" ");
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        const errors = results
          .filter((result) => result.status === "failed" || result.status === "timedOut")
          .flatMap((result) => result.errors ?? []);
        if (errors.length || test.status === "unexpected") {
          failed.push({
            title: [parent, spec.title].filter(Boolean).join(" › "),
            location: `${suite.file ?? ""}:${spec.line ?? ""}`,
            messages: errors.map((error) => error.message ?? error.value ?? "Fallo sin mensaje"),
          });
        }
      }
    }
    visitSuites(suite.suites);
  }
}

visitSuites(report.suites);
const lines = [
  "## E2E sintético",
  `Resultado: ${failed.length ? `${failed.length} caso(s) con fallo` : "sin errores reportados"}.`,
];
for (const test of failed) {
  lines.push(`\n### ${test.title}`, `Ubicación: \`${test.location}\``);
  for (const message of test.messages) {
    lines.push("", "```text", message.slice(0, 4000), "```");
    const annotation = message
      .replaceAll("%", "%25")
      .replaceAll("\r", "%0D")
      .replaceAll("\n", "%0A")
      .slice(0, 2000);
    process.stdout.write(`::error title=Playwright E2E::${annotation}\n`);
  }
}
appendFileSync(summaryPath, `${lines.join("\n")}\n`);
