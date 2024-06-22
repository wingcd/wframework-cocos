import { DEBUG } from "cc/env";

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    OFF = 4,
}

export const LogSettings = {
    logLevel: LogLevel.INFO,
};

if (!DEBUG) {
    const sysLog = console.log;
    const sysWarn = console.warn;
    const sysError = console.error;
    const sysDebug = console.debug;

    console.log = function (...data: any[]) {
        if (LogSettings.logLevel <= LogLevel.INFO) {
            sysLog.call(console, ...data);
        }
    }

    console.warn = function (...data: any[]) {
        if (LogSettings.logLevel <= LogLevel.WARN) {
            sysWarn.call(console, ...data);
        }
    }

    console.error = function (...data: any[]) {
        if (LogSettings.logLevel <= LogLevel.ERROR) {
            sysError.call(console, ...data);
        }
    }

    console.debug = function (...data: any[]) {
        if (LogSettings.logLevel <= LogLevel.DEBUG) {
            sysDebug.call(console, ...data);
        }
    }
}