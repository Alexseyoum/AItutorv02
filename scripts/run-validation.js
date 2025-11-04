// File: scripts/run-validation.js
const { exec } = require('child_process');

// Run the validation script
exec('node scripts/validate-sat-questions.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running validation: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`Validation stderr: ${stderr}`);
  }
  console.log(`Validation output: ${stdout}`);
});