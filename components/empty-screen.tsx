import { Button } from '@/components/ui/button';
import { ExternalLink } from '@/components/external-link';
import { IconArrowRight } from '@/components/ui/icons';
import DemoPage from '../app/table/RenderedTable';
import { Payment, columns } from "../app/table/columns";
import { DataTable } from "../app/table/data-table";
import React, { useEffect, useState } from 'react';

const exampleMessages = [
  {
    heading: "Software engineers with nodejs experience and bachelors degree",
    message: `Software engineers with nodejs experience with atleast a bachelors degree`
  },
  {
    heading: "Find Sales professionals in India",
    message: `Find Sales professionals in India`,
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
