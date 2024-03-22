import { Button } from '@/components/ui/button';
import { ExternalLink } from '@/components/external-link';
import { IconArrowRight } from '@/components/ui/icons';
import DemoPage from '../app/table/RenderedTable';
import { Payment, columns } from "../app/table/columns";
import { DataTable } from "../app/table/data-table";
import React, { useEffect, useState } from 'react';

const exampleMessages = [
  {
    heading: "Software engineers for mixpanel",
    message: `At MixRank, we create B2B SaaS products that enable sales, marketing, finance, and business intelligence teams to accelerate their business with data and insights into their customers. One that provides the most comprehensive database of mobile apps and websites, technographics, companies, and decision makers. It's a platform created with the sole purpose of providing the fastest way for sales reps to build prospect lists, prioritize leads, and contact decision-makers.

    We're looking for remote engineers to build web applications and APIs. The ideal candidate is looking to grow into position of technical leadership in product development.
    
    Experience with full-stack web development, Python, PostgreSQL, and Linux is required. Competency or interest in data visualization, UI, UX, and design are desired.
    
    Why Join MixRank? Fully-remote, no HQ office. Team of 32 people across 15+ countries Invested in by Y Combinator, 500 Startups, Mark Cuban. Profitable and growing 50% every year.
    
    Please include your updated resume when applying for this role.
    
    About MixRank
    MixRank processes petabytes of data every month from web crawls, Google Play Store, Apple App Store, social media, and dozens of other sources. We have hundreds of customers using our data products including Google, Amazon, Facebook, Intel, and Adobe, across industries Sales, Marketing, Finance, and Security.
    
    Team is ~31 full-time as of 2022, full-remote. We're growing, profitable, employee-owned, no dependence on outside funding.
  `
  },
  {
    heading: "Find Sales professional at Clipboard health",
    message: `About the Role: Clipboard Health doesn't grow without getting the product into the hands of customers. The Account Executive - Inside Sales makes that happen - you drive the growth of the business by introducing our product to new workplaces. This job doesn't stop at prospecting - you'll be responsible for the entire process including negotiating contract terms, closing, and onboarding.

    If you're a strong communicator with endless energy and have a knack for getting things done, Clipboard Health is the place for you to grow and develop your skills. You'll drive growth for the business while sharpening your own skills.
    
    Responsibilities:
    
    Run a full-cycle sales process, prospecting leads, booking and owning discovery calls, running product demos, negotiating terms, and signing contracts.
    Clearly articulate the value proposition of our products to clinical and non-clinical stakeholders.
    Establish credibility and trust with providers and healthcare executives by demonstrating strong business acumen and understanding of clinical workflows.
    Test sales motions, pitches, value props, provide feedback on what tactics are most effective and develop and recommend sales strategies.
    Capture feedback from prospects on their needs, wants, and pains, and share that feedback with product teams to develop our offering.
    Beyond the basics, what will make you successful:
    
    Extreme Ownership: the buck stops with you, no matter what anyone else did or did not do. You're self-reliant, and can get things done in the chaos that is an early-stage startup scaling quickly.
    Extreme Curiosity: you ask "why" 3-5 times in a row for the same problem, digging and digging and not being satisfied until you truly understand the root cause.
    Scrappiness: you look for ways through problems and refuse to let obstacles derail your progress. You bring solutions instead of asking ‘what should I do?’.
    Fast Paced: You thrive on moving quickly and are highly adaptable to a market that evolves quickly.
    Qualifications:
    
    Based in North America
    Sales experience not required but strongly preferred
    Bachelor's Degree
    Familiarity with sales methodologies
    Willingness to try / lack of fear
    About Clipboard Health
    At Clipboard Health (YC W17) we work with healthcare facilities such as hospitals, assisted living facilities, and rehab centers to provide on-demand nursing staff. We are a fully remote team that is humble and hardworking. We think this is the best way to improve a ton of lives. Nurses will have better schedules and shorter commutes, and patients will receive better care.`,
  },
];


async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      name: "pending",
      link: "m@example.com",
    },
    {
      id: "728ed52f",
      name: "pending",
      link: "m@example.com",
    },
    {
      id: "728ed52f",
      name: "pending",
      link: "m@example.com",
    },
    {
      id: "728ed52f",
      name: "pending",
      link: "m@example.com",
    },

  ]
}


export function EmptyScreen({submitMessage,}: {submitMessage: (message: string) => void;}) {

  // Use useState to manage your data state
  const [data, setData] = useState<Payment[]>([]);

  // Use useEffect to handle the async operation
  useEffect(() => {
    const fetchData = async () => {
      const result = await getData(); // Call your async function
      setData(result); // Update your state with the fetched data
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs once on mount
  

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8 mb-4">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to Goark.ai Headhunter
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          Enter a job description and find the best people for the job.
        </p>
        <p className="mb-2 text-mb font-semibold">Try a search</p>
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={async () => {
                submitMessage(message.message);
              }}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
