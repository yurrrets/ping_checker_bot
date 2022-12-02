import { PingChecker } from './ping_checker'
import { SelfAliveChecker } from './self_alive_checker'
import { TgBot } from './tgbot'
const conf = require('../config.json')

const main = async () => {
  let ping_checker = new PingChecker()

  let self_alive_checker
  if (conf.self_alive_checker.enabled) {
    self_alive_checker = new SelfAliveChecker()
    self_alive_checker.start() 
  }

  const tgbot = new TgBot(ping_checker)
  await tgbot.start()

  ping_checker.start()
}

export {main}