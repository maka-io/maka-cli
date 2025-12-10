#!/usr/bin/env node

/**
 * Postinstall script to patch @maka/maka-cli for special characters in paths
 *
 * This fixes an issue where paths containing '&' (ampersand) would cause
 * config files to not be read properly on Meteor app startup.
 *
 * The issue was in mpi.class.js where:
 * 1. spawn() was called with shell: true, causing '&' to be interpreted as a shell operator
 * 2. execSync() used string concatenation without proper escaping
 */

const fs = require('fs');
const path = require('path');

const PATCH_MARKER = '// PATCHED: Fix for special characters in paths';

function findMakaCliPath() {
    // Try to find @maka/maka-cli in node_modules
    const possiblePaths = [
        path.join(__dirname, '..', 'node_modules', '@maka', 'maka-cli'),
        path.join(__dirname, '..', '..', '@maka', 'maka-cli'),
        path.join(__dirname, '..', '..', '..', 'node_modules', '@maka', 'maka-cli'),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
}

function applyPatch() {
    const makaCliPath = findMakaCliPath();

    if (!makaCliPath) {
        console.log('maka-cli patch: @maka/maka-cli not found, skipping patch');
        return;
    }

    const mpiPath = path.join(makaCliPath, 'bundle', 'typescript', 'src', 'tools', 'mpi', 'mpi.class.js');

    if (!fs.existsSync(mpiPath)) {
        console.log('maka-cli patch: mpi.class.js not found at expected path, skipping patch');
        return;
    }

    let content = fs.readFileSync(mpiPath, 'utf8');

    // Check if already patched
    if (content.includes(PATCH_MARKER)) {
        console.log('maka-cli patch: Already patched, skipping');
        return;
    }

    let patched = false;

    // Patch 1: Fix getGlobalMeteorVersion - replace execSync with spawnSync
    // Original: execSync(`${this.meteor} --version`, { ... })
    const execSyncPattern = /meteorVersion = execSync\(`\$\{this\.meteor\} --version`/;
    if (execSyncPattern.test(content)) {
        content = content.replace(
            /meteorVersion = execSync\(`\$\{this\.meteor\} --version`, \{[\s\S]*?stdio: ['"]ignore['"],[\s\S]*?cwd: this\.fsi\.findAppDirectory\(\),[\s\S]*?env: \{[\s\S]*?\},[\s\S]*?\}\)\.toString\(\)/,
            `(() => {
                    // ${PATCH_MARKER} (getGlobalMeteorVersion)
                    const { spawnSync } = require('child_process');
                    const result = spawnSync(this.meteor, ['--version'], {
                        stdio: 'pipe',
                        cwd: this.fsi.findAppDirectory(),
                        env: {
                            ...process.env,
                            HTTP_PROXY: 'http://127.0.0.1:9999',
                            HTTPS_PROXY: 'http://127.0.0.1:9999',
                        },
                    });
                    return result.status === 0 && result.stdout ? result.stdout.toString() : meteorVersion;
                })()`
        );
        patched = true;
        console.log('maka-cli patch: Fixed getGlobalMeteorVersion');
    }

    // Patch 2: Remove shell: true from spawn in invokeMeteorCommand
    // Original: shell: true
    const shellTruePattern = /spawn\(this\.meteor, runArgs, \{[\s\S]*?shell: true[\s\S]*?\}\)/;
    if (shellTruePattern.test(content)) {
        content = content.replace(
            /shell: true\n/g,
            `// shell: true - REMOVED: ${PATCH_MARKER}\n`
        );
        patched = true;
        console.log('maka-cli patch: Removed shell: true from spawn calls');
    }

    // Patch 3: Fix execSync calls with string interpolation in invokeMeteorCommand
    // Original: execSync(`${this.meteor} ${runArgs.join(' ')}`, { stdio: 'inherit' });
    const execSyncCommandPattern = /execSync\(`\$\{this\.meteor\} \$\{runArgs\.join\(' '\)\}`/g;
    if (execSyncCommandPattern.test(content)) {
        content = content.replace(
            /execSync\(`\$\{this\.meteor\} \$\{runArgs\.join\(' '\)\}`, \{ stdio: 'inherit' \}\);/g,
            `(() => {
                    // ${PATCH_MARKER} (invokeMeteorCommand)
                    const { spawnSync } = require('child_process');
                    const result = spawnSync(this.meteor, runArgs, { stdio: 'inherit' });
                    if (result.error) throw result.error;
                    if (result.status !== 0) process.exit(result.status || 1);
                })();`
        );
        content = content.replace(
            /execSync\(`\$\{this\.meteor\} \$\{runArgs\.join\(' '\)\}`, \{ stdio: 'inherit', cwd \}\);/g,
            `(() => {
                    // ${PATCH_MARKER} (invokeMeteorCommand with cwd)
                    const { spawnSync } = require('child_process');
                    const result = spawnSync(this.meteor, runArgs, { stdio: 'inherit', cwd });
                    if (result.error) throw result.error;
                    if (result.status !== 0) process.exit(result.status || 1);
                })();`
        );
        patched = true;
        console.log('maka-cli patch: Fixed execSync calls in invokeMeteorCommand');
    }

    if (patched) {
        // Add patch marker at the top
        content = `// ${PATCH_MARKER}\n` + content;
        fs.writeFileSync(mpiPath, content, 'utf8');
        console.log('maka-cli patch: Successfully patched mpi.class.js for special character support in paths');
    } else {
        console.log('maka-cli patch: No patterns matched, the file may have been updated. Manual patching may be required.');
    }
}

try {
    applyPatch();
} catch (error) {
    console.error('maka-cli patch: Error applying patch:', error.message);
    // Don't fail the install if patching fails
}
