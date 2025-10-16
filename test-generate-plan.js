// Since we need authentication to test the API endpoint,
// let's create a simple test to verify the API structure is correct
import { readFileSync } from 'fs';

// Read the API route file to verify its structure
const apiRouteContent = readFileSync('./src/app/api/generate-plan/route.ts', 'utf8');

// Check if the file contains the expected structure
const hasPOST = apiRouteContent.includes('export async function POST');
const hasGET = apiRouteContent.includes('export async function GET');
const hasAuth = apiRouteContent.includes('auth.api.getSession');
const hasPrompt = apiRouteContent.includes('studyPlanPrompt');
const hasLLM = apiRouteContent.includes('callLLM');

console.log('API Route Structure Verification:');
console.log('================================');
console.log('Has POST endpoint:', hasPOST);
console.log('Has GET endpoint:', hasGET);
console.log('Has authentication:', hasAuth);
console.log('Has prompt integration:', hasPrompt);
console.log('Has LLM integration:', hasLLM);

if (hasPOST && hasGET && hasAuth && hasPrompt && hasLLM) {
  console.log('\n✅ All required components found in the API route!');
} else {
  console.log('\n❌ Some components are missing from the API route.');
}

// Check the prompt file
const promptContent = readFileSync('./src/lib/prompts/studyPlanPrompt.ts', 'utf8');
const hasPromptTemplate = promptContent.includes('studyPlanPrompt');
const hasJSONOutput = promptContent.includes('MUST BE VALID JSON');

console.log('\nPrompt File Verification:');
console.log('========================');
console.log('Has studyPlanPrompt function:', hasPromptTemplate);
console.log('Has JSON output instruction:', hasJSONOutput);

// Check the LLM client
const llmContent = readFileSync('./src/lib/utils/llmClient.ts', 'utf8');
const hasCallLLM = llmContent.includes('callLLM');
const hasGroq = llmContent.includes('groq');

console.log('\nLLM Client Verification:');
console.log('========================');
console.log('Has callLLM function:', hasCallLLM);
console.log('Has Groq integration:', hasGroq);