export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

export interface MailProvider {
  send(input: SendMailInput): Promise<void>;
}
