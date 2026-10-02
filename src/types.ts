export interface GameState {
  pm_character: 'Burnham' | 'Badenoch' | 'Farage' | 'Davey' | 'Polanski';
  week: number;
  game_phase: string;
  consecutive_weeks_any_gauge_zero: number;
  consecutive_weeks_media_zero: number;
  gauges: {
    moral_compass: number;
    parliamentary_support: number;
    public_approval: number;
    economic_stability: number;
    public_services_health: number;
    media_favorability: number;
    us_relations_trump: number;
    eu_relations: number;
    china_relations: number;
    russia_relations: number;
    middle_east_relations: number;
    housing_affordability: number;
    party_loyalty: number;
  };
  fiscal_state: {
    budget_deficit_gdp_pct: number;
    consecutive_weeks_high_deficit: number;
    interest_rate_pct: number;
    long_term_growth_projection?: number;
    strategic_commitments: {
      nato_spending_gdp_pct: number;
      gcap_6th_gen_fighter: string;
      national_ai_fund: string;
    };
  };
  labour_market: {
    unemployment_rate_pct: number;
    youth_unemployment_rate_pct: number;
  };
  polling_intent: {
    labour: number;
    conservatives: number;
    lib_dems: number;
    greens: number;
    reform: number;
  };
  machinery_of_government: {
    chancellor: string;
    chancellor_relationship: number;
    home_secretary: string;
    home_secretary_relationship: number;
    foreign_secretary: string;
    foreign_secretary_relationship: number;
    chief_of_staff_hub: string;
    chief_of_staff_relationship: number;
    party_union_liaison: string;
    party_union_relationship: number;
    starmer_status: string;
  };
  active_legislation: Record<string, string>;
}

export interface Headlines {
  bbc_news?: string;
  guardian: string;
  times: string;
  daily_mail: string;
  sun: string;
}

export interface Choice {
  id: string;
  text: string;
  hint: string;
  is_chief_of_staff_preferred?: boolean;
}

export interface PMQ {
  leader: string;
  party: string;
  quote: string;
}

export interface ScandalDetails {
  minister_role: 'Chancellor' | 'Home Secretary' | 'Foreign Secretary' | 'Chief of Staff' | 'Party Liaison' | string;
  minister_name: string;
  scandal_title: string;
  description: string;
  previous_relationship?: number;
  penalty: number;
  new_relationship?: number;
}

export interface MilestoneSummary {
  week: number;
  stageTitle: string;
  stageBadge: string;
  subtitle?: string;
  historicalContext?: string;
  coreAccomplishments?: string[];
  dynamicAchievements?: string[];
  cabinetSecretaryAppraisal?: string;
  fleetStreetConsensus?: string;
  mandateAssessment?: string;
}

export interface TurnResponse {
  state: GameState;
  briefing: string;
  dilemma: string;
  event_type?: 'NORMAL' | 'GLOBAL_CRISIS' | 'SCANDAL';
  scandal_details?: ScandalDetails;
  choices: Choice[];
  allow_custom_policy?: boolean;
  is_game_over: boolean;
  game_over_reason?: string;
  game_over_summary?: string;
  game_over_achievements?: string[];
  milestone_summary?: MilestoneSummary;
  annual_summary?: {
    year: number;
    achievements: string[];
  };
  headlines?: Headlines;
  pmqs?: PMQ[];
}
