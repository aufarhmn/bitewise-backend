const math = require("mathjs");

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
    return res.status(400).json({
      error: "Criteria, weights, negativityBias, and values length mismatch"
    });
  }

  const normalizedValues = {};

  criteria.forEach((criterion, index) => {
    const criterionValues = choices.map((choice) => values[choice][index]);

    const highestValue = Math.max(...criterionValues);
    const lowestValue = Math.min(...criterionValues);

    choices.forEach((choice) => {
      const currentValue = values[choice][index];
      const isNegative = negativityBias[index];

      let normalizedValue;
      if (isNegative) {
        normalizedValue = lowestValue / currentValue;
      } else {
        normalizedValue = currentValue / highestValue;
      }

      if (!normalizedValues[choice]) {
        normalizedValues[choice] = [];
      }

      normalizedValues[choice][index] = normalizedValue;
    });
  });

  const scores = choices.map((choice) => {
    const totalScore = criteria.reduce((score, criterion, index) => {
      const normalizedValue = normalizedValues[choice][index];
      const weight = weights[index];

      return score + normalizedValue * weight;
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
    return res.status(400).json({
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
        (sum, _, j) =>
          sum + Math.pow(weightedValues[choice][j] - idealSolution[j], 2),
        0
      )
    );
    const negativeSeparation = Math.sqrt(
      criteria.reduce(
        (sum, _, j) =>
          sum +
          Math.pow(weightedValues[choice][j] - negativeIdealSolution[j], 2),
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

  const rankedChoices = relativeCloseness.sort(
    (a, b) => b.closeness - a.closeness
  );

  return res.status(200).json({ rankedChoices });
};

exports.AHPMethod = async (req, res) => {
  const { criteria, comparisons, alternatives, alternativeScores } = req.body;

  if (!criteria || !comparisons || !alternatives || !alternativeScores) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (criteria.length !== comparisons.length) {
    return res.status(400).json({ error: "Criteria and comparisons length mismatch" });
  }

  const criteriaWeights = comparisons.map((comparisonMatrix) => {
    const matrix = math.matrix(comparisonMatrix.map(row => row.map(value => math.evaluate(value))));

    const rowGeometricMeans = matrix.toArray().map(row => {
      const product = row.reduce((acc, val) => acc * val, 1);
      return math.pow(product, 1 / row.length);
    });

    const sumGeometricMeans = math.sum(rowGeometricMeans);
    return rowGeometricMeans.map(value => value / sumGeometricMeans);
  });

  const flattenedWeights = criteriaWeights.flat();
  const totalWeight = math.sum(flattenedWeights);
  const normalizedCriteriaWeights = flattenedWeights.map(weight => weight / totalWeight);

  const scores = alternatives.map(alternative => {
    const alternativeValues = alternativeScores[alternative];
    const totalScore = criteria.reduce((sum, criterion, index) => {
      return sum + alternativeValues[index] * normalizedCriteriaWeights[index];
    }, 0);
    return { alternative, totalScore };
  });

  const rankedAlternatives = scores.sort((a, b) => b.totalScore - a.totalScore);

  return res.status(200).json({ rankedAlternatives });
};
