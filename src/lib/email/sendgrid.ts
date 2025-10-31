import sgMail from "@sendgrid/mail";

// Initialiser SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Envoie un email via SendGrid
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY non configuré. Email non envoyé.");
    return;
  }

  const msg = {
    to,
    from: from || process.env.SENDGRID_FROM_EMAIL || "noreply@operaflow.app",
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("Erreur envoi email SendGrid:", error);
    throw error;
  }
}

/**
 * Envoie un email de création de compte avec mot de passe provisoire
 */
export async function sendAccountCreationEmail(
  email: string,
  nom: string,
  prenom: string,
  temporaryPassword: string
): Promise<void> {
  const subject = "Votre compte OperaFlow a été créé";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .password-box { background-color: #fff; border: 2px dashed #0EA5E9; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
        .warning { background-color: #FEF3C7; border-left: 4px solid #F97316; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bienvenue sur OperaFlow</h1>
        </div>
        <div class="content">
          <p>Bonjour ${prenom} ${nom},</p>
          <p>Votre demande d'accès à OperaFlow a été acceptée. Votre compte a été créé avec succès.</p>
          
          <p><strong>Vos identifiants de connexion :</strong></p>
          <ul>
            <li>Email : ${email}</li>
            <li>Mot de passe provisoire :</li>
          </ul>
          
          <div class="password-box">
            ${temporaryPassword}
          </div>
          
          <div class="warning">
            <strong>⚠️ Important :</strong> Ce mot de passe provisoire est valable 48 heures. 
            Vous devrez le changer lors de votre première connexion pour des raisons de sécurité.
          </div>
          
          <p>Pour vous connecter, rendez-vous sur : <a href="${process.env.APP_BASE_URL || 'https://operaflow.app'}/login">${process.env.APP_BASE_URL || 'https://operaflow.app'}/login</a></p>
          
          <p>Si vous n'avez pas demandé cet accès, veuillez contacter un administrateur immédiatement.</p>
        </div>
        <div class="footer">
          <p>OperaFlow - Application de suivi, planification et pilotage d'activités</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
}

/**
 * Envoie un email de refus de demande d'accès
 */
export async function sendRequestRejectionEmail(
  email: string,
  nom: string,
  prenom: string,
  motifRefus: string
): Promise<void> {
  const subject = "Demande d'accès OperaFlow - Refusée";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F97316; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .reason-box { background-color: #fff; border-left: 4px solid #F97316; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Demande d'accès refusée</h1>
        </div>
        <div class="content">
          <p>Bonjour ${prenom} ${nom},</p>
          <p>Votre demande d'accès à OperaFlow a été examinée et n'a malheureusement pas pu être acceptée.</p>
          
          <div class="reason-box">
            <strong>Motif du refus :</strong>
            <p>${motifRefus}</p>
          </div>
          
          <p>Si vous pensez qu'il s'agit d'une erreur, vous pouvez contacter un administrateur pour plus d'informations.</p>
        </div>
        <div class="footer">
          <p>OperaFlow - Application de suivi, planification et pilotage d'activités</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
}

/**
 * Envoie une notification à l'administrateur pour nouvelle demande
 */
export async function sendAdminNotificationEmail(
  adminEmail: string,
  nom: string,
  prenom: string,
  email: string
): Promise<void> {
  const subject = "Nouvelle demande d'accès OperaFlow";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .info-box { background-color: #fff; border-left: 4px solid #0EA5E9; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background-color: #0EA5E9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouvelle demande d'accès</h1>
        </div>
        <div class="content">
          <p>Une nouvelle demande d'accès à OperaFlow nécessite votre validation.</p>
          
          <div class="info-box">
            <p><strong>Nom :</strong> ${nom} ${prenom}</p>
            <p><strong>Email :</strong> ${email}</p>
          </div>
          
          <a href="${process.env.APP_BASE_URL || 'https://operaflow.app'}/admin/users" class="button">
            Voir les demandes en attente
          </a>
        </div>
        <div class="footer">
          <p>OperaFlow - Application de suivi, planification et pilotage d'activités</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(adminEmail, subject, html);
}

