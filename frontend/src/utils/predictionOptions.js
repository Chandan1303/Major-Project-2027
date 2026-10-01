function normalizeState(state) {
  return (state || '')
    .trim()
    .replace(/^(southern|northern|central|western|eastern)\s+/i, '')
    .toLocaleLowerCase();
}

export function filterVarietiesForState(varieties, state) {
  if (!state) return varieties || [];
  const selectedState = normalizeState(state);
  return (varieties || []).filter(variety =>
    (variety.recommended_states || []).some(
      recommendedState => normalizeState(recommendedState) === selectedState
    )
  );
}

export function changePredictionState(formData, state) {
  return {
    ...formData,
    state,
    district: '',
    variety: '',
    season: '',
    soil_type: '',
    location: ''
  };
}