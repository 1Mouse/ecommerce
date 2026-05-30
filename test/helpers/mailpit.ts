type MailpitAddress = {
  Address: string;
  Name: string;
};

type MailpitMessageSummary = {
  ID: string;
  Subject: string;
  To: MailpitAddress[];
};

type MailpitMessagesResponse = {
  messages: MailpitMessageSummary[];
};

type MailpitMessage = {
  ID: string;
  Subject: string;
  Text?: string;
  HTML?: string;
  To: MailpitAddress[];
};

const mailpitApiUrl = process.env.MAILPIT_API_URL ?? "http://localhost:8025";

export async function clearMailpitMessages(): Promise<void> {
  await fetch(`${mailpitApiUrl}/api/v1/messages`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

export async function getLatestEmailFor(email: string): Promise<MailpitMessage> {
  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    const messagesResponse = await fetch(`${mailpitApiUrl}/api/v1/messages?limit=50`);

    if (!messagesResponse.ok) {
      throw new Error(`Mailpit API returned ${messagesResponse.status}`);
    }

    const messagesBody = (await messagesResponse.json()) as MailpitMessagesResponse;
    const message = messagesBody.messages.find((candidate) =>
      candidate.To.some((recipient) => recipient.Address === email),
    );

    if (message) {
      const messageResponse = await fetch(`${mailpitApiUrl}/api/v1/message/${message.ID}`);

      if (!messageResponse.ok) {
        throw new Error(`Mailpit message API returned ${messageResponse.status}`);
      }

      return (await messageResponse.json()) as MailpitMessage;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`No Mailpit email found for ${email}`);
}

export function extractVerificationToken(message: MailpitMessage): string {
  const content = `${message.Text ?? ""}\n${message.HTML ?? ""}`;
  const token = content.match(/[?&]token=([A-Za-z0-9_-]+)/)?.[1];

  if (!token) {
    throw new Error("Verification token was not found in email");
  }

  return token;
}
