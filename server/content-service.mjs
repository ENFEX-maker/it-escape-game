export function validateStationPatch(patch) {
  if (!patch || typeof patch !== 'object') throw new Error('Ungültige Stationsdaten.');
  if (!/^\d{3}$/.test(String(patch.code || ''))) throw new Error('Der Code muss exakt dreistellig sein.');
  if (!Array.isArray(patch.materials) || patch.materials.length === 0) {
    throw new Error('Materialien müssen ein nicht-leeres Array sein.');
  }
  if (patch.hints !== undefined && !Array.isArray(patch.hints)) {
    throw new Error('Hinweise müssen ein Array sein.');
  }
}

export function applyStationPatch(content, stationId, patch) {
  validateStationPatch(patch);
  const stationExists = content.stations.some((station) => station.id === stationId);
  if (!stationExists) throw new Error(`Station nicht gefunden: ${stationId}`);

  const stations = content.stations.map((station) => station.id === stationId ? {
    ...station,
    title: patch.title ?? station.title,
    topic: patch.topic ?? station.topic,
    code: patch.code,
    estimatedMinutes: Number(patch.estimatedMinutes) || station.estimatedMinutes,
    story: patch.story ?? station.story,
    task: patch.task ?? station.task,
    materials: patch.materials,
    learningPoint: patch.learningPoint ?? station.learningPoint,
    careerLink: patch.careerLink ?? station.careerLink
  } : { ...station });

  const hints = {
    ...content.hints,
    [stationId]: patch.hints || content.hints[stationId] || []
  };

  const existingSolutions = content.facilitator?.solutions || [];
  const hasSolution = existingSolutions.some((solution) => solution.stationId === stationId);
  const solutions = hasSolution
    ? existingSolutions.map((solution) => solution.stationId === stationId ? {
        ...solution,
        code: patch.code,
        shortSolution: patch.shortSolution ?? solution.shortSolution ?? '',
        explanation: patch.explanation ?? solution.explanation ?? ''
      } : { ...solution })
    : [...existingSolutions, {
        stationId,
        code: patch.code,
        shortSolution: patch.shortSolution || '',
        explanation: patch.explanation || ''
      }];

  return {
    ...content,
    stations,
    hints,
    facilitator: {
      ...(content.facilitator || {}),
      solutions
    }
  };
}
