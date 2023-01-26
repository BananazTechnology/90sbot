import {
  BaseCommandInteraction,
  ChatInputApplicationCommandData,
  Client
} from 'discord.js'
import { LogResult } from '../classes/logResult'
import { InteractionLog } from '../classes/interactionLog'
import { User } from '../classes/user'
import { Interaction } from './interaction'
import { LogStatus } from '../resources/logStatus'

export abstract class Command implements ChatInputApplicationCommandData, Interaction {
  public abstract name: string;
  public abstract description: string;
  public abstract type: any;

  protected cooldown?: number = undefined;
  protected requiredRole?: bigint = undefined;
  protected userRequired?: boolean = true;

  protected abstract run (client: Client, interaction: BaseCommandInteraction, user: User|undefined): Promise<LogResult>;

  public async execute (client: Client, interaction: BaseCommandInteraction) {
    const log = InteractionLog.log(interaction)

    let result: LogResult = new LogResult(false, LogStatus.Incomplete, 'Error in command')

    const user = await User.getByDiscordId(interaction.user.id)

    if (!user) {
      if (!this.userRequired) {
        result = await this.runCmd(client, interaction, user)
        console.log(`UNKNOWN(${interaction.user.username}) ran ${this.name}: ${result.message}`);
        (await log).complete(result)
        return
      } else {
        interaction.reply({
          ephemeral: true,
          content: 'You dont have a profile yet! Use /profile create!'
        })
        result = new LogResult(true, LogStatus.Warn, 'Command not run. User has no profile.')
        console.log(`UNKNOWN(${interaction.user.username}) ran ${this.name}: ${result.message}`);
        (await log).complete(result)
        return
      }
    }

    if (this.requiredRole) {
      const hasRole: boolean = await user.checkRole(this.requiredRole, interaction)
      if (!hasRole) {
        interaction.reply({
          ephemeral: true,
          content: 'Smokey the Bear says \'Only YOU can prevent forest fires!\'. Also, you dont have enough permissions for this command. Go water a tree or something.'
        })
        result = new LogResult(false, LogStatus.Warn, 'Player does not have required role')
        console.log(`${user.getDiscordName()} ran ${this.name}: ${result.message}`);
        (await log).complete(result)
        return
      }
    }

    if (this.cooldown) {
      const lastLog = await InteractionLog.getLastByCommand(user, interaction)

      if (lastLog) {
        const timestamp = lastLog.getTimestamp()
        if (timestamp) {
          const cooldownNumber = (Number(Date.parse(timestamp)) / 1000) + (this.cooldown * 60)
          const currentNumber = Number(Date.parse(new Date().toUTCString())) / 1000

          if (cooldownNumber - currentNumber > 0) {
            interaction.reply({
              ephemeral: true,
              content: `Easy there hotpocket, your cooldown aint over! You can run this command again <t:${((Number(Date.parse(timestamp)) / 1000) + (this.cooldown * 60))}:R>`
            })
            result = new LogResult(false, LogStatus.Warn, 'Player has not reached cooldown')
            console.log(`${user.getDiscordName()} ran ${this.name}: ${result.message}`);
            (await log).complete(result)
            return
          }
        }
      }
    }

    result = await this.runCmd(client, interaction, user)
    console.log(`${user.getDiscordName()} ran ${this.name}: ${result.message}`);
    (await log).complete(result)
  }

  private async runCmd (client: Client, interaction: any, user: User|undefined) {
    return await this.run(client, interaction, user)
      .catch(() => {
        interaction.followUp({
          ephemeral: true,
          content: 'Jeepers Creepers! You done broke it! We\'ll look into the issue'
        })
        return new LogResult(false, LogStatus.Incomplete, 'Error in command')
      })
  }
}
