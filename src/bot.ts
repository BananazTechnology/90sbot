import { Client, Message } from 'discord.js'
import * as dotenv from 'dotenv'
import path from 'path'
import interactionCreate from './hooks/interactionCreate'
import ready from './hooks/ready'
import { dbQuery } from './database/db'
import { RowDataPacket } from 'mysql2'

dotenv.config({ path: path.resolve('./config.env') })
const token = process.env.DSCRD_BOT_TK

console.log('Bot is starting...')

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'GUILD_MESSAGE_REACTIONS']
})

ready(client)
interactionCreate(client)

client.login(token)
client.on('messageCreate', message => {
  if (message.channelId === '875877989685006336') {
    applyReactions(message)
  }
  if (message.channelId === '936494511054520390' || message.channelId === '936497596510388294') {
    hypeItUp(message)
  }
  if (message.channelId === '1062113769850945637') {
    deadfellazSuperlatives(message)
  }
})

function applyReactions (message : Message) {
  console.log('New Sale')
  const reactions = ['psych_sip', 'DF_Salute', 'df_bull']
  reactions.forEach(reaction => {
    if (message.guild) {
      const react = message.guild.emojis.cache.find(emoji => emoji.name === reaction)
      console.log(react)
      if (react) {
        message.react(react.id)
      }
    }
  })
}

function hypeItUp (message : Message) {
}

async function deadfellazSuperlatives (message : Message) {
  const text = message.content.toLowerCase().replace(/\s\s+/g, ' ').split(' ')
  if (message.author.id === '932644049909874718') {
    return
  }
  console.log(Number(message.author.createdTimestamp))
  if (Number(message.author.createdTimestamp) > 1672549201000) {
    message.react('👎')
    message.channel.send(`<@${message.author.id}> This discord account was created too recently. Unfortunately it can not participate in an effort to preserve the integrity of the voting. Please reach out to Wock if you're not looking to cheat the system and this is an unfortunate biproduct of good intentions`)
    console.log('account was created too recently')
    return
  }
  console.log(`Superlatives message: ${text.toString()}`)
  let category = text[0]
  const commandPrefix = category.substring(0, 5)
  category = category.substr(5, (category.length - 5))
  const vote = text[1]
  const commands = ['friendliest', 'memeking', 'spiciesttakes', 'topshitposter', 'biggestdegen', 'mostlikelytoshill', 'bestderivatives', 'funniest', 'biggestfellazmaxi', 'biggestfrenzmaxi', 'discordmvp', 'twittermvp', 'communityfavorite']

  if (commandPrefix === '!vote') {
    let hit = false
    if (commands.indexOf(category) > -1) {
      message.react('👍')
      if (validateVote(vote)) {
        hit = true
        await logToDataBase(message, message.author.id, category, vote)
      }
    } else if (category === 'check') {
      message.react('👍')
      hit = true
      const result = await checkVotes(message, category)
      const done: string[] = []
      const row = (<RowDataPacket> result)
      commands.forEach((command) => {
        if (result) {
          for (let i = 0; i < row.length; i++) {
            if (command === row[i].category) {
              done.push(command)
            }
          }
        }
      })
      const notDone = commands.filter(x => !done.includes(x))
      message.channel.send(`<@${message.author.id}> You've voted for: ${toDisplay(done, true)}\n\nYou still need to vote for: ${toDisplay(notDone, false)}`)
    }
    if (!hit) {
      message.react('👎')
      message.channel.send(`<@${message.author.id}> hmmm, something doesn't seem right. Try again please!`)
    }
  } else if (commandPrefix === '!help') {
    message.channel.send(` 
Welcome to Top Of The Horde '22

To vote for someone, please enter:
[categorycommand][space][@username]
eg. !votefriendliest @Psych 

To recast your vote, simply enter the same command
with a new username.

All votes are public, voting closes in 7 days.

    !votefriendliest @username
    !votememeking @username
    !votespiciesttakes @username
    !votetopshitposter @username
    !votebiggestdegen @username
    !votemostlikelytoshill @username
    !votebestderivatives @username
    !votefunniest @username
    !votebiggestfellazmaxi @username
    !votebiggestfrenzmaxi @username
    !votediscordmvp @username
    !votetwittermvp @username
    !votecommunityfavorite @username
    `)
    message.react('👍')
    console.log(`${message.author.username} just ran the help command`)
  }
}

async function logToDataBase (message: Message, discordId: string, category: string, vote: string) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const exists = await checkIfExists(message, discordId, category)

      if (exists) {
        console.log(
          `UPDATING DATABASE: 
          Discord ID: ${discordId}
          Category: ${category}
          Vote:  ${vote}`
        )
        const queryString = `
          UPDATE submissions 
          SET selectionID = ${vote.replace('<', ' ').replace('@', ' ').replace('>', ' ')} 
          WHERE voterID = ${discordId} AND category = '${category}'`
        await dbQuery(queryString)
        message.channel.send(`<@${message.author.id}> has updated their vote for ${category} to ${vote}!`)
      } else {
        console.log(
          `INSERTING TO DATABASE: 
          Discord ID: ${discordId}
          Category: ${category}
          Vote:  ${vote}`
        )
        const queryString = `
          INSERT INTO submissions 
          (voterID, category, selectionID) 
          VALUES(${discordId}, '${category}',${vote.replace('<', ' ').replace('@', ' ').replace('>', ' ')});`
        await dbQuery(queryString)
        message.channel.send(`<@${message.author.id}> has voted for ${vote} for ${category}!`)
      }
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

async function checkIfExists (message: Message, discordId: string, category: string) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const queryString = `SELECT * FROM submissions WHERE voterID = ${discordId} AND category = '${category}'`
      const result = await dbQuery(queryString)
      console.log(`result of query ${result}`)
      if (result && result.toString() !== '') {
        resolve(true)
      } else {
        resolve(false)
      }
    } catch (error) {
      reject(error)
    }
  })
}

function validateVote (vote: string) {
  if (vote && vote.length > 15) {
    return true
  }
  return false
}

async function checkVotes (message: Message, category: string) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      console.log(
        `Checking votes: 
        Discord ID: ${message.author.id}
        Category: ${category}`
      )
      const queryString = `
        SELECT * FROM submissions 
        WHERE voterID = '${message.author.id}'`
      const result = await dbQuery(queryString)
      // message.channel.send(`<@${message.author.id}> has voted for ${vote} for ${category}!`)
      resolve(result)
    } catch (error) {
      console.log(error)
    }
  })
}

function toDisplay (input: string[], done: boolean) {
  let s = ''
  input.forEach((i) => {
    s = `${s}\n${i}  ${done ? ':white_check_mark:' : ':negative_squared_cross_mark:'}`
  })
  return s
}
