export class PointsCalculator {
  static calculatePoints(
    matchDuration: number,
    finalScore: string,
    status: string,
  ): { winnerPoints: number; loserPoints: number } {
    const [winnerScore, loserScore] = finalScore.split('-').map(Number);

    let winnerPoints = 0; // Points de base pour le gagnant
    let loserPoints = 0; // Points de base pour le perdant

    if (status === 'Abandon') {
      if (matchDuration < 60) {
        winnerPoints = 0;
        loserPoints = -10;
      } else if (matchDuration < 300) {
        winnerPoints = 2;
        loserPoints = -5;
      } else if (matchDuration >= 300 && matchDuration < 600) {
        winnerPoints = 5;
        loserPoints = -5;
      }
    }
    if (status === 'Temps écoulé') {
      winnerPoints = 5;
      loserPoints = -5;
    }
    if (status === 'Terminé') {
      winnerPoints = 10;
      loserPoints = -5;

      const scoreDifference = Math.abs(winnerScore - loserScore);

      if (scoreDifference <= 2) {
        winnerPoints += 2;
        loserPoints += 2;
      } else if (scoreDifference > 2 && scoreDifference <= 5) {
        winnerPoints += 2;
        loserPoints += 0;
      }
    }
    return { winnerPoints, loserPoints };
  }
}
