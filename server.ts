import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const gameStateSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      pm_character: { type: Type.STRING },
      week: { type: Type.INTEGER },
      game_phase: { type: Type.STRING },
      consecutive_weeks_any_gauge_zero: { type: Type.INTEGER },
      consecutive_weeks_media_zero: { type: Type.INTEGER },
      gauges: {
        type: Type.OBJECT,
        properties: {
          moral_compass: { type: Type.INTEGER },
          parliamentary_support: { type: Type.INTEGER },
          public_approval: { type: Type.INTEGER },
          economic_stability: { type: Type.INTEGER },
          public_services_health: { type: Type.INTEGER },
          media_favorability: { type: Type.INTEGER },
          us_relations_trump: { type: Type.INTEGER },
          eu_relations: { type: Type.INTEGER },
          china_relations: { type: Type.INTEGER },
          russia_relations: { type: Type.INTEGER },
          middle_east_relations: { type: Type.INTEGER },
          housing_affordability: { type: Type.INTEGER },
          party_loyalty: { type: Type.INTEGER }
        },
        required: [
          "moral_compass", "parliamentary_support", "public_approval", 
          "economic_stability", "public_services_health", "media_favorability", 
          "us_relations_trump", "eu_relations", "china_relations", 
          "russia_relations", "middle_east_relations", "housing_affordability", 
          "party_loyalty"
        ]
      },
      fiscal_state: {
        type: Type.OBJECT,
        properties: {
          budget_deficit_gdp_pct: { type: Type.NUMBER },
          consecutive_weeks_high_deficit: { type: Type.INTEGER },
          interest_rate_pct: { type: Type.NUMBER },
          long_term_growth_projection: { type: Type.NUMBER, nullable: true },
          strategic_commitments: {
            type: Type.OBJECT,
            properties: {
              nato_spending_gdp_pct: { type: Type.NUMBER },
              gcap_6th_gen_fighter: { type: Type.STRING },
              national_ai_fund: { type: Type.STRING }
            }
          }
        }
      },
      labour_market: {
        type: Type.OBJECT,
        properties: {
          unemployment_rate_pct: { type: Type.NUMBER },
          youth_unemployment_rate_pct: { type: Type.NUMBER }
        }
      },
      polling_intent: {
        type: Type.OBJECT,
        properties: {
          labour: { type: Type.INTEGER },
          conservatives: { type: Type.INTEGER },
          lib_dems: { type: Type.INTEGER },
          greens: { type: Type.INTEGER },
          reform: { type: Type.INTEGER }
        }
      },
      machinery_of_government: {
        type: Type.OBJECT,
        properties: {
          chancellor: { type: Type.STRING },
          chancellor_relationship: { type: Type.INTEGER },
          home_secretary: { type: Type.STRING },
          home_secretary_relationship: { type: Type.INTEGER },
          foreign_secretary: { type: Type.STRING },
          foreign_secretary_relationship: { type: Type.INTEGER },
          chief_of_staff_hub: { type: Type.STRING },
          chief_of_staff_relationship: { type: Type.INTEGER },
          party_union_liaison: { type: Type.STRING },
          party_union_relationship: { type: Type.INTEGER },
          starmer_status: { type: Type.STRING }
        }
      },
      active_legislation: {
        type: Type.OBJECT
      }
    },
    required: ["pm_character", "week", "game_phase", "gauges"]
  };

  const turnResponseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      state: gameStateSchema,
      briefing: { type: Type.STRING },
      dilemma: { type: Type.STRING },
      event_type: { type: Type.STRING, enum: ['NORMAL', 'GLOBAL_CRISIS', 'SCANDAL'], nullable: true },
      scandal_details: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          minister_role: { type: Type.STRING },
          minister_name: { type: Type.STRING },
          scandal_title: { type: Type.STRING },
          description: { type: Type.STRING },
          previous_relationship: { type: Type.INTEGER, nullable: true },
          penalty: { type: Type.INTEGER },
          new_relationship: { type: Type.INTEGER, nullable: true }
        }
      },
      choices: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            hint: { type: Type.STRING },
            is_chief_of_staff_preferred: { type: Type.BOOLEAN, nullable: true }
          },
          required: ["id", "text"]
        }
      },
      headlines: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          bbc_news: { type: Type.STRING },
          guardian: { type: Type.STRING },
          times: { type: Type.STRING },
          daily_mail: { type: Type.STRING },
          sun: { type: Type.STRING }
        }
      },
      pmqs: {
        type: Type.ARRAY,
        nullable: true,
        items: {
          type: Type.OBJECT,
          properties: {
            leader: { type: Type.STRING },
            party: { type: Type.STRING },
            quote: { type: Type.STRING }
          }
        }
      },
      allow_custom_policy: { type: Type.BOOLEAN, nullable: true },
      is_game_over: { type: Type.BOOLEAN },
      game_over_reason: { type: Type.STRING, nullable: true },
      game_over_summary: { type: Type.STRING, nullable: true },
      game_over_achievements: { 
        type: Type.ARRAY,
        items: { type: Type.STRING },
        nullable: true 
      },
      milestone_summary: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          week: { type: Type.INTEGER },
          stageTitle: { type: Type.STRING },
          stageBadge: { type: Type.STRING },
          subtitle: { type: Type.STRING, nullable: true },
          historicalContext: { type: Type.STRING, nullable: true },
          coreAccomplishments: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
          dynamicAchievements: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
          cabinetSecretaryAppraisal: { type: Type.STRING, nullable: true },
          fleetStreetConsensus: { type: Type.STRING, nullable: true },
          mandateAssessment: { type: Type.STRING, nullable: true }
        }
      },
      annual_summary: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          year: { type: Type.INTEGER },
          achievements: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    required: ["state", "briefing", "dilemma", "choices", "is_game_over"]
  };

  app.post('/api/turn', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
      const { currentState, previousChoice, isElectionCalled, pmCharacter, turnHistory } = req.body;
      const character = (pmCharacter || currentState?.pm_character || 'Burnham') as 'Burnham' | 'Badenoch' | 'Farage' | 'Davey' | 'Polanski';

      let pmName = "Andy Burnham";
      let pmFormalTitle = "Rt Hon Andy Burnham MP";
      let pmContext = "The player plays as Andy Burnham, who became Prime Minister in July 2026 following an emergency internal Labour Party coup after Keir Starmer was ousted. CRITICAL NARRATIVE PILLAR: Burnham DOES NOT have a personal democratic mandate from the British electorate. Opposition leaders (Badenoch, Farage, Davey) relentlessly taunt him at PMQs as an 'unelected Prime Minister', Fleet Street headlines scream 'PM WITHOUT A MANDATE', and Whitehall civil servants warn that major reforms lack manifesto authority. His central imperative is to stabilize public services, lift Labour polling to ≥38%, and strategically CALL A GENERAL ELECTION to win a personal 5-year mandate from the British public.";
      let winCondition = "Labour is not the largest party or falls below 35% in election";
      let victoryParty = "Labour";
      let defaultPolling = "{ labour: 34, conservatives: 24, lib_dems: 12, greens: 8, reform: 18 }";
      let growthModel = "Regional Infrastructure, Devolution Max, Municipal Transport & NHS Restoration";
      let oppositionFigures = [
        { leader: 'Kemi Badenoch', party: 'Conservative Party' },
        { leader: 'Sir Ed Davey', party: 'Liberal Democrats' },
        { leader: 'Nigel Farage', party: 'Reform UK' },
        { leader: 'Zack Polanski', party: 'Green Party' }
      ];
      let partyMinisters = {
        chancellor: 'Rachel Reeves',
        home_secretary: 'Yvette Cooper',
        foreign_secretary: 'David Lammy',
        chief_of_staff_hub: 'Sue Gray',
        party_union_liaison: 'Angela Rayner'
      };

      if (character === 'Badenoch') {
        pmName = "Kemi Badenoch";
        pmFormalTitle = "Rt Hon Kemi Badenoch MP";
        pmContext = "The player plays as Kemi Badenoch, who won a decisive majority in the July 2026 General Election on a Thatcherite, low-tax, supply-side manifesto. She HOLDS A DIRECT 5-YEAR DEMOCRATIC MANDATE from the British voters. Her primary challenge is executing her radical state-rollback and planning deregulation while keeping rebellious backbenchers unified.";
        winCondition = "the Conservatives are not the largest party or fall below 35% in election";
        victoryParty = "the Conservatives";
        defaultPolling = "{ conservatives: 36, labour: 28, lib_dems: 10, greens: 6, reform: 16 }";
        growthModel = "Supply-Side Deregulation, Corporation Tax Competitiveness, Planning Liberalisation & Fiscal Discipline";
        oppositionFigures = [
          { leader: 'Andy Burnham', party: 'Labour Party' },
          { leader: 'Sir Ed Davey', party: 'Liberal Democrats' },
          { leader: 'Nigel Farage', party: 'Reform UK' },
          { leader: 'Zack Polanski', party: 'Green Party' }
        ];
        partyMinisters = {
          chancellor: 'Jeremy Hunt',
          home_secretary: 'James Cleverly',
          foreign_secretary: 'Tom Tugendhat',
          chief_of_staff_hub: 'Dougie Smith',
          party_union_liaison: 'Stuart Andrew'
        };
      } else if (character === 'Farage') {
        pmName = "Nigel Farage";
        pmFormalTitle = "Rt Hon Nigel Farage MP";
        pmContext = "The player plays as Nigel Farage, who swept to power in a historic July 2026 General Election earthquake. He HOLDS A POPULAR 5-YEAR DEMOCRATIC MANDATE to freeze immigration, exit international treaties, slash Whitehall bureaucracy, and unleash North Sea energy.";
        winCondition = "Reform UK is not the largest party or falls below 33% in election";
        victoryParty = "Reform UK";
        defaultPolling = "{ reform: 35, labour: 25, conservatives: 22, lib_dems: 8, greens: 6 }";
        growthModel = "Domestic Energy Abundance, Small Business Deregulation, Border Control & Transatlantic Alliance";
        oppositionFigures = [
          { leader: 'Andy Burnham', party: 'Labour Party' },
          { leader: 'Kemi Badenoch', party: 'Conservative Party' },
          { leader: 'Sir Ed Davey', party: 'Liberal Democrats' },
          { leader: 'Zack Polanski', party: 'Green Party' }
        ];
        partyMinisters = {
          chancellor: 'Richard Tice',
          home_secretary: 'Ann Widdecombe',
          foreign_secretary: 'Ben Habib',
          chief_of_staff_hub: 'Zia Yusuf',
          party_union_liaison: 'Rupert Lowe'
        };
      } else if (character === 'Davey') {
        pmName = "Sir Ed Davey";
        pmFormalTitle = "Rt Hon Sir Ed Davey MP";
        pmContext = "The player plays as Sir Ed Davey, who became Prime Minister following a shock Liberal Democrat surge in the July 2026 General Election and subsequent governing coalition. He HOLDS A DEMOCRATIC MANDATE to re-align Britain with the European Single Market, overhaul social care, and introduce Proportional Representation.";
        winCondition = "the Liberal Democrats are not the largest party or fall below 30% in election";
        victoryParty = "the Liberal Democrats";
        defaultPolling = "{ lib_dems: 32, labour: 28, conservatives: 22, greens: 8, reform: 10 }";
        growthModel = "Single Market Trade Alignment, High-Tech Green Clusters, Social Care Overhaul & PR Reform";
        oppositionFigures = [
          { leader: 'Andy Burnham', party: 'Labour Party' },
          { leader: 'Kemi Badenoch', party: 'Conservative Party' },
          { leader: 'Nigel Farage', party: 'Reform UK' },
          { leader: 'Zack Polanski', party: 'Green Party' }
        ];
        partyMinisters = {
          chancellor: 'Daisy Cooper',
          home_secretary: 'Alistair Carmichael',
          foreign_secretary: 'Layla Moran',
          chief_of_staff_hub: 'Mike Dixon',
          party_union_liaison: 'Wendy Chamberlain'
        };
      } else if (character === 'Polanski') {
        pmName = "Zack Polanski";
        pmFormalTitle = "Rt Hon Zack Polanski MP";
        pmContext = "The player plays as Zack Polanski, who led a historic green wave in the July 2026 General Election. He HOLDS A DEMOCRATIC MANDATE for a Green New Deal, wealth taxes, renewable energy nationalisation, and climate justice.";
        winCondition = "the Green Party is not the largest party or falls below 30% in election";
        victoryParty = "the Green Party";
        defaultPolling = "{ greens: 34, labour: 30, conservatives: 18, lib_dems: 12, reform: 6 }";
        growthModel = "Green Industrial Revolution, Renewable Grid Expansion, Wealth Redistribution & Circular Wellbeing Economy";
        oppositionFigures = [
          { leader: 'Andy Burnham', party: 'Labour Party' },
          { leader: 'Kemi Badenoch', party: 'Conservative Party' },
          { leader: 'Sir Ed Davey', party: 'Liberal Democrats' },
          { leader: 'Nigel Farage', party: 'Reform UK' }
        ];
        partyMinisters = {
          chancellor: 'Carla Denyer',
          home_secretary: 'Adrian Ramsay',
          foreign_secretary: 'Caroline Lucas',
          chief_of_staff_hub: 'Chris Williams',
          party_union_liaison: 'Sian Berry'
        };
      }

      let parsedDefaultPolling = { labour: 34, conservatives: 24, lib_dems: 12, greens: 8, reform: 18 };
      try {
        parsedDefaultPolling = JSON.parse(defaultPolling.replace(/([a-zA-Z0-9_]+):/g, '"$1":'));
      } catch {}

      const oppositionSummary = oppositionFigures.map(o => `${o.leader} (${o.party})`).join(', ');

      const systemInstruction = `You are the Core Game Engine for 10 Downing Street, a high-stakes UK Prime Minister political simulation.

CRITICAL IDENTITY & OPPOSITION ROLES:
- SITTING PRIME MINISTER: ${pmName} (${victoryParty}). ${pmName} is the Prime Minister of the United Kingdom and head of government at 10 Downing Street.
- OPPOSITION LEADERS: ${oppositionSummary}.
- ALL government policy announcements, cabinet decisions, and Downing Street actions are conducted by Prime Minister ${pmName} and the ${victoryParty} government.
- The Prime Minister (${pmName}) NEVER attacks themselves, NEVER opposes their own policies, and NEVER asks questions at PMQs.
- Opposition figures (${oppositionFigures.map(o => o.leader).join(', ')}) are the politicians who challenge, criticize, and scrutinize Prime Minister ${pmName} at PMQs, in the national press, and on the television airwaves.
- ALWAYS use the actual names of opposition figures accurately when they speak or attack (e.g. Kemi Badenoch for Conservatives, Nigel Farage for Reform UK, Sir Ed Davey for Lib Dems, Zack Polanski for Greens, Andy Burnham for Labour).

DEMOCRATIC MANDATE ATMOSPHERE:
${character === 'Burnham' ? `- MANDATE CRISIS (BURNHAM): Burnham took office via an internal party succession without a General Election. Fleet Street and the Opposition constantly challenge his democratic legitimacy ('Unelected PM', 'No Mandate', 'Call an election!'). Civil servants advise caution on controversial policies without manifesto cover. Burnham's ultimate objective is to steady public services, build polling momentum, and call a General Election to secure his own 5-year mandate.` : `- DIRECT MANDATE: ${pmName} holds a legitimate 5-year democratic mandate from the July 2026 General Election. Opposition challenges focus on policy execution, public discontent, and ideological friction, not democratic legitimacy.`}

PARLIAMENTARY SCRUTINY & PMQS RULES:
- Prime Minister's Questions (PMQs) questions MUST come strictly from OPPOSITION leaders: ${oppositionSummary}.
- The Prime Minister (${pmName}) answers from the Dispatch Box; opposition leaders challenge ${pmName}.
${character === 'Burnham' ? `- Opposition leaders at PMQs frequently demand to know when Burnham will summon the courage to call a General Election and face the voters.` : ''}

LEADER PROACTIVE GROWTH & VICTORY ENGINE:
- Prime Minister: ${pmName} (${victoryParty}). Strategic Growth Lever: ${growthModel}.
- Update long_term_growth_projection (1.0% to 3.0%), budget_deficit_gdp_pct (1.5% to 7.0%), youth_unemployment_rate_pct (8% to 20%), and all 13 gauges in response to policy efficacy.
- Reward coherent ideological strategy matching ${pmName}'s growth model with increased long_term_growth_projection and party polling. Penalise half-measures or sudden reversals with backbench revolts and media backlash.
- Failure conditions: If 3+ gauges hit 0, or any non-diplomatic gauge stays at 0 for 4 weeks, set is_game_over: true with game_over_reason and game_over_summary.
- Deficit rule: If budget_deficit_gdp_pct > 3.5%, penalise economy/media every 4 turns. If > 8%, trigger emergency sovereign debt crisis.
- ACCOMPLISHMENT MILESTONES (WEEKS 12, 24, 36, 48, 50): When the game reaches or crosses weeks 12, 24, 36, 48, or 50, you MUST generate a rich 'milestone_summary' object reviewing Prime Minister ${pmName}'s cumulative accomplishments, flagship legislative delivery, economic stewardship, cabinet secretary appraisal, and mandate standing.
- Phase 1 (Week 1): Sequential appointments (Chancellor -> Home Secretary -> Foreign Secretary -> Chief of Staff -> Liaison -> Global Summit). Week remains 1 during Phase 1. Offer 3 real UK politicians from ${victoryParty}.
- Phase 2 (Week 2+): Increment week by 1 each turn. Generate 1 dilemma with exactly 3 choices. Format each choice's 'text' strictly as "Title: Description" (under 25 words per choice).
- Tone: Authentic British politics. Use British English ('favour', 'defence', 'programme'). Keep briefings punchy (2-3 sentences max).
- Headlines: Generate 5 distinct, witty headlines (BBC, Guardian, Times, Mail, Sun) all specifically referencing Prime Minister ${pmName} or the ${victoryParty} government.
`;

      let historyContext = "";
      if (Array.isArray(turnHistory) && turnHistory.length > 0) {
        historyContext = `\nRecent Context (Last 3 Turns):\n` + turnHistory.slice(-3).map((h: any, i: number) => `Turn: "${h.choice}"`).join('\n');
      }

      // Random Event Engine: Political Scandal Trigger
      let isScandalTurn = false;
      let targetMinister: { role: string; name: string; relKey: string; currentScore: number } | null = null;
      let scandalPenalty = 0;
      let scandalTypeHint = "";

      if (currentState && currentState.week >= 2 && currentState.game_phase !== 'CABINET_SELECTION' && !isElectionCalled) {
        // ~22% baseline chance on regular governance turns, elevated if media/party loyalty under strain
        const baseChance = 0.22;
        const mediaFactor = (currentState.gauges?.media_favorability ?? 50) < 35 ? 0.10 : 0;
        const partyFactor = (currentState.gauges?.party_loyalty ?? 50) < 45 ? 0.08 : 0;
        const totalScandalChance = Math.min(0.42, baseChance + mediaFactor + partyFactor);

        if (Math.random() < totalScandalChance) {
          const availableMinisters = [
            { 
              role: 'Chancellor', 
              name: currentState.machinery_of_government?.chancellor || partyMinisters.chancellor, 
              relKey: 'chancellor_relationship', 
              currentScore: currentState.machinery_of_government?.chancellor_relationship ?? 65 
            },
            { 
              role: 'Home Secretary', 
              name: currentState.machinery_of_government?.home_secretary || partyMinisters.home_secretary, 
              relKey: 'home_secretary_relationship', 
              currentScore: currentState.machinery_of_government?.home_secretary_relationship ?? 65 
            },
            { 
              role: 'Foreign Secretary', 
              name: currentState.machinery_of_government?.foreign_secretary || partyMinisters.foreign_secretary, 
              relKey: 'foreign_secretary_relationship', 
              currentScore: currentState.machinery_of_government?.foreign_secretary_relationship ?? 65 
            },
            { 
              role: 'Chief of Staff', 
              name: currentState.machinery_of_government?.chief_of_staff_hub || partyMinisters.chief_of_staff_hub, 
              relKey: 'chief_of_staff_relationship', 
              currentScore: currentState.machinery_of_government?.chief_of_staff_relationship ?? 70 
            },
            { 
              role: 'Party Liaison', 
              name: currentState.machinery_of_government?.party_union_liaison || partyMinisters.party_union_liaison, 
              relKey: 'party_union_relationship', 
              currentScore: currentState.machinery_of_government?.party_union_relationship ?? 65 
            },
          ].filter(m => m.name && m.name !== 'Pending');

          if (availableMinisters.length > 0) {
            isScandalTurn = true;
            targetMinister = availableMinisters[Math.floor(Math.random() * availableMinisters.length)];
            scandalPenalty = Math.floor(Math.random() * 16) + 25; // 25 to 40 point penalty

            const scandalTopics = [
              "Secret offshore shareholding and undeclared conflict of interest revealed by the Sunday Times",
              "Leaked WhatsApp audio recording deriding the Prime Minister's authority and Downing Street leadership",
              "Fast-track public procurement contracts awarded to personal party donors and commercial associates",
              "Undisclosed private overseas diplomatic meetings in direct breach of the Ministerial Code",
              "Whistleblower leak alleging bullying of civil servants and deliberate suppression of official government statistics",
              "Substantial undeclared hospitality, private flights, and donations from property developers"
            ];
            scandalTypeHint = scandalTopics[Math.floor(Math.random() * scandalTopics.length)];
          }
        }
      }

      let prompt = "";
      if (!currentState || currentState.week === undefined || currentState.week === 0) {
        prompt = `CURRENT PRIME MINISTER: ${pmName} (${victoryParty}).
Start Game (Week 1, Phase: CABINET_SELECTION). Deliver Chancellor appointment briefing with 3 choices from ${victoryParty}.
${character === 'Burnham' ? 'Establish the atmosphere: Burnham has just stepped into Downing Street after the dramatic ousting of Keir Starmer, with the press demanding to know if he has a mandate to govern.' : `Establish the atmosphere: ${pmName} enters Downing Street fresh from winning the July 2026 General Election with a mandate to deliver.`}
Initialize state: pm_character: '${character}', week: 1, game_phase: 'CABINET_SELECTION', consecutive_weeks_any_gauge_zero: 0, consecutive_weeks_media_zero: 0, public_approval: 52, parliamentary_support: 60, economic_stability: 50, public_services_health: 40, media_favorability: 45, us_relations_trump: 50, eu_relations: 65, china_relations: 40, russia_relations: 10, middle_east_relations: 30, housing_affordability: 40, moral_compass: 100, party_loyalty: 100, budget_deficit_gdp_pct: 4.3, consecutive_weeks_high_deficit: 0, interest_rate_pct: 5.25, unemployment_rate_pct: 5.1, youth_unemployment_rate_pct: 16.0, long_term_growth_projection: 1.2, polling_intent: ${defaultPolling}. Set machinery values to 'Pending' and relationships to 60.`;
      } else if (isElectionCalled) {
        let electionRules = "";
        if (character === 'Burnham') {
          electionRules = `Andy Burnham has called the General Election to seek his own democratic 5-year mandate!
If Labour polling >= 34% or Labour is the largest party:
- Burnham WINS a historic 5-year personal mandate! The government has NOT collapsed; he has achieved victory!
- Set is_game_over: false (CRITICAL: Do not end the game!).
- Set game_phase: 'CABINET_RESHUFFLE'.
- Boost parliamentary_support to 92, public_approval to 78, party_loyalty to 90.
- Reset consecutive_weeks_any_gauge_zero to 0, consecutive_weeks_media_zero to 0.
- Advance week by 6 weeks (campaign duration).
- Briefing: A triumphant return to Downing Street with a roaring mandate. Fleet street and Westminster recognize his democratic authority.
- Dilemma: Present post-election Cabinet organization choices:
  * Option A: "Keep Existing Ministers in Post: Maintain full continuity with your current Chancellor, Home Secretary, Foreign Secretary, and Chief of Staff."
  * Option B: "Comprehensive Cabinet Reshuffle: Appoint fresh talent and trusted loyalists across the Great Offices of State."
  * Option C: "Consolidated Treasury Leadership: Reaffirm Chancellor in post while initiating targeted ministerial rotations in Home and Foreign affairs."
If Labour polling < 34% and trailing:
- Burnham is defeated at the polls; set is_game_over: true with an election defeat summary.`;
        } else {
          electionRules = `Prime Minister ${pmName} (${victoryParty}) has called a snap General Election.
If ${victoryParty} polling >= 32% or is the largest party:
- ${pmName} WINS a renewed parliamentary majority and mandate! The government has NOT collapsed.
- Set is_game_over: false.
- Set game_phase: 'CABINET_RESHUFFLE'.
- Boost parliamentary_support to 90, public_approval to 75.
- Reset gauge crisis streaks to 0, advance week by 6.
- Dilemma: Present choices to either keep existing ministers in post or initiate a major post-election reshuffle.
If lost, set is_game_over: true with election defeat summary.`;
        }
        prompt = `CURRENT PRIME MINISTER: ${pmName} (${victoryParty}).
Snap General Election called. Polling: ${JSON.stringify(currentState.polling_intent)}.
${electionRules}
Previous State: ${JSON.stringify(currentState)}
${historyContext}`;
      } else if (isScandalTurn && targetMinister) {
        const preRel = targetMinister.currentScore;
        const postRel = Math.max(10, preRel - scandalPenalty);
        prompt = `CURRENT PRIME MINISTER: ${pmName} (${victoryParty}).
Prime Minister ${pmName} chose: "${previousChoice}".
Process outcome, update state and gauges for ${pmName}'s ${victoryParty} administration. Increment week by 1.

*** CRITICAL RANDOM EVENT TRIGGERED: POLITICAL SCANDAL ***
- Minister Embroiled: ${targetMinister.name} (${targetMinister.role})
- Pre-Scandal Relationship: ${preRel}
- Scandal Revelations: ${scandalTypeHint}
- MANDATORY STATE UPDATES:
  * Set event_type: 'SCANDAL'.
  * Force ${targetMinister.name}'s relationship (${targetMinister.relKey}) down by ${scandalPenalty} points from ${preRel} to ${postRel}.
  * Populate 'scandal_details' object:
    {
      "minister_role": "${targetMinister.role}",
      "minister_name": "${targetMinister.name}",
      "scandal_title": "<Concise 4-8 word scandal headline, e.g. 'Secret Offshore Account Scandal' or 'Procurement Cronyism Revelation'>",
      "description": "<1-2 sentence dramatic summary of what Fleet Street has uncovered about ${targetMinister.name}>",
      "penalty": ${scandalPenalty},
      "previous_relationship": ${preRel},
      "new_relationship": ${postRel}
    }
- Briefing: Front pages across Fleet Street lead with damning revelations regarding ${targetMinister.name} (${targetMinister.role}). The Opposition is calling for emergency Commons statements and an immediate resignation.
- Dilemma: Prime Minister ${pmName} must make a high-stakes executive crisis decision:
  * Option 1 (Unconditional Downing Street Backing): "Full Downing Street Confidence: Express complete 100% confidence in ${targetMinister.name}, dismissing press reports as partisan smear." (Restores minister loyalty, but causes severe media backlash and drops public approval).
  * Option 2 (Demand Immediate Resignation / Sack): "Demand Ministerial Resignation: Order ${targetMinister.name} to resign immediately to enforce ministerial standards." (Pleases media and voters, but severely alienates the minister's party faction and hits party loyalty).
  * Option 3 (Launch Independent Ethics Inquiry): "Independent Ethics Investigation: Refer the allegations to the Independent Adviser on Ministers' Interests while keeping the minister in post." (Buys tactical time and cools immediate headlines, but projects executive dithering and freezes departmental bills).
- Fleet Street Headlines and PMQs MUST focus entirely on this breaking scandal regarding ${targetMinister.name}!
Previous State: ${JSON.stringify(currentState)}
${historyContext}`;
      } else {
        prompt = `CURRENT PRIME MINISTER: ${pmName} (${victoryParty}).
Prime Minister ${pmName} chose: "${previousChoice}".
Process outcome, update state and gauges for ${pmName}'s ${victoryParty} administration. If in Phase 1, keep week at 1. If in Phase 2, increment week by 1. Return next briefing (2-3 sentences), dilemma, and 3 choices ("Title: Description"). Headlines and PMQs must strictly reflect ${pmName}'s government.
Previous State: ${JSON.stringify(currentState)}
${historyContext}`;
      }

      let result;
      let retries = ai ? 3 : 0;
      // Cascade from flash to flash-lite on high load or error
      const modelSequence = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-lite'];
      
      while (retries > 0 && ai) {
        const currentModel = modelSequence[3 - retries] || 'gemini-3.1-flash-lite';
        try {
          const config: any = {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: turnResponseSchema,
            temperature: 0.5,
            maxOutputTokens: 3500,
          };

          const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config
          });
          
          if (!response || !response.text) {
            throw new Error("Empty response from Gemini");
          }

          let text = response.text.trim();
          
          // Robust JSON parsing with multi-stage sanitization
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const candidate = jsonMatch ? jsonMatch[0] : text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            result = JSON.parse(candidate);
          } catch (initialParseErr) {
            let repaired = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            const sIdx = repaired.indexOf('{');
            const eIdx = repaired.lastIndexOf('}');
            if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
              repaired = repaired.slice(sIdx, eIdx + 1);
            }
            repaired = repaired.replace(/,\s*([}\]])/g, '$1');
            
            let inStr = false;
            let esc = false;
            for (let i = 0; i < repaired.length; i++) {
              if (repaired[i] === '\\' && !esc) { esc = true; continue; }
              if (repaired[i] === '"' && !esc) inStr = !inStr;
              esc = false;
            }
            if (inStr) repaired += '"';
            
            const oBrace = (repaired.match(/\{/g) || []).length;
            const cBrace = (repaired.match(/\}/g) || []).length;
            const oBrack = (repaired.match(/\[/g) || []).length;
            const cBrack = (repaired.match(/\]/g) || []).length;
            for (let b = 0; b < oBrack - cBrack; b++) repaired += ']';
            for (let b = 0; b < oBrace - cBrace; b++) repaired += '}';
            
            result = JSON.parse(repaired);
          }
          
          if (!result || typeof result !== 'object') {
            throw new Error("Invalid output: not an object");
          }

          // Hydrate and sanitize state
          const defaultGauges = {
            moral_compass: 100,
            parliamentary_support: 60,
            public_approval: 52,
            economic_stability: 50,
            public_services_health: 40,
            media_favorability: 45,
            us_relations_trump: 50,
            eu_relations: 65,
            china_relations: 40,
            russia_relations: 10,
            middle_east_relations: 30,
            housing_affordability: 40,
            party_loyalty: 100,
          };

          if (!result.state) {
            result.state = currentState ? { ...currentState } : { pm_character: character, week: 1, game_phase: 'CABINET_SELECTION' };
          }
          
          result.state.pm_character = character;
          result.state.week = result.state.week !== undefined ? result.state.week : (currentState?.week || 1);
          result.state.game_phase = result.state.game_phase || (currentState?.game_phase || 'CABINET_SELECTION');
          result.state.consecutive_weeks_any_gauge_zero = result.state.consecutive_weeks_any_gauge_zero ?? (currentState?.consecutive_weeks_any_gauge_zero || 0);
          result.state.consecutive_weeks_media_zero = result.state.consecutive_weeks_media_zero ?? (currentState?.consecutive_weeks_media_zero || 0);

          const sanitizeGauge = (val: any, fallback: number) => {
            const num = typeof val === 'number' ? val : parseFloat(val);
            if (isNaN(num)) return fallback;
            return Math.max(0, Math.min(100, Math.round(num)));
          };

          const rawGauges = {
            ...defaultGauges,
            ...(currentState?.gauges || {}),
            ...(result.state.gauges || {})
          };

          result.state.gauges = {
            moral_compass: sanitizeGauge(rawGauges.moral_compass, 100),
            parliamentary_support: sanitizeGauge(rawGauges.parliamentary_support, 60),
            public_approval: sanitizeGauge(rawGauges.public_approval, 52),
            economic_stability: sanitizeGauge(rawGauges.economic_stability, 50),
            public_services_health: sanitizeGauge(rawGauges.public_services_health, 40),
            media_favorability: sanitizeGauge(rawGauges.media_favorability, 45),
            us_relations_trump: sanitizeGauge(rawGauges.us_relations_trump, 50),
            eu_relations: sanitizeGauge(rawGauges.eu_relations, 65),
            china_relations: sanitizeGauge(rawGauges.china_relations, 40),
            russia_relations: sanitizeGauge(rawGauges.russia_relations, 10),
            middle_east_relations: sanitizeGauge(rawGauges.middle_east_relations, 30),
            housing_affordability: sanitizeGauge(rawGauges.housing_affordability, 40),
            party_loyalty: sanitizeGauge(rawGauges.party_loyalty, 100),
          };

          if (!result.state.fiscal_state) {
            result.state.fiscal_state = currentState?.fiscal_state || {
              budget_deficit_gdp_pct: 4.3,
              consecutive_weeks_high_deficit: 0,
              interest_rate_pct: 5.25,
              long_term_growth_projection: 1.2
            };
          } else {
            result.state.fiscal_state = {
              budget_deficit_gdp_pct: result.state.fiscal_state.budget_deficit_gdp_pct ?? currentState?.fiscal_state?.budget_deficit_gdp_pct ?? 4.3,
              consecutive_weeks_high_deficit: result.state.fiscal_state.consecutive_weeks_high_deficit ?? currentState?.fiscal_state?.consecutive_weeks_high_deficit ?? 0,
              interest_rate_pct: result.state.fiscal_state.interest_rate_pct ?? currentState?.fiscal_state?.interest_rate_pct ?? 5.25,
              long_term_growth_projection: result.state.fiscal_state.long_term_growth_projection ?? currentState?.fiscal_state?.long_term_growth_projection ?? 1.2,
              strategic_commitments: result.state.fiscal_state.strategic_commitments || currentState?.fiscal_state?.strategic_commitments || {
                nato_spending_gdp_pct: 2.5,
                gcap_6th_gen_fighter: 'Committed',
                national_ai_fund: 'Committed'
              }
            };
          }

          if (!result.state.labour_market) {
            result.state.labour_market = currentState?.labour_market || {
              unemployment_rate_pct: 5.1,
              youth_unemployment_rate_pct: 16.0
            };
          } else {
            result.state.labour_market = {
              unemployment_rate_pct: result.state.labour_market.unemployment_rate_pct ?? currentState?.labour_market?.unemployment_rate_pct ?? 5.1,
              youth_unemployment_rate_pct: result.state.labour_market.youth_unemployment_rate_pct ?? currentState?.labour_market?.youth_unemployment_rate_pct ?? 16.0
            };
          }

          const sanitizePollingNum = (val: any, fallback: number) => {
            const num = typeof val === 'number' ? val : parseInt(String(val), 10);
            if (isNaN(num) || num < 0 || num > 100) return fallback;
            return Math.round(num);
          };

          const rawPolling = result.state.polling_intent || currentState?.polling_intent || parsedDefaultPolling;
          const pLab = sanitizePollingNum(rawPolling.labour, parsedDefaultPolling.labour);
          const pCon = sanitizePollingNum(rawPolling.conservatives, parsedDefaultPolling.conservatives);
          const pLd = sanitizePollingNum(rawPolling.lib_dems, parsedDefaultPolling.lib_dems);
          const pGrn = sanitizePollingNum(rawPolling.greens, parsedDefaultPolling.greens);
          const pRef = sanitizePollingNum(rawPolling.reform, parsedDefaultPolling.reform);

          // Normalize so sum is strictly 100%
          const pSum = pLab + pCon + pLd + pGrn + pRef;
          if (pSum > 0) {
            const items = [
              { key: 'labour', raw: pLab, share: (pLab / pSum) * 100 },
              { key: 'conservatives', raw: pCon, share: (pCon / pSum) * 100 },
              { key: 'reform', raw: pRef, share: (pRef / pSum) * 100 },
              { key: 'lib_dems', raw: pLd, share: (pLd / pSum) * 100 },
              { key: 'greens', raw: pGrn, share: (pGrn / pSum) * 100 },
            ].map(item => ({
              key: item.key,
              floor: Math.floor(item.share),
              remainder: item.share - Math.floor(item.share)
            }));

            let curSum = items.reduce((acc, it) => acc + it.floor, 0);
            let needed = 100 - curSum;
            items.sort((a, b) => b.remainder - a.remainder);
            
            const normalizedMap: Record<string, number> = {};
            for (let i = 0; i < items.length; i++) {
              const add = i < needed ? 1 : 0;
              normalizedMap[items[i].key] = items[i].floor + add;
            }

            result.state.polling_intent = {
              labour: normalizedMap.labour ?? pLab,
              conservatives: normalizedMap.conservatives ?? pCon,
              reform: normalizedMap.reform ?? pRef,
              lib_dems: normalizedMap.lib_dems ?? pLd,
              greens: normalizedMap.greens ?? pGrn,
            };
          } else {
            result.state.polling_intent = parsedDefaultPolling;
          }

          if (!result.state.machinery_of_government) {
            result.state.machinery_of_government = currentState?.machinery_of_government || {
              chancellor: 'Pending',
              chancellor_relationship: 60,
              home_secretary: 'Pending',
              home_secretary_relationship: 60,
              foreign_secretary: 'Pending',
              foreign_secretary_relationship: 60,
              chief_of_staff_hub: 'Pending',
              chief_of_staff_relationship: 60,
              party_union_liaison: 'Pending',
              party_union_relationship: 60,
              starmer_status: 'Rival_Risk'
            };
          }

          // Enforce Political Scandal application if triggered
          if (isScandalTurn && targetMinister) {
            result.event_type = 'SCANDAL';
            const prevScore = targetMinister.currentScore;
            const newScore = Math.max(10, prevScore - scandalPenalty);
            
            if (!result.scandal_details) {
              result.scandal_details = {
                minister_role: targetMinister.role,
                minister_name: targetMinister.name,
                scandal_title: `${targetMinister.role} Embroiled in Front-Page Ethics Scandal`,
                description: scandalTypeHint || `Investigative reporters have uncovered serious ethics breaches and undeclared conflicts of interest.`,
                penalty: scandalPenalty,
                previous_relationship: prevScore,
                new_relationship: newScore
              };
            }
            
            // Ensure ministerial relationship is pushed down
            if (result.state.machinery_of_government) {
              (result.state.machinery_of_government as any)[targetMinister.relKey] = Math.min(
                (result.state.machinery_of_government as any)[targetMinister.relKey] ?? prevScore,
                newScore
              );
            }
          }

          if (!result.briefing) {
            result.briefing = "Prime Minister, here is your weekly intelligence and ministerial briefing.";
          }

          if (!result.dilemma) {
            result.dilemma = "A critical situation has arisen that requires your decision.";
          }

          if (!Array.isArray(result.choices) || result.choices.length === 0) {
            result.choices = [
              { id: '1', text: 'Pragmatic Compromise: Pursue a balanced approach to stabilize the situation.', hint: 'Standard action' },
              { id: '2', text: 'Bold Reform: Take decisive direct action to address the underlying issue.', hint: 'High-risk action' },
              { id: '3', text: 'Cabinet Delegation: Assign a trusted secretary of state to handle the issue.', hint: 'Cautious action' }
            ];
          }

          if (result.is_game_over === undefined) {
            result.is_game_over = false;
          }
          
          break;
        } catch (err: any) {
          retries--;
          const isAuthError = err?.status === 401 || (err?.message && err.message.includes('401'));
          if (isAuthError) {
            throw err;
          }
          const isUnavailable = err?.status === 'UNAVAILABLE' || err?.status === 503 || (err?.message && (err.message.includes('503') || err.message.includes('UNAVAILABLE') || err.message.includes('high demand')));
          const isParseError = err instanceof SyntaxError || (err?.message && err.message.includes("Invalid schema"));
          
          if (retries === 0 || (!isUnavailable && !isParseError)) {
            break;
          }
          const waitTime = isUnavailable ? 400 : 800;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      if (!result) {
        console.warn("AI generation failed; generating procedural fallback response");
        // Fallback procedural engine to ensure 100% reliability
        const prevWeek = currentState?.week || 1;
        const nextWeek = isElectionCalled ? prevWeek + 6 : (currentState?.game_phase === 'CABINET_SELECTION' ? 1 : prevWeek + 1);
        
        let fbEventType: 'NORMAL' | 'GLOBAL_CRISIS' | 'SCANDAL' = 'NORMAL';
        let fbScandalDetails: any = undefined;
        let fbDilemma = isElectionCalled 
          ? "The general election campaign has concluded and the ballot boxes have been verified by returning officers nationwide."
          : "A critical policy divergence has emerged between HM Treasury recommendations and your Parliamentary backbenchers regarding the upcoming legislative programme.";
        let fbBriefing = currentState 
          ? `Prime Minister, Cabinet has reviewed your recent executive decision: "${previousChoice || 'Standard executive review'}". Civil servants and departmental special advisers have implemented your directives across Whitehall.`
          : `Prime Minister, welcome to 10 Downing Street. Following your accession to office in July 2026, the Cabinet Secretary and Chief of Staff await your immediate executive appointments and initial policy direction.`;
        let fbChoices = [
          { id: '1', text: 'Pragmatic Compromise: Pursue a balanced fiscal and legislative approach to maintain broad coalition support.', hint: 'Stable consensus' },
          { id: '2', text: 'Decisive Reform: Fast-track key manifesto commitments despite resistance from departmental permanent secretaries.', hint: 'High-impact policy' },
          { id: '3', text: 'Cabinet Delegation: Commission an urgent departmental review while shoring up party discipline in the Commons.', hint: 'Cautious management' }
        ];
        let fbHeadlines = {
          bbc_news: `${pmName} sets strategic priorities amidst Whitehall budget negotiations`,
          guardian: `No. 10 faces crucial test on public service reform and regional investment`,
          times: `Prime Minister weighs cabinet consensus against market expectations`,
          daily_mail: `SHOW OF STRENGTH: ${pmName.toUpperCase()} TAKES CHARGE OF DOWNING STREET AGENDA`,
          sun: `HOT SEAT! PM under pressure as Commons showdown looms`
        };

        if (isScandalTurn && targetMinister) {
          fbEventType = 'SCANDAL';
          const prevScore = targetMinister.currentScore;
          const newScore = Math.max(10, prevScore - scandalPenalty);
          fbScandalDetails = {
            minister_role: targetMinister.role,
            minister_name: targetMinister.name,
            scandal_title: `${targetMinister.role} Ethics & Conflict of Interest Leaks`,
            description: scandalTypeHint || `Front-page investigative revelations have broken regarding undisclosed financial links and alleged breach of the Ministerial Code.`,
            penalty: scandalPenalty,
            previous_relationship: prevScore,
            new_relationship: newScore
          };
          fbBriefing = `EMERGENCY CABINET BRIEFING: Fleet Street has published damning revelations regarding ${targetMinister.name} (${targetMinister.role}). Opposition parties are demanding an urgent House of Commons statement and an immediate ministerial resignation.`;
          fbDilemma = `How does Prime Minister ${pmName} resolve the breaking political scandal engulfing ${targetMinister.name}?`;
          fbChoices = [
            { id: '1', text: `Unconditional Downing Street Backing: Back ${targetMinister.name} to the hilt, dismissing the allegations as a baseless partisan witch-hunt.`, hint: 'Shields Minister, risks public & media backlash' },
            { id: '2', text: `Enforce Ministerial Standards: Demand ${targetMinister.name}'s immediate resignation to demonstrate zero-tolerance integrity.`, hint: 'Quells media firestorm, alienates party faction' },
            { id: '3', text: `Independent Ethics Inquiry: Refer the dossier to the Independent Adviser on Ministers' Interests while retaining the minister in post.`, hint: 'Buys tactical time, risks perceived dithering' }
          ];
          fbHeadlines = {
            bbc_news: `Cabinet ethics questions intensify as pressure mounts on ${targetMinister.name}`,
            guardian: `No. 10 faces acute integrity test over ${targetMinister.role} conflict of interest claims`,
            times: `Prime Minister weighs sacking ${targetMinister.name} as backbenchers demand action`,
            daily_mail: `MINISTERIAL CODE IN TATTERS: WILL ${pmName.toUpperCase()} SACK ${targetMinister.name.toUpperCase()}?`,
            sun: `ON THE BRINK! ${targetMinister.name} fights for survival in Downing Street showdown`
          };
        }

        const baseMachinery = currentState?.machinery_of_government ? { ...currentState.machinery_of_government } : {
          chancellor: partyMinisters.chancellor,
          chancellor_relationship: 65,
          home_secretary: partyMinisters.home_secretary,
          home_secretary_relationship: 65,
          foreign_secretary: partyMinisters.foreign_secretary,
          foreign_secretary_relationship: 65,
          chief_of_staff_hub: partyMinisters.chief_of_staff_hub,
          chief_of_staff_relationship: 70,
          party_union_liaison: partyMinisters.party_union_liaison,
          party_union_relationship: 65,
          starmer_status: character === 'Burnham' ? 'Rival_Risk' : 'Opposed'
        };

        if (isScandalTurn && targetMinister) {
          (baseMachinery as any)[targetMinister.relKey] = Math.max(10, targetMinister.currentScore - scandalPenalty);
        }

        result = {
          event_type: fbEventType,
          scandal_details: fbScandalDetails,
          briefing: fbBriefing,
          dilemma: fbDilemma,
          choices: fbChoices,
          headlines: fbHeadlines,
          state: {
            pm_character: character,
            week: nextWeek,
            game_phase: currentState?.game_phase || (nextWeek === 1 ? 'CABINET_SELECTION' : 'NORMAL_PLAY'),
            consecutive_weeks_any_gauge_zero: currentState?.consecutive_weeks_any_gauge_zero || 0,
            consecutive_weeks_media_zero: currentState?.consecutive_weeks_media_zero || 0,
            gauges: {
              moral_compass: currentState?.gauges?.moral_compass ?? 85,
              parliamentary_support: Math.max(10, Math.min(100, (currentState?.gauges?.parliamentary_support ?? 60) + (isElectionCalled ? 20 : 0))),
              public_approval: Math.max(10, Math.min(100, (currentState?.gauges?.public_approval ?? 52) + (isElectionCalled ? 15 : 0))),
              economic_stability: currentState?.gauges?.economic_stability ?? 50,
              public_services_health: currentState?.gauges?.public_services_health ?? 45,
              media_favorability: currentState?.gauges?.media_favorability ?? 45,
              us_relations_trump: currentState?.gauges?.us_relations_trump ?? 50,
              eu_relations: currentState?.gauges?.eu_relations ?? 65,
              china_relations: currentState?.gauges?.china_relations ?? 40,
              russia_relations: currentState?.gauges?.russia_relations ?? 10,
              middle_east_relations: currentState?.gauges?.middle_east_relations ?? 30,
              housing_affordability: currentState?.gauges?.housing_affordability ?? 40,
              party_loyalty: currentState?.gauges?.party_loyalty ?? 90,
            },
            fiscal_state: currentState?.fiscal_state || {
              budget_deficit_gdp_pct: 4.1,
              consecutive_weeks_high_deficit: 0,
              interest_rate_pct: 5.0,
              long_term_growth_projection: 1.3
            },
            polling_intent: currentState?.polling_intent || parsedDefaultPolling,
            machinery_of_government: baseMachinery
          },
          is_game_over: false
        };

        if ([12, 24, 36, 48, 50].includes(nextWeek)) {
          const titles: Record<number, { title: string, badge: string }> = {
            12: { title: "First 100 Days Executive Audit", badge: "12-Week / 100-Day Mark" },
            24: { title: "Six-Month Strategic Benchmark", badge: "24-Week / Half-Year Mark" },
            36: { title: "Nine-Month Parliamentary & Reform Appraisal", badge: "36-Week / Three-Quarter Mark" },
            48: { title: "One-Year Premiership Legacy & State of the Nation", badge: "48-Week / Full-Year Horizon" },
            50: { title: "The 50-Week Golden Milestone of Governance", badge: "50-Week Milestone / Jubilee" }
          };
          const info = titles[nextWeek] || { title: `Week ${nextWeek} Milestone Review`, badge: `Week ${nextWeek}` };
          result.milestone_summary = {
            week: nextWeek,
            stageTitle: info.title,
            stageBadge: info.badge,
            subtitle: `Accomplishments and Executive Audit for ${pmName}`,
            cabinetSecretaryAppraisal: `The Cabinet Office notes solid administrative performance and steady departmental execution under Prime Minister ${pmName}.`,
            fleetStreetConsensus: `Fleet Street acknowledges sustained leadership momentum as the ${victoryParty} government marks ${nextWeek} weeks in office.`,
            mandateAssessment: character === 'Burnham' 
              ? "Operating with growing authority, building polling foundation towards calling a decisive General Election mandate."
              : `Executing the 5-year democratic mandate secured in the July 2026 General Election.`
          };
        }
      }

      if (result) {
        // Enforce state PM character identity
        if (result.state) {
          result.state.pm_character = character;
        }

        // Context-aware sanitization to prevent misattributed PM titles or self-opposition
        const fixMisattributedPmReferences = (text: string | undefined | null): string => {
          if (!text) return '';
          let cleaned = text;

          // 1. Fix instances where another politician is erroneously titled as Prime Minister or head of this cabinet
          const allOtherPoliticalFigures = [
            { full: 'Keir Starmer', short: 'Starmer' },
            { full: 'Rishi Sunak', short: 'Sunak' },
            { full: 'Boris Johnson', short: 'Johnson' },
            { full: 'Liz Truss', short: 'Truss' },
            { full: 'Kemi Badenoch', short: 'Badenoch' },
            { full: 'Nigel Farage', short: 'Farage' },
            { full: 'Sir Ed Davey', short: 'Davey' },
            { full: 'Ed Davey', short: 'Davey' },
            { full: 'Zack Polanski', short: 'Polanski' },
            { full: 'Andy Burnham', short: 'Burnham' }
          ].filter(f => !pmName.toLowerCase().includes(f.short.toLowerCase()));

          for (const other of allOtherPoliticalFigures) {
            cleaned = cleaned.replace(new RegExp(`\\bPrime Minister ${other.full}\\b`, 'gi'), `Prime Minister ${pmName}`);
            cleaned = cleaned.replace(new RegExp(`\\bPrime Minister ${other.short}\\b`, 'gi'), `Prime Minister ${pmName}`);
            cleaned = cleaned.replace(new RegExp(`\\bPM ${other.full}\\b`, 'gi'), `PM ${pmName}`);
            cleaned = cleaned.replace(new RegExp(`\\bPM ${other.short}\\b`, 'gi'), `PM ${pmName}`);
            cleaned = cleaned.replace(new RegExp(`\\b${other.short}'s government\\b`, 'gi'), `${pmName}'s government`);
            cleaned = cleaned.replace(new RegExp(`\\b${other.short}'s cabinet\\b`, 'gi'), `${pmName}'s cabinet`);
            cleaned = cleaned.replace(new RegExp(`\\b${other.short}'s administration\\b`, 'gi'), `${pmName}'s administration`);
            cleaned = cleaned.replace(new RegExp(`\\b${other.short}'s premiership\\b`, 'gi'), `${pmName}'s premiership`);
          }

          // 2. Fix self-opposition paradoxes (where sitting PM is described as attacking themselves or in opposition)
          const primaryOpponent = oppositionFigures[0].leader;
          const primaryOpponentParty = oppositionFigures[0].party;

          cleaned = cleaned.replace(new RegExp(`\\bOpposition Leader ${pmName}\\b`, 'gi'), `Opposition Leader ${primaryOpponent}`);
          cleaned = cleaned.replace(new RegExp(`\\bOpposition leader ${pmName}\\b`, 'gi'), `Opposition leader ${primaryOpponent}`);
          cleaned = cleaned.replace(new RegExp(`\\b${pmName} is preparing a fierce attack at PMQs\\b`, 'gi'), `${primaryOpponent} is preparing a fierce attack at PMQs`);
          cleaned = cleaned.replace(new RegExp(`\\b${pmName} prepares a fierce attack at PMQs\\b`, 'gi'), `${primaryOpponent} prepares a fierce attack at PMQs`);
          cleaned = cleaned.replace(new RegExp(`\\b${pmName} will challenge the Prime Minister\\b`, 'gi'), `${primaryOpponent} will challenge Prime Minister ${pmName}`);
          cleaned = cleaned.replace(new RegExp(`\\b${pmName} attacks the government\\b`, 'gi'), `${primaryOpponent} attacks the government`);
          cleaned = cleaned.replace(new RegExp(`\\b${pmName} attacked the government\\b`, 'gi'), `${primaryOpponent} attacked the government`);
          cleaned = cleaned.replace(new RegExp(`\\b${pmName} demanded an election\\b`, 'gi'), `${primaryOpponent} demanded an election`);
          cleaned = cleaned.replace(new RegExp(`\\b${pmName} demands an election\\b`, 'gi'), `${primaryOpponent} demands an election`);

          return cleaned;
        };

        if (result.briefing) result.briefing = fixMisattributedPmReferences(result.briefing);
        if (result.dilemma) result.dilemma = fixMisattributedPmReferences(result.dilemma);
        if (result.game_over_reason) result.game_over_reason = fixMisattributedPmReferences(result.game_over_reason);
        if (result.game_over_summary) result.game_over_summary = fixMisattributedPmReferences(result.game_over_summary);

        if (result.headlines) {
          if (result.headlines.bbc_news) result.headlines.bbc_news = fixMisattributedPmReferences(result.headlines.bbc_news);
          if (result.headlines.guardian) result.headlines.guardian = fixMisattributedPmReferences(result.headlines.guardian);
          if (result.headlines.times) result.headlines.times = fixMisattributedPmReferences(result.headlines.times);
          if (result.headlines.daily_mail) result.headlines.daily_mail = fixMisattributedPmReferences(result.headlines.daily_mail);
          if (result.headlines.sun) result.headlines.sun = fixMisattributedPmReferences(result.headlines.sun);
        }

        if (Array.isArray(result.pmqs)) {
          result.pmqs = result.pmqs.map((pmq: any, index: number) => {
            const isSelf = !pmq.leader || (
              pmq.leader.toLowerCase().includes(character.toLowerCase()) || 
              pmq.leader.toLowerCase().includes(pmName.toLowerCase()) ||
              (character === 'Davey' && (pmq.leader.toLowerCase().includes('davey') || pmq.leader.toLowerCase().includes('liberal'))) ||
              (character === 'Burnham' && pmq.leader.toLowerCase().includes('burnham'))
            );
            if (isSelf) {
              const fallbackOpp = oppositionFigures[index % oppositionFigures.length];
              return {
                leader: fallbackOpp.leader,
                party: fallbackOpp.party,
                quote: fixMisattributedPmReferences(pmq.quote)
              };
            }
            return {
              leader: pmq.leader,
              party: pmq.party,
              quote: fixMisattributedPmReferences(pmq.quote)
            };
          });
        }

        if (currentState && !isElectionCalled && result.state) {
          if (currentState.game_phase === 'CABINET_SELECTION' && result.state.game_phase === 'CABINET_SELECTION') {
            result.state.week = 1;
          } else {
            if (result.state.week > currentState.week + 1) {
              result.state.week = currentState.week + 1;
            } else if (result.state.week < currentState.week) {
              result.state.week = currentState.week;
            }
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.json(result);
      } else {
        res.status(500).json({ error: "Game Engine received empty response from AI model" });
      }
    } catch (error: any) {
      console.error("Error generating turn:", error);
      res.setHeader('Content-Type', 'application/json');
      if (error?.status === 401 || (error?.message && error.message.includes('401'))) {
        res.status(401).json({ error: "Gemini API Key is missing, disabled, or invalid." });
      } else {
        res.status(500).json({ error: error?.message || "Simulation server error. Please retry." });
      }
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
