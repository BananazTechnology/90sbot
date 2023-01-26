import { BaseCommandInteraction, Client } from 'discord.js'
import { Commands } from '../../commandList'
import { User } from '../../classes/user'
import { Command } from '../../interfaces/command'
import { LogResult } from '../../classes/logResult'
import { LogStatus } from '../../resources/logStatus'

export class Help extends Command {
  name = 'help'
  description = 'Displays all commands'
  type = 'CHAT_INPUT'
  userRequired = false;

  async run (client: Client, interaction: BaseCommandInteraction, user?: User): Promise<LogResult> {
    try {
      await interaction.deferReply({ ephemeral: true })
      let content = ''
      Commands.forEach(command => {
        content += `/${command.name} - ${command.description}\n`
      })

      await interaction.followUp({
        content
      })

      return new Promise((resolve, reject) => {
        resolve(new LogResult(true, LogStatus.Success, 'Help Command Completed Successfully'))
      })
    } catch {
      return new Promise((resolve, reject) => {
        reject(new LogResult(false, LogStatus.Error, 'General Help Command Error'))
      })
    }
  }
}
