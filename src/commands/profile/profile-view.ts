import { BaseCommandInteraction, Client, MessageEmbed } from 'discord.js'
import { SubCommand } from '../../interfaces/subCommand'
import { User } from '../../classes/user'
import { LogResult } from '../../classes/logResult'
import { LogStatus } from '../../resources/logStatus'

export class View extends SubCommand {
  name = 'view'
  description = 'View your profile'
  type = 'SUB_COMMAND'
  async run (client: Client, interaction: BaseCommandInteraction, user?: User): Promise<LogResult> {
    await interaction.deferReply({ ephemeral: true })

    try {
      if (!user) {
        const content = 'You dont have a permit yet! Use /profile create!'

        await interaction.followUp({
          ephemeral: true,
          content
        })

        return new Promise((resolve, reject) => {
          reject(new LogResult(false, LogStatus.Error, 'General Permit View Command Error'))
        })
      }

      const embed = new MessageEmbed()
        .setColor('#FFA500')
        .setTitle(`Profile: ${user.getDiscordName()}`)
      embed.addField('Wallet Address:', `\`${user.getWalletAddress()}\``, false)
      const img = interaction.user.avatarURL({ dynamic: true })
      if (img) {
        embed.setThumbnail(img)
      }

      await interaction.followUp({
        embeds: [embed]
      })

      return new Promise((resolve, reject) => {
        resolve(new LogResult(true, LogStatus.Success, 'Permit View Completed Successfully'))
      })
    } catch (err) {
      const content = '*INSERT FUNNY RESPONCE TO COMMAND ERROR HERE* Or dont, this is probably good enpugh. You get the point.'

      await interaction.followUp({
        ephemeral: true,
        content
      })

      return new Promise((resolve, reject) => {
        reject(new LogResult(false, LogStatus.Error, 'General Permit View Command Error'))
      })
    }
  }
}
