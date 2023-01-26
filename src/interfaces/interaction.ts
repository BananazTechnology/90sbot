import {
  ChatInputApplicationCommandData,
  Client
} from 'discord.js'
import { User } from '../classes/user'

export interface Interaction extends ChatInputApplicationCommandData {
  name: string,
  description: string,
  type: any,
  execute: (client: Client, interaction: any, user: User|undefined) => void;
}
