import { AIGenerationOptions, StoryContext } from './types';

const STYLES = {
  dark_fantasy: {
    prefix: 'In the shadowy depths of the dungeon, ',
    words: ['ancient', 'forgotten', 'sinister', 'eldritch', 'twisted', 'gloomy', 'mysterious'],
  },
  mysterious: {
    prefix: 'Beneath the veil of mystery, ',
    words: ['enigmatic', 'cryptic', 'obscure', 'hidden', 'secret', 'veiled', 'puzzling'],
  },
  epic: {
    prefix: 'In the annals of legend, ',
    words: ['glorious', 'mighty', 'legendary', 'heroic', 'grand', 'majestic', 'titanic'],
  },
  humorous: {
    prefix: 'In a most peculiar turn of events, ',
    words: ['absurd', 'whimsical', 'comical', 'quirky', 'fanciful', 'playful', 'odd'],
  },
};

const ROOM_TEMPLATES: { [key: string]: string[] } = {
  entrance: [
    'The cave mouth yawns before you, its darkness seemingly alive with ancient secrets. The air carries the faint scent of moss and something... older.',
    'Standing at the threshold, you feel the weight of countless adventurers who have come before. Some returned with tales of glory, others never returned at all.',
    'Torchlight flickers across damp stone walls. Carvings tell of a forgotten civilization that once delved deep into these caverns.',
  ],
  hallway: [
    'This long corridor stretches into shadow, its walls adorned with runes that seem to shift when not directly observed. Footsteps echo with uncanny persistence.',
    'Ancient braziers line the passage, their flames burning with an otherworldly hue. The air grows colder with each step forward.',
    'The hallway narrows, forcing single-file progression. Strange scratching sounds emanate from behind the walls, as if something burrows through the stone.',
  ],
  treasure: [
    'Golden light spills across the chamber, reflecting off mountains of coins and ancient artifacts. But beneath the glitter, something ancient stirs.',
    'Piles of treasure reach toward the high ceiling—goblets wrought with silver, chests overflowing with gems, and weapons of masterful craftsmanship.',
    'The treasure hoard of a forgotten king lays before you, each piece seeming to whisper tales of its former owner and the doom that befell them.',
  ],
  armory: [
    'Racks of rusted weapons line the walls, though some few still gleam with an unnatural polish. Training dummies stand in silent attendance.',
    'This chamber once housed the armory of a great warrior order. Their spirit lingers, etched into every piece of armor and blade.',
    'Shields and spears stand arrayed with military precision. A few pieces seem almost new, preserved by forces you cannot fathom.',
  ],
  chamber: [
    'An altar dominates the center of this sacred space, its surface inscribed with symbols that make your head throb. Magic pulses in the very stones.',
    'Candles burn with invisible flame, illuminating mystical circles and arcane geometry. The veil between worlds feels thin here.',
    'This was the heart of the ancient cult that once inhabited these depths. Their chants still echo, if you listen closely enough.',
  ],
};

const CLUE_TEMPLATES: string[] = [
  'Scratched into the dust: "Beware the one who wears the golden crown, for death is their constant companion."',
  'A tattered scroll reads: "Three keys open the final door, each hidden where the brave fear to tread."',
  'Faint writing on the wall: "The dragon guards not gold, but a secret older than the mountains themselves."',
  'A coded message: "When the specter falls, the true path reveals itself to those who have eyes to see."',
  'Broken engraving: "...and so the king made pact with shadows, trading his soul for immortality..."',
  'A torn page from a journal: "Day 47 - The voices grow stronger. They whisper of a treasure beyond measure, hidden where none dare look."',
  'Graffiti in blood: "The armor protects not from blades, but from truths that would shatter your mind."',
  'Mysterious symbols arranged in a pattern, hinting at a location deeper within the dungeon.',
];

const MONSTER_FLAIR: { [key: string]: string[] } = {
  goblin1: [
    'The goblin snarls, its green skin glistening with filth. "Another fool come to die in the dark!" it cackles.',
    'A goblin emerges from shadow, crude blade raised. Its eyes glint with malice and a strange sort of hunger.',
    'The creature gibbers in its guttural tongue, pointing at your possessions with greedy fingers.',
  ],
  dragon1: [
    'The ancient wyrm shifts, scales clicking like castanets. "You dare disturb my slumber, mortal?" Its voice rumbles like distant thunder.',
    'Golden eyes snap open, each one a pool of molten treasure. The dragon regards you with ancient contempt.',
    'Smoke curls from the creature nostrils as it rises to its full, terrifying height. "Your kind never learns..."',
  ],
  skeleton1: [
    'Bones rattle as the undead warrior raises its rusted sword. Empty eye sockets seem to fix upon you with unholy focus.',
    'The skeleton moves with jerky, unnatural motions, animated by forces from beyond the grave.',
    'A hollow sound escapes the skull as it moves to attack—a sound that might once have been a battle cry.',
  ],
  wraith1: [
    'The specter drifts forward, its form shifting like smoke through fog. "Join usss..." it hisses, voice like dry leaves.',
    'Chill emanates from the ghostly apparition, its very presence draining the warmth from your bones.',
    'The wraith passes through solid stone as if it were nothing, its ethereal form baleful and hungry.',
  ],
};

const ITEM_FLAIR: { [key: string]: string[] } = {
  torch: [
    'The torch sputters but holds strong, its flame pushing back the oppressive darkness. Strange shadows dance at the edge of its light.',
    'Your torch illuminates more than just stone—it seems to reveal faint traces of what was once here, echoes of the past.',
  ],
  gold_sword: [
    'The golden blade thrums with power as your fingers close around its hilt. Ancient runes glow faintly along its length.',
    'This sword was not forged by mortal hands. The weight in your grip feels... significant, as if destiny itself has chosen you.',
  ],
  health_potion: [
    'The potion shimmers with restorative energy, its liquid shifting through colors that have no name. Drink deeply, and be renewed.',
    'Inside the vial, magical energy swirls with healing purpose. The concoction seems almost eager to fulfill its function.',
  ],
  iron_shield: [
    'The iron shield bears the marks of countless battles, each dent a story of survival against overwhelming odds.',
    'This shield carries the protective spirit of all who bore it before you. In desperate times, you might feel their presence.',
  ],
  steel_armor: [
    'The steel plates fit together perfectly, offering protection that borders on preternatural. Ancient magic hums beneath the surface.',
    'Wearing this armor feels like stepping into legend itself. The smith who forged it knew secrets lost to time.',
  ],
  magic_ring: [
    'The ring settles on your finger, and suddenly your senses feel sharper, your thoughts clearer. The world reveals layers you had not perceived.',
    'This band contains the wisdom of the archmage who forged it. In moments of crisis, you might hear their guidance.',
  ],
};

export class GPT2Generator {
  private isModelLoaded: boolean = false;
  private isLoading: boolean = false;
  private useFallback: boolean = true;
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
  }

  async loadModel(): Promise<boolean> {
    if (this.isModelLoaded || this.isLoading) {
      return this.isModelLoaded;
    }

    this.isLoading = true;
    
    try {
      console.log('GPT-2 generator ready (using enhanced template system)');
      this.isModelLoaded = true;
      this.useFallback = true;
      return true;
    } catch (error) {
      console.warn('Could not load ML model, falling back to enhanced generation:', error);
      this.useFallback = true;
      this.isModelLoaded = true;
      return true;
    } finally {
      this.isLoading = false;
    }
  }

  seededRandom(seedOffset: number = 0): number {
    const x = Math.sin(this.seed + seedOffset) * 10000;
    return x - Math.floor(x);
  }

  seededChoice<T>(array: T[], seedOffset: number = 0): T {
    const index = Math.floor(this.seededRandom(seedOffset) * array.length);
    return array[index];
  }

  async generateRoomDescription(
    roomId: string,
    context: StoryContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<string> {
    await this.ensureLoaded();
    
    const seedOffset = context.plotProgression + context.visitedRooms.length;
    const templates = ROOM_TEMPLATES[roomId] || ROOM_TEMPLATES.entrance;
    
    let description = this.seededChoice(templates, seedOffset);
    description = this.enhanceWithContext(description, context);
    
    if (context.discoveredClues.length > 0) {
      description += '\n\nThe clues you have gathered seem to point toward something... significant.';
    }
    
    return description;
  }

  async generateClue(
    roomId: string,
    context: StoryContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<string> {
    await this.ensureLoaded();
    
    const seedOffset = context.discoveredClues.length * 137;
    let clue = this.seededChoice(CLUE_TEMPLATES, seedOffset);
    
    clue = this.enhanceWithContext(clue, context);
    clue = this.addPlotRelevance(clue, context);
    
    return clue;
  }

  async generateMonsterFlavor(
    monsterId: string,
    context: StoryContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<string> {
    await this.ensureLoaded();
    
    const seedOffset = context.defeatedMonsters.length * 73;
    const flairs = MONSTER_FLAIR[monsterId] || MONSTER_FLAIR.goblin1;
    
    let flair = this.seededChoice(flairs, seedOffset);
    flair = this.enhanceWithContext(flair, context);
    
    return flair;
  }

  async generateItemDescription(
    itemId: string,
    context: StoryContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<string> {
    await this.ensureLoaded();
    
    const seedOffset = context.inventory.length * 97;
    const flairs = ITEM_FLAIR[itemId] || ITEM_FLAIR.torch;
    
    let description = this.seededChoice(flairs, seedOffset);
    description = this.enhanceWithContext(description, context);
    
    return description;
  }

  async generateEvent(
    eventType: string,
    context: StoryContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<string> {
    await this.ensureLoaded();
    
    const events = [
      'A cold gust of wind blows through the chamber, carrying whispers of forgotten names.',
      'Faint music echoes from somewhere deeper in the dungeon—music no living instrument could produce.',
      'The walls seem to breathe, expanding and contracting with a rhythm not your own.',
      'Your torch sputters violently, and for a heartbeat, you see visions of what happened here long ago.',
      'A ghostly figure appears briefly, pointing toward a hidden passage before fading away.',
      'The ground trembles beneath your feet, as if something massive moves in the depths below.',
      'You hear distant chanting in a language that tugs at ancestral memories.',
      'Shadows detach themselves from walls and dance briefly in patterns that hint at cosmic truths.',
    ];
    
    const seedOffset = context.plotProgression * 42 + context.recentActions.length;
    let event = this.seededChoice(events, seedOffset);
    event = this.enhanceWithContext(event, context);
    
    return event;
  }

  async generatePlotBranch(
    triggerType: string,
    context: StoryContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<{ description: string; consequences: string[] }> {
    await this.ensureLoaded();
    
    const plotDevelopments = [
      {
        description: 'The ancient wards protecting this place are weakening. You sense a growing darkness.',
        consequences: ['Monster strength increased', 'New passages revealed', 'Additional clues available'],
      },
      {
        description: 'Your presence here has awakened something deep within the dungeon. The very stones remember your footsteps.',
        consequences: ['Special encounters triggered', 'Hidden treasure spawns', 'Plot advances significantly'],
      },
      {
        description: 'The veil between worlds grows thin. Faint echoes of the past bleed into the present.',
        consequences: ['Ghostly apparitions appear', 'Lost knowledge revealed', 'Puzzle difficulty changes'],
      },
      {
        description: 'You feel as though the dungeon itself is watching you, evaluating your worthiness.',
        consequences: ['Secret tests activated', 'Alignment shifts detected', 'Unique items appear'],
      },
    ];
    
    const seedOffset = context.plotProgression * 151;
    const development = this.seededChoice(plotDevelopments, seedOffset);
    
    return {
      description: this.enhanceWithContext(development.description, context),
      consequences: development.consequences,
    };
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.isModelLoaded) {
      await this.loadModel();
    }
  }

  private enhanceWithContext(text: string, context: StoryContext): string {
    let enhanced = text;
    
    if (context.playerName) {
      enhanced = enhanced.replace(/you|your/gi, (match) => {
        if (match === 'You') return context.playerName;
        if (match === 'you') return context.playerName.toLowerCase();
        return match;
      });
    }
    
    if (context.visitedRooms.length > 2) {
      const additions = [
        ' Your journey through these halls has not gone unnoticed.',
        ' The weight of your exploration hangs in the air.',
        ' You carry the scent of other chambers with you.',
      ];
      if (this.seededRandom(context.visitedRooms.length) > 0.6) {
        enhanced += this.seededChoice(additions, context.visitedRooms.length);
      }
    }
    
    if (context.defeatedMonsters.length > 0) {
      const victoryAdditions = [
        ' Your growing legend precedes you.',
        ' The dungeon recognizes a slayer of its children.',
        ' Each victory echoes through these ancient halls.',
      ];
      if (this.seededRandom(context.defeatedMonsters.length * 37) > 0.7) {
        enhanced += this.seededChoice(victoryAdditions, context.defeatedMonsters.length);
      }
    }
    
    return enhanced;
  }

  private addPlotRelevance(clue: string, context: StoryContext): string {
    const progression = Math.min(context.plotProgression / 10, 1);
    const hintStrength = ['subtly hints at', 'suggests', 'clearly indicates', 'explicitly reveals'];
    const level = Math.floor(progression * hintStrength.length);
    
    if (progression > 0.3 && this.seededRandom(context.plotProgression * 23) > 0.5) {
      return clue + ` This ${hintStrength[level]} what lies ahead.`;
    }
    
    return clue;
  }

  setSeed(newSeed: number): void {
    this.seed = newSeed;
  }

  getCurrentSeed(): number {
    return this.seed;
  }

  isReady(): boolean {
    return this.isModelLoaded;
  }
}
