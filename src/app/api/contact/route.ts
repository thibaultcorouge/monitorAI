// app/api/contact/route.ts
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.SENDER_MAIL_RESEND as string;
const toEmails = (process.env.CONTACT_RECEIVER_EMAIL as string)
                  .split(",")
                  .map(email => email.trim());


export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  try {
    const data = await resend.emails.send({
      from: fromEmail, 
      to: toEmails,
      subject: `[Contact] ${subject}`,
      replyTo: email,
      html: `
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Message :</strong><br/>${message}</p>
      `
    });

    console.log('✅ Resend email sent:', data);
    console.log('Sending to:', toEmails);


    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Erreur lors de l’envoi.' }, { status: 500 });
  }
}
