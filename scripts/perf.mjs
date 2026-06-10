/* Ship gate: Lighthouse (mobile emulation, simulated 4G throttling — the
 * Lighthouse default) against the production build, budgets from
 * docs/PERFORMANCE.md. Exits non-zero when any gate fails, so this can guard
 * CI or a pre-push hook.
 *
 *   npm run perf              # build, serve, audit /
 *   npm run perf -- --no-build --path=/index
 *
 * INP cannot be measured in a lab run; Total Blocking Time is the standard
 * lab proxy and gets the 200ms budget.
 */
import { execSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';

const args = process.argv.slice(2);
const skipBuild = args.includes('--no-build');
const path = (args.find((a) => a.startsWith('--path=')) ?? '--path=/').slice('--path='.length);
// lab numbers are noisy on a busy machine — gate on the median of N runs
const runs = Number((args.find((a) => a.startsWith('--runs=')) ?? '--runs=1').slice('--runs='.length));
const PORT = 4173;
const URL = `http://localhost:${PORT}${path}`;

const BUDGETS = [
	{ label: 'Lighthouse perf', value: (r) => r.categories.performance.score * 100, min: 85, unit: '' },
	{ label: 'LCP', value: (r) => r.audits['largest-contentful-paint'].numericValue, max: 2500, unit: 'ms' },
	{ label: 'CLS', value: (r) => r.audits['cumulative-layout-shift'].numericValue, max: 0.05, unit: '' },
	{ label: 'TBT (INP proxy)', value: (r) => r.audits['total-blocking-time'].numericValue, max: 200, unit: 'ms' }
];

if (!skipBuild) execSync('npm run build', { stdio: 'inherit' });

const preview = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], {
	stdio: ['ignore', 'inherit', 'inherit'],
	shell: true,
	detached: true
});
preview.on('error', (err) => {
	console.error('preview server failed to start:', err);
	process.exit(1);
});

try {
	await waitForServer(URL);
	mkdirSync('reports', { recursive: true });
	const reports = [];
	for (let i = 0; i < runs; i++) {
		execSync(
			`npx lighthouse ${URL} --only-categories=performance ` +
				`--output=json --output=html --output-path=reports/lighthouse ` +
				`--chrome-flags="--headless=new" --quiet`,
			{ stdio: 'inherit', env: { ...process.env, CHROME_PATH: chromePath() } }
		);
		reports.push(JSON.parse(readFileSync('reports/lighthouse.report.json', 'utf8')));
	}

	let failed = false;
	console.log(`\nPerf gate — ${URL}${runs > 1 ? ` (median of ${runs})` : ''}`);
	for (const b of BUDGETS) {
		const v = median(reports.map(b.value));
		const ok = b.min !== undefined ? v >= b.min : v <= b.max;
		failed ||= !ok;
		const bound = b.min !== undefined ? `>= ${b.min}` : `<= ${b.max}`;
		console.log(`  ${ok ? 'pass' : 'FAIL'}  ${b.label}: ${round(v)}${b.unit} (${bound}${b.unit})`);
	}
	console.log(failed ? '\nGate FAILED — fix before merging.' : '\nGate passed.');
	process.exitCode = failed ? 1 : 0;
} finally {
	process.kill(-preview.pid, 'SIGTERM');
}

function round(v) {
	return Math.round(v * 1000) / 1000;
}

function median(values) {
	const s = [...values].sort((a, b) => a - b);
	return s[Math.floor(s.length / 2)];
}

/* chrome-launcher only knows stock install locations; fall back to a
 * Playwright-managed Chrome for Testing when no system Chrome exists. */
function chromePath() {
	if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
	const stock = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
	if (existsSync(stock)) return stock;
	const pw = `${homedir()}/Library/Caches/ms-playwright`;
	if (existsSync(pw)) {
		for (const dir of readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
			const app = `${pw}/${dir}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
			if (existsSync(app)) return app;
		}
	}
	throw new Error('No Chrome found — set CHROME_PATH');
}

async function waitForServer(url, tries = 150) {
	for (let i = 0; i < tries; i++) {
		try {
			await fetch(url);
			return;
		} catch {
			await new Promise((r) => setTimeout(r, 200));
		}
	}
	throw new Error(`preview server never came up at ${url}`);
}
