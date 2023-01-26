import {
  BaseCommandInteraction,
  ApplicationCommandSubCommandData,
  Client
} from 'discord.js'
import { LogStatus } from '../resources/logStatus'
import { LogResult } from '../classes/logResult'
import { User } from '../classes/user'
import { Interaction } from './interaction'

export abstract class SubCommand implements ApplicationCommandSubCommandData, Interaction {
  public abstract name: string;
  public abstract description: string;
  public abstract type: any;

  protected userRequired?: boolean = true;

  abstract run (client: Client, interaction: BaseCommandInteraction, user: User|undefined): Promise<LogResult>;

  execute (client: Client, interaction: BaseCommandInteraction, user: User|undefined): Promise<LogResult> {
    if (!user) {
      if (!this.userRequired) {
        return this.run(client, interaction, user)
      } else {
        interaction.reply({
          ephemeral: true,
          content: 'You dont have a profile yet! Use /profile create!'
        })
        return new Promise((resolve, reject) => {
          resolve(new LogResult(true, LogStatus.Warn, 'Command not run. User has no profile.'))
        })
      }
    }

    return this.run(client, interaction, user)
  }
}
