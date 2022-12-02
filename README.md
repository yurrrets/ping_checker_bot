# ping_checker_bot
Periodically ping selected server for checking availability. Based on this, the decision can
made about power presence/outage. As it is telegram bot, gathered info is sending to all
subscribed persons. Also there's a possibility to check if server is online or offline.

## Setup
- Clone this repo
- Don't forget to run "npm install"
- Copy "config.json.sample" to "config.json". Fill parameters

## Usage
Before first run, execute "npm run build" to translate ts files to js. Then app can be run with just
"node app.js", or "npm run start". Another command "npm run run_server" is good during development.

## Notes
You can find here some weird things. E.g. self alive checker. And also ping via external http service.
But this bot is supposed to run on the very cheap hosting. It's not a dedicated or virtual server. And
that host server has limitations.

First one - your app executes when there're requests to your app. No requests - node app is gone. Until
new request appears. So self alive checker allows to keep 1-2 active request constantly, preventing app
from closing by host.

Second - ping command reqires to create socket connection. But raw socket connections are forbidden on
host server. Only http requests are allowed. So need to use external ping service with http api. This
ping service do not have fixed public api. So implementation is hardcoded. Hope service will work well.
