import { Resend } from 'resend'

let resend: Resend | null = null

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char])
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://leilaoveiculostone.com.br'

export async function sendOutbidEmail(to: string, vehicleTitle: string, newAmount: number) {
  const safeTitle = escapeHtml(vehicleTitle)

  await getResend().emails.send({
    from: 'Leilão Stone <noreply@leilaoveiculostone.com.br>',
    to,
    subject: `Seu lance foi superado - ${safeTitle}`,
    html: `
      <h2>Seu lance foi superado!</h2>
      <p>Alguém deu um lance maior no leilão do <strong>${safeTitle}</strong>.</p>
      <p>Novo valor: <strong>R$ ${newAmount.toFixed(2)}</strong></p>
      <p><a href="${BASE_URL}">Clique aqui para dar um novo lance</a></p>
    `,
  })
}
