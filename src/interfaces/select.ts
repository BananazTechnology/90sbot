import {
  ApplicationCommandSubCommandData,
  Client,
  SelectMenuInteraction
} from 'discord.js'
import { User } from '../classes/user'
import { Interaction } from './interaction'

export abstract class Select implements ApplicationCommandSubCommandData, Interaction {
  public abstract name: string;
  public abstract description: string;
  public abstract type: any;

  protected cooldown?: number = undefined;

  abstract run: (client: Client, interaction: SelectMenuInteraction, user: User|undefined) => void;

  async execute (client: Client, interaction: SelectMenuInteraction) {
    const user = await User.getByDiscordId(interaction.user.id)
    this.run(client, interaction, user)
  }
}
