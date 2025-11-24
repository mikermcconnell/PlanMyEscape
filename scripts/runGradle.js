const { spawn } = require('child_process');
const path = require('path');

const task = process.argv[2];
if (!task) {
  console.error('Usage: node scripts/runGradle.js <task>');
  process.exit(1);
}

const androidDir = path.join(__dirname, '..', 'android');
const gradleBinary = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

const child = spawn(gradleBinary, [task], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
