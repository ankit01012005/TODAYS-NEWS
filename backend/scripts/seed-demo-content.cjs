// Realistic demo content — many sections, many published stories, real
// (Picsum-sourced) photography instead of a flat placeholder — so the
// site actually looks and feels like a working newsroom rather than one
// lonely gray box. Dev-only: fictional bylines, fictional sources,
// generic non-current-events subject matter, never for production.
// Safe to re-run: skips anything that already exists by slug/email.
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/today_news?schema=public";

const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const STAFF_PASSWORD = "DemoPass123!";

const STAFF = [
  { email: "amara.osei@today-news.local", displayName: "Amara Osei", role: "EDITOR" },
  { email: "daniel.cho@today-news.local", displayName: "Daniel Cho", role: "EDITOR" },
  { email: "priya.nair@today-news.local", displayName: "Priya Nair", role: "EDITOR" },
  { email: "marcus.webb@today-news.local", displayName: "Marcus Webb", role: "ADMIN" },
];

const CATEGORIES = [
  { name: "World", slug: "world" },
  { name: "Politics", slug: "politics" },
  { name: "Business", slug: "business" },
  { name: "Technology", slug: "technology" },
  { name: "Sports", slug: "sports" },
  { name: "Culture", slug: "culture" },
  { name: "Science", slug: "science" },
];

function p(text) {
  return { type: "paragraph", content: [{ text }] };
}
function h(text) {
  return { type: "heading", level: 2, content: [{ text }] };
}
function q(text, attribution) {
  return { type: "quote", content: [{ text }], attribution };
}

// slug, headline, summary, staffIndex, daysAgo(+hours), picsum id, credit, body paragraphs, optional quote
const ARTICLES = {
  world: [
    {
      slug: "coastal-cities-accelerate-flood-defense-projects",
      headline: "Coastal Cities Accelerate Flood Defense Projects as Sea Levels Rise",
      summary: "Engineers are racing to finish tidal barriers and elevated roadways before the next storm season.",
      staff: 0,
      hoursAgo: 3,
      photo: 10,
      credit: "Reuters",
      paras: [
        "Construction crews in a dozen coastal cities are working through the night to complete flood barriers, pumping stations and elevated roadways before the start of the next storm season, according to municipal officials briefed on the projects.",
        "The push follows a string of tidal flooding events over the past two years that left low-lying neighborhoods underwater for days at a time, disrupting transit and forcing hundreds of families into temporary housing.",
        "Planners say the new defenses are designed to hold back roughly a meter of additional storm surge, though several engineers cautioned that the projects are a stopgap rather than a permanent solution.",
      ],
      quote: q(
        "We are buying ourselves a decade, maybe two. That is not nothing, but it is not the end of the conversation either.",
        "Dr. Elena Restrepo, coastal engineer",
      ),
    },
    {
      slug: "trade-ministers-meet-to-revive-tariff-negotiations",
      headline: "Trade Ministers Meet to Revive Stalled Tariff Negotiations",
      summary: "A two-day summit aims to break a months-long deadlock over agricultural import quotas.",
      staff: 2,
      hoursAgo: 27,
      photo: 20,
      credit: "Associated Press",
      paras: [
        "Trade ministers from more than twenty countries gathered this week to restart negotiations that stalled last spring over disagreements on agricultural import quotas and digital services taxes.",
        "Officials described the mood as cautiously constructive, with several delegations signaling openness to a phased tariff reduction schedule rather than the single sweeping agreement originally proposed.",
        "A final communiqué is expected by the end of the week, though negotiators involved in earlier rounds warned that the hardest issues have historically been left for the last day.",
      ],
    },
    {
      slug: "refugee-resettlement-numbers-reach-decade-high",
      headline: "Refugee Resettlement Numbers Reach Decade High, UN Agency Reports",
      summary: "New figures show resettlement programs processed more applications than any year since records began.",
      staff: 0,
      hoursAgo: 50,
      photo: 30,
      credit: "UNHCR",
      paras: [
        "Resettlement programs processed more refugee applications over the past year than in any twelve-month period since the agency began keeping consistent records, according to a report released Tuesday.",
        "The increase reflects both expanded processing capacity in receiving countries and a rise in referrals from field offices dealing with protracted displacement crises.",
        "Advocacy groups welcomed the figures but noted that the total still represents a small fraction of the global population currently displaced from their homes.",
      ],
    },
    {
      slug: "drought-region-sees-first-rainfall-in-three-years",
      headline: "Drought-Hit Region Sees First Substantial Rainfall in Three Years",
      summary: "Reservoir levels ticked upward for the first time since the dry spell began, offering cautious relief to farmers.",
      staff: 1,
      hoursAgo: 70,
      photo: 40,
      credit: "Getty Images",
      paras: [
        "A week of steady rainfall has lifted reservoir levels in a region that has endured its driest stretch in three years, offering the first real relief to farmers who have spent recent seasons rationing irrigation water.",
        "Local water authorities cautioned that a single wet week does not end the drought, and asked residents to keep conservation measures in place through the rest of the season.",
        "Agricultural economists said the rain arrived just in time for late-season planting, though the full effect on this year's harvest will not be clear for several months.",
      ],
    },
  ],
  politics: [
    {
      slug: "lawmakers-advance-bipartisan-infrastructure-package",
      headline: "Lawmakers Advance Bipartisan Infrastructure Funding Package",
      summary: "The bill cleared committee with support from both sides after months of closed-door negotiation.",
      staff: 2,
      hoursAgo: 6,
      photo: 48,
      credit: "Staff photo",
      paras: [
        "A infrastructure funding package cleared its committee vote Wednesday with support from lawmakers on both sides of the aisle, capping months of closed-door negotiation over how to divide funds between road repair and public transit expansion.",
        "The compromise version trims the original transit allocation but adds a new fund for rural broadband, a provision that proved decisive in winning over several holdout lawmakers.",
        "Leadership from both parties said they expect a floor vote within the next two weeks, though the bill's fate in the upper chamber remains less certain.",
      ],
    },
    {
      slug: "election-commission-proposes-campaign-finance-rules",
      headline: "Election Commission Proposes New Rules for Campaign Finance Disclosure",
      summary: "The draft rules would require faster reporting of large donations ahead of primary contests.",
      staff: 0,
      hoursAgo: 32,
      photo: 60,
      credit: "Staff photo",
      paras: [
        "The election commission unveiled draft rules Monday that would require campaigns to disclose donations above a set threshold within 48 hours, down from the current ten-day window.",
        "Supporters say the change would give voters more timely information before primary contests; several campaign finance attorneys have warned that the compressed reporting window could burden smaller campaigns without dedicated compliance staff.",
        "A public comment period is open for thirty days before the commission votes on a final version.",
      ],
    },
    {
      slug: "city-council-approves-zoning-overhaul",
      headline: "City Council Approves Contentious Zoning Overhaul After Marathon Session",
      summary: "The vote paves the way for higher-density housing near transit corridors after a nine-hour hearing.",
      staff: 2,
      hoursAgo: 55,
      photo: 65,
      credit: "Staff photo",
      paras: [
        "After a nine-hour hearing that stretched past midnight, the city council voted 6-3 to approve a zoning overhaul allowing higher-density housing within a half-mile of major transit corridors.",
        "Supporters called the change overdue, pointing to years of housing shortages that have pushed rents beyond the reach of many longtime residents.",
        "Opponents, including several neighborhood associations, argued the process moved too quickly and said they plan to push for amendments before the rules take effect next year.",
      ],
      quote: q(
        "This is not the end of the conversation about how our neighborhoods grow. It is the start of the next one.",
        "Council member Teresa Alvarado",
      ),
    },
    {
      slug: "governor-signs-order-on-public-sector-pay",
      headline: "Governor Signs Executive Order on Public Sector Pay Reform",
      summary: "The order directs agencies to review pay scales for the first time in over a decade.",
      staff: 3,
      hoursAgo: 80,
      photo: 70,
      credit: "Staff photo",
      paras: [
        "The governor signed an executive order Thursday directing state agencies to complete a full review of public sector pay scales, the first such review in more than a decade.",
        "The order does not itself change any salaries, but requires agencies to submit findings within six months, setting up a likely legislative fight over funding any resulting recommendations.",
        "Public employee unions welcomed the move, while budget officials cautioned that any changes would need to be weighed against other spending priorities.",
      ],
    },
  ],
  business: [
    {
      slug: "central-bank-holds-interest-rates-steady",
      headline: "Central Bank Holds Interest Rates Steady, Signals Caution Ahead",
      summary: "Policymakers left the benchmark rate unchanged for a third consecutive meeting.",
      staff: 1,
      hoursAgo: 4,
      photo: 75,
      credit: "Bloomberg",
      paras: [
        "The central bank left its benchmark interest rate unchanged Wednesday for a third consecutive meeting, matching market expectations while signaling that further moves will depend heavily on upcoming inflation data.",
        "In their statement, policymakers described the current stance as \"appropriately cautious,\" a phrase analysts read as a sign that officials are in no hurry to cut rates despite slowing growth.",
        "Markets reacted mildly to the decision, with major indices closing roughly flat on the day.",
      ],
    },
    {
      slug: "retail-chain-announces-expansion-forty-markets",
      headline: "Retail Chain Announces Expansion Into Forty New Markets",
      summary: "The company plans to open its first stores in several mid-sized cities by next year.",
      staff: 1,
      hoursAgo: 29,
      photo: 90,
      credit: "Company handout",
      paras: [
        "A national retail chain announced plans Tuesday to open stores in forty new markets over the next eighteen months, its most aggressive expansion since the company went public.",
        "Executives said the push targets mid-sized cities that have been underserved by the chain's existing footprint, betting on lower real estate costs and less saturated competition.",
        "The announcement sent shares up modestly in after-hours trading, though some analysts questioned whether the company's supply chain can keep pace with the rollout.",
      ],
    },
    {
      slug: "startup-battery-breakthrough-draws-investment",
      headline: "Startup's Battery Breakthrough Draws Fresh Round of Investment",
      summary: "The company says its new cell chemistry could cut charging times by half.",
      staff: 2,
      hoursAgo: 58,
      photo: 96,
      credit: "Company handout",
      paras: [
        "A battery technology startup announced a new funding round Thursday after unveiling a cell chemistry it says can cut electric vehicle charging times roughly in half without sacrificing range.",
        "Independent battery researchers who reviewed the company's published test data described the results as promising but said commercial-scale manufacturing would be the real test of the technology.",
        "The company plans to use the new funding to build a pilot production line, with a target of shipping sample cells to automotive partners by the end of next year.",
      ],
    },
    {
      slug: "manufacturing-output-rebounds-after-decline",
      headline: "Manufacturing Output Rebounds After Two Quarters of Decline",
      summary: "New data shows factory activity picking up, led by machinery and electronics production.",
      staff: 1,
      hoursAgo: 83,
      photo: 110,
      credit: "Staff photo",
      paras: [
        "Manufacturing output rose for the first time in two quarters, according to figures released Friday, with gains concentrated in machinery and electronics production.",
        "Economists had expected a more modest rebound, and several noted that the increase could reflect businesses rebuilding inventories rather than a durable pickup in demand.",
        "Factory managers surveyed for the report described order books as improving but still below levels seen before the slowdown began.",
      ],
    },
  ],
  technology: [
    {
      slug: "chipmaker-unveils-next-generation-ai-processor",
      headline: "Chipmaker Unveils Next-Generation Processor Aimed at AI Workloads",
      summary: "The company says the new chip delivers roughly triple the performance per watt of its predecessor.",
      staff: 2,
      hoursAgo: 2,
      photo: 120,
      credit: "Company handout",
      paras: [
        "A major chipmaker unveiled its next-generation processor Monday, claiming roughly triple the performance per watt of its predecessor on common machine-learning workloads.",
        "The announcement comes as demand for specialized AI hardware continues to outstrip supply, with cloud providers reportedly placing orders well ahead of the chip's expected shipping date next year.",
        "Independent benchmarks are not yet available, and some analysts cautioned that manufacturer-supplied performance figures should be treated as a ceiling rather than a typical result.",
      ],
    },
    {
      slug: "regulators-open-inquiry-app-store-payments",
      headline: "Regulators Open Inquiry Into App Store Payment Practices",
      summary: "The investigation will examine whether required payment systems unfairly limit competition.",
      staff: 0,
      hoursAgo: 26,
      photo: 130,
      credit: "Staff photo",
      paras: [
        "Regulators announced an inquiry Tuesday into whether major app store operators unfairly require developers to use in-house payment systems, a practice that has drawn complaints from smaller software makers for years.",
        "The companies involved have defended the requirement as necessary for security and consistent billing, and said they would cooperate fully with the review.",
        "The inquiry is expected to take several months and could result in enforcement action or new rules, depending on its findings.",
      ],
    },
    {
      slug: "open-source-project-hits-million-contributors",
      headline: "Open-Source Project Hits One Million Contributors Milestone",
      summary: "The widely used software library marked the anniversary with a call for more maintainers.",
      staff: 2,
      hoursAgo: 47,
      photo: 140,
      credit: "Project maintainers",
      paras: [
        "A widely used open-source software library crossed one million cumulative contributors this week, a milestone its maintainers marked with equal parts celebration and a renewed call for volunteer maintainers.",
        "The project, which underpins tools used across the software industry, has struggled in recent years to keep pace with a growing backlog of bug reports relative to its small core maintenance team.",
        "Organizers said several companies that rely heavily on the library have pledged additional engineering time in response to the milestone.",
      ],
      quote: q(
        "A million contributors sounds like success, and it is. It is also a reminder that most of the actual maintenance still falls on a handful of people.",
        "Jordan Faulkner, lead maintainer",
      ),
    },
    {
      slug: "satellite-internet-expands-remote-communities",
      headline: "Satellite Internet Provider Expands Coverage to Remote Communities",
      summary: "The company says the expansion will bring broadband access to hundreds of previously unserved towns.",
      staff: 1,
      hoursAgo: 76,
      photo: 150,
      credit: "Company handout",
      paras: [
        "A satellite internet provider announced Thursday that it has expanded coverage to hundreds of remote communities that previously had no broadband access, relying on a newly completed constellation of low-orbit satellites.",
        "Local officials in several of the newly connected towns said the service has already changed daily life, enabling remote schooling and telehealth appointments that were impractical over older connections.",
        "The company said it plans to reach several hundred additional communities by the end of next year, pending regulatory approval in some regions.",
      ],
    },
  ],
  sports: [
    {
      slug: "underdog-club-stuns-league-leaders-comeback",
      headline: "Underdog Club Stuns League Leaders in Late Comeback Win",
      summary: "Two goals in the final ten minutes overturned a deficit that had held for most of the match.",
      staff: 0,
      hoursAgo: 5,
      photo: 160,
      credit: "Staff photo",
      paras: [
        "A club sitting in the bottom half of the table pulled off one of the season's biggest upsets Saturday, scoring twice in the final ten minutes to overturn a deficit that had held for nearly the entire match.",
        "The result ends the league leaders' unbeaten run and tightens the title race with a third of the season remaining.",
        "\"We never stopped believing, even at eighty minutes,\" the winning manager said after the match, praising his bench for the late substitutions that turned the game.",
      ],
    },
    {
      slug: "marathon-record-falls-second-time-three-years",
      headline: "Marathon Record Falls for the Second Time in Three Years",
      summary: "Ideal weather conditions and a deep field combined for a historic time on a fast course.",
      staff: 2,
      hoursAgo: 31,
      photo: 170,
      credit: "Getty Images",
      paras: [
        "A new marathon world best time was set Sunday, the second time the record has fallen in three years, aided by ideal weather conditions and a deep field of pacers on a notoriously fast course.",
        "Race organizers credited course improvements made two years ago, along with advances in shoe technology that have shaved minutes off elite times across the sport.",
        "The result immediately sparked debate among commentators over how much of the gain reflects athlete performance versus equipment.",
      ],
    },
    {
      slug: "city-breaks-ground-new-stadium-championship-bid",
      headline: "City Breaks Ground on New Stadium Ahead of Championship Bid",
      summary: "Officials say the venue is central to the city's bid to host a major tournament in five years.",
      staff: 1,
      hoursAgo: 60,
      photo: 180,
      credit: "Staff photo",
      paras: [
        "City officials broke ground Tuesday on a new stadium that organizers say is central to the region's bid to host a major tournament five years from now.",
        "The project, funded through a mix of public bonds and private investment, has drawn criticism from some residents over the use of public money, while supporters point to projected tourism revenue and long-term use by local clubs.",
        "Construction is scheduled to finish eighteen months ahead of the earliest possible tournament date, giving organizers a buffer for the inevitable delays large projects tend to face.",
      ],
    },
    {
      slug: "veteran-coach-announces-retirement-two-decades",
      headline: "Veteran Coach Announces Retirement After Two Decades on the Sideline",
      summary: "The announcement caps a career that included three championship runs with the same club.",
      staff: 0,
      hoursAgo: 90,
      photo: 190,
      credit: "Staff photo",
      paras: [
        "One of the sport's longest-serving coaches announced his retirement Friday, capping a two-decade career with the same club that included three championship runs.",
        "Players past and present shared tributes throughout the day, several crediting him with shaping not just their careers but the culture of the organization itself.",
        "The club said it would begin its search for a successor immediately, with an interim staff member expected to lead the team through the remainder of the season.",
      ],
    },
  ],
  culture: [
    {
      slug: "restored-silent-film-screens-first-time-century",
      headline: "Restored Silent Film Screens Publicly for First Time in a Century",
      summary: "Archivists spent three years reconstructing the film from fragments held in two countries.",
      staff: 2,
      hoursAgo: 8,
      photo: 200,
      credit: "Film archive",
      paras: [
        "A silent film long thought partially lost screened publicly this weekend for the first time in a century, the result of a three-year restoration effort that pieced the movie together from fragments held in archives on two continents.",
        "Archivists said roughly ninety percent of the original runtime has now been recovered, with the missing scenes reconstructed from surviving still photographs and a shooting script found in a private collection.",
        "The screening drew a sold-out crowd, including several film historians who called the restoration one of the most significant of the decade.",
      ],
    },
    {
      slug: "independent-bookstores-report-strongest-sales-decade",
      headline: "Independent Bookstores Report Strongest Sales in a Decade",
      summary: "Owners credit a wave of community events and a renewed appetite for physical books.",
      staff: 0,
      hoursAgo: 34,
      photo: 210,
      credit: "Staff photo",
      paras: [
        "Independent bookstores reported their strongest sales figures in a decade this year, according to an industry survey released this week, reversing years of gradual decline.",
        "Owners credited a combination of factors: a renewed appetite for physical books among younger readers, and a wave of community events, from author talks to book clubs, that have turned stores into gathering spaces.",
        "Several store owners said the trend has allowed them to expand staff for the first time in years, though rising commercial rents remain a persistent worry.",
      ],
    },
    {
      slug: "mural-festival-transforms-industrial-district",
      headline: "City's Mural Festival Transforms Industrial District Into Open-Air Gallery",
      summary: "Forty artists painted building facades across six blocks over the course of a week.",
      staff: 2,
      hoursAgo: 62,
      photo: 220,
      credit: "Staff photo",
      paras: [
        "Forty artists spent the past week painting building facades across six blocks of a former industrial district, transforming the area into an open-air gallery as part of the city's annual mural festival.",
        "Organizers said this year's festival drew its largest crowds yet, with a walking tour map downloaded more than twenty thousand times in the first three days alone.",
        "Local business owners in the district reported a noticeable uptick in foot traffic, and several said they plan to lobby the city to make the festival an annual fixture rather than a one-off event.",
      ],
    },
    {
      slug: "orchestra-debuts-commissioned-work-retiring-conductor",
      headline: "Orchestra Debuts Commissioned Work Honoring Retiring Conductor",
      summary: "The piece was written specifically for the conductor's final season after eighteen years with the orchestra.",
      staff: 1,
      hoursAgo: 88,
      photo: 230,
      credit: "Staff photo",
      paras: [
        "The city orchestra premiered a newly commissioned symphonic work Saturday evening, written specifically to mark its longtime conductor's final season after eighteen years on the podium.",
        "The composer, who studied under the conductor early in her career, said she drew on themes from the orchestra's most memorable performances over the past two decades.",
        "The performance received a lengthy standing ovation, and the orchestra confirmed the piece will be recorded for release later this year.",
      ],
    },
  ],
  science: [
    {
      slug: "researchers-map-deep-sea-coral-reef-untouched",
      headline: "Researchers Map Deep-Sea Coral Reef Untouched by Bleaching",
      summary: "The reef, discovered during a routine survey, appears to have been shielded by unusually cold currents.",
      staff: 0,
      hoursAgo: 9,
      photo: 240,
      credit: "Marine research institute",
      paras: [
        "Marine researchers have mapped a previously undocumented deep-sea coral reef that appears to have escaped the bleaching events that have devastated shallower reefs in the region over the past decade.",
        "The team believes unusually cold currents at the reef's depth, more than sixty meters below the surface, have shielded it from the warming waters responsible for widespread coral die-offs elsewhere.",
        "Researchers are now working to understand whether the reef could serve as a source of heat-resistant coral for restoration projects in more vulnerable areas.",
      ],
    },
    {
      slug: "telescope-data-suggests-earlier-galaxy-formation",
      headline: "New Telescope Data Suggests Earlier Galaxy Formation Than Predicted",
      summary: "Observations show fully formed galaxies far earlier in the universe's history than current models expect.",
      staff: 2,
      hoursAgo: 36,
      photo: 250,
      credit: "Space agency",
      paras: [
        "New observations released this week show evidence of fully formed galaxies far earlier in the universe's history than current models predict, adding to a growing body of data that is prompting astronomers to revisit assumptions about early galaxy formation.",
        "The findings do not overturn the broader model of the universe's origins, researchers stressed, but do suggest that galaxies assembled faster than previously thought possible.",
        "Follow-up observations are planned to confirm the distances involved, a measurement that is notoriously difficult at these extreme ranges.",
      ],
      quote: q(
        "Every time we look further back, something surprises us. That is usually a sign the models need updating, not the universe.",
        "Dr. Hana Fujimori, astrophysicist",
      ),
    },
    {
      slug: "clinical-trial-early-alzheimers-detection-test",
      headline: "Clinical Trial Shows Promise for Early Alzheimer's Detection Test",
      summary: "The blood-based test identified early markers years before symptoms typically appear.",
      staff: 0,
      hoursAgo: 64,
      photo: 260,
      credit: "Medical research center",
      paras: [
        "A blood-based test designed to detect early markers of Alzheimer's disease showed promising results in a clinical trial published this week, identifying signs of the disease years before symptoms typically appear.",
        "Researchers cautioned that the test is not yet ready for widespread clinical use and will need to be validated in larger, more diverse patient populations before regulators would consider approval.",
        "Patient advocacy groups welcomed the findings, noting that earlier detection could open a wider window for interventions that are most effective before significant cognitive decline occurs.",
      ],
    },
    {
      slug: "conservationists-report-rebound-bird-populations",
      headline: "Conservationists Report Rebound in Regional Bird Populations",
      summary: "A decade-long wetland restoration project appears to be paying off, according to annual survey data.",
      staff: 1,
      hoursAgo: 92,
      photo: 270,
      credit: "Wildlife conservation trust",
      paras: [
        "Annual survey data released this week shows a marked rebound in regional bird populations, a trend conservationists attribute to a decade-long wetland restoration project that has slowly reversed decades of habitat loss.",
        "Several species that had all but disappeared from the area over the past thirty years have returned in measurable numbers, according to the survey, which relies on both professional researchers and volunteer birdwatchers.",
        "Project organizers said the results validate the slow, expensive work of wetland restoration, even as they cautioned that populations remain far below historic levels.",
      ],
    },
  ],
};

async function ensureStaff() {
  const created = [];
  for (const person of STAFF) {
    let user = await prisma.user.findUnique({ where: { email: person.email } });
    if (!user) {
      const passwordHash = await argon2.hash(STAFF_PASSWORD);
      user = await prisma.user.create({
        data: { email: person.email, displayName: person.displayName, role: person.role, passwordHash },
      });
    }
    created.push(user);
  }
  return created;
}

async function ensureCategories() {
  const byslug = {};
  for (const c of CATEGORIES) {
    let category = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (!category) {
      category = await prisma.category.create({ data: { name: c.name, slug: c.slug } });
    }
    byslug[c.slug] = category;
  }
  return byslug;
}

async function ensureMedia(seed, uploadedByUserId) {
  const storageKey = `demo/picsum-${seed}.jpg`;
  const existing = await prisma.mediaAsset.findFirst({ where: { storageKey } });
  if (existing) return existing;

  // The seed-based endpoint (vs. /id/N/...) doesn't depend on a specific
  // numeric id existing in Picsum's catalog — found the hard way when
  // id 150 turned out to have been removed mid-run.
  const res = await fetch(`https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800.jpg`);
  if (!res.ok) throw new Error(`Failed to fetch photo for seed "${seed}": ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  await fs.mkdir(path.join(UPLOADS_DIR, "demo"), { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, storageKey), buffer);

  return prisma.mediaAsset.create({
    data: {
      storageKey,
      originalFilename: `picsum-${seed}.jpg`,
      mimeType: "image/jpeg",
      sizeBytes: buffer.length,
      width: 1200,
      height: 800,
      uploadedByUserId,
    },
  });
}

async function main() {
  const staff = await ensureStaff();
  const categories = await ensureCategories();
  const editors = staff.filter((s) => s.role === "EDITOR");

  let createdCount = 0;
  let skippedCount = 0;

  for (const [categorySlug, articles] of Object.entries(ARTICLES)) {
    const category = categories[categorySlug];
    for (const spec of articles) {
      const existing = await prisma.article.findUnique({ where: { slug: spec.slug } });
      if (existing) {
        skippedCount += 1;
        continue;
      }

      const owner = editors[spec.staff % editors.length];
      const media = await ensureMedia(spec.slug, owner.id);

      const publishedAt = new Date(Date.now() - spec.hoursAgo * 60 * 60 * 1000);
      const body = [p(spec.paras[0]), spec.quote ?? null, ...spec.paras.slice(1).map(p)].filter(Boolean);
      const bodyPlain = spec.paras.join(" ");

      // The LIVE-status-matches-pointer check constraint means the article
      // can't be created already LIVE — the revision it would point to
      // doesn't exist yet. Create plain, then flip both together once the
      // revision exists (same order prisma/seed.ts uses).
      const article = await prisma.article.create({
        data: {
          slug: spec.slug,
          ownerId: owner.id,
          categoryId: category.id,
        },
      });

      const revision = await prisma.articleRevision.create({
        data: {
          articleId: article.id,
          state: "PUBLISHED",
          createdByUserId: owner.id,
          headline: spec.headline,
          summary: spec.summary,
          body,
          bodyPlain,
          featuredImageId: media.id,
          featuredImageAlt: spec.headline,
          featuredImageCredit: spec.credit,
          submittedAt: publishedAt,
          publishedAt,
          publishedByUserId: staff.find((s) => s.role === "ADMIN").id,
        },
      });

      await prisma.article.update({
        where: { id: article.id },
        data: {
          publicationStatus: "LIVE",
          firstPublishedAt: publishedAt,
          publishedAt,
          currentPublishedRevisionId: revision.id,
        },
      });

      createdCount += 1;
      process.stdout.write(".");
    }
  }

  console.log("");
  console.log(`Demo content seeded: ${createdCount} new articles, ${skippedCount} already present.`);
  console.log(`Staff sign-in password for all demo accounts: ${STAFF_PASSWORD}`);
  console.log(`Editors: ${editors.map((e) => e.email).join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
