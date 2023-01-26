import { ApplicationCommandOptionData, BaseCommandInteraction, Client, MessageEmbed } from 'discord.js'
import { SubCommand } from '../../interfaces/subCommand'
import { User } from '../../classes/user'
import { LogResult } from '../../classes/logResult'
import { LogStatus } from '../../resources/logStatus'

const id: ApplicationCommandOptionData = {
  name: 'id',
  description: 'Discord ID of users profile youd like to view',
  type: 'STRING',
  required: true
}

export class Other extends SubCommand {
  name = 'other'
  description = 'View a users profile'
  type = 'SUB_COMMAND'
  options = [id]
  async run (client: Client, interaction: BaseCommandInteraction, user?: User): Promise<LogResult> {
    await interaction.deferReply({ ephemeral: true })

    let id
    if (interaction.options.get('id')?.value === undefined) {
      id = undefined
    } else {
      id = `${interaction.options.get('id')?.value}`
    }

    if (id) {
      try {
        const user = await User.getByDiscordId(id)

        if (!user) {
          const content = 'User doesnt have an account yet!'

          await interaction.followUp({
            ephemeral: true,
            content
          })

          return new Promise((resolve, reject) => {
            reject(new LogResult(false, LogStatus.Error, 'General Profile Other Command Error'))
          })
        }

        const embed = new MessageEmbed()
          .setColor('#FFA500')
          .setTitle(`Profile: ${user.getDiscordName()}`)
        embed.addField('Wallet Address:', `\`${user.getWalletAddress()}\``, false)
        const imgUser = await client.users.fetch(id)

        const image = imgUser.avatarURL({ dynamic: true })
        if (image) {
          embed.setThumbnail(image)
        }

        await interaction.followUp({
          embeds: [embed]
        })

        return new Promise((resolve, reject) => {
          resolve(new LogResult(true, LogStatus.Success, 'Profile Other completed Successfully'))
        })
      } catch (err) {
        const content = 'THere was an issues with the id provided'

        await interaction.followUp({
          ephemeral: true,
          content
        })

        return new Promise((resolve, reject) => {
          reject(new LogResult(false, LogStatus.Error, 'General Profile Other Command Error'))
        })
      }
    } else {
      const content = 'You dont have a profile yet! Use /profile create!'

      await interaction.followUp({
        ephemeral: true,
        content
      })

      return new Promise((resolve, reject) => {
        resolve(new LogResult(false, LogStatus.Error, 'Issue getting id'))
      })
    }
  }
}
