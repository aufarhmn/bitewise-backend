exports.scoringMethod = async (req, res) => {
  const { criteria, weights, choices, values, negativityBias } = req.body;

  if (!criteria || !weights || !choices || !values || !negativityBias) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    criteria.length !== weights.length ||
    criteria.length !== negativityBias.length ||
    choices.some((choice) => values[choice].length !== criteria.length)
  ) {
    return res
      .status(400)
      .json({
        error: "Criteria, weights, negativityBias, and values length mismatch"
      });
  }

  const scores = choices.map((choice) => {
    const totalScore = criteria.reduce((score, criterion, index) => {
      const value = values[choice][index];
      const weight = weights[index];
      const isNegative = negativityBias[index];

      const adjustedValue = isNegative ? -value : value;

      return score + adjustedValue * weight;
    }, 0);
    return { choice, totalScore };
  });

  return res.status(200).json({ scores });
};

exports.topsisMethod = async (req, res) => {
  const { criteria, weights, choices, values, negativityBias } = req.body;

  if (!criteria || !weights || !choices || !values || !negativityBias) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    criteria.length !== weights.length ||
    criteria.length !== negativityBias.length ||
    choices.some((choice) => values[choice].length !== criteria.length)
  ) {
    return res
      .status(400)
      .json({
        error: "Criteria, weights, negativityBias, and values length mismatch"
      });
  }

  const numCriteria = criteria.length;

  const normalizedValues = {};
  criteria.forEach((criterion, j) => {
    const denom = Math.sqrt(
      choices.reduce((sum, choice) => sum + Math.pow(values[choice][j], 2), 0)
    );

    choices.forEach((choice) => {
      if (!normalizedValues[choice]) normalizedValues[choice] = [];
      normalizedValues[choice][j] = values[choice][j] / denom;
    });
  });

  const weightedValues = {};
  choices.forEach((choice) => {
    weightedValues[choice] = normalizedValues[choice].map(
      (value, j) => value * weights[j]
    );
  });

  const idealSolution = new Array(numCriteria).fill(0);
  const negativeIdealSolution = new Array(numCriteria).fill(0);

  criteria.forEach((criterion, j) => {
    idealSolution[j] = negativityBias[j]
      ? Math.min(...choices.map((choice) => weightedValues[choice][j]))
      : Math.max(...choices.map((choice) => weightedValues[choice][j]));

    negativeIdealSolution[j] = negativityBias[j]
      ? Math.max(...choices.map((choice) => weightedValues[choice][j]))
      : Math.min(...choices.map((choice) => weightedValues[choice][j]));
  });

  const separationMeasures = choices.map((choice) => {
    const positiveSeparation = Math.sqrt(
      criteria.reduce(
        (sum, _, j) => sum + Math.pow(weightedValues[choice][j] - idealSolution[j], 2),
        0
      )
    );
    const negativeSeparation = Math.sqrt(
      criteria.reduce(
        (sum, _, j) => sum + Math.pow(weightedValues[choice][j] - negativeIdealSolution[j], 2),
        0
      )
    );
    return { choice, positiveSeparation, negativeSeparation };
  });

  const relativeCloseness = separationMeasures.map(
    ({ choice, positiveSeparation, negativeSeparation }) => ({
      choice,
      closeness: negativeSeparation / (positiveSeparation + negativeSeparation)
    })
  );

  const rankedChoices = relativeCloseness.sort((a, b) => b.closeness - a.closeness);

  return res.status(200).json({ rankedChoices });
};
