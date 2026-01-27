// Church Finder Quiz - Questions, Answers, and Matching Logic

// ============================================================================
// TYPES
// ============================================================================

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  options: QuizOption[];
  multiSelect?: boolean;
}

export interface QuizAnswers {
  [questionId: string]: string | string[];
}

export interface ChurchTypeMatch {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  denominations: string[];
  worshipStyles: string[];
  programs: {
    kids?: boolean;
    youth?: boolean;
    groups?: boolean;
  };
}

export interface QuizResult {
  primary: ChurchTypeMatch;
  secondary: ChurchTypeMatch | null;
  searchFilters: {
    denominations: string[];
    worshipStyles: string[];
    hasKidsMinistry?: boolean;
    hasYouthGroup?: boolean;
    hasSmallGroups?: boolean;
  };
}

// ============================================================================
// QUIZ QUESTIONS
// ============================================================================

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Section 1: Worship Style & Atmosphere
  {
    id: 'atmosphere',
    question: 'What atmosphere helps you connect spiritually?',
    description: 'Think about where you feel most at peace and open.',
    options: [
      {
        id: 'reverent',
        label: 'Quiet and reverent',
        description: 'Contemplative, peaceful, space for reflection',
      },
      {
        id: 'energetic',
        label: 'Energetic and expressive',
        description: 'Lively worship, movement, emotional expression',
      },
      {
        id: 'balanced',
        label: 'A thoughtful balance',
        description: 'Mix of reflective moments and engaged worship',
      },
    ],
  },
  {
    id: 'music',
    question: 'What style of worship music resonates with you?',
    options: [
      {
        id: 'hymns',
        label: 'Traditional hymns',
        description: 'Classic songs with organ, piano, or choir',
      },
      {
        id: 'contemporary',
        label: 'Modern worship songs',
        description: 'Current songs with band, drums, and guitars',
      },
      {
        id: 'gospel',
        label: 'Gospel and spiritual',
        description: 'Soulful, choir-driven, call-and-response',
      },
      {
        id: 'mixed',
        label: 'A variety of styles',
        description: 'Open to both traditional and modern music',
      },
    ],
  },
  {
    id: 'structure',
    question: 'How structured do you prefer worship services?',
    options: [
      {
        id: 'liturgical',
        label: 'Follow a set liturgy',
        description: 'Predictable order, responsive readings, rituals',
      },
      {
        id: 'flexible',
        label: 'Spontaneous and Spirit-led',
        description: 'Flexible, room for movement of the Spirit',
      },
      {
        id: 'moderate',
        label: 'Some structure is nice',
        description: 'General order but not rigidly scripted',
      },
    ],
  },

  // Section 2: Community & Programs
  {
    id: 'size',
    question: 'What size congregation appeals to you?',
    description: 'Consider where you\'d feel most comfortable connecting.',
    options: [
      {
        id: 'small',
        label: 'Small & intimate',
        description: 'Under 100 people, everyone knows everyone',
      },
      {
        id: 'medium',
        label: 'Medium-sized',
        description: '100-500 people, familiar faces but room to grow',
      },
      {
        id: 'large',
        label: 'Large congregation',
        description: '500+ people, many programs and ministries',
      },
      {
        id: 'any',
        label: 'Size doesn\'t matter',
        description: 'More interested in the community feel',
      },
    ],
  },
  {
    id: 'priorities',
    question: 'What\'s most important in a church community?',
    description: 'Select all that apply to you.',
    multiSelect: true,
    options: [
      {
        id: 'kids',
        label: 'Kids programs',
        description: 'Strong children\'s ministry and nursery',
      },
      {
        id: 'youth',
        label: 'Youth ministry',
        description: 'Teen programs, youth group, mentorship',
      },
      {
        id: 'groups',
        label: 'Small groups',
        description: 'Bible studies, life groups, community circles',
      },
      {
        id: 'service',
        label: 'Service opportunities',
        description: 'Ways to give back and serve others',
      },
    ],
  },

  // Section 3: Beliefs & Tradition
  {
    id: 'tradition',
    question: 'How important is denominational tradition to you?',
    options: [
      {
        id: 'very',
        label: 'Very important',
        description: 'I have a specific tradition I want to stay in',
      },
      {
        id: 'somewhat',
        label: 'Somewhat important',
        description: 'Open to learning but prefer familiar ground',
      },
      {
        id: 'not',
        label: 'Not important',
        description: 'More focused on community than denomination',
      },
    ],
  },
  {
    id: 'teaching',
    question: 'What teaching style do you prefer?',
    options: [
      {
        id: 'expository',
        label: 'Verse-by-verse teaching',
        description: 'Deep study through books of the Bible',
      },
      {
        id: 'topical',
        label: 'Topical series',
        description: 'Practical themes applied to daily life',
      },
      {
        id: 'both',
        label: 'Mix of both',
        description: 'Variety keeps things fresh and engaging',
      },
    ],
  },

  // Section 4: Practical Preferences
  {
    id: 'dress',
    question: 'What dress code feels comfortable?',
    options: [
      {
        id: 'formal',
        label: 'Dress up',
        description: 'Sunday best, suits, dresses',
      },
      {
        id: 'casual',
        label: 'Come as you are',
        description: 'Jeans, t-shirts, whatever\'s comfortable',
      },
      {
        id: 'either',
        label: 'Either works',
        description: 'I adapt to the environment',
      },
    ],
  },
];

// ============================================================================
// CHURCH TYPE PROFILES
// ============================================================================

export const CHURCH_TYPES: ChurchTypeMatch[] = [
  {
    id: 'contemporary-nondenominational',
    name: 'Contemporary Non-Denominational',
    description:
      'Modern worship experience with relevant teaching and a welcoming atmosphere. These churches focus on making faith accessible and building authentic community.',
    characteristics: [
      'Modern worship music with full band',
      'Casual, come-as-you-are atmosphere',
      'Practical, life-applicable sermons',
      'Strong emphasis on community and small groups',
    ],
    denominations: ['Non-denominational', 'Evangelical'],
    worshipStyles: ['Contemporary', 'Blended'],
    programs: { groups: true },
  },
  {
    id: 'traditional-mainline',
    name: 'Traditional Mainline',
    description:
      'Rich liturgical tradition with hymns and reverent worship. These churches value heritage, thoughtful theology, and meaningful rituals.',
    characteristics: [
      'Traditional hymns with organ or piano',
      'Structured liturgy and responsive readings',
      'Thoughtful, scholarly preaching',
      'Strong connection to church history',
    ],
    denominations: ['Methodist', 'United Methodist', 'Lutheran', 'Presbyterian', 'Episcopal'],
    worshipStyles: ['Traditional', 'Liturgical'],
    programs: {},
  },
  {
    id: 'charismatic-pentecostal',
    name: 'Spirit-Filled & Charismatic',
    description:
      'Dynamic, Spirit-led worship with freedom of expression. These churches emphasize the gifts of the Spirit and passionate, heartfelt worship.',
    characteristics: [
      'Energetic, expressive worship',
      'Emphasis on spiritual gifts',
      'Extended worship times',
      'Strong prayer ministry',
    ],
    denominations: ['Pentecostal', 'Assemblies of God', 'Church of God', 'Charismatic'],
    worshipStyles: ['Charismatic', 'Contemporary'],
    programs: {},
  },
  {
    id: 'baptist-evangelical',
    name: 'Baptist & Evangelical',
    description:
      'Bible-focused teaching with a mix of traditional and contemporary elements. These churches emphasize Scripture, personal faith, and evangelism.',
    characteristics: [
      'Strong emphasis on Bible teaching',
      'Mix of hymns and contemporary songs',
      'Focus on personal relationship with Christ',
      'Active outreach and missions',
    ],
    denominations: ['Baptist', 'Southern Baptist', 'Evangelical'],
    worshipStyles: ['Blended', 'Traditional', 'Contemporary'],
    programs: { kids: true, youth: true },
  },
  {
    id: 'liturgical-sacramental',
    name: 'Liturgical & Sacramental',
    description:
      'Deep reverence with ancient practices and rich symbolism. These churches center worship around sacraments and historic Christian liturgy.',
    characteristics: [
      'Weekly communion/Eucharist',
      'Ancient prayers and creeds',
      'Reverent, contemplative atmosphere',
      'Strong sense of mystery and awe',
    ],
    denominations: ['Catholic', 'Episcopal', 'Lutheran', 'Orthodox'],
    worshipStyles: ['Liturgical', 'Traditional'],
    programs: {},
  },
  {
    id: 'gospel-community',
    name: 'Gospel & Community-Centered',
    description:
      'Soulful worship with strong community bonds. These churches feature powerful music, passionate preaching, and deep relational connections.',
    characteristics: [
      'Gospel choir and soulful music',
      'Engaging, passionate preaching',
      'Strong sense of family and belonging',
      'Community service focus',
    ],
    denominations: ['Baptist', 'Church of God', 'Non-denominational'],
    worshipStyles: ['Gospel', 'Contemporary'],
    programs: { groups: true },
  },
  {
    id: 'family-focused',
    name: 'Family-Focused Community',
    description:
      'Churches built around serving families at every stage. Strong programs for children and teens with practical teaching for parents.',
    characteristics: [
      'Excellent kids and youth programs',
      'Family-friendly environment',
      'Parenting resources and support',
      'Intergenerational activities',
    ],
    denominations: ['Non-denominational', 'Baptist', 'Methodist', 'Nazarene'],
    worshipStyles: ['Contemporary', 'Blended'],
    programs: { kids: true, youth: true, groups: true },
  },
];

// ============================================================================
// MATCHING LOGIC
// ============================================================================

interface ScoreWeights {
  [churchTypeId: string]: number;
}

export function calculateQuizResults(answers: QuizAnswers): QuizResult {
  const scores: ScoreWeights = {};

  // Initialize scores
  CHURCH_TYPES.forEach((type) => {
    scores[type.id] = 0;
  });

  // Score based on atmosphere preference
  const atmosphere = answers.atmosphere as string;
  if (atmosphere === 'reverent') {
    scores['traditional-mainline'] += 3;
    scores['liturgical-sacramental'] += 3;
  } else if (atmosphere === 'energetic') {
    scores['charismatic-pentecostal'] += 3;
    scores['gospel-community'] += 2;
    scores['contemporary-nondenominational'] += 2;
  } else if (atmosphere === 'balanced') {
    scores['contemporary-nondenominational'] += 2;
    scores['baptist-evangelical'] += 2;
    scores['family-focused'] += 2;
  }

  // Score based on music preference
  const music = answers.music as string;
  if (music === 'hymns') {
    scores['traditional-mainline'] += 3;
    scores['liturgical-sacramental'] += 2;
    scores['baptist-evangelical'] += 1;
  } else if (music === 'contemporary') {
    scores['contemporary-nondenominational'] += 3;
    scores['charismatic-pentecostal'] += 2;
    scores['family-focused'] += 2;
  } else if (music === 'gospel') {
    scores['gospel-community'] += 4;
    scores['charismatic-pentecostal'] += 1;
  } else if (music === 'mixed') {
    scores['baptist-evangelical'] += 2;
    scores['family-focused'] += 2;
    scores['contemporary-nondenominational'] += 1;
  }

  // Score based on service structure
  const structure = answers.structure as string;
  if (structure === 'liturgical') {
    scores['liturgical-sacramental'] += 4;
    scores['traditional-mainline'] += 3;
  } else if (structure === 'flexible') {
    scores['charismatic-pentecostal'] += 3;
    scores['contemporary-nondenominational'] += 2;
  } else if (structure === 'moderate') {
    scores['baptist-evangelical'] += 2;
    scores['family-focused'] += 2;
    scores['contemporary-nondenominational'] += 1;
  }

  // Score based on size preference
  const size = answers.size as string;
  if (size === 'small') {
    scores['traditional-mainline'] += 1;
    scores['gospel-community'] += 1;
  } else if (size === 'large') {
    scores['contemporary-nondenominational'] += 2;
    scores['family-focused'] += 1;
  }
  // 'medium' and 'any' don't significantly affect scores

  // Score based on priorities (multi-select)
  const priorities = answers.priorities as string[] | undefined;
  if (priorities?.includes('kids')) {
    scores['family-focused'] += 3;
    scores['baptist-evangelical'] += 1;
  }
  if (priorities?.includes('youth')) {
    scores['family-focused'] += 3;
    scores['baptist-evangelical'] += 1;
  }
  if (priorities?.includes('groups')) {
    scores['contemporary-nondenominational'] += 2;
    scores['gospel-community'] += 1;
    scores['family-focused'] += 1;
  }

  // Score based on tradition importance
  const tradition = answers.tradition as string;
  if (tradition === 'very') {
    scores['liturgical-sacramental'] += 2;
    scores['traditional-mainline'] += 2;
    scores['baptist-evangelical'] += 1;
  } else if (tradition === 'not') {
    scores['contemporary-nondenominational'] += 2;
    scores['family-focused'] += 1;
  }

  // Score based on teaching style
  const teaching = answers.teaching as string;
  if (teaching === 'expository') {
    scores['baptist-evangelical'] += 2;
    scores['traditional-mainline'] += 1;
  } else if (teaching === 'topical') {
    scores['contemporary-nondenominational'] += 2;
    scores['family-focused'] += 2;
  }

  // Score based on dress preference
  const dress = answers.dress as string;
  if (dress === 'formal') {
    scores['traditional-mainline'] += 1;
    scores['liturgical-sacramental'] += 1;
  } else if (dress === 'casual') {
    scores['contemporary-nondenominational'] += 2;
    scores['family-focused'] += 1;
  }

  // Sort church types by score
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => CHURCH_TYPES.find((t) => t.id === id)!);

  const primary = sortedTypes[0];
  const secondary = sortedTypes[1].id !== primary.id ? sortedTypes[1] : null;

  // Build search filters from the primary match
  const searchFilters: QuizResult['searchFilters'] = {
    denominations: primary.denominations,
    worshipStyles: primary.worshipStyles,
  };

  // Add program filters based on user priorities
  if (priorities?.includes('kids')) {
    searchFilters.hasKidsMinistry = true;
  }
  if (priorities?.includes('youth')) {
    searchFilters.hasYouthGroup = true;
  }
  if (priorities?.includes('groups')) {
    searchFilters.hasSmallGroups = true;
  }

  return {
    primary,
    secondary,
    searchFilters,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

export function getQuestionById(id: string): QuizQuestion | undefined {
  return QUIZ_QUESTIONS.find((q) => q.id === id);
}

export function getChurchTypeById(id: string): ChurchTypeMatch | undefined {
  return CHURCH_TYPES.find((t) => t.id === id);
}

export function buildSearchUrl(
  filters: QuizResult['searchFilters'],
  location?: string
): string {
  const params = new URLSearchParams();

  if (location) {
    params.set('q', location);
  }

  // Use the first denomination as primary filter
  if (filters.denominations.length > 0) {
    params.set('denomination', filters.denominations[0]);
  }

  // Use the first worship style
  if (filters.worshipStyles.length > 0) {
    params.set('worship_style', filters.worshipStyles[0]);
  }

  // Add program filters
  if (filters.hasKidsMinistry) {
    params.set('kids', 'true');
  }
  if (filters.hasYouthGroup) {
    params.set('youth', 'true');
  }
  if (filters.hasSmallGroups) {
    params.set('groups', 'true');
  }

  // Add quiz source for tracking
  params.set('utm_source', 'quiz');
  params.set('utm_medium', 'organic');
  params.set('utm_campaign', 'church_finder_quiz');

  return `/churches/search?${params.toString()}`;
}
