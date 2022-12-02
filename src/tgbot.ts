import TelegramBot from 'node-telegram-bot-api'
import { PingChecker } from './ping_checker'
import { Storage } from './storage'
const conf = require('../config.json') // leave require, import doesn't work with node 14


class TgBotPersistentInfo {
  subscribers: number[] = []
}

/*
bot commands (copy-paste this in BotFather)

check - Check if electricity is available
subscribe - Subscribe to updates
unsubscribe - Unsubscribe from updates

*/

export class TgBot {
  bot: TelegramBot = new TelegramBot(conf.telegram.bot_token, {polling: true})
  storage: Storage = new Storage('bot_data')
  bot_data: TgBotPersistentInfo = new TgBotPersistentInfo()
  ping_checker: PingChecker

  constructor(ping_checker: PingChecker) {
    this.ping_checker = ping_checker
    this.ping_checker.regStatusChange((state) => { this.onPingStatusChange(state) })
  }

  async start() {
    this.bot.onText(/^\/start/, this.onMsgStart)
    this.bot.onText(/^\/check/, this.onMsgCheck)
    this.bot.onText(/^\/subscribe/, this.onMsgSubscribe)
    this.bot.onText(/^\/unsubscribe/, this.onMsgUnsubscribe)

    this.bot_data = (await this.storage.load()) || new TgBotPersistentInfo()

    // test bot is working
    this.sendToSubscribers('Bot started!')
    // setInterval(() => {
    //   this.sendToSubscribers('check! ' + (new Date).toISOString())
    // }, 60*1000)
  }

  onMsgStart = (msg: TelegramBot.Message) => {
    const helpString = `
      Welcome! Use Menu button to see available actions
    `
    this.bot.sendMessage(msg.chat.id, helpString);
  }

  onMsgCheck = async (msg: TelegramBot.Message) => {
    const chat_id = msg.chat.id
    const tmr_id = setTimeout(() => {
      this.bot.sendMessage(chat_id, "Please wait...")
    }, 2000)
    const online = await this.ping_checker.ping()
    clearTimeout(tmr_id)
    this.bot.sendMessage(chat_id, 
      (online ? "Electricity is ON (server responded)" : "Electricity is OFF (ping error or timeout)"))
  }

  onMsgSubscribe = async (msg: TelegramBot.Message) => {
    const idx = this.bot_data.subscribers.indexOf(msg.chat.id)
    if (idx == -1) {
      this.bot_data.subscribers.push(msg.chat.id)
      await this.storage.save(this.bot_data)
      this.bot.sendMessage(msg.chat.id, "You successfully subscribed to updates")
    }
    else {
      this.bot.sendMessage(msg.chat.id, "You're already subscribed")
    }
  }

  onMsgUnsubscribe = async (msg: TelegramBot.Message) => {
    const idx = this.bot_data.subscribers.indexOf(msg.chat.id)
    if (idx == -1) {
      this.bot.sendMessage(msg.chat.id, "You hadn't subscribed to updates before")
    }
    else {
      this.bot_data.subscribers.splice(idx, 1)
      await this.storage.save(this.bot_data)
      this.bot.sendMessage(msg.chat.id, "You successfully unsubscribed from updates")
    }
  }

  onPingStatusChange = (status: boolean) => {
    if (status) {
      this.sendToSubscribers("Electricity became ON")
    }
    else {
      this.sendToSubscribers("Electricity became OFF")
    }
  }

  sendToSubscribers = (msg: string) => {
    for (const chat_id of this.bot_data.subscribers) {
      this.bot.sendMessage(chat_id, msg)
    }
  }
}
