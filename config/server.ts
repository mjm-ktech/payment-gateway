export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  vietqr: {
    clientId: env('VIETQR_CLIENT_ID'),
    apiKey: env('VIETQR_API_KEY'),
    apiUrl: env('VIETQR_API_URL') + '/generate'
  },
  web: {
    client_id: env('CLIENT_ID', '118885594819-prrqamslq0d2t2v5bn1tebvfqu4tnddk.apps.googleusercontent.com'),
    project_id: env('PROJECT_ID','payment-gateway-424707'),
    auth_uri: env('AUTH_URI','https://accounts.google.com/o/oauth2/auth'),
    token_uri: env('TOKEN_URI','https://oauth2.googleapis.com/token'),
    auth_provider_x509_cert_url: env('AUTH_PROVIDER_X509_CERT_URL','https://www.googleapis.com/oauth2/v1/certs'),
    client_secret: env('CLIENT_SECRET', 'CLIENT_SECRET'),
    redirect_uris: env('REDIRECT_URIS', 'http://localhost:1337/api/oauth2-callback')
  }
});
