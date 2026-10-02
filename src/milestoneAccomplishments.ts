import { GameState } from './types';
import { getCharacterProfile } from './characterConfig';

export interface MilestoneMetric {
  label: string;
  value: string;
  status: 'positive' | 'neutral' | 'warning';
  detail: string;
}

export interface MilestoneAccomplishmentData {
  week: number;
  stageTitle: string;
  stageBadge: string;
  subtitle: string;
  historicalContext: string;
  coreAccomplishments: string[];
  dynamicAchievements: string[];
  metrics: MilestoneMetric[];
  cabinetSecretaryAppraisal: string;
  fleetStreetConsensus: string;
  mandateAssessment: string;
}

export const MILESTONE_WEEKS = [12, 24, 36, 48, 50] as const;
export type MilestoneWeek = typeof MILESTONE_WEEKS[number];

export function isMilestoneWeek(week: number): week is MilestoneWeek {
  return (MILESTONE_WEEKS as readonly number[]).includes(week);
}

export function generateAccomplishmentsSummary(
  week: number,
  state: GameState,
  unlockedPolicies: string[] = []
): MilestoneAccomplishmentData {
  const profile = getCharacterProfile(state.pm_character);
  const pmName = profile.name;
  const party = profile.party;
  const isBurnham = state.pm_character === 'Burnham';

  const growth = Number((state.fiscal_state?.long_term_growth_projection ?? 1.2).toFixed(1));
  const deficit = Number((state.fiscal_state?.budget_deficit_gdp_pct ?? 4.3).toFixed(1));
  const pubHealth = Math.round(state.gauges?.public_services_health ?? 40);
  const mpSupport = Math.round(state.gauges?.parliamentary_support ?? 60);
  const approval = Math.round(state.gauges?.public_approval ?? 50);
  const econ = Math.round(state.gauges?.economic_stability ?? 50);
  const principles = Math.round(state.gauges?.moral_compass ?? 80);
  const partyPoll = Math.round(
    state.polling_intent?.[
      state.pm_character === 'Burnham' ? 'labour' :
      state.pm_character === 'Badenoch' ? 'conservatives' :
      state.pm_character === 'Farage' ? 'reform' :
      state.pm_character === 'Davey' ? 'lib_dems' : 'greens'
    ] ?? 34
  );

  // Collect dynamic achievements based on actual gameplay metrics
  const dynamicAchievements: string[] = [];

  if (growth >= 2.0) {
    dynamicAchievements.push(`Strong Macroeconomic Growth: Propelled long-term GDP growth projection to ${growth}% through proactive capital investment.`);
  } else if (growth >= 1.5) {
    dynamicAchievements.push(`Steady Economic Growth: Maintained positive GDP expansion projection of ${growth}%.`);
  }

  if (deficit <= 3.0) {
    dynamicAchievements.push(`Fiscal Prudence & Budgetary Control: Successfully narrowed sovereign borrowing deficit to ${deficit}% of GDP.`);
  } else if (deficit > 5.0) {
    dynamicAchievements.push(`Expansionary Public Spending: Kept capital programmes active despite Treasury borrowing reaching ${deficit}% of GDP.`);
  }

  if (pubHealth >= 60) {
    dynamicAchievements.push(`NHS & Public Services Renewal: Restored frontline service health to ${pubHealth}%, significantly cutting waiting backlogs.`);
  } else if (pubHealth >= 45) {
    dynamicAchievements.push(`Public Sector Stabilization: Defended frontline services from collapse amidst tight spending reviews.`);
  }

  if (mpSupport >= 70) {
    dynamicAchievements.push(`Commanding Division Lobby Control: Consolidated Parliamentary support among government MPs to ${mpSupport}%.`);
  } else if (mpSupport < 40) {
    dynamicAchievements.push(`Parliamentary Resilience: Navigated fierce Commons turbulence while keeping government business moving.`);
  }

  if (approval >= 55) {
    dynamicAchievements.push(`Broad Popular Appeal: Sustained strong nationwide public approval at ${approval}%.`);
  }

  if (partyPoll >= 38) {
    dynamicAchievements.push(`Dominant Electoral Foundation: Elevated ${party} polling to ${partyPoll}%, establishing a winning trajectory.`);
  }

  if (principles >= 80) {
    dynamicAchievements.push(`Ideological Integrity: Maintained strict fidelity to founding principles (${principles}% moral compass rating).`);
  }

  if (unlockedPolicies.length > 0) {
    dynamicAchievements.push(`Legislative Delivery: Successfully placed ${unlockedPolicies.length} major reform pillar(s) onto the statute book.`);
  }

  // Key metrics array
  const metrics: MilestoneMetric[] = [
    {
      label: 'GDP Growth Projection',
      value: `${growth}%`,
      status: growth >= 2.0 ? 'positive' : growth >= 1.4 ? 'neutral' : 'warning',
      detail: growth >= 2.0 ? 'Above Treasury target' : 'Moderate expansion'
    },
    {
      label: 'Budget Deficit (% GDP)',
      value: `${deficit}%`,
      status: deficit <= 3.5 ? 'positive' : deficit <= 4.8 ? 'neutral' : 'warning',
      detail: deficit <= 3.5 ? 'Sustainable borrowing' : 'Elevated OBR scrutiny'
    },
    {
      label: 'Public Services Health',
      value: `${pubHealth}%`,
      status: pubHealth >= 55 ? 'positive' : pubHealth >= 40 ? 'neutral' : 'warning',
      detail: pubHealth >= 55 ? 'Backlogs reducing' : 'Capacity constraints'
    },
    {
      label: 'Parliamentary Support',
      value: `${mpSupport}%`,
      status: mpSupport >= 65 ? 'positive' : mpSupport >= 45 ? 'neutral' : 'warning',
      detail: mpSupport >= 65 ? 'Solid Commons majority' : 'Backbench friction'
    },
    {
      label: 'National Polling Intent',
      value: `${partyPoll}%`,
      status: partyPoll >= 38 ? 'positive' : partyPoll >= 32 ? 'neutral' : 'warning',
      detail: partyPoll >= 38 ? 'General Election winning territory' : 'Competitive race'
    },
    {
      label: 'Public Approval',
      value: `${approval}%`,
      status: approval >= 50 ? 'positive' : approval >= 35 ? 'neutral' : 'warning',
      detail: approval >= 50 ? 'Net positive approval' : 'Public scepticism'
    }
  ];

  // Specific milestone configurations for 12, 24, 36, 48, 50
  if (week <= 12) {
    return {
      week: 12,
      stageTitle: 'The First 100 Days Executive Audit',
      stageBadge: '12-Week / 100-Day Mark',
      subtitle: `Initial Executive Authority & Cabinet Consolidation for ${pmName}`,
      historicalContext: 'In British constitutional history, the First 100 Days establish the definitive tone, authority, and momentum of any new premiership.',
      coreAccomplishments: isBurnham ? [
        'Formed the Emergency Cabinet and established the No. 10 Strategic Delivery Unit following the party coup.',
        'Halted the immediate collapse of public service negotiations by opening direct ministerial dialogues.',
        'Established regional infrastructure and public ownership priorities as core Whitehall directives.',
        'Resisted intense opposition pressure at PMQs challenging the administration’s democratic mandate.'
      ] : [
        `Consolidated the ${party} governing majority and smoothly appointed key secretaries of state.`,
        'Set out the Government’s flagship legislative programme in the King’s Speech.',
        'Launched decisive early executive orders advancing manifesto commitments.',
        'Established authority in the House of Commons division lobbies.'
      ],
      dynamicAchievements,
      metrics,
      cabinetSecretaryAppraisal: `The Cabinet Secretary notes: "Prime Minister ${pmName} has completed the crucial initial 12 weeks with institutional resolve. The machinery of government is functioning with discipline, and initial policy vectors have been successfully translated into departmental action plans."`,
      fleetStreetConsensus: isBurnham
        ? `Fleet Street Commentary: "Burnham has proven he can command Whitehall and steady the ship, but the question of an electoral mandate still hangs over every major reform."`
        : `Fleet Street Commentary: "${pmName} has stamped their authority on Downing Street, moving swiftly to implement early manifesto pledges amidst vigorous Commons debate."`,
      mandateAssessment: isBurnham
        ? 'Mandate Status: Operating on inherited Parliamentary authority. Polling trajectory will dictate when you can summon the courage to call a General Election to secure your own 5-year mandate.'
        : `Mandate Status: Direct 5-year governing mandate confirmed. The administration holds full manifesto authority to enact structural legislation.`
    };
  }

  if (week <= 24) {
    return {
      week: 24,
      stageTitle: 'Six-Month Strategic Benchmark',
      stageBadge: '24-Week / Half-Year Mark',
      subtitle: `Mid-Year Policy Implementation & Economic Resilience Review`,
      historicalContext: 'Reaching 24 weeks in Downing Street places the Prime Minister beyond the survival record of short-tenured administrations and tests long-term governing stamina.',
      coreAccomplishments: isBurnham ? [
        'Advanced landmark regional devolution and public service stabilization frameworks.',
        'Managed delicate Treasury spending envelopes while protecting core NHS and education baselines.',
        'Sustained party cohesion through two fraught parliamentary voting cycles.',
        'Built rising momentum in municipal partnerships and local transport integration.'
      ] : [
        `Executed key mid-term manifesto pillars across domestic and economic portfolios.`,
        'Maintained government unity through the autumn legislative voting gauntlet.',
        'Strengthened key international diplomatic alliances and trade dialogues.',
        'Delivered measurable initial results on core economic and regulatory objectives.'
      ],
      dynamicAchievements,
      metrics,
      cabinetSecretaryAppraisal: `Permanent Secretary Minute: "At the six-month benchmark, the ${pmName} administration has transitioned from transitional management to structured, long-term delivery. Departmental risk registers show sustained progress across key performance indicators."`,
      fleetStreetConsensus: isBurnham
        ? `The Times & Guardian consensus: "Burnham's pragmatic municipal governance has confounded critics, proving his staying power in Number 10 despite persistent opposition demands for a snap election."`
        : `Political Editors' Consensus: "${pmName}'s governing doctrine has firmly taken root across Whitehall departments, with visible policy shifts underway nationwide."`,
      mandateAssessment: isBurnham
        ? 'Mandate Status: Legitimacy questions persist from opposition benches, but steady delivery is laying the groundwork for a future election challenge.'
        : `Mandate Status: Full 5-year mandate actively being deployed across departmental white papers and primary legislation.`
    };
  }

  if (week <= 36) {
    return {
      week: 36,
      stageTitle: 'Nine-Month Parliamentary & Reform Appraisal',
      stageBadge: '36-Week / Three-Quarter Mark',
      subtitle: `Statutory Delivery & Flagship Legislative Breakthroughs`,
      historicalContext: 'At 36 weeks, a premiership enters the phase of statutory permanence, where bills navigate committee stages and become enforceable law.',
      coreAccomplishments: isBurnham ? [
        'Steered major public sector and municipal infrastructure bills through contentious House of Commons stages.',
        'Balanced backbench factions to defeat opposition wrecking amendments.',
        'Delivered tangible reductions in regional transport bottlenecks and NHS waiting times.',
        'Elevated Labour poll ratings to competitive general election threshold levels.'
      ] : [
        `Secured Royal Assent on flagship ${party} statutory instruments.`,
        'Successfully disciplined backbench rebellions to pass critical budget provisions.',
        'Deepened transformative structural reforms across industry, borders, or public services.',
        'Maintained strategic coherence against sustained opposition scrutiny.'
      ],
      dynamicAchievements,
      metrics,
      cabinetSecretaryAppraisal: `Cabinet Office Report: "The administration has now achieved significant structural permanence. Three-quarters of a year into office, Prime Minister ${pmName} has established an enduring policy footprint across Whitehall."`,
      fleetStreetConsensus: `National Media Review: "Nine months in, the ${pmName} premiership has moved from an emergency posture to a confident, transformative executive machine."`,
      mandateAssessment: isBurnham
        ? 'Mandate Status: You are approaching the tipping point where your track record is strong enough to call a General Election and demand your own 5-year democratic mandate.'
        : `Mandate Status: Strong manifesto execution with legislative benchmarks completed on schedule.`
    };
  }

  if (week <= 48) {
    return {
      week: 48,
      stageTitle: 'One-Year Premiership Legacy & State of the Nation',
      stageBadge: '48-Week / Full-Year Horizon',
      subtitle: `Twelve Months of Executive Leadership in 10 Downing Street`,
      historicalContext: 'Outlasting an entire calendar year at Number 10 cements a Prime Minister into modern British history, representing genuine executive endurance and mastery.',
      coreAccomplishments: isBurnham ? [
        'Marked a full calendar year of decisive leadership following the Starmer succession.',
        'Transformed national regional economic policy and restored vital public service capacity.',
        'Steered the UK through major geopolitical uncertainties and economic pressures.',
        'Demonstrated that a succession government can govern with stability and progressive purpose.'
      ] : [
        `Completed a transformative first year in power delivering on the 2026 election mandate.`,
        'Restructured key state institutions according to party philosophy and strategic doctrines.',
        'Navigated major global crises while safeguarding national interest and fiscal stability.',
        'Established an enduring political legacy that reshapes British public life.'
      ],
      dynamicAchievements,
      metrics,
      cabinetSecretaryAppraisal: `Sir Humphrey & Cabinet Secretariat: "Prime Minister, reaching the one-year milestone represents an institutional triumph. Your strategic decisions have provided stability and clear direction to Her Majesty's Civil Service."`,
      fleetStreetConsensus: `Fleet Street Year-in-Review: "Against formidable economic headwinds and political turbulence, ${pmName} has proved their critics wrong and secured their place in modern Downing Street history."`,
      mandateAssessment: isBurnham
        ? 'Mandate Status: The one-year milestone provides maximum momentum. Fleet Street speculates an imminent snap election call to convert your governing record into a personal 5-year mandate.'
        : `Mandate Status: 1st Year of 5-year democratic mandate triumphantly completed with extensive manifesto delivery.`
    };
  }

  // Week 50+ (Fiftieth Week Golden Jubilee)
  return {
    week: 50,
    stageTitle: 'The 50-Week Golden Milestone of Governance',
    stageBadge: '50-Week Milestone / Jubilee',
    subtitle: `Half-Century Week Mark: Comprehensive Mandate & Governance Scorecard`,
    historicalContext: 'Fifty weeks in 10 Downing Street is the pinnacle of survival and strategic execution, outlasting multiple contemporary Prime Ministers and unlocking full political legacies.',
    coreAccomplishments: isBurnham ? [
      'Survived and conquered 50 intense weeks in the highest office of the land.',
      'Completely transformed the national narrative from "unelected caretaker" to formidable Prime Minister.',
      'Achieved historic improvements across regional growth, public transport, and NHS delivery.',
      'Positioned the government at peak electoral strength, ready to dissolve Parliament and win a personal 5-year mandate.'
    ] : [
      `Triumphantly navigated 50 weeks in 10 Downing Street, delivering on core 2026 election pledges.`,
      'Achieved fundamental restructuring of the British economy and public administration.',
      'Solidified party supremacy in Parliament and earned high standing with international allies.',
      'Secured a place of distinction among enduring British Prime Ministers.'
    ],
    dynamicAchievements,
    metrics,
    cabinetSecretaryAppraisal: `Cabinet Secretary Formal Address: "Prime Minister, on this 50th week of your administration, the Civil Service salutes your enduring leadership. The historical audit confirms your government has demonstrated exceptional resilience, policy innovation, and constitutional mastery."`,
    fleetStreetConsensus: `BBC & Fleet Street Special Report: "FIFTY WEEKS OF ${pmName.toUpperCase()}: How a premiership defied the odds and reshaped British politics for a generation."`,
    mandateAssessment: isBurnham
      ? 'Mandate Status: The ultimate constitutional milestone. You have fully earned the moral right to seek a personal 5-year mandate in a General Election.'
      : `Mandate Status: Golden standard of democratic governance, with manifesto commitments delivered ahead of schedule.`
  };
}
