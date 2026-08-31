import fs from 'node:fs';
import XLSX from 'xlsx';
import {
  AI_REVIEW_DECISIONS,
  AI_REVIEW_VERSION,
  DIFFICULTY_LEVELS,
  REVIEW_OUTPUT_FIELDS,
  humanReviewPriority,
  isHumanReviewPriorityAtLeastMinimum
} from '../ai-content-review-policy.js';

const file = process.argv[2];
const sheetName = process.argv[3] || 'AI Review';

if (!file) {
  console.error('Usage: node scripts/validate-ai-content-review.mjs <review-workbook.xlsx> [sheet-name]');
  process.exit(2);
}
if (!fs.existsSync(file)) {
  console.error(`AI review workbook not found: ${file}`);
  process.exit(2);
}

const workbook = XLSX.readFile(file, { raw: false });
const sheet = workbook.Sheets[sheetName];
if (!sheet) {
  console.error(`AI review sheet not found: ${sheetName}`);
  process.exit(2);
}

const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
const errors = [];
const warnings = [];
const seen = new Set();

const asBool = value => {
  const v = String(value ?? '').trim().toLowerCase();
  if (['true','yes','1'].includes(v)) return true;
  if (['false','no','0'].includes(v)) return false;
  return null;
};
const clean = value => String(value ?? '').trim();
const validHash = value => /^[0-9a-f]{64}$/.test(clean(value));

for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  const rowNumber = index + 2;
  const itemId = clean(row.item_id);
  if (!itemId) continue;
  if (seen.has(itemId)) errors.push(`Row ${rowNumber}: duplicate item_id ${itemId}.`);
  seen.add(itemId);

  for (const field of REVIEW_OUTPUT_FIELDS) {
    if (!(field in row)) errors.push(`Row ${rowNumber}: missing required column ${field}.`);
  }

  if (!validHash(row.content_hash)) errors.push(`Row ${rowNumber} (${itemId}): invalid content_hash.`);
  if (clean(row.ai_review_version) !== AI_REVIEW_VERSION) errors.push(`Row ${rowNumber} (${itemId}): ai_review_version must be ${AI_REVIEW_VERSION}.`);
  if (!AI_REVIEW_DECISIONS.includes(clean(row.ai_decision))) errors.push(`Row ${rowNumber} (${itemId}): invalid ai_decision.`);

  const authorDifficulty = Number(row.author_difficulty);
  if (![1,2,3].includes(authorDifficulty)) errors.push(`Row ${rowNumber} (${itemId}): author_difficulty must be 1, 2, or 3.`);
  const aiDifficulty = clean(row.ai_difficulty).toLowerCase();
  if (!DIFFICULTY_LEVELS.includes(aiDifficulty)) errors.push(`Row ${rowNumber} (${itemId}): ai_difficulty must be easy, medium, or hard.`);

  const answerKeyValid = asBool(row.ai_answer_key_valid);
  const ambiguityFlag = asBool(row.ai_ambiguity_flag);
  const changed = asBool(row.difficulty_changed);
  if (answerKeyValid === null) errors.push(`Row ${rowNumber} (${itemId}): ai_answer_key_valid must be TRUE/FALSE.`);
  if (ambiguityFlag === null) errors.push(`Row ${rowNumber} (${itemId}): ai_ambiguity_flag must be TRUE/FALSE.`);
  if (changed === null) errors.push(`Row ${rowNumber} (${itemId}): difficulty_changed must be TRUE/FALSE.`);

  const confidence = Number(row.ai_confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) errors.push(`Row ${rowNumber} (${itemId}): ai_confidence must be between 0 and 1.`);

  const minimumPriority = humanReviewPriority({
    decision: clean(row.ai_decision),
    confidence,
    difficultyChanged: changed,
    ambiguityFlag,
    answerKeyValid
  });
  const actualPriority = clean(row.human_review_priority).toLowerCase();
  if (!isHumanReviewPriorityAtLeastMinimum(actualPriority, minimumPriority)) {
    errors.push(`Row ${rowNumber} (${itemId}): human_review_priority must be ${minimumPriority} or more conservative.`);
  } else if (actualPriority !== minimumPriority) {
    warnings.push(`Row ${rowNumber} (${itemId}): human_review_priority is conservatively escalated from ${minimumPriority} to ${actualPriority}.`);
  }
  if (!clean(row.ai_notes)) warnings.push(`Row ${rowNumber} (${itemId}): ai_notes is blank.`);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(clean(row.reviewed_at))) errors.push(`Row ${rowNumber} (${itemId}): reviewed_at must be an ISO timestamp.`);

  // Fail closed if someone attempts to turn an AI record into a production approval artifact.
  for (const forbidden of ['production_approved','qa_status','accuracy_review','alignment_review','editorial_review','bias_accessibility_review','originality_review']) {
    if (clean(row[forbidden])) errors.push(`Row ${rowNumber} (${itemId}): forbidden production/human-approval field ${forbidden} is populated in the AI review artifact.`);
  }
}

if (!rows.length) errors.push('AI review sheet contains no data rows.');

if (warnings.length) {
  console.warn(`AI review validation warnings (${warnings.length}):`);
  for (const warning of warnings.slice(0, 50)) console.warn(`- ${warning}`);
  if (warnings.length > 50) console.warn(`- ... ${warnings.length - 50} more warnings`);
}

if (errors.length) {
  console.error(`AI review validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`- ... ${errors.length - 100} more errors`);
  process.exit(1);
}

console.log(`AI review validation passed for ${seen.size} item(s).`);
console.log('AI records remain advisory only and cannot satisfy human production-approval gates.');
