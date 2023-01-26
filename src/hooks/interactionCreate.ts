import { BaseCommandInteraction, ButtonInteraction, Client, Interaction, SelectMenuInteraction } from 'discord.js'
import { MenuSelects } from '../menuSelectList'
import { User } from '../classes/user'
import { Commands } from '../commandList'
import { ButtonInteractions } from '../buttonList'

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isCommand() || interaction.isContextMenu()) {
      await handleSlashCommand(client, interaction)
    } else if (interaction.isSelectMenu()) {
      await handleSelectMenu(client, interaction)
    } else if (interaction.isButton()) {
      await handleButtonClick(client, interaction)
    }
  })
}

const handleSlashCommand = async (client: Client, interaction: BaseCommandInteraction): Promise<void> => {
  const slashCommand = Commands.find((c) => c.name === interaction.commandName)
  if (!slashCommand) {
    interaction.reply({ content: 'An error has occurred' })
    return
  }

  try {
    slashCommand.execute(client, interaction)
  } catch (err) {
    getUserIssue(interaction, err)
  }
}

const handleSelectMenu = async (client: Client, interaction: SelectMenuInteraction): Promise<void> => {
  const menuInteraction = MenuSelects.find((c) => c.name === interaction.customId)
  if (!menuInteraction) {
    interaction.reply({ content: 'An error has occurred' })
    return
  }

  // log command to console
  console.log(`${interaction.user.username} (${interaction.user.id}) made a selection on ${interaction.customId}`)

  try {
    const user = await User.getByDiscordId(interaction.user.id)
    menuInteraction.run(client, interaction, user)
  } catch (err) {
    getUserIssue(interaction, err)
  }
}

const handleButtonClick = async (client: Client, interaction: ButtonInteraction): Promise<void> => {
  let btnID: string
  if (interaction.customId.includes(':')) {
    btnID = interaction.customId.substring(0, interaction.customId.indexOf(':'))
  } else {
    btnID = interaction.customId
  }

  const buttonInteraction = ButtonInteractions.find((c) => c.name === btnID)
  if (!buttonInteraction) {
    interaction.reply({ ephemeral: true, content: 'An error has occurred' })
    return
  }

  // log command to console
  console.log(`${interaction.user.username} (${interaction.user.id}) clicked button ${interaction.customId}`)

  try {
    const user = await User.getByDiscordId(interaction.user.id)
    buttonInteraction.run(client, interaction, user)
  } catch (err) {
    getUserIssue(interaction, err)
  }
}

function getUserIssue (interaction: any, err: any) {
  console.error(err.message)
  const content = 'Banana Police question your ID. Please contact LT Wock!'

  interaction.reply({
    ephemeral: true,
    content
  })
}
