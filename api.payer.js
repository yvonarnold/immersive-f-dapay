const { FedaPay, Transaction } = require('fedapay');

module.exports = async (req, res) => {
  FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
  FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'live'); // 'sandbox' pour test ou 'live' en réel

  const { forfait } = req.query;

  // Vos forfaits (Prix en FCFA et nom du profil dans MikroTik)
  const forfaits = {
    '1h':  { prix: 100,  profil: '1H',  desc: 'Pass Wi-Fi 1 Heure - Immersive' },
    '24h': { prix: 300,  profil: '24H', desc: 'Pass Wi-Fi 24 Heures - Immersive' },
    '7j':  { prix: 1500, profil: '7J',  desc: 'Pass Wi-Fi 7 Jours - Immersive' }
  };

  const choix = forfaits[forfait];
  if (!choix) return res.status(400).send('Forfait invalide');

  // Génère immédiatement un code ticket unique (ex: WIF4829)
  const codeTicket = 'WIF' + Math.floor(1000 + Math.random() * 9000);
  const baseUrl = `https://${req.headers.host}`;

  try {
    const transaction = await Transaction.create({
      description: choix.desc,
      amount: choix.prix,
      currency: { iso: 'XOF' },
      callback_url: `${baseUrl}/merci.html?code=${codeTicket}`,
      custom_metadata: {
        ticket_code: codeTicket,
        mikrotik_profile: choix.profil
      }
    });

    const token = await transaction.generateToken();
    return res.redirect(302, token.url);
  } catch (error) {
    return res.status(500).send('Erreur FedaPay : ' + error.message);
  }
};
