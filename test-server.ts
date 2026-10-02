import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3005;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
        }
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
    }
  };

  const turnResponseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      state: gameStateSchema,
      briefing: { type: Type.STRING },
      dilemma: { type: Type.STRING },
      event_type: { type: Type.STRING, enum: ['NORMAL', 'GLOBAL_CRISIS', 'SCANDAL'], nullable: true },
      choices: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            hint: { type: Type.STRING },
            is_chief_of_staff_preferred: { type: Type.BOOLEAN, nullable: true }
          }
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
      annual_summary: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          year: { type: Type.INTEGER },
          achievements: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  };

  app.post('/api/turn', async (req, res) => {
    try {
      const { currentState, previousChoice, isElectionCalled, pmCharacter, turnHistory } = req.body;
      const character = pmCharacter || currentState?.pm_character || 'Burnham';

      let pmName = "Andy Burnham";
      let pmContext = "The player plays as Andy Burnham, who has just become Prime Minister of the United Kingdom in July 2026 after an internal party coup.";
      let winCondition = "Labour is not the largest party";
      let victoryParty = "Labour";
      let defaultPolling = "{ labour: 34, conservatives: 24, lib_dems: 12, greens: 8, reform: 18 }";

      if (character === 'Badenoch') {
        pmName = "Kemi Badenoch";
        pmContext = "The player plays as Kemi Badenoch, who has just become Prime Minister of the United Kingdom in July 2026 after winning a stunning General Election victory. Scenarios should reflect her anti-woke, low-tax, state-rollback philosophies, and the establishment's resistance to her.";
        winCondition = "the Conservatives are not the largest party";
        victoryParty = "the Conservatives";
        defaultPolling = "{ conservatives: 36, labour: 28, lib_dems: 10, greens: 6, reform: 16 }";
      } else if (character === 'Farage') {
        pmName = "Nigel Farage";
        pmContext = "The player plays as Nigel Farage, who has just become Prime Minister of the United Kingdom in July 2026 after an electoral earthquake. Scenarios should reflect his hardline immigration freeze, dismantling of the establishment, and 'Brexit Max' policies. Civil service and media resistance will be massive.";
        winCondition = "Reform UK is not the largest party";
        victoryParty = "Reform UK";
        defaultPolling = "{ reform: 35, labour: 25, conservatives: 22, lib_dems: 8, greens: 6 }";
      } else if (character === 'Davey') {
        pmName = "Ed Davey";
        pmContext = "The player plays as Ed Davey, who has just become Prime Minister of the United Kingdom in July 2026 after a shock Lib Dem surge. Scenarios should reflect his centrist, pro-European, community-focused politics and the challenge of managing a fragile coalition.";
        winCondition = "the Liberal Democrats are not the largest party";
        victoryParty = "the Liberal Democrats";
        defaultPolling = "{ lib_dems: 32, labour: 28, conservatives: 22, greens: 8, reform: 10 }";
      } else if (character === 'Polanski') {
        pmName = "Zack Polanski";
        pmContext = "The player plays as Zack Polanski, who has just become Prime Minister of the United Kingdom in July 2026 after a green wave election. Scenarios should reflect radical climate action, wealth taxes, proportional representation, and fierce resistance from corporate media and vested interests.";
        winCondition = "the Green Party is not the largest party";
        victoryParty = "the Green Party";
        defaultPolling = "{ greens: 34, labour: 30, conservatives: 18, lib_dems: 12, reform: 6 }";
      }

      const systemInstruction = `You are the Core Game Engine for a high-stakes, text-based political strategy game. ${pmContext}

CORE LOGIC & RESOURCE METERS
You must internally maintain, track, and update the JSON state after every single player decision. You MUST strictly adhere to the provided state schema.

THE CHRONIC & ACUTE FAILURE ENGINE (LOSE CONDITIONS)
- Rule 1 (The Warning): If any single gauge in "gauges" EXCEPT media_favorability, us_relations_trump, eu_relations, china_relations, russia_relations, and middle_east_relations hits 0%, increase 'consecutive_weeks_any_gauge_zero' by 1. If this hits 4 (i.e. one month with a gauge at 0%), trigger an immediate tailored "Game Over". (Set is_game_over to true, provide a game_over_reason detailing the fall of the government). If all gauges recover above 0%, reset 'consecutive_weeks_any_gauge_zero' to 0.
- Rule 2 (The Collapse): If THREE OR MORE gauges hit 0% simultaneously, trigger an immediate "Game Over" regardless of how long they have been there.
- Rule 3 (The Hostile Press): If media_favorability hits 0%, increase 'consecutive_weeks_media_zero' by 1. If this hits 12 (roughly 3 months), do NOT end the game, but apply severe compounding penalties to public_approval and parliamentary_support every week thereafter. However, if public_approval > 60%, halve the negative impact of a hostile press. Provide regular opportunities (events/dilemmas) to curry favor with the press.
- Rule 4 (Foreign Relations Crises): If a foreign relations gauge hits 0%, do NOT trigger Game Over. Instead, put the government under pressure. US and EU relationships are the most important: if they hit 0%, apply a severe -3% penalty to public_approval and economic_stability every week. Russia, China, and Middle East are important but carry less weight: if they hit 0%, apply a smaller -1% penalty to public_approval and ensure frequent extreme diplomatic dilemma events are generated.
Apply these economic and political rules strictly when calculating the new state based on the choice:
- Rule 5 (The Boiling Frog): If budget_deficit_gdp_pct > 3.5% (the OBR target), increase consecutive_weeks_high_deficit by 1. Every 4 consecutive weeks, apply a compounding penalty of -3% to economic_stability, -3% to media_favorability, and -1% to parliamentary_support.
- Rule 6 (The Heart Attack): If budget_deficit_gdp_pct exceeds 8.0%, trigger a catastrophic "Market Crash / Sovereign Debt Crisis" emergency turn.
- Rule 7 (Labour Market Decay): If unemployment_rate_pct > 5.5%, add +0.2% to budget_deficit_gdp_pct and -2% to public_approval every turn. Target unemployment is 4.0%.
- Rule 8 (Infrastructure Payback): When making infrastructure investments or structural reforms, increase long_term_growth_projection to reflect the long-term benefits, even if short-term deficit increases. Let this projection soften media and economic penalties if it exceeds 2.0%.
- Rule 9 (Crises of Confidence): If any gauge in "gauges" drops below 10%, the media and parliamentary pressure intensifies dramatically.
- Rule 10 (Interest Rates & Housing): High interest rates (> 5.0%) decrease housing_affordability severely. 
- Rule 11 (Cabinet Resignations): In "machinery_of_government", each minister has a relationship score (0-100). If a minister's relationship score drops to 0, they immediately RESIGN. The very next turn MUST be a "Cabinet Reshuffle" event.
- Rule 12 (Political Scandals): If media_favorability drops below 30%, occasionally trigger a random 'Political Scandal' event. Set 'event_type' to 'SCANDAL'. This dilemma MUST force the player to choose between demanding the immediate resignation of a specific named cabinet member (dropping their relationship to 0) OR taking a massive, immediate hit to public_approval to defend them.
- Rule 13 (Manifesto Checklist & Party Loyalty): Update the 'party_loyalty' gauge based on how well the player's policy decisions align with their chosen party's core ideology. Low party_loyalty (< 40%) severely drains parliamentary_support over time.

GAMEPLAY FLOW
- PHASE 1: CABINET SELECTION & INITIAL AGENDA (Week 1). Do not serve random events yet. Present the player with sequential, distinct choice screens within the first week (the week counter should remain 1):
  - Turn 1 (Week 1): Appoint Chancellor. Provide 3 highly realistic options from ${victoryParty} with different ideological leanings. Provide a summary of their likely impact.
  - Turn 2 (Week 1): Appoint Home Secretary.
  - Turn 3 (Week 1): Appoint Foreign Secretary.
  - Turn 4 (Week 1): Appoint Chief of Staff/Hub. 
  - Turn 5 (Week 1): Appoint Union/Party Liaison.
  - Turn 6 (Week 1): Global Summit - Meet with the US, the EU, and China to set out the agenda for the ongoing relationship. Provide a 3-choice menu focusing on prioritizing one of these key geopolitical relationships over the others.
  Apply the structural modifiers to the JSON state immediately based on their choices. Set 'event_type' to 'NORMAL'.
- PHASE 2: GOVERNING (Week 2 onwards). Deliver one weekly turn at a time. Each turn must offer a nuanced dilemma with exactly three distinct choices (A, B, C). Each choice's 'text' field MUST be formatted precisely as "Title: Description" so the UI can correctly render the title in bold and the description in regular text. Increment the week counter by 1 for each turn. You may occasionally set 'is_chief_of_staff_preferred' to true for a choice that the Chief of Staff supports. Set 'event_type' to 'NORMAL' by default.
  - Multi-Week Arcs: Allow some dramas and crises to play out over 2 to 3 weeks to give a sense of realism. For example, a diplomatic row might escalate and then de-escalate over 3 weeks based on decisions, rather than resolving instantly.
  - Global Crisis Probability Check: Every week from Week 2 onwards, there is a 10% chance of a major "Global Crisis" occurring. If it occurs, set 'event_type' to 'GLOBAL_CRISIS'. A Global Crisis forces the player to make immediate, high-stakes decisions regarding international war, massive financial meltdowns, or global pandemics.
  - Random Policy Weeks ("Quiet Week"): Roughly once every 6-8 weeks, generate a "Quiet Week". Set "allow_custom_policy": true.

SCENARIO GENERATOR GUIDELINES (Week 2+)
When generating weekly events, weave together a highly varied mix of topics to prevent repetition.
- Calendar Awareness: Track the time of year based on the 'week' counter. The game starts in July 2026 (Week 1). Week 26 is roughly January, Week 52 is July again. Do NOT generate winter crises in summer or summer crises in winter. Ensure events make chronological sense.
- Macro-Fiscal Realities & Infrastructure: OBR headroom, high tax-to-gdp ratio, Spending Review, interest rates (Bank of England decisions). Frequently force the player to re-evaluate major infrastructure or spending commitments (e.g. HS2 revival, nuclear plants, defence spending).
- Economic Growth & Proactive Policies: Frequently provide scenarios and choices where the player can invest, deregulate, build infrastructure, or reform to actively grow the economy and improve public services. The game MUST NOT just be about firefighting crises; players need proactive opportunities to thrive and grow the economy.
- Foreign Policy & Diplomacy: Generate frequent foreign visits, state banquets, and trade deal negotiations. For example, negotiating a post-Brexit EU alignment, handling a hostile US administration trade tariff, or navigating a Middle Eastern summit. Make foreign policy a key active pillar of their premiership. You MUST actively include events regarding Russia (e.g. the war in Ukraine, Russian ships in the Channel, cyber attacks).
- Stakeholder Personalities: When dealing with foreign stakeholders, you MUST take into account their actual real-world personalities, rhetoric, and likely responses to the chosen course of action by the player (e.g., the US President's transactionalism and unpredictability, or for the EU: Emmanuel Macron's focus on European strategic autonomy, Friedrich Merz's economic conservatism, and Giorgia Meloni's right-wing populism).
- Housing & Affordability: Rents, mortgages, housing supply, and their impact on the 'housing_affordability' gauge. (Ensure this doesn't repeat too frequently).
- Geopolitical Strain & Global Disasters: Global resource shocks, sudden pandemics, extreme weather events.
- Domestic Security & Scandals: Random political scandals. STRICT BAN: Do NOT generate eco-terrorism or climate protest scenarios (they are overused). Focus on other domestic issues instead.
- Automation & Sickness: Stagflation, AI automation white-collar job losses, rising health benefits.
- By-Elections: Randomly (but infrequently) trigger by-election events where a seat becomes vacant (e.g., due to scandal, resignation, or death). The player must decide how to campaign, and the outcome should affect parliamentary_support and public_approval.

ANNUAL & END-GAME SUMMARIES
- End-Game Summary: If is_game_over is true (whether the player lost or called a snap election and won), populate the 'game_over_summary' with a three-sentence summary of their premiership. Also populate the 'game_over_achievements' array with 4-5 bullet points summarizing their key policy legacy, defining moments, and the ultimate fate of their government.
- Annual Celebration: If state.week is a multiple of 52 (e.g. Week 52, Week 104), populate the 'annual_summary' object. Provide the 'year' (e.g. 1 for Week 52) and an 'achievements' array summarizing their defining decisions and successes over the past 12 months. This should be a celebratory milestone.

PMQS (PRIME MINISTER'S QUESTIONS)
Every month (i.e. every 4 weeks), include a 'pmqs' array summarizing Prime Minister's Questions. Provide 1 to 3 quotes from opposition leaders reacting to the current situation or the previous decision. CRITICAL: Do NOT include quotes from \${pmName} in the 'pmqs' array. They are the Prime Minister and are answering the questions, not asking them. You can use leaders like Kemi Badenoch (Conservatives), Nigel Farage (Reform UK), Ed Davey (Lib Dems), Zack Polanski (Green Party), Andy Burnham (Labour) - EXCEPT for \${pmName}.

NEWSPAPER HEADLINES
For every turn (except Month 1 where it can be omitted if you prefer, but preferably include them to show the reaction to the PM's arrival), you MUST generate newspaper headlines reflecting the current situation and the player's previous choice. Capture their distinct editorial styles:
- BBC News: Neutral, balanced, authoritative, public-service broadcasting tone. (This is the main headline).
- The Guardian: Earnest, left-leaning, focuses on social justice, environment, public services.
- The Times: Center-right, establishment, authoritative, focuses on the economy, stability, and geopolitical strategy.
- The Daily Mail: Right-wing, populist, outraged, focuses on migration, taxes, culture wars, and perceived government incompetence.
- The Sun: Tabloid, sensationalist, pun-heavy, focuses on scandals, working-class impact, and patriotic fervor.

TONE & WRITING STYLE
Tone Adjustment: Do NOT make the game exclusively negative or feel like a constant doomsday scenario. You MUST include positive 'winning' choices and occasional positive events where the player can secure real political or economic victories, celebrate economic growth, diplomatic triumphs, or successful policy implementations. Mix these in so the player feels rewarded for good strategy.
Direct, pragmatic, and politically astute. Avoid AI giveaway phrases like "dive into", "unleash", or "game-changing". You MUST use UK English spelling strictly throughout (e.g., 'favour', 'defence', 'programme', 'minimise', 'chancellor'). DO NOT use markdown for bolding or italics in the schema strings, just use raw clear text, EXCEPT where you can use basic markdown in the 'briefing', 'dilemma', and 'game_over_reason' fields for readability.
CRITICAL CABINET REQUIREMENT: All machinery of government choices (Chancellor, Home Secretary, Foreign Secretary, etc.) MUST be named, real-world British politicians who are actively serving in 2026. Do NOT use generic names or invented personas.
CRITICAL PARTY AFFILIATIONS (2026 TIMELINE): 
- Suella Braverman has defected to the Reform Party. She MUST NOT be used for the Conservative Party (Badenoch). She is available for Reform UK (Farage).
- Lee Anderson, Richard Tice, and Zia Yusuf are in Reform UK.
- James Cleverly, Priti Patel, and Robert Jenrick are in the Conservative Party.
- Rachel Reeves, Yvette Cooper, David Lammy, and Angela Rayner are in the Labour Party (Burnham).
- Ensure that the cabinet members offered strictly match the Prime Minister's party.
`;

      let historyContext = "";
      if (Array.isArray(turnHistory) && turnHistory.length > 0) {
        historyContext = `\nRecent History (Last ${Math.min(10, turnHistory.length)} Turns):\n` + turnHistory.slice(-10).map((h: any, i: number) => `Turn ${i+1}:\nBriefing: ${h.briefing}\nPlayer Choice: ${h.choice}`).join('\n\n');
        historyContext += `\n\nCRITICAL INSTRUCTION: Analyze the recent history above. You MUST absolutely NOT repeat any similar scenario, event theme, or dilemma that has already occurred. Do not repeat the same countries (e.g., if Russia was in a recent dilemma, do not use them again), the same industries (e.g., mine takeovers), or the same types of scandals. Introduce completely new themes, domestic issues, and fresh geopolitical scenarios. Ensure multi-week arcs progress logically without getting stuck in a loop.`;
      }

      let prompt = "";
      if (!currentState || currentState.week === undefined || currentState.week === 0) {
        prompt = `Begin the game. Provide the Week 1 (Turn 1) briefing for Appointing the Chancellor.
        Initialize the state with these exact values: pm_character: '${character}', week: 1, game_phase: 'CABINET_SELECTION', consecutive_weeks_any_gauge_zero: 0, consecutive_weeks_media_zero: 0, public_approval: 52, parliamentary_support: 60, economic_stability: 50, public_services_health: 40, media_favorability: 45, us_relations_trump: 50, eu_relations: 65, china_relations: 40, russia_relations: 10, middle_east_relations: 30, housing_affordability: 40, moral_compass: 100, party_loyalty: 100, budget_deficit_gdp_pct: 4.3, consecutive_weeks_high_deficit: 0, interest_rate_pct: 5.25, unemployment_rate_pct: 5.1, youth_unemployment_rate_pct: 16.0, long_term_growth_projection: 1.2, polling_intent: ${defaultPolling}. Set machinery values to 'Pending' (for strings) and all relationships to 60. Set starmer_status to 'Rival_Risk'. Do not provide hints in the options.`;
      } else if (isElectionCalled) {
        prompt = `The player has called a snap General Election. 
        Evaluate the election outcome strictly based on their current polling numbers: ${JSON.stringify(currentState.polling_intent)}.
        If they lose (${winCondition}, or lacks a working majority/coalition), set is_game_over to true. Generate the final election results in the game_over_reason (why they lost), and populate game_over_summary and game_over_achievements.
        If they win (${victoryParty} secures a majority), set is_game_over to false. Provide the election victory results in the 'briefing', praising their fresh mandate. Generate a standard 'dilemma' and 3 'options' for their first post-election challenge. 
        CRITICALLY: If they win, you MUST increase their parliamentary_support to 90, public_approval to 75, reset consecutive_weeks_any_gauge_zero to 0. Increment week by 6 (representing the campaign period).
        Previous State: ${JSON.stringify(currentState)}
        ${historyContext}
        `;
      } else {
        prompt = `The player chose: "${previousChoice}".
        Process this choice, update the current state. If the player proposed a custom policy, analyze its feasibility and potential impact before generating the outcome. If in Phase 1 (Appointments), keep week at 1. If moving to Phase 2 or already in Phase 2, increment the week by 1. Generate the next week's briefing and dilemma. Do not provide hints in the options.
        Previous State: ${JSON.stringify(currentState)}
        ${historyContext}
        `;
      }

      let result;
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: turnResponseSchema,
              temperature: 0.7
            }
          });
          
          if (!response || !response.text) {
            throw new Error("Empty response from Gemini");
          }

          let text = response.text;
          text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '');
          result = JSON.parse(text);
          
          if (!result || !result.state || !result.state.gauges) {
            throw new Error("Invalid schema: missing state or gauges");
          }
          
          break;
        } catch (err: any) {
          retries--;
          const isUnavailable = err?.status === 'UNAVAILABLE' || err?.status === 503 || (err?.message && err.message.includes('503'));
          const isParseError = err instanceof SyntaxError || (err?.message && err.message.includes("Invalid schema"));
          
          if (retries === 0 || (!isUnavailable && !isParseError)) {
            throw err;
          }
          console.log("Error generating or parsing, retrying...", err.message);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (result) {
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
        res.json(result);
      } else {
        res.status(500).json({ error: "Empty response from Gemini" });
      }
    } catch (error) {
      console.error("Error generating turn:", error);
      res.status(500).json({ error: "Internal Server Error" });
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

startServer();
