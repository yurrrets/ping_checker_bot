import http from 'http'
import { LOG_ERR, LOG_INFO, LOG_WARN } from './logger'
import { reqGet } from './tools'
import url from 'url'
const conf = require('../config.json')

export class SelfAliveChecker {
    server = http.createServer(SelfAliveChecker.requestListener);

    start = () => {
        this.server.listen(conf.self_alive_checker.self_server_port, () => {
            LOG_INFO("listening on", this.server.address())
        })

        // request every interval_ms with shift 0, start now
        this.do_self_test()
        setInterval(() => {
            this.do_self_test()
        }, conf.self_alive_checker.interval_ms)

        // request every interval_ms with shift interval_ms/2
        setTimeout(() => {
            setInterval(() => {
                this.do_self_test()
            }, conf.self_alive_checker.interval_ms)
        }, conf.self_alive_checker.interval_ms/2)

        LOG_INFO("self alive checker started")
    }

    static requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
        let timeout_ms = 0
        try {
            LOG_INFO("request:", req.url)
            const query_obj = url.parse(req.url || "/", true).query || {}
            if (Array.isArray(query_obj.timeout_ms))
            {
                timeout_ms = parseInt(query_obj.timeout_ms[0] || '0')
            }
            else {
                timeout_ms = parseInt(query_obj.timeout_ms || '0')
            }
        }
        catch (e) {
            LOG_ERR(e)
        }
        const do_answer = () => {
            res.writeHead(200);
            res.end('Success! Timeout = '+timeout_ms+' ms');
        }
        if (timeout_ms > 0) {
            setTimeout(do_answer, timeout_ms)
        }
        else {
            do_answer()
        }
    }

    do_self_test = () => {
        reqGet(conf.self_alive_checker.url, { timeout_ms: conf.self_alive_checker.interval_ms }).then(
            () => { LOG_INFO("self_alive: ok") }
        ).catch(
            (reason) => { LOG_WARN("error getting page", reason) }
        )
    }
}
