const { RouterOSAPI } = require('node-routeros');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const event = req.body;
  // Vérifie que le paiement FedaPay est bien approuvé
  if (!event || event.name !== 'transaction.approved') {
    return res.status(200).send('Événement ignoré');
  }

  const meta = event.entity.custom_metadata;
  if (!meta || !meta.ticket_code) {
    return res.status(400).send('Métadonnées manquantes');
  }

  const conn = new RouterOSAPI({
    host: process.env.MIKROTIK_HOST,     // Votre adresse IP publique ou DNS Cloud MikroTik
    user: process.env.MIKROTIK_USER,     // Utilisateur API MikroTik
    password: process.env.MIKROTIK_PASS, // Mot de passe API MikroTik
    port: parseInt(process.env.MIKROTIK_PORT || '8728'),
    timeout: 10
  });

  try {
    await conn.connect();
    await conn.write('/ip/hotspot/user/add', [
      `=name=${meta.ticket_code}`,
      `=password=${meta.ticket_code}`, // Code identique pour Identifiant et Mot de passe
      `=profile=${meta.mikrotik_profile}`,
      `=comment=Paye via FedaPay`
    ]);
    await conn.close();
    return res.status(200).json({ status: 'Ticket créé', code: meta.ticket_code });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur connexion MikroTik', details: err.message });
  }
};
