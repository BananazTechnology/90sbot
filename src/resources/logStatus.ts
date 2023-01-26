/* eslint-disable no-unused-vars */
export enum LogStatus {
    /**
     * Command was successfully completed.
     */
    Success = 'SUCCESS',
    /**
     * Uncaught error. Command did not complete. Should not be used in a command file.
     */
    Incomplete = 'INCOMPLETE',
    /**
     * An undesired outcome prevented the command from completing.
     */
    Warn = 'WARN',
    /**
     * an error occured and was caught
     */
    Error = 'ERROR',
}
