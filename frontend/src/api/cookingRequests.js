export function createCookingApi(client) {
  return {
    preview: (mealPlanId, signal) => client.get('/cooking/preview', { params: { mealPlanId }, signal }).then((response) => response.data),
    complete: (mealPlanId) => client.post('/cooking-events', { mealPlanId }).then((response) => response.data),
    previewUsages: (body, signal) => client.post('/cooking/preview', body, { signal }).then((response) => response.data),
    previewIngredients: (body, signal) => client.post('/cooking/ingredients/preview', body, { signal }).then((response) => response.data),
    completeUsages: (body) => client.post('/cooking-events', body).then((response) => response.data),
    completeIngredients: (body) => client.post('/cooking-events/ingredients', body).then((response) => response.data),
    cancel: (eventId) => client.post(`/cooking-events/${eventId}/cancel`).then((response) => response.data),
  }
}
