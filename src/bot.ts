import { Client, Message, MessageAttachment, MessageButton, MessageEmbed, TextBasedChannel, TextChannel } from 'discord.js'
import * as dotenv from 'dotenv'
import path from 'path'
import interactionCreate from './hooks/interactionCreate'
import ready from './hooks/ready'
import { dbQuery } from './database/db'
import { RowDataPacket } from 'mysql2'
// import { RowDataPacket } from 'mysql2'

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
  if (message.author.id === process.env.AUTHOR_ID) {
    return
  }
  if (message.channelId === process.env.SUBMISSION_CHANNEL) {
    // deadfellazSuperlatives(message)
    registerSubmission(message)
  } else if (message.channelId === process.env.DISPLAY_CHANNEL) {
    displaySubmissions(message)
  } else if (message.channelId === process.env.DISPLAY_PRO || message.channelId === process.env.DISPLAY_AMATEUR) {
    determineList(message)
  } else if (message.channelId === process.env.VOTING_CHANNEL) {
    vote(message)
  }
})

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    console.log(interaction.customId)
    if (interaction.customId.toString().substr(0, 3) === 'pro') {
      await interaction.deferReply()
      await interaction.deleteReply()
      await updateSubmission(interaction.customId.replace('pro-', ''), 'pro')
      await interaction.channel!.send('Marked as Pro!')
      await getSubmissions(interaction.channel!)
    } else if (interaction.customId.toString().substr(0, 7) === 'amateur') {
      await interaction.deferReply()
      await interaction.deleteReply()
      await updateSubmission(interaction.customId.replace('amateur-', ''), 'amateur')
      await interaction.channel!.send('Marked as Amateur!')
      await getSubmissions(interaction.channel!)
    }
  }
})

async function registerSubmission (message: Message) {
  console.log(message)
  let hasAttachment = false
  if (message.attachments) {
    console.log('attachments:')
    message.attachments.forEach((attachment) => {
      if (attachment.url !== '') {
        hasAttachment = true
        submitAttachment(message, attachment)
        console.log(attachment.url)
      }
    })
  }
  if (!hasAttachment) {
    message.delete()
  }
}

async function submitAttachment (message: Message, attachment :MessageAttachment) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      await logSubmissionToDataBase(message, message.author.id, attachment)
      message.react('👍')
      resolve(true)
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

async function checkIfSubmissionExists (discordId: string) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const queryString = `SELECT * FROM submissions WHERE discordID = '${discordId}'`
      console.log(`query string: ${queryString}`)
      const result = await dbQuery(queryString)
      console.log(`result of query ${result && result.toString() !== '' ? 'exists' : 'false'}`)
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

async function logSubmissionToDataBase (message: Message, discordId: string, attachment: MessageAttachment) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const exists = await checkIfSubmissionExists(discordId)

      if (exists) {
        console.log(
          `UPDATING SUBMISSION: 
          Discord ID: ${discordId}`
        )
        const queryString = `
          UPDATE submissions 
          SET submissionString = '${attachment.url}' 
          WHERE discordID = ${discordId}`
        await dbQuery(queryString)
        message.channel.send(`<@${message.author.id}> has updated their submission! Thx!`)
        message.channel.send('Type !submit and attach your submission to enter the competition or update your submission!')
      } else {
        console.log(
          `INSERTING TO DATABASE: 
          Discord ID: ${discordId}
          Discord Name: ${message.author.username}
          Submission String: ${attachment.url}
          Holder: false`
        )
        const queryString = `
          INSERT INTO submissions 
          (discordID, discordName, submissionString, holder, category) 
          VALUES(${discordId}, '${message.author.username}', '${attachment.url}', 0, '');`
        await dbQuery(queryString)
        message.channel.send(`<@${message.author.id}> has submitted their entry!`)
        message.channel.send('Type !submit and attach your submission to enter the competition or update your submission!')
      }
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

async function displaySubmissions (message: Message): Promise<void> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      if (message.author.id === process.env.AUTHOR_ID) {
        return
      }
      const text = message.content.toLowerCase().replace(/\s\s+/g, ' ').split(' ')
      const command = text[0]
      if (command === '!categorize') {
        console.log('submissions: ')
        await getSubmissions(message.channel)
        message.react('👍')
      }
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

async function getSubmissions (channel: TextBasedChannel): Promise<void> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const results = await dbQuery('SELECT * FROM submissions WHERE category = "" limit 1')
      let media = ''
      let discordId = ''
      console.log(results)
      const rows = <RowDataPacket[]> results
      if (rows[0] === undefined) {
        await channel.send('No more submissions to categorize!')
        resolve()
        return
      }
      for (const row of rows) {
        media = row.submissionString
        discordId = row.discordID
      }
      const Buttons = []
      Buttons[0] = new MessageButton()
        .setLabel('PRO')
        .setStyle('PRIMARY')
        .setCustomId(`pro-${discordId}`)
      Buttons[1] = new MessageButton()
        .setLabel('AMATEUR')
        .setStyle('PRIMARY')
        .setCustomId(`amateur-${discordId}`)
      await channel.send({
        content: media,
        components: [
          {
            type: 1,
            components: [Buttons[0], Buttons[1]]
          }
        ]
      })
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

async function updateSubmission (discordId: string, category: string) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const exists = await checkIfSubmissionExists(discordId.toString())
      console.log(`exists: ${exists}`)

      if (exists) {
        console.log(
          `UPDATING SUBMISSION: 
          Discord ID: ${discordId}`
        )
        const queryString = `
          UPDATE submissions 
          SET category = '${category}' 
          WHERE discordID = ${discordId}`
        await dbQuery(queryString)
      }
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}

async function determineList (message: Message): Promise<void> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      if (message.author.id === process.env.AUTHOR_ID) {
        return
      }
      const text = message.content.toLowerCase().replace(/\s\s+/g, ' ').split(' ')
      const command = text[0]
      if (command === '!displaypro') {
        await displayAllCategory(message.channel, 'pro')
        message.react('👍')
      } else if (command === '!displayamateur') {
        await displayAllCategory(message.channel, 'amateur')
        message.react('👍')
      }
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}
async function displayAllCategory (channel: TextBasedChannel, category: string): Promise<void> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const results = await dbQuery(`SELECT * FROM submissions WHERE category = '${category}'`)
      let media = ''

      console.log(results)
      const rows = <RowDataPacket[]> results
      if (rows[0] === undefined) {
        await channel.send('Nothing to display!')
        resolve()
        return
      }
      for (const row of rows) {
        media = `------------------\nVote for the below submission with !vote${row.category} <@${row.discordID}> in <#${process.env.VOTING_CHANNEL}> \n${row.submissionString}\n------------------\n`
        await channel.send({
          content: media
        })
      }
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

async function vote (message : Message) {
  const text = message.content.toLowerCase().replace(/\s\s+/g, ' ').split(' ')
  console.log(Number(message.author.createdTimestamp))
  if (Number(message.author.createdTimestamp) > 1675227600000) {
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
  const commands = ['pro', 'amateur']

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
  } else if (commandPrefix === '!info') {
    message.channel.send(` 
Welcome to the 90s Kids Skate Contest!

To vote for someone, please enter:
[categorycommand][space][@username]
eg. !votepro @Wock 

To recast your vote, simply enter the same command
with a new username.

!votepro @username
!voteamateur @username
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
          UPDATE votesubmissions 
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
          INSERT INTO votesubmissions 
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
      const queryString = `SELECT * FROM votesubmissions WHERE voterID = ${discordId} AND category = '${category}'`
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
        SELECT * FROM votesubmissions 
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

async function displayLeaderboard (channel: TextChannel, category: string) : Promise<void> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Grabbing Leaderboard', category)
      const queryString = `SELECT selectionId, category, Count(selectionId) as 'Count' FROM votesubmissions WHERE category= '${category}' GROUP BY selectionId, category ORDER BY Count DESC;`
      const result = await dbQuery(queryString)
      const rows = <RowDataPacket[]> result
      let msg = ''
      for (let i = 0; i < rows.length; i++) {
        const user = await channel.guild.members.fetch(rows[i].selectionId)
        msg += `\`${i + 1}. \` ${user?.displayName} • **${rows[i].Count}** Votes \n`
      }
      if (msg) {
        const output = new MessageEmbed()
          .setColor('#FFC800')
          .setTitle(`**${category === 'pro' ? 'Pro' : 'Amateur'} Leaderboard**`)
          .setDescription(msg)
          .setTimestamp()
        channel.send({
          embeds: [output]
        })
      }
      resolve()
    } catch (error) {
      console.log(error)
    }
  })
}

async function displayLeaderboards () {
  const channel = process.env.LEADERBOARD?.toString()
  if (channel) {
    const leaderboardChannel = client.channels.cache.get(channel) as TextChannel
    await clearChat(leaderboardChannel, 100)
    displayLeaderboard(leaderboardChannel, 'pro')
    displayLeaderboard(leaderboardChannel, 'amateur')
  }
}

// async function deleteAllMessages(channel: TextBasedChannel) : Promise<void> {
//   // eslint-disable-next-line no-async-promise-executor
//   return new Promise(async (resolve, reject) => {
//     try {
//       let fetched
//       do {
//         fetched = await channel.fetchMessages({ limit: 100 })
//         channel.deleteMessages(fetched)
//       }
//       while(fetched.size >= 2);
//       resolve()
//     } catch (error) {
//       console.log(error)
//       reject(error)
//     }
//   })
// }

async function clearChat (channel: TextChannel, numb: number) {
  const messageManager = channel.messages
  const messages = await messageManager.channel.messages.fetch({ limit: numb })
  channel.bulkDelete(messages, true)
}

// setInterval(displayLeaderboards, 120000)
