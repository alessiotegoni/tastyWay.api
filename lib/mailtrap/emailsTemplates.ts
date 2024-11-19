export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica il tuo indirizzo email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Verifica il tuo indirizzo email</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Ciao, {username}</p>
    <p>Grazie per esserti registrato! Il tuo codice di verifica è:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">{verificationCode}</span>
    </div>
    <p>Inserisci questo codice nella pagina di verifica per completare la registrazione.</p>
    <p>Per motivi di sicurezza, il codice scadrà tra 15 minuti.</p>
    <p>Se non hai creato un account con noi, ignora questa email.</p>
    <p>Cordiali saluti,<br>Il Team della tua App</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>Questo è un messaggio automatico, si prega di non rispondere a questa email.</p>
  </div>
</body>
</html>

`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset della password completato</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Reset della password completato</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Ciao,</p>
    <p>Ti scriviamo per confermare che il reset della tua password è stato completato con successo.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #4CAF50; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 30px;">
        ✓
      </div>
    </div>
    <p>Se non hai richiesto il reset della password, contatta immediatamente il nostro team di supporto.</p>
    <p>Per motivi di sicurezza, ti consigliamo di:</p>
    <ul>
      <li>Utilizzare una password forte e unica</li>
      <li>Abilitare l'autenticazione a due fattori, se disponibile</li>
      <li>Evitare di utilizzare la stessa password su più siti</li>
    </ul>
    <p>Grazie per aver contribuito a mantenere sicuro il tuo account.</p>
    <p>Cordiali saluti,<br>Il Team della tua App</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>Questo è un messaggio automatico, si prega di non rispondere a questa email.</p>
  </div>
</body>
</html>

`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset della tua password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Reset della password</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Ciao,</p>
    <p>Abbiamo ricevuto una richiesta per resettare la tua password. Se non hai effettuato questa richiesta, ignora questa email.</p>
    <p>Per resettare la tua password, clicca sul pulsante qui sotto:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Resetta la Password</a>
    </div>
    <p>Per motivi di sicurezza, questo link scadrà entro 1 ora.</p>
    <p>Cordiali saluti,<br>Il Team della tua App</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>Questo è un messaggio automatico, si prega di non rispondere a questa email.</p>
  </div>
</body>
</html>

`;
