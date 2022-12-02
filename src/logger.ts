// logging

enum LOG_LEVEL {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

const LOG_LEVELS_STR = {
    0: "DEBUG",
    1: "INFO",
    2: "WARN",
    3: "ERROR"
}

let min_log_level = LOG_LEVEL.INFO
const __LOG = (level: LOG_LEVEL, ...args: any) => {
    if (level >= min_log_level) {
        console.log(new Date(), LOG_LEVELS_STR[level], ...args)
    }
}

const LOG_DBG = (...args: any) => { __LOG(LOG_LEVEL.DEBUG, ...args) }
const LOG_INFO = (...args: any) => { __LOG(LOG_LEVEL.INFO, ...args) }
const LOG_WARN = (...args: any) => { __LOG(LOG_LEVEL.WARN, ...args) }
const LOG_ERR = (...args: any) => { __LOG(LOG_LEVEL.ERROR, ...args) }

export {
    LOG_DBG, LOG_INFO, LOG_WARN, LOG_ERR
}