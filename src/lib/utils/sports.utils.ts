import { SportPreference, SportType, SportLevel } from '@/types/database'

/**
 * Utilitaires pour la gestion des sports et niveaux
 * Service statique simple pour remplacer les méthodes statiques du service utilisateur
 */

export class SportsUtils {
  static createSportPreference(sport: SportType, level: SportLevel): SportPreference {
    return { sport, level }
  }

  static getAllSportTypes(): SportType[] {
    return [
      SportType.FOOT,
      SportType.COURSE,
      SportType.TENNIS,
      SportType.BASKET,
      SportType.NATATION
    ]
  }

  static getAllSportLevels(): SportLevel[] {
    return [
      SportLevel.DEBUTANT,
      SportLevel.INTERMEDIAIRE,
      SportLevel.CONFIRME,
      SportLevel.EXPERT
    ]
  }

  static getSportDisplayName(sport: SportType): string {
    const displayNames = {
      [SportType.FOOT]: 'Football',
      [SportType.COURSE]: 'Course à pied',
      [SportType.TENNIS]: 'Tennis',
      [SportType.BASKET]: 'Basketball',
      [SportType.NATATION]: 'Natation'
    }
    return displayNames[sport]
  }

  static getLevelDisplayName(level: SportLevel): string {
    const levelNames = {
      [SportLevel.DEBUTANT]: 'Débutant',
      [SportLevel.INTERMEDIAIRE]: 'Intermédiaire',
      [SportLevel.CONFIRME]: 'Confirmé',
      [SportLevel.EXPERT]: 'Expert'
    }
    return levelNames[level]
  }

  static getSportIcon(sport: SportType): string {
    const icons = {
      [SportType.FOOT]: '⚽',
      [SportType.COURSE]: '🏃',
      [SportType.TENNIS]: '🎾',
      [SportType.BASKET]: '🏀',
      [SportType.NATATION]: '🏊'
    }
    return icons[sport]
  }

  static getLevelColor(level: SportLevel): string {
    const colors = {
      [SportLevel.DEBUTANT]: 'var(--color-green)',
      [SportLevel.INTERMEDIAIRE]: 'var(--color-orange)',
      [SportLevel.CONFIRME]: 'var(--color-mint)',
      [SportLevel.EXPERT]: 'var(--color-black)'
    }
    return colors[level]
  }
}