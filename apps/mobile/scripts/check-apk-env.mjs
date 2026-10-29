// Runs on EAS before dependency installation. Never prints credential values.
const required = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];
const errors = required
  .filter((name) => !process.env[name]?.trim())
  .map((name) => `Falta ${name} en el entorno preview de EAS.`);

for (const name of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_SUPABASE_URL']) {
  const raw = process.env[name]?.trim();
  if (!raw) continue;
  try {
    const url = new URL(raw);
    const local =
      /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(
        url.hostname,
      );
    if (url.protocol !== 'https:' || local || url.username || url.password) {
      errors.push(`${name} debe ser una URL pública HTTPS, sin credenciales.`);
    }
    if (
      name === 'EXPO_PUBLIC_API_URL' &&
      url.pathname.replace(/\/$/, '') !== ''
    ) {
      errors.push(
        'EXPO_PUBLIC_API_URL debe apuntar a la raíz del gateway, sin /api ni otras rutas.',
      );
    }
  } catch {
    errors.push(`${name} no es una URL válida.`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Variables públicas del APK configuradas correctamente.');
