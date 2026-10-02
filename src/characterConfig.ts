export type CharacterId = 'Burnham' | 'Badenoch' | 'Farage' | 'Davey' | 'Polanski';
export type CharacterKey = CharacterId;

export interface OppositionFigure {
  leader: string;
  party: string;
}

export interface CandidateVictoryPath {
  strategyTitle: string;
  partyBadge: string;
  badgeColor: string;
  proactiveGrowth: string;
  boilingFrog: string;
  snapElection: string;
}

export const CANDIDATE_VICTORY_PATHS: Record<CharacterId, CandidateVictoryPath> = {
  Burnham: {
    strategyTitle: "Securing a Democratic Mandate",
    partyBadge: "Labour: Mandate Quest",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    proactiveGrowth: "Regional Devolution & Rail: Direct state capital into Northern Powerhouse transit, municipal bus franchises, and NHS renewal to lift long-term GDP growth projections above 2.0%.",
    boilingFrog: "The Legitimacy Trap: Lacking a personal general election mandate, your authority bleeds over time. Fleet Street and the Commons will relentlessly attack you as an 'unelected squatter' in No. 10.",
    snapElection: "The Mandate Election (Primary Goal): Once you rebuild public services and lift Labour polling to ≥ 38%, dissolve Parliament and call a General Election to win your own 5-year personal mandate!"
  },
  Badenoch: {
    strategyTitle: "Supply-Side & Free Market Revolution",
    partyBadge: "Conservative: 2026 Mandate",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    proactiveGrowth: "Supply-Side Productivity: Slash corporation tax, deregulate the City, liberalise planning laws, and cut bureaucracy to accelerate GDP growth projections above 2.2%.",
    boilingFrog: "Fiscal Rectitude: Ruthlessly slash the deficit below 2.2% of GDP. Spending restraint and debt reduction are non-negotiable to tame inflation and appease gilt markets.",
    snapElection: "Mandate Delivery: Armed with your 2026 General Election majority, deliver your full 5-year manifesto, keeping restless backbench MPs unified (Support ≥ 68%)."
  },
  Farage: {
    strategyTitle: "Sovereign Industrial Transformation",
    partyBadge: "Reform UK: 2026 Mandate",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    proactiveGrowth: "Domestic Energy & Deregulation: Unlock North Sea oil and gas, approve mass domestic fracking, and cut small-business taxes to slash youth unemployment below 12.5%.",
    boilingFrog: "Anti-Establishment Control: Resist civil service pushback while keeping Bank of England base rates stable and avoiding bond market panic.",
    snapElection: "Populist Delivery: Execute your 2026 election mandate to overhaul Whitehall, freeze immigration, and convert high public approval (≥ 60%) into sweeping institutional change."
  },
  Davey: {
    strategyTitle: "European Re-alignment & Social Care",
    partyBadge: "Lib Dem: 2026 Mandate",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    proactiveGrowth: "Single Market Dividend: Realign trade with the European Single Market, eliminate non-tariff barriers, and invest in green innovation hubs to lift growth above 1.8%.",
    boilingFrog: "Coalition Stability: Uphold strict standards of political integrity (Principles ≥ 75%) and maintain cross-party consensus to prevent commons rebellions.",
    snapElection: "Progressive Coalition Mandate: Implement your 2026 election mandate for Proportional Representation, clean water, and social care overhaul."
  },
  Polanski: {
    strategyTitle: "Zero-Carbon Eco-Socialist Transition",
    partyBadge: "Green Party: 2026 Mandate",
    badgeColor: "bg-green-100 text-green-800 border-green-200",
    proactiveGrowth: "Green Industrial Revolution: Launch nationwide home insulation, 100% renewable grid manufacturing, and community energy to create high-skill green jobs.",
    boilingFrog: "Redistributive Stability: Fund Universal Basic Income and NHS expansion via progressive wealth and carbon taxes while safeguarding economic confidence.",
    snapElection: "Eco-Socialist Mandate: Exercise your historic 2026 democratic mandate to transform the economy, end fossil fuels, and redistribute national wealth."
  }
};

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  formalTitle: string;
  shortName: string;
  party: string;
  shortParty: string;
  hasDirectMandate: boolean;
  mandateTitle: string;
  mandateSummary: string;
  leaning: string;
  philosophy: string;
  stance: string;
  growthModel: string;
  strategyTitle: string;
  partyBadge: string;
  badgeColor: string;
  premiershipTitle: string;
  oppositionFigures: OppositionFigure[];
  defaultPolling: {
    labour: number;
    conservatives: number;
    lib_dems: number;
    greens: number;
    reform: number;
  };
  defaultMinisters: {
    chancellor: string;
    home_secretary: string;
    foreign_secretary: string;
    chief_of_staff_hub: string;
    party_union_liaison: string;
  };
}

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  Burnham: {
    id: 'Burnham',
    name: 'Andy Burnham',
    formalTitle: 'Rt Hon Andy Burnham MP',
    shortName: 'Burnham',
    party: 'Labour Party',
    shortParty: 'Labour',
    hasDirectMandate: false,
    mandateTitle: 'Unelected Succession (No General Election Mandate)',
    mandateSummary: 'Inherited Downing Street through an emergency internal Labour coup after Starmer was ousted. You have no personal democratic mandate from the British people. Fleet Street, the opposition, and backbenchers relentlessly attack your legitimacy. Your primary mission is to stabilize the government and call a General Election to win your own 5-year mandate.',
    leaning: 'Centre-Left / Soft Left',
    philosophy: "Interventionist, state-led infrastructure investment, regional devolution, strengthening public services, 'Northern Powerhouse' focus.",
    stance: "Pro-union, pro-NHS funding, balancing green transition with working-class jobs. Fighting off attacks over his lack of an electoral mandate.",
    growthModel: 'Regional Infrastructure, Devolution Max, Municipal Transport & NHS Restoration',
    strategyTitle: 'Securing a Democratic Mandate',
    partyBadge: 'Labour: Mandate Quest',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    premiershipTitle: 'King of the North: The Burnham Premiership',
    oppositionFigures: [
      { leader: 'Kemi Badenoch', party: 'Conservative Party' },
      { leader: 'Sir Ed Davey', party: 'Liberal Democrats' },
      { leader: 'Nigel Farage', party: 'Reform UK' },
      { leader: 'Zack Polanski', party: 'Green Party' },
    ],
    defaultPolling: { labour: 34, conservatives: 24, lib_dems: 12, greens: 8, reform: 18 },
    defaultMinisters: {
      chancellor: 'Rachel Reeves',
      home_secretary: 'Yvette Cooper',
      foreign_secretary: 'David Lammy',
      chief_of_staff_hub: 'Sue Gray',
      party_union_liaison: 'Angela Rayner'
    }
  },
  Badenoch: {
    id: 'Badenoch',
    name: 'Kemi Badenoch',
    formalTitle: 'Rt Hon Kemi Badenoch MP',
    shortName: 'Badenoch',
    party: 'Conservative Party',
    shortParty: 'Conservative',
    hasDirectMandate: true,
    mandateTitle: 'General Election Mandate (July 2026)',
    mandateSummary: 'Won a decisive 5-year democratic mandate in the July 2026 General Election on a Thatcherite, low-tax, supply-side manifesto.',
    leaning: 'Right-Wing / Thatcherite',
    philosophy: 'Free markets, low taxes, deregulation, anti-woke cultural conservatism, strong national borders, and reducing the size of the state.',
    stance: 'Hardline stance against identity politics. Pro-business but hawkish on foreign state investment. Skeptical of net-zero targets.',
    growthModel: 'Supply-Side Deregulation, Corporation Tax Competitiveness, Planning Liberalisation & Fiscal Discipline',
    strategyTitle: 'Supply-Side & Free Market Revolution',
    partyBadge: 'Conservative Grand Strategy',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    premiershipTitle: 'The New Iron Lady: The Badenoch Premiership',
    oppositionFigures: [
      { leader: 'Andy Burnham', party: 'Labour Party' },
      { leader: 'Sir Ed Davey', party: 'Liberal Democrats' },
      { leader: 'Nigel Farage', party: 'Reform UK' },
      { leader: 'Zack Polanski', party: 'Green Party' },
    ],
    defaultPolling: { conservatives: 36, labour: 28, lib_dems: 10, greens: 6, reform: 16 },
    defaultMinisters: {
      chancellor: 'Jeremy Hunt',
      home_secretary: 'James Cleverly',
      foreign_secretary: 'Tom Tugendhat',
      chief_of_staff_hub: 'Dougie Smith',
      party_union_liaison: 'Stuart Andrew'
    }
  },
  Farage: {
    id: 'Farage',
    name: 'Nigel Farage',
    formalTitle: 'Rt Hon Nigel Farage MP',
    shortName: 'Farage',
    party: 'Reform UK',
    shortParty: 'Reform UK',
    hasDirectMandate: true,
    mandateTitle: 'General Election Mandate (July 2026)',
    mandateSummary: 'Swept to power in a historic electoral earthquake in July 2026, winning a direct populist democratic mandate to dismantle establishment orthodoxy.',
    leaning: 'Right-Wing Populist',
    philosophy: 'Nationalist, anti-establishment, drastically shrinking the state, prioritizing native citizens, exiting international courts (ECHR).',
    stance: 'Net-zero immigration freeze, scrapping green levies, heavy tax cuts funded by slashing the civil service, overhaul of quangos.',
    growthModel: 'Domestic Energy Abundance, Small Business Deregulation, Border Control & Transatlantic Alliance',
    strategyTitle: 'Sovereign Industrial Transformation',
    partyBadge: 'Reform UK Grand Strategy',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    premiershipTitle: 'The Insurgent: The Farage Premiership',
    oppositionFigures: [
      { leader: 'Andy Burnham', party: 'Labour Party' },
      { leader: 'Kemi Badenoch', party: 'Conservative Party' },
      { leader: 'Sir Ed Davey', party: 'Liberal Democrats' },
      { leader: 'Zack Polanski', party: 'Green Party' },
    ],
    defaultPolling: { reform: 35, labour: 25, conservatives: 22, lib_dems: 8, greens: 6 },
    defaultMinisters: {
      chancellor: 'Richard Tice',
      home_secretary: 'Ann Widdecombe',
      foreign_secretary: 'Ben Habib',
      chief_of_staff_hub: 'Zia Yusuf',
      party_union_liaison: 'Rupert Lowe'
    }
  },
  Davey: {
    id: 'Davey',
    name: 'Sir Ed Davey',
    formalTitle: 'Rt Hon Sir Ed Davey MP',
    shortName: 'Davey',
    party: 'Liberal Democrats',
    shortParty: 'Liberal Democrats',
    hasDirectMandate: true,
    mandateTitle: 'General Election Mandate (July 2026)',
    mandateSummary: 'Secured a governing democratic mandate in July 2026 after a shock Lib Dem election surge and progressive coalition agreement.',
    leaning: 'Centrist / Social Liberal',
    philosophy: 'Pro-European, community-focused, strong emphasis on care workers, civil liberties, and pragmatic environmentalism.',
    stance: 'Rebuilding ties with the EU Single Market, proportional representation voting system, increased funding for social care.',
    growthModel: 'Single Market Trade Alignment, High-Tech Green Clusters, Social Care Overhaul & PR Reform',
    strategyTitle: 'European Re-alignment & Social Care',
    partyBadge: 'Lib Dem Grand Strategy',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    premiershipTitle: 'The Kingmaker: The Davey Premiership',
    oppositionFigures: [
      { leader: 'Andy Burnham', party: 'Labour Party' },
      { leader: 'Kemi Badenoch', party: 'Conservative Party' },
      { leader: 'Nigel Farage', party: 'Reform UK' },
      { leader: 'Zack Polanski', party: 'Green Party' },
    ],
    defaultPolling: { lib_dems: 32, labour: 28, conservatives: 22, greens: 8, reform: 10 },
    defaultMinisters: {
      chancellor: 'Daisy Cooper',
      home_secretary: 'Alistair Carmichael',
      foreign_secretary: 'Layla Moran',
      chief_of_staff_hub: 'Mike Dixon',
      party_union_liaison: 'Wendy Chamberlain'
    }
  },
  Polanski: {
    id: 'Polanski',
    name: 'Zack Polanski',
    formalTitle: 'Rt Hon Zack Polanski MP',
    shortName: 'Polanski',
    party: 'Green Party',
    shortParty: 'Green Party',
    hasDirectMandate: true,
    mandateTitle: 'General Election Mandate (July 2026)',
    mandateSummary: 'Swept to power on a historic green wave in the July 2026 General Election, securing a radical democratic mandate for an eco-socialist transition.',
    leaning: 'Left-Wing / Environmentalist',
    philosophy: 'Radical climate action, wealth redistribution, universal basic services, clean energy transition, demilitarisation.',
    stance: 'Massive wealth taxes, 100% renewable grid manufacturing, nationalisation of key utilities, four-day working week.',
    growthModel: 'Green Industrial Revolution, Renewable Grid Expansion, Wealth Redistribution & Circular Wellbeing Economy',
    strategyTitle: 'Zero-Carbon Eco-Socialist Transition',
    partyBadge: 'Green Party Grand Strategy',
    badgeColor: 'bg-green-100 text-green-800 border-green-200',
    premiershipTitle: 'The Eco-Radical: The Polanski Premiership',
    oppositionFigures: [
      { leader: 'Andy Burnham', party: 'Labour Party' },
      { leader: 'Kemi Badenoch', party: 'Conservative Party' },
      { leader: 'Sir Ed Davey', party: 'Liberal Democrats' },
      { leader: 'Nigel Farage', party: 'Reform UK' },
    ],
    defaultPolling: { greens: 34, labour: 30, conservatives: 18, lib_dems: 12, reform: 6 },
    defaultMinisters: {
      chancellor: 'Carla Denyer',
      home_secretary: 'Adrian Ramsay',
      foreign_secretary: 'Caroline Lucas',
      chief_of_staff_hub: 'Chris Williams',
      party_union_liaison: 'Sian Berry'
    }
  }
};

export function getCharacterProfile(charId?: string | null): CharacterProfile {
  if (charId && (charId as CharacterId) in CHARACTERS) {
    return CHARACTERS[charId as CharacterId];
  }
  return CHARACTERS.Burnham;
}
