import { LogStatus } from 'src/resources/logStatus'

export class LogResult {
  public complete: boolean;
  public status: LogStatus;
  public message: string;

  public constructor (complete: boolean, status: LogStatus, message: string) {
    this.complete = complete
    this.status = status
    this.message = message
  }
}
