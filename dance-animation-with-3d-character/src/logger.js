/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
export class logger {
    static warn(message) {
        const date = new Date();
        console.log(`[${date.toISOString()}] [WARN] -- ${message}`);
    }

    static info(message) {
        const date = new Date();
        console.log(`[${date.toISOString()}] [INFO] -- ${message}`);
    }
}
