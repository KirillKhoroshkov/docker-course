// Galactic Pizza Menu Data
// Authentic intergalactic cuisine data

const GALACTIC_PIZZAS = [
  {
    id: 1,
    name: "Cosmic Margherita",
    description: "Traditional Earth-style pizza with space-grown tomatoes, asteroid-aged mozzarella, and cosmic basil cultivated in zero gravity.",
    price: 299,
    galaxy: "Milky Way",
    ingredients: ["space tomatoes", "asteroid mozzarella", "cosmic basil", "solar-dried herbs"],
    category: "classic",
    spiceLevel: 0,
    preparationTime: 15,
    calories: 850,
    isVegetarian: true,
    isGlutenFree: false,
    popularity: 95
  },
  {
    id: 2,
    name: "Nebula Pepperoni Blast",
    description: "Loaded with pepperoni from the Horsehead Nebula, known for its smoky flavor and perfect texture after traveling through space dust.",
    price: 349,
    galaxy: "Milky Way",
    ingredients: ["nebula pepperoni", "stellar cheese", "quantum tomato sauce", "dark matter seasoning"],
    category: "meat",
    spiceLevel: 2,
    preparationTime: 18,
    calories: 1200,
    isVegetarian: false,
    isGlutenFree: false,
    popularity: 88
  },
  {
    id: 3,
    name: "Andromeda Supreme",
    description: "The ultimate galactic experience with ingredients sourced from across the Andromeda Galaxy, including exotic mushrooms and alien peppers.",
    price: 449,
    galaxy: "Andromeda",
    ingredients: ["andromedan mushrooms", "alien peppers", "interstellar sausage", "galactic olives", "quantum cheese"],
    category: "supreme",
    spiceLevel: 3,
    preparationTime: 25,
    calories: 1450,
    isVegetarian: false,
    isGlutenFree: false,
    popularity: 92
  },
  {
    id: 4,
    name: "Black Hole BBQ",
    description: "Smoky BBQ sauce infused with particles that escaped from a black hole's event horizon, creating an otherworldly flavor profile.",
    price: 399,
    galaxy: "Large Magellanic Cloud",
    ingredients: ["black hole BBQ sauce", "cosmic chicken", "stellar onions", "gravitational cheese"],
    category: "bbq",
    spiceLevel: 2,
    preparationTime: 22,
    calories: 1300,
    isVegetarian: false,
    isGlutenFree: false,
    popularity: 81
  },
  {
    id: 5,
    name: "Vegan Vega Delight",
    description: "Plant-based masterpiece with vegetables grown under the light of Vega star, offering unique nutritional properties.",
    price: 329,
    galaxy: "Milky Way",
    ingredients: ["vega vegetables", "plant-based cheese", "stellar quinoa", "cosmic nutritional yeast"],
    category: "vegan",
    spiceLevel: 1,
    preparationTime: 20,
    calories: 950,
    isVegetarian: true,
    isGlutenFree: true,
    popularity: 73
  },
  {
    id: 6,
    name: "Spicy Sirius Special",
    description: "Fiery pizza inspired by the heat of Sirius, the brightest star. Features peppers that can only grow in extreme stellar radiation.",
    price: 379,
    galaxy: "Milky Way",
    ingredients: ["sirius fire peppers", "molten cheese", "stellar jalapeños", "solar flare sauce"],
    category: "spicy",
    spiceLevel: 5,
    preparationTime: 17,
    calories: 1100,
    isVegetarian: true,
    isGlutenFree: false,
    popularity: 76
  },
  {
    id: 7,
    name: "Triangulum Truffle",
    description: "Luxury pizza featuring rare truffles found only on planets orbiting stars in the Triangulum Galaxy.",
    price: 599,
    galaxy: "Triangulum",
    ingredients: ["triangulum truffles", "premium galactic cheese", "starlight oil", "cosmic arugula"],
    category: "gourmet",
    spiceLevel: 0,
    preparationTime: 30,
    calories: 1250,
    isVegetarian: true,
    isGlutenFree: false,
    popularity: 68
  },
  {
    id: 8,
    name: "Plasma Protein Power",
    description: "High-protein pizza designed for space athletes, featuring lab-grown meats energized with plasma technology.",
    price: 429,
    galaxy: "Small Magellanic Cloud",
    ingredients: ["plasma-charged protein", "enhanced cheese", "amino acid vegetables", "creatine crust"],
    category: "protein",
    spiceLevel: 1,
    preparationTime: 24,
    calories: 1600,
    isVegetarian: false,
    isGlutenFree: false,
    popularity: 79
  },
  {
    id: 9,
    name: "Quantum Quattro",
    description: "Four quantum-entangled cheeses that maintain their connection across space-time, creating a unique flavor experience.",
    price: 459,
    galaxy: "Whirlpool",
    ingredients: ["quantum mozzarella", "entangled cheddar", "temporal goat cheese", "spacetime parmesan"],
    category: "cheese",
    spiceLevel: 0,
    preparationTime: 28,
    calories: 1350,
    isVegetarian: true,
    isGlutenFree: false,
    popularity: 85
  },
  {
    id: 10,
    name: "Solar Wind Seafood",
    description: "Ocean delicacies from water worlds, transported via solar wind currents to preserve their cosmic freshness.",
    price: 479,
    galaxy: "Sombrero",
    ingredients: ["solar wind salmon", "cosmic shrimp", "stellar calamari", "tidal cheese", "kelp from Europa"],
    category: "seafood",
    spiceLevel: 1,
    preparationTime: 26,
    calories: 1180,
    isVegetarian: false,
    isGlutenFree: false,
    popularity: 72
  },
  {
    id: 11,
    name: "Meteor Mushroom Medley",
    description: "Assorted mushrooms that grew from meteor impacts across different planets, each bringing unique mineral flavors.",
    price: 359,
    galaxy: "Pinwheel",
    ingredients: ["meteor mushrooms", "impact minerals", "crater cheese", "asteroid dust seasoning"],
    category: "vegetarian",
    spiceLevel: 1,
    preparationTime: 21,
    calories: 1050,
    isVegetarian: true,
    isGlutenFree: false,
    popularity: 77
  },
  {
    id: 12,
    name: "Galactic Garlic Guardian",
    description: "Maximum garlic pizza using garlic clones from multiple galaxies, perfect for warding off space vampires.",
    price: 339,
    galaxy: "Milky Way",
    ingredients: ["multi-galaxy garlic", "vampire-proof cheese", "protective herbs", "cosmic olive oil"],
    category: "garlic",
    spiceLevel: 2,
    preparationTime: 16,
    calories: 1150,
    isVegetarian: true,
    isGlutenFree: false,
    popularity: 82
  }
];

class PizzaDataService {
  constructor() {
    this.pizzas = GALACTIC_PIZZAS;
  }

  // Get all pizzas
  getAllPizzas() {
    return this.pizzas;
  }

  // Get pizza by ID
  getPizzaById(id) {
    return this.pizzas.find(pizza => pizza.id === parseInt(id));
  }

  // Get multiple pizzas by IDs
  getPizzasByIds(ids) {
    return this.pizzas.filter(pizza => ids.includes(pizza.id));
  }

  // Get pizzas by galaxy
  getPizzasByGalaxy(galaxy) {
    return this.pizzas.filter(pizza => 
      pizza.galaxy.toLowerCase() === galaxy.toLowerCase()
    );
  }

  // Get pizzas by category
  getPizzasByCategory(category) {
    return this.pizzas.filter(pizza => 
      pizza.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Get vegetarian pizzas
  getVegetarianPizzas() {
    return this.pizzas.filter(pizza => pizza.isVegetarian);
  }

  // Get vegan pizzas
  getVeganPizzas() {
    return this.pizzas.filter(pizza => 
      pizza.category === 'vegan' || 
      (pizza.isVegetarian && pizza.ingredients.every(ingredient => 
        !ingredient.includes('cheese') && !ingredient.includes('milk')
      ))
    );
  }

  // Get gluten-free pizzas
  getGlutenFreePizzas() {
    return this.pizzas.filter(pizza => pizza.isGlutenFree);
  }

  // Get pizzas by spice level
  getPizzasBySpiceLevel(minLevel, maxLevel = 5) {
    return this.pizzas.filter(pizza => 
      pizza.spiceLevel >= minLevel && pizza.spiceLevel <= maxLevel
    );
  }

  // Get pizzas by price range
  getPizzasByPriceRange(minPrice, maxPrice) {
    return this.pizzas.filter(pizza => 
      pizza.price >= minPrice && pizza.price <= maxPrice
    );
  }

  // Get most popular pizzas
  getPopularPizzas(limit = 5) {
    return this.pizzas
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  // Search pizzas by name or description
  searchPizzas(query) {
    const searchTerm = query.toLowerCase();
    return this.pizzas.filter(pizza => 
      pizza.name.toLowerCase().includes(searchTerm) ||
      pizza.description.toLowerCase().includes(searchTerm) ||
      pizza.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(searchTerm)
      )
    );
  }

  // Get random pizzas
  getRandomPizzas(count = 3) {
    const shuffled = [...this.pizzas].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Get pizza statistics
  getPizzaStats() {
    const stats = {
      totalPizzas: this.pizzas.length,
      totalGalaxies: [...new Set(this.pizzas.map(p => p.galaxy))].length,
      categories: [...new Set(this.pizzas.map(p => p.category))],
      averagePrice: Math.round(this.pizzas.reduce((sum, p) => sum + p.price, 0) / this.pizzas.length),
      averageCalories: Math.round(this.pizzas.reduce((sum, p) => sum + p.calories, 0) / this.pizzas.length),
      vegetarianCount: this.pizzas.filter(p => p.isVegetarian).length,
      glutenFreeCount: this.pizzas.filter(p => p.isGlutenFree).length,
      spiceLevels: {
        mild: this.pizzas.filter(p => p.spiceLevel <= 1).length,
        medium: this.pizzas.filter(p => p.spiceLevel >= 2 && p.spiceLevel <= 3).length,
        hot: this.pizzas.filter(p => p.spiceLevel >= 4).length
      }
    };
    
    return stats;
  }

  // Get pizza recommendations based on preferences
  getRecommendations(preferences = {}) {
    let filtered = [...this.pizzas];

    if (preferences.galaxy) {
      filtered = filtered.filter(p => p.galaxy === preferences.galaxy);
    }
    
    if (preferences.maxPrice) {
      filtered = filtered.filter(p => p.price <= preferences.maxPrice);
    }
    
    if (preferences.isVegetarian) {
      filtered = filtered.filter(p => p.isVegetarian);
    }
    
    if (preferences.maxSpiceLevel !== undefined) {
      filtered = filtered.filter(p => p.spiceLevel <= preferences.maxSpiceLevel);
    }
    
    if (preferences.category) {
      filtered = filtered.filter(p => p.category === preferences.category);
    }

    // Sort by popularity and return top recommendations
    return filtered
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, preferences.limit || 4);
  }

  // Get galaxies list
  getGalaxies() {
    return [...new Set(this.pizzas.map(pizza => pizza.galaxy))].sort();
  }

  // Get categories list
  getCategories() {
    return [...new Set(this.pizzas.map(pizza => pizza.category))].sort();
  }
}

// Export singleton instance
module.exports = new PizzaDataService();
