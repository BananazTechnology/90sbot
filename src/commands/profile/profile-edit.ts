import { ApplicationCommandOptionData, BaseCommandInteraction, Client } from 'discord.js'
import { SubCommand } from '../../interfaces/subCommand'
import { User } from '../../classes/user'
import { LogResult } from '../../classes/logResult'
import { LogStatus } from '../../resources/logStatus'

const wallet: ApplicationCommandOptionData = {
  name: 'wallet',
  description: 'ETH Wallet Address',
  type: 'STRING',
  required: true
}

export class Edit extends SubCommand {
  name = 'edit'
  description = 'Edit your profile'
  type = 'SUB_COMMAND'
  options = [wallet]
  async run (client: Client, interaction: BaseCommandInteraction, user?: User): Promise<LogResult> {
    await interaction.deferReply({ ephemeral: true })

    let wallet
    if (interaction.options.get('wallet')?.value === undefined) {
      wallet = undefined
    } else {
      wallet = `${interaction.options.get('wallet')?.value}`
    }

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

      await user.setWalletAddress(wallet)

      const content = 'User Updated'

      await interaction.followUp({
        ephemeral: true,
        content
      })

      return new Promise((resolve, reject) => {
        resolve(new LogResult(true, LogStatus.Success, 'Permit Edit Completed Successfully'))
      })
    } catch (err) {
      const content = 'Permit Registry closed! Talk to Papa Wock!'

      await interaction.followUp({
        ephemeral: true,
        content
      })

      return new Promise((resolve, reject) => {
        reject(new LogResult(false, LogStatus.Error, 'General Permit Edit Command Error'))
      })
    }
  }
}
