export enum LogLevel {
    Debug = 1,
    Info = 2,
    Warn = 4,
    Error = 8,
}

const colors: Record<LogLevel, string> = {
    [LogLevel.Info]: "\x1b[32m",
    [LogLevel.Warn]: "\x1b[33m",
    [LogLevel.Error]: "\x1b[31m",
    [LogLevel.Debug]: "\x1b[37m",
};

const logLevels: Record<string, LogLevel> = {
    production: LogLevel.Info | LogLevel.Error,
    development: LogLevel.Debug | LogLevel.Info | LogLevel.Warn | LogLevel.Error,
};

const currentEnv: string = import.meta.env.MODE;

const isLogLevelEnabled = (level: LogLevel): boolean => {
    const envMask = logLevels[currentEnv];
    return !!envMask && (level & envMask) === level.valueOf();
};

const logMessage = (level: LogLevel, message: string) => {
    if (isLogLevelEnabled(level)) {
        console.log(`${colors[level]}[${LogLevel[level]}] ${message}`);
    }
};

export const Logger = {
    debug: (message: string) => { logMessage(LogLevel.Debug, message); },
    info: (message: string) => { logMessage(LogLevel.Info, message); },
    warn: (message: string) => { logMessage(LogLevel.Warn, message); },
    error: (message: string) => { logMessage(LogLevel.Error, message); },
};
