export default {
  routes: [
    {
      method: 'POST',
      path: '/grant-permissions',
      handler: 'bank-account.grantPermissions'
    },
    {
      method: 'GET',
      path: '/oauth2-callback',
      handler: 'bank-account.oauth2callback'
    }
  ]
}
