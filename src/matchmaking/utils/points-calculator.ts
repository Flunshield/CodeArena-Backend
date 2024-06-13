export class PointsCalculator {
  static calculatePoints(
    matchDuration: number,
    finalScore: string,
  ): { winnerPoints: number; loserPoints: number } {
    const [winnerScore, loserScore] = finalScore.split('-').map(Number);

    let winnerPoints = 10; // Points de base pour le gagnant
    let loserPoints = 0; // Points de base pour le perdant

    // Ajustement des points en fonction de la durée du match (exemple)
    if (matchDuration < 60) {
      // Si le match a duré moins d'une minute
      winnerPoints = 0;
      loserPoints = -10;
    } else if (matchDuration < 300) {
      // Si le match a duré moins de 5 minutes
      winnerPoints += 5;
      loserPoints += 0;
    } else if (matchDuration >= 300 && matchDuration <= 600) {
      // Si le match a duré entre 5 et 10 minutes
      winnerPoints += 3;
      loserPoints += 0;
    }
    // Ajustement des points en fonction de l'écart de score, seulement si le match a duré plus d'une minute
    if (matchDuration >= 60) {
      const scoreDifference = Math.abs(winnerScore - loserScore);
      if (scoreDifference <= 2) {
        // Match serré
        winnerPoints += 2;
        loserPoints += 2;
      } else if (scoreDifference > 2 && scoreDifference <= 5) {
        // Match avec un écart modéré
        winnerPoints += 1;
        loserPoints += 0;
      }
    }
    return { winnerPoints, loserPoints };
  }
}
