"""Animal-origin classification of foods.

    python pipeline/animal_categories.py build [--force]   # draft pipeline/animal_categories.csv from rules
    python pipeline/animal_categories.py import            # load the reviewed CSV into foods

The CSV is the reviewed, versioned source of truth; `build` only drafts it.
Classification (no numeric data):
- composition = 'pur'   : the food itself is an animal product (meat, fish, egg, dairy, honey…)
                          -> is_animal = true, animal_category from CATEGORIES.
- composition = 'mixte' : contains an animal ingredient (dish, pastry, milk chocolate…)
                          -> is_animal = true, animal_category empty: a per-kg category
                          factor must not be applied to the whole mass of a mixed food.
Foods not listed are is_animal = false ("no animal ingredient identified", not "certified vegan").
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import unicodedata
from pathlib import Path

import pandas as pd

from common import RAW, fetch_all, get_client

CSV_PATH = Path(__file__).resolve().parent / "animal_categories.csv"
CATEGORIES = [
    # requested list
    "bovin", "veau", "porc", "agneau", "poulet de chair", "dinde", "canard", "poule pondeuse",
    "vache laitière", "brebis laitière", "chèvre laitière",
    "saumon d'élevage", "truite d'élevage", "poisson d'élevage (autre)", "poisson sauvage", "poisson origine inconnue",
    "crevette d'élevage", "crevette sauvage", "mollusques", "céphalopodes", "abeille",
    # added: groups too large to be "isolated cases"
    "crustacés (hors crevettes)", "lapin", "cheval", "gibier", "oie", "volaille (espèce non précisée)",
    "plusieurs espèces",
    # isolated cases only
    "autre",
]


def fold(s: str) -> str:
    s = s.lower().replace("œ", "oe").replace("æ", "ae")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def rx(*words: str) -> re.Pattern:
    return re.compile(r"\b(" + "|".join(words) + r")\b")


# Names that are plant-based even though they contain an animal word
VEGAN = rx(r"vegetale?s?", r"vegetaux", r"convient aux veganes", r"vegan(e|es)?", r"boisson (a base )?(de|d')",
           r"fromage de soja", r"dessert au soja", r"tofu", r"seitan", r"tempeh", r"substitut")
NOT_VEGAN = rx(r"ne convient pas aux veganes")
# Phrases removed before matching: they contain an animal word but name a plant food or say nothing
NEUTRAL = rx(r"fruits a coques?", r"autre que pur beurre", r"pomme de lait", r"melon miel", r"haricots? beurre",
             r"caviar d'aubergines?", r"caviar de tomates?", r"julienne ou brunoise",
             r"groseilles? a maquereau", r"a la coque", r"coeur de boeuf", r"kefir d'eau",
             r"lait de (soja|coco|riz|amande|avoine|noisette|chataigne)", r"lait d'amande", r"creme de (coco|marrons?|soja)",
             r"beurre de (cacahuete|cacao|karite|noix|amande|arachide)")
# Reference recipes that contain animal products by definition (used for mixed foods only)
RECIPES = rx(r"croissant pur beurre", r"brioches?", r"briochee?s?", r"kouign amann", r"creme glacee", r"cheeseburger",
             r"hamburger", r"bouchee a la reine", r"cassoulet", r"nougat", r"guimauve", r"madeleines?", r"crepes?",
             r"pancakes?", r"gaufres?", r"quiches?", r"baba", r"cheesecake", r"panettone", r"mini-chou", r"choux",
             r"eclairs?", r"profiteroles", r"tiramisu", r"far breton", r"clafoutis", r"financiers?", r"macarons?",
             r"carbonara", r"bolognaise", r"lasagnes?", r"hachis parmentier", r"croque-monsieur", r"gougeres?",
             r"(pizza|sandwich|sandwich baguette|gateau|patisserie|viennoiserie|feuillete ou friand sale|"
             r"tarte ou quiche salee) \(aliment moyen\)")

# Ordered rules: first match wins. (category, regex on folded name)
RULES: list[tuple[str, re.Pattern]] = [
    # Mixed species: no single category applies
    ("autre", rx(r"porc et boeuf", r"boeuf et porc", r"merguez")),
    # Cow-milk dairy whose name contains a misleading word (vache, pâte, tête, coque, feta…)
    ("vache laitière", rx(r"lait de vache", r"tome de vache", r"specialite fromagere", r"pate (molle|pressee|dure|persillee|filee)",
                          r"tete de moine", r"fromage (rond|pour tartiflette)")),
    ("poisson sauvage", rx(r"oeufs? de (lump|cabillaud|poisson|truite|saumon|hareng|mulet)", r"caviar", r"tarama")),
    ("autre", rx(r"oeufs? de (caille|cane|oie)", r"lait de (chevre|brebis|anesse|jument|bufflonne)",
                 r"chevre", r"brebis", r"bufflonne", r"bufflesse", r"buflesse", r"bufala", r"feta", r"roquefort", r"pecorino",
                 r"ossau", r"manchego", r"crottin", r"sainte[- ]maure", r"valencay", r"chabichou",
                 r"picodon", r"rocamadour", r"perail", r"halloumi")),
    ("veau", rx(r"veau")),
    ("agneau", rx(r"agneau", r"mouton", r"gigot")),
    ("dinde", rx(r"dinde", r"dindonneau")),
    ("canard", rx(r"canard", r"magret", r"foie gras de canard")),
    ("autre", rx(r"oie", r"foie gras d'oie", r"lapin", r"cheval", r"chevaline?", r"cerf", r"chevreuil", r"biche",
                 r"sanglier", r"gibier", r"pigeon", r"caille", r"pintade", r"autruche", r"kangourou", r"escargots?",
                 r"grenouilles?", r"merguez", r"volaille", r"miel", r"gelatine", r"bison", r"faisan", r"perdrix")),
    ("canard", rx(r"foie gras")),  # unspecified foie gras: French production is ~95 % duck
    ("poulet de chair", rx(r"poulet", r"coquelet", r"chapon", r"nuggets? de poulet")),
    ("poule pondeuse", rx(r"poule")),
    ("saumon d'élevage", rx(r"saumon")),  # see refine(): wild salmon -> poisson sauvage
    ("crevette d'élevage", rx(r"crevettes?", r"gambas", r"scampi")),  # see refine(): grey/northern shrimp -> wild
    ("autre", rx(r"truite", r"pangas(ius)?", r"tilapia", r"carpe", r"esturgeon", r"silure",
                 r"moules?", r"huitres?", r"coquilles? saint[- ]jacques", r"saint[- ]jacques", r"petoncles?", r"calmars?",
                 r"encornets?", r"seiches?", r"poulpes?", r"bulots?", r"bigorneaux?", r"palourdes?", r"praires?", r"clams?",
                 r"coques?", r"couteaux?", r"ormeaux?", r"oursins?", r"crabes?", r"tourteaux?", r"homards?", r"langoustes?",
                 r"langoustines?", r"ecrevisses?", r"araignee", r"tourteau", r"fruits de mer", r"mollusques?",
                 r"crustaces?")),
    ("poisson sauvage", rx(r"produits de la mer", r"surimi")),
    ("poisson sauvage", rx(r"poissons?", r"cabillaud", r"morue", r"colin", r"lieu", r"merlu", r"merlan", r"thon", r"sardines?",
                           r"maquereaux?", r"harengs?", r"anchois", r"sole", r"plie", r"carrelet", r"eglefin", r"haddock",
                           r"raie", r"lotte", r"baudroie", r"rouget", r"sabre", r"fletan", r"julienne", r"lingue",
                           r"grondin", r"rascasse", r"congre", r"saint[- ]pierre", r"turbot", r"barbue", r"limande",
                           r"bar", r"loup de mer", r"dorade", r"daurade", r"sprat", r"mulet", r"perche", r"brochet",
                           r"sandre", r"anguille", r"espadon", r"empereur", r"hoki", r"tacaud", r"capelan",
                           r"eperlan", r"flet", r"vivaneau", r"sebaste", r"grenadier", r"cardine",
                           r"brosme", r"requin", r"roussette", r"emissole", r"thazard", r"bonite", r"merou",
                           r"hareng", r"rollmops", r"brandade", r"esprot", r"pilchard", r"pageot")),
    ("bovin", rx(r"boeuf", r"bovin", r"rosbif", r"corned beef", r"bresaola", r"pot-au-feu")),
    ("porc", rx(r"porc", r"porcelet", r"cochon", r"jambon", r"jambonneau", r"lard", r"lardons?", r"bacon", r"saucissons?",
                r"saucisses?", r"chipolatas?", r"boudin", r"andouillette", r"andouille", r"rillettes?", r"rillons",
                r"pate", r"pates de campagne", r"terrine", r"chorizo", r"coppa", r"pancetta", r"saindoux", r"couenne",
                r"cervelas", r"mortadelle", r"rosette", r"salami", r"knack", r"francfort", r"strasbourg", r"museau",
                r"fromage de tete", r"tete", r"travers", r"echine", r"filet mignon", r"rillauds", r"grattons",
                r"cretons", r"lonzo", r"figatelli", r"jesus", r"chair a saucisse", r"hot[- ]dog")),
    ("autre", rx(r"viandes?")),
    ("poule pondeuse", rx(r"oeufs?", r"omelette", r"jaune d'oeuf", r"blanc d'oeuf", r"meringue")),
    ("vache laitière", rx(r"lait", r"laitiere?", r"lactees?", r"lacte", r"lactose", r"beurre", r"ghee", r"fromages?", r"fromage blanc", r"yaourts?",
                          r"yoghourts?", r"creme", r"cremes", r"petit[- ]suisse", r"kefir", r"babeurre", r"lactoserum",
                          r"caseine", r"camembert", r"brie", r"comte", r"emmental", r"gruyere", r"beaufort", r"cantal",
                          r"reblochon", r"raclette", r"mozzarella", r"parmesan", r"mimolette", r"edam", r"gouda",
                          r"munster", r"maroilles", r"livarot", r"pont-l'eveque", r"coulommiers", r"saint-nectaire",
                          r"tomme", r"morbier", r"mont d'or", r"vacherin", r"bleu", r"fourme", r"cheddar", r"ricotta",
                          r"mascarpone", r"burrata", r"faisselle", r"skyr", r"cancoillotte", r"boursin", r"carre frais",
                          r"saint-marcellin", r"chaource", r"neufchatel", r"langres", r"epoisses", r"abondance",
                          r"saint-paulin", r"port-salut", r"fromage fondu", r"chantilly", r"fromage frais",
                          r"glace", r"flan", r"chocolat au lait", r"chocolat blanc", r"brioche", r"croissant",
                          r"viennoiserie", r"quiche", r"gratin", r"bechamel", r"cordon bleu", r"lactique")),
]

# Subgroups whose foods are animal products themselves (unless the name says plant-based)
PURE_SUBGROUPS = {
    "viandes crues", "viandes cuites", "charcuteries", "charcuteries et alternatives végétales", "oeufs",
    "poissons crus", "poissons cuits", "mollusques et crustacés crus", "mollusques et crustacés cuits",
    "produits à base de poissons et produits de la mer", "autres produits à base de viande", "huiles de poissons",
    "beurres", "autres matières grasses", "fromages", "fromages et alternatives végétales", "laits", "crèmes et spécialités à base de crème",
    "produits laitiers frais et assimilés", "produits laitiers frais et alternatives végétales",
}
# Rules that are plausible for a pure product but not proof of an animal ingredient in a mixed one
MIXED_ONLY_EXCLUDED = rx(r"glace", r"flan", r"brioche", r"croissant", r"viennoiserie", r"gratin", r"quiche",
                         r"pate", r"terrine", r"tete", r"bar", r"sole", r"lieu",
                         r"flet", r"empereur", r"brie", r"bleu", r"creme", r"cremes", r"jesus")

# Agribalyse "Détail par ingrédient" labels that are animal products
ANIMAL_INGREDIENTS = {
    "Abats de bœuf", "Abats de porc", "Abats de poulet", "Abats de veau", "Ailes de canard gras", "Anchois",
    "Anchois commun", "Beurre", "Blanc d'oeuf", "Bœuf haché", "Calamar", "Camembert", "Canard gras",
    "Chocolat au lait", "Comté", "Congre", "Coquille Saint-Jacques", "Crevette",
    "Crème épaisse 30% de matière grasse", "Cuisses de canard gras", "Emmental", "Filet de maquereau",
    "Foie de canard gras", "Fond de veau pour la sauce et la cuisson", "Fromage", "Fromage de Cheddar",
    "Fromage fondu", "Fromage frais crémeux", "Fromage mozzarella", "Fromage à pâte dure", "Fruit de mer",
    "Graisse de canard gras", "Graisse de porc", "Grondin rouge", "Gruyère", "Homard de Norvège",
    "Huile de poisson", "Jambon cuit", "Jaune d'œuf", "Lait", "Lait concentré", "Lait de brebis",
    "Lait de chèvre", "Lait demi-écremé", "Lait écrémé", "Lieu ou colin d'Alaska", "Lotte",
    "Magret de canard gras", "Mayonnaise", "Merguez", "Miel", "Morue", "Moule", "Omelette", "Pain perdu",
    "Parmesan", "Poisson Saint-Pierre", "Porc", "Poudre de lait", "Rascasse", "Reblochon", "Roquefort",
    "Sardine", "Sauce de fromage", "Saucisse de porc", "Saucisses sèches", "Saumon", "Sole au citron", "Thon",
    "Tomme", "Viande avec os", "Viande d'agneau sans os", "Viande de bœuf sans os", "Viande de moutton sans os",
    "Viande de poulet sans os", "Viande de veau sans os", "Yaourt", "Œuf de poule",
}


# Manual review of foods the rules cannot place. code -> (composition, category) ; None = not animal.
_WILD_FISH = ["25990", "25991", "26075", "26100", "26103", "26107", "26111", "26113", "26157", "26159",
              "26166", "26168", "26170", "26172", "26175", "26235", "26236"]
_COW_CHEESES = ["12121", "12025", "12042", "12052", "12064", "12524", "12123", "12716", "12725", "12761",
                "12763", "19530"]
_SOY_DESSERTS = ["19692", "19693", "19694", "19695", "19696", "20911", "20921", "20925", "20926", "20929"]
OVERRIDES: dict[str, tuple[str, str] | None] = {
    **{c: ("pur", "poisson sauvage") for c in _WILD_FISH},
    **{c: ("pur", "vache laitière") for c in _COW_CHEESES},
    **{c: None for c in _SOY_DESSERTS},
    "6584": ("pur", "plusieurs espèces"),    # viande blanche (moyenne de plusieurs espèces)
    "6585": ("pur", "plusieurs espèces"),    # viande rouge (moyenne)
    "6999": ("pur", "plusieurs espèces"),    # viande (moyenne)
    "21800": ("pur", "autre"),   # chevreau
    "21801": ("pur", "autre"),
    "40104": ("pur", "bovin"),   # foie de génisse
    "40105": ("pur", "bovin"),
    "40401": ("pur", "plusieurs espèces"),   # rognon (moyenne)
    "40601": ("pur", "plusieurs espèces"),   # abat (moyenne)
    "14004": ("pur", "gibier"),   # lièvre
    "30900": ("pur", "plusieurs espèces"),   # charcuterie (moyenne, plusieurs espèces)
    "30177": ("pur", "porc"),    # diot (saucisse de porc savoyarde)
    "8350": ("pur", "plusieurs espèces"),    # galantine (volaille et/ou porc)
    "28505": ("pur", "bovin"),   # corned-beef
    "28860": ("pur", "bovin"),   # viande des Grisons
    "30312": ("pur", "autre"),   # pavé au poivre : espèce non précisée
    "26171": ("pur", "poisson origine inconnue"),   # omble chevalier : souvent d'élevage, non précisé
    "10048": ("pur", "mollusques"),   # pecten (coquillage)
    "30152": ("pur", "bovin"),   # merguez pur boeuf
    "16520": ("pur", "porc"),    # saindoux
    "16530": ("pur", "porc"),    # lard gras
    "16550": ("pur", "canard"),  # graisse de canard
    "16560": ("pur", "oie"),   # graisse d'oie
    "11007": ("pur", "autre"),   # gélatine (sous-produit porc/bovin, espèce non précisée)
    "31008": ("pur", "abeille"),   # miel
    "39253": ("mixte", ""),      # mousse au chocolat (œufs, crème)
    "19699": ("mixte", ""),      # tiramisu (mascarpone, œufs)
    # Fish: wild or farmed not stated, species widely farmed
    **{c: ("pur", "poisson origine inconnue") for c in [
        "26072", "27030",          # bar commun, sans précision
        "27031",                   # dorade royale, sans précision
        "26174", "26094",          # turbot, sans précision
        "26005",                   # caviar (esturgeon, élevage majoritaire)
        "26151",                   # œufs de truite
        "27001", "27016", "26999", "27000",  # anguille
    ]},
    # Composite products: the animal share of the mass is unknown -> mixte (no per-kg factor)
    **{c: ("mixte", "") for c in [
        "1032", "1034",            # haché bœuf et soja ; saucisse de volaille contenant du soja
        "23474", "39233", "19689", "39212", "39251", "39252", "39218", "39710", "12356", "39206",
        "39211", "19674", "19684", "39400",  # desserts lactés aux œufs, riz/semoule au lait…
        "22506", "22507", "22508", "22509", "22511", "22510", "8380",  # omelettes garnies, œuf au jambon
        "8395", "30707",           # jambon en croûte, saucisson brioché
        "10023", "10002", "10012", "26002", "26016", "26030", "26029", "26028", "26124",  # panés, beignets
        "25433", "8932", "8933", "8903", "8912", "8910",  # accras, quenelles
        "26046", "26239",          # surimi
        "8292", "8291", "8290", "8293",  # terrines de poisson / fruits de mer, tarama
        "10042",                   # escargots au beurre persillé
        "8315", "8232",            # mousse et terrine de canard (souvent avec porc)
    ]},
}


def classify_name(folded: str, pure: bool) -> tuple[str, str] | None:
    for cat, pat in RULES:
        for m in pat.finditer(folded):
            if not pure and MIXED_ONLY_EXCLUDED.fullmatch(m.group(0)):
                continue
            return cat, m.group(0)
    if not pure:
        m = RECIPES.search(folded)
        if m:
            return "", f"recette : {m.group(0)}"
    return None


def _has(pattern: str, folded: str) -> bool:
    return re.search(pattern, folded) is not None


def specialize(cat: str, folded: str) -> tuple[str, str]:
    """Refine a rule category into the final one. Returns (category, note documenting any assumption)."""
    if cat == "saumon d'élevage":
        if _has(r"\bsauvage\b|pacifique|keta|sockeye|coho|saumon rose|\bpeche\b", folded):
            return "poisson sauvage", ""
        if not _has(r"\belevage\b", folded):
            return cat, "hypothèse : saumon sans origine précisée = élevage"
        return cat, ""
    if cat == "crevette d'élevage":
        if _has(r"\bgrises?\b|nordique|boreale|\bsauvages?\b", folded):
            return "crevette sauvage", ""
        if not _has(r"\belevage\b", folded):
            return cat, "hypothèse : crevette sans origine précisée = élevage"
        return cat, ""
    if cat == "poisson sauvage" and _has(r"\belevage\b", folded):
        return "poisson d'élevage (autre)", ""
    if cat == "canard" and _has(r"foie gras", folded) and not _has(r"canard", folded):
        return cat, "hypothèse : foie gras sans espèce précisée = canard"
    if cat == "poule pondeuse" and _has(r"\bpoule\b", folded) and not _has(r"oeuf", folded):
        return cat, "viande de poule pondeuse de réforme"
    if cat == "poisson origine inconnue":
        return cat, "origine sauvage/élevage non précisée"
    if cat != "autre":
        return cat, ""
    # --- split "autre" ---
    if _has(r"lait de vache", folded):
        return "vache laitière", ""
    if _has(r"brebis|roquefort|pecorino|ossau|manchego|perail|brocciu|brucciu|brousse", folded):
        note = "brebis majoritaire (70 % min.), chèvre minoritaire" if _has(r"chevre", folded) else ""
        if _has(r"brocciu|brucciu", folded):
            note = "lactosérum de brebis et/ou de chèvre ; brebis retenue"
        return "brebis laitière", note
    if _has(r"\bfeta\b", folded):
        return "brebis laitière", "feta sans précision : brebis et/ou chèvre ; brebis retenue"
    if _has(r"chevre|crottin|sainte[- ]maure|valencay|chabichou|picodon|rocamadour|pelardon|chevrot|pouligny|selles-sur-cher", folded):
        return "chèvre laitière", ""
    if _has(r"\btruite\b", folded):
        if _has(r"\belevage\b", folded):
            return "truite d'élevage", ""
        return "poisson origine inconnue", "truite sans origine précisée"
    if _has(r"pangas|tilapia", folded):
        return "poisson d'élevage (autre)", "hypothèse : pangas et tilapia = élevage (quasi totalité du marché)"
    if _has(r"\belevage\b", folded) and _has(r"carpe|bar|dorade|daurade|turbot", folded):
        return "poisson d'élevage (autre)", ""
    if _has(r"carpe|esturgeon|caviar|omble|anguille", folded):
        return "poisson origine inconnue", "espèce largement élevée, origine non précisée"
    if _has(r"crevettes?", folded):
        return "crevette sauvage", ""
    if _has(r"calmars?|encornets?|seiches?|poulpes?", folded):
        return "céphalopodes", ""
    if _has(r"moules?|huitres?|saint[- ]jacques|petoncles?|pecten|bulots?|bigorneaux?|palourdes?|praires?|clams?|"
            r"\bcoques?\b|couteaux?|ormeaux?|oursins?|escargots?", folded):
        return "mollusques", "oursin : échinoderme, rangé ici" if _has(r"oursin", folded) else ""
    if _has(r"crabes?|tourteaux?|homards?|langoustes?|langoustines?|ecrevisses?|araignee", folded):
        return "crustacés (hors crevettes)", ""
    if _has(r"fruits de mer", folded):
        return "plusieurs espèces", "mélange mollusques et crustacés"
    if _has(r"\bmiel\b", folded):
        return "abeille", ""
    if _has(r"lapin", folded):
        return "lapin", ""
    if _has(r"cheval|chevaline", folded):
        return "cheval", ""
    if _has(r"gibier|cerf|chevreuil|biche|sanglier|lievre|faisan|perdrix", folded):
        return "gibier", ""
    if _has(r"\boie\b", folded):
        return "oie", ""
    if _has(r"volaille", folded):
        return "volaille (espèce non précisée)", ""
    if _has(r"porc et boeuf|boeuf et porc|merguez|viande blanche|viande rouge|\(aliment moyen\)", folded):
        return "plusieurs espèces", ""
    return "autre", "cas isolé"


def build(force: bool) -> None:
    if CSV_PATH.exists() and not force:
        sys.exit(f"{CSV_PATH.name} exists (reviewed file). Use --force to overwrite with a new draft.")
    client = get_client()
    foods = pd.DataFrame(fetch_all(client, "foods", "code,name_fr,food_group,food_subgroup,source_id"))
    detail = pd.read_csv(RAW / "agribalyse_3.2_detail_ingredient.csv", dtype=str).dropna(how="all")
    detail.columns = [" ".join(c.split()) for c in detail.columns]
    detail["Ingredients"] = detail["Ingredients"].map(lambda s: " ".join(s.split()))
    ingr = detail[detail["Ingredients"].isin(ANIMAL_INGREDIENTS)].groupby("Ciqual AGB")["Ingredients"].apply(
        lambda s: ", ".join(sorted(set(s))))

    rows = []
    for f in foods.itertuples():
        name = f.name_fr
        folded = NEUTRAL.sub(" ", fold(name))
        if f.code in OVERRIDES:
            o = OVERRIDES[f.code]
            if o:
                cat, note = specialize(o[1], folded) if o[0] == "pur" else ("", "")
                rows.append({"code": f.code, "name_fr": name, "is_animal": "true", "animal_category": cat,
                             "composition": o[0], "evidence": "revue manuelle", "notes": note})
            continue
        pure = (f.food_subgroup or "") in PURE_SUBGROUPS
        vegan = bool(VEGAN.search(folded)) and not NOT_VEGAN.search(folded)
        hit = None if vegan else classify_name(folded, pure)
        evidence = []
        if hit:
            evidence.append(f"nom : « {hit[1]} »")
        if f.code in ingr.index and not vegan:
            evidence.append(f"ingrédients Agribalyse : {ingr[f.code]}")
        if not evidence:
            if pure and not vegan:
                print(f"  UNCLASSIFIED in animal subgroup: {f.code} {name}")
            continue
        composition = "pur" if (pure and hit) else "mixte"
        category, note = specialize(hit[0], folded) if composition == "pur" else ("", "")
        rows.append({"code": f.code, "name_fr": name, "is_animal": "true", "animal_category": category,
                     "composition": composition, "evidence": " ; ".join(evidence), "notes": note})

    rows.sort(key=lambda r: (r["composition"] != "pur", r["animal_category"], r["name_fr"]))
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["code", "name_fr", "is_animal", "animal_category", "composition", "evidence", "notes"])
        w.writeheader()
        w.writerows(rows)
    df = pd.DataFrame(rows)
    print(f"Draft written: {len(df)} animal foods out of {len(foods)}")
    print(df.groupby(["composition", "animal_category"]).size().to_string())


def do_import() -> None:
    df = pd.read_csv(CSV_PATH, dtype=str, keep_default_na=False)
    bad = df[(df.composition == "pur") & ~df.animal_category.isin(CATEGORIES)]
    if len(bad) or not df.composition.isin(["pur", "mixte"]).all() or (df[df.composition == "mixte"].animal_category != "").any():
        sys.exit(f"Invalid rows in {CSV_PATH.name}:\n{bad.head()}")
    if df.code.duplicated().any():
        sys.exit("Duplicate codes in CSV.")
    client = get_client()
    known = {f["code"] for f in fetch_all(client, "foods", "code")}
    missing = set(df.code) - known
    if missing:
        sys.exit(f"Codes not in foods: {sorted(missing)[:10]}")
    animal = set(df.code)
    # Reset foods no longer listed, then set listed ones (idempotent).
    current = {f["code"] for f in fetch_all(client, "foods", "code", is_animal=True)}
    for code in sorted(current - animal):
        client.table("foods").update({"is_animal": False, "animal_category": None}).eq("code", code).execute()
    for cat, g in df.groupby("animal_category"):
        codes = list(g.code)
        for i in range(0, len(codes), 200):
            client.table("foods").update({"is_animal": True, "animal_category": cat or None}).in_(
                "code", codes[i:i + 200]).execute()
    n = client.table("foods").select("code", count="exact", head=True).eq("is_animal", True).execute().count
    print(f"Imported: {n} foods with is_animal = true ({len(current - animal)} reset)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["build", "import"])
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    build(args.force) if args.command == "build" else do_import()


if __name__ == "__main__":
    main()
