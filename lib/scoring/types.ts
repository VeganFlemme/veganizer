// Input and output types of the scoring engine. Pure data: no network, no Supabase.

export interface Ingredient {
  foodCode: string;
  /** Grams for the whole recipe, in the state actually eaten. */
  grams: number;
}

export interface Dish {
  servings: number;
  ingredients: Ingredient[];
  /**
   * Impacts of the dish itself, for the whole recipe, without mass: the « Autres étapes » of an
   * AGRIBALYSE dish (processing, packaging, transport, cooking), kept identical on both sides.
   */
  fixedImpacts?: Record<string, { value: number; sourceId: string }>;
}

/** One impact value per kg of food (food_impacts row). */
export interface ImpactPerKg {
  value: number;
  /** Lower bound per kg; null = not published (the value is used, as in dish_impacts). */
  low: number | null;
  /** Upper bound per kg; null = not published (the value is used, as in dish_impacts). */
  high: number | null;
  /** Agribalyse data quality rating: 1 = reliable, 5 = uncertain. */
  dqr: number | null;
  sourceId: string;
}

export interface FoodData {
  /** Per 100 g. Absent key or null = missing data, never 0. */
  nutrients: Record<string, number | null | undefined>;
  /**
   * Per 100 g, values published by Ciqual as « < x »: known to lie between 0 and x (Ciqual 2025
   * documentation, p. 21: « une valeur maximale »). Used only where `nutrients` has no number:
   * low bound with 0, high bound with x, never x/2. « traces » is not here (missing data).
   */
  nutrientMax?: Record<string, number | undefined>;
  /** Source of the nutrient values (e.g. 'ciqual-2025'). */
  nutrientSourceId?: string;
  /** Per kg, keyed by indicator id. Absent key = missing data. */
  impacts: Record<string, ImpactPerKg | undefined>;
  /** foods.is_animal: false means "no animal ingredient identified", not "vegan". */
  isAnimal: boolean;
  /** foods.animal_category; null for an animal food = category unknown (missing data). */
  animalCategory: string | null;
  /** Food whose category factors apply (an official recipe ingredient standing for a Ciqual food); default = its own code. */
  factorCode?: string;
}

/** One category_factors row. */
export interface CategoryFactor {
  value: number;
  low: number | null;
  high: number | null;
  sourceId: string;
  /**
   * Basis of the value: "kg" (default) = per kg of product; "animal" = per animal
   * (pain hours, days of life), converted to per kg with the animals_killed_land
   * factor of the same category (missing data when that factor is absent).
   */
  per?: "kg" | "animal";
  /** When set, the factor applies to these food codes only (other foods of the category: missing data). */
  foodCodes?: string[] | null;
}

export interface ScoringData {
  foods: Record<string, FoodData | undefined>;
  /**
   * category -> indicator id -> factor per kg, or several factors with disjoint `foodCodes`
   * (e.g. per kg of milk for liquid milks, per kg of cheese for cheeses).
   */
  categoryFactors: Record<string, Record<string, CategoryFactor | CategoryFactor[] | undefined> | undefined>;
}

/** A value for the dish, per serving and normalised. null = donnée manquante. */
export interface Amount {
  /** Central value; null when only a range is known (an ingredient published as « < x »). */
  perServing: number | null;
  lowPerServing: number | null;
  highPerServing: number | null;
  per100kcal: number | null;
  per10gProtein: number | null;
  /** Share (0–1) of the dish mass covered by data for this indicator. Warn if < 0.95. */
  massCoverage: number;
  /** Worst (highest) DQR among covered ingredients; null if none published. */
  worstDqr: number | null;
  /** Sources of the values actually used. */
  sourceIds: string[];
  /** true when an ingredient value is published as « < x »: only [low, high] is known. */
  censored?: boolean;
}

export interface DishTotals {
  totalGrams: number;
  servings: number;
  /** Energy per serving used for "per 100 kcal" (null if missing). */
  kcalPerServing: number | null;
  /** Protein per serving used for "per 10 g protein" (null if missing). */
  proteinPerServing: number | null;
  nutrients: Record<string, Amount>;
  /** From food_impacts (per kg of each food). */
  impacts: Record<string, Amount>;
  /** From category_factors (animals, pain…), as in dish_animal_impacts. */
  animalImpacts: Record<string, Amount>;
}
