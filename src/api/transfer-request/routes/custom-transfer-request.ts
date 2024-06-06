export default {
  routes: [
    {
      method: 'POST',
      path: '/request/generate',
      handler: 'transfer-request.generate'
    },
    {
      method: 'POST',
      path: '/request/check-status',
      handler: 'transfer-request.checkStatus'
    }
  ]
}
