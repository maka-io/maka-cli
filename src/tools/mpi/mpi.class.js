// Meteor Process Interface - Patched for special characters in paths (e.g., &)
// This file fixes issues where paths containing '&' would be interpreted by the shell
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync, spawn, spawnSync } from 'child_process';
import { pascalCase } from "change-case";
import { Log } from '../log/log.class.js';
import { Actions } from '../actions/actions.class.js';
import { MustBeInProjectError } from '../../error.js';
const homeDir = os.homedir();
const errorHandler = (caller, error) => {
    if (process.env['MAKA_DEV'] === 'True') {
        Log.error(`Error in ${caller}`);
    }
    if (error) {
        console.error(error);
    }
};
export class MPI {
    static instance;
    fsi;
    cfg;
    pkg;
    meteor;
    meteorRelease;
    // Private constructor to prevent direct instantiation
    constructor(fsi, cfg, pkg) {
        this.fsi = fsi;
        this.cfg = cfg;
        this.pkg = pkg;
        const meteorExePath = this.getMeteorExePath();
        this.meteorRelease = this.getMeteorReleaseVersion();
        this.meteor = meteorExePath;
    }
    // Static method to get the singleton instance
    static getInstance(fsi, cfg, pkg) {
        if (!MPI.instance) {
            MPI.instance = new MPI(fsi, cfg, pkg);
        }
        return MPI.instance;
    }
    getMeteorExePath() {
        const isWin = process.platform === 'win32';
        const binaryName = isWin ? 'meteor.cmd' : 'meteor';
        return path.join(homeDir, '.meteor', 'bin', binaryName);
    }
    isMeteorInstalled() {
        try {
            const meteorCmd = this.getMeteorExePath();
            if (!fs.existsSync(meteorCmd))
                return false;
            const stats = fs.lstatSync(meteorCmd);
            if (stats.isSymbolicLink()) {
                const realPath = fs.realpathSync(meteorCmd);
                return fs.existsSync(realPath) && fs.statSync(realPath).isFile();
            }
            return stats.isFile();
        }
        catch (error) {
            return false;
        }
    }
    setMeteorReleaseVersion(version) {
        try {
            const releaseFilePath = path.join(homeDir, '.meteor', 'VERSION');
            const meteorDir = path.dirname(releaseFilePath);
            if (!fs.existsSync(meteorDir)) {
                fs.mkdirSync(meteorDir, { recursive: true });
            }
            fs.writeFileSync(releaseFilePath, version, 'utf8');
            Log.success(`Meteor release version set to ${version} in ${releaseFilePath}`);
        }
        catch (e) {
            errorHandler('setMeteorReleaseVersion()', e);
            process.exit(1);
        }
    }
    getMeteorReleaseVersion() {
        try {
            const releaseFilePath = path.join(homeDir, '.meteor', 'VERSION');
            if (fs.existsSync(releaseFilePath)) {
                const version = fs.readFileSync(releaseFilePath, 'utf8').trim();
                return version;
            }
            else {
                return null;
            }
        }
        catch (e) {
            errorHandler('getMeteorReleaseVersion()', e);
            return null;
        }
    }
    async getGlobalMeteorVersion() {
        let meteorVersion = this.getMeteorReleaseVersion() || '0.0.0';
        try {
            // FIX: Use spawnSync with array arguments instead of execSync with string interpolation
            // This properly handles paths containing special characters like '&'
            const result = spawnSync(this.meteor, ['--version'], {
                stdio: 'pipe',
                cwd: this.fsi.findAppDirectory(),
                env: {
                    ...process.env,
                    HTTP_PROXY: 'http://127.0.0.1:9999',
                    HTTPS_PROXY: 'http://127.0.0.1:9999', // point to a dummy or blocking proxy
                },
            });
            if (result.status === 0 && result.stdout) {
                meteorVersion = result.stdout.toString().replace('Meteor', '').trim();
            }
        }
        catch (error) {
            //nop
        }
        const semVerNumberCount = meteorVersion.split('.').length;
        if (semVerNumberCount < 3) {
            meteorVersion = meteorVersion + '.0';
        }
        return meteorVersion;
    }
    checkForMeteorVersionMismatch() {
        try {
            const appDir = this.fsi.findAppDirectory();
            const projectReleaseFile = path.join(appDir, '.meteor', 'release');
            if (!fs.existsSync(projectReleaseFile))
                return false;
            const projectRelease = fs.readFileSync(projectReleaseFile, 'utf8').trim();
            const systemRelease = this.getMeteorReleaseVersion();
            return projectRelease !== systemRelease;
        }
        catch (e) {
            errorHandler('checkForMeteorVersionMismatch()', e);
            return false;
        }
    }
    async maybeProxyCommandToMeteor() {
        try {
            const validMeteorCommands = [
                'open',
                'npm',
                'run',
                'update',
                'add',
                'remove',
                'list',
                'add-platform',
                'install-sdk',
                'remove-platform',
                'list-platforms',
                'configure-android',
                'build',
                'shell',
                'mongo',
                'reset',
                'authorized',
                'claim',
                'login',
                'logout',
                'whoami',
                'test-packages',
                'admin',
                'list-sites',
                'publish-release',
                'publish',
                'publish-for-arch',
                'search',
                'show',
                'node',
            ];
            const allArgs = process.argv.slice(2);
            const cmd = allArgs[0];
            const args = allArgs.slice(1);
            if (!validMeteorCommands.includes(cmd)) {
                Log.error('Command not found');
                throw Log.error('Run "maka --help" for a list of commands');
            }
            if (cmd === 'add-platform') {
                const appDirectory = this.fsi.findAppDirectory();
                const appConfig = this.cfg.getMakaProjectConfig();
                if (!appConfig) {
                    throw MustBeInProjectError;
                }
                const mobileConfigPath = path.join(appDirectory, 'mobile-config.js');
                let overWrite = false;
                if (fs.existsSync(mobileConfigPath)) {
                    overWrite = await Actions.confirm(`A mobile-config.js file already exists, overwrite? [yN]`, false);
                }
                if (typeof appDirectory === 'string') {
                    const configExists = this.fsi.isFile(mobileConfigPath);
                    if (!configExists || overWrite) {
                        const appName = (await Actions.ask(`App name? [${appConfig.appName}]`)) || appConfig.appName;
                        const mobileConfig = fs.createWriteStream(mobileConfigPath, { flags: 'w' });
                        mobileConfig.on('open', function () {
                            mobileConfig.write(`// For more information on mobile config, visit:\n`);
                            mobileConfig.write(`// https://docs.meteor.com/api/mobile-config.html\n`);
                            mobileConfig.write(`App.info({\n`);
                            mobileConfig.write(`\tid: 'com.meteor.maka.${pascalCase(appConfig.appName)}',\n`);
                            mobileConfig.write(`\tname: '${appName}',\n`);
                            mobileConfig.write(`\tversion: '0.0.1',\n`);
                            mobileConfig.write(`});\n`);
                            mobileConfig.end();
                        });
                        mobileConfig.on('finish', function () {
                            Log.success(`Mobile app configuration written to ${mobileConfigPath}`);
                        });
                    }
                    else {
                        Log.warn('A mobile-config.js already exists, not over writing');
                    }
                }
                if (args[0] === 'ios') {
                    const projectDirectory = this.fsi.findProjectDirectory();
                    if (typeof projectDirectory === 'string') {
                        await this.invokeMeteorCommand(cmd, args);
                        const pathForiOSCordova = path.join(projectDirectory, 'app', '.meteor', 'local', 'cordova-build', 'plugins', 'cordova-plugin-meteor-webapp');
                        if (pathForiOSCordova) {
                            const installArgs = ['ios-sim@latest', 'cordova@latest'];
                            await this.pkg.installNpmPackage(installArgs.join(' '), { cwd: appDirectory, saveDev: true, msg: 'Patching ios-sim and cordova' });
                            Log.notice("Don't forget these commands: \n sudo xcode-select -s /Applications/Xcode.app/Contents/Developer \n sudo gem install cocoapods \n sudo xcodebuild -license accept \n brew install ios-deploy");
                        }
                    }
                    process.exit(0);
                }
            }
            await this.invokeMeteorCommand(cmd, args);
            process.exit(0);
        }
        catch (e) {
            errorHandler('maybeProxyCommandToMeteor()', e);
            process.exit(1);
        }
    }
    getInstalledMeteorVersion(meteorVersion) {
        const isWin = process.platform === 'win32';
        const binaryName = isWin ? 'meteor.bat' : 'meteor';
        return path.join(homeDir, '.meteor', 'releases', meteorVersion, '.meteor', binaryName);
    }
    linkVersionAsCurrent(meteorVersion) {
        const isWin = process.platform === 'win32';
        const releasesDir = path.join(homeDir, '.meteor', 'releases');
        const binDir = path.join(homeDir, '.meteor', 'bin');
        const targetMeteor = path.join(releasesDir, meteorVersion, '.meteor', isWin ? 'meteor.bat' : 'meteor');
        const symlinkPath = path.join(binDir, isWin ? 'meteor.cmd' : 'meteor');
        const rootDispatcherPath = path.join(homeDir, '.meteor', isWin ? 'meteor.bat' : 'meteor');
        if (!fs.existsSync(targetMeteor)) {
            throw new Error(`Cannot link Meteor ${meteorVersion}: Target binary not found at ${targetMeteor}`);
        }
        fs.mkdirSync(binDir, { recursive: true });
        // Clean up old
        for (const file of [symlinkPath, rootDispatcherPath]) {
            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            }
            catch (err) {
                if (err.code !== 'ENOENT')
                    Log.warn(`Could not remove old file ${file}: ${err.message}`);
            }
        }
        if (isWin) {
            const wrapper = `@echo off\r\n"${targetMeteor}" %*\r\n`;
            fs.writeFileSync(symlinkPath, wrapper, { mode: 0o755 });
            fs.writeFileSync(rootDispatcherPath, wrapper, { mode: 0o755 });
        }
        else {
            fs.symlinkSync(targetMeteor, symlinkPath);
            fs.symlinkSync(targetMeteor, rootDispatcherPath);
        }
        this.setMeteorReleaseVersion(meteorVersion);
        Log.success(`Meteor ${meteorVersion} is now the active version`);
    }
    async invokeMeteorCommand(cmd, args, options) {
        try {
            const projectDir = this.fsi.findProjectDirectory();
            if (!projectDir) {
                throw new MustBeInProjectError();
            }
            if (cmd === 'run') {
                const portIdx = args.indexOf('-p');
                if (portIdx > 0) {
                    args[portIdx] = '--port';
                }
                const portLongIdx = args.indexOf('--port');
                if (portIdx > 0) {
                    let desiredPort = parseInt(args[portIdx + 1], 10);
                    desiredPort = await this.fsi.getAvailablePort(desiredPort);
                    args[portIdx + 1] = desiredPort.toString();
                }
                else if (portLongIdx > 0) {
                    let desiredPort = parseInt(args[portLongIdx + 1], 10);
                    desiredPort = await this.fsi.getAvailablePort(desiredPort);
                    args[portLongIdx + 1] = desiredPort.toString();
                }
                else {
                    let desiredPort = parseInt('3000', 10);
                    desiredPort = await this.fsi.getAvailablePort(desiredPort);
                    args = args.concat(['--port', desiredPort.toString()]);
                }
                const rawLogsIdx = args.indexOf('-r');
                if (rawLogsIdx > 0) {
                    args[rawLogsIdx] = '--raw-logs';
                }
                const inspectIdx = args.indexOf('-i');
                if (inspectIdx > 0) {
                    args[inspectIdx] = '--inspect';
                }
                const excludeIdx = args.indexOf('-x');
                if (excludeIdx > 0) {
                    args[excludeIdx] = '--exclude-archs';
                }
                const mobileSIdx = args.indexOf('-m');
                if (mobileSIdx > 0) {
                    args[mobileSIdx] = '--mobile-server';
                }
                const sslIdx = args.indexOf('--ssl');
                if (sslIdx > 0) {
                    args.splice(sslIdx, 1);
                }
                if (process.env.PORT && !args.includes('--port')) {
                    args = args.concat(['--port', process.env.PORT]);
                }
                if (process.env.BIND_IP && !args.includes('--port')) {
                    args = args.concat(['--port', process.env.BIND_IP]);
                }
            }
            const runArgs = [cmd].concat(args);
            if (this.checkForMeteorVersionMismatch()) {
                const appDir = this.fsi.findAppDirectory();
                const projectRelease = fs.readFileSync(path.join(appDir, '.meteor', 'release'), 'utf8').replace('METEOR@', '').trim();
                const systemRelease = this.getMeteorReleaseVersion();
                try {
                    Log.notice(`Attempting to use ${projectRelease}`);
                    this.linkVersionAsCurrent(projectRelease);
                }
                catch (error) {
                    Log.error(`This project's version is at ${projectRelease}, however you are using ${systemRelease}.`);
                    Log.notice(`Consider updating this project, or installing the version of Meteor using 'maka install meteor --release ${projectRelease}'`);
                    process.exit(0);
                }
            }
            const cwd = cmd === 'publish' ? undefined : this.fsi.findAppDirectory();
            // Check if logging is enabled for this command
            const shouldLog = cmd === 'run' && options?.enableLogging;
            let logStream = null;
            let logFilePath = null;
            if (shouldLog) {
                try {
                    // Set up logging
                    const env = options?.env || 'local';
                    logFilePath = this.fsi.getLogFilePath(env, 'run');
                    logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
                    // Rotate old logs
                    this.fsi.rotateLogs(env, 'run', 10);
                    // Create/update "latest" symlink or copy
                    const logsDir = this.fsi.getLogsDirectory();
                    const latestLogPath = path.join(logsDir, `run-${env}-latest.log`);
                    // Remove old latest file/symlink if it exists
                    if (fs.existsSync(latestLogPath)) {
                        try {
                            fs.unlinkSync(latestLogPath);
                        }
                        catch (err) {
                            // Ignore errors removing old latest file
                        }
                    }
                    // Create symlink to current log (or copy on Windows)
                    try {
                        if (process.platform === 'win32') {
                            // Windows: create a copy (symlinks require admin privileges)
                            fs.copyFileSync(logFilePath, latestLogPath);
                        }
                        else {
                            // Unix/Mac: create a symlink
                            fs.symlinkSync(path.basename(logFilePath), latestLogPath);
                        }
                    }
                    catch (err) {
                        // If symlink/copy fails, not critical - continue
                    }
                    // Log session start with timestamp
                    const timestamp = new Date().toISOString();
                    logStream.write(`\n${'='.repeat(80)}\n`);
                    logStream.write(`Maka Run Session Started: ${timestamp}\n`);
                    logStream.write(`Environment: ${env}\n`);
                    logStream.write(`Command: ${this.meteor} ${runArgs.join(' ')}\n`);
                    logStream.write(`${'='.repeat(80)}\n\n`);
                    // Display log file locations
                    const relativeLogPath = path.relative(process.cwd(), logFilePath);
                    const relativeLatestPath = path.relative(process.cwd(), latestLogPath);
                    Log.notice(`Logging to: ${relativeLogPath}`);
                    Log.notice(`Latest log: ${relativeLatestPath}`);
                }
                catch (err) {
                    // If logging setup fails, continue without logging
                    Log.warn(`Could not set up logging: ${err.message}`);
                    logStream = null;
                }
            }
            if (shouldLog && logStream) {
                // Use spawn for logging support
                // FIX: Remove shell: true to prevent interpretation of special characters like '&' in paths
                return new Promise((resolve, reject) => {
                    const meteorProcess = spawn(this.meteor, runArgs, {
                        cwd,
                        stdio: ['inherit', 'pipe', 'pipe'], // stdin=inherit, stdout=pipe, stderr=pipe
                        // shell: true was removed - this is the key fix for paths with '&'
                    });
                    // Helper function to format timestamp
                    const getTimestamp = () => {
                        const now = new Date();
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        const seconds = String(now.getSeconds()).padStart(2, '0');
                        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
                        return `[${hours}:${minutes}:${seconds}.${milliseconds}]`;
                    };
                    // Helper function to add timestamps to lines
                    const addTimestamps = (data) => {
                        const text = data.toString();
                        const lines = text.split('\n');
                        return lines.map((line, index) => {
                            // Don't add timestamp to empty lines at the end
                            if (index === lines.length - 1 && line === '') {
                                return line;
                            }
                            return `${getTimestamp()} ${line}`;
                        }).join('\n');
                    };
                    // On Windows, periodically sync the "latest" file since we use copies instead of symlinks
                    let syncInterval = null;
                    if (process.platform === 'win32' && logFilePath) {
                        const env = options?.env || 'local';
                        const logsDir = this.fsi.getLogsDirectory();
                        const latestLogPath = path.join(logsDir, `run-${env}-latest.log`);
                        // Sync every 5 seconds on Windows
                        syncInterval = setInterval(() => {
                            try {
                                if (fs.existsSync(logFilePath)) {
                                    fs.copyFileSync(logFilePath, latestLogPath);
                                }
                            }
                            catch (err) {
                                // Ignore sync errors
                            }
                        }, 5000);
                    }
                    // Pipe stdout to console (no timestamps) and log file (with timestamps)
                    meteorProcess.stdout?.on('data', (data) => {
                        process.stdout.write(data); // Console: no timestamps
                        const timestampedOutput = addTimestamps(data);
                        logStream?.write(timestampedOutput); // Log file: with timestamps
                    });
                    // Pipe stderr to console (no timestamps) and log file (with timestamps)
                    meteorProcess.stderr?.on('data', (data) => {
                        process.stderr.write(data); // Console: no timestamps
                        const timestampedOutput = addTimestamps(data);
                        logStream?.write(timestampedOutput); // Log file: with timestamps
                    });
                    meteorProcess.on('close', (code) => {
                        // Clear Windows sync interval
                        if (syncInterval) {
                            clearInterval(syncInterval);
                        }
                        // Write session end marker
                        if (logStream) {
                            const timestamp = new Date().toISOString();
                            logStream.write(`\n${'='.repeat(80)}\n`);
                            logStream.write(`Session Ended: ${timestamp}\n`);
                            logStream.write(`Exit Code: ${code}\n`);
                            logStream.write(`${'='.repeat(80)}\n\n`);
                            logStream.end();
                        }
                        if (code !== 0) {
                            reject(new Error(`Meteor exited with code ${code}`));
                        }
                        else {
                            resolve();
                        }
                    });
                    meteorProcess.on('error', (err) => {
                        // Clear Windows sync interval
                        if (syncInterval) {
                            clearInterval(syncInterval);
                        }
                        if (logStream) {
                            logStream.write(`\nError: ${err.message}\n`);
                            logStream.end();
                        }
                        reject(err);
                    });
                    // Handle process termination signals
                    const handleSignal = (signal) => {
                        // Clear Windows sync interval
                        if (syncInterval) {
                            clearInterval(syncInterval);
                        }
                        if (logStream) {
                            const timestamp = new Date().toISOString();
                            logStream.write(`\n${'='.repeat(80)}\n`);
                            logStream.write(`Session Interrupted: ${timestamp}\n`);
                            logStream.write(`Signal: ${signal}\n`);
                            logStream.write(`${'='.repeat(80)}\n\n`);
                            logStream.end();
                        }
                        meteorProcess.kill(signal);
                    };
                    process.on('SIGINT', () => handleSignal('SIGINT'));
                    process.on('SIGTERM', () => handleSignal('SIGTERM'));
                });
            }
            else {
                // FIX: Use spawnSync with array arguments instead of execSync with string interpolation
                // This properly handles paths containing special characters like '&'
                const spawnOptions = {
                    stdio: 'inherit',
                    cwd: cmd === 'publish' ? undefined : cwd
                };
                const result = spawnSync(this.meteor, runArgs, spawnOptions);
                if (result.error) {
                    throw result.error;
                }
                if (result.status !== 0) {
                    process.exit(result.status || 1);
                }
            }
        }
        catch (e) {
            errorHandler('invokeMeteorCommand()', e);
            process.exit(1);
        }
    }
}
//# sourceMappingURL=mpi.class.js.map
