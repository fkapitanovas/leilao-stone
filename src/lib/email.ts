import { Resend } from 'resend'

let resend: Resend | null = null

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function sendOutbidEmail(to: string, vehicleTitle: string, newAmount: number) {
  await getResend().emails.send({
    from: 'Leilão Stone <noreply@leilaoveiculostone.com.br>',
    to,
    subject: `Seu lance foi superado - ${vehicleTitle}`,
    html: `
      <h2>Seu lance foi superado!</h2>
      <p>Alguém deu um lance maior no leilão do <strong>${vehicleTitle}</strong>.</p>
      <p>Novo valor: <strong>R$ ${newAmount.toFixed(2)}</strong></p>
      <p><a href="https://leilaoveiculostone.com.br">Clique aqui para dar um novo lance</a></p>
    `,
  })
}
