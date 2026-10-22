export function createCookingApi(client) {
  return {
    preview: (mealPlanId, signal) => client.get('/cooking/preview', { params: { mealPlanId }, signal }).then((response) => response.data),
    complete: (mealPlanId) => client.post('/cooking-events', { mealPlanId }).then((response) => response.data),
    cancel: (eventId) => client.post(`/cooking-events/${eventId}/cancel`).then((response) => response.data),
  }
}
