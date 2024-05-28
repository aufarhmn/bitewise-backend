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
