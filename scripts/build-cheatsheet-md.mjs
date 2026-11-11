// src/data/resumeProjects.ts → docs/PORTFOLIO_RESUME_CHEATSHEET.md
// 화면(자소서 치트시트 탭)과 마스터 문서가 같은 데이터에서 나오도록 생성합니다.
// 실행: npm run cheatsheet:md
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src/data/resumeProjects.ts'), 'utf8');
const { code } = transformSync(source, { loader: 'ts', format: 'esm' });
const { PROJECTS_STRUCTURED, CHEATSHEET_UPDATED_AT, COMPETENCIES, JOB_TRACKS } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);

const repoName = (p) => p.repo.split('/')[1];
const compLabels = (ids) => ids.map((c) => COMPETENCIES[c].label).join(', ');
const projectComps = (p) => [...new Set([...p.risksAndSolutions.flatMap((r) => r.competencies), ...(p.extraCompetencies || [])])];
const byId = Object.fromEntries(PROJECTS_STRUCTURED.map((p) => [p.id, p]));

const lines = [
  '# 🎯 자소서·면접 프로젝트별 핵심 정리 (고종한 / rhwhdgks)',
  '> **소속:** 고려대학교 컴퓨터공학 전공 / 퀀트 학회 **Find-A**  ',
  '> **핵심 스택:** Python, SQL, pandas, NumPy, PyTorch, FastAPI, MariaDB, Linux, TypeScript  ',
  '> **포맷:** [계기] ➔ [요약] ➔ [위험상황 및 해결한 방법(원인 → 해결 → 결과)] ➔ [한계]  ',
  `> **최종 정리:** ${CHEATSHEET_UPDATED_AT} · 근거: 각 GitHub 저장소 README·문서와 Codex 작업 대화 기록  `,
  '> 이 문서는 `src/data/resumeProjects.ts`에서 `npm run cheatsheet:md`로 생성합니다. 내용을 고칠 때는 데이터 파일을 수정하세요.',
  '',
  '## 목차',
  '',
  ...PROJECTS_STRUCTURED.map((p, i) => `${i + 1}. ${p.title} (\`${repoName(p)}\`) · ${p.period}`),
  '',
  '## 지원 직무별 추천 순서와 핵심 역량',
  '',
  ...JOB_TRACKS.flatMap((t) => [
    `### ${t.label} — ${t.desc}`,
    '',
    `- 핵심 역량: ${compLabels(t.competencies)}`,
    ...t.order.map((id, i) => `${i + 1}. ${byId[id].shortTitle} — ${byId[id].trackFocus[t.id]}`),
    '',
  ]),
  '## 역량별 사례 찾기',
  '',
  '| 역량 | 설명 | 사례가 있는 프로젝트 |',
  '| --- | --- | --- |',
  ...Object.entries(COMPETENCIES).map(([id, c]) => {
    const ps = PROJECTS_STRUCTURED.filter((p) => projectComps(p).includes(id)).map((p) => p.shortTitle);
    return `| ${c.label} | ${c.desc} | ${ps.join(', ')} |`;
  }),
  '',
];

PROJECTS_STRUCTURED.forEach((p, i) => {
  const repoCell = p.isPrivate ? `\`${p.repo}\` (비공개 저장소)` : `[${p.repo}](${p.repoUrl})`;
  lines.push(
    '---',
    '',
    `## ${i + 1}. ${p.title} (\`${repoName(p)}\`)`,
    '',
    '| 항목 | 내용 |',
    '| --- | --- |',
    `| 분야 | ${p.category} |`,
    `| 기간 | ${p.period} |`,
    `| 역할 | ${p.role} |`,
    `| 기술 | ${p.stack.join(', ')} |`,
    `| 역량 | ${compLabels(projectComps(p))} |`,
    `| 저장소 | ${repoCell} |`,
  );
  if (p.demoUrl) lines.push(`| 서비스 | [${p.demoUrl.replace(/^https?:\/\//, '')}](${p.demoUrl}) |`);
  lines.push(
    '',
    `**핵심 수치:** ${p.highlights.map((h) => `${h.label} **${h.value}**`).join(' · ')}`,
    '',
    '### 30초 요약',
    '',
    p.pitch30,
    '',
    '### 2분 설명',
    '',
    ...p.pitch2min.flatMap((para) => [para, '']),
    '### 직무별 강조점',
    '',
    ...JOB_TRACKS.map((t) => `- **${t.label}:** ${p.trackFocus[t.id]}`),
    '',
    '### 1. 계기 (Motivation)',
    '',
    p.motivation,
    '',
    '### 2. 요약 (Summary)',
    '',
    p.summary,
    '',
    ...p.summaryPoints.map((s) => `- ${s}`),
    '',
    '### 3. 위험상황 및 해결한 방법 (Risk & Solutions)',
    '',
  );
  p.risksAndSolutions.forEach((r, ri) => {
    lines.push(`**위험 ${ri + 1}: ${r.risk}**`, '', `- 역량: ${compLabels(r.competencies)}`);
    if (r.cause) lines.push(`- 원인: ${r.cause}`);
    lines.push(`- ➔ 해결: ${r.solution}`);
    if (r.result) lines.push(`- ✓ 결과: ${r.result}`);
    lines.push('');
  });
  lines.push('### 4. 한계 (Limitations)', '', ...p.limitations.map((l) => `- ${l}`), '');
});

const out = join(root, 'docs/PORTFOLIO_RESUME_CHEATSHEET.md');
writeFileSync(out, `${lines.join('\n').trimEnd()}\n`);
console.log(`wrote ${out} (${PROJECTS_STRUCTURED.length} projects)`);
