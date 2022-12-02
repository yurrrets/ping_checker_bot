import { EventEmitter } from "events"
import { exec } from 'child_process'
import { LOG_ERR, LOG_INFO, LOG_WARN } from "./logger"
import { reqPost } from "./tools"

const conf = require('../config.json')


/// events: statusChange(boolean)
export class PingChecker extends EventEmitter {
    online?: boolean

    constructor() {
        super()
    }

    start = () => {
        this._do_periodic_check()
        setInterval(() => { this._do_periodic_check() }, conf.ping_checker.interval_ms)
    }

    regStatusChange(fn: (state: boolean) => void) {
        this.on('statusChange', fn)
    }

    _do_periodic_check = async () => {
        const new_online = await this.ping()
        LOG_INFO("this.online:", this.online, "new_online:", new_online)
        if (new_online === this.online) {
            return
        }
        this.online = new_online
        this.emit('statusChange', new_online)
    }

    _pingSubprocPing = () : Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            exec(`ping -c 1 "${conf.ping_checker.net_name}"`,
                { timeout: conf.ping_checker.timeout_ms },
                (error, stdout, stderr) => {
                    if (error) {
                        LOG_WARN("ping failed. stdout:", stdout, "stderr:", stderr)
                        resolve(false)
                    }
                    else {
                        resolve(true)
                    }
                })
        })
    }

    _pingService_2ip_ua = async () => {
        try {
            const service_url = "https://2ip.ua/service/ping-traceroute/ping.php"
            
            const resolve_host_raw = await reqPost(service_url, 
                {a: "resolv"}, JSON.stringify({ip:conf.ping_checker.net_name, i:1}))
            const resolve_host = JSON.parse(resolve_host_raw.toString())

            const ping_result_raw = await reqPost(service_url, 
                {a: "ping"}, JSON.stringify({ip:resolve_host.host, i:1}))
            const ping_result = JSON.parse(ping_result_raw.toString())

            if (ping_result.error) {
                // should be failed
                return false
            }
            if (ping_result.time) {
                // should be good
                return true
            }
            LOG_WARN("pingService: unexpected answer", ping_result)
            return false
        }
        catch (e) {
            LOG_ERR("pingService", e)
            return false
        }
    }

    ping = () => {
        if (conf.ping_checker.method === "subproc-ping") {
            // subproc ping may be disabled. For example an error on server:
            // ping: socket: Operation not permitted
            return this._pingSubprocPing()
        }
        else if(conf.ping_checker.method === "service-2ip.ua") {
            // So use external service
            // because there's no timeout in pingService, let's use promise
            return new Promise<boolean>((resolve) => {
                const tmr_id = setTimeout(() => {
                    resolve(false)
                }, conf.ping_checker.timeout_ms)
                this._pingService_2ip_ua().then((value) => {
                    clearTimeout(tmr_id)
                    resolve(value)
                })
            })
        }
        else {
            LOG_ERR("Unknown ping method:", conf.ping_checker.method)
        }
    }
}
