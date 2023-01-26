import { ApplicationCommandOptionData, BaseCommandInteraction, Client } from 'discord.js'
import { SubCommand } from '../../interfaces/subCommand'
import { User } from '../../classes/user'
import axios from 'axios'
import { LogResult } from '../../classes/logResult'
import { LogStatus } from '../../resources/logStatus'

const wallet: ApplicationCommandOptionData = {
  name: 'wallet',
  description: 'ETH Wallet Address',
  type: 'STRING',
  required: true
}

export class Create extends SubCommand {
  name = 'create'
  description = 'Create a new profile'
  type = 'SUB_COMMAND'
  options = [wallet]
  userRequired = false;

  async run (client: Client, interaction: BaseCommandInteraction): Promise<LogResult> {
    await interaction.deferReply({ ephemeral: true })

    let wallet
    if (interaction.options.get('wallet')?.value === undefined) {
      wallet = undefined
    } else {
      wallet = `${interaction.options.get('wallet')?.value}`
    }

    try {
      await User.create(interaction.user.id, interaction.user.username, wallet)

      const content = 'User Created'

      await interaction.followUp({
        ephemeral: true,
        content
      })

      return new Promise((resolve, reject) => {
        resolve(new LogResult(true, LogStatus.Success, 'User Created Successfully'))
      })
    } catch (err) {
      if (err && axios.isAxiosError(err) && err.response && err.response.data.message.includes('Duplicate entry')) {
        const content = 'You already have a profile! You\'re good to go!'

        await interaction.followUp({
          ephemeral: true,
          content
        })

        return new Promise((resolve, reject) => {
          resolve(new LogResult(true, LogStatus.Incomplete, 'User already had a permit'))
        })
      } else {
        const content = 'Permit Registry closed! Talk to Papa Wock!'

        await interaction.followUp({
          ephemeral: true,
          content
        })

        return new Promise((resolve, reject) => {
          reject(new LogResult(false, LogStatus.Error, 'General Permit Create Command Error'))
        })
      }
    }
  }
}
